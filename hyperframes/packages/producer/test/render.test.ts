/**
 * Integration tests: real Chromium + FFmpeg renders checked pixel by pixel.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { renderProject } from '@hfr/producer';
import { captureFrame, launchBrowser, openComposition, startCompositionServer } from '@hfr/engine';
import { ffmpeg, probe } from '@hfr/media';
import type { Browser } from 'playwright-core';

let browser: Browser;
let dir: string;
before(async () => { browser = await launchBrowser(); dir = await mkdtemp(path.join(os.tmpdir(), 'hfr-render-test-')); });
after(async () => { await browser.close(); });

/** RGB of the centre pixel of frame `index`. */
async function pixel(video: string, index: number, x = 0.5, y = 0.5): Promise<[number, number, number]> {
  const info = await probe(video);
  const w = info.video!.width, h = info.video!.height;
  const { stdout } = await ffmpeg(['-i', video, '-vf', `select=eq(n\\,${index}),crop=2:2:${Math.floor((w * x) / 2) * 2}:${Math.floor((h * y) / 2) * 2}`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { binary: true });
  return [stdout[0]!, stdout[1]!, stdout[2]!];
}

const close = (a: number[], b: number[], tol = 40) => a.every((v, i) => Math.abs(v - b[i]!) <= tol);

async function writeProject(name: string, files: Record<string, string>): Promise<string> {
  const p = path.join(dir, name);
  for (const [f, c] of Object.entries(files)) { await mkdir(path.dirname(path.join(p, f)), { recursive: true }); await writeFile(path.join(p, f), c); }
  return p;
}

const page = (body: string, attrs = 'data-width="320" data-height="180" data-fps="10" data-duration="3"', head = '') =>
  `<!doctype html><html><head>${head}</head><body><div data-composition ${attrs}>${body}</div></body></html>`;

test('clip timing is frame accurate (parallel workers)', async () => {
  const p = await writeProject('timing', {
    'index.html': page(`
      <div data-start="0" data-duration="1" style="position:absolute;inset:0;background:#ff0000"></div>
      <div data-start="1" data-duration="1" style="position:absolute;inset:0;background:#00ff00"></div>
      <div data-start="2" data-duration="1" style="position:absolute;inset:0;background:#0000ff"></div>`),
  });
  const out = path.join(dir, 'timing.mp4');
  const r = await renderProject({ project: p, output: out, workers: 3, browser, quality: 'high' });
  assert.equal(r.frames, 30);
  assert.equal(r.probe.video?.frames, 30);
  assert.equal(r.probe.video?.fps, 10);
  assert.ok(close(await pixel(out, 9), [255, 0, 0]), 'frame 9 red');
  assert.ok(close(await pixel(out, 10), [0, 255, 0]), 'frame 10 green');
  assert.ok(close(await pixel(out, 29), [0, 0, 255]), 'frame 29 blue');
});

test('GSAP, CSS animations and keyframes follow virtual time', async () => {
  const p = await writeProject('anim', {
    'index.html': page(`
      <div id="g" style="position:absolute;left:0;top:0;width:20px;height:20px;background:#fff"></div>
      <div id="css" style="position:absolute;left:0;top:100px;width:20px;height:20px;background:#fff;animation:mv 2s linear forwards"></div>
      <div id="kf" data-start="0" data-keyframes='[{"t":0,"x":0},{"t":2,"x":200,"ease":"linear"}]' style="position:absolute;left:0;top:150px;width:20px;height:20px;background:#fff"></div>`,
    'data-width="320" data-height="180" data-fps="10" data-duration="2"',
    '<style>@keyframes mv{to{transform:translateX(200px)}}</style><script src="/__hf/lib/gsap.js"></script><script>addEventListener("DOMContentLoaded",()=>gsap.to("#g",{x:200,duration:2,ease:"none"}))</script>'),
  });
  const srv = await startCompositionServer({ root: p, mode: 'render' });
  try {
    const comp = await openComposition(browser, srv.url, { width: 320, height: 180 });
    const xs = async (t: number) => {
      await captureFrame(comp, t, { format: 'jpeg', width: 320, height: 180 });
      return comp.page.evaluate(() => ['g', 'css', 'kf'].map((id) => Math.round(document.getElementById(id)!.getBoundingClientRect().x)));
    };
    assert.deepEqual(await xs(1), [100, 100, 100]);
    assert.deepEqual(await xs(0.5), [50, 50, 50], 'seeking backwards works');
    assert.deepEqual(await xs(1.5), [150, 150, 150]);
    // determinism: same frame, different seek history → identical pixels
    const a = await captureFrame(comp, 0.7, { format: 'png', width: 320, height: 180 });
    await captureFrame(comp, 1.9, { format: 'png', width: 320, height: 180 });
    const b = await captureFrame(comp, 0.7, { format: 'png', width: 320, height: 180 });
    assert.ok(a.equals(b));
    await comp.close();
  } finally {
    await srv.close();
  }
});

test('video clips show the exact media frame; audio is mixed with offsets', async () => {
  const media = path.join(dir, 'media');
  await mkdir(media, { recursive: true });
  // 3 s video: 1 s red, 1 s green, 1 s blue
  await ffmpeg(['-f', 'lavfi', '-i', 'color=c=red:s=160x90:r=10:d=1', '-f', 'lavfi', '-i', 'color=c=lime:s=160x90:r=10:d=1', '-f', 'lavfi', '-i', 'color=c=blue:s=160x90:r=10:d=1',
    '-filter_complex', '[0][1][2]concat=n=3:v=1:a=0,format=yuv420p', '-c:v', 'libx264', path.join(media, 'rgb.mp4')]);
  await ffmpeg(['-f', 'lavfi', '-i', 'sine=f=440:d=1', path.join(media, 'beep.wav')]);
  const out = path.join(dir, 'video.mp4');
  const p2 = await writeProject('video2', {
    'index.html': page(`
      <video src="media/rgb.mp4" muted data-start="0.5" data-duration="1.5" data-media-start="1" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
      <audio src="media/beep.wav" data-start="1" data-volume="0.8"></audio>`, 'data-width="320" data-height="180" data-fps="10" data-duration="3" data-background="#000"'),
  });
  await mkdir(path.join(p2, 'media'), { recursive: true });
  await ffmpeg(['-i', path.join(media, 'rgb.mp4'), '-c', 'copy', path.join(p2, 'media/rgb.mp4')]);
  await ffmpeg(['-i', path.join(media, 'beep.wav'), path.join(p2, 'media/beep.wav')]);
  const ok = await renderProject({ project: p2, output: out, browser, quality: 'high' });
  assert.ok(close(await pixel(out, 2), [0, 0, 0]), 'before the clip: black');
  assert.ok(close(await pixel(out, 6), [0, 255, 0]), 'media time 1.1s → green');
  assert.ok(close(await pixel(out, 16), [0, 0, 255]), 'media time 2.1s → blue');
  assert.ok(close(await pixel(out, 25), [0, 0, 0]), 'after the clip: black');
  assert.equal(ok.audioTracks, 1);
  assert.equal(ok.probe.audio?.codec, 'aac');
  // audio is silent before 1 s and present after
  const level = async (start: number) => {
    const { stderr } = await ffmpeg(['-ss', String(start), '-t', '0.4', '-i', out, '-af', 'volumedetect', '-f', 'null', '-']);
    return Number(/max_volume: (-?[\d.]+)/.exec(stderr)?.[1] ?? -100);
  };
  assert.ok((await level(0.2)) < -60, 'silence before the audio clip');
  assert.ok((await level(1.2)) > -30, 'tone after 1 s'); // lavfi sine is generated at -18 dBFS
  assert.ok((await level(2.3)) < -60, 'silence after the 1 s tone ends');
});

test('scenes are joined with xfade transitions and correct total duration', async () => {
  const scene = (c: string) => page(`<div style="position:absolute;inset:0;background:${c}"></div>`, 'data-width="320" data-height="180" data-fps="10" data-duration="2"');
  const p = await writeProject('scenes', {
    'hyperframes.json': JSON.stringify({ name: 's', scenes: [{ src: 'a.html' }, { src: 'b.html', transition: { type: 'fade', duration: 0.5 } }] }),
    'a.html': scene('#ff0000'), 'b.html': scene('#0000ff'),
  });
  const out = path.join(dir, 'scenes.webm');
  const r = await renderProject({ project: p, output: out, browser, quality: 'draft' });
  assert.equal(r.format, 'webm');
  assert.ok(Math.abs(r.duration - 3.5) < 1e-6);
  assert.ok(Math.abs((r.probe.duration ?? 0) - 3.5) < 0.15);
  assert.equal(r.probe.video?.codec, 'vp9');
  const mid = await pixel(out, 17); // t=1.7 → inside the 1.5–2.0 fade
  assert.ok(mid[0] > 40 && mid[2] > 40, `cross-fade mixes both colours: ${mid}`);
});

test('range, output scaling and GIF', async () => {
  const p = await writeProject('range', { 'index.html': page('<div data-start="0" style="position:absolute;inset:0;background:#fff"></div>') });
  const r = await renderProject({ project: p, output: path.join(dir, 'r.mp4'), range: { start: 1, end: 2 }, width: 160, browser });
  assert.equal(r.frames, 10);
  assert.deepEqual([r.probe.video?.width, r.probe.video?.height], [160, 90]);
  const g = await renderProject({ project: p, output: path.join(dir, 'r.gif'), range: { start: 0, end: 1 }, browser });
  assert.equal(g.probe.video?.codec, 'gif');
});
