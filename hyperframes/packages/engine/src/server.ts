/**
 * Composition server. Serves a project directory over HTTP and:
 *  - injects the runtime (and its parameters) at the top of every HTML page,
 *  - compiles Tailwind v4 <style> blocks,
 *  - serves vendor libraries at /__hf/lib/*,
 *  - exposes media endpoints used by the runtime: probe, frames, analysis, captions,
 *  - supports HTTP Range requests (media seeking in previews).
 * It can run standalone or be mounted under a prefix by the studio server.
 */
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { bundleRuntime, safeJoin } from '@hfr/core';
import { mimeType, probe } from '@hfr/media';
import { parseCaptions } from '@hfr/parsers';
import { bundleShaderTransitions } from '@hfr/shader-transitions';
import { MediaCache } from './media-cache.ts';
import { applyTailwind } from './tailwind.ts';
import { fontDir, threeAddonsDir, vendorLibraries, FONT_PACKAGES } from './vendor.ts';

export type ServerMode = 'preview' | 'render' | 'inspect';

export interface CompositionServerOptions {
  root: string;
  mode: ServerMode;
  /** URL prefix where the handler is mounted (must start and end with "/"). */
  base?: string;
  cacheDir?: string;
  seed?: number;
  /** Replace <video> by extracted frames (defaults to true for render/inspect). */
  videoFrames?: boolean;
  /** Extra HTML injected after the runtime (e.g. a live-reload client). */
  inject?: string;
  log?: (msg: string) => void;
}

export type Handler = (req: IncomingMessage, res: ServerResponse, pathname: string) => Promise<boolean>;

class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(res: ServerResponse, status: number, body: string | Buffer, type = 'text/plain; charset=utf-8', extra: Record<string, string> = {}) {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', ...extra });
  res.end(body);
}

function sendJson(res: ServerResponse, data: unknown, status = 200) {
  send(res, status, JSON.stringify(data), 'application/json; charset=utf-8');
}

async function sendFile(req: IncomingMessage, res: ServerResponse, file: string, type = mimeType(file), cache = 'no-cache') {
  const st = await stat(file).catch(() => null);
  if (!st || !st.isFile()) throw new HttpError(404, 'not found');
  const range = req.headers.range;
  const headers: Record<string, string | number> = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': cache, 'last-modified': st.mtime.toUTCString() };
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!m) throw new HttpError(416, 'bad range');
    let start = m[1] ? Number(m[1]) : st.size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : st.size - 1;
    if (!m[1] && !m[2]) { start = 0; end = st.size - 1; }
    if (start < 0 || start >= st.size || end < start) {
      res.writeHead(416, { 'content-range': `bytes */${st.size}` });
      res.end();
      return;
    }
    end = Math.min(end, st.size - 1);
    res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1 });
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { ...headers, 'content-length': st.size });
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(file).pipe(res);
}

/** Inserts `snippet` right after <head …> (or at the very top when there is none). */
export function injectIntoHead(html: string, snippet: string): string {
  const head = /<head\b[^>]*>/i.exec(html);
  if (head) return html.slice(0, head.index + head[0].length) + snippet + html.slice(head.index + head[0].length);
  const htmlTag = /<html\b[^>]*>/i.exec(html);
  if (htmlTag) return html.slice(0, htmlTag.index + htmlTag[0].length) + `<head>${snippet}</head>` + html.slice(htmlTag.index + htmlTag[0].length);
  const doctype = /^\s*<!doctype[^>]*>/i.exec(html);
  if (doctype) return doctype[0] + snippet + html.slice(doctype[0].length);
  return snippet + html;
}

export function createCompositionHandler(opts: CompositionServerOptions): Handler {
  const root = path.resolve(opts.root);
  const base = opts.base ?? '/';
  if (!base.startsWith('/') || !base.endsWith('/')) throw new Error('base must start and end with "/"');
  const cache = new MediaCache(opts.cacheDir ?? path.join(root, '.hfr-cache'));
  const vendor = vendorLibraries();
  const addons = threeAddonsDir();
  const params = {
    mode: opts.mode,
    seed: opts.seed ?? 1,
    base,
    videoFrames: opts.videoFrames ?? opts.mode !== 'preview',
  };

  const resolveSrc = (src: string | null): string => {
    if (!src) throw new HttpError(400, 'missing src');
    return safeJoin(root, decodeURIComponent(src));
  };

  const transformHtml = async (file: string): Promise<string> => {
    let html = await readFile(file, 'utf8');
    if (base !== '/') html = html.replace(/(["'(])\/__hf\//g, `$1${base}__hf/`);
    html = await applyTailwind(html, path.dirname(file));
    const snippet = `<script>window.__HF_PARAMS__=${JSON.stringify(params)}</script><script src="${base}__hf/runtime.js"></script>${opts.inject ?? ''}`;
    return injectIntoHead(html, snippet);
  };

  const hf = async (req: IncomingMessage, res: ServerResponse, sub: string, query: URLSearchParams) => {
    if (sub === 'runtime.js') {
      return send(res, 200, await bundleRuntime(), 'text/javascript; charset=utf-8');
    }
    if (sub === 'lib/shader-transitions.js') {
      return send(res, 200, await bundleShaderTransitions(), 'text/javascript; charset=utf-8');
    }
    if (sub.startsWith('lib/three/addons/')) {
      const file = safeJoin(addons, sub.slice('lib/three/addons/'.length));
      return sendFile(req, res, file, 'text/javascript; charset=utf-8', 'public, max-age=86400');
    }
    if (sub.startsWith('fonts/')) {
      const [, name, ...rest] = sub.split('/');
      const dir = fontDir(name ?? '');
      if (!dir) throw new HttpError(404, `unknown font "${name}". Available: ${Object.keys(FONT_PACKAGES).join(', ')}`);
      return sendFile(req, res, safeJoin(dir, rest.join('/') || 'index.css'), undefined, 'public, max-age=86400');
    }
    if (sub.startsWith('lib/')) {
      const lib = vendor[sub.slice(4)];
      if (!lib) throw new HttpError(404, `unknown library ${sub.slice(4)}. Available: ${Object.keys(vendor).join(', ')}`);
      return sendFile(req, res, lib.file, lib.contentType, 'public, max-age=86400');
    }
    if (sub === 'probe') {
      const info = await probe(resolveSrc(query.get('src')));
      return sendJson(res, info);
    }
    if (sub === 'frames') {
      const fps = Number(query.get('fps') ?? 30);
      const i = Number(query.get('i') ?? 0);
      if (!(fps > 0 && fps <= 240) || !Number.isFinite(i) || i < 0) throw new HttpError(400, 'invalid fps/i');
      const frame = await cache.frameFile(resolveSrc(query.get('src')), fps, i);
      if (!frame) throw new HttpError(404, 'no frames');
      return sendFile(req, res, frame, 'image/jpeg', 'public, max-age=3600');
    }
    if (sub === 'analysis') {
      const fps = Number(query.get('fps') ?? 30);
      const bands = Math.max(1, Math.min(256, Number(query.get('bands') ?? 32)));
      return sendJson(res, await cache.analysis(resolveSrc(query.get('src')), fps, bands));
    }
    if (sub === 'captions') {
      const file = resolveSrc(query.get('src'));
      const text = await readFile(file, 'utf8');
      return sendJson(res, parseCaptions(file, text, { duration: Number(query.get('duration') ?? 10) }));
    }
    throw new HttpError(404, `unknown endpoint __hf/${sub}`);
  };

  return async (req, res, pathname) => {
    if (!pathname.startsWith(base)) return false;
    const url = new URL(req.url ?? '/', 'http://localhost');
    const rel = decodeURIComponent(pathname.slice(base.length));
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'method not allowed');
      if (rel.startsWith('__hf/')) {
        await hf(req, res, rel.slice(5), url.searchParams);
        return true;
      }
      if (rel.split('/').some((seg) => seg.startsWith('.') && seg !== '.')) throw new HttpError(403, 'hidden files are not served');
      let file = safeJoin(root, rel || 'index.html');
      const st = await stat(file).catch(() => null);
      if (st?.isDirectory()) file = path.join(file, 'index.html');
      if (file.endsWith('.html')) {
        const html = await transformHtml(file).catch((e: NodeJS.ErrnoException) => {
          if (e.code === 'ENOENT') throw new HttpError(404, `not found: ${rel}`);
          throw e;
        });
        send(res, 200, html, 'text/html; charset=utf-8');
        return true;
      }
      await sendFile(req, res, file);
      return true;
    } catch (e) {
      const err = e as Error & { status?: number };
      const code = (err as NodeJS.ErrnoException).code;
      const status = err instanceof HttpError ? err.status : /escapes the project/.test(err.message) ? 403 : code === 'ENOENT' ? 404 : 500;
      if (status === 500) opts.log?.(`[server] ${pathname}: ${err.stack ?? err.message}`);
      if (!res.headersSent) send(res, status, err.message);
      else res.end();
      return true;
    }
  };
}

export interface RunningServer {
  url: string;
  port: number;
  close(): Promise<void>;
}

export async function startCompositionServer(opts: CompositionServerOptions & { port?: number; host?: string }): Promise<RunningServer> {
  const handler = createCompositionHandler({ ...opts, base: '/' });
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    handler(req, res, pathname).then((handled) => {
      if (!handled) send(res, 404, 'not found');
    }).catch((e) => send(res, 500, String(e)));
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(opts.port ?? 0, opts.host ?? '127.0.0.1', () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://${opts.host === '0.0.0.0' ? '127.0.0.1' : opts.host ?? '127.0.0.1'}:${port}/`,
    port,
    close: () => new Promise((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }),
  };
}
