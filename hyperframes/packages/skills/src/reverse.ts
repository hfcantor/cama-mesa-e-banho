/**
 * Reverse any video: analyses an existing video (scene cuts, timing, colour
 * palettes, brightness, camera motion, audio loudness/silences) and writes a
 * HyperFrames project scaffold that reproduces its structure — one clip per
 * detected scene with matched durations, palette and an approximated camera
 * move — plus a Markdown report. Text/object recognition is NOT performed
 * (that would need an OCR/vision model); keyframes are exported so a person or
 * an AI agent can rebuild the content of each scene.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectManifest } from '@hfr/core';
import {
  decodeRgb, detectScenes, detectSilence, extractPalette, frameStats, measureLoudness, motionProfile, probe, thumbnail,
  type Loudness, type MediaInfo, type PaletteColor,
} from '@hfr/media';
import { escapeAttr, even, htmlDocument, importAsset } from './util.ts';

export type CameraMove = 'static' | 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down' | 'zoom-in' | 'zoom-out' | 'handheld';

export interface SceneAnalysis {
  index: number;
  start: number;
  end: number;
  duration: number;
  keyframe: string;
  palette: PaletteColor[];
  brightness: number;
  saturation: number;
  motionEnergy: number;
  camera: CameraMove;
  cutScore: number | null;
}

export interface VideoAnalysis {
  source: string;
  info: MediaInfo;
  scenes: SceneAnalysis[];
  averageShotLength: number;
  pacing: 'slow' | 'medium' | 'fast';
  audio: { present: boolean; loudness: Loudness | null; silences: Array<{ start: number; end: number }> };
  globalPalette: PaletteColor[];
}

export interface ReverseOptions {
  outDir: string;
  threshold?: number;
  minSceneLength?: number;
  /** Include the source video, muted and faded, as a reference layer in the scaffold. */
  referenceLayer?: boolean;
}

function classifyCamera(samples: Array<{ energy: number; dx: number; dy: number; zoom: number }>): CameraMove {
  if (!samples.length) return 'static';
  const avg = (f: (s: (typeof samples)[number]) => number) => samples.reduce((a, s) => a + f(s), 0) / samples.length;
  const energy = avg((s) => s.energy), dx = avg((s) => s.dx), dy = avg((s) => s.dy), zoom = avg((s) => s.zoom);
  if (energy < 0.01) return 'static';
  const consistentX = samples.filter((s) => Math.sign(s.dx) === Math.sign(dx) && s.dx !== 0).length / samples.length;
  const consistentY = samples.filter((s) => Math.sign(s.dy) === Math.sign(dy) && s.dy !== 0).length / samples.length;
  if (Math.abs(zoom - 1) > 0.012) return zoom > 1 ? 'zoom-in' : 'zoom-out';
  if (Math.abs(dx) >= 0.5 && consistentX > 0.6) return dx < 0 ? 'pan-right' : 'pan-left';
  if (Math.abs(dy) >= 0.5 && consistentY > 0.6) return dy < 0 ? 'tilt-down' : 'tilt-up';
  return energy > 0.06 ? 'handheld' : 'static';
}

const KENBURNS: Record<CameraMove, string | null> = {
  static: null, handheld: null, 'pan-left': 'left', 'pan-right': 'right', 'tilt-up': 'up', 'tilt-down': 'down', 'zoom-in': 'in', 'zoom-out': 'out',
};

export async function analyzeVideo(file: string, o: ReverseOptions): Promise<VideoAnalysis> {
  const src = path.resolve(file);
  const info = await probe(src);
  if (!info.video) throw new Error(`${file} has no video stream`);
  const duration = info.duration ?? 0;
  const outDir = path.resolve(o.outDir);
  await mkdir(path.join(outDir, 'reference'), { recursive: true });
  const cuts = await detectScenes(src, { threshold: o.threshold ?? 0.3 });
  const minLen = o.minSceneLength ?? 0.4;
  const bounds: Array<{ start: number; score: number | null }> = [{ start: 0, score: null }];
  for (const c of cuts) if (c.time - bounds[bounds.length - 1]!.start >= minLen && duration - c.time >= minLen) bounds.push({ start: c.time, score: c.score });
  const scenes: SceneAnalysis[] = [];
  for (const [i, b] of bounds.entries()) {
    const end = i + 1 < bounds.length ? bounds[i + 1]!.start : duration;
    const mid = b.start + (end - b.start) / 2;
    const keyframe = path.join(outDir, 'reference', `scene-${String(i + 1).padStart(2, '0')}.jpg`);
    await thumbnail(src, keyframe, mid, Math.min(1280, info.video.width));
    const palette = await extractPalette(src, { time: mid, k: 5 });
    const st = frameStats(await decodeRgb(src, { width: 64, height: 36, time: mid }));
    const motion = await motionProfile(src, { start: b.start, duration: Math.max(0.3, end - b.start), sampleFps: 6 });
    scenes.push({
      index: i + 1, start: round(b.start), end: round(end), duration: round(end - b.start), keyframe: path.relative(outDir, keyframe),
      palette, brightness: round(st.brightness), saturation: round(st.saturation),
      motionEnergy: round(motion.reduce((a, m) => a + m.energy, 0) / Math.max(1, motion.length)), camera: classifyCamera(motion), cutScore: b.score,
    });
  }
  const asl = scenes.reduce((a, s) => a + s.duration, 0) / Math.max(1, scenes.length);
  const audio = info.audio
    ? { present: true, loudness: await measureLoudness(src), silences: (await detectSilence(src, { noiseDb: -40, minDuration: 0.5 })).map((s) => ({ start: round(s.start), end: round(Math.min(s.end, duration)) })) }
    : { present: false, loudness: null, silences: [] };
  return {
    source: src, info, scenes, averageShotLength: round(asl), pacing: asl < 1.5 ? 'fast' : asl < 4 ? 'medium' : 'slow', audio,
    globalPalette: await extractPalette(src, { time: duration / 2, k: 6 }),
  };
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Writes analysis.json, report.md and a project scaffold reproducing the structure. */
export async function reverseVideo(file: string, o: ReverseOptions): Promise<{ dir: string; analysis: VideoAnalysis }> {
  const outDir = path.resolve(o.outDir);
  const a = await analyzeVideo(file, o);
  const v = a.info.video!;
  const width = even(v.width), height = even(v.height);
  const fps = Math.min(60, Math.round(v.fps ?? 30));
  const duration = a.info.duration ?? a.scenes.reduce((n, s) => n + s.duration, 0);
  const ref = o.referenceLayer ? await importAsset(outDir, a.source) : null;
  const sections = a.scenes.map((s) => {
    const [bg, fg, accent] = [s.palette[0]?.hex ?? '#111', s.palette.find((p) => p.luminance > 0.5)?.hex ?? '#fff', s.palette[1]?.hex ?? '#888'];
    const kb = KENBURNS[s.camera];
    return `    <!-- Scene ${s.index}: ${s.duration}s, camera ${s.camera}, brightness ${s.brightness}, motion ${s.motionEnergy} -->
    <section id="scene-${s.index}" class="scene" data-name="Scene ${s.index}" data-start="${s.start}" data-duration="${s.duration}" style="--bg:${bg};--fg:${fg};--accent:${accent}">
      <img class="ref" src="${escapeAttr(s.keyframe)}" alt="" data-start="scene-${s.index}.start" data-end="scene-${s.index}.end"${kb ? ` data-kenburns="${kb} 0.12"` : ''}>
      <div class="todo">Scene ${s.index} — rebuild the content here (${s.camera})</div>
    </section>`;
  }).join('\n');
  const html = htmlDocument({
    title: `Reconstruction of ${path.basename(a.source)}`, width, height, fps, duration, background: a.globalPalette[0]?.hex ?? '#000',
    head: `  <style>
    .scene{position:absolute;inset:0;background:var(--bg);color:var(--fg);font-family:'Inter Variable',system-ui,sans-serif}
    .scene .ref{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55}
    .scene .todo{position:absolute;left:4%;bottom:5%;padding:.4em .8em;border-radius:.4em;background:var(--accent);color:#000;font-size:${Math.round(height / 30)}px;font-weight:700}
    .reference-video{position:absolute;inset:0;width:100%;height:100%;opacity:.25;pointer-events:none}
  </style>`,
    body: sections + (ref ? `\n    <video class="reference-video" src="${ref}" muted data-start="0" data-track="99" data-name="Reference"></video>` : ''),
  });
  await writeFile(path.join(outDir, 'index.html'), html);
  const manifest: ProjectManifest = { name: `reverse-${path.basename(a.source, path.extname(a.source))}`, entry: 'index.html', output: { file: 'renders/reconstruction.mp4' } };
  await writeFile(path.join(outDir, 'hyperframes.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(path.join(outDir, 'analysis.json'), JSON.stringify({ ...a, source: path.basename(a.source) }, null, 2));
  await writeFile(path.join(outDir, 'report.md'), report(a));
  return { dir: outDir, analysis: a };
}

function report(a: VideoAnalysis): string {
  const v = a.info.video!;
  const lines = [
    `# Video analysis: ${path.basename(a.source)}`, '',
    `- Resolution: ${v.width}x${v.height} @ ${v.fps?.toFixed(2)} fps, codec ${v.codec}`,
    `- Duration: ${a.info.duration?.toFixed(2)} s — ${a.scenes.length} scene(s), average shot ${a.averageShotLength}s (${a.pacing} pacing)`,
    `- Audio: ${a.audio.present ? `${a.audio.loudness?.integratedLufs ?? '?'} LUFS integrated, ${a.audio.silences.length} silence(s)` : 'none'}`,
    `- Global palette: ${a.globalPalette.map((p) => `\`${p.hex}\` (${Math.round(p.weight * 100)}%)`).join(', ')}`, '',
    '| # | start | dur | camera | motion | brightness | palette | keyframe |', '|---|---|---|---|---|---|---|---|',
    ...a.scenes.map((s) => `| ${s.index} | ${s.start}s | ${s.duration}s | ${s.camera} | ${s.motionEnergy} | ${s.brightness} | ${s.palette.slice(0, 3).map((p) => `\`${p.hex}\``).join(' ')} | ![](${s.keyframe}) |`),
    '', '## Limits', '',
    '- Camera moves are estimated from global frame translation/zoom on a 64x36 proxy; complex moves are reported as "handheld".',
    '- No OCR or object recognition is performed: rebuild text and objects from the keyframes in `reference/`.',
    '- Scene cuts use FFmpeg scene scores; dissolves and very slow fades may not be detected (try a lower --threshold).', '',
  ];
  return lines.join('\n');
}
