/** Visual analysis: scene cuts, colour palettes, motion and brightness. */
import { ffmpeg } from './exec.ts';
import { decodeRgb } from './transcode.ts';
import { mulberry32 } from '@hfr/core';

export interface SceneCut { time: number; score: number }

/** Scene change detection using FFmpeg's scene score (0..1). */
export async function detectScenes(file: string, o: { threshold?: number; signal?: AbortSignal } = {}): Promise<SceneCut[]> {
  const threshold = o.threshold ?? 0.3;
  const { stderr } = await ffmpeg(['-i', file, '-an', '-vf', `select='gt(scene,${threshold})',metadata=print`, '-f', 'null', '-'], { signal: o.signal });
  const cuts: SceneCut[] = [];
  let pending: number | null = null;
  for (const line of stderr.split('\n')) {
    const pts = /pts_time:([\d.]+)/.exec(line);
    if (pts) pending = Number(pts[1]);
    const sc = /lavfi\.scene_score=([\d.]+)/.exec(line);
    if (sc && pending !== null) { cuts.push({ time: pending, score: Number(sc[1]) }); pending = null; }
  }
  return cuts;
}

export interface PaletteColor { hex: string; rgb: [number, number, number]; weight: number; luminance: number }

const toHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a), lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** k-means (k-means++ init, deterministic seed) over RGB pixels. */
export function kmeansPalette(rgb: Uint8Array | Buffer, k = 6, seed = 7): PaletteColor[] {
  const n = Math.floor(rgb.length / 3);
  if (n === 0) return [];
  const rand = mulberry32(seed);
  const px = (i: number): [number, number, number] => [rgb[i * 3]!, rgb[i * 3 + 1]!, rgb[i * 3 + 2]!];
  const dist = (a: number[], b: number[]) => (a[0]! - b[0]!) ** 2 + (a[1]! - b[1]!) ** 2 + (a[2]! - b[2]!) ** 2;
  const centers: number[][] = [px(Math.floor(rand() * n))];
  while (centers.length < Math.min(k, n)) {
    const d = new Float64Array(n);
    let total = 0;
    for (let i = 0; i < n; i++) {
      let m = Infinity;
      for (const c of centers) m = Math.min(m, dist(px(i), c));
      d[i] = m; total += m;
    }
    if (total === 0) break;
    let r = rand() * total, chosen = 0;
    for (let i = 0; i < n; i++) { r -= d[i]!; if (r <= 0) { chosen = i; break; } }
    centers.push(px(chosen));
  }
  const assign = new Int32Array(n);
  for (let iter = 0; iter < 20; iter++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      const p = px(i);
      let best = 0, bd = Infinity;
      centers.forEach((c, j) => { const dd = dist(p, c); if (dd < bd) { bd = dd; best = j; } });
      if (assign[i] !== best) { assign[i] = best; moved = true; }
    }
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) {
      const s = sums[assign[i]!]!;
      const p = px(i);
      s[0] = s[0]! + p[0]; s[1] = s[1]! + p[1]; s[2] = s[2]! + p[2]; s[3] = s[3]! + 1;
    }
    sums.forEach((s, j) => { if (s[3]! > 0) centers[j] = [s[0]! / s[3]!, s[1]! / s[3]!, s[2]! / s[3]!]; });
    if (!moved && iter > 0) break;
  }
  const counts = new Array<number>(centers.length).fill(0);
  for (let i = 0; i < n; i++) counts[assign[i]!]!++;
  return centers
    .map((c, j) => {
      const rgbc = c.map((v) => Math.round(v)) as [number, number, number];
      return { hex: toHex(rgbc), rgb: rgbc, weight: Math.round((counts[j]! / n) * 1000) / 1000, luminance: Math.round(relativeLuminance(rgbc) * 1000) / 1000 };
    })
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

export async function extractPalette(file: string, o: { k?: number; time?: number } = {}): Promise<PaletteColor[]> {
  const rgb = await decodeRgb(file, { width: 96, height: 54, time: o.time });
  return kmeansPalette(rgb, o.k ?? 6);
}

export interface FrameStats { brightness: number; saturation: number }

export function frameStats(rgb: Uint8Array | Buffer): FrameStats {
  let b = 0, s = 0;
  const n = Math.floor(rgb.length / 3);
  for (let i = 0; i < n; i++) {
    const r = rgb[i * 3]!, g = rgb[i * 3 + 1]!, bl = rgb[i * 3 + 2]!;
    const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl);
    b += (0.299 * r + 0.587 * g + 0.114 * bl) / 255;
    s += mx === 0 ? 0 : (mx - mn) / mx;
  }
  return { brightness: b / Math.max(1, n), saturation: s / Math.max(1, n) };
}

/**
 * Motion energy per sampled interval: mean absolute difference between
 * consecutive downscaled grayscale frames (0..1). Also estimates the dominant
 * global shift (pan direction) by testing small offsets.
 */
export async function motionProfile(file: string, o: { sampleFps?: number; start?: number; duration?: number } = {}): Promise<Array<{ time: number; energy: number; dx: number; dy: number; zoom: number }>> {
  const W = 64, H = 36, fps = o.sampleFps ?? 4;
  const args: string[] = [];
  if (o.start) args.push('-ss', String(o.start));
  args.push('-i', file);
  if (o.duration) args.push('-t', String(o.duration));
  args.push('-an', '-vf', `fps=${fps},scale=${W}:${H}:flags=area,format=gray`, '-f', 'rawvideo', 'pipe:1');
  const { stdout } = await ffmpeg(args, { binary: true });
  const size = W * H;
  const frames = Math.floor(stdout.length / size);
  const out: Array<{ time: number; energy: number; dx: number; dy: number; zoom: number }> = [];
  const at = (f: number, x: number, y: number) => stdout[f * size + y * W + x]!;
  for (let f = 1; f < frames; f++) {
    let energy = 0;
    for (let i = 0; i < size; i++) energy += Math.abs(stdout[f * size + i]! - stdout[(f - 1) * size + i]!);
    energy /= size * 255;
    // global translation search (±3 px at 64x36)
    let best = { dx: 0, dy: 0, err: Infinity };
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      let err = 0, cnt = 0;
      for (let y = 4; y < H - 4; y += 2) for (let x = 4; x < W - 4; x += 2) {
        err += Math.abs(at(f, x, y) - at(f - 1, x + dx, y + dy)); cnt++;
      }
      err /= cnt;
      if (err < best.err) best = { dx, dy, err };
    }
    // zoom estimate: compare against scaled previous frame around the centre
    let zoom = 1, zErr = Infinity;
    for (const z of [0.94, 0.97, 1, 1.03, 1.06]) {
      let err = 0, cnt = 0;
      for (let y = 6; y < H - 6; y += 2) for (let x = 8; x < W - 8; x += 2) {
        const sx = Math.round(W / 2 + (x - W / 2) / z), sy = Math.round(H / 2 + (y - H / 2) / z);
        err += Math.abs(at(f, x, y) - at(f - 1, sx, sy)); cnt++;
      }
      err /= cnt;
      if (err < zErr - 0.01) { zErr = err; zoom = z; }
    }
    out.push({ time: (f - 1) / fps + (o.start ?? 0), energy: Math.round(energy * 1000) / 1000, dx: -best.dx, dy: -best.dy, zoom });
  }
  return out;
}
