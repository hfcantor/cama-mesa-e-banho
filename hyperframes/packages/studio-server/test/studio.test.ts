import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { startStudioServer } from '@hfr/studio-server';

let base = '';
let close: () => Promise<void>;
before(async () => {
  const s = await startStudioServer({ workspace: await mkdtemp(path.join(os.tmpdir(), 'hfr-studio-')), port: 0 });
  base = s.url.replace(/\/$/, '');
  close = s.close;
});
after(() => close());

const j = async (p: string, init: RequestInit & { json?: unknown } = {}) => {
  const r = await fetch(base + p, { ...init, headers: { ...(init.json ? { 'content-type': 'application/json' } : {}), ...(init.headers as Record<string, string>) }, body: init.json ? JSON.stringify(init.json) : init.body });
  const text = await r.text();
  return { status: r.status, data: text.startsWith('{') || text.startsWith('[') ? JSON.parse(text) : text };
};

test('project lifecycle, file editing and clip patching', async () => {
  const c = await j('/api/projects', { method: 'POST', json: { name: 'Minha Peça!', template: 'blank' } });
  assert.equal(c.status, 201);
  assert.equal(c.data.id, 'minha-peca');
  const id = c.data.id;
  assert.equal((await j('/api/projects')).data.length, 1);
  const f = await j(`/api/projects/${id}/files?path=index.html`);
  assert.match(f.data.content, /data-composition/);
  assert.equal((await j(`/api/projects/${id}/files?path=hyperframes.json`, { method: 'PUT', json: { content: '{bad' } })).status, 400);
  const tl = await j(`/api/projects/${id}/timeline`);
  const clip = tl.data.clips[0];
  assert.equal((await j(`/api/projects/${id}/clips`, { method: 'PATCH', json: { file: 'index.html', clipId: clip.id, changes: { 'data-start': '1' } } })).status, 200);
  assert.equal((await j(`/api/projects/${id}/timeline`)).data.clips[0].start, 1);
  assert.equal((await j(`/api/projects/${id}/clips`, { method: 'PATCH', json: { file: 'index.html', clipId: clip.id, changes: { onclick: 'x' } } })).status, 400);
  assert.equal((await j(`/api/projects/${id}`, { method: 'DELETE' })).status, 200);
  assert.equal((await j('/api/projects')).data.length, 0);
});

test('security: traversal, hidden files, uploads, origin, body type', async () => {
  const id = (await j('/api/projects', { method: 'POST', json: { name: 'sec', template: 'blank' } })).data.id;
  assert.equal((await j(`/api/projects/${id}/files?path=../../../etc/hosts.txt`)).status, 403);
  assert.equal((await j(`/api/projects/${id}/files?path=.env.json`)).status, 403);
  assert.equal((await j('/api/projects/..%2F..%2Fetc')).status, 400);
  assert.equal((await j(`/api/projects/${id}/media?name=x.html`, { method: 'POST', body: '<script>' })).status, 415);
  assert.equal((await j(`/api/projects/${id}/media?name=x.png`, { method: 'POST', body: 'GIF89a fake' })).status, 415);
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4b30000000049454e44ae426082', 'hex');
  const up = await j(`/api/projects/${id}/media?name=..%2F..%2Fpixel.png`, { method: 'POST', body: png });
  assert.equal(up.status, 201);
  assert.equal(up.data.path, 'assets/pixel.png');
  assert.equal((await fetch(`${base}/api/projects`, { method: 'POST', headers: { origin: 'http://evil.example', 'content-type': 'application/json' }, body: '{"name":"x"}' })).status, 403);
  assert.equal((await fetch(`${base}/api/projects`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{"name":"x"}' })).status, 415);
  // preview server refuses hidden files and traversal
  assert.equal((await fetch(`${base}/preview/${id}/..%2F..%2Fetc/hosts`)).status, 403);
});

test('preview serves the composition with the runtime injected, UI bundle builds', async () => {
  const id = (await j('/api/projects', { method: 'POST', json: { name: 'prev', template: 'blank' } })).data.id;
  const html = await (await fetch(`${base}/preview/${id}/index.html`)).text();
  assert.match(html, /window\.__HF_PARAMS__=\{"mode":"preview".*"base":"\/preview\/prev\/"/);
  assert.match(html, /src="\/preview\/prev\/__hf\/fonts\/inter\/index\.css"|href="\/preview\/prev\/__hf\/fonts\/inter\/index\.css"/);
  const runtime = await fetch(`${base}/preview/${id}/__hf/runtime.js`);
  assert.equal(runtime.status, 200);
  const ui = await fetch(`${base}/`);
  assert.match(ui.headers.get('content-security-policy') ?? '', /script-src 'self'/);
  assert.equal((await fetch(`${base}/app.js`)).status, 200);
});

test('token is required when configured', async () => {
  const s = await startStudioServer({ workspace: await mkdtemp(path.join(os.tmpdir(), 'hfr-studio-')), port: 0, token: 'secret-token' });
  try {
    const u = s.url.split('?')[0]!.replace(/\/$/, '');
    assert.equal((await fetch(`${u}/api/projects`)).status, 401);
    assert.equal((await fetch(`${u}/api/projects`, { headers: { authorization: 'Bearer secret-token' } })).status, 200);
    assert.equal((await fetch(`${u}/api/projects`, { headers: { 'x-hfr-token': 'wrong-token!' } })).status, 401);
  } finally {
    await s.close();
  }
});
