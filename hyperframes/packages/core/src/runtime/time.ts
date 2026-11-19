/**
 * Virtual time. Installed before any user script runs so that every time
 * source a page can observe (performance.now, Date, requestAnimationFrame,
 * Math.random) follows the composition playhead instead of the wall clock.
 * This is what makes frame capture deterministic and order-independent.
 */
import { mulberry32 } from '../random.ts';

export interface VirtualTime {
  /** Current virtual time in ms. */
  now(): number;
  set(ms: number): void;
  /** Runs queued requestAnimationFrame callbacks once with the current time. */
  flushFrame(): void;
  readonly real: {
    now: () => number;
    requestAnimationFrame: (cb: FrameRequestCallback) => number;
    cancelAnimationFrame: (id: number) => void;
    setTimeout: typeof setTimeout;
  };
  pendingFrames(): number;
}

export function installVirtualTime(seed: number, epochMs: number): VirtualTime {
  const real = {
    now: performance.now.bind(performance),
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
    setTimeout: window.setTimeout.bind(window) as typeof setTimeout,
  };
  let current = 0;
  let nextId = 1;
  let queue = new Map<number, FrameRequestCallback>();

  performance.now = () => current;

  const RealDate = Date;
  class VirtualDate extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) super(epochMs + current);
      else super(...(args as [string]));
    }
    static override now(): number {
      return epochMs + current;
    }
  }
  Object.defineProperty(VirtualDate, 'name', { value: 'Date' });
  (window as unknown as { Date: DateConstructor }).Date = VirtualDate as unknown as DateConstructor;

  window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    const id = nextId++;
    queue.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = (id: number) => {
    queue.delete(id);
  };

  Math.random = mulberry32(seed);

  return {
    now: () => current,
    set: (ms: number) => {
      current = ms;
    },
    flushFrame: () => {
      const cbs = queue;
      queue = new Map();
      for (const cb of cbs.values()) {
        try {
          cb(current);
        } catch (e) {
          reportError(e);
        }
      }
    },
    real,
    pendingFrames: () => queue.size,
  };
}
