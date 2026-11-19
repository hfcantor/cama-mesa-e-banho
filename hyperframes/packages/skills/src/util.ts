import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { escapeAttr, escapeHtml } from '@hfr/core';
import { sanitizeFileName } from '@hfr/media';

export { escapeAttr, escapeHtml };

/** Copies a file into <projectDir>/assets and returns its project-relative path. */
export async function importAsset(projectDir: string, file: string, used = new Set<string>()): Promise<string> {
  await mkdir(path.join(projectDir, 'assets'), { recursive: true });
  let name = sanitizeFileName(path.basename(file));
  const ext = path.extname(name);
  let i = 1;
  while (used.has(name)) name = `${path.basename(name, ext).replace(/-\d+$/, '')}-${i++}${ext}`;
  used.add(name);
  await copyFile(file, path.join(projectDir, 'assets', name));
  return `assets/${name}`;
}

export const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

export function htmlDocument(o: { title: string; width: number; height: number; fps: number; duration: number; background?: string; head?: string; body: string; scripts?: string; rootAttrs?: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(o.title)}</title>
  <link rel="stylesheet" href="/__hf/fonts/inter/index.css">
${o.head ?? ''}
</head>
<body>
  <div id="stage" data-composition data-width="${o.width}" data-height="${o.height}" data-fps="${o.fps}" data-duration="${Number(o.duration.toFixed(3))}"${o.background ? ` data-background="${escapeAttr(o.background)}"` : ''}${o.rootAttrs ?? ''}>
${o.body}
  </div>
${o.scripts ?? ''}
</body>
</html>
`;
}
