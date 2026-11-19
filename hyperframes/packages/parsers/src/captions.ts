/** Caption formats: SRT, WebVTT, ASS (export), JSON (cues or word lists). */
import { distributeWords, formatClock, type CaptionCue, type CaptionDocument, type CaptionWord } from '@hfr/core';

export type CaptionFormat = 'srt' | 'vtt' | 'json' | 'ass' | 'txt';

const TS = /(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})/;

function parseTimestamp(s: string): number {
  const m = TS.exec(s.trim());
  if (!m) throw new Error(`invalid timestamp "${s}"`);
  return (Number(m[1] ?? 0) * 3600) + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]!.padEnd(3, '0')) / 1000;
}

/** WebVTT karaoke timestamps inside cue text: "<00:00:01.200>word". */
const INLINE_TS = /<((?:\d+:)?\d{1,2}:\d{1,2}\.\d{1,3})>/g;

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\{\\[^}]*\}/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function cueFromBlock(timeLine: string, text: string): CaptionCue {
  const [a, b] = timeLine.split('-->');
  if (!a || !b) throw new Error(`invalid cue timing "${timeLine}"`);
  const start = parseTimestamp(a);
  const end = parseTimestamp(b.trim().split(/\s+/)[0]!);
  if (end < start) throw new Error(`cue ends before it starts: "${timeLine}"`);
  const cue: CaptionCue = { start, end, text: stripTags(text).replace(/\s+/g, ' ').trim() };
  // word-level timings embedded as VTT inline timestamps
  if (INLINE_TS.test(text)) {
    INLINE_TS.lastIndex = 0;
    const words: CaptionWord[] = [];
    const parts = text.split(INLINE_TS); // [text, ts, text, ts, text...]
    let t = start;
    for (let i = 0; i < parts.length; i += 2) {
      const chunk = stripTags(parts[i] ?? '').trim();
      const nextT = i + 1 < parts.length ? parseTimestamp(parts[i + 1]!) : end;
      if (chunk) words.push(...distributeWords(chunk, t, nextT));
      t = nextT;
    }
    cue.words = words;
  }
  return cue;
}

export function parseSrt(text: string): CaptionDocument {
  const cues: CaptionCue[] = [];
  const blocks = text.replace(/^﻿/, '').replace(/\r/g, '').split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    if (!lines.length) continue;
    const ti = lines.findIndex((l) => l.includes('-->'));
    if (ti < 0) continue;
    cues.push(cueFromBlock(lines[ti]!, lines.slice(ti + 1).join('\n')));
  }
  return { cues };
}

export function parseVtt(text: string): CaptionDocument {
  const clean = text.replace(/^﻿/, '').replace(/\r/g, '');
  if (!clean.startsWith('WEBVTT')) throw new Error('not a WebVTT file (missing WEBVTT header)');
  const cues: CaptionCue[] = [];
  let language: string | undefined;
  for (const block of clean.split(/\n{2,}/).slice(1)) {
    const lines = block.split('\n');
    if (/^(NOTE|STYLE|REGION)\b/.test(lines[0] ?? '')) continue;
    const ti = lines.findIndex((l) => l.includes('-->'));
    if (ti < 0) continue;
    cues.push(cueFromBlock(lines[ti]!, lines.slice(ti + 1).join('\n')));
  }
  const lang = /^Language:\s*(\S+)/m.exec(clean);
  if (lang) language = lang[1];
  return { cues, language };
}

/** JSON: CaptionDocument, an array of cues, or an array of words [{text|word, start, end}]. */
export function parseCaptionJson(text: string): CaptionDocument {
  const data = JSON.parse(text) as unknown;
  const asWord = (w: Record<string, unknown>): CaptionWord => {
    const t = String(w.text ?? w.word ?? '').trim();
    const start = Number(w.start), end = Number(w.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error(`invalid word timing: ${JSON.stringify(w)}`);
    return { text: t, start, end };
  };
  if (Array.isArray(data)) {
    if (data.length && ('word' in data[0] || ('text' in data[0] && !('words' in data[0]) && String(data[0].text).trim().split(/\s+/).length === 1))) {
      const words = data.map((w) => asWord(w as Record<string, unknown>)).filter((w) => w.text);
      return { cues: wordsToCues(words) };
    }
    return { cues: data.map((c) => normalizeCue(c as Record<string, unknown>)) };
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.cues)) return { language: typeof d.language === 'string' ? d.language : undefined, cues: d.cues.map((c) => normalizeCue(c as Record<string, unknown>)) };
    // OpenAI / Whisper verbose_json: { segments: [{start,end,text,words?}], words? }
    if (Array.isArray(d.segments)) {
      return {
        language: typeof d.language === 'string' ? d.language : undefined,
        cues: d.segments.map((s) => normalizeCue(s as Record<string, unknown>)),
      };
    }
    if (Array.isArray(d.words)) return { cues: wordsToCues(d.words.map((w) => asWord(w as Record<string, unknown>))) };
  }
  throw new Error('unrecognised caption JSON structure');

  function normalizeCue(c: Record<string, unknown>): CaptionCue {
    const start = Number(c.start), end = Number(c.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error(`invalid cue: ${JSON.stringify(c).slice(0, 120)}`);
    const words = Array.isArray(c.words) ? c.words.map((w) => asWord(w as Record<string, unknown>)).filter((w) => w.text) : undefined;
    return { start, end, text: String(c.text ?? words?.map((w) => w.text).join(' ') ?? '').trim(), words };
  }
}

/** Groups a flat word list into sentence-ish cues (max ~7 s / 42 chars per line x2). */
export function wordsToCues(words: CaptionWord[], o: { maxChars?: number; maxDuration?: number } = {}): CaptionCue[] {
  const maxChars = o.maxChars ?? 84, maxDur = o.maxDuration ?? 7;
  const cues: CaptionCue[] = [];
  let cur: CaptionWord[] = [];
  const flush = () => {
    if (!cur.length) return;
    cues.push({ start: cur[0]!.start, end: cur[cur.length - 1]!.end, text: cur.map((w) => w.text).join(' '), words: cur });
    cur = [];
  };
  for (const w of words) {
    const len = cur.reduce((n, x) => n + x.text.length + 1, 0);
    if (cur.length && (len + w.text.length > maxChars || w.end - cur[0]!.start > maxDur || w.start - cur[cur.length - 1]!.end > 1)) flush();
    cur.push(w);
    if (/[.!?…]$/.test(w.text)) flush();
  }
  flush();
  return cues;
}

/** Plain text script: one cue per line, timings distributed over `duration`. */
export function parsePlainScript(text: string, duration: number): CaptionDocument {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const weights = lines.map((l) => l.length + 10);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = 0;
  return {
    cues: lines.map((line, i) => {
      const d = (duration * weights[i]!) / total;
      const cue = { start: t, end: t + d, text: line, words: distributeWords(line, t, t + d) };
      t += d;
      return cue;
    }),
  };
}

export function detectCaptionFormat(fileName: string, content: string): CaptionFormat {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'srt' || ext === 'vtt' || ext === 'json' || ext === 'ass') return ext;
  if (content.trimStart().startsWith('WEBVTT')) return 'vtt';
  if (/^\s*[[{]/.test(content)) return 'json';
  if (/-->/.test(content)) return 'srt';
  return 'txt';
}

export function parseCaptions(fileName: string, content: string, opts: { duration?: number } = {}): CaptionDocument {
  switch (detectCaptionFormat(fileName, content)) {
    case 'srt': return parseSrt(content);
    case 'vtt': return parseVtt(content);
    case 'json': return parseCaptionJson(content);
    case 'ass': throw new Error('ASS import is not supported (export only)');
    default: return parsePlainScript(content, opts.duration ?? 10);
  }
}

// ------------------------------------------------------------- writers
const srtTime = (s: number) => formatClock(s, true).replace('.', ',');
const vttTime = (s: number) => formatClock(s, true);

export function toSrt(doc: CaptionDocument): string {
  return doc.cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join('\n');
}

export function toVtt(doc: CaptionDocument, o: { karaoke?: boolean } = {}): string {
  const head = `WEBVTT${doc.language ? `\nLanguage: ${doc.language}` : ''}\n\n`;
  return head + doc.cues.map((c) => {
    let text = c.text;
    if (o.karaoke && c.words?.length) {
      text = c.words.map((w, i) => (i === 0 ? w.text : `<${vttTime(w.start)}>${w.text}`)).join(' ');
    }
    return `${vttTime(c.start)} --> ${vttTime(c.end)}\n${text}\n`;
  }).join('\n');
}

export interface AssStyle { font?: string; size?: number; primary?: string; highlight?: string; outline?: string; marginV?: number; width?: number; height?: number }

/** "#RRGGBB" → ASS "&H00BBGGRR". */
function assColor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '&H00FFFFFF';
  const h = m[1]!;
  return `&H00${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase();
}

const assTime = (s: number) => {
  const cs = Math.round(s * 100);
  const h = Math.floor(cs / 360000), m = Math.floor((cs % 360000) / 6000), sec = Math.floor((cs % 6000) / 100), c = cs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
};

/** ASS with karaoke (\k) tags when word timings exist — usable with FFmpeg's `subtitles` filter. */
export function toAss(doc: CaptionDocument, st: AssStyle = {}): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${st.width ?? 1920}
PlayResY: ${st.height ?? 1080}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${st.font ?? 'Arial'},${st.size ?? 64},${assColor(st.highlight ?? '#FFE14D')},${assColor(st.primary ?? '#FFFFFF')},${assColor(st.outline ?? '#000000')},&H80000000,-1,0,0,0,100,100,0,0,1,4,1,2,60,60,${st.marginV ?? 80},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines = doc.cues.map((c) => {
    const esc = (s: string) => s.replace(/[{}]/g, '').replace(/\n/g, '\\N');
    const text = c.words?.length
      ? c.words.map((w, i) => {
          const next = c.words![i + 1];
          const dur = Math.max(1, Math.round(((next ? next.start : w.end) - w.start) * 100));
          return `{\\k${dur}}${esc(w.text)}`;
        }).join(' ')
      : esc(c.text);
    return `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Default,,0,0,0,,${text}`;
  });
  return header + lines.join('\n') + '\n';
}

export function serializeCaptions(doc: CaptionDocument, format: CaptionFormat, o: AssStyle & { karaoke?: boolean } = {}): string {
  switch (format) {
    case 'srt': return toSrt(doc);
    case 'vtt': return toVtt(doc, o);
    case 'ass': return toAss(doc, o);
    case 'json': return JSON.stringify(doc, null, 2);
    case 'txt': return doc.cues.map((c) => c.text).join('\n') + '\n';
  }
}

/** Shifts and/or scales all timings (e.g. to re-sync captions with narration). */
export function retimeCaptions(doc: CaptionDocument, o: { offset?: number; scale?: number }): CaptionDocument {
  const f = (t: number) => Math.max(0, t * (o.scale ?? 1) + (o.offset ?? 0));
  return {
    ...doc,
    cues: doc.cues.map((c) => ({ ...c, start: f(c.start), end: f(c.end), words: c.words?.map((w) => ({ ...w, start: f(w.start), end: f(w.end) })) })),
  };
}
