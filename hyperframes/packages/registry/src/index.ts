/**
 * @hfr/registry — discover and install reusable building blocks.
 *
 * An item is a directory with item.json:
 * {
 *   "name": "lower-third", "type": "block", "title": "…", "description": "…", "tags": ["text"],
 *   "params": { "title": { "type": "string", "default": "Ada Lovelace", "description": "…" } },
 *   "requires": ["gsap"],          // libraries added to <head> (see LIBRARY_TAGS)
 *   "snippet": "snippet.html",     // inserted at the end of the composition root (blocks)
 *   "head": "head.html",           // inserted once into <head> (styles)
 *   "files": ["assets/x.svg"]      // copied into the project (paths kept)
 * }
 * Templates ("type": "template") are whole projects copied by `hfr init`.
 * Placeholders: {{param}} (HTML-escaped), {{uid}} (unique per insertion).
 *
 * Remote registries: an HTTP(S) URL serving index.json ({ items: ItemManifest[] })
 * with item files at <url>/<name>/<file>.
 */
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT_SELECTOR, escapeHtml, parseHtml, safeJoin, walk } from '@hfr/core';

export type ItemType = 'block' | 'template' | 'transition' | 'caption-style' | 'effect';

export interface ParamDef { type: 'string' | 'number' | 'color' | 'boolean' | 'enum'; default: string | number | boolean; description?: string; options?: string[] }

export interface ItemManifest {
  name: string;
  type: ItemType;
  title: string;
  description: string;
  tags?: string[];
  params?: Record<string, ParamDef>;
  requires?: string[];
  snippet?: string;
  head?: string;
  files?: string[];
  preview?: string;
}

export interface RegistryItem extends ItemManifest {
  source: string; // directory or base URL
  remote: boolean;
}

export const BUILTIN_ITEMS_DIR = fileURLToPath(new URL('../items', import.meta.url));

export const LIBRARY_TAGS: Record<string, string> = {
  gsap: '<script src="/__hf/lib/gsap.js"></script>',
  anime: '<script src="/__hf/lib/anime.js"></script>',
  lottie: '<script src="/__hf/lib/lottie.js"></script>',
  three: '<script type="importmap">{"imports":{"three":"/__hf/lib/three.module.js","three/addons/":"/__hf/lib/three/addons/"}}</script>',
  'shader-transitions': '<script src="/__hf/lib/shader-transitions.js"></script>',
};

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

function validateManifest(m: unknown, where: string): ItemManifest {
  const x = m as ItemManifest;
  if (!x || typeof x !== 'object') throw new Error(`${where}: item.json must be an object`);
  if (!NAME_RE.test(x.name ?? '')) throw new Error(`${where}: invalid name "${x.name}"`);
  if (!['block', 'template', 'transition', 'caption-style', 'effect'].includes(x.type)) throw new Error(`${where}: invalid type "${x.type}"`);
  for (const f of [x.snippet, x.head, ...(x.files ?? [])]) {
    if (f !== undefined && (typeof f !== 'string' || f.includes('..') || path.isAbsolute(f))) throw new Error(`${where}: unsafe file path "${f}"`);
  }
  return x;
}

export async function loadLocalRegistry(dir: string): Promise<RegistryItem[]> {
  const out: RegistryItem[] = [];
  for (const ent of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (!ent.isDirectory()) continue;
    const itemDir = path.join(dir, ent.name);
    const raw = await readFile(path.join(itemDir, 'item.json'), 'utf8').catch(() => null);
    if (!raw) continue;
    out.push({ ...validateManifest(JSON.parse(raw), itemDir), source: itemDir, remote: false });
  }
  return out.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

export async function loadRemoteRegistry(url: string): Promise<RegistryItem[]> {
  const base = url.endsWith('/') ? url : `${url}/`;
  const res = await fetch(new URL('index.json', base));
  if (!res.ok) throw new Error(`registry ${base}: HTTP ${res.status}`);
  const data = (await res.json()) as { items?: unknown[] };
  if (!Array.isArray(data.items)) throw new Error(`registry ${base}: index.json must contain "items"`);
  return data.items.map((m, i) => ({ ...validateManifest(m, `${base}#${i}`), source: base, remote: true }));
}

/** Built-in items + HFR_REGISTRY (comma-separated dirs/URLs) + explicit sources. */
export async function loadRegistry(sources: string[] = []): Promise<RegistryItem[]> {
  const all = [BUILTIN_ITEMS_DIR, ...(process.env.HFR_REGISTRY ?? '').split(',').map((s) => s.trim()).filter(Boolean), ...sources];
  const items = new Map<string, RegistryItem>();
  for (const src of all) {
    const list = /^https?:\/\//.test(src) ? await loadRemoteRegistry(src) : await loadLocalRegistry(src);
    for (const it of list) items.set(it.name, it); // later sources override
  }
  return [...items.values()];
}

export function searchRegistry(items: RegistryItem[], query: string, type?: ItemType): RegistryItem[] {
  const q = query.toLowerCase().trim();
  return items.filter((i) => (!type || i.type === type) && (!q || [i.name, i.title, i.description, ...(i.tags ?? [])].join(' ').toLowerCase().includes(q)));
}

export async function readItemFile(item: RegistryItem, file: string): Promise<Buffer> {
  if (item.remote) {
    const res = await fetch(new URL(`${item.name}/${file}`, item.source));
    if (!res.ok) throw new Error(`${item.name}/${file}: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(safeJoin(item.source, file));
}

export function resolveParams(item: ItemManifest, given: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, def] of Object.entries(item.params ?? {})) {
    const v = given[k] ?? String(def.default);
    if (def.type === 'number' && !Number.isFinite(Number(v))) throw new Error(`param "${k}" must be a number`);
    if (def.type === 'color' && !/^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-z]+)$/i.test(v)) throw new Error(`param "${k}" must be a CSS color`);
    if (def.type === 'enum' && def.options && !def.options.includes(v)) throw new Error(`param "${k}" must be one of ${def.options.join(', ')}`);
    if (def.type === 'boolean' && !/^(true|false)$/.test(v)) throw new Error(`param "${k}" must be true/false`);
    out[k] = v;
  }
  for (const k of Object.keys(given)) if (!(k in out)) throw new Error(`unknown param "${k}" for ${item.name} (known: ${Object.keys(item.params ?? {}).join(', ') || 'none'})`);
  return out;
}

export function fillTemplate(text: string, params: Record<string, string>, uid: string): string {
  return text.replace(/\{\{\s*([a-zA-Z_][\w-]*)\s*\}\}/g, (m, k: string) => (k === 'uid' ? uid : k in params ? escapeHtml(params[k]!).replace(/"/g, '&quot;') : m));
}

export interface AddResult { file: string; inserted: string; copied: string[]; headAdded: string[] }

/** Inserts a block into a composition file, adding required libraries/styles and copying assets. */
export async function addItemToComposition(projectRoot: string, compositionFile: string, item: RegistryItem, params: Record<string, string> = {}): Promise<AddResult> {
  if (item.type === 'template') throw new Error(`${item.name} is a template: use "hfr init --template ${item.name}"`);
  const file = safeJoin(projectRoot, compositionFile);
  let html = await readFile(file, 'utf8');
  const values = resolveParams(item, params);
  const uid = Math.abs(hashCode(`${item.name}:${html.length}:${Date.now()}`)).toString(36).slice(0, 6);
  const headAdded: string[] = [];
  const headParts: string[] = [];
  for (const lib of item.requires ?? []) {
    const tag = LIBRARY_TAGS[lib];
    if (!tag) throw new Error(`${item.name} requires unknown library "${lib}"`);
    const marker = lib === 'three' ? '"three"' : `/__hf/lib/${lib}`;
    if (!html.includes(marker)) { headParts.push(tag); headAdded.push(lib); }
  }
  if (item.head && !html.includes(`data-hf-registry="${item.name}"`)) {
    const head = (await readItemFile(item, item.head)).toString('utf8');
    headParts.push(fillTemplate(head, values, uid).replace(/<(style|script)\b/, `<$1 data-hf-registry="${item.name}"`));
    headAdded.push(`${item.name} head`);
  }
  if (headParts.length) {
    const close = html.search(/<\/head>/i);
    if (close >= 0) html = html.slice(0, close) + headParts.join('\n') + '\n' + html.slice(close);
    else html = headParts.join('\n') + '\n' + html;
  }
  let inserted = '';
  if (item.snippet) {
    inserted = fillTemplate((await readItemFile(item, item.snippet)).toString('utf8'), values, uid).trim();
    const end = compositionRootEnd(html);
    if (end === null) throw new Error(`${compositionFile} has no ${ROOT_SELECTOR} element`);
    html = html.slice(0, end) + `  ${inserted.replace(/\n/g, '\n  ')}\n` + html.slice(end);
  }
  await writeFile(file, html);
  const copied: string[] = [];
  for (const f of item.files ?? []) {
    const dest = safeJoin(projectRoot, f);
    if (await stat(dest).then(() => true, () => false)) continue;
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, await readItemFile(item, f));
    copied.push(f);
  }
  return { file: compositionFile, inserted, copied, headAdded };
}

/** Offset of the closing tag of the composition root (insert position). */
function compositionRootEnd(html: string): number | null {
  const { document } = parseHtml(html);
  let end: number | null = null;
  walk(document, (el) => {
    if (end === null && el.attrs.some((a) => a.name === 'data-composition')) end = el.sourceCodeLocation?.endTag?.startOffset ?? null;
  });
  return end;
}

/** Copies a template item into a new project directory. */
export async function instantiateTemplate(item: RegistryItem, dest: string, params: Record<string, string> = {}): Promise<string[]> {
  if (item.type !== 'template') throw new Error(`${item.name} is not a template`);
  if (item.remote) throw new Error('remote templates must be downloaded first');
  const values = resolveParams(item, params);
  const files: string[] = [];
  const copy = async (rel: string) => {
    const srcAbs = path.join(item.source, rel);
    for (const ent of await readdir(srcAbs, { withFileTypes: true })) {
      const r = rel ? `${rel}/${ent.name}` : ent.name;
      if (r === 'item.json') continue;
      if (ent.isDirectory()) { await copy(r); continue; }
      const out = path.join(dest, r);
      await mkdir(path.dirname(out), { recursive: true });
      if (/\.(html|json|css|js|md|txt|srt|vtt)$/i.test(ent.name)) {
        await writeFile(out, fillTemplate(await readFile(path.join(srcAbs, ent.name), 'utf8'), values, 'tpl'));
      } else {
        await cp(path.join(srcAbs, ent.name), out);
      }
      files.push(r);
    }
  };
  await copy('');
  return files;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
