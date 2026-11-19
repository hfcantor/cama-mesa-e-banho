import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  probe, generateTone, generateTestVideo, analyzeAudio, analyzeSamples, detectSilence, kmeansPalette, contrastRatio,
  sanitizeFileName, contentMatchesExtension, sniff, extractFrames, ffmpeg, fontFaceCss, fftMagnitudes,
} from '@hfr/media';

let dir: string;
before(async () => { dir = await mkdtemp(path.join(os.tmpdir(), 'hfr-media-test-')); });

test('FFT finds the frequency of a pure tone', () => {
  const n = 1024, sr = 8192, f = 1024;
  const x = new Float32Array(n).map((_, i) => Math.sin((2 * Math.PI * f * i) / sr));
  const mags = fftMagnitudes(x);
  const peak = mags.indexOf(Math.max(...mags));
  assert.equal(peak, (f * n) / sr);
});

test('probe + audio analysis on a generated tone', async () => {
  const tone = await generateTone(path.join(dir, 'tone.wav'), { duration: 2, frequency: 440 });
  const info = await probe(tone);
  assert.ok(Math.abs(info.duration! - 2) < 0.05);
  assert.equal(info.audio?.sampleRate, 44100);
  const a = await analyzeAudio(tone, { fps: 10, bands: 16 });
  assert.ok(Math.abs(a.frames.length - 20) <= 1);
  const mid = a.frames[10]!;
  const peakBand = mid.slice(1).indexOf(Math.max(...mid.slice(1)));
  // 440 Hz lies in the middle bands of a 30 Hz–11 kHz log scale
  assert.ok(peakBand >= 6 && peakBand <= 10, `peak band ${peakBand}`);
});

test('analyzeSamples normalises RMS to 1 at the loudest frame', () => {
  const sr = 8000;
  const s = new Float32Array(sr).map((_, i) => (i < sr / 2 ? 0.1 : 0.8) * Math.sin(i / 3));
  const r = analyzeSamples(s, sr, 4, 4);
  assert.equal(Math.max(...r.frames.map((f) => f[0]!)), 1);
  assert.ok(r.frames[0]![0]! < 0.2);
});

test('silence detection finds a gap', async () => {
  const f = path.join(dir, 'gap.wav');
  await ffmpeg(['-f', 'lavfi', '-i', 'sine=f=300:d=1', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono:d=1', '-f', 'lavfi', '-i', 'sine=f=300:d=1', '-filter_complex', '[0][1][2]concat=n=3:v=0:a=1', f]);
  const s = await detectSilence(f);
  assert.equal(s.length, 1);
  assert.ok(Math.abs(s[0]!.start - 1) < 0.1 && Math.abs(s[0]!.end - 2) < 0.1);
});

test('frame extraction is time-exact', async () => {
  const v = await generateTestVideo(path.join(dir, 'v.mp4'), { duration: 1, fps: 25, width: 160, height: 90 });
  const n = await extractFrames(v, path.join(dir, 'frames'), { fps: 10 });
  assert.equal(n, 10);
});

test('k-means palette and contrast', () => {
  const px = Buffer.alloc(300 * 3);
  for (let i = 0; i < 300; i++) { const red = i < 200; px[i * 3] = red ? 255 : 0; px[i * 3 + 2] = red ? 0 : 255; }
  const p = kmeansPalette(px, 3);
  assert.equal(p[0]!.hex, '#ff0000');
  assert.ok(Math.abs(p[0]!.weight - 0.667) < 0.01);
  assert.equal(Math.round(contrastRatio([0, 0, 0], [255, 255, 255])), 21);
});

test('upload safety helpers', () => {
  assert.equal(sanitizeFileName('../../Ação Final!!.MP4'), 'Acao-Final.mp4');
  assert.throws(() => sanitizeFileName('...'));
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]);
  assert.equal(sniff(png), 'png');
  assert.equal(contentMatchesExtension('a.png', png), true);
  assert.equal(contentMatchesExtension('a.mp4', png), false);
  assert.equal(contentMatchesExtension('a.json', Buffer.from('{}')), true);
  assert.match(fontFaceCss(['fonts/Inter-Bold.woff2']), /font-family:"Inter".*font-weight:700/);
});
