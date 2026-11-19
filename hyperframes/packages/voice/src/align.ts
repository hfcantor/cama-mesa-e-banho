/**
 * Offline word alignment (no ML model): finds speech regions with FFmpeg's
 * silencedetect and distributes the words of a known script across them,
 * proportionally to word length. Accurate to roughly a word at normal speech
 * rates — good for karaoke captions when no timestamped TTS/ASR is available.
 * For exact timings use a provider that returns word timestamps.
 */
import { detectSilence, probe } from '@hfr/media';
import type { CaptionWord } from '@hfr/core';

export interface AlignOptions {
  noiseDb?: number;
  minSilence?: number;
}

const weight = (w: string) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, '').length) + 1.5;

export function alignToRegions(words: string[], regions: Array<{ start: number; end: number }>): CaptionWord[] {
  if (!words.length || !regions.length) return [];
  const total = regions.reduce((a, r) => a + (r.end - r.start), 0);
  const weights = words.map(weight);
  const wTotal = weights.reduce((a, b) => a + b, 0);
  /** Maps a position on the "speech only" axis to absolute time. `preferNext` skips to the next region at a boundary. */
  const toTime = (speech: number, preferNext: boolean): number => {
    let acc = 0;
    for (let i = 0; i < regions.length; i++) {
      const r = regions[i]!;
      const len = r.end - r.start;
      const atBoundary = Math.abs(speech - (acc + len)) < 1e-9;
      if (speech < acc + len - 1e-9 || (atBoundary && (!preferNext || i === regions.length - 1))) return r.start + (speech - acc);
      acc += len;
    }
    return regions[regions.length - 1]!.end;
  };
  const out: CaptionWord[] = [];
  let cum = 0;
  for (let i = 0; i < words.length; i++) {
    const a = (cum / wTotal) * total;
    cum += weights[i]!;
    const b = (cum / wTotal) * total;
    const start = toTime(a, true);
    let end = toTime(b, false);
    if (end < start) end = start;
    out.push({ text: words[i]!, start, end });
  }
  return out;
}

export async function alignText(audioFile: string, text: string, o: AlignOptions = {}): Promise<CaptionWord[]> {
  const info = await probe(audioFile);
  const duration = info.duration ?? 0;
  const silences = await detectSilence(audioFile, { noiseDb: o.noiseDb ?? -38, minDuration: o.minSilence ?? 0.18 });
  const regions: Array<{ start: number; end: number }> = [];
  let t = 0;
  for (const s of silences) {
    if (s.start > t + 0.03) regions.push({ start: t, end: Math.min(s.start, duration) });
    t = Math.min(duration, s.end);
  }
  if (t < duration - 0.03) regions.push({ start: t, end: duration });
  const words = text.split(/\s+/).filter(Boolean);
  return alignToRegions(words, regions.length ? regions : [{ start: 0, end: duration }]);
}
