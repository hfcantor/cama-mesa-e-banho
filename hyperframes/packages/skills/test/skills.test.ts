import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseComposition } from '@hfr/core';
import { assignRoles, convertFigmaFrame, convertRemotion, createSlideshow, parseFigmaUrl, simulateSpring, analyzeVideo } from '@hfr/skills';
import { ffmpeg } from '@hfr/media';

const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));
const tmp = () => mkdtemp(path.join(os.tmpdir(), 'hfr-skills-'));

test('spring simulation settles at the target', () => {
  const s = simulateSpring({ fps: 30 });
  assert.equal(s[0]!.value, 0);
  assert.equal(s[s.length - 1]!.value, 1);
  assert.ok(Math.max(...s.map((x) => x.value)) > 1, 'default config overshoots');
  const clamped = simulateSpring({ fps: 30, overshootClamping: true });
  assert.ok(Math.max(...clamped.map((x) => x.value)) <= 1);
});

test('Remotion project converts with keyframes, sequences and assets', async () => {
  const out = await tmp();
  const r = await convertRemotion(path.join(fixtures, 'remotion/src/index.ts'), { outDir: out });
  assert.deepEqual(r.composition, { id: 'HelloWorld', width: 1280, height: 720, fps: 30, durationInFrames: 120 });
  assert.deepEqual(r.assets, ['public/logo.png']);
  assert.equal(r.notes.filter((n) => n.level === 'unsupported').length, 0);
  const html = await readFile(path.join(out, 'index.html'), 'utf8');
  const comp = parseComposition(html);
  assert.equal(comp.config.duration, 4);
  const seqs = comp.clips.filter((c) => c.id.startsWith('seq-'));
  assert.deepEqual(seqs.map((s) => [s.start, s.duration]), [['0', '2'], ['1.167', '2.833'], ['2.5', '1.5']]);
  assert.match(html, /Welcome to Remotion/);
  const title = comp.clips.find((c) => c.keyframes && c.keyframes.includes('"y"'));
  assert.ok(title, 'title has y keyframes');
  const kfs = JSON.parse(title!.keyframes!) as Array<{ t: number; y?: number; opacity?: number }>;
  assert.equal(kfs[0]!.y, 60);
  assert.equal(kfs[kfs.length - 1]!.y, 0);
});

test('Figma frame converts to positioned HTML', async () => {
  const data = JSON.parse(await readFile(path.join(fixtures, 'figma-node.json'), 'utf8'));
  const r = convertFigmaFrame(data.nodes['1:2'].document, {});
  assert.deepEqual([r.width, r.height], [1280, 720]);
  assert.deepEqual(r.needsRender, ['1:6']);
  const comp = parseComposition(r.html);
  assert.equal(comp.parseErrors.filter((e) => e.code !== 'missing-doctype').length, 0);
  assert.equal(comp.clips.length, 3);
  assert.match(r.html, /left:80px;top:100px;width:560px;height:420px/);
  assert.match(r.html, /border-radius:32px/);
  assert.match(r.html, /Design to video/);
  assert.deepEqual(parseFigmaUrl('https://www.figma.com/design/AbC123/My-File?node-id=12-34'), { fileKey: 'AbC123', nodeId: '12:34' });
});

test('style roles respect contrast', () => {
  const pal = [
    { hex: '#ffffff', rgb: [255, 255, 255] as [number, number, number], weight: 0.7, luminance: 1 },
    { hex: '#111111', rgb: [17, 17, 17] as [number, number, number], weight: 0.2, luminance: 0.01 },
    { hex: '#ff0066', rgb: [255, 0, 102] as [number, number, number], weight: 0.1, luminance: 0.2 },
  ];
  const r = assignRoles(pal);
  assert.equal(r.roles.background, '#ffffff');
  assert.equal(r.roles.text, '#111111');
  assert.equal(r.roles.accent, '#ff0066');
  assert.ok(r.contrast.textOnBackground > 15);
});

test('slideshow builds a valid composition from markdown', async () => {
  const out = await tmp();
  const r = await createSlideshow({ outDir: out, markdown: '# A\n## sub\n---\n# B\n- one\n- two', slideDuration: 3, overlap: 0.5 });
  assert.equal(r.slides, 2);
  assert.equal(r.duration, 5.5);
  const comp = parseComposition(await readFile(path.join(out, 'index.html'), 'utf8'));
  assert.equal(comp.config.duration, 5.5);
  assert.deepEqual(comp.clips.filter((c) => c.id.match(/^slide-\d$/)).map((c) => c.start), ['0.000', '2.500']);
});

test('video analysis detects cuts and camera motion', async () => {
  const dir = await tmp();
  const v = path.join(dir, 'cuts.mp4');
  await ffmpeg(['-f', 'lavfi', '-i', 'color=c=red:s=320x180:r=25:d=1.5', '-f', 'lavfi', '-i', 'color=c=blue:s=320x180:r=25:d=1.5',
    '-f', 'lavfi', '-i', 'mandelbrot=s=320x180:r=25', '-filter_complex', '[2]trim=duration=1.5,setpts=PTS-STARTPTS,zoompan=z=1+0.006*on:d=1:s=320x180:fps=25[z];[0][1][z]concat=n=3:v=1:a=0,format=yuv420p', '-c:v', 'libx264', v]);
  const a = await analyzeVideo(v, { outDir: path.join(dir, 'out') });
  assert.equal(a.scenes.length, 3);
  assert.ok(Math.abs(a.scenes[1]!.start - 1.5) < 0.1);
  assert.equal(a.scenes[0]!.camera, 'static');
  assert.equal(a.scenes[2]!.camera, 'zoom-in');
  const [r0, , b0] = a.scenes[0]!.palette[0]!.rgb;
  assert.ok(r0 > 200 && b0 < 60, 'first scene is red');
});
