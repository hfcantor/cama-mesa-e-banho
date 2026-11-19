/**
 * HyperFrames-compatible browser runtime.
 *
 * Injected by the composition server as the first script of every page.
 * Exposes `window.hf` (alias `window.__hf`). See docs/runtime.md.
 */
import { installVirtualTime } from './time.ts';
import { createAdapter, createGsapGlobalAdapter, type Adapter, type AdapterOptions } from './adapters.ts';
import { resolveTimings, frameCount, type RawTiming, type ResolvedTiming } from '../timing.ts';
import { evaluateEffects, kenBurnsKeyframes, parseKeyframes, parseTransitionSpec, stateToCss, type ClipEffects } from '../effects.ts';
import { documentWords, groupWords, pageAt, wordVisual, CAPTION_STYLES, type CaptionDocument, type CaptionPage, type CaptionStyleName } from '../captions.ts';
import { particlesAt, PARTICLE_PRESETS, type ParticlePreset } from '../particles.ts';
import { AUTO_ID_PREFIX, ROOT_SELECTOR, TIMED_SELECTOR, clipKind, readConfig } from '../composition.ts';
import { hashString } from '../random.ts';
import type { ClipKind, CompositionConfig } from '../types.ts';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

export interface RuntimeParams {
  mode: 'preview' | 'render' | 'inspect';
  seed: number;
  epoch: number;
  /** URL prefix where the composition server mounts /__hf/ (ends with "/"). */
  base: string;
  /** Replace <video> with server-extracted frames (headless Chromium cannot decode H.264). */
  videoFrames: boolean;
  /** Drive GSAP's global timeline automatically. */
  gsapGlobal: boolean;
}

declare global {
  interface Window {
    __HF_PARAMS__?: Partial<RuntimeParams>;
    hf: Runtime;
    __hf: Runtime;
    __timelines?: unknown;
    gsap?: Any;
    lottie?: Any;
  }
}

const VERSION = '0.1.0';
const params: RuntimeParams = {
  mode: 'preview', seed: 1, epoch: Date.UTC(2025, 0, 1), base: '/', videoFrames: false, gsapGlobal: true,
  ...(window.__HF_PARAMS__ ?? {}),
};
const vt = installVirtualTime(params.seed, params.epoch);
const errors: string[] = [];
const warnings: string[] = [];

window.addEventListener('error', (e) => {
  errors.push(e.error?.stack ? String(e.error.stack) : `${e.message} (${e.filename}:${e.lineno})`);
});
window.addEventListener('unhandledrejection', (e) => {
  errors.push(`Unhandled rejection: ${(e.reason && (e.reason.stack || e.reason.message)) || String(e.reason)}`);
});

interface Clip {
  el: HTMLElement;
  /** Element receiving visual effects (differs for <video> replaced by frames). */
  visual: HTMLElement;
  id: string;
  kind: ClipKind;
  name: string | null;
  timing: ResolvedTiming;
  fx: ClipEffects | null;
  mediaStart: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
  src: string | null;
  mediaDuration: number | null;
  update?: (local: number, global: number) => void | Promise<void>;
}

interface Registered { adapter: Adapter; offset: number | string; resolvedOffset: number }

const registered: Registered[] = [];
const frameCallbacks: Array<(t: number, info: { frame: number; fps: number }) => void> = [];
const readyBlockers: Promise<unknown>[] = [];
let clips: Clip[] = [];
let clipByEl = new WeakMap<Element, Clip>();
let config: CompositionConfig = readConfig(() => null);
let root: HTMLElement | null = null;
let totalDuration = 0;
let currentTime = 0;
let playing = false;
let playStartReal = 0;
let playStartTime = 0;
let isReady = false;
let gsapGlobal: Adapter | null = null;
let audioData: { fps: number; bands: number; frames: number[][] } | null = null;
let resolveReady!: () => void;
const readyPromise = new Promise<void>((r) => { resolveReady = r; });

const hfUrl = (p: string) => `${params.base}__hf/${p}`;

/** Path of a media/asset reference relative to the server root (what the server expects). */
function serverPath(ref: string): string {
  const u = new URL(ref, document.baseURI);
  let p = decodeURIComponent(u.pathname);
  const base = new URL(params.base, location.href).pathname;
  if (p.startsWith(base)) p = p.slice(base.length);
  return p.replace(/^\/+/, '');
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}: ${await res.text().catch(() => '')}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------- styles
function injectBaseStyles() {
  const style = document.createElement('style');
  style.setAttribute('data-hf-runtime', '');
  style.textContent = `
html,body{margin:0;padding:0;overflow:hidden}
:where(${ROOT_SELECTOR}){position:relative;overflow:hidden}
:where([data-hf-captions]){position:absolute;left:5%;right:5%;display:flex;justify-content:center;text-align:center;pointer-events:none;
  font:800 64px/1.15 system-ui,sans-serif;color:var(--hf-cap-color,#fff);text-shadow:0 4px 18px rgba(0,0,0,.55)}
:where([data-hf-captions][data-position="bottom"],[data-hf-captions]:not([data-position])){bottom:8%}
:where([data-hf-captions][data-position="top"]){top:8%}
:where([data-hf-captions][data-position="center"]){top:50%;transform:translateY(-50%)}
.hf-cap-page{display:flex;flex-wrap:wrap;justify-content:center;gap:.25em .3em;max-width:100%}
.hf-cap-word{display:inline-block;position:relative;white-space:pre;transform-origin:50% 80%}
.hf-cap-word[data-state="upcoming"]{color:var(--hf-cap-upcoming,inherit)}
.hf-cap-word[data-state="active"]{color:var(--hf-cap-active,#ffe14d)}
.hf-cap-word[data-state="spoken"]{color:var(--hf-cap-spoken,inherit)}
[data-style="highlight"] .hf-cap-word[data-state="active"]{color:var(--hf-cap-highlight-color,#111);background:var(--hf-cap-highlight-bg,#ffe14d);border-radius:.18em;padding:0 .12em;margin:0 -.12em}
[data-style="karaoke"]{text-shadow:none}
[data-style="karaoke"] .hf-cap-page{filter:drop-shadow(0 4px 10px rgba(0,0,0,.6))}
[data-style="karaoke"] .hf-cap-word,[data-style="karaoke"] .hf-cap-word[data-state]{color:transparent;background-image:linear-gradient(90deg,var(--hf-cap-active,#ffe14d) var(--fill,0%),var(--hf-cap-upcoming,rgba(255,255,255,.7)) var(--fill,0%));-webkit-background-clip:text;background-clip:text}
`;
  (document.head ?? document.documentElement).prepend(style);
}

// ---------------------------------------------------------------- setup
function readClipRaw(el: HTMLElement, index: number): { raw: RawTiming; clip: Omit<Clip, 'timing'> } {
  const id = el.id || `${AUTO_ID_PREFIX}${index}`;
  const d = el.dataset;
  const kind = clipKind(el.tagName.toLowerCase(), (n) => el.hasAttribute(n));
  const num = (v: string | undefined, f: number) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : f);
  const src = el.getAttribute('src') ?? d.src ?? d.hfLottie ?? d.hfCaptions ?? null;
  return {
    raw: { id, start: d.start ?? null, duration: d.duration ?? null, end: d.end ?? null, track: d.track ?? null, mediaStart: num(d.mediaStart, 0) },
    clip: {
      el, visual: el, id, kind, name: d.name ?? null, fx: null,
      mediaStart: num(d.mediaStart, 0), volume: num(d.volume, 1), muted: el.hasAttribute('muted') || (el as HTMLMediaElement).muted === true,
      loop: el.hasAttribute('loop') || el.hasAttribute('data-loop'), fadeIn: num(d.fadeIn, 0), fadeOut: num(d.fadeOut, 0),
      src: src ? serverPath(src) : null, mediaDuration: null,
    },
  };
}

async function probeDuration(path: string): Promise<number | null> {
  try {
    const info = await fetchJson<{ duration: number | null }>(hfUrl(`probe?src=${encodeURIComponent(path)}`));
    return info.duration;
  } catch (e) {
    warnings.push(`could not probe ${path}: ${(e as Error).message}`);
    return null;
  }
}

function parseEffects(c: Clip): ClipEffects | null {
  const d = c.el.dataset;
  try {
    const enter = parseTransitionSpec(d.enter);
    const exit = parseTransitionSpec(d.exit);
    let keyframes = parseKeyframes(d.keyframes);
    if (d.kenburns) keyframes = [...(keyframes ?? []), ...kenBurnsKeyframes(d.kenburns, c.timing.duration)];
    if (d.enter && !enter) warnings.push(`[${c.id}] unknown enter preset "${d.enter}"`);
    if (d.exit && !exit) warnings.push(`[${c.id}] unknown exit preset "${d.exit}"`);
    return enter || exit || keyframes ? { enter, exit, keyframes } : null;
  } catch (e) {
    errors.push(`[${c.id}] invalid effects: ${(e as Error).message}`);
    return null;
  }
}

function applyEffects(c: Clip, local: number) {
  if (!c.fx) return;
  const css = stateToCss(evaluateEffects(c.fx, local, c.timing.duration, config));
  const s = c.visual.style;
  for (const [k, v] of Object.entries(css)) s.setProperty(k, v);
}

// ------------------------------------------------- video (frame-accurate)
function setupVideo(c: Clip) {
  const video = c.el as HTMLVideoElement;
  video.pause();
  video.muted = true; // audio is mixed by the producer / played by preview logic
  if (!params.videoFrames || !c.src) {
    // Preview: native playback, seek when paused.
    video.muted = c.muted || params.mode !== 'preview';
    video.preload = 'auto';
    c.update = (local) => {
      const target = Math.max(0, c.mediaStart + local);
      const t = c.loop && video.duration ? target % video.duration : target;
      if (playing && params.mode === 'preview') {
        if (video.paused) video.play().catch(() => {});
        if (Math.abs(video.currentTime - t) > 0.25) video.currentTime = t;
      } else if (Math.abs(video.currentTime - t) > 0.001) {
        video.currentTime = t;
      }
    };
    return;
  }
  const img = document.createElement('img');
  const cs = getComputedStyle(video);
  for (const p of ['position', 'top', 'left', 'right', 'bottom', 'width', 'height', 'object-fit', 'object-position', 'border-radius', 'transform', 'transform-origin', 'z-index', 'margin', 'display', 'opacity', 'filter', 'box-shadow', 'max-width', 'max-height']) {
    img.style.setProperty(p, cs.getPropertyValue(p));
  }
  img.className = video.className;
  img.setAttribute('data-hf-video-frame', c.id);
  img.alt = '';
  video.after(img);
  video.style.display = 'none';
  c.visual = img;
  const fps = config.fps;
  let lastIndex = -1;
  c.update = async (local) => {
    let mt = Math.max(0, c.mediaStart + local);
    if (c.loop && c.mediaDuration) mt %= c.mediaDuration;
    const index = Math.floor(mt * fps + 1e-6);
    if (index === lastIndex) return;
    lastIndex = index;
    img.src = hfUrl(`frames?src=${encodeURIComponent(c.src!)}&fps=${fps}&i=${index}`);
    await img.decode().catch(() => { warnings.push(`[${c.id}] missing video frame ${index}`); });
  };
}

function setupAudio(c: Clip) {
  const audio = c.el as HTMLAudioElement;
  audio.pause();
  if (params.mode !== 'preview') { audio.muted = true; return; }
  audio.preload = 'auto';
  c.update = (local) => {
    const t = Math.max(0, c.mediaStart + local);
    // fades approximated with element volume in preview
    let v = c.volume;
    if (c.fadeIn > 0) v *= Math.min(1, local / c.fadeIn);
    if (c.fadeOut > 0) v *= Math.min(1, (c.timing.duration - local) / c.fadeOut);
    audio.volume = Math.max(0, Math.min(1, v));
    if (playing) {
      if (audio.paused) audio.play().catch(() => warnings.push('audio playback blocked by the browser (click the preview)'));
      if (Math.abs(audio.currentTime - t) > 0.25) audio.currentTime = t;
    } else if (Math.abs(audio.currentTime - t) > 0.05) {
      audio.currentTime = t;
    }
  };
}

// ---------------------------------------------------------------- lottie
async function setupLottie(c: Clip) {
  if (!window.lottie) {
    errors.push(`[${c.id}] data-hf-lottie needs lottie-web: add <script src="/__hf/lib/lottie.js"></script>`);
    return;
  }
  const anim = window.lottie.loadAnimation({
    container: c.el, renderer: c.el.dataset.renderer ?? 'svg', loop: c.loop, autoplay: false, path: hfUrlFromRef(c.el.dataset.hfLottie!),
  });
  await new Promise<void>((resolve, reject) => {
    anim.addEventListener('DOMLoaded', () => resolve());
    anim.addEventListener('data_failed', () => reject(new Error(`[${c.id}] failed to load lottie ${c.el.dataset.hfLottie}`)));
  });
  const adapter = createAdapter(anim);
  c.update = (local) => adapter.seek(local);
}

function hfUrlFromRef(ref: string): string {
  return new URL(ref, document.baseURI).href;
}

// -------------------------------------------------------------- captions
async function setupCaptions(c: Clip) {
  const d = c.el.dataset;
  const style = (CAPTION_STYLES.includes(d.style as CaptionStyleName) ? d.style : 'karaoke') as CaptionStyleName;
  if (!d.style) c.el.setAttribute('data-style', style);
  const docData = await fetchJson<CaptionDocument>(hfUrl(`captions?src=${encodeURIComponent(c.src!)}`));
  const offset = Number(d.offset ?? 0) || 0;
  const pages = groupWords(documentWords(docData), {
    maxWords: Number(d.maxWords ?? 6) || 6,
    maxChars: Number(d.maxChars ?? 32) || 32,
    pauseBreak: Number(d.pauseBreak ?? 0.6) || 0.6,
  });
  let current: CaptionPage | null = null;
  let spans: HTMLSpanElement[] = [];
  const container = document.createElement('div');
  container.className = 'hf-cap-page';
  c.el.replaceChildren(container);
  c.update = (local) => {
    const t = local - offset;
    const page = pageAt(pages, t);
    if (page !== current) {
      current = page;
      spans = (page?.words ?? []).map((w) => {
        const s = document.createElement('span');
        s.className = 'hf-cap-word';
        s.textContent = w.text;
        return s;
      });
      container.replaceChildren(...spans);
    }
    if (!page) return;
    page.words.forEach((w, i) => {
      const v = wordVisual(style, w, t);
      const s = spans[i]!;
      s.dataset.state = v.state;
      s.style.opacity = String(v.opacity);
      s.style.transform = v.scale !== 1 || v.y !== 0 ? `translateY(${v.y.toFixed(2)}px) scale(${v.scale.toFixed(4)})` : '';
      s.style.visibility = v.visible ? '' : 'hidden';
      s.style.setProperty('--fill', `${(v.fill * 100).toFixed(2)}%`);
    });
  };
}

// ------------------------------------------------------------- particles
function setupParticles(c: Clip) {
  const canvas = c.el instanceof HTMLCanvasElement ? c.el : (() => {
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    c.el.append(cv);
    return cv;
  })();
  const d = c.el.dataset;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width || config.width);
  canvas.height = Math.round(rect.height || config.height);
  const preset = (PARTICLE_PRESETS.includes(d.hfParticles as ParticlePreset) ? d.hfParticles : 'snow') as ParticlePreset;
  const opts = {
    preset, count: Number(d.count ?? 120) || 120, width: canvas.width, height: canvas.height,
    seed: d.seed ? Number(d.seed) : hashString(c.id), speed: Number(d.speed ?? 1) || 1,
    colors: (d.colors ?? '#ffffff').split(',').map((s) => s.trim()),
  };
  const ctx = canvas.getContext('2d')!;
  c.update = (local) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particlesAt(opts, local)) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else if (p.shape === 'star') {
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const r = k % 2 === 0 ? p.size * 1.6 : p.size * 0.4;
          const a = (k * Math.PI) / 4;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------- audio visualizers
function setupVisualizers() {
  root?.querySelectorAll<HTMLCanvasElement>('canvas[data-hf-visualizer]').forEach((canvas) => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width || 600);
    canvas.height = Math.round(rect.height || 200);
    const ctx = canvas.getContext('2d')!;
    const mode = canvas.dataset.hfVisualizer || 'bars';
    const color = canvas.dataset.color ?? '#ffffff';
    frameCallbacks.push((t) => {
      const bands = runtime.audio.bands(t);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      if (!bands.length) return;
      if (mode === 'circle') {
        const cx = canvas.width / 2, cy = canvas.height / 2, r0 = Math.min(cx, cy) * 0.45;
        ctx.lineWidth = Math.max(2, (Math.PI * 2 * r0) / bands.length / 2);
        bands.forEach((b, i) => {
          const a = (i / bands.length) * Math.PI * 2 - Math.PI / 2;
          const r1 = r0 + b * Math.min(cx, cy) * 0.5;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
          ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          ctx.stroke();
        });
      } else {
        const w = canvas.width / bands.length;
        bands.forEach((b, i) => {
          const h = Math.max(2, b * canvas.height);
          ctx.fillRect(i * w + w * 0.15, canvas.height - h, w * 0.7, h);
        });
      }
    });
  });
}

// ------------------------------------------------------------- seeking
function clipFor(el: Element | null): Clip | null {
  for (let n: Element | null = el; n; n = n.parentElement) {
    const c = clipByEl.get(n);
    if (c) return c;
  }
  return null;
}

function seekDocumentAnimations(t: number) {
  const mine = new Set(registered.map((r) => r.adapter.target));
  for (const anim of document.getAnimations()) {
    if (mine.has(anim)) continue;
    if (typeof CSSTransition !== 'undefined' && anim instanceof CSSTransition) continue;
    const target = (anim.effect as KeyframeEffect | null)?.target ?? null;
    const c = clipFor(target);
    const local = c ? t - c.timing.start : t;
    anim.pause();
    anim.currentTime = Math.max(0, local * 1000);
  }
}

function offsetOf(r: Registered): number {
  if (typeof r.offset === 'number') return r.offset;
  const c = clips.find((x) => x.id === r.offset);
  if (!c) throw new Error(`hf.register(): unknown clip "${r.offset}"`);
  return c.timing.start;
}

function applyTime(t: number): Promise<unknown>[] {
  currentTime = t;
  vt.set(t * 1000);
  const pending: Promise<unknown>[] = [];
  for (const c of clips) {
    const active = t >= c.timing.start && t < c.timing.end;
    const local = t - c.timing.start;
    if (c.kind !== 'audio') {
      c.visual.style.visibility = active ? '' : 'hidden';
      if (active) c.el.setAttribute('data-hf-active', ''); else c.el.removeAttribute('data-hf-active');
    }
    if (active || c.kind === 'video' || c.kind === 'audio') applyEffects(c, Math.max(0, Math.min(local, c.timing.duration)));
    if (c.update) {
      if (active) {
        const r = c.update(local, t);
        if (r instanceof Promise) pending.push(r);
      } else if ((c.kind === 'audio' || c.kind === 'video') && params.mode === 'preview') {
        (c.el as HTMLMediaElement).pause();
      }
    }
  }
  if (gsapGlobal) gsapGlobal.seek(t);
  for (const r of registered) {
    try { r.adapter.seek(t - r.resolvedOffset); } catch (e) { errors.push(`adapter seek failed: ${(e as Error).message}`); }
  }
  seekDocumentAnimations(t);
  const frame = Math.round(t * config.fps);
  for (const cb of frameCallbacks) {
    try { cb(t, { frame, fps: config.fps }); } catch (e) { errors.push(`onFrame callback: ${(e as Error).stack ?? e}`); }
  }
  vt.flushFrame();
  return pending;
}

async function seek(t: number): Promise<void> {
  await readyPromise;
  const time = Math.max(0, Math.min(t, totalDuration));
  const pending = applyTime(time);
  if (pending.length) await Promise.all(pending);
  // wait for any image that is still decoding
  const imgs = Array.from(document.images).filter((i) => !i.complete);
  if (imgs.length) await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
  await document.fonts.ready;
  postState();
}

// ------------------------------------------------------------ playback
function tick() {
  if (!playing) return;
  let t = playStartTime + (vt.real.now() - playStartReal) / 1000;
  if (t >= totalDuration) {
    if (root?.hasAttribute('data-loop-preview')) { playStartTime = 0; playStartReal = vt.real.now(); t = 0; }
    else { t = totalDuration; playing = false; }
  }
  applyTime(Math.min(t, Math.max(0, totalDuration - 1e-6)));
  postState();
  if (playing) vt.real.requestAnimationFrame(tick);
  else pauseMedia();
}

function pauseMedia() {
  for (const c of clips) if (c.kind === 'audio' || (c.kind === 'video' && !params.videoFrames)) (c.el as HTMLMediaElement).pause();
}

function play() {
  if (playing || !isReady) return;
  if (currentTime >= totalDuration - 1e-3) currentTime = 0;
  playing = true;
  playStartTime = currentTime;
  playStartReal = vt.real.now();
  vt.real.requestAnimationFrame(tick);
  postState();
}

function pause() {
  playing = false;
  pauseMedia();
  postState();
}

function postState() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'hf:state', time: currentTime, duration: totalDuration, playing, fps: config.fps }, '*');
  }
}

// ---------------------------------------------------------------- init
async function init() {
  injectBaseStyles();
  root = document.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (!root) {
    errors.push(`no element with data-composition found`);
    root = document.body;
  } else {
    config = readConfig((n) => root!.getAttribute(n));
    root.style.width = `${config.width}px`;
    root.style.height = `${config.height}px`;
    if (config.background) root.style.background = config.background;
  }
  document.documentElement.style.background = config.background ?? '';

  // 1. collect clips
  const els = Array.from(root.querySelectorAll<HTMLElement>(TIMED_SELECTOR));
  const parsed = els.map((el, i) => readClipRaw(el, i));
  // 2. media durations
  await Promise.all(parsed.map(async (p) => {
    const needs = (p.clip.kind === 'audio' || p.clip.kind === 'video') && !p.raw.duration && !p.raw.end && p.clip.src;
    if (needs || (p.clip.kind === 'video' && params.videoFrames && p.clip.loop)) {
      p.clip.mediaDuration = await probeDuration(p.clip.src!);
      p.raw.mediaDuration = p.clip.mediaDuration;
    }
  }));
  // 3. resolve timings
  let timings: ResolvedTiming[] = [];
  try {
    timings = resolveTimings(parsed.map((p) => p.raw), { fps: config.fps, compositionDuration: config.duration });
  } catch (e) {
    errors.push((e as Error).message);
    // fall back to a permissive resolution so the page still renders
    timings = parsed.map((p) => ({ id: p.raw.id, start: 0, duration: config.duration ?? 0, end: config.duration ?? 0, track: 0 }));
  }
  clips = parsed.map((p, i) => ({ ...p.clip, timing: timings[i]! }));
  clipByEl = new WeakMap(clips.map((c) => [c.el, c]));

  // 4. wait for the page (scripts, images, fonts, user blockers)
  if (document.readyState !== 'complete') await new Promise((r) => window.addEventListener('load', r, { once: true }));
  if (window.gsap && params.gsapGlobal) gsapGlobal = createGsapGlobalAdapter(window.gsap);
  collectLegacyTimelines();

  // 5. per-kind setup
  const setups: Promise<unknown>[] = [];
  for (const c of clips) {
    c.fx = parseEffects(c);
    if (c.kind === 'video') setupVideo(c);
    else if (c.kind === 'audio') setupAudio(c);
    else if (c.kind === 'lottie') setups.push(setupLottie(c).catch((e) => errors.push((e as Error).message)));
    else if (c.kind === 'captions') setups.push(setupCaptions(c).catch((e) => errors.push(`[${c.id}] captions: ${(e as Error).message}`)));
    else if (c.kind === 'particles') setupParticles(c);
  }
  const analysisSrc = root.dataset.audioAnalysis;
  if (analysisSrc) setups.push(runtime.audio.load(analysisSrc).catch((e) => errors.push(`audio analysis: ${(e as Error).message}`)));
  setupVisualizers();
  await Promise.all([...setups, document.fonts.ready]);
  // user blockers may be added late (while setups ran)
  for (let i = 0; i < readyBlockers.length; i++) await readyBlockers[i]!.catch((e) => errors.push(`delayReady: ${(e as Error).message}`));

  for (const r of registered) {
    try { r.resolvedOffset = offsetOf(r); } catch (e) { errors.push((e as Error).message); }
  }
  totalDuration = computeDuration();
  isReady = true;
  resolveReady();
  await seek(0);
  window.parent?.postMessage({ type: 'hf:ready', config: { ...config, duration: totalDuration } }, '*');
  window.dispatchEvent(new CustomEvent('hf:ready'));
}

function computeDuration(): number {
  if (config.duration !== null) return config.duration;
  let end = 0;
  for (const c of clips) if (Number.isFinite(c.timing.end)) end = Math.max(end, c.timing.end);
  for (const r of registered) {
    const d = r.adapter.duration();
    if (d !== null && Number.isFinite(d) && d < 1e6) end = Math.max(end, r.resolvedOffset + d);
  }
  if (gsapGlobal) end = Math.max(end, gsapGlobal.duration() ?? 0);
  if (end === 0) warnings.push('composition duration is 0: set data-duration on the composition root');
  return end;
}

function collectLegacyTimelines() {
  const tl = window.__timelines;
  if (!tl) return;
  const list = Array.isArray(tl) ? tl : typeof tl === 'object' ? Object.values(tl as object) : [];
  for (const item of list) register(item);
}

function register(target: unknown, opts: AdapterOptions & { start?: number | string } = {}) {
  if (registered.some((r) => r.adapter.target === target)) return;
  const adapter = createAdapter(target, opts);
  const entry: Registered = { adapter, offset: opts.start ?? 0, resolvedOffset: typeof opts.start === 'number' ? opts.start : 0 };
  registered.push(entry);
  if (isReady) {
    try { entry.resolvedOffset = offsetOf(entry); } catch (e) { errors.push((e as Error).message); }
    totalDuration = computeDuration();
  }
}

function describe() {
  return {
    version: VERSION,
    mode: params.mode,
    ready: isReady,
    config: { ...config, duration: totalDuration, declaredDuration: config.duration },
    frames: frameCount(totalDuration, config.fps),
    clips: clips.map((c) => ({
      id: c.id, kind: c.kind, name: c.name, tag: c.el.tagName.toLowerCase(), start: c.timing.start, end: c.timing.end,
      duration: c.timing.duration, track: c.timing.track, src: c.src, mediaStart: c.mediaStart, mediaDuration: c.mediaDuration,
      volume: c.volume, muted: c.muted, loop: c.loop, fadeIn: c.fadeIn, fadeOut: c.fadeOut, hasEffects: !!c.fx,
    })),
    adapters: [
      ...(gsapGlobal ? [{ type: gsapGlobal.type, offset: 0, duration: gsapGlobal.duration() }] : []),
      ...registered.map((r) => ({ type: r.adapter.type, offset: r.resolvedOffset, duration: r.adapter.duration() })),
    ],
    libraries: { gsap: !!window.gsap, lottie: !!window.lottie, anime: !!(window as Any).anime, three: !!(window as Any).THREE },
    errors: [...errors],
    warnings: [...warnings],
  };
}

function bandsAt(t: number): number[] {
  if (!audioData) return [];
  const i = Math.max(0, Math.min(audioData.frames.length - 1, Math.floor(t * audioData.fps)));
  return audioData.frames[i]?.slice(1) ?? [];
}

const runtime = {
  version: VERSION,
  get mode() { return params.mode; },
  get config() { return { ...config, duration: totalDuration }; },
  get time() { return currentTime; },
  get duration() { return totalDuration; },
  get isReady() { return isReady; },
  get playing() { return playing; },
  ready: readyPromise,
  register,
  onFrame(cb: (t: number, info: { frame: number; fps: number }) => void) { frameCallbacks.push(cb); },
  delayReady(p: Promise<unknown>) { readyBlockers.push(p); },
  seek,
  seekFrame: (i: number) => seek(i / config.fps),
  play,
  pause,
  describe,
  errors,
  warnings,
  /** Deterministic random in [0,1) for a key (independent of call order). */
  random: (key: string | number) => {
    const h = hashString(String(key) + ':' + params.seed);
    return (h % 1000003) / 1000003;
  },
  audio: {
    async load(src: string, bands = 32) {
      audioData = await fetchJson(hfUrl(`analysis?src=${encodeURIComponent(serverPath(src))}&fps=${config.fps}&bands=${bands}`));
    },
    level(t: number = currentTime): number {
      if (!audioData) return 0;
      const i = Math.max(0, Math.min(audioData.frames.length - 1, Math.floor(t * audioData.fps)));
      return audioData.frames[i]?.[0] ?? 0;
    },
    bands: bandsAt,
  },
};
type Runtime = typeof runtime;

window.hf = runtime;
window.__hf = runtime;

window.addEventListener('message', (e: MessageEvent) => {
  const m = e.data as { type?: string; time?: number };
  if (!m || typeof m.type !== 'string' || !m.type.startsWith('hf:')) return;
  if (m.type === 'hf:play') play();
  else if (m.type === 'hf:pause') pause();
  else if (m.type === 'hf:seek' && typeof m.time === 'number') { pause(); void seek(m.time); }
  else if (m.type === 'hf:describe') (e.source as Window | null)?.postMessage({ type: 'hf:description', data: describe() }, { targetOrigin: '*' });
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void init().catch(fail));
else void init().catch(fail);

function fail(e: unknown) {
  errors.push(`runtime init failed: ${(e as Error)?.stack ?? e}`);
  isReady = true;
  resolveReady();
}
