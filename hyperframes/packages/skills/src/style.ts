/**
 * Style sampling: extracts reusable design tokens from a visual reference —
 * an image/video frame (colour palette, contrast-checked roles) or a web page
 * (palette + computed typography, radii, shadows of real elements) — and
 * writes tokens.json, theme.css and a style-board composition using them.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { contrastRatio, extractPalette, kmeansPalette, probe, relativeLuminance, ffmpeg, type PaletteColor } from '@hfr/media';
import { launchBrowser } from '@hfr/engine';
import { escapeAttr, htmlDocument } from './util.ts';

export interface TypeToken { family: string; weight: string; size: string; lineHeight: string; letterSpacing: string; transform: string; color: string }

export interface DesignTokens {
  source: string;
  palette: PaletteColor[];
  roles: { background: string; surface: string; text: string; muted: string; accent: string; accent2: string };
  contrast: { textOnBackground: number; accentOnBackground: number };
  typography?: { heading?: TypeToken; subheading?: TypeToken; body?: TypeToken; button?: TypeToken };
  radius?: string[];
  shadows?: string[];
  fonts?: string[];
}

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const saturation = ([r, g, b]: [number, number, number]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };

/** Assigns semantic roles to a palette with WCAG contrast in mind. */
export function assignRoles(palette: PaletteColor[]): Pick<DesignTokens, 'roles' | 'contrast'> {
  const byWeight = [...palette].sort((a, b) => b.weight - a.weight);
  const background = byWeight[0]?.hex ?? '#111111';
  const bg = hexToRgb(background);
  const candidates = palette.filter((p) => p.hex !== background);
  const best = (score: (p: PaletteColor) => number) => [...candidates].sort((a, b) => score(b) - score(a))[0];
  let text = best((p) => contrastRatio(p.rgb, bg))?.hex ?? (relativeLuminance(bg) > 0.4 ? '#111111' : '#ffffff');
  if (contrastRatio(hexToRgb(text), bg) < 4.5) text = relativeLuminance(bg) > 0.4 ? '#111111' : '#ffffff';
  const accent = best((p) => saturation(p.rgb) * 2 + Math.min(3, contrastRatio(p.rgb, bg)) / 3)?.hex ?? text;
  const accent2 = best((p) => (p.hex === accent ? -1 : saturation(p.rgb) + p.weight))?.hex ?? accent;
  const surface = best((p) => -Math.abs(contrastRatio(p.rgb, bg) - 1.25) + p.weight)?.hex ?? background;
  const muted = best((p) => -Math.abs(contrastRatio(p.rgb, bg) - 3))?.hex ?? text;
  return {
    roles: { background, surface, text, muted, accent, accent2 },
    contrast: { textOnBackground: round(contrastRatio(hexToRgb(text), bg)), accentOnBackground: round(contrastRatio(hexToRgb(accent), bg)) },
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

async function sampleImage(file: string): Promise<DesignTokens> {
  const info = await probe(file);
  const palette = await extractPalette(file, { k: 7, time: info.duration ? info.duration / 2 : undefined });
  return { source: path.basename(file), palette, ...assignRoles(palette) };
}

async function samplePage(url: string): Promise<DesignTokens> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
    const shot = await page.screenshot({ type: 'png' });
    const { stdout } = await ffmpeg(['-i', 'pipe:0', '-vf', 'scale=144:90:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { input: shot, binary: true });
    const palette = kmeansPalette(stdout, 7);
    const css = await page.evaluate(() => {
      const pick = (sel: string) => {
        const el = Array.from(document.querySelectorAll<HTMLElement>(sel)).find((e) => e.offsetParent !== null && e.innerText.trim());
        if (!el) return undefined;
        const s = getComputedStyle(el);
        return { family: s.fontFamily, weight: s.fontWeight, size: s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, transform: s.textTransform, color: s.color };
      };
      const radius = new Map<string, number>();
      const shadows = new Map<string, number>();
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('button, a, img, section, div, input, article')).slice(0, 3000)) {
        const s = getComputedStyle(el);
        if (s.borderRadius && s.borderRadius !== '0px') radius.set(s.borderRadius, (radius.get(s.borderRadius) ?? 0) + 1);
        if (s.boxShadow && s.boxShadow !== 'none') shadows.set(s.boxShadow, (shadows.get(s.boxShadow) ?? 0) + 1);
      }
      const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map((e) => e[0]);
      const fonts = new Set<string>();
      document.fonts.forEach((f) => { if (f.status === 'loaded') fonts.add(f.family.replace(/["']/g, '')); });
      const btn = Array.from(document.querySelectorAll<HTMLElement>('button, a[class*="btn"], a[class*="button"], [role="button"]')).find((e) => e.offsetParent !== null);
      // most used text colour, weighted by amount of text
      const colorWeight = new Map<string, number>();
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('p, li, span, td'))) {
        if (el.offsetParent === null) continue;
        const n = el.innerText.trim().length;
        if (!n) continue;
        const c = getComputedStyle(el).color;
        colorWeight.set(c, (colorWeight.get(c) ?? 0) + n);
      }
      const bodyColor = [...colorWeight.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? getComputedStyle(document.body).color;
      return {
        cssColors: { text: bodyColor, accent: btn ? getComputedStyle(btn).backgroundColor : null, background: getComputedStyle(document.body).backgroundColor },
        typography: { heading: pick('h1'), subheading: pick('h2, h3'), body: pick('p, li'), button: pick('button, a[class*="btn"], a[class*="button"]') },
        radius: top(radius, 4), shadows: top(shadows, 3), fonts: [...fonts],
      };
    });
    const roles = assignRoles(palette);
    // Prefer colours actually used by the page's CSS for text and accent roles.
    const toHex = (c: string | null) => {
      const m = c && /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c);
      if (!m || (m[4] !== undefined && Number(m[4]) < 0.5)) return null;
      return '#' + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('');
    };
    const { cssColors, ...rest } = css;
    const text = toHex(cssColors.text), accent = toHex(cssColors.accent);
    if (text && contrastRatio(hexToRgb(text), hexToRgb(roles.roles.background)) >= 3) roles.roles.text = text;
    if (accent) roles.roles.accent = accent;
    roles.contrast.textOnBackground = round(contrastRatio(hexToRgb(roles.roles.text), hexToRgb(roles.roles.background)));
    roles.contrast.accentOnBackground = round(contrastRatio(hexToRgb(roles.roles.accent), hexToRgb(roles.roles.background)));
    return { source: url, palette, ...roles, ...rest };
  } finally {
    await browser.close();
  }
}

export async function sampleStyle(source: string, o: { outDir: string }): Promise<{ tokens: DesignTokens; files: string[] }> {
  const isUrl = /^https?:\/\//.test(source) || source.endsWith('.html');
  const tokens = isUrl ? await samplePage(source.endsWith('.html') && !/^https?:/.test(source) ? `file://${path.resolve(source)}` : source) : await sampleImage(path.resolve(source));
  const dir = path.resolve(o.outDir);
  await mkdir(dir, { recursive: true });
  const r = tokens.roles;
  const t = tokens.typography;
  const themeCss = `/* sampled from ${tokens.source} */
:root {
  --color-background: ${r.background};
  --color-surface: ${r.surface};
  --color-text: ${r.text};
  --color-muted: ${r.muted};
  --color-accent: ${r.accent};
  --color-accent-2: ${r.accent2};
${tokens.palette.map((p, i) => `  --palette-${i + 1}: ${p.hex};`).join('\n')}
${t?.heading ? `  --font-heading: ${t.heading.family};\n  --heading-weight: ${t.heading.weight};\n  --heading-tracking: ${t.heading.letterSpacing === 'normal' ? '0' : t.heading.letterSpacing};\n` : ''}${t?.body ? `  --font-body: ${t.body.family};\n` : ''}${tokens.radius?.[0] ? `  --radius: ${tokens.radius[0]};\n` : ''}${tokens.shadows?.[0] ? `  --shadow: ${tokens.shadows[0]};\n` : ''}}
`;
  await writeFile(path.join(dir, 'tokens.json'), JSON.stringify(tokens, null, 2));
  await writeFile(path.join(dir, 'theme.css'), themeCss);
  const swatches = tokens.palette.map((p, i) => `<div class="sw" data-start="${(0.3 + i * 0.12).toFixed(2)}" data-enter="pop 0.5" style="background:${p.hex}"><span>${p.hex}<br>${Math.round(p.weight * 100)}%</span></div>`).join('');
  const board = htmlDocument({
    title: 'Style board', width: 1920, height: 1080, fps: 30, duration: 5, background: r.background,
    head: `  <link rel="stylesheet" href="theme.css">
  <style>
    .board{position:absolute;inset:0;padding:90px 110px;box-sizing:border-box;background:var(--color-background);color:var(--color-text);font-family:var(--font-body,'Inter Variable',system-ui)}
    .board h1{margin:0;font-family:var(--font-heading,'Inter Variable',system-ui);font-weight:var(--heading-weight,800);letter-spacing:var(--heading-tracking,-0.02em);font-size:110px;line-height:1}
    .board p{font-size:36px;color:var(--color-muted);max-width:1100px}
    .row{display:flex;gap:24px;margin-top:50px}
    .sw{width:200px;height:200px;border-radius:var(--radius,24px);box-shadow:var(--shadow,0 10px 30px rgba(0,0,0,.25));display:flex;align-items:flex-end;padding:16px;box-sizing:border-box}
    .sw span{font:600 22px 'JetBrains Mono Variable',monospace;background:rgba(0,0,0,.45);color:#fff;padding:4px 8px;border-radius:8px}
    .btn{display:inline-block;margin-top:50px;padding:22px 48px;border-radius:var(--radius,999px);background:var(--color-accent);color:var(--color-background);font-size:36px;font-weight:700}
  </style>
  <link rel="stylesheet" href="/__hf/fonts/jetbrains-mono/index.css">`,
    body: `    <div class="board" data-start="0">
      <h1 data-start="0" data-enter="fade-up 0.7">Style sampled</h1>
      <p data-start="0.2" data-enter="fade 0.6">From ${escapeAttr(tokens.source)} · text/background contrast ${tokens.contrast.textOnBackground}:1</p>
      <div class="row">${swatches}</div>
      <div class="btn" data-start="1.3" data-enter="pop 0.5">Accent button</div>
    </div>`,
  });
  await writeFile(path.join(dir, 'index.html'), board);
  return { tokens, files: ['tokens.json', 'theme.css', 'index.html'] };
}
