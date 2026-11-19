/** Easing functions (t in [0,1] → [0,1]). Pure; shared by runtime and Node. */

export type EasingFn = (t: number) => number;

const c1 = 1.70158;
const c3 = c1 + 1;

function bounceOut(t: number): number {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

export const easings: Record<string, EasingFn> = {
  linear: (t) => t,
  'in-quad': (t) => t * t,
  'out-quad': (t) => 1 - (1 - t) * (1 - t),
  'in-out-quad': (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  'in-cubic': (t) => t * t * t,
  'out-cubic': (t) => 1 - Math.pow(1 - t, 3),
  'in-out-cubic': (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  'in-quart': (t) => t ** 4,
  'out-quart': (t) => 1 - Math.pow(1 - t, 4),
  'in-out-quart': (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
  'in-expo': (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  'out-expo': (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  'in-out-expo': (t) =>
    t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  'in-sine': (t) => 1 - Math.cos((t * Math.PI) / 2),
  'out-sine': (t) => Math.sin((t * Math.PI) / 2),
  'in-out-sine': (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  'in-back': (t) => c3 * t * t * t - c1 * t * t,
  'out-back': (t) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
  'out-elastic': (t) =>
    t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  'out-bounce': bounceOut,
};

/** Cubic bezier easing, same semantics as CSS cubic-bezier(). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFn {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return sampleY(t);
      const d = sampleDX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0, hi = 1;
    t = x;
    while (hi - lo > 1e-6) {
      const v = sampleX(t);
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}

const BEZIER_RE = /^cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/;
const ALIASES: Record<string, string> = {
  ease: 'in-out-quad', 'ease-in': 'in-cubic', 'ease-out': 'out-cubic', 'ease-in-out': 'in-out-cubic',
};

/** Resolves an easing name ("out-cubic", "ease", "cubic-bezier(...)"). Unknown → out-cubic. */
export function getEasing(name: string | null | undefined): EasingFn {
  if (!name) return easings['out-cubic']!;
  const n = name.trim();
  const m = BEZIER_RE.exec(n);
  if (m) return cubicBezier(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]));
  return easings[ALIASES[n] ?? n] ?? easings['out-cubic']!;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
