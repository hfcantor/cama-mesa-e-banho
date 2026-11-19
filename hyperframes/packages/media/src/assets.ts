/** Asset classification, upload policy and font helpers. */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export type AssetType = 'image' | 'video' | 'audio' | 'font' | 'lottie' | 'captions' | 'model3d' | 'data' | 'style' | 'script' | 'html';

const EXT: Record<string, AssetType> = {
  '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.webp': 'image', '.gif': 'image', '.svg': 'image', '.avif': 'image',
  '.mp4': 'video', '.webm': 'video', '.mov': 'video', '.m4v': 'video', '.mkv': 'video',
  '.mp3': 'audio', '.wav': 'audio', '.m4a': 'audio', '.aac': 'audio', '.ogg': 'audio', '.opus': 'audio', '.flac': 'audio',
  '.woff2': 'font', '.woff': 'font', '.ttf': 'font', '.otf': 'font',
  '.srt': 'captions', '.vtt': 'captions', '.ass': 'captions',
  '.glb': 'model3d', '.gltf': 'model3d',
  '.json': 'data', '.csv': 'data', '.txt': 'data', '.md': 'data',
  '.css': 'style', '.js': 'script', '.mjs': 'script', '.html': 'html',
};

export const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/mp4', '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.flac': 'audio/flac',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.srt': 'text/plain; charset=utf-8', '.vtt': 'text/vtt; charset=utf-8', '.ass': 'text/plain; charset=utf-8',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.wasm': 'application/wasm', '.ico': 'image/x-icon',
};

export function assetType(file: string): AssetType | null {
  return EXT[path.extname(file).toLowerCase()] ?? null;
}

export function mimeType(file: string): string {
  return MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
}

/** Upload policy: extension allow-list + per-type size limits (bytes). */
export const UPLOAD_LIMITS: Record<AssetType, number> = {
  image: 50 * 1024 ** 2, video: 2 * 1024 ** 3, audio: 500 * 1024 ** 2, font: 20 * 1024 ** 2, lottie: 20 * 1024 ** 2,
  captions: 10 * 1024 ** 2, model3d: 300 * 1024 ** 2, data: 20 * 1024 ** 2, style: 5 * 1024 ** 2, script: 5 * 1024 ** 2, html: 5 * 1024 ** 2,
};

/** Normalises a user-supplied file name: no directories, no control chars, limited charset. */
export function sanitizeFileName(name: string): string {
  const base = path.basename(name.replace(/\\/g, '/'));
  const ext = path.extname(base).toLowerCase();
  const stem = base.slice(0, base.length - ext.length)
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 80);
  if (!stem) throw new Error(`invalid file name "${name}"`);
  return stem + ext;
}

/** Magic-number sniffing for common binary formats (defence against renamed files). */
export function sniff(head: Uint8Array): string | null {
  const s = (o: number, sig: number[]) => sig.every((b, i) => head[o + i] === b);
  if (s(0, [0x89, 0x50, 0x4e, 0x47])) return 'png';
  if (s(0, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (s(0, [0x47, 0x49, 0x46, 0x38])) return 'gif';
  if (s(0, [0x52, 0x49, 0x46, 0x46]) && s(8, [0x57, 0x45, 0x42, 0x50])) return 'webp';
  if (s(0, [0x52, 0x49, 0x46, 0x46]) && s(8, [0x57, 0x41, 0x56, 0x45])) return 'wav';
  if (s(4, [0x66, 0x74, 0x79, 0x70])) return 'mp4'; // ftyp (mp4/mov/m4a/avif)
  if (s(0, [0x1a, 0x45, 0xdf, 0xa3])) return 'webm'; // EBML (webm/mkv)
  if (s(0, [0x49, 0x44, 0x33]) || (head[0] === 0xff && ((head[1] ?? 0) & 0xe0) === 0xe0)) return 'mp3';
  if (s(0, [0x4f, 0x67, 0x67, 0x53])) return 'ogg';
  if (s(0, [0x66, 0x4c, 0x61, 0x43])) return 'flac';
  if (s(0, [0x77, 0x4f, 0x46, 0x32])) return 'woff2';
  if (s(0, [0x77, 0x4f, 0x46, 0x46])) return 'woff';
  if (s(0, [0x00, 0x01, 0x00, 0x00]) || s(0, [0x4f, 0x54, 0x54, 0x4f])) return 'font';
  if (s(0, [0x67, 0x6c, 0x54, 0x46])) return 'glb';
  return null;
}

const SNIFF_OK: Record<string, string[]> = {
  '.png': ['png'], '.jpg': ['jpeg'], '.jpeg': ['jpeg'], '.gif': ['gif'], '.webp': ['webp'], '.avif': ['mp4'],
  '.wav': ['wav'], '.mp4': ['mp4'], '.m4v': ['mp4'], '.mov': ['mp4'], '.m4a': ['mp4'], '.webm': ['webm'], '.mkv': ['webm'],
  '.mp3': ['mp3'], '.ogg': ['ogg'], '.opus': ['ogg'], '.flac': ['flac'], '.woff2': ['woff2'], '.woff': ['woff'],
  '.ttf': ['font'], '.otf': ['font'], '.glb': ['glb'],
};

/** Checks the content signature matches the extension for binary types. */
export function contentMatchesExtension(file: string, head: Uint8Array): boolean {
  const allowed = SNIFF_OK[path.extname(file).toLowerCase()];
  if (!allowed) return true; // text formats / formats without reliable magic
  const kind = sniff(head);
  return kind !== null && allowed.includes(kind);
}

export interface AssetEntry { path: string; type: AssetType | null; size: number; modified: number }

const IGNORED_DIRS = new Set(['node_modules', '.git', '.hfr-cache', 'renders', 'share', '.DS_Store']);

export async function listAssets(root: string, dir = ''): Promise<AssetEntry[]> {
  const out: AssetEntry[] = [];
  const abs = path.join(root, dir);
  for (const ent of await readdir(abs, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(ent.name) || ent.name.startsWith('.')) continue;
    const rel = dir ? `${dir}/${ent.name}` : ent.name;
    if (ent.isDirectory()) out.push(...(await listAssets(root, rel)));
    else if (ent.isFile()) {
      const st = await stat(path.join(abs, ent.name));
      out.push({ path: rel, type: assetType(ent.name), size: st.size, modified: st.mtimeMs });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

const FONT_FORMAT: Record<string, string> = { '.woff2': 'woff2', '.woff': 'woff', '.ttf': 'truetype', '.otf': 'opentype' };

/** Generates @font-face rules for font files ("Inter-Bold.woff2" → family Inter, weight 700). */
export function fontFaceCss(files: string[], familyOverride?: string): string {
  const weights: Record<string, number> = { thin: 100, extralight: 200, light: 300, regular: 400, book: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900, heavy: 900 };
  return files
    .filter((f) => FONT_FORMAT[path.extname(f).toLowerCase()])
    .map((f) => {
      const stem = path.basename(f, path.extname(f));
      const [fam, styleRaw = 'regular'] = stem.split(/[-_](?=[^-_]*$)/);
      const style = styleRaw.toLowerCase();
      const italic = style.includes('italic');
      const w = weights[style.replace('italic', '') || 'regular'] ?? 400;
      return `@font-face{font-family:"${familyOverride ?? fam}";src:url("${f}") format("${FONT_FORMAT[path.extname(f).toLowerCase()]}");font-weight:${w};font-style:${italic ? 'italic' : 'normal'};font-display:block}`;
    })
    .join('\n');
}
