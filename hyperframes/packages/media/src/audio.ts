/**
 * Offline audio analysis used for audio-reactive visuals and for diagnostics.
 * Analysis is computed per video frame so renders stay deterministic
 * (a Web Audio AnalyserNode depends on real-time playback and cannot be used).
 */
import { decodePcm } from './transcode.ts';
import { fftMagnitudes, hann } from './fft.ts';
import { ffmpeg } from './exec.ts';

export interface AudioAnalysis {
  fps: number;
  bands: number;
  duration: number;
  /** frames[i] = [rms, band0..bandN-1], all normalised to 0..1 */
  frames: number[][];
}

/** Log-spaced band edges between 30 Hz and 16 kHz. */
function bandEdges(bands: number, sampleRate: number, fftSize: number): number[] {
  const lo = Math.log(30), hi = Math.log(Math.min(16000, sampleRate / 2));
  const edges: number[] = [];
  for (let i = 0; i <= bands; i++) {
    const f = Math.exp(lo + ((hi - lo) * i) / bands);
    edges.push(Math.max(1, Math.round((f * fftSize) / sampleRate)));
  }
  return edges;
}

export function analyzeSamples(samples: Float32Array, sampleRate: number, fps: number, bands = 32): AudioAnalysis {
  const fftSize = 2048;
  const win = hann(fftSize);
  const hop = sampleRate / fps;
  const nFrames = Math.max(1, Math.ceil(samples.length / hop));
  const edges = bandEdges(bands, sampleRate, fftSize);
  const raw: number[][] = [];
  const buf = new Float32Array(fftSize);
  let maxRms = 1e-9;
  const maxBand = new Array<number>(bands).fill(1e-9);
  for (let f = 0; f < nFrames; f++) {
    const center = Math.floor(f * hop + hop / 2);
    const start = center - fftSize / 2;
    let sum = 0;
    const s0 = Math.floor(f * hop), s1 = Math.min(samples.length, Math.floor((f + 1) * hop));
    for (let i = s0; i < s1; i++) sum += samples[i]! * samples[i]!;
    const rms = Math.sqrt(sum / Math.max(1, s1 - s0));
    for (let i = 0; i < fftSize; i++) {
      const idx = start + i;
      buf[i] = idx >= 0 && idx < samples.length ? samples[idx]! : 0;
    }
    const mags = fftMagnitudes(buf, win);
    const row = [rms];
    for (let b = 0; b < bands; b++) {
      const a = edges[b]!, z = Math.max(edges[b]! + 1, edges[b + 1]!);
      let m = 0;
      for (let k = a; k < z && k < mags.length; k++) m = Math.max(m, mags[k]!);
      // perceptual compression
      const v = Math.log10(1 + 100 * m) / 2;
      row.push(v);
      maxBand[b] = Math.max(maxBand[b]!, v);
    }
    maxRms = Math.max(maxRms, rms);
    raw.push(row);
  }
  const globalBandMax = Math.max(...maxBand);
  const frames = raw.map((row) => [
    round(row[0]! / maxRms),
    ...row.slice(1).map((v) => round(Math.min(1, v / globalBandMax))),
  ]);
  return { fps, bands, duration: samples.length / sampleRate, frames };
}

const round = (v: number) => Math.round(v * 1000) / 1000;

export async function analyzeAudio(file: string, o: { fps: number; bands?: number; signal?: AbortSignal }): Promise<AudioAnalysis> {
  const { samples, sampleRate } = await decodePcm(file, { sampleRate: 22050, signal: o.signal });
  return analyzeSamples(samples, sampleRate, o.fps, o.bands ?? 32);
}

export interface SilenceRange { start: number; end: number }

/** Silence detection (FFmpeg silencedetect). */
export async function detectSilence(file: string, o: { noiseDb?: number; minDuration?: number } = {}): Promise<SilenceRange[]> {
  const { stderr } = await ffmpeg(['-i', file, '-af', `silencedetect=noise=${o.noiseDb ?? -35}dB:d=${o.minDuration ?? 0.25}`, '-f', 'null', '-']);
  const out: SilenceRange[] = [];
  let start: number | null = null;
  for (const line of stderr.split('\n')) {
    const s = /silence_start: (-?[\d.]+)/.exec(line);
    if (s) start = Math.max(0, Number(s[1]));
    const e = /silence_end: ([\d.]+)/.exec(line);
    if (e && start !== null) { out.push({ start, end: Number(e[1]) }); start = null; }
  }
  if (start !== null) out.push({ start, end: Number.POSITIVE_INFINITY });
  return out;
}

export interface Loudness { integratedLufs: number | null; truePeakDb: number | null; meanVolumeDb: number | null; maxVolumeDb: number | null }

export async function measureLoudness(file: string): Promise<Loudness> {
  const { stderr } = await ffmpeg(['-i', file, '-vn', '-af', 'ebur128=peak=true,volumedetect', '-f', 'null', '-']);
  const pick = (re: RegExp) => { const all = [...stderr.matchAll(re)]; const m = all[all.length - 1]; return m ? Number(m[1]) : null; };
  return {
    integratedLufs: pick(/I:\s+(-?[\d.]+) LUFS/g),
    truePeakDb: pick(/Peak:\s+(-?[\d.]+) dBFS/g),
    meanVolumeDb: pick(/mean_volume: (-?[\d.]+) dB/g),
    maxVolumeDb: pick(/max_volume: (-?[\d.]+) dB/g),
  };
}
