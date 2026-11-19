/** Bundles the Studio SPA (app.ts + CodeMirror + player element) with esbuild. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function buildStudio(o: { minify?: boolean } = {}): Promise<{ html: string; js: string; css: string }> {
  const esbuild = await import('esbuild');
  const r = await esbuild.build({
    entryPoints: [fileURLToPath(new URL('./app.ts', import.meta.url))],
    bundle: true, write: false, format: 'esm', minify: o.minify ?? true, target: ['chrome110', 'firefox115', 'safari16'],
    legalComments: 'none',
  });
  const css = await readFile(new URL('./studio.css', import.meta.url), 'utf8');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HyperFrames Studio</title>
<link rel="stylesheet" href="/app.css">
</head>
<body>
<div id="app"></div>
<script type="module" src="/app.js"></script>
</body>
</html>`;
  return { html, js: r.outputFiles[0]!.text, css };
}
