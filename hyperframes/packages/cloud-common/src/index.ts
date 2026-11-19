/**
 * @hfr/cloud-common — storage-agnostic "render job" used by the AWS Lambda
 * handler and the Cloud Run service.
 *
 * A project source can be:
 *   - a directory prefix:  s3://bucket/projects/demo/   gs://bucket/projects/demo/   file:///abs/path/
 *   - a zip archive:       s3://bucket/demo.zip         gs://bucket/demo.zip         file:///abs/demo.zip
 * The output is a single object URI (same schemes).
 */
import { mkdir, mkdtemp, readFile, rm, stat, writeFile, copyFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { unzipSync } from 'fflate';
import { safeJoin } from '@hfr/core';
import { renderProject, type RenderOptions, type RenderResult } from '@hfr/producer';

export interface StorageAdapter {
  scheme: string;
  /** Lists object keys under a prefix (relative paths). */
  list(bucket: string, prefix: string): Promise<string[]>;
  download(bucket: string, key: string, dest: string): Promise<void>;
  upload(file: string, bucket: string, key: string, contentType: string): Promise<void>;
}

export interface ParsedUri { scheme: string; bucket: string; key: string }

export function parseUri(uri: string): ParsedUri {
  const m = /^([a-z0-9]+):\/\/([^/]*)\/?(.*)$/.exec(uri);
  if (!m) throw new Error(`invalid storage URI "${uri}" (expected s3://, gs:// or file://)`);
  return { scheme: m[1]!, bucket: m[2]!, key: decodeURIComponent(m[3]!) };
}

/** Local filesystem adapter (file:///abs/path) — used for tests and on-prem runs. */
export const fileStorage: StorageAdapter = {
  scheme: 'file',
  async list(_bucket, prefix) {
    const root = `/${prefix}`;
    const out: string[] = [];
    const walk = async (rel: string) => {
      for (const e of await readdir(path.join(root, rel), { withFileTypes: true })) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) await walk(r); else out.push(r);
      }
    };
    await walk('');
    return out;
  },
  async download(_bucket, key, dest) {
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(`/${key}`, dest);
  },
  async upload(file, _bucket, key) {
    await mkdir(path.dirname(`/${key}`), { recursive: true });
    await copyFile(file, `/${key}`);
  },
};

const MAX_FILES = 5000;
const MAX_TOTAL = 4 * 1024 ** 3;

/** Downloads (and unzips) a project into a fresh temp directory. */
export async function fetchProject(uri: string, adapters: StorageAdapter[]): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const { scheme, bucket, key } = parseUri(uri);
  const adapter = adapters.find((a) => a.scheme === scheme);
  if (!adapter) throw new Error(`no storage adapter for ${scheme}://`);
  const dir = await mkdtemp(path.join(os.tmpdir(), 'hfr-project-'));
  const cleanup = () => rm(dir, { recursive: true, force: true });
  try {
    return { dir: await populate(), cleanup };
  } catch (e) {
    await cleanup();
    throw e;
  }

  async function populate(): Promise<string> {
  if (key.toLowerCase().endsWith('.zip')) {
    const zipFile = path.join(dir, '__project.zip');
    await adapter!.download(bucket, key, zipFile);
    const entries = unzipSync(new Uint8Array(await readFile(zipFile)), {
      filter: (f) => {
        if (f.originalSize > MAX_TOTAL) throw new Error(`zip entry too large: ${f.name}`);
        return !f.name.endsWith('/');
      },
    });
    const names = Object.keys(entries);
    if (names.length > MAX_FILES) throw new Error(`zip has too many files (${names.length})`);
    let total = 0;
    for (const name of names) {
      total += entries[name]!.length;
      if (total > MAX_TOTAL) throw new Error('zip expands beyond the size limit');
      const dest = safeJoin(dir, name); // refuses "../" entries (zip-slip)
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, entries[name]!);
    }
    await rm(zipFile);
    // a zip with a single top-level folder: use that folder as the project root
    const top = (await readdir(dir)).filter((n) => !n.startsWith('.'));
    if (top.length === 1 && (await stat(path.join(dir, top[0]!))).isDirectory()) return path.join(dir, top[0]!);
    return dir;
  }
  const prefix = key.endsWith('/') || key === '' ? key : `${key}/`;
  const keys = await adapter!.list(bucket, prefix);
  if (!keys.length) throw new Error(`no files under ${uri}`);
  if (keys.length > MAX_FILES) throw new Error(`too many files under ${uri}`);
  for (const k of keys) {
    if (/(^|\/)(renders|\.hfr-cache|node_modules)\//.test(k)) continue;
    await adapter!.download(bucket, `${prefix}${k}`, safeJoin(dir, k));
  }
  return dir;
  }
}

export interface CloudRenderRequest {
  project: string;
  output: string;
  options?: Pick<RenderOptions, 'format' | 'width' | 'height' | 'scale' | 'fps' | 'quality' | 'crf' | 'workers' | 'range' | 'allowErrors'>;
}

export interface CloudRenderResponse {
  output: string;
  result: Omit<RenderResult, 'probe' | 'output'>;
}

const CONTENT_TYPES: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', gif: 'image/gif' };

export function validateRequest(body: unknown): CloudRenderRequest {
  const b = body as CloudRenderRequest;
  if (!b || typeof b !== 'object') throw new Error('request body must be an object');
  if (typeof b.project !== 'string' || typeof b.output !== 'string') throw new Error('"project" and "output" URIs are required');
  parseUri(b.project);
  parseUri(b.output);
  const allowed = ['format', 'width', 'height', 'scale', 'fps', 'quality', 'crf', 'workers', 'range', 'allowErrors'];
  for (const k of Object.keys(b.options ?? {})) if (!allowed.includes(k)) throw new Error(`unknown option "${k}"`);
  return b;
}

export async function cloudRender(req: CloudRenderRequest, adapters: StorageAdapter[], log: (m: string) => void = () => {}): Promise<CloudRenderResponse> {
  const { dir, cleanup } = await fetchProject(req.project, adapters);
  const outUri = parseUri(req.output);
  const outAdapter = adapters.find((a) => a.scheme === outUri.scheme);
  if (!outAdapter) { await cleanup(); throw new Error(`no storage adapter for ${outUri.scheme}://`); }
  const ext = path.extname(outUri.key).slice(1).toLowerCase() || 'mp4';
  const local = path.join(dir, `__output.${ext}`);
  try {
    log(`rendering ${req.project}`);
    const r = await renderProject({ ...(req.options ?? {}), project: dir, output: local, onProgress: (p) => { if (p.phase !== 'frames' || (p.frame ?? 0) % 60 === 0) log(`${p.phase} ${p.percent.toFixed(0)}%`); } });
    log(`uploading ${req.output}`);
    await outAdapter.upload(local, outUri.bucket, outUri.key, CONTENT_TYPES[ext] ?? 'application/octet-stream');
    const { probe: _p, output: _o, ...result } = r;
    void _p; void _o;
    return { output: req.output, result };
  } finally {
    await cleanup();
  }
}
