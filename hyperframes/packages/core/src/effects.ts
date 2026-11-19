/**
 * Declarative, deterministic clip effects: enter/exit presets, keyframes and
 * Ken Burns camera moves. Everything is a pure function of local time so any
 * frame can be rendered in any order (required for parallel rendering).
 */
import { clamp01, getEasing, lerp } from './easing.ts';

export interface VisualState {
  opacity: number;
  x: number; // px
  y: number; // px
  scale: number;
  rotate: number; // deg
  blur: number; // px
  clip: string | null; // CSS clip-path
}

export const IDENTITY: Readonly<VisualState> = Object.freeze({
  opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, blur: 0, clip: null,
});

export interface EffectContext { width: number; height: number }

/** progress p: 0 = fully "out", 1 = fully "in". */
type PresetFn = (p: number, ctx: EffectContext) => Partial<VisualState>;

const pct = (n: number) => `${(n * 100).toFixed(3)}%`;

export const PRESETS: Record<string, PresetFn> = {
  none: () => ({}),
  fade: (p) => ({ opacity: p }),
  'fade-up': (p) => ({ opacity: p, y: (1 - p) * 60 }),
  'fade-down': (p) => ({ opacity: p, y: -(1 - p) * 60 }),
  'fade-left': (p) => ({ opacity: p, x: (1 - p) * 80 }),
  'fade-right': (p) => ({ opacity: p, x: -(1 - p) * 80 }),
  'slide-up': (p, c) => ({ y: (1 - p) * c.height }),
  'slide-down': (p, c) => ({ y: -(1 - p) * c.height }),
  'slide-left': (p, c) => ({ x: (1 - p) * c.width }),
  'slide-right': (p, c) => ({ x: -(1 - p) * c.width }),
  'zoom-in': (p) => ({ opacity: p, scale: lerp(0.6, 1, p) }),
  'zoom-out': (p) => ({ opacity: p, scale: lerp(1.4, 1, p) }),
  pop: (p) => ({ opacity: clamp01(p * 3), scale: lerp(0.3, 1, p) }),
  'blur-in': (p) => ({ opacity: p, blur: (1 - p) * 30 }),
  'rotate-in': (p) => ({ opacity: p, rotate: (1 - p) * -12, scale: lerp(0.9, 1, p) }),
  // Masks (clip-path based reveals)
  'wipe-left': (p) => ({ clip: `inset(0 0 0 ${pct(1 - p)})` }),
  'wipe-right': (p) => ({ clip: `inset(0 ${pct(1 - p)} 0 0)` }),
  'wipe-up': (p) => ({ clip: `inset(${pct(1 - p)} 0 0 0)` }),
  'wipe-down': (p) => ({ clip: `inset(0 0 ${pct(1 - p)} 0)` }),
  iris: (p) => ({ clip: `circle(${(p * 75).toFixed(3)}% at 50% 50%)` }),
  // Diamond grows from the centre; half-diagonal of 100% covers the corners.
  diamond: (p) => {
    if (p >= 1) return { clip: null };
    const d = p * 100;
    const f = (n: number) => `${n.toFixed(3)}%`;
    return { clip: `polygon(50% ${f(50 - d)}, ${f(50 + d)} 50%, 50% ${f(50 + d)}, ${f(50 - d)} 50%)` };
  },
};

export interface TransitionSpec { preset: string; duration: number; easing: string; delay: number }

/** Parses "fade-up 0.6 out-back 0.2" → preset, duration, easing, delay. */
export function parseTransitionSpec(value: string | null | undefined, defaultDuration = 0.5): TransitionSpec | null {
  if (!value) return null;
  const parts = value.trim().split(/\s+/);
  const preset = parts[0] ?? 'fade';
  if (!(preset in PRESETS)) return null;
  const nums: number[] = [];
  let easing = 'out-cubic';
  for (const part of parts.slice(1)) {
    const n = Number(part.replace(/s$/, ''));
    if (Number.isFinite(n) && part !== '') nums.push(n);
    else easing = part;
  }
  return { preset, duration: nums[0] ?? defaultDuration, easing, delay: nums[1] ?? 0 };
}

export interface Keyframe extends Partial<Omit<VisualState, 'clip'>> {
  t: number; // seconds, relative to clip start
  ease?: string; // easing used to arrive at this keyframe
}

const KF_PROPS = ['opacity', 'x', 'y', 'scale', 'rotate', 'blur'] as const;

export function parseKeyframes(value: string | null | undefined): Keyframe[] | null {
  if (!value) return null;
  const data = JSON.parse(value) as unknown;
  if (!Array.isArray(data)) throw new Error('data-keyframes must be a JSON array');
  const kfs = data.map((k, i) => {
    if (typeof k !== 'object' || k === null || typeof (k as Keyframe).t !== 'number') {
      throw new Error(`keyframe ${i} needs a numeric "t"`);
    }
    return k as Keyframe;
  });
  return kfs.sort((a, b) => a.t - b.t);
}

/** Interpolates keyframes at local time t. Missing props carry the previous value. */
export function sampleKeyframes(kfs: Keyframe[], t: number): Partial<VisualState> {
  const out: Partial<VisualState> = {};
  for (const prop of KF_PROPS) {
    const withProp = kfs.filter((k) => typeof k[prop] === 'number');
    if (withProp.length === 0) continue;
    const first = withProp[0]!;
    const last = withProp[withProp.length - 1]!;
    if (t <= first.t) { out[prop] = first[prop] as number; continue; }
    if (t >= last.t) { out[prop] = last[prop] as number; continue; }
    for (let i = 1; i < withProp.length; i++) {
      const a = withProp[i - 1]!, b = withProp[i]!;
      if (t <= b.t) {
        const span = b.t - a.t;
        const p = span <= 0 ? 1 : getEasing(b.ease ?? 'in-out-sine')((t - a.t) / span);
        out[prop] = lerp(a[prop] as number, b[prop] as number, p);
        break;
      }
    }
  }
  return out;
}

/** Ken Burns: "in" | "out" | "left" | "right" | "up" | "down" [strength]. */
export function kenBurnsKeyframes(value: string, duration: number): Keyframe[] {
  const [kind = 'in', s] = value.trim().split(/\s+/);
  const k = Number(s ?? '0.15') || 0.15;
  const z = 1 + k;
  switch (kind) {
    case 'out': return [{ t: 0, scale: z }, { t: duration, scale: 1, ease: 'linear' }];
    case 'left': return [{ t: 0, scale: z, x: 40 }, { t: duration, scale: z, x: -40, ease: 'linear' }];
    case 'right': return [{ t: 0, scale: z, x: -40 }, { t: duration, scale: z, x: 40, ease: 'linear' }];
    case 'up': return [{ t: 0, scale: z, y: 30 }, { t: duration, scale: z, y: -30, ease: 'linear' }];
    case 'down': return [{ t: 0, scale: z, y: -30 }, { t: duration, scale: z, y: 30, ease: 'linear' }];
    default: return [{ t: 0, scale: 1 }, { t: duration, scale: z, ease: 'linear' }];
  }
}

export interface ClipEffects {
  enter?: TransitionSpec | null;
  exit?: TransitionSpec | null;
  keyframes?: Keyframe[] | null;
}

/** Combines partial states: opacity/scale multiply, offsets/rotation/blur add. */
export function combine(base: VisualState, part: Partial<VisualState>): VisualState {
  return {
    opacity: base.opacity * (part.opacity ?? 1),
    x: base.x + (part.x ?? 0),
    y: base.y + (part.y ?? 0),
    scale: base.scale * (part.scale ?? 1),
    rotate: base.rotate + (part.rotate ?? 0),
    blur: base.blur + (part.blur ?? 0),
    clip: part.clip !== undefined ? part.clip : base.clip,
  };
}

/** Full visual state of a clip at local time `t` (seconds since clip start). */
export function evaluateEffects(fx: ClipEffects, t: number, clipDuration: number, ctx: EffectContext): VisualState {
  let state: VisualState = { ...IDENTITY };
  if (fx.keyframes && fx.keyframes.length) state = combine(state, sampleKeyframes(fx.keyframes, t));
  if (fx.enter) {
    const { preset, duration, easing, delay } = fx.enter;
    const p = duration <= 0 ? (t >= delay ? 1 : 0) : clamp01((t - delay) / duration);
    state = combine(state, PRESETS[preset]!(getEasing(easing)(p), ctx));
  }
  if (fx.exit) {
    const { preset, duration, easing, delay } = fx.exit;
    const exitStart = clipDuration - duration - delay;
    const p = duration <= 0 ? 1 : 1 - clamp01((t - exitStart) / duration);
    if (p < 1) state = combine(state, PRESETS[preset]!(getEasing(easing)(p), ctx));
  }
  return state;
}

/** CSS declarations for a visual state (uses individual transform properties so
 *  that user animations on `transform` (e.g. GSAP) do not conflict). */
export function stateToCss(s: VisualState): Record<string, string> {
  return {
    opacity: String(Math.round(s.opacity * 10000) / 10000),
    translate: `${s.x.toFixed(3)}px ${s.y.toFixed(3)}px`,
    scale: String(Math.round(s.scale * 100000) / 100000),
    rotate: `${s.rotate.toFixed(3)}deg`,
    filter: s.blur > 0.01 ? `blur(${s.blur.toFixed(2)}px)` : '',
    'clip-path': s.clip ?? '',
  };
}
