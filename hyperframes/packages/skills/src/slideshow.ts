/**
 * Slideshow skill: builds an animated presentation video project from a
 * Markdown deck or a list of images, with optional TTS narration (speaker
 * notes), synced captions and ducked background music.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PRESETS, type CaptionDocument, type ProjectManifest } from '@hfr/core';
import { inlineMarkdown, parseSlidesMarkdown, type Slide } from '@hfr/parsers';
import { buildNarration, type TtsProviderName } from '@hfr/voice';
import { escapeAttr, escapeHtml, htmlDocument, importAsset } from './util.ts';

export interface SlideshowTheme {
  background: string;
  text: string;
  accent: string;
  font: string;
}

export const THEMES: Record<string, SlideshowTheme> = {
  midnight: { background: '#0b1020', text: '#f8fafc', accent: '#22d3ee', font: "'Inter Variable', system-ui, sans-serif" },
  paper: { background: '#f5f1e8', text: '#1f2937', accent: '#dc2626', font: "'Playfair Display Variable', Georgia, serif" },
  sunset: { background: 'linear-gradient(135deg,#1e1b4b,#9d174d 70%,#ea580c)', text: '#ffffff', accent: '#fde047', font: "'Inter Variable', system-ui, sans-serif" },
};

export interface SlideshowOptions {
  outDir: string;
  /** Markdown deck text, a path to a .md file, or image paths. */
  markdown?: string;
  images?: string[];
  title?: string;
  width?: number;
  height?: number;
  fps?: number;
  slideDuration?: number;
  /** Overlap between slides, in seconds (cross-fade length). */
  overlap?: number;
  transition?: string;
  theme?: keyof typeof THEMES | SlideshowTheme;
  music?: string;
  narrate?: { provider?: TtsProviderName; voice?: string; language?: string; rate?: number };
  captions?: boolean;
}

export interface SlideshowResult { dir: string; duration: number; slides: number; narration: string | null; captions: string | null }

const ENTER_FOR: Record<string, [string, string]> = {
  fade: ['fade 0.7', 'fade 0.7'],
  slide: ['slide-left 0.8 in-out-cubic', 'fade 0.6'],
  zoom: ['zoom-out 0.9 out-expo', 'fade 0.6'],
  wipe: ['wipe-right 0.9 in-out-cubic', 'fade 0.6'],
  iris: ['iris 1 in-out-cubic', 'fade 0.6'],
  blur: ['blur-in 0.9', 'fade 0.6'],
};

export async function createSlideshow(o: SlideshowOptions): Promise<SlideshowResult> {
  const dir = path.resolve(o.outDir);
  await mkdir(dir, { recursive: true });
  const width = o.width ?? 1920, height = o.height ?? 1080, fps = o.fps ?? 30;
  const theme = typeof o.theme === 'object' ? o.theme : THEMES[o.theme ?? 'midnight']!;
  const overlap = o.overlap ?? 0.7;
  const base = o.slideDuration ?? 4;
  const transition = ENTER_FOR[o.transition ?? 'fade'] ?? (o.transition && o.transition in PRESETS ? [`${o.transition} 0.8`, 'fade 0.6'] : null);
  if (!transition) throw new Error(`unknown transition "${o.transition}" (use ${Object.keys(ENTER_FOR).join(', ')} or a preset name)`);

  // ---- slides
  let slides: Slide[] = [];
  let mdDir = process.cwd();
  if (o.markdown) {
    let md = o.markdown;
    if (!md.includes('\n') && md.endsWith('.md')) { mdDir = path.dirname(path.resolve(md)); md = await readFile(md, 'utf8'); }
    slides = parseSlidesMarkdown(md);
  }
  for (const img of o.images ?? []) slides.push({ title: null, subtitle: null, bullets: [], paragraphs: [], image: { src: path.resolve(img), alt: '' }, notes: null, duration: null, transition: null, background: null, layout: 'full-image' });
  if (!slides.length) throw new Error('no slides: pass markdown or images');
  const used = new Set<string>();
  for (const s of slides) {
    if (s.image && !/^(https?:)?\/\//.test(s.image.src)) s.image.src = await importAsset(dir, path.resolve(mdDir, s.image.src), used);
  }

  // ---- narration (speaker notes)
  let narration: Awaited<ReturnType<typeof buildNarration>> | null = null;
  const noteSlides = slides.map((s, i) => ({ i, text: s.notes ?? '' })).filter((x) => x.text.trim());
  if (o.narrate && noteSlides.length) {
    narration = await buildNarration(noteSlides.map((n) => ({ text: n.text, pauseAfter: 0 })), { outDir: path.join(dir, 'assets', 'narration'), ...o.narrate });
  }
  // ---- timing: each slide lasts max(base, its narration + padding)
  const durations = slides.map((s, i) => {
    const line = narration ? narration.lines[noteSlides.findIndex((n) => n.i === i)] : undefined;
    const spoken = line ? line.end - line.start + 1.0 : 0;
    return Math.max(s.duration ?? base, spoken);
  });
  const starts: number[] = [];
  let t = 0;
  durations.forEach((d, i) => { starts.push(i === 0 ? 0 : t - overlap); t = starts[i]! + d; });
  const total = t;

  // ---- narration placement: each line starts with its slide (+0.4s)
  let captionsPath: string | null = null;
  const audioClips: string[] = [];
  if (narration) {
    const doc: CaptionDocument = { language: o.narrate?.language, cues: [] };
    noteSlides.forEach((n, k) => {
      const line = narration!.lines[k]!;
      const at = starts[n.i]! + 0.4;
      const rel = path.relative(dir, line.file).split(path.sep).join('/');
      audioClips.push(`    <audio id="vo-${k + 1}" src="${escapeAttr(rel)}" data-start="${at.toFixed(3)}" data-name="Narration ${k + 1}"></audio>`);
      const cue = narration!.document.cues[k]!;
      const shift = at - cue.start;
      doc.cues.push({ ...cue, start: cue.start + shift, end: cue.end + shift, words: cue.words?.map((w) => ({ ...w, start: w.start + shift, end: w.end + shift })) });
    });
    captionsPath = 'captions.json';
    await writeFile(path.join(dir, captionsPath), JSON.stringify(doc, null, 2));
  }

  // ---- HTML
  const sections = slides.map((s, i) => slideHtml(s, i, starts[i]!, durations[i]!, transition, theme)).join('\n');
  const captionEl = captionsPath && o.captions !== false
    ? `    <div data-hf-captions="${captionsPath}" data-style="highlight" data-position="bottom" data-track="90" style="font-size:${Math.round(height / 22)}px;font-family:${escapeAttr(theme.font)};--hf-cap-highlight-bg:${escapeAttr(theme.accent)}"></div>`
    : '';
  const css = `  <link rel="stylesheet" href="/__hf/fonts/playfair-display/index.css">
  <style>
    .slide{position:absolute;inset:0;overflow:hidden;color:${theme.text};font-family:${theme.font};background:${theme.background};display:flex;flex-direction:column;justify-content:center;padding:0 ${Math.round(width * 0.08)}px;box-sizing:border-box}
    .slide.center{align-items:center;text-align:center}
    .slide h1{font-size:${Math.round(height / 9)}px;line-height:1.05;margin:0;letter-spacing:-.03em;font-weight:800}
    .slide h2{font-size:${Math.round(height / 20)}px;margin:${Math.round(height / 60)}px 0 0;font-weight:500;color:${theme.accent}}
    .slide p{font-size:${Math.round(height / 28)}px;line-height:1.45;margin:${Math.round(height / 45)}px 0 0;max-width:80%;opacity:.88}
    .slide ul{margin:${Math.round(height / 30)}px 0 0;padding:0;list-style:none}
    .slide li{font-size:${Math.round(height / 24)}px;line-height:1.5;padding-left:1.2em;position:relative}
    .slide li::before{content:"";position:absolute;left:0;top:.62em;width:.45em;height:.45em;border-radius:50%;background:${theme.accent}}
    .slide .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .slide .shade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.65),rgba(0,0,0,.05) 60%)}
    .slide .content{position:relative}
    .slide.split{flex-direction:row;align-items:center;gap:5%}
    .slide.split .content{flex:1}
    .slide.split .side{flex:1;height:70%;border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35)}
    .slide.split .side img{width:100%;height:100%;object-fit:cover}
    .slide code{font-family:'JetBrains Mono Variable',monospace;background:rgba(127,127,127,.2);padding:0 .25em;border-radius:6px}
  </style>`;
  const html = htmlDocument({
    title: o.title ?? slides[0]!.title ?? 'Slideshow', width, height, fps, duration: total,
    background: theme.background.startsWith('#') ? theme.background : '#000000',
    head: css, body: [sections, ...audioClips, captionEl].filter(Boolean).join('\n'),
  });
  await writeFile(path.join(dir, 'index.html'), html);
  const manifest: ProjectManifest = { name: o.title ?? slides[0]!.title ?? 'slideshow', entry: 'index.html', output: { file: 'renders/slideshow.mp4' } };
  if (o.music) {
    const music = await importAsset(dir, path.resolve(o.music), used);
    manifest.audio = [{ src: music, volume: narration ? 0.5 : 0.8, loop: true, fadeIn: 1, fadeOut: 2, role: 'music', ...(narration ? { duckUnder: 'narration' } : {}) }];
  }
  await writeFile(path.join(dir, 'hyperframes.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { dir, duration: total, slides: slides.length, narration: narration ? path.relative(dir, narration.audio) : null, captions: captionsPath };
}

function slideHtml(s: Slide, i: number, start: number, duration: number, tr: [string, string], theme: SlideshowTheme): string {
  const id = `slide-${i + 1}`;
  const enter = s.transition ? `${s.transition} 0.8` : i === 0 ? 'fade 0.6' : tr[0];
  const bg = s.background ? ` style="background:${escapeAttr(s.background)}"` : '';
  const head = `    <section id="${id}" class="slide${s.image && s.layout !== 'split' ? ' center' : ''}${s.layout === 'split' ? ' split' : ''}" data-name="Slide ${i + 1}" data-start="${start.toFixed(3)}" data-duration="${duration.toFixed(3)}" data-track="${i % 2}" data-enter="${enter}"${bg}>`;
  const parts: string[] = [];
  const at = (offset: number) => `data-start="${id}.start + ${offset}" data-end="${id}.end"`;
  let k = 0.35;
  const textBits: string[] = [];
  if (s.title) { textBits.push(`<h1 id="${id}-t" ${at(k)} data-enter="fade-up 0.7 out-expo">${inlineMarkdown(s.title)}</h1>`); k += 0.25; }
  if (s.subtitle) { textBits.push(`<h2 id="${id}-s" ${at(k)} data-enter="fade-up 0.6">${inlineMarkdown(s.subtitle)}</h2>`); k += 0.25; }
  for (const [j, p] of s.paragraphs.entries()) { textBits.push(`<p id="${id}-p${j}" ${at(k)} data-enter="fade 0.6">${inlineMarkdown(p)}</p>`); k += 0.2; }
  if (s.bullets.length) {
    textBits.push(`<ul>${s.bullets.map((b, j) => `<li id="${id}-b${j}" ${at(Number((k + j * 0.3).toFixed(2)))} data-enter="fade-left 0.5">${inlineMarkdown(b)}</li>`).join('')}</ul>`);
  }
  if (s.image && s.layout === 'split') {
    parts.push(`      <div class="content">${textBits.join('')}</div>`);
    parts.push(`      <div class="side"><img id="${id}-img" src="${escapeAttr(s.image.src)}" alt="${escapeAttr(s.image.alt)}" ${at(0)} data-kenburns="in 0.1"></div>`);
  } else if (s.image) {
    parts.push(`      <img class="bg" id="${id}-img" src="${escapeAttr(s.image.src)}" alt="${escapeAttr(s.image.alt)}" ${at(0)} data-kenburns="${['in', 'left', 'out', 'right'][i % 4]} 0.12">`);
    if (textBits.length) parts.push(`      <div class="shade"></div><div class="content">${textBits.join('')}</div>`);
  } else {
    parts.push(`      <div class="content">${textBits.join('')}</div>`);
  }
  void theme; void escapeHtml;
  return [head, ...parts, '    </section>'].join('\n');
}
