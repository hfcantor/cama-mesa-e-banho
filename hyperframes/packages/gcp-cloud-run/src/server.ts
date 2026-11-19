/**
 * Cloud Run service.
 *   POST /render   { "project": "gs://bucket/projects/demo/", "output": "gs://bucket/renders/demo.mp4", "options": {…} }
 *   GET  /healthz
 * Renders synchronously (Cloud Run allows up to 60 min request timeouts);
 * set CPU ≥ 4, memory ≥ 8 GiB and concurrency = 1 for predictable speed.
 * Authentication is delegated to Cloud Run IAM (deploy with --no-allow-unauthenticated).
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Storage } from '@google-cloud/storage';
import { cloudRender, fileStorage, validateRequest, type StorageAdapter } from '@hfr/cloud-common';

let storage: Storage | null = null;
const gcs = () => (storage ??= new Storage());

export const gcsStorage: StorageAdapter = {
  scheme: 'gs',
  async list(bucket, prefix) {
    const [files] = await gcs().bucket(bucket).getFiles({ prefix });
    return files.map((f) => f.name.slice(prefix.length)).filter((n) => n && !n.endsWith('/'));
  },
  async download(bucket, key, dest) {
    await mkdir(path.dirname(dest), { recursive: true });
    await pipeline(gcs().bucket(bucket).file(key).createReadStream(), createWriteStream(dest));
  },
  async upload(file, bucket, key, contentType) {
    await gcs().bucket(bucket).upload(file, { destination: key, contentType, resumable: true });
  },
};

export async function startServer(port = Number(process.env.PORT ?? 8080), host = '0.0.0.0'): Promise<{ url: string; close: () => Promise<void> }> {
  const adapters = process.env.HFR_ALLOW_FILE_STORAGE === '1' ? [gcsStorage, fileStorage] : [gcsStorage];
  let busy = 0;
  const server = http.createServer(async (req, res) => {
    const json = (status: number, data: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); };
    try {
      if (req.method === 'GET' && req.url === '/healthz') return json(200, { ok: true, busy });
      if (req.method !== 'POST' || req.url !== '/render') return json(404, { error: 'not found' });
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const c of req) { size += (c as Buffer).length; if (size > 1e6) return json(413, { error: 'body too large' }); chunks.push(c as Buffer); }
      const body = validateRequest(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      busy++;
      try {
        json(200, await cloudRender(body, adapters, (m) => console.log(JSON.stringify({ severity: 'INFO', message: m }))));
      } finally { busy--; }
    } catch (e) {
      console.error(JSON.stringify({ severity: 'ERROR', message: (e as Error).message }));
      if (!res.headersSent) json(400, { error: (e as Error).message });
    }
  });
  await new Promise<void>((resolve) => server.listen(port, host, resolve));
  const { port: p } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${p}`, close: () => new Promise((r) => server.close(() => r())) };
}
