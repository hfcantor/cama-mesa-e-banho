/**
 * Text-to-speech providers.
 *  - espeak:      local espeak-ng binary (offline, robotic but free)
 *  - command:     any local CLI (piper, edge-tts, say…) via HFR_TTS_COMMAND template
 *  - elevenlabs:  ElevenLabs REST API (needs ELEVENLABS_API_KEY) — returns character timings
 *  - openai:      OpenAI audio/speech API (needs OPENAI_API_KEY)
 * Providers that do not return timings are aligned offline (see align.ts).
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { probe, run, which, type MediaInfo } from '@hfr/media';
import type { CaptionWord } from '@hfr/core';
import { alignText } from './align.ts';

export type TtsProviderName = 'espeak' | 'command' | 'elevenlabs' | 'openai';

export interface TtsRequest {
  text: string;
  /** Output file (.wav or .mp3 depending on provider; extension is respected when possible). */
  out: string;
  voice?: string;
  language?: string;
  /** Words per minute (espeak) or speed multiplier (openai: 0.25..4). */
  rate?: number;
  model?: string;
  signal?: AbortSignal;
}

export interface TtsResult {
  file: string;
  provider: TtsProviderName;
  duration: number;
  words: CaptionWord[];
  /** "provider" = timings returned by the service, "aligned" = offline estimate. */
  timing: 'provider' | 'aligned';
  info: MediaInfo;
}

export interface TtsProvider {
  name: TtsProviderName;
  available(): Promise<{ ok: boolean; reason?: string }>;
  synthesize(req: TtsRequest): Promise<{ file: string; words?: CaptionWord[] }>;
}

class ProviderUnavailable extends Error {}

// ---------------------------------------------------------------- espeak
export const espeak: TtsProvider = {
  name: 'espeak',
  async available() {
    const bin = (await which('espeak-ng')) ?? (await which('espeak'));
    return bin ? { ok: true } : { ok: false, reason: 'espeak-ng not installed (apt install espeak-ng / brew install espeak-ng)' };
  },
  async synthesize(req) {
    const bin = (await which('espeak-ng')) ?? (await which('espeak'));
    if (!bin) throw new ProviderUnavailable('espeak-ng not installed');
    await mkdir(path.dirname(req.out), { recursive: true });
    const wav = req.out.endsWith('.wav') ? req.out : req.out.replace(/\.[^.]+$/, '') + '.wav';
    const voice = req.voice ?? (req.language ? req.language.toLowerCase() : 'en');
    await run(bin, ['-v', voice, '-s', String(Math.round(req.rate ?? 165)), '-w', wav, '--stdin'], { input: req.text, signal: req.signal });
    if (wav !== req.out) {
      const { toMp3 } = await import('@hfr/media');
      await toMp3(wav, req.out);
    }
    return { file: req.out };
  },
};

// --------------------------------------------------------------- command
/** HFR_TTS_COMMAND example: `piper --model pt_BR-faber-medium.onnx --output_file {out}` (text on stdin). */
export const command: TtsProvider = {
  name: 'command',
  async available() {
    return process.env.HFR_TTS_COMMAND ? { ok: true } : { ok: false, reason: 'set HFR_TTS_COMMAND (use {out} for the output path, text is sent on stdin; {voice} is optional)' };
  },
  async synthesize(req) {
    const tpl = process.env.HFR_TTS_COMMAND;
    if (!tpl) throw new ProviderUnavailable('HFR_TTS_COMMAND is not set');
    await mkdir(path.dirname(req.out), { recursive: true });
    // Tokenise the template without a shell; substitute placeholders per argument.
    const args = (tpl.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((a) => a.replace(/^["']|["']$/g, '')
      .replaceAll('{out}', req.out).replaceAll('{voice}', req.voice ?? '').replaceAll('{lang}', req.language ?? ''));
    const [cmd, ...rest] = args;
    if (!cmd) throw new Error('HFR_TTS_COMMAND is empty');
    await new Promise<void>((resolve, reject) => {
      const child = spawn(cmd, rest, { stdio: ['pipe', 'ignore', 'pipe'], signal: req.signal });
      let err = '';
      child.stderr.on('data', (d) => (err += d));
      child.on('error', reject);
      child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}: ${err.slice(-500)}`))));
      child.stdin.end(req.text);
    });
    return { file: req.out };
  },
};

// ------------------------------------------------------------ elevenlabs
interface ElevenAlignment { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] }

/** Converts character-level timings into word timings. */
export function charsToWords(a: ElevenAlignment): CaptionWord[] {
  const words: CaptionWord[] = [];
  let cur = '', start = 0, end = 0;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push({ text: cur, start, end });
      cur = '';
      return;
    }
    if (!cur) start = a.character_start_times_seconds[i]!;
    cur += ch;
    end = a.character_end_times_seconds[i]!;
  });
  if (cur) words.push({ text: cur, start, end });
  return words;
}

export const elevenlabs: TtsProvider = {
  name: 'elevenlabs',
  async available() {
    return process.env.ELEVENLABS_API_KEY ? { ok: true } : { ok: false, reason: 'set ELEVENLABS_API_KEY' };
  },
  async synthesize(req) {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new ProviderUnavailable('ELEVENLABS_API_KEY is not set');
    const voice = req.voice ?? process.env.ELEVENLABS_VOICE_ID;
    if (!voice) throw new Error('ElevenLabs needs a voice id (--voice or ELEVENLABS_VOICE_ID)');
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/with-timestamps?output_format=mp3_44100_128`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify({ text: req.text, model_id: req.model ?? 'eleven_multilingual_v2', ...(req.language ? { language_code: req.language.slice(0, 2) } : {}) }),
      signal: req.signal,
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 500)}`);
    const data = (await res.json()) as { audio_base64: string; alignment?: ElevenAlignment; normalized_alignment?: ElevenAlignment };
    await mkdir(path.dirname(req.out), { recursive: true });
    await writeFile(req.out, Buffer.from(data.audio_base64, 'base64'));
    const align = data.alignment ?? data.normalized_alignment;
    return { file: req.out, words: align ? charsToWords(align) : undefined };
  },
};

// ---------------------------------------------------------------- openai
export const openai: TtsProvider = {
  name: 'openai',
  async available() {
    return process.env.OPENAI_API_KEY ? { ok: true } : { ok: false, reason: 'set OPENAI_API_KEY' };
  },
  async synthesize(req) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new ProviderUnavailable('OPENAI_API_KEY is not set');
    const format = req.out.endsWith('.wav') ? 'wav' : 'mp3';
    const res = await fetch(`${process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'}/audio/speech`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: req.model ?? 'gpt-4o-mini-tts', voice: req.voice ?? 'alloy', input: req.text, response_format: format, ...(req.rate ? { speed: req.rate } : {}) }),
      signal: req.signal,
    });
    if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${(await res.text()).slice(0, 500)}`);
    await mkdir(path.dirname(req.out), { recursive: true });
    await writeFile(req.out, Buffer.from(await res.arrayBuffer()));
    return { file: req.out };
  },
};

export const TTS_PROVIDERS: Record<TtsProviderName, TtsProvider> = { espeak, command, elevenlabs, openai };

/** First available provider in order of quality (cloud first when keys exist). */
export async function defaultTtsProvider(): Promise<TtsProvider | null> {
  for (const p of [elevenlabs, openai, command, espeak]) if ((await p.available()).ok) return p;
  return null;
}

export async function synthesize(req: TtsRequest & { provider?: TtsProviderName }): Promise<TtsResult> {
  const provider = req.provider ? TTS_PROVIDERS[req.provider] : await defaultTtsProvider();
  if (!provider) throw new Error('no TTS provider available: install espeak-ng, set HFR_TTS_COMMAND, ELEVENLABS_API_KEY or OPENAI_API_KEY');
  const avail = await provider.available();
  if (!avail.ok) throw new Error(`TTS provider "${provider.name}" unavailable: ${avail.reason}`);
  const r = await provider.synthesize(req);
  const info = await probe(r.file);
  const words = r.words?.length ? r.words : await alignText(r.file, req.text);
  return { file: r.file, provider: provider.name, duration: info.duration ?? 0, words, timing: r.words?.length ? 'provider' : 'aligned', info };
}
