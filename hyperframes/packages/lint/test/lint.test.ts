import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { lintProject } from '@hfr/lint';

async function project(html: string, extra: Record<string, string> = {}): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'hfr-lint-'));
  await writeFile(path.join(dir, 'index.html'), html);
  for (const [f, c] of Object.entries(extra)) { await mkdir(path.dirname(path.join(dir, f)), { recursive: true }); await writeFile(path.join(dir, f), c); }
  return dir;
}

const rules = (r: Awaited<ReturnType<typeof lintProject>>) => r.issues.map((i) => i.rule);

test('a clean composition has no issues', async () => {
  const dir = await project(`<!doctype html><html><head></head><body><div data-composition data-width="640" data-height="360" data-fps="30" data-duration="2"><p data-start="0" data-duration="2" style="color:red">ok</p></div></body></html>`);
  const r = await lintProject(dir);
  assert.deepEqual(r.issues, []);
  assert.equal(r.ok, true);
});

test('detects every class of problem', async () => {
  const dir = await project(`<!doctype html><html><head><style>.a{colr:red}</style>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script></head><body>
<div data-composition data-width="641" data-height="360" data-fps="30" data-duration="3">
  <div id="a" data-start="0" data-duration="2" data-track="1" data-enter="explode">A</div>
  <div id="b" data-start="a.end-1" data-duration="5" data-track="1" data-keyframes="[oops">B</div>
  <div data-start="9" data-duration="1">late</div>
  <div data-start="ghost.end" data-duration="1">bad ref</div>
  <img src="missing.png">
  <div data-hf-lottie="anim.json"></div>
  <div data-hf-captions="caps.srt"></div>
</div>
<script>setTimeout(() => {}, 100); let x = ;</script>
</body></html>`, { 'caps.srt': '1\n00:00:01,000 --> 00:00:09,000\nlong\n' });
  const r = await lintProject(dir, { probeMedia: false });
  const found = new Set(rules(r));
  for (const rule of ['css/unknown-property', 'libraries/remote', 'composition/odd-size', 'effects/invalid', 'timing/invalid', 'assets/missing', 'libraries/missing', 'js/syntax', 'captions/out-of-bounds']) {
    assert.ok(found.has(rule), `expected ${rule}, got ${[...found].join(', ')}`);
  }
  assert.equal(r.ok, false);
});

test('timing rules (overlap, never visible, out of bounds) and disable option', async () => {
  const dir = await project(`<!doctype html><html><head></head><body><div data-composition data-width="640" data-height="360" data-duration="3">
  <i id="a" data-start="0" data-duration="2" data-track="1"></i><i id="b" data-start="1" data-duration="4" data-track="1"></i><i id="c" data-start="5" data-duration="1"></i>
</div></body></html>`);
  const r = await lintProject(dir);
  assert.ok(rules(r).includes('timing/track-overlap'));
  assert.ok(rules(r).includes('timing/out-of-bounds'));
  assert.ok(rules(r).includes('timing/never-visible'));
  const r2 = await lintProject(dir, { disable: ['timing/track-overlap'] });
  assert.ok(!rules(r2).includes('timing/track-overlap'));
});

test('media rules with ffprobe: audio too short, no audio stream', async () => {
  const { generateTone, generateTestVideo } = await import('@hfr/media');
  const dir = await project(`<!doctype html><html><head></head><body><div data-composition data-width="640" data-height="360" data-duration="5">
  <audio src="tone.wav" data-start="0" data-duration="4"></audio><audio src="video.mp4" data-start="0" data-duration="1"></audio>
</div></body></html>`);
  await generateTone(path.join(dir, 'tone.wav'), { duration: 1 });
  await generateTestVideo(path.join(dir, 'video.mp4'), { duration: 1, width: 64, height: 36 });
  const r = await lintProject(dir);
  assert.ok(rules(r).includes('media/too-short'));
  assert.ok(rules(r).includes('media/no-audio'));
});

test('manifest problems are reported', async () => {
  const dir = await project('<div data-composition data-duration="1"></div>', { 'hyperframes.json': '{"name":"x","scenes":[{"src":"index.html"},{"src":"index.html","transition":{"type":"warp","duration":2}}]}' });
  const r = await lintProject(dir);
  assert.ok(r.issues.some((i) => i.rule === 'project/transition' && /unknown transition/.test(i.message)));
  assert.ok(r.issues.some((i) => i.rule === 'project/transition' && /shorter/.test(i.message)));
});
