/**
 * Pure timing utilities shared by Node (parser, producer, lint) and the
 * browser runtime. No DOM, no Node APIs.
 */

export interface RawTiming {
  id: string;
  start?: string | null;
  duration?: string | null;
  end?: string | null;
  track?: string | null;
  /** Intrinsic media length (seconds) when known: used for missing duration. */
  mediaDuration?: number | null;
  /** Offset into the media where playback starts (seconds). */
  mediaStart?: number | null;
}

export interface ResolvedTiming {
  id: string;
  start: number;
  duration: number;
  end: number;
  track: number;
}

export class TimingError extends Error {
  readonly clipId: string;
  constructor(clipId: string, message: string) {
    super(`[${clipId}] ${message}`);
    this.name = 'TimingError';
    this.clipId = clipId;
  }
}

const UNIT_RE = /^(-?\d+(?:\.\d+)?)(ms|s|f|m)?$/;
const CLOCK_RE = /^(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/;

/**
 * Parses an absolute time value. Accepted forms:
 *   "2", "2.5s", "500ms", "90f" (frames), "1.5m" (minutes), "00:01:02.5", "01:02.5"
 * Returns null when the string is not an absolute time (e.g. a reference).
 */
export function parseTimeValue(input: string | number | null | undefined, fps = 30): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  const v = input.trim();
  if (v === '') return null;
  const unit = UNIT_RE.exec(v);
  if (unit) {
    const n = Number(unit[1]);
    switch (unit[2]) {
      case 'ms': return n / 1000;
      case 'f': return n / fps;
      case 'm': return n * 60;
      default: return n;
    }
  }
  const clock = CLOCK_RE.exec(v);
  if (clock) {
    const h = clock[1] ? Number(clock[1]) : 0;
    return h * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
  }
  return null;
}

/** Formats seconds as HH:MM:SS.mmm (or MM:SS.mmm when under an hour). */
export function formatClock(seconds: number, alwaysHours = false): string {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s - h * 3600 - m * 60;
  const ss = sec.toFixed(3).padStart(6, '0');
  const mm = String(m).padStart(2, '0');
  return h > 0 || alwaysHours ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Time expression: either absolute (see parseTimeValue) or a reference:
 *   "intro.end", "intro.start + 0.5", "prev.end - 250ms", "intro" (= intro.end)
 */
const REF_RE = /^([A-Za-z_][\w-]*)(?:\.(start|end))?\s*(?:([+-])\s*(.+))?$/;

interface ParsedRef { ref: string; edge: 'start' | 'end'; offset: number }

function parseRef(expr: string, fps: number): ParsedRef | null {
  const m = REF_RE.exec(expr.trim());
  if (!m) return null;
  let offset = 0;
  if (m[3]) {
    const o = parseTimeValue(m[4] ?? '', fps);
    if (o === null) return null;
    offset = m[3] === '-' ? -o : o;
  }
  return { ref: m[1]!, edge: (m[2] as 'start' | 'end' | undefined) ?? 'end', offset };
}

export interface ResolveOptions {
  fps?: number;
  /** Composition duration: clips without duration/end/media run to this point. */
  compositionDuration?: number | null;
}

/**
 * Resolves a list of clip timings, supporting references between clips
 * ("prev" = previous clip in document order). Throws TimingError on cycles,
 * unknown references or invalid values.
 */
export function resolveTimings(raws: RawTiming[], opts: ResolveOptions = {}): ResolvedTiming[] {
  const fps = opts.fps ?? 30;
  const byId = new Map<string, number>();
  raws.forEach((r, i) => {
    if (byId.has(r.id)) throw new TimingError(r.id, `duplicate clip id "${r.id}"`);
    byId.set(r.id, i);
  });
  const resolved = new Array<ResolvedTiming | undefined>(raws.length);
  const visiting = new Set<number>();

  const evalExpr = (expr: string, selfIndex: number, field: string): number => {
    const abs = parseTimeValue(expr, fps);
    if (abs !== null) return abs;
    const ref = parseRef(expr, fps);
    const self = raws[selfIndex]!;
    if (!ref) throw new TimingError(self.id, `invalid ${field} "${expr}"`);
    let target: number | undefined;
    if (ref.ref === 'prev') {
      if (selfIndex === 0) throw new TimingError(self.id, `"prev" used by the first clip`);
      target = selfIndex - 1;
    } else {
      target = byId.get(ref.ref);
    }
    if (target === undefined) throw new TimingError(self.id, `unknown reference "${ref.ref}" in ${field}`);
    const t = resolveOne(target);
    return (ref.edge === 'start' ? t.start : t.end) + ref.offset;
  };

  const resolveOne = (i: number): ResolvedTiming => {
    const done = resolved[i];
    if (done) return done;
    const r = raws[i]!;
    if (visiting.has(i)) throw new TimingError(r.id, 'circular time reference');
    visiting.add(i);
    const start = r.start != null && r.start !== '' ? evalExpr(r.start, i, 'start') : 0;
    let duration: number | null = null;
    if (r.duration != null && r.duration !== '') {
      duration = evalExpr(r.duration, i, 'duration');
    } else if (r.end != null && r.end !== '') {
      duration = evalExpr(r.end, i, 'end') - start;
    } else if (r.mediaDuration != null) {
      duration = Math.max(0, r.mediaDuration - (r.mediaStart ?? 0));
    } else if (opts.compositionDuration != null) {
      duration = Math.max(0, opts.compositionDuration - start);
    }
    if (duration === null) throw new TimingError(r.id, 'cannot determine duration');
    if (!Number.isFinite(start) || !Number.isFinite(duration)) throw new TimingError(r.id, 'non-finite timing');
    if (duration < 0) throw new TimingError(r.id, `negative duration (${duration})`);
    const trackNum = r.track != null && r.track !== '' ? Number(r.track) : 0;
    if (!Number.isInteger(trackNum)) throw new TimingError(r.id, `invalid track "${r.track}"`);
    const out: ResolvedTiming = { id: r.id, start, duration, end: start + duration, track: trackNum };
    visiting.delete(i);
    resolved[i] = out;
    return out;
  };

  return raws.map((_, i) => resolveOne(i));
}

/** A clip is active on the half-open interval [start, end). */
export function isActive(t: { start: number; end: number }, time: number): boolean {
  return time >= t.start && time < t.end;
}

/** Number of frames for a duration at a given fps (always at least 1). */
export function frameCount(duration: number, fps: number): number {
  return Math.max(1, Math.round(duration * fps));
}

/** Time (seconds) of a frame index. */
export function frameTime(index: number, fps: number): number {
  return index / fps;
}

/** Finds overlaps between clips placed on the same track. */
export function findTrackOverlaps(timings: ResolvedTiming[]): Array<[ResolvedTiming, ResolvedTiming]> {
  const byTrack = new Map<number, ResolvedTiming[]>();
  for (const t of timings) {
    const list = byTrack.get(t.track) ?? [];
    list.push(t);
    byTrack.set(t.track, list);
  }
  const out: Array<[ResolvedTiming, ResolvedTiming]> = [];
  for (const list of byTrack.values()) {
    const sorted = [...list].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      if (cur.start < prev.end - 1e-9) out.push([prev, cur]);
    }
  }
  return out;
}
