/**
 * @hfr/share — packages a rendered video for sharing:
 *   <out>/index.html      watch page (HTML5 player, captions track, Open Graph tags, embed snippet)
 *   <out>/video.<ext>     the video
 *   <out>/poster.jpg      poster frame
 *   <out>/captions.vtt    WebVTT captions (optional)
 *   <out>/manifest.json   metadata + SHA-256 checksums
 *   <out>/project.zip     source project archive (optional; renders/cache excluded)
 * The folder is static: host it on any web server or object storage. Uploading
 * is out of scope here (see @hfr/aws-lambda / @hfr/gcp-cloud-run storage adapters).
 */
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { zipSync, type Zippable } from 'fflate';
import { escapeAttr, escapeHtml } from '@hfr/core';
import { probe, thumbnail } from '@hfr/media';
import { parseCaptions, toVtt } from '@hfr/parsers';

export interface ShareOptions {
  video: string;
  outDir: string;
  title?: string;
  description?: string;
  captions?: string;
  captionsLanguage?: string;
  posterTime?: number;
  project?: string;
  /** Absolute public URL where the folder will be hosted (makes Open Graph URLs absolute). */
  publicUrl?: string;
}

export interface ShareResult { dir: string; files: string[]; manifest: ShareManifest }

export interface ShareManifest {
  title: string;
  description: string;
  createdAt: string;
  video: { file: string; width: number; height: number; duration: number; codec: string; size: number; sha256: string };
  poster: string;
  captions: string | null;
  project: { file: string; files: number; sha256: string } | null;
}

const sha256 = async (file: string) => createHash('sha256').update(await readFile(file)).digest('hex');
const SKIP = new Set(['node_modules', '.git', '.hfr-cache', 'renders', 'share']);

async function collect(root: string, rel = '', out: Zippable = {}): Promise<Zippable> {
  for (const ent of await readdir(path.join(root, rel), { withFileTypes: true })) {
    if (SKIP.has(ent.name) || ent.name.startsWith('.')) continue;
    const r = rel ? `${rel}/${ent.name}` : ent.name;
    if (ent.isDirectory()) await collect(root, r, out);
    else if (ent.isFile()) out[r] = new Uint8Array(await readFile(path.join(root, r)));
  }
  return out;
}

export async function createShareBundle(o: ShareOptions): Promise<ShareResult> {
  const dir = path.resolve(o.outDir);
  await mkdir(dir, { recursive: true });
  const info = await probe(o.video);
  if (!info.video) throw new Error(`${o.video} has no video stream`);
  const ext = path.extname(o.video).toLowerCase() || '.mp4';
  const videoName = `video${ext}`;
  await copyFile(o.video, path.join(dir, videoName));
  await thumbnail(o.video, path.join(dir, 'poster.jpg'), o.posterTime ?? Math.min(1, (info.duration ?? 0) / 3), Math.min(1280, info.video.width));
  let captions: string | null = null;
  if (o.captions) {
    const doc = parseCaptions(o.captions, await readFile(o.captions, 'utf8'));
    await writeFile(path.join(dir, 'captions.vtt'), toVtt({ ...doc, language: o.captionsLanguage ?? doc.language }));
    captions = 'captions.vtt';
  }
  let project: ShareManifest['project'] = null;
  if (o.project) {
    const files = await collect(path.resolve(o.project));
    const zip = zipSync(files, { level: 6 });
    await writeFile(path.join(dir, 'project.zip'), zip);
    project = { file: 'project.zip', files: Object.keys(files).length, sha256: createHash('sha256').update(zip).digest('hex') };
  }
  const title = o.title ?? path.basename(o.video, ext);
  const description = o.description ?? '';
  const st = await stat(path.join(dir, videoName));
  const manifest: ShareManifest = {
    title, description, createdAt: new Date().toISOString(),
    video: { file: videoName, width: info.video.width, height: info.video.height, duration: info.duration ?? 0, codec: info.video.codec, size: st.size, sha256: await sha256(path.join(dir, videoName)) },
    poster: 'poster.jpg', captions, project,
  };
  const abs = (f: string) => (o.publicUrl ? new URL(f, o.publicUrl.endsWith('/') ? o.publicUrl : `${o.publicUrl}/`).href : f);
  const type = ext === '.webm' ? 'video/webm' : ext === '.mov' ? 'video/quicktime' : 'video/mp4';
  const embed = `<video src="${abs(videoName)}" poster="${abs('poster.jpg')}" controls playsinline width="${info.video.width}" height="${info.video.height}" style="max-width:100%;height:auto"></video>`;
  const html = `<!doctype html>
<html lang="${escapeAttr(o.captionsLanguage ?? 'en')}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<meta property="og:type" content="video.other">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:image" content="${abs('poster.jpg')}">
<meta property="og:video" content="${abs(videoName)}">
<meta property="og:video:type" content="${type}">
<meta property="og:video:width" content="${info.video.width}">
<meta property="og:video:height" content="${info.video.height}">
<meta name="twitter:card" content="player">
<style>
  :root{color-scheme:light dark;--bg:#f8fafc;--fg:#0f172a;--muted:#64748b;--card:#fff}
  @media (prefers-color-scheme:dark){:root{--bg:#05070d;--fg:#e5e7eb;--muted:#94a3b8;--card:#0f1422}}
  body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}
  main{max-width:1100px;margin:0 auto;padding:24px 16px}
  video{width:100%;height:auto;border-radius:12px;background:#000;display:block}
  h1{font-size:24px;margin:20px 0 4px}
  p{color:var(--muted);margin:0 0 16px}
  details{background:var(--card);border-radius:10px;padding:12px 16px;margin-top:12px}
  code{font:12px ui-monospace,monospace;word-break:break-all}
  a{color:inherit}
</style>
</head>
<body><main>
<video src="${videoName}" poster="poster.jpg" controls playsinline preload="metadata">${captions ? `<track kind="captions" src="${captions}" srclang="${escapeAttr(o.captionsLanguage ?? 'en')}" label="Captions" default>` : ''}</video>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(description)} ${info.video.width}×${info.video.height} · ${(info.duration ?? 0).toFixed(1)} s · <a href="${videoName}" download>download</a>${project ? ' · <a href="project.zip" download>source project</a>' : ''}</p>
<details><summary>Embed</summary><code>${escapeHtml(embed)}</code></details>
</main></body></html>
`;
  await writeFile(path.join(dir, 'index.html'), html);
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const files = ['index.html', videoName, 'poster.jpg', 'manifest.json', ...(captions ? [captions] : []), ...(project ? ['project.zip'] : [])];
  return { dir, files, manifest };
}
