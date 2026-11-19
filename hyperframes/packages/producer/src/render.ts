/**
 * Render pipeline
 *  1. load the project (single composition or scenes)
 *  2. serve it in render mode and open each scene in headless Chromium to read
 *     the resolved timeline (`hf.describe()`)
 *  3. capture frames in parallel workers; each worker pipes JPEG/PNG frames to
 *     its own FFmpeg process (one segment per worker)
 *  4. join segments, apply scene transitions (xfade), mix audio, encode, mux
 *  5. verify the output with FFprobe
 */
import { mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { frameCount, loadProject, safeJoin, sceneOffsets, type LoadedProject } from '@hfr/core';
import { captureFrame, launchBrowser, openComposition, startCompositionServer, type RuntimeDescription } from '@hfr/engine';
import { FFMPEG, ffmpeg, probe, requireFfmpeg, spawnPiped, type MediaInfo } from '@hfr/media';
import { xfadeOptions } from '@hfr/shader-transitions';
import type { Browser } from 'playwright-core';
import { buildAudioMix, type MixTrack } from './audio-mix.ts';
import { MEZZANINE, encodeSettings, formatFromPath, type OutputFormat, type Quality } from './encode.ts';

export interface RenderProgress {
  phase: 'plan' | 'frames' | 'encode' | 'done';
  percent: number;
  scene?: number;
  frame?: number;
  totalFrames?: number;
  fps?: number;
  etaSeconds?: number;
  message?: string;
}

export interface RenderOptions {
  project: string;
  output: string;
  format?: OutputFormat;
  /** Output size (scales the rendered frames). Defaults to the composition size. */
  width?: number;
  height?: number;
  /** Device scale factor used while capturing (e.g. 2 renders a 1080p layout at 4K). */
  scale?: number;
  fps?: number;
  quality?: Quality;
  crf?: number;
  frameFormat?: 'jpeg' | 'png';
  jpegQuality?: number;
  workers?: number;
  /** Render only part of a single-scene project (seconds). */
  range?: { start: number; end: number };
  /** Captions file to embed as a soft subtitle track (MP4: mov_text, WebM: WebVTT). */
  subtitles?: string;
  /** Continue even if the runtime reported errors. */
  allowErrors?: boolean;
  browser?: Browser;
  signal?: AbortSignal;
  onProgress?: (p: RenderProgress) => void;
  log?: (msg: string) => void;
  keepTemp?: boolean;
}

export interface RenderResult {
  output: string;
  format: OutputFormat;
  width: number;
  height: number;
  fps: number;
  duration: number;
  frames: number;
  size: number;
  scenes: Array<{ src: string; duration: number; frames: number }>;
  audioTracks: number;
  warnings: string[];
  timings: { planMs: number; framesMs: number; encodeMs: number; totalMs: number };
  probe: MediaInfo;
}

export class RenderError extends Error {
  readonly details: string[];
  constructor(message: string, details: string[] = []) {
    super(details.length ? `${message}\n  - ${details.join('\n  - ')}` : message);
    this.name = 'RenderError';
    this.details = details;
  }
}

interface ScenePlan {
  index: number;
  src: string;
  url: string;
  desc: RuntimeDescription;
  start: number; // first rendered time within the scene
  duration: number; // rendered duration
  frames: number;
  transition?: { type: string; duration: number };
  file?: string; // rendered scene video
}

const now = () => performance.now();

function defaultWorkers(frames: number): number {
  const cpus = os.availableParallelism?.() ?? os.cpus().length;
  if (frames < 45) return 1;
  return Math.max(1, Math.min(6, Math.floor(cpus / 2)));
}

export async function renderProject(o: RenderOptions): Promise<RenderResult> {
  const t0 = now();
  await requireFfmpeg();
  const format = o.format ?? formatFromPath(o.output) ?? 'mp4';
  const quality = o.quality ?? 'standard';
  const warnings: string[] = [];
  const log = o.log ?? (() => {});
  const progress = (p: RenderProgress) => o.onProgress?.(p);
  const project: LoadedProject = await loadProject(o.project);
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'hfr-render-'));
  const server = await startCompositionServer({ root: project.root, mode: 'render', log });
  const ownBrowser = !o.browser;
  const browser = o.browser ?? (await launchBrowser());
  const abort = () => { if (o.signal?.aborted) throw new RenderError('render cancelled'); };

  try {
    // ------------------------------------------------------------ plan
    progress({ phase: 'plan', percent: 0, message: 'reading compositions' });
    const plans: ScenePlan[] = [];
    for (const [index, scene] of project.scenes.entries()) {
      abort();
      const url = new URL(scene.relative.split('/').map(encodeURIComponent).join('/'), server.url).href;
      const cfg = scene.composition.config;
      const comp = await openComposition(browser, url, { width: cfg.width, height: cfg.height });
      const desc = comp.description;
      const issues = [...desc.errors, ...comp.logs.filter((l) => l.type === 'pageerror' || l.type === 'requestfailed' || l.type === 'http-error').map((l) => `${l.type}: ${l.text} ${l.url ?? ''}`.trim())];
      await comp.close();
      if (issues.length && !o.allowErrors) throw new RenderError(`scene ${scene.relative} has errors (use --allow-errors to render anyway)`, issues);
      warnings.push(...issues.map((i) => `${scene.relative}: ${i}`), ...desc.warnings.map((w) => `${scene.relative}: ${w}`));
      const fps = o.fps ?? desc.config.fps;
      let start = 0;
      let duration = scene.def.duration ?? desc.config.duration;
      if (o.range) {
        if (project.scenes.length > 1) throw new RenderError('--range is only supported for single-scene projects');
        start = Math.max(0, o.range.start);
        duration = Math.max(0, Math.min(duration, o.range.end) - start);
      }
      if (!(duration > 0)) throw new RenderError(`scene ${scene.relative} has zero duration (set data-duration on the composition root)`);
      plans.push({ index, src: scene.relative, url, desc, start, duration, frames: frameCount(duration, fps), transition: scene.def.transition });
    }
    const first = plans[0]!;
    const fps = o.fps ?? first.desc.config.fps;
    const compW = first.desc.config.width, compH = first.desc.config.height;
    for (const p of plans) {
      if (p.desc.config.width !== compW || p.desc.config.height !== compH) {
        throw new RenderError(`all scenes must share the same size: ${p.src} is ${p.desc.config.width}x${p.desc.config.height}, expected ${compW}x${compH}`);
      }
      if (!o.fps && p.desc.config.fps !== fps) warnings.push(`${p.src}: fps ${p.desc.config.fps} differs from ${fps}; rendering at ${fps}`);
    }
    const scale = o.scale ?? 1;
    const capW = Math.round(compW * scale), capH = Math.round(compH * scale);
    let outW = o.width ?? capW, outH = o.height ?? capH;
    if (o.width && !o.height) outH = Math.round((o.width / capW) * capH);
    if (o.height && !o.width) outW = Math.round((o.height / capH) * capW);
    if (format !== 'gif' && (outW % 2 || outH % 2)) {
      warnings.push(`output size ${outW}x${outH} rounded to even dimensions for ${format}`);
      outW -= outW % 2; outH -= outH % 2;
    }
    const scaleFilter = outW !== capW || outH !== capH ? `scale=${outW}:${outH}:flags=lanczos` : null;
    const planMs = now() - t0;

    // ---------------------------------------------------------- frames
    const tFrames = now();
    const totalFrames = plans.reduce((n, p) => n + p.frames, 0);
    let done = 0;
    const startedAt = now();
    const singleFast = plans.length === 1 && format === 'mp4';
    const finalEnc = encodeSettings(format, quality, { crf: o.crf, fps });
    const frameFormat = o.frameFormat ?? 'jpeg';
    for (const plan of plans) {
      abort();
      const workers = Math.max(1, Math.min(o.workers ?? defaultWorkers(plan.frames), plan.frames));
      const per = Math.ceil(plan.frames / workers);
      const segments: string[] = [];
      await Promise.all(Array.from({ length: workers }, async (_, w) => {
        const from = w * per;
        const to = Math.min(plan.frames, from + per);
        if (from >= to) return;
        const seg = path.join(tmp, `scene${plan.index}-seg${String(w).padStart(3, '0')}.mp4`);
        segments[w] = seg;
        const comp = await openComposition(browser, plan.url, { width: compW, height: compH, scale });
        const args = [
          '-hide_banner', '-loglevel', 'error', '-y',
          '-f', 'image2pipe', '-framerate', String(fps), '-c:v', frameFormat === 'png' ? 'png' : 'mjpeg', '-i', '-',
          ...(singleFast && scaleFilter ? ['-vf', scaleFilter] : []),
          ...(singleFast ? finalEnc.video : [...MEZZANINE, '-r', String(fps)]),
          '-an', seg,
        ];
        const enc = spawnPiped(FFMPEG, args, { signal: o.signal });
        try {
          for (let i = from; i < to; i++) {
            abort();
            const t = plan.start + i / fps;
            // the clip is in CSS pixels; the device scale factor multiplies the output resolution
            const buf = await captureFrame(comp, t, { format: frameFormat, quality: o.jpegQuality ?? 92, width: compW, height: compH });
            await enc.write(buf);
            done++;
            const elapsed = (now() - startedAt) / 1000;
            const rate = done / Math.max(1e-3, elapsed);
            if (done % 5 === 0 || done === totalFrames) {
              progress({ phase: 'frames', percent: (done / totalFrames) * 90, scene: plan.index, frame: done, totalFrames, fps: Math.round(rate * 10) / 10, etaSeconds: Math.round((totalFrames - done) / rate) });
            }
          }
          await enc.end();
        } catch (e) {
          enc.child.kill('SIGKILL');
          throw e;
        } finally {
          await comp.close();
        }
      }));
      const list = path.join(tmp, `scene${plan.index}-segments.txt`);
      await writeFile(list, segments.filter(Boolean).map((s) => `file '${s.replace(/'/g, "'\\''")}'`).join('\n'));
      plan.file = path.join(tmp, `scene${plan.index}.mp4`);
      await ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', plan.file], { signal: o.signal });
    }
    const framesMs = now() - tFrames;

    // ---------------------------------------------------------- encode
    const tEnc = now();
    progress({ phase: 'encode', percent: 92, message: 'mixing audio and encoding' });
    const durations = plans.map((p) => p.frames / fps);
    const { offsets, total } = sceneOffsets(durations, plans.map((p) => p.transition?.duration));
    const tracks: MixTrack[] = [];
    for (const [i, plan] of plans.entries()) {
      for (const c of plan.desc.clips) {
        const isAudio = c.kind === 'audio' || (c.kind === 'video' && !c.muted);
        if (!isAudio || !c.src) continue;
        const file = safeJoin(project.root, c.src);
        const info = await probe(file).catch(() => null);
        if (!info?.audio) { if (c.kind === 'audio') warnings.push(`${plan.src}: ${c.src} has no audio stream`); continue; }
        // clip window intersected with the rendered window of the scene
        const clipStart = Math.max(c.start, plan.start);
        const clipEnd = Math.min(c.end, plan.start + plan.duration);
        if (clipEnd <= clipStart) continue;
        tracks.push({
          id: `${plan.src}#${c.id}`, file, start: offsets[i]! + (clipStart - plan.start), duration: clipEnd - clipStart,
          mediaStart: c.mediaStart + (clipStart - c.start), volume: c.volume, fadeIn: clipStart === c.start ? c.fadeIn : 0, fadeOut: c.fadeOut, loop: c.loop,
        });
      }
    }
    for (const [i, a] of (project.manifest.audio ?? []).entries()) {
      const file = safeJoin(project.root, a.src);
      const info = await probe(file).catch(() => { throw new RenderError(`manifest audio[${i}] not found: ${a.src}`); });
      const len = a.duration ?? (a.loop ? total - (a.start ?? 0) : Math.max(0, (info.duration ?? 0) - (a.mediaStart ?? 0)));
      tracks.push({
        id: a.id ?? `audio${i}`, file, start: a.start ?? 0, duration: len, mediaStart: a.mediaStart ?? 0, volume: a.volume ?? 1,
        fadeIn: a.fadeIn ?? 0, fadeOut: a.fadeOut ?? 0, loop: !!a.loop, role: a.role, duckUnder: a.duckUnder,
      });
    }
    await mkdir(path.dirname(path.resolve(o.output)), { recursive: true });
    const output = path.resolve(o.output);
    const mix = finalEnc.audio ? buildAudioMix(tracks, total, plans.length) : null;
    const subtitles = o.subtitles ?? (project.manifest.captions?.embed ? safeJoin(project.root, project.manifest.captions.src) : undefined);
    const subtitleIndex = plans.length + (mix ? tracks.filter((t) => t.duration > 0 && t.start < total && t.volume > 0).length : 0);

    if (singleFast && !mix && !subtitles) {
      await ffmpeg(['-i', plans[0]!.file!, '-c', 'copy', ...finalEnc.container, output], { signal: o.signal });
    } else {
      const args: string[] = [];
      for (const p of plans) args.push('-i', p.file!);
      if (mix) args.push(...mix.inputs);
      if (subtitles) args.push('-i', await prepareSubtitles(subtitles, tmp, format));
      const filters: string[] = [];
      let vLabel = '0:v';
      if (!singleFast) {
        plans.forEach((_, i) => filters.push(`[${i}:v]settb=AVTB,fps=${fps},format=yuv420p,setsar=1[v${i}]`));
        vLabel = 'v0';
        for (let i = 1; i < plans.length; i++) {
          const tr = plans[i]!.transition;
          const out = `x${i}`;
          if (tr) {
            const offset = offsets[i]!;
            filters.push(`[${vLabel}][v${i}]xfade=${xfadeOptions(tr.type)}:duration=${tr.duration}:offset=${offset.toFixed(6)}[${out}]`);
          } else {
            filters.push(`[${vLabel}][v${i}]concat=n=2:v=1:a=0[${out}]`);
          }
          vLabel = out;
        }
        if (scaleFilter) { filters.push(`[${vLabel}]${scaleFilter}[vs]`); vLabel = 'vs'; }
        if (format === 'gif') {
          const gfps = Math.min(fps, 20);
          filters.push(`[${vLabel}]fps=${gfps},split[g1][g2];[g1]palettegen=stats_mode=diff[pal];[g2][pal]paletteuse=dither=bayer:bayer_scale=4[gif]`);
          vLabel = 'gif';
        }
      }
      if (mix) filters.push(mix.filter);
      if (filters.length) args.push('-filter_complex', filters.join(';'));
      args.push('-map', vLabel.includes(':') ? vLabel : `[${vLabel}]`);
      if (mix) args.push('-map', `[${mix.outLabel}]`);
      if (subtitles) args.push('-map', `${subtitleIndex}:s`, '-c:s', format === 'webm' ? 'webvtt' : 'mov_text');
      args.push(...(singleFast ? ['-c:v', 'copy'] : finalEnc.video));
      if (mix && finalEnc.audio) args.push(...finalEnc.audio);
      args.push('-t', total.toFixed(6), ...finalEnc.container, output);
      log(`ffmpeg ${args.join(' ')}`);
      await ffmpeg(args, { signal: o.signal });
    }
    const encodeMs = now() - tEnc;

    // ---------------------------------------------------------- verify
    const info = await probe(output);
    const outFrames = Math.round(total * fps);
    if (info.duration !== null && Math.abs(info.duration - total) > Math.max(2 / fps, 0.1)) {
      warnings.push(`output duration ${info.duration.toFixed(3)}s differs from expected ${total.toFixed(3)}s`);
    }
    if (format !== 'gif' && info.video && (info.video.width !== outW || info.video.height !== outH)) {
      warnings.push(`output size ${info.video.width}x${info.video.height} differs from expected ${outW}x${outH}`);
    }
    progress({ phase: 'done', percent: 100 });
    return {
      output, format, width: outW, height: outH, fps, duration: total, frames: outFrames, size: (await stat(output)).size,
      scenes: plans.map((p) => ({ src: p.src, duration: p.frames / fps, frames: p.frames })),
      audioTracks: mix ? tracks.length : 0, warnings,
      timings: { planMs: Math.round(planMs), framesMs: Math.round(framesMs), encodeMs: Math.round(encodeMs), totalMs: Math.round(now() - t0) },
      probe: info,
    };
  } finally {
    await server.close();
    if (ownBrowser) await browser.close().catch(() => {});
    if (!o.keepTemp) await rm(tmp, { recursive: true, force: true });
  }
}

/** Converts any supported captions file into a format FFmpeg can mux. */
async function prepareSubtitles(file: string, tmp: string, format: OutputFormat): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  const { parseCaptions, toSrt, toVtt } = await import('@hfr/parsers');
  const doc = parseCaptions(file, await readFile(file, 'utf8'));
  const out = path.join(tmp, format === 'webm' ? 'subs.vtt' : 'subs.srt');
  await writeFile(out, format === 'webm' ? toVtt(doc) : toSrt(doc));
  return out;
}
