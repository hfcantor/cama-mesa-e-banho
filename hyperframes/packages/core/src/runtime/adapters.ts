/**
 * Adapters make third-party animation objects seekable by absolute time.
 * Supported: GSAP (Tween/Timeline), Anime.js (v3/v4 instances, ms based),
 * Lottie AnimationItem, Web Animations API Animation, plain functions.
 */

export interface Adapter {
  type: 'gsap' | 'anime' | 'lottie' | 'waapi' | 'function' | 'gsap-global';
  /** Duration in seconds when known (used to derive composition duration). */
  duration(): number | null;
  seek(localTime: number): void;
  target: unknown;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

export function isGsap(x: Any): boolean {
  return !!x && typeof x.totalDuration === 'function' && typeof x.totalTime === 'function' && typeof x.pause === 'function';
}
export function isLottie(x: Any): boolean {
  return !!x && typeof x.goToAndStop === 'function' && typeof x.totalFrames === 'number';
}
export function isWaapi(x: Any): boolean {
  return typeof Animation !== 'undefined' && x instanceof Animation;
}
export function isAnime(x: Any): boolean {
  return !!x && typeof x.seek === 'function' && typeof x.duration === 'number';
}

export interface AdapterOptions {
  /** Fire GSAP callbacks while seeking (default false). */
  events?: boolean;
}

export function createAdapter(target: Any, opts: AdapterOptions = {}): Adapter {
  if (typeof target === 'function') {
    return { type: 'function', target, duration: () => null, seek: (t) => target(t) };
  }
  if (isGsap(target)) {
    target.pause();
    return {
      type: 'gsap',
      target,
      duration: () => target.totalDuration(),
      seek: (t) => {
        target.totalTime(Math.max(0, Math.min(t, target.totalDuration())), !opts.events);
      },
    };
  }
  if (isLottie(target)) {
    return {
      type: 'lottie',
      target,
      duration: () => (target.totalFrames && target.frameRate ? target.totalFrames / target.frameRate : null),
      seek: (t) => {
        const frames = target.totalFrames as number;
        const rate = target.frameRate as number;
        let f = Math.max(0, t * rate);
        f = target.loop ? f % frames : Math.min(f, frames - 1);
        target.goToAndStop(f, true);
      },
    };
  }
  if (isWaapi(target)) {
    const anim = target as Animation;
    anim.pause();
    return {
      type: 'waapi',
      target,
      duration: () => {
        const ct = anim.effect?.getComputedTiming();
        const end = ct?.endTime;
        return typeof end === 'number' && Number.isFinite(end) ? end / 1000 : null;
      },
      seek: (t) => {
        anim.currentTime = Math.max(0, t * 1000);
      },
    };
  }
  if (isAnime(target)) {
    // Anime.js v3 (`anime({...})`) and v4 (`animate()` / `createTimeline()`) both expose
    // seek(ms) and duration (ms). Iterations make v4's `duration` the total length.
    if (typeof target.pause === 'function') target.pause();
    return {
      type: 'anime',
      target,
      duration: () => (Number.isFinite(target.duration) ? target.duration / 1000 : null),
      seek: (t) => {
        target.seek(Math.max(0, Math.min(t * 1000, target.duration)));
      },
    };
  }
  throw new Error('hf.register(): unsupported animation object (expected GSAP, Anime.js, Lottie, WAAPI Animation or a function)');
}

/**
 * Drives GSAP's global timeline so that plain `gsap.to()` calls made while the
 * page loads become seekable without explicit registration.
 */
export function createGsapGlobalAdapter(gsap: Any): Adapter {
  const g = gsap.globalTimeline;
  if ('autoRemoveChildren' in g) g.autoRemoveChildren = false;
  if (gsap.ticker?.lagSmoothing) gsap.ticker.lagSmoothing(0);
  g.pause();
  return {
    type: 'gsap-global',
    target: g,
    duration: () => {
      // ignore infinite repeats
      let end = 0;
      for (const child of g.getChildren(false, true, true)) {
        const d = child.totalDuration();
        if (Number.isFinite(d) && d < 1e6) end = Math.max(end, child.startTime() + d);
      }
      return end;
    },
    seek: (t) => {
      g.totalTime(Math.max(0, t), true);
    },
  };
}
