import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { cloudRender, fetchProject, fileStorage, parseUri, validateRequest } from '@hfr/cloud-common';

const PAGE = '<!doctype html><html><head></head><body><div data-composition data-width="160" data-height="90" data-fps="10" data-duration="1"><p data-start="0">x</p></div></body></html>';

test('URI parsing and request validation', () => {
  assert.deepEqual(parseUri('s3://bucket/a/b.mp4'), { scheme: 's3', bucket: 'bucket', key: 'a/b.mp4' });
  assert.deepEqual(parseUri('file:///tmp/x'), { scheme: 'file', bucket: '', key: 'tmp/x' });
  assert.throws(() => parseUri('bucket/key'));
  assert.throws(() => validateRequest({ project: 's3://a/b' }), /required/);
  assert.throws(() => validateRequest({ project: 's3://a/b', output: 's3://a/c.mp4', options: { evil: 1 } }), /unknown option/);
});

test('zip projects are unpacked safely (zip-slip refused, single folder unwrapped)', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'hfr-cloud-'));
  await writeFile(path.join(dir, 'ok.zip'), zipSync({ 'proj/index.html': strToU8(PAGE) }));
  const { dir: root, cleanup } = await fetchProject(`file://${dir}/ok.zip`, [fileStorage]);
  await stat(path.join(root, 'index.html'));
  await cleanup();
  await writeFile(path.join(dir, 'evil.zip'), zipSync({ '../../escape.txt': strToU8('x') }));
  await assert.rejects(fetchProject(`file://${dir}/evil.zip`, [fileStorage]), /escapes/);
  await assert.rejects(fetchProject(`gs://b/x.zip`, [fileStorage]), /no storage adapter/);
});

test('cloudRender: directory prefix → rendered object', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'hfr-cloud-'));
  await mkdir(path.join(dir, 'project'), { recursive: true });
  await writeFile(path.join(dir, 'project/index.html'), PAGE);
  const r = await cloudRender({ project: `file://${dir}/project/`, output: `file://${dir}/out/video.mp4`, options: { quality: 'draft' } }, [fileStorage]);
  assert.equal(r.result.frames, 10);
  assert.ok((await stat(path.join(dir, 'out/video.mp4'))).size > 0);
});
