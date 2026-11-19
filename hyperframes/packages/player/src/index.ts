/** @hfr/player — Node side: bundles the <hf-player> element for the browser. */
import { fileURLToPath } from 'node:url';

let cached: Promise<string> | null = null;

export function bundlePlayer(): Promise<string> {
  if (cached) return cached;
  cached = (async () => {
    const esbuild = await import('esbuild');
    const r = await esbuild.build({
      entryPoints: [fileURLToPath(new URL('./element.ts', import.meta.url))],
      bundle: true, write: false, format: 'esm', minify: true, target: ['chrome110', 'firefox115', 'safari16'],
    });
    return r.outputFiles[0]!.text;
  })();
  cached.catch(() => { cached = null; });
  return cached;
}

/** Standalone HTML page embedding a composition with the player (used by `hfr preview`). */
export function playerPage(o: { title: string; src: string; playerUrl: string; liveReloadUrl?: string }): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)} · preview</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;background:#05070d;color:#e5e7eb;font:14px system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;min-height:100vh}
  header{width:min(1280px,96vw);display:flex;justify-content:space-between;align-items:center;padding:14px 0}
  h1{font-size:16px;margin:0;font-weight:600}
  hf-player{width:min(1280px,96vw);border-radius:10px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}
  #log{width:min(1280px,96vw);font:12px ui-monospace,monospace;color:#fca5a5;white-space:pre-wrap;margin-top:12px}
  .hint{opacity:.6}
</style></head><body>
<header><h1>${esc(o.title)}</h1><span class="hint">space: play/pause · ←/→: frame step${o.liveReloadUrl ? ' · live reload on' : ''}</span></header>
<hf-player id="p" src="${esc(o.src)}" controls></hf-player>
<div id="log"></div>
<script type="module">
  import '${esc(o.playerUrl)}';
  const p = document.getElementById('p');
  const log = document.getElementById('log');
  p.addEventListener('ready', async () => {
    const d = await p.describe();
    log.textContent = [...d.errors.map((e) => 'error: ' + e), ...d.warnings.map((w) => 'warning: ' + w)].join('\\n');
  });
  ${o.liveReloadUrl ? `new EventSource('${esc(o.liveReloadUrl)}').addEventListener('change', () => p.reload());` : ''}
  p.focus();
</script></body></html>`;
}
