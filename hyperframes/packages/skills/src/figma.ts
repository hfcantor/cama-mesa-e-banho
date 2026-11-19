/**
 * Figma → composition.
 *
 * Uses the official Figma REST API (https://www.figma.com/developers/api):
 *   GET /v1/files/:key/nodes?ids=…        document tree of the frame
 *   GET /v1/images/:key?ids=…&format=png  renders of nodes we cannot express in HTML (vectors, boolean ops…)
 *   GET /v1/files/:key/images             download URLs of image fills (imageRef)
 * Requires a personal access token in FIGMA_TOKEN. The converter itself is
 * pure and also works offline on a saved API response (`--from-json`).
 *
 * Mapping: FRAME/GROUP/COMPONENT/INSTANCE → positioned <div>; RECTANGLE/ELLIPSE →
 * <div> with fills, strokes, radii, shadows, blur; TEXT → <div> with font
 * properties; IMAGE fills → background-image; other node types → exported PNG.
 * Each direct child of the frame becomes a timed clip with a staggered entrance.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectManifest } from '@hfr/core';
import { escapeAttr, escapeHtml, even, htmlDocument } from './util.ts';

/* Subset of the Figma node schema used by the converter. */
export interface FigmaColor { r: number; g: number; b: number; a: number }
export interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'EMOJI' | 'VIDEO';
  visible?: boolean; opacity?: number; color?: FigmaColor;
  gradientStops?: Array<{ position: number; color: FigmaColor }>;
  gradientHandlePositions?: Array<{ x: number; y: number }>;
  imageRef?: string; scaleMode?: 'FILL' | 'FIT' | 'TILE' | 'STRETCH';
}
export interface FigmaEffect { type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR'; visible?: boolean; radius: number; color?: FigmaColor; offset?: { x: number; y: number }; spread?: number }
export interface FigmaNode {
  id: string; name: string; type: string; visible?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number } | null;
  fills?: FigmaPaint[]; strokes?: FigmaPaint[]; strokeWeight?: number;
  cornerRadius?: number; rectangleCornerRadii?: [number, number, number, number];
  effects?: FigmaEffect[]; opacity?: number; blendMode?: string; clipsContent?: boolean; rotation?: number;
  characters?: string;
  style?: { fontFamily?: string; fontWeight?: number; fontSize?: number; lineHeightPx?: number; letterSpacing?: number; textAlignHorizontal?: 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED'; textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM'; italic?: boolean; textCase?: string; textDecoration?: string };
}

export interface ConvertOptions {
  /** Map imageRef → local path or URL (from /v1/files/:key/images). */
  imageFills?: Record<string, string>;
  /** Map node id → rendered PNG path (from /v1/images). */
  renders?: Record<string, string>;
  duration?: number;
  fps?: number;
  stagger?: number;
  animate?: boolean;
}

export interface ConvertResult { html: string; width: number; height: number; warnings: string[]; needsRender: string[] }

const css = (c: FigmaColor, opacity = 1) => {
  const a = Math.round(c.a * opacity * 1000) / 1000;
  const v = (x: number) => Math.round(x * 255);
  return a >= 1 ? `rgb(${v(c.r)} ${v(c.g)} ${v(c.b)})` : `rgb(${v(c.r)} ${v(c.g)} ${v(c.b)} / ${a})`;
};

function paintToCss(p: FigmaPaint, o: ConvertOptions, warnings: string[]): string | null {
  if (p.visible === false) return null;
  const op = p.opacity ?? 1;
  switch (p.type) {
    case 'SOLID': return p.color ? `linear-gradient(${css(p.color, op)},${css(p.color, op)})` : null;
    case 'GRADIENT_LINEAR': {
      const [h0, h1] = p.gradientHandlePositions ?? [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }];
      const angle = Math.round((Math.atan2(h1!.y - h0!.y, h1!.x - h0!.x) * 180) / Math.PI + 90);
      return `linear-gradient(${angle}deg,${(p.gradientStops ?? []).map((s) => `${css(s.color, op)} ${Math.round(s.position * 100)}%`).join(',')})`;
    }
    case 'GRADIENT_RADIAL':
    case 'GRADIENT_DIAMOND':
      return `radial-gradient(${(p.gradientStops ?? []).map((s) => `${css(s.color, op)} ${Math.round(s.position * 100)}%`).join(',')})`;
    case 'GRADIENT_ANGULAR':
      return `conic-gradient(${(p.gradientStops ?? []).map((s) => `${css(s.color, op)} ${Math.round(s.position * 360)}deg`).join(',')})`;
    case 'IMAGE': {
      const src = p.imageRef ? o.imageFills?.[p.imageRef] : undefined;
      if (!src) { warnings.push(`image fill ${p.imageRef ?? '?'} has no downloaded file`); return null; }
      return `url("${src}")`;
    }
    default:
      warnings.push(`unsupported paint ${p.type}`);
      return null;
  }
}

const VECTORISH = new Set(['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'REGULAR_POLYGON', 'SLICE']);

export function convertFigmaFrame(frame: FigmaNode, o: ConvertOptions = {}): ConvertResult {
  const warnings: string[] = [];
  const needsRender: string[] = [];
  const box = frame.absoluteBoundingBox;
  if (!box) throw new Error(`node ${frame.id} has no absoluteBoundingBox`);
  const W = even(box.width), H = even(box.height);
  const stagger = o.stagger ?? 0.12;
  let order = 0;

  const render = (n: FigmaNode, parentBox: { x: number; y: number }, depth: number): string => {
    if (n.visible === false) return '';
    const b = n.absoluteBoundingBox;
    if (!b) return '';
    const styles: string[] = [
      'position:absolute', `left:${round(b.x - parentBox.x)}px`, `top:${round(b.y - parentBox.y)}px`, `width:${round(b.width)}px`, `height:${round(b.height)}px`,
    ];
    if (n.opacity !== undefined && n.opacity < 1) styles.push(`opacity:${round(n.opacity)}`);
    if (n.rotation) styles.push(`rotate:${round((-n.rotation * 180) / Math.PI)}deg`);
    const attrs: string[] = [`data-figma-id="${escapeAttr(n.id)}"`, `data-name="${escapeAttr(n.name)}"`];
    if (depth === 1 && o.animate !== false) {
      const id = `fig-${n.id.replace(/[^\w-]/g, '-')}`;
      attrs.unshift(`id="${id}"`);
      attrs.push(`data-start="${round(0.2 + order++ * stagger)}"`, `data-enter="${n.type === 'TEXT' ? 'fade-up 0.7 out-expo' : 'fade 0.6'}"`);
    }
    // Vector-like nodes: use a rendered PNG when available.
    if (VECTORISH.has(n.type)) {
      const png = o.renders?.[n.id];
      if (!png) { needsRender.push(n.id); warnings.push(`${n.type} "${n.name}" needs a PNG render (online mode exports it)`); return ''; }
      return `<img src="${escapeAttr(png)}" alt="" ${attrs.join(' ')} style="${escapeAttr(styles.join(";"))}">`;
    }
    const bgs = (n.type === 'TEXT' ? [] : (n.fills ?? []).map((p) => paintToCss(p, o, warnings)).filter(Boolean).reverse()) as string[];
    if (bgs.length) {
      styles.push(`background:${bgs.join(',')}`);
      if ((n.fills ?? []).some((p) => p.type === 'IMAGE' && p.visible !== false)) {
        const mode = (n.fills ?? []).find((p) => p.type === 'IMAGE')?.scaleMode;
        styles.push(`background-size:${mode === 'FIT' ? 'contain' : mode === 'TILE' ? 'auto' : 'cover'}`, 'background-position:center', `background-repeat:${mode === 'TILE' ? 'repeat' : 'no-repeat'}`);
      }
    }
    if (n.type === 'ELLIPSE') styles.push('border-radius:50%');
    else if (n.rectangleCornerRadii) styles.push(`border-radius:${n.rectangleCornerRadii.map((r) => `${round(r)}px`).join(' ')}`);
    else if (n.cornerRadius) styles.push(`border-radius:${round(n.cornerRadius)}px`);
    const stroke = (n.strokes ?? []).find((s) => s.visible !== false && s.type === 'SOLID' && s.color);
    if (stroke && n.strokeWeight) styles.push(`box-shadow:inset 0 0 0 ${round(n.strokeWeight)}px ${css(stroke.color!, stroke.opacity ?? 1)}`);
    const shadows: string[] = [];
    for (const e of n.effects ?? []) {
      if (e.visible === false) continue;
      if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') shadows.push(`${e.type === 'INNER_SHADOW' ? 'inset ' : ''}${round(e.offset?.x ?? 0)}px ${round(e.offset?.y ?? 0)}px ${round(e.radius)}px ${round(e.spread ?? 0)}px ${css(e.color ?? { r: 0, g: 0, b: 0, a: 0.25 })}`);
      if (e.type === 'LAYER_BLUR') styles.push(`filter:blur(${round(e.radius / 2)}px)`);
      if (e.type === 'BACKGROUND_BLUR') styles.push(`backdrop-filter:blur(${round(e.radius / 2)}px)`);
    }
    if (shadows.length) {
      const existing = styles.findIndex((s) => s.startsWith('box-shadow:'));
      if (existing >= 0) styles[existing] += `,${shadows.join(',')}`;
      else styles.push(`box-shadow:${shadows.join(',')}`);
    }
    if (n.clipsContent) styles.push('overflow:hidden');
    if (n.type === 'TEXT') {
      const s = n.style ?? {};
      const fill = (n.fills ?? []).find((p) => p.type === 'SOLID' && p.visible !== false && p.color);
      if (fill?.color) styles.push(`color:${css(fill.color, fill.opacity ?? 1)}`);
      if (s.fontFamily) styles.push(`font-family:"${s.fontFamily}",'Inter Variable',system-ui,sans-serif`);
      if (s.fontWeight) styles.push(`font-weight:${s.fontWeight}`);
      if (s.fontSize) styles.push(`font-size:${round(s.fontSize)}px`);
      if (s.lineHeightPx) styles.push(`line-height:${round(s.lineHeightPx)}px`);
      if (s.letterSpacing) styles.push(`letter-spacing:${round(s.letterSpacing)}px`);
      if (s.italic) styles.push('font-style:italic');
      if (s.textCase === 'UPPER') styles.push('text-transform:uppercase');
      if (s.textCase === 'LOWER') styles.push('text-transform:lowercase');
      if (s.textDecoration === 'UNDERLINE') styles.push('text-decoration:underline');
      styles.push(`text-align:${(s.textAlignHorizontal ?? 'LEFT').toLowerCase().replace('justified', 'justify')}`, 'white-space:pre-wrap', 'margin:0');
      if (s.textAlignVertical && s.textAlignVertical !== 'TOP') styles.push('display:flex', 'flex-direction:column', `justify-content:${s.textAlignVertical === 'CENTER' ? 'center' : 'flex-end'}`);
      return `<div ${attrs.join(' ')} style="${escapeAttr(styles.join(";"))}">${escapeHtml(n.characters ?? '')}</div>`;
    }
    const kids = (n.children ?? []).map((c) => render(c, b, depth + 1)).filter(Boolean).join('');
    return `<div ${attrs.join(' ')} style="${escapeAttr(styles.join(";"))}">${kids}</div>`;
  };

  const frameBg = (frame.fills ?? []).map((p) => paintToCss(p, o, warnings)).filter(Boolean).reverse().join(',');
  const children = (frame.children ?? []).map((c) => `    ${render(c, box, 1)}`).filter((s) => s.trim()).join('\n');
  const fontFamilies = new Set<string>();
  const walk = (n: FigmaNode) => { if (n.style?.fontFamily) fontFamilies.add(n.style.fontFamily); n.children?.forEach(walk); };
  walk(frame);
  const html = htmlDocument({
    title: frame.name, width: W, height: H, fps: o.fps ?? 30, duration: o.duration ?? 5, background: '#ffffff',
    head: `  <!-- Fonts used in the design: ${[...fontFamilies].join(', ') || 'none'}. Add @font-face rules for them (local files) to match exactly. -->
  <style>.figma-frame{position:absolute;inset:0;${frameBg ? `background:${frameBg};` : ''}overflow:hidden}</style>`,
    body: `    <div class="figma-frame" data-figma-id="${escapeAttr(frame.id)}" data-name="${escapeAttr(frame.name)}">\n${children}\n    </div>`,
  });
  return { html, width: W, height: H, warnings: [...new Set(warnings)], needsRender };
}

const round = (n: number) => Math.round(n * 100) / 100;

// ------------------------------------------------------------------ API
const API = 'https://api.figma.com/v1';

async function figmaGet<T>(pathname: string, token: string): Promise<T> {
  const res = await fetch(`${API}${pathname}`, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) throw new Error(`Figma API ${res.status} ${pathname}: ${(await res.text()).slice(0, 300)}`);
  return res.json() as Promise<T>;
}

async function download(url: string, out: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}: ${url}`);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(await res.arrayBuffer()));
}

/** Parses "https://www.figma.com/design/<key>/Name?node-id=12-34" → key + node id. */
export function parseFigmaUrl(input: string): { fileKey: string; nodeId: string | null } {
  const m = /figma\.com\/(?:file|design|proto)\/([A-Za-z0-9]+)/.exec(input);
  if (!m) return { fileKey: input, nodeId: null };
  const node = new URL(input).searchParams.get('node-id');
  return { fileKey: m[1]!, nodeId: node ? node.replace(/-/g, ':') : null };
}

export async function importFigma(o: { fileKey: string; nodeId: string; outDir: string; token?: string; duration?: number }): Promise<{ dir: string; warnings: string[] }> {
  const token = o.token ?? process.env.FIGMA_TOKEN;
  if (!token) throw new Error('FIGMA_TOKEN is not set (create a personal access token in Figma: Settings → Security)');
  const dir = path.resolve(o.outDir);
  const data = await figmaGet<{ nodes: Record<string, { document: FigmaNode } | null> }>(`/files/${o.fileKey}/nodes?ids=${encodeURIComponent(o.nodeId)}&geometry=paths`, token);
  const frame = data.nodes[o.nodeId]?.document;
  if (!frame) throw new Error(`node ${o.nodeId} not found in file ${o.fileKey}`);
  await mkdir(path.join(dir, 'assets', 'figma'), { recursive: true });
  await writeFile(path.join(dir, 'figma-node.json'), JSON.stringify(frame, null, 2));
  // image fills
  const imageFills: Record<string, string> = {};
  const refs = new Set<string>();
  const collect = (n: FigmaNode) => { for (const f of n.fills ?? []) if (f.type === 'IMAGE' && f.imageRef) refs.add(f.imageRef); n.children?.forEach(collect); };
  collect(frame);
  if (refs.size) {
    const imgs = await figmaGet<{ meta: { images: Record<string, string> } }>(`/files/${o.fileKey}/images`, token);
    for (const ref of refs) {
      const url = imgs.meta.images[ref];
      if (!url) continue;
      const rel = `assets/figma/${ref.slice(0, 16)}.png`;
      await download(url, path.join(dir, rel));
      imageFills[ref] = rel;
    }
  }
  // vector renders
  const first = convertFigmaFrame(frame, { imageFills, duration: o.duration });
  const renders: Record<string, string> = {};
  if (first.needsRender.length) {
    for (let i = 0; i < first.needsRender.length; i += 50) {
      const ids = first.needsRender.slice(i, i + 50);
      const r = await figmaGet<{ images: Record<string, string | null> }>(`/images/${o.fileKey}?ids=${encodeURIComponent(ids.join(','))}&format=png&scale=2`, token);
      for (const [id, url] of Object.entries(r.images)) {
        if (!url) continue;
        const rel = `assets/figma/node-${id.replace(/[^\w-]/g, '-')}.png`;
        await download(url, path.join(dir, rel));
        renders[id] = rel;
      }
    }
  }
  const result = convertFigmaFrame(frame, { imageFills, renders, duration: o.duration });
  await writeFile(path.join(dir, 'index.html'), result.html);
  const manifest: ProjectManifest = { name: frame.name, entry: 'index.html', output: { file: 'renders/figma.mp4' } };
  await writeFile(path.join(dir, 'hyperframes.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { dir, warnings: result.warnings };
}

/** Offline conversion of a saved node JSON (e.g. figma-node.json or an API response). */
export async function convertFigmaJson(json: unknown, outDir: string, o: ConvertOptions = {}): Promise<{ dir: string; warnings: string[] }> {
  const data = json as { document?: FigmaNode; nodes?: Record<string, { document: FigmaNode }> } & FigmaNode;
  const frame: FigmaNode | undefined = data.nodes ? Object.values(data.nodes)[0]?.document : data.document ?? (data.type ? data : undefined);
  if (!frame) throw new Error('JSON does not contain a Figma node');
  const dir = path.resolve(outDir);
  await mkdir(dir, { recursive: true });
  const r = convertFigmaFrame(frame, o);
  await writeFile(path.join(dir, 'index.html'), r.html);
  await writeFile(path.join(dir, 'hyperframes.json'), JSON.stringify({ name: frame.name, entry: 'index.html' }, null, 2) + '\n');
  return { dir, warnings: r.warnings };
}
