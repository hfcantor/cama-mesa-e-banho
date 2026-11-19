/**
 * Stateless particle systems: the position of every particle is a closed-form
 * function of (seed, index, time), so any frame renders identically regardless
 * of the order frames are captured in.
 */
import { randomAt } from './random.ts';

export type ParticlePreset = 'snow' | 'confetti' | 'sparks' | 'bubbles' | 'stars' | 'dust';
export const PARTICLE_PRESETS: ParticlePreset[] = ['snow', 'confetti', 'sparks', 'bubbles', 'stars', 'dust'];

export interface Particle {
  x: number; y: number; size: number; rotation: number; alpha: number; color: string; shape: 'circle' | 'rect' | 'star';
}

export interface ParticleOptions {
  preset: ParticlePreset;
  count: number;
  width: number;
  height: number;
  seed: number;
  colors: string[];
  speed: number;
}

const r = (seed: number, i: number, k: number) => randomAt(seed + k * 7919, i);
const wrap = (v: number, m: number) => ((v % m) + m) % m;

export function particlesAt(o: ParticleOptions, t: number): Particle[] {
  const out: Particle[] = [];
  const { width: W, height: H, seed } = o;
  for (let i = 0; i < o.count; i++) {
    const color = o.colors[Math.floor(r(seed, i, 1) * o.colors.length)] ?? '#ffffff';
    const phase = r(seed, i, 2);
    switch (o.preset) {
      case 'snow': {
        const speed = (30 + r(seed, i, 3) * 70) * o.speed;
        const y = wrap(r(seed, i, 4) * (H + 40) + t * speed, H + 40) - 20;
        const x = wrap(r(seed, i, 5) * W + Math.sin(t * (0.5 + phase) + phase * 6.28) * 30, W);
        out.push({ x, y, size: 2 + r(seed, i, 6) * 5, rotation: 0, alpha: 0.5 + r(seed, i, 7) * 0.5, color, shape: 'circle' });
        break;
      }
      case 'confetti': {
        const speed = (120 + r(seed, i, 3) * 200) * o.speed;
        const y = wrap(r(seed, i, 4) * (H + 60) + t * speed, H + 60) - 30;
        const x = wrap(r(seed, i, 5) * W + Math.sin(t * 2 + phase * 6.28) * 40, W);
        out.push({ x, y, size: 6 + r(seed, i, 6) * 10, rotation: (t * (90 + phase * 360) + phase * 360) % 360, alpha: 1, color, shape: 'rect' });
        break;
      }
      case 'sparks': {
        // bursts from the centre, each particle has a 1.5s life that restarts
        const life = 1.5;
        const local = wrap(t * o.speed + phase * life, life);
        const ang = r(seed, i, 3) * Math.PI * 2;
        const v = 200 + r(seed, i, 4) * 500;
        const x = W / 2 + Math.cos(ang) * v * local;
        const y = H / 2 + Math.sin(ang) * v * local + 300 * local * local;
        out.push({ x, y, size: 2 + r(seed, i, 5) * 3, rotation: 0, alpha: 1 - local / life, color, shape: 'circle' });
        break;
      }
      case 'bubbles': {
        const speed = (40 + r(seed, i, 3) * 80) * o.speed;
        const y = H + 30 - wrap(r(seed, i, 4) * (H + 60) + t * speed, H + 60);
        const x = wrap(r(seed, i, 5) * W + Math.sin(t + phase * 6.28) * 20, W);
        out.push({ x, y, size: 6 + r(seed, i, 6) * 24, rotation: 0, alpha: 0.25 + r(seed, i, 7) * 0.35, color, shape: 'circle' });
        break;
      }
      case 'stars': {
        const tw = 0.5 + 0.5 * Math.sin(t * (1 + phase * 3) * o.speed + phase * 6.28);
        out.push({ x: r(seed, i, 3) * W, y: r(seed, i, 4) * H, size: 1 + r(seed, i, 5) * 3, rotation: 0, alpha: 0.2 + 0.8 * tw, color, shape: 'star' });
        break;
      }
      case 'dust':
      default: {
        const x = wrap(r(seed, i, 3) * W + t * (10 + phase * 20) * o.speed, W);
        const y = wrap(r(seed, i, 4) * H + Math.sin(t * 0.7 + phase * 6.28) * 25, H);
        out.push({ x, y, size: 1 + r(seed, i, 5) * 2.5, rotation: 0, alpha: 0.15 + 0.35 * r(seed, i, 6), color, shape: 'circle' });
      }
    }
  }
  return out;
}
