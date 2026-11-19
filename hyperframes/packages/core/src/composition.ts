/**
 * Composition format
 * ------------------
 * A composition is an HTML document containing one root element marked with
 * `data-composition`:
 *
 *   <div data-composition data-width="1920" data-height="1080" data-fps="30" data-duration="10">
 *     <section data-start="0" data-duration="4" data-enter="fade-up 0.6">…</section>
 *     <video src="clip.mp4" data-start="intro.end" data-media-start="2" muted></video>
 *     <audio src="music.mp3" data-volume="0.6" data-fade-out="2"></audio>
 *   </div>
 *
 * Timed elements ("clips") are matched by TIMED_SELECTOR, in document order.
 * This module is the Node-side reader; the browser runtime applies the same rules.
 */
import { attr, contentLocation, escapeAttr, hasAttr, location, parseHtml, textContent, walk, type Element } from './html.ts';
import { parseTimeValue } from './timing.ts';
import {
  DEFAULT_CONFIG,
  type AssetRef, type ClipInfo, type ClipKind, type CompositionConfig, type CompositionInfo,
  type LibraryName, type ScriptInfo, type StyleInfo,
} from './types.ts';

export const ROOT_SELECTOR = '[data-composition]';
export const TIMED_SELECTOR =
  '[data-start],[data-duration],[data-end],audio,video,[data-hf-lottie],[data-hf-captions],[data-hf-particles]';
export const AUTO_ID_PREFIX = 'clip-';

const TIMED_ATTRS = ['data-start', 'data-duration', 'data-end', 'data-hf-lottie', 'data-hf-captions', 'data-hf-particles'];

export function isTimed(el: Element): boolean {
  if (el.tagName === 'audio' || el.tagName === 'video') return true;
  return TIMED_ATTRS.some((a) => hasAttr(el, a));
}

export function clipKind(tag: string, has: (name: string) => boolean): ClipKind {
  if (tag === 'video') return 'video';
  if (tag === 'audio') return 'audio';
  if (has('data-hf-lottie')) return 'lottie';
  if (has('data-hf-captions')) return 'captions';
  if (has('data-hf-particles')) return 'particles';
  if (tag === 'img') return 'image';
  return 'element';
}

const num = (v: string | null, fallback: number): number => {
  if (v === null || v.trim() === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function readConfig(get: (name: string) => string | null): CompositionConfig {
  const fps = num(get('data-fps'), DEFAULT_CONFIG.fps);
  const d = get('data-duration');
  return {
    id: (get('id') ?? get('data-composition')) || null,
    width: Math.round(num(get('data-width'), DEFAULT_CONFIG.width)),
    height: Math.round(num(get('data-height'), DEFAULT_CONFIG.height)),
    fps,
    duration: d ? parseTimeValue(d, fps) : null,
    background: get('data-background'),
  };
}

const URL_IN_CSS = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
const IMPORT_IN_CSS = /@import\s+(?:url\()?\s*['"]([^'"]+)['"]/g;

export function cssUrls(css: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(URL_IN_CSS)) out.push(m[2]!.trim());
  for (const m of css.matchAll(IMPORT_IN_CSS)) out.push(m[1]!.trim());
  return out.filter((u) => !u.startsWith('data:') && !u.startsWith('#'));
}

function detectLibraries(scripts: ScriptInfo[], styles: StyleInfo[]): LibraryName[] {
  const libs = new Set<LibraryName>();
  for (const s of scripts) {
    const hay = `${s.src ?? ''}\n${s.inline ?? ''}`;
    if (/gsap/i.test(s.src ?? '') || /\bgsap\.(to|from|timeline|set)\b/.test(s.inline ?? '')) libs.add('gsap');
    if (/anime/i.test(s.src ?? '') || /\banime(\.animate|\(|\.timeline)/.test(s.inline ?? '')) libs.add('anime');
    if (/lottie/i.test(hay)) libs.add('lottie');
    if (/three/i.test(hay)) libs.add('three');
    if (/tailwind/i.test(s.src ?? '')) libs.add('tailwind');
  }
  if (styles.some((s) => s.tailwind)) libs.add('tailwind');
  return [...libs];
}

export function parseComposition(html: string, file: string | null = null): CompositionInfo {
  const { document, errors } = parseHtml(html);
  let root: Element | null = null;
  const clips: ClipInfo[] = [];
  const scripts: ScriptInfo[] = [];
  const styles: StyleInfo[] = [];
  const assets: AssetRef[] = [];

  walk(document, (el) => {
    if (!root && hasAttr(el, 'data-composition')) root = el;
  });

  const rootEl = root as Element | null;
  const config = rootEl ? readConfig((n) => attr(rootEl, n)) : { ...DEFAULT_CONFIG };
  let index = 0;

  const visitTree = (el: Element, inRoot: boolean) => {
    const isRoot = el === rootEl;
    const within = inRoot || isRoot;
    if (within && !isRoot && isTimed(el)) {
      const id = attr(el, 'id');
      const tag = el.tagName;
      const get = (n: string) => attr(el, n);
      clips.push({
        id: id ?? `${AUTO_ID_PREFIX}${index}`,
        autoId: !id,
        tag,
        kind: clipKind(tag, (n) => hasAttr(el, n)),
        name: get('data-name'),
        start: get('data-start'),
        duration: get('data-duration'),
        end: get('data-end'),
        track: get('data-track'),
        src: get('src') ?? get('data-src') ?? get('data-hf-lottie') ?? get('data-hf-captions') ?? null,
        mediaStart: parseTimeValue(get('data-media-start'), config.fps) ?? 0,
        volume: num(get('data-volume'), 1),
        muted: hasAttr(el, 'muted'),
        loop: hasAttr(el, 'loop') || hasAttr(el, 'data-loop'),
        fadeIn: parseTimeValue(get('data-fade-in'), config.fps) ?? 0,
        fadeOut: parseTimeValue(get('data-fade-out'), config.fps) ?? 0,
        enter: get('data-enter'),
        exit: get('data-exit'),
        keyframes: get('data-keyframes'),
        kenburns: get('data-kenburns'),
        location: location(el),
      });
      index++;
    }
    collect(el);
    const kids = el.tagName === 'template' ? [] : el.childNodes;
    for (const k of kids) if ('tagName' in k) visitTree(k as Element, within);
  };

  const collect = (el: Element) => {
    const tag = el.tagName;
    if (tag === 'script') {
      const src = attr(el, 'src');
      scripts.push({ src, inline: src ? null : textContent(el), type: attr(el, 'type'), location: src ? location(el) : contentLocation(el) });
    } else if (tag === 'style') {
      const content = textContent(el);
      const tailwind = hasAttr(el, 'data-hf-tailwind') || attr(el, 'type') === 'text/tailwindcss' || /@import\s+["']tailwindcss["']/.test(content);
      styles.push({ content, tailwind, location: contentLocation(el), inlineAttribute: false });
      for (const u of cssUrls(content)) if (!(tailwind && u === 'tailwindcss')) assets.push({ ref: u, attr: 'url()', tag, location: location(el) });
    }
    const styleAttr = attr(el, 'style');
    if (styleAttr) {
      styles.push({ content: styleAttr, tailwind: false, location: location(el), inlineAttribute: true });
      for (const u of cssUrls(styleAttr)) assets.push({ ref: u, attr: 'style', tag, location: location(el) });
    }
    for (const a of ['src', 'poster', 'data-src', 'data-hf-lottie', 'data-hf-captions', 'data-audio-analysis']) {
      const v = attr(el, a);
      if (v && v.trim() && !(a === 'data-hf-captions' && v === '')) assets.push({ ref: v.trim(), attr: a, tag, location: location(el) });
    }
    if (tag === 'link') {
      const rel = (attr(el, 'rel') ?? '').toLowerCase();
      const href = attr(el, 'href');
      if (href && /stylesheet|preload|icon/.test(rel)) assets.push({ ref: href, attr: 'href', tag, location: location(el) });
    }
    const srcset = attr(el, 'srcset');
    if (srcset) for (const part of srcset.split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u) assets.push({ ref: u, attr: 'srcset', tag, location: location(el) });
    }
  };

  for (const n of document.childNodes) if ('tagName' in n) visitTree(n as Element, false);

  return {
    file,
    hasRoot: rootEl !== null,
    config,
    clips,
    scripts,
    styles,
    assets,
    libraries: detectLibraries(scripts, styles),
    parseErrors: errors,
  };
}

/** Is this asset reference served from the project (vs remote / data / runtime)? */
export function isLocalRef(ref: string): boolean {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref) && !ref.startsWith('/__hf/');
}

export function isRemoteRef(ref: string): boolean {
  return /^(?:https?:)?\/\//i.test(ref);
}

/**
 * Updates attributes on the element of a clip while preserving the rest of
 * the source byte-for-byte. `null` removes the attribute.
 */
export function editClipAttributes(html: string, clipId: string, changes: Record<string, string | null>): string {
  const { document } = parseHtml(html);
  let target: Element | null = null;
  let rootSeen: Element | null = null;
  let index = 0;
  const visit = (el: Element, inRoot: boolean) => {
    if (target) return;
    const isRoot = !rootSeen && hasAttr(el, 'data-composition');
    if (isRoot) rootSeen = el;
    const within = inRoot || isRoot;
    if (within && !isRoot && isTimed(el)) {
      const id = attr(el, 'id') ?? `${AUTO_ID_PREFIX}${index}`;
      if (id === clipId) { target = el; return; }
      index++;
    }
    for (const k of el.tagName === 'template' ? [] : el.childNodes) if ('tagName' in k) visit(k as Element, within);
  };
  for (const n of document.childNodes) if ('tagName' in n) visit(n as Element, false);
  const el = target as Element | null;
  if (!el || !el.sourceCodeLocation?.startTag) throw new Error(`clip "${clipId}" not found`);
  const startTag = el.sourceCodeLocation.startTag;
  const attrLocs = el.sourceCodeLocation.attrs ?? {};
  type Edit = { start: number; end: number; text: string };
  const edits: Edit[] = [];
  const tagText = html.slice(startTag.startOffset, startTag.endOffset);
  const insertAt = startTag.endOffset - (tagText.endsWith('/>') ? 2 : 1);
  for (const [name, value] of Object.entries(changes)) {
    if (!/^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/.test(name)) throw new Error(`invalid attribute name "${name}"`);
    const loc = attrLocs[name];
    if (loc) {
      if (value === null) {
        // remove including the preceding whitespace
        let s = loc.startOffset;
        while (s > startTag.startOffset && /\s/.test(html[s - 1]!)) s--;
        edits.push({ start: s, end: loc.endOffset, text: '' });
      } else {
        edits.push({ start: loc.startOffset, end: loc.endOffset, text: `${name}="${escapeAttr(value)}"` });
      }
    } else if (value !== null) {
      edits.push({ start: insertAt, end: insertAt, text: ` ${name}="${escapeAttr(value)}"` });
    }
  }
  edits.sort((a, b) => b.start - a.start);
  let out = html;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}
