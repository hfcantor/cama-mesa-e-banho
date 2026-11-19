/**
 * Narration builder: synthesises one audio file per line, concatenates them
 * with pauses into a single track and produces word-timed captions for the
 * whole narration (ready for data-hf-captions).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ffmpeg } from '@hfr/media';
import type { CaptionDocument } from '@hfr/core';
import { synthesize, type TtsProviderName } from './tts.ts';

export interface NarrationLine { text: string; pauseAfter?: number }

export interface NarrationResult {
  audio: string;
  captions: string;
  duration: number;
  lines: Array<{ text: string; file: string; start: number; end: number; timing: 'provider' | 'aligned' }>;
  document: CaptionDocument;
  provider: TtsProviderName;
}

export async function buildNarration(lines: NarrationLine[], o: { outDir: string; provider?: TtsProviderName; voice?: string; language?: string; rate?: number; pause?: number; format?: 'mp3' | 'wav' }): Promise<NarrationResult> {
  await mkdir(o.outDir, { recursive: true });
  const ext = o.format ?? 'mp3';
  const parts: NarrationResult['lines'] = [];
  const doc: CaptionDocument = { language: o.language, cues: [] };
  let t = 0;
  let provider: TtsProviderName | null = null;
  for (const [i, line] of lines.entries()) {
    const file = path.join(o.outDir, `line-${String(i + 1).padStart(2, '0')}.${ext}`);
    const r = await synthesize({ text: line.text, out: file, provider: o.provider, voice: o.voice, language: o.language, rate: o.rate });
    provider = r.provider;
    parts.push({ text: line.text, file, start: t, end: t + r.duration, timing: r.timing });
    doc.cues.push({ start: t, end: t + r.duration, text: line.text, words: r.words.map((w) => ({ text: w.text, start: w.start + t, end: w.end + t })) });
    t += r.duration + (line.pauseAfter ?? o.pause ?? 0.35);
  }
  const total = parts.length ? parts[parts.length - 1]!.end : 0;
  const audio = path.join(o.outDir, `narration.${ext}`);
  const inputs = parts.flatMap((p) => ['-i', p.file]);
  const filter = parts.map((p, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${Math.round(p.start * 1000)}:all=1[a${i}]`).join(';') +
    `;${parts.map((_, i) => `[a${i}]`).join('')}amix=inputs=${parts.length}:normalize=0:duration=longest,atrim=duration=${total.toFixed(3)}[out]`;
  await ffmpeg([...inputs, '-filter_complex', filter, '-map', '[out]', ...(ext === 'mp3' ? ['-c:a', 'libmp3lame', '-b:a', '192k'] : ['-c:a', 'pcm_s16le']), audio]);
  const captions = path.join(o.outDir, 'narration.captions.json');
  await writeFile(captions, JSON.stringify(doc, null, 2));
  return { audio, captions, duration: total, lines: parts, document: doc, provider: provider ?? 'espeak' };
}
