/**
 * Composition builder: create HyperFrames compositions from code.
 *
 *   const comp = new Composition({ width: 1920, height: 1080, fps: 30, duration: 6 });
 *   comp.add(h('h1', { start: 0, duration: 3, enter: 'fade-up 0.6', style: { color: '#fff' } }, 'Hello'));
 *   comp.audio('assets/music.mp3', { volume: 0.6, fadeOut: 1 });
 *   await comp.write('out/hello');            // index.html + hyperframes.json
 *   await comp.render('out/hello.mp4');       // real render (Chromium + FFmpeg)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { escapeAttr, escapeHtml, type ProjectManifest } from '@hfr/core';
import { renderProject, type RenderOptions, type RenderResult } from '@hfr/producer';
import { LIBRARY_TAGS } from '@hfr/registry';

export type Style = Record<string, string | number>;

export interface ClipProps {
  id?: string;
  name?: string;
  start?: number | string;
  duration?: number | string;
  end?: number | string;
  track?: number;
  enter?: string;
  exit?: string;
  keyframes?: Array<Record<string, number | string>>;
  kenburns?: string;
  class?: string;
  style?: Style;
  attrs?: Record<string, string | number | boolean>;
}

export interface Node { html: string }

const UNITLESS = new Set(['opacity', 'z-index', 'font-weight', 'line-height', 'flex', 'flex-grow', 'flex-shrink', 'order', 'scale']);
const kebab = (s: string) => (s.startsWith('--') ? s : s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));

export function css(style: Style): string {
  return Object.entries(style).map(([k, v]) => `${kebab(k)}:${typeof v === 'number' && !UNITLESS.has(kebab(k)) && v !== 0 ? `${v}px` : v}`).join(';');
}

function attrs(p: ClipProps): string {
  const out: string[] = [];
  const add = (k: string, v: unknown) => { if (v !== undefined && v !== null && v !== false) out.push(v === true ? k : `${k}="${escapeAttr(String(v))}"`); };
  add('id', p.id); add('class', p.class); add('data-name', p.name);
  add('data-start', p.start); add('data-duration', p.duration); add('data-end', p.end); add('data-track', p.track);
  add('data-enter', p.enter); add('data-exit', p.exit); add('data-kenburns', p.kenburns);
  if (p.keyframes) add('data-keyframes', JSON.stringify(p.keyframes));
  for (const [k, v] of Object.entries(p.attrs ?? {})) add(k, v);
  if (p.style && Object.keys(p.style).length) add('style', css(p.style));
  return out.length ? ' ' + out.join(' ') : '';
}

const VOID = new Set(['img', 'br', 'hr', 'input', 'source', 'meta', 'link']);

/** Creates an element node. Strings are escaped; use raw() for trusted HTML. */
export function h(tag: string, props: ClipProps = {}, ...children: Array<Node | string | number | null | undefined | false>): Node {
  if (!/^[a-z][a-z0-9-]*$/.test(tag)) throw new Error(`invalid tag "${tag}"`);
  const inner = children.filter((c) => c !== null && c !== undefined && c !== false).map((c) => (typeof c === 'object' ? c.html : escapeHtml(String(c)))).join('');
  return { html: VOID.has(tag) ? `<${tag}${attrs(props)}>` : `<${tag}${attrs(props)}>${inner}</${tag}>` };
}

export const raw = (html: string): Node => ({ html });

export interface CompositionOptions {
  name?: string;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  background?: string;
  title?: string;
  fonts?: Array<'inter' | 'bebas-neue' | 'playfair-display' | 'jetbrains-mono'>;
}

export class Composition {
  readonly options: Required<Omit<CompositionOptions, 'duration' | 'title'>> & { duration?: number; title: string };
  private nodes: string[] = [];
  private headParts: string[] = [];
  private scripts: string[] = [];
  private libs = new Set<string>();
  private manifestAudio: NonNullable<ProjectManifest['audio']> = [];
  private analysis: string | null = null;

  constructor(o: CompositionOptions = {}) {
    this.options = {
      name: o.name ?? 'composition', width: o.width ?? 1920, height: o.height ?? 1080, fps: o.fps ?? 30, duration: o.duration,
      background: o.background ?? '#000000', title: o.title ?? o.name ?? 'composition', fonts: o.fonts ?? ['inter'],
    };
  }

  add(...nodes: Node[]): this { this.nodes.push(...nodes.map((n) => n.html)); return this; }
  style(cssText: string): this { this.headParts.push(`<style>${cssText}</style>`); return this; }
  head(html: string): this { this.headParts.push(html); return this; }
  use(...libs: Array<'gsap' | 'anime' | 'lottie' | 'three' | 'shader-transitions'>): this { libs.forEach((l) => this.libs.add(l)); return this; }
  /** Inline script appended after the composition (runs before the runtime becomes ready). */
  script(code: string, o: { module?: boolean } = {}): this { this.scripts.push(`<script${o.module ? ' type="module"' : ''}>\n${code}\n</script>`); return this; }

  /** <audio> clip on the timeline (mixed by the producer). */
  audio(src: string, o: { start?: number | string; duration?: number; mediaStart?: number; volume?: number; fadeIn?: number; fadeOut?: number; loop?: boolean; id?: string } = {}): this {
    return this.add(h('audio', {
      id: o.id, start: o.start ?? 0, duration: o.duration,
      attrs: { src, 'data-media-start': o.mediaStart, 'data-volume': o.volume, 'data-fade-in': o.fadeIn, 'data-fade-out': o.fadeOut, 'data-loop': o.loop } as Record<string, string | number | boolean>,
    }));
  }

  /** Project-level track (supports ducking under narration). */
  track(src: string, o: Omit<NonNullable<ProjectManifest['audio']>[number], 'src'> = {}): this { this.manifestAudio.push({ src, ...o }); return this; }

  video(src: string, o: ClipProps & { mediaStart?: number; muted?: boolean; volume?: number } = {}): this {
    return this.add(h('video', { ...o, attrs: { src, 'data-media-start': o.mediaStart, muted: o.muted, 'data-volume': o.volume, ...(o.attrs ?? {}) } as Record<string, string | number | boolean> }));
  }

  image(src: string, o: ClipProps & { alt?: string } = {}): this {
    return this.add(h('img', { ...o, attrs: { src, alt: o.alt ?? '', ...(o.attrs ?? {}) } }));
  }

  captions(src: string, o: ClipProps & { captionStyle?: 'karaoke' | 'pop' | 'highlight' | 'typewriter' | 'bounce' | 'plain'; position?: 'top' | 'center' | 'bottom'; maxWords?: number } = {}): this {
    return this.add(h('div', { ...o, attrs: { 'data-hf-captions': src, 'data-style': o.captionStyle ?? 'karaoke', 'data-position': o.position ?? 'bottom', 'data-max-words': o.maxWords, ...(o.attrs ?? {}) } as Record<string, string | number | boolean> }));
  }

  particles(preset: 'snow' | 'confetti' | 'sparks' | 'bubbles' | 'stars' | 'dust', o: ClipProps & { count?: number; colors?: string[]; seed?: number } = {}): this {
    return this.add(h('canvas', { style: { position: 'absolute', inset: 0, width: '100%', height: '100%' }, ...o, attrs: { 'data-hf-particles': preset, 'data-count': o.count, 'data-colors': o.colors?.join(','), 'data-seed': o.seed } as Record<string, string | number | boolean> }));
  }

  /** Audio file analysed offline for hf.audio.level()/bands() and data-hf-visualizer canvases. */
  analyzeAudio(src: string): this { this.analysis = src; return this; }

  toHTML(): string {
    const o = this.options;
    const fonts = o.fonts.map((f) => `  <link rel="stylesheet" href="/__hf/fonts/${f}/index.css">`).join('\n');
    const libs = [...this.libs].map((l) => `  ${LIBRARY_TAGS[l]}`).join('\n');
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(o.title)}</title>
${fonts}
${libs}
  <style>#stage{font-family:'Inter Variable',system-ui,sans-serif}</style>
${this.headParts.map((p) => `  ${p}`).join('\n')}
</head>
<body>
  <div id="stage" data-composition data-width="${o.width}" data-height="${o.height}" data-fps="${o.fps}"${o.duration !== undefined ? ` data-duration="${o.duration}"` : ''} data-background="${escapeAttr(o.background)}"${this.analysis ? ` data-audio-analysis="${escapeAttr(this.analysis)}"` : ''}>
${this.nodes.map((n) => `    ${n}`).join('\n')}
  </div>
${this.scripts.join('\n')}
</body>
</html>
`;
  }

  manifest(): ProjectManifest {
    return { name: this.options.name, entry: 'index.html', ...(this.manifestAudio.length ? { audio: this.manifestAudio } : {}), output: { file: `renders/${this.options.name}.mp4` } };
  }

  /** Writes index.html and hyperframes.json into `dir`. */
  async write(dir: string): Promise<string> {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), this.toHTML());
    await writeFile(path.join(dir, 'hyperframes.json'), JSON.stringify(this.manifest(), null, 2) + '\n');
    return path.resolve(dir);
  }

  /** Writes the project (to `projectDir`, default next to the output) and renders it. */
  async render(output: string, o: Omit<RenderOptions, 'project' | 'output'> & { projectDir?: string } = {}): Promise<RenderResult> {
    const dir = await this.write(o.projectDir ?? path.join(path.dirname(output), `${path.basename(output, path.extname(output))}.hfproject`));
    return renderProject({ ...o, project: dir, output });
  }
}
