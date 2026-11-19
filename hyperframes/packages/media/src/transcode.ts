/** Transcoding and extraction helpers (all real FFmpeg invocations). */
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { ffmpeg, type RunOptions } from './exec.ts';

export interface FrameExtractOptions {
  fps: number;
  maxWidth?: number;
  maxHeight?: number;
  /** JPEG quality scale 2 (best) … 31 (worst). */
  qscale?: number;
  start?: number;
  duration?: number;
  signal?: AbortSignal;
}

/** Extracts frames at an exact rate: file N (0-based, %06d.jpg) shows time N/fps. */
export async function extractFrames(src: string, outDir: string, o: FrameExtractOptions): Promise<number> {
  await mkdir(outDir, { recursive: true });
  const filters = [`fps=${o.fps}`];
  if (o.maxWidth || o.maxHeight) {
    const w = o.maxWidth ?? -2, h = o.maxHeight ?? -2;
    filters.push(`scale='min(${w === -2 ? 'iw' : w},iw)':'min(${h === -2 ? 'ih' : h},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`);
  }
  const args: string[] = [];
  if (o.start) args.push('-ss', String(o.start));
  args.push('-i', src);
  if (o.duration) args.push('-t', String(o.duration));
  args.push('-vf', filters.join(','), '-q:v', String(o.qscale ?? 3), '-start_number', '0', path.join(outDir, '%06d.jpg'));
  await ffmpeg(args, { signal: o.signal });
  return (await readdir(outDir)).filter((f) => f.endsWith('.jpg')).length;
}

export async function thumbnail(src: string, out: string, time = 0, width = 480, opts: RunOptions = {}): Promise<string> {
  await mkdir(path.dirname(out), { recursive: true });
  await ffmpeg(['-ss', String(Math.max(0, time)), '-i', src, '-frames:v', '1', '-vf', `scale=${width}:-2`, '-q:v', '3', out], opts);
  return out;
}

export type WebCodec = 'h264' | 'vp9';

/** Normalises any input into a browser/encoder friendly file. */
export async function transcode(src: string, out: string, o: { codec?: WebCodec; maxHeight?: number; crf?: number; fps?: number; audio?: boolean; signal?: AbortSignal } = {}): Promise<string> {
  await mkdir(path.dirname(out), { recursive: true });
  const codec = o.codec ?? 'h264';
  const vf: string[] = [];
  if (o.fps) vf.push(`fps=${o.fps}`);
  if (o.maxHeight) vf.push(`scale=-2:'min(${o.maxHeight},ih)'`);
  const args = ['-i', src];
  if (vf.length) args.push('-vf', vf.join(','));
  if (codec === 'h264') args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', String(o.crf ?? 20), '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  else args.push('-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(o.crf ?? 32), '-row-mt', '1');
  if (o.audio === false) args.push('-an');
  else args.push('-c:a', codec === 'h264' ? 'aac' : 'libopus', '-b:a', '160k');
  args.push(out);
  await ffmpeg(args, { signal: o.signal });
  return out;
}

export async function toWav(src: string, out: string, o: { sampleRate?: number; channels?: number; signal?: AbortSignal } = {}): Promise<string> {
  await mkdir(path.dirname(out), { recursive: true });
  await ffmpeg(['-i', src, '-vn', '-ac', String(o.channels ?? 1), '-ar', String(o.sampleRate ?? 16000), '-c:a', 'pcm_s16le', out], { signal: o.signal });
  return out;
}

export async function toMp3(src: string, out: string, bitrate = '192k'): Promise<string> {
  await mkdir(path.dirname(out), { recursive: true });
  await ffmpeg(['-i', src, '-vn', '-c:a', 'libmp3lame', '-b:a', bitrate, out]);
  return out;
}

/** Decodes audio to mono float32 PCM in memory. */
export async function decodePcm(src: string, o: { sampleRate?: number; start?: number; duration?: number; signal?: AbortSignal } = {}): Promise<{ samples: Float32Array; sampleRate: number }> {
  const sampleRate = o.sampleRate ?? 44100;
  const args: string[] = [];
  if (o.start) args.push('-ss', String(o.start));
  args.push('-i', src);
  if (o.duration) args.push('-t', String(o.duration));
  args.push('-vn', '-ac', '1', '-ar', String(sampleRate), '-f', 'f32le', 'pipe:1');
  const { stdout } = await ffmpeg(args, { binary: true, signal: o.signal });
  const buf = stdout.buffer.slice(stdout.byteOffset, stdout.byteOffset + stdout.byteLength - (stdout.byteLength % 4));
  return { samples: new Float32Array(buf), sampleRate };
}

/** Decodes a (downscaled) frame of an image/video into raw RGB bytes. */
export async function decodeRgb(src: string, o: { width: number; height: number; time?: number }): Promise<Buffer> {
  const args: string[] = [];
  if (o.time) args.push('-ss', String(o.time));
  args.push('-i', src, '-frames:v', '1', '-vf', `scale=${o.width}:${o.height}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1');
  const { stdout } = await ffmpeg(args, { binary: true });
  return stdout;
}

/** Generates test media (used by tests, demos and the doctor command). */
export async function generateTone(out: string, o: { duration: number; frequency?: number; sampleRate?: number }): Promise<string> {
  await mkdir(path.dirname(out), { recursive: true });
  await ffmpeg(['-f', 'lavfi', '-i', `sine=frequency=${o.frequency ?? 440}:sample_rate=${o.sampleRate ?? 44100}:duration=${o.duration}`, out]);
  return out;
}

export async function generateTestVideo(out: string, o: { duration: number; width?: number; height?: number; fps?: number; source?: string; audio?: boolean }): Promise<string> {
  await mkdir(path.dirname(out), { recursive: true });
  const w = o.width ?? 640, h = o.height ?? 360, fps = o.fps ?? 30;
  const src = o.source ?? `testsrc2=size=${w}x${h}:rate=${fps}`;
  const args = ['-f', 'lavfi', '-i', src];
  if (o.audio) args.push('-f', 'lavfi', '-i', `sine=frequency=330:duration=${o.duration}`);
  args.push('-t', String(o.duration), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast');
  if (o.audio) args.push('-c:a', 'aac', '-shortest');
  args.push(out);
  await ffmpeg(args);
  return out;
}
