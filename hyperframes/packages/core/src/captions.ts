/**
 * Caption model: word-level timings grouped into display "pages".
 * Pure module shared by Node (import/export, burn-in planning) and runtime.
 */
import { clamp01, getEasing } from './easing.ts';

export interface CaptionWord {
  text: string;
  start: number; // seconds
  end: number; // seconds
}

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
  words?: CaptionWord[];
}

export interface CaptionDocument {
  language?: string;
  cues: CaptionCue[];
}

export interface GroupOptions {
  maxWords?: number; // per page
  maxChars?: number; // per page
  /** A silence longer than this (s) forces a new page. */
  pauseBreak?: number;
}

export interface CaptionPage {
  start: number;
  end: number;
  words: CaptionWord[];
}

/** Every word of the document, synthesising evenly spaced words for cues without timings. */
export function documentWords(doc: CaptionDocument): CaptionWord[] {
  const out: CaptionWord[] = [];
  for (const cue of doc.cues) {
    if (cue.words && cue.words.length) {
      out.push(...cue.words);
      continue;
    }
    out.push(...distributeWords(cue.text, cue.start, cue.end));
  }
  return out.sort((a, b) => a.start - b.start);
}

/**
 * Distributes the words of `text` across [start, end] proportionally to their
 * length (a reasonable approximation of speech rate when no aligner is available).
 */
export function distributeWords(text: string, start: number, end: number): CaptionWord[] {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const weights = tokens.map((w) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, '').length) + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(0, end - start);
  let t = start;
  return tokens.map((w, i) => {
    const d = (span * weights[i]!) / total;
    const word = { text: w, start: t, end: t + d };
    t += d;
    return word;
  });
}

const SENTENCE_END = /[.!?…:;]$/;

/** Groups words into pages for display (karaoke-style captions). */
export function groupWords(words: CaptionWord[], opts: GroupOptions = {}): CaptionPage[] {
  const maxWords = opts.maxWords ?? 6;
  const maxChars = opts.maxChars ?? 32;
  const pauseBreak = opts.pauseBreak ?? 0.6;
  const pages: CaptionPage[] = [];
  let cur: CaptionWord[] = [];
  let chars = 0;
  const flush = () => {
    if (!cur.length) return;
    pages.push({ start: cur[0]!.start, end: cur[cur.length - 1]!.end, words: cur });
    cur = [];
    chars = 0;
  };
  for (const w of words) {
    const prev = cur[cur.length - 1];
    const gap = prev ? w.start - prev.end : 0;
    if (cur.length >= maxWords || (cur.length && chars + w.text.length + 1 > maxChars) || gap > pauseBreak) flush();
    cur.push(w);
    chars += w.text.length + 1;
    if (SENTENCE_END.test(w.text)) flush();
  }
  flush();
  // Keep a page on screen until the next one starts (avoids flicker between words).
  for (let i = 0; i < pages.length - 1; i++) {
    const next = pages[i + 1]!;
    if (next.start - pages[i]!.end < pauseBreak) pages[i]!.end = next.start;
  }
  return pages;
}

export function pageAt(pages: CaptionPage[], t: number): CaptionPage | null {
  let lo = 0, hi = pages.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const p = pages[mid]!;
    if (t < p.start) hi = mid - 1;
    else if (t >= p.end) lo = mid + 1;
    else return p;
  }
  return null;
}

export type CaptionStyleName = 'karaoke' | 'pop' | 'highlight' | 'typewriter' | 'bounce' | 'plain';
export const CAPTION_STYLES: CaptionStyleName[] = ['karaoke', 'pop', 'highlight', 'typewriter', 'bounce', 'plain'];

export interface WordVisual {
  state: 'upcoming' | 'active' | 'spoken';
  opacity: number;
  scale: number;
  y: number; // px offset
  fill: number; // 0..1 karaoke fill progress
  visible: boolean;
}

/** Deterministic per-word appearance for a caption style at time t. */
export function wordVisual(style: CaptionStyleName, w: CaptionWord, t: number, animDuration = 0.15): WordVisual {
  const state = t < w.start ? 'upcoming' : t < w.end ? 'active' : 'spoken';
  const appear = clamp01((t - w.start) / animDuration);
  const base: WordVisual = { state, opacity: 1, scale: 1, y: 0, fill: state === 'upcoming' ? 0 : state === 'spoken' ? 1 : clamp01((t - w.start) / Math.max(0.01, w.end - w.start)), visible: true };
  switch (style) {
    case 'pop': {
      const e = getEasing('out-back')(appear);
      return { ...base, opacity: state === 'upcoming' ? 0 : 1, scale: state === 'upcoming' ? 0.6 : 0.6 + 0.4 * e, visible: state !== 'upcoming' };
    }
    case 'typewriter':
      return { ...base, opacity: state === 'upcoming' ? 0 : appear, visible: state !== 'upcoming' };
    case 'bounce': {
      const e = state === 'active' ? Math.sin(appear * Math.PI) : 0;
      return { ...base, y: -12 * e, scale: 1 + 0.12 * e };
    }
    case 'highlight':
    case 'karaoke':
    case 'plain':
    default:
      return base;
  }
}
