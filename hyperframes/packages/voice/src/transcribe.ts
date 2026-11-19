/**
 * Automatic transcription with word timestamps.
 *  - openai:  OpenAI audio/transcriptions (whisper-1, verbose_json + word granularity). Needs OPENAI_API_KEY.
 *  - whisper: the open-source `whisper` CLI (pip install openai-whisper), run locally.
 * Without either, use `alignText()` with a known script instead.
 */
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { run, toWav, which } from '@hfr/media';
import { parseCaptionJson, wordsToCues } from '@hfr/parsers';
import type { CaptionDocument, CaptionWord } from '@hfr/core';

export type TranscriptionProviderName = 'openai' | 'whisper';

export interface TranscribeOptions {
  provider?: TranscriptionProviderName;
  language?: string;
  model?: string;
  prompt?: string;
  signal?: AbortSignal;
}

export async function transcriptionProviders(): Promise<Record<TranscriptionProviderName, { ok: boolean; reason?: string }>> {
  return {
    openai: process.env.OPENAI_API_KEY ? { ok: true } : { ok: false, reason: 'set OPENAI_API_KEY' },
    whisper: (await which('whisper')) ? { ok: true } : { ok: false, reason: 'install the whisper CLI: pip install openai-whisper' },
  };
}

async function openaiTranscribe(file: string, o: TranscribeOptions): Promise<CaptionDocument> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'hfr-asr-'));
  try {
    // 16 kHz mono WAV keeps uploads small and is accepted by the API (25 MB limit ≈ 13 min)
    const wav = await toWav(file, path.join(tmp, 'audio.wav'), { sampleRate: 16000, channels: 1 });
    const form = new FormData();
    form.append('file', new Blob([await readFile(wav)], { type: 'audio/wav' }), 'audio.wav');
    form.append('model', o.model ?? 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'word');
    form.append('timestamp_granularities[]', 'segment');
    if (o.language) form.append('language', o.language.slice(0, 2));
    if (o.prompt) form.append('prompt', o.prompt);
    const res = await fetch(`${process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'}/audio/transcriptions`, {
      method: 'POST', headers: { authorization: `Bearer ${key}` }, body: form, signal: o.signal,
    });
    if (!res.ok) throw new Error(`OpenAI transcription ${res.status}: ${(await res.text()).slice(0, 500)}`);
    const data = (await res.json()) as { language?: string; words?: Array<{ word: string; start: number; end: number }>; segments?: unknown[] };
    if (data.words?.length) {
      const words: CaptionWord[] = data.words.map((w) => ({ text: w.word.trim(), start: w.start, end: w.end })).filter((w) => w.text);
      return { language: data.language, cues: wordsToCues(words) };
    }
    return parseCaptionJson(JSON.stringify(data));
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

async function whisperTranscribe(file: string, o: TranscribeOptions): Promise<CaptionDocument> {
  const bin = await which('whisper');
  if (!bin) throw new Error('whisper CLI not found (pip install openai-whisper)');
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'hfr-whisper-'));
  try {
    const args = [file, '--model', o.model ?? 'base', '--word_timestamps', 'True', '--output_format', 'json', '--output_dir', tmp, '--verbose', 'False'];
    if (o.language) args.push('--language', o.language.slice(0, 2));
    await run(bin, args, { signal: o.signal });
    const json = await readFile(path.join(tmp, `${path.basename(file, path.extname(file))}.json`), 'utf8');
    return parseCaptionJson(json);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

export async function transcribe(file: string, o: TranscribeOptions = {}): Promise<CaptionDocument & { provider: TranscriptionProviderName }> {
  const avail = await transcriptionProviders();
  const name = o.provider ?? (avail.openai.ok ? 'openai' : avail.whisper.ok ? 'whisper' : null);
  if (!name) throw new Error(`no transcription provider available (${avail.openai.reason}; or ${avail.whisper.reason}). Alternative: "hfr captions align <audio> <script.txt>"`);
  if (!avail[name].ok) throw new Error(`transcription provider "${name}" unavailable: ${avail[name].reason}`);
  const doc = name === 'openai' ? await openaiTranscribe(file, o) : await whisperTranscribe(file, o);
  return { ...doc, provider: name };
}
