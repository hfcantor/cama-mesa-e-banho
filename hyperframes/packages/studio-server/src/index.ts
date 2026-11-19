/**
 * @hfr/studio-server — HTTP API + static hosting for the Studio.
 *
 * Security model
 *  - binds to 127.0.0.1 by default; on any other interface a token is required
 *    (HFR_STUDIO_TOKEN or generated) via `Authorization: Bearer`, `x-hfr-token`
 *    or the `hfr_token` cookie (set by visiting /?token=…);
 *  - state-changing requests must come from the Studio's own origin (Origin check);
 *  - all paths are resolved inside the project directory (safeJoin), hidden files are refused;
 *  - uploads: extension allow-list, per-type size limits, content sniffing, sanitised names;
 *  - text file edits limited to known text types and 2 MB.
 */
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile, open } from 'node:fs/promises';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import {
  editClipAttributes, loadProject, MANIFEST_FILE, parseComposition, resolveTimings, safeJoin, TimingError, RESOLUTION_PRESETS,
} from '@hfr/core';
import { createCompositionHandler, type Handler } from '@hfr/engine';
import { formatInspectReport, inspectProject } from '@hfr/inspector';
import { lintProject } from '@hfr/lint';
import { UPLOAD_LIMITS, assetType, contentMatchesExtension, listAssets, mimeType, probe, sanitizeFileName, which, FFMPEG } from '@hfr/media';
import { serializeCaptions, wordsToCues } from '@hfr/parsers';
import { bundlePlayer } from '@hfr/player';
import { addItemToComposition, instantiateTemplate, loadRegistry } from '@hfr/registry';
import { createShareBundle } from '@hfr/share';
import { buildStudio } from '@hfr/studio';
import { synthesize, transcribe, transcriptionProviders, TTS_PROVIDERS, type TtsProviderName } from '@hfr/voice';
import { JobQueue, type RenderJob } from './jobs.ts';

export interface StudioOptions { workspace: string; port?: number; host?: string; token?: string; renderConcurrency?: number }

class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

const ID_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const TEXT_EXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.md', '.txt', '.srt', '.vtt', '.svg']);
const MAX_TEXT = 2 * 1024 * 1024;
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1']);

const slugify = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'project';

function send(res: ServerResponse, status: number, data: unknown, headers: Record<string, string> = {}) {
  const body = typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data);
  res.writeHead(status, {
    'content-type': typeof data === 'string' && !headers['content-type'] ? 'text/plain; charset=utf-8' : headers['content-type'] ?? 'application/json; charset=utf-8',
    'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers,
  });
  res.end(body);
}

async function readJson<T>(req: IncomingMessage, limit = 1024 * 1024): Promise<T> {
  if (!(req.headers['content-type'] ?? '').includes('application/json')) throw new ApiError(415, 'expected application/json');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new ApiError(413, 'request body too large');
    chunks.push(chunk as Buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as T; } catch { throw new ApiError(400, 'invalid JSON'); }
}

export async function startStudioServer(o: StudioOptions): Promise<{ url: string; workspace: string; token: string | null; close: () => Promise<void> }> {
  const workspace = path.resolve(o.workspace);
  await mkdir(workspace, { recursive: true });
  const host = o.host ?? '127.0.0.1';
  const token = o.token ?? process.env.HFR_STUDIO_TOKEN ?? (LOOPBACK.has(host) ? null : randomBytes(18).toString('base64url'));
  const jobs = new JobQueue(o.renderConcurrency ?? 1);
  const previewHandlers = new Map<string, Handler>();
  let studioBundle: Promise<{ html: string; js: string; css: string }> | null = null;

  const projectDir = async (id: string) => {
    if (!ID_RE.test(id)) throw new ApiError(400, 'invalid project id');
    const dir = path.join(workspace, id);
    const st = await stat(dir).catch(() => null);
    if (!st?.isDirectory()) throw new ApiError(404, `project ${id} not found`);
    return dir;
  };
  const relPath = (dir: string, p: string | null) => {
    if (!p) throw new ApiError(400, 'missing path');
    if (p.split(/[\\/]/).some((seg) => seg.startsWith('.'))) throw new ApiError(403, 'hidden paths are not allowed');
    try { return safeJoin(dir, p); } catch (e) { throw new ApiError(403, (e as Error).message); }
  };

  const projectSummary = async (id: string) => {
    const dir = path.join(workspace, id);
    try {
      const p = await loadProject(dir);
      const st = await stat(path.join(dir, p.hasManifest ? MANIFEST_FILE : p.scenes[0]!.relative));
      const c = p.scenes[0]!.composition.config;
      return { id, name: p.manifest.name, scenes: p.scenes.map((s) => s.relative), width: c.width, height: c.height, fps: c.fps, duration: c.duration, modified: st.mtime.toISOString() };
    } catch (e) {
      return { id, name: id, error: (e as Error).message };
    }
  };

  const authorized = (req: IncomingMessage, url: URL): boolean => {
    if (!token) return true;
    const given = req.headers['x-hfr-token'] ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null)
      ?? /(?:^|;\s*)hfr_token=([^;]+)/.exec(req.headers.cookie ?? '')?.[1] ?? url.searchParams.get('token');
    if (typeof given !== 'string') return false;
    const a = Buffer.from(given), b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
  };

  const api = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
    const parts = url.pathname.split('/').filter(Boolean).slice(1); // drop "api"
    const method = req.method ?? 'GET';
    const q = url.searchParams;
    const [a, b, c, d] = parts;

    if (a === 'health') return send(res, 200, { ok: true });
    if (a === 'system' && method === 'GET') {
      const tts = Object.fromEntries(await Promise.all(Object.entries(TTS_PROVIDERS).map(async ([k, p]) => [k, await p.available()])));
      return send(res, 200, { ffmpeg: !!(await which(FFMPEG)), tts, transcription: await transcriptionProviders(), resolutions: RESOLUTION_PRESETS, workspace });
    }
    if (a === 'templates' && method === 'GET') return send(res, 200, (await loadRegistry()).filter((i) => i.type === 'template').map(({ source: _s, ...i }) => i));
    if (a === 'registry' && method === 'GET') return send(res, 200, (await loadRegistry()).filter((i) => i.type !== 'template').map(({ source: _s, ...i }) => i));

    if (a === 'renders') {
      if (!b && method === 'GET') return send(res, 200, jobs.list());
      const job = jobs.get(b ?? '');
      if (!job) throw new ApiError(404, 'job not found');
      if (!c && method === 'GET') return send(res, 200, job);
      if (c === 'cancel' && method === 'POST') return send(res, 200, { cancelled: jobs.cancel(job.id) });
      if (c === 'events' && method === 'GET') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        const push = (j: RenderJob) => { if (j.id === job.id) res.write(`event: update\ndata: ${JSON.stringify(j)}\n\n`); };
        push(job);
        jobs.on('update', push);
        const ping = setInterval(() => res.write(': ping\n\n'), 15000);
        req.on('close', () => { jobs.off('update', push); clearInterval(ping); });
        return;
      }
    }

    if (a !== 'projects') throw new ApiError(404, 'unknown endpoint');
    if (!b) {
      if (method === 'GET') {
        const ids = (await readdir(workspace, { withFileTypes: true })).filter((e) => e.isDirectory() && ID_RE.test(e.name)).map((e) => e.name);
        return send(res, 200, await Promise.all(ids.map(projectSummary)));
      }
      if (method === 'POST') {
        const body = await readJson<{ name?: string; template?: string }>(req);
        const name = (body.name ?? '').trim();
        if (!name) throw new ApiError(400, 'name is required');
        let id = slugify(name);
        for (let i = 2; await stat(path.join(workspace, id)).then(() => true, () => false); i++) id = `${slugify(name)}-${i}`;
        const tpl = (await loadRegistry()).find((i) => i.type === 'template' && i.name === (body.template ?? 'blank'));
        if (!tpl) throw new ApiError(400, `unknown template ${body.template}`);
        await instantiateTemplate(tpl, path.join(workspace, id), { title: name });
        return send(res, 201, await projectSummary(id));
      }
    }
    const dir = await projectDir(b!);

    if (!c) {
      if (method === 'GET') {
        const p = await loadProject(dir);
        return send(res, 200, { ...(await projectSummary(b!)), manifest: p.manifest, files: await listAssets(dir) });
      }
      if (method === 'DELETE') {
        const trash = path.join(workspace, '.trash');
        await mkdir(trash, { recursive: true });
        await rename(dir, path.join(trash, `${b}-${Date.now()}`));
        return send(res, 200, { deleted: b });
      }
    }

    if (c === 'files') {
      const file = relPath(dir, q.get('path'));
      const ext = path.extname(file).toLowerCase();
      if (!TEXT_EXT.has(ext)) throw new ApiError(415, `only text files can be edited (${[...TEXT_EXT].join(' ')})`);
      if (method === 'GET') {
        const st = await stat(file).catch(() => null);
        if (!st) throw new ApiError(404, 'file not found');
        if (st.size > MAX_TEXT) throw new ApiError(413, 'file too large to edit');
        return send(res, 200, { path: q.get('path'), content: await readFile(file, 'utf8'), modified: st.mtime.toISOString() });
      }
      if (method === 'PUT') {
        const body = await readJson<{ content: string }>(req, MAX_TEXT + 1024);
        if (typeof body.content !== 'string') throw new ApiError(400, 'content must be a string');
        if (ext === '.json') { try { JSON.parse(body.content); } catch (e) { throw new ApiError(400, `invalid JSON: ${(e as Error).message}`); } }
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, body.content);
        return send(res, 200, { saved: q.get('path') });
      }
    }

    if (c === 'timeline' && method === 'GET') {
      const p = await loadProject(dir);
      const scene = p.scenes[Number(q.get('scene') ?? 0)];
      if (!scene) throw new ApiError(404, 'scene not found');
      const info = scene.composition;
      const media = new Map<string, number | null>();
      for (const cl of info.clips) {
        if ((cl.kind === 'audio' || cl.kind === 'video') && cl.src && !cl.duration && !cl.end) {
          try { media.set(cl.id, (await probe(path.resolve(path.dirname(scene.file), cl.src))).duration); } catch { media.set(cl.id, null); }
        }
      }
      let timings: ReturnType<typeof resolveTimings> = [];
      let error: string | null = null;
      try {
        timings = resolveTimings(info.clips.map((cl) => ({ id: cl.id, start: cl.start, duration: cl.duration, end: cl.end, track: cl.track, mediaStart: cl.mediaStart, mediaDuration: media.get(cl.id) ?? null })), { fps: info.config.fps, compositionDuration: info.config.duration });
      } catch (e) { error = e instanceof TimingError ? e.message : String(e); }
      return send(res, 200, {
        scene: scene.relative, scenes: p.scenes.map((s) => s.relative), config: info.config, error,
        clips: info.clips.map((cl) => {
          const t = timings.find((x) => x.id === cl.id);
          return { id: cl.id, autoId: cl.autoId, name: cl.name, kind: cl.kind, tag: cl.tag, src: cl.src, raw: { start: cl.start, duration: cl.duration, end: cl.end, track: cl.track }, enter: cl.enter, exit: cl.exit, start: t?.start ?? null, end: t?.end ?? null, duration: t?.duration ?? null, track: t?.track ?? 0, line: cl.location?.line ?? null };
        }),
      });
    }

    if (c === 'clips' && method === 'PATCH') {
      const body = await readJson<{ file: string; clipId: string; changes: Record<string, string | null> }>(req);
      const allowed = /^(data-(start|duration|end|track|enter|exit|name|kenburns|volume|media-start|fade-in|fade-out|keyframes)|id)$/;
      for (const k of Object.keys(body.changes ?? {})) if (!allowed.test(k)) throw new ApiError(400, `attribute ${k} cannot be edited here`);
      const file = relPath(dir, body.file);
      const html = await readFile(file, 'utf8');
      let updated: string;
      try { updated = editClipAttributes(html, body.clipId, body.changes); } catch (e) { throw new ApiError(400, (e as Error).message); }
      const check = parseComposition(updated, file);
      await writeFile(file, updated);
      return send(res, 200, { saved: body.file, clips: check.clips.length });
    }

    if (c === 'media') {
      if (!d && method === 'GET') return send(res, 200, await listAssets(dir));
      if (d === 'probe' && method === 'GET') return send(res, 200, await probe(relPath(dir, q.get('path'))));
      if (!d && method === 'DELETE') {
        const file = relPath(dir, q.get('path'));
        if (path.basename(file) === MANIFEST_FILE) throw new ApiError(400, 'cannot delete the manifest');
        await rm(file);
        return send(res, 200, { deleted: q.get('path') });
      }
      if (!d && method === 'POST') {
        const original = q.get('name') ?? '';
        let name: string;
        try { name = sanitizeFileName(original); } catch (e) { throw new ApiError(400, (e as Error).message); }
        const type = assetType(name);
        if (!type || type === 'html' || type === 'script') throw new ApiError(415, `file type not allowed: ${path.extname(name) || name}`);
        const limit = UPLOAD_LIMITS[type];
        const declared = Number(req.headers['content-length'] ?? 0);
        if (declared > limit) throw new ApiError(413, `file too large (max ${Math.round(limit / 1024 / 1024)} MB for ${type})`);
        const folder = (q.get('folder') ?? 'assets').replace(/^\/+|\/+$/g, '');
        const dest = relPath(dir, `${folder}/${name}`);
        await mkdir(path.dirname(dest), { recursive: true });
        const tmp = `${dest}.uploading-${randomBytes(4).toString('hex')}`;
        let size = 0;
        const limiter = new Transform({
          transform(chunk: Buffer, _enc, cb) { size += chunk.length; if (size > limit) cb(new ApiError(413, 'file too large')); else cb(null, chunk); },
        });
        try {
          await pipeline(req, limiter, createWriteStream(tmp, { flags: 'wx' }));
          const fh = await open(tmp, 'r');
          const head = Buffer.alloc(16);
          await fh.read(head, 0, 16, 0);
          await fh.close();
          if (!contentMatchesExtension(name, head)) throw new ApiError(415, `content does not match the ${path.extname(name)} extension`);
          await rename(tmp, dest);
        } catch (e) {
          await rm(tmp, { force: true });
          throw e;
        }
        const rel = path.relative(dir, dest).split(path.sep).join('/');
        const info = ['image', 'video', 'audio'].includes(type) ? await probe(dest).catch(() => null) : null;
        return send(res, 201, { path: rel, type, size, info });
      }
    }

    if (c === 'lint' && method === 'POST') return send(res, 200, await lintProject(dir));
    if (c === 'inspect' && method === 'POST') {
      const body = await readJson<{ samples?: number }>(req);
      const r = await inspectProject(dir, { samples: Math.min(24, Math.max(2, body.samples ?? 6)) });
      return send(res, 200, { ...r, text: formatInspectReport(r), scenes: r.scenes.map((s) => ({ ...s, description: s.description ? { ...s.description } : null })) });
    }

    if (c === 'renders' && method === 'POST') {
      const body = await readJson<{ format?: 'mp4' | 'webm' | 'mov' | 'gif'; quality?: 'draft' | 'standard' | 'high'; resolution?: string; fps?: number; workers?: number; scale?: number; name?: string }>(req);
      const format = body.format ?? 'mp4';
      if (!['mp4', 'webm', 'mov', 'gif'].includes(format)) throw new ApiError(400, 'invalid format');
      const res2 = body.resolution ? RESOLUTION_PRESETS[body.resolution] : undefined;
      if (body.resolution && !res2) throw new ApiError(400, 'invalid resolution');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const outName = `${slugify(body.name ?? b!)}-${stamp}.${format}`;
      const job = jobs.enqueue(b!, dir, `renders/${outName}`, path.join(dir, 'renders', outName), {
        format, quality: body.quality ?? 'standard', width: res2?.width, height: res2?.height, fps: body.fps, workers: body.workers, scale: body.scale,
      });
      return send(res, 202, job);
    }
    if (c === 'outputs') {
      const rdir = path.join(dir, 'renders');
      if (!d && method === 'GET') {
        const files = await readdir(rdir).catch(() => [] as string[]);
        const out = [];
        for (const f of files.filter((x) => /\.(mp4|webm|mov|gif)$/.test(x))) {
          const st = await stat(path.join(rdir, f));
          out.push({ file: f, size: st.size, modified: st.mtime.toISOString(), url: `/api/projects/${b}/outputs/${encodeURIComponent(f)}` });
        }
        return send(res, 200, out.sort((x, y) => y.modified.localeCompare(x.modified)));
      }
      if (d && method === 'GET') {
        const file = relPath(rdir, decodeURIComponent(d));
        const st = await stat(file).catch(() => null);
        if (!st) throw new ApiError(404, 'not found');
        res.writeHead(200, { 'content-type': mimeType(file), 'content-length': st.size, 'content-disposition': q.get('download') ? `attachment; filename="${path.basename(file)}"` : 'inline' });
        createReadStream(file).pipe(res);
        return;
      }
    }
    if (c === 'share' && method === 'POST') {
      const body = await readJson<{ file: string; title?: string; description?: string; captions?: string; includeProject?: boolean }>(req);
      const video = relPath(path.join(dir, 'renders'), body.file);
      const name = path.basename(body.file, path.extname(body.file));
      const r = await createShareBundle({
        video, outDir: path.join(dir, 'share', name), title: body.title, description: body.description,
        captions: body.captions ? relPath(dir, body.captions) : undefined, project: body.includeProject ? dir : undefined,
      });
      return send(res, 201, { ...r, url: `/share/${b}/${encodeURIComponent(name)}/index.html` });
    }
    if (c === 'registry' && method === 'POST') {
      const body = await readJson<{ item: string; file?: string; params?: Record<string, string> }>(req);
      const item = (await loadRegistry()).find((i) => i.name === body.item);
      if (!item) throw new ApiError(404, `unknown item ${body.item}`);
      const p = await loadProject(dir);
      try {
        return send(res, 200, await addItemToComposition(dir, body.file ?? p.scenes[0]!.relative, item, body.params ?? {}));
      } catch (e) { throw new ApiError(400, (e as Error).message); }
    }
    if (c === 'tts' && method === 'POST') {
      const body = await readJson<{ text: string; provider?: TtsProviderName; voice?: string; language?: string; name?: string }>(req);
      if (!body.text?.trim()) throw new ApiError(400, 'text is required');
      if (body.text.length > 5000) throw new ApiError(400, 'text too long (max 5000 chars)');
      const base = sanitizeFileName(`${body.name ?? `narration-${Date.now()}`}.mp3`).replace(/\.mp3$/, '');
      const r = await synthesize({ text: body.text, out: path.join(dir, 'assets', `${base}.mp3`), provider: body.provider, voice: body.voice, language: body.language });
      const captions = `assets/${base}.captions.json`;
      await writeFile(path.join(dir, captions), serializeCaptions({ language: body.language, cues: wordsToCues(r.words) }, 'json'));
      return send(res, 201, { audio: `assets/${base}.mp3`, captions, duration: r.duration, provider: r.provider, timing: r.timing });
    }
    if (c === 'transcribe' && method === 'POST') {
      const body = await readJson<{ path: string; language?: string }>(req);
      const doc = await transcribe(relPath(dir, body.path), { language: body.language });
      const out = body.path.replace(/\.[^.]+$/, '') + '.captions.json';
      await writeFile(relPath(dir, out), serializeCaptions(doc, 'json'));
      return send(res, 201, { captions: out, cues: doc.cues.length, provider: doc.provider });
    }
    throw new ApiError(404, 'unknown endpoint');
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      if (token && url.searchParams.get('token') && authorized(req, url)) {
        res.setHeader('set-cookie', `hfr_token=${token}; HttpOnly; SameSite=Strict; Path=/`);
      }
      if (!authorized(req, url)) return send(res, 401, 'unauthorized: open the Studio URL printed by `hfr studio` (with ?token=…)');
      const method = req.method ?? 'GET';
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host) return send(res, 403, 'cross-origin request refused');
      }
      const p = url.pathname;
      if (p.startsWith('/api/')) return await api(req, res, url);
      if (p === '/player.js') return send(res, 200, await bundlePlayer(), { 'content-type': 'text/javascript; charset=utf-8' });
      if (p.startsWith('/preview/')) {
        const id = p.split('/')[2] ?? '';
        const dir = await projectDir(id);
        let h = previewHandlers.get(id);
        if (!h) { h = createCompositionHandler({ root: dir, mode: 'preview', base: `/preview/${id}/` }); previewHandlers.set(id, h); }
        if (!(await h(req, res, p))) send(res, 404, 'not found');
        return;
      }
      if (p.startsWith('/share/')) {
        const [, , id, name, ...rest] = p.split('/');
        const dir = await projectDir(id ?? '');
        const file = relPath(path.join(dir, 'share'), [decodeURIComponent(name ?? ''), ...rest.map(decodeURIComponent)].join('/'));
        const st = await stat(file).catch(() => null);
        if (!st?.isFile()) return send(res, 404, 'not found');
        res.writeHead(200, { 'content-type': mimeType(file), 'content-length': st.size });
        createReadStream(file).pipe(res);
        return;
      }
      // Studio SPA
      studioBundle ??= buildStudio();
      const bundle = await studioBundle.catch((e) => { studioBundle = null; throw e; });
      if (p === '/app.js') return send(res, 200, bundle.js, { 'content-type': 'text/javascript; charset=utf-8' });
      if (p === '/app.css') return send(res, 200, bundle.css, { 'content-type': 'text/css; charset=utf-8' });
      return send(res, 200, bundle.html, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src 'self'; connect-src 'self'" });
    } catch (e) {
      const err = e as Error & { status?: number; code?: string };
      const status = err instanceof ApiError ? err.status : err.code === 'ENOENT' ? 404 : 500;
      if (status === 500) console.error('[studio]', err);
      if (!res.headersSent) send(res, status, { error: err.message });
      else res.end();
    }
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(o.port ?? 4400, host, resolve); });
  const { port } = server.address() as AddressInfo;
  const shownHost = host === '0.0.0.0' || host === '::' ? '127.0.0.1' : host;
  return {
    url: `http://${shownHost}:${port}/${token ? `?token=${token}` : ''}`,
    workspace, token,
    close: async () => { server.closeAllConnections(); await new Promise((r) => server.close(r)); },
  };
}
