/**
 * @hfr/inspector — renders compositions in headless Chromium and reports
 * problems that only show up at runtime.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadProject } from '@hfr/core';
import { captureFrame, launchBrowser, openComposition, startCompositionServer, type OpenedComposition, type RuntimeDescription } from '@hfr/engine';
import { ffmpeg, requireFfmpeg } from '@hfr/media';
import type { Browser } from 'playwright-core';

export type FindingSeverity = 'error' | 'warning' | 'info';

export interface Finding {
  check: string;
  severity: FindingSeverity;
  message: string;
  time?: number;
  clip?: string;
}

export interface SceneReport {
  file: string;
  description: RuntimeDescription;
  findings: Finding[];
  samples: Array<{ time: number; seekMs: number; blank: boolean; thumbnail?: string }>;
  avgSeekMs: number;
}

export interface InspectReport {
  root: string;
  scenes: SceneReport[];
  counts: Record<FindingSeverity, number>;
  ok: boolean;
  contactSheet?: string;
}

export interface InspectOptions {
  /** Number of sampled frames per scene (default 8). */
  samples?: number;
  /** Write thumbnails + a contact sheet into this directory. */
  thumbnailsDir?: string;
  /** Re-capture frames to verify deterministic rendering (default true). */
  determinism?: boolean;
  browser?: Browser;
}

interface PageProbe {
  missingFonts: string[];
  offstage: Array<{ id: string; rect: [number, number, number, number] }>;
  overflowText: string[];
}

/** Decodes an image buffer to a tiny grayscale bitmap using FFmpeg. */
async function grayscale(buf: Buffer, w = 32, h = 18): Promise<Buffer> {
  const { stdout } = await ffmpeg(['-i', 'pipe:0', '-vf', `scale=${w}:${h}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'], { input: buf, binary: true });
  return stdout;
}

function stats(px: Buffer): { mean: number; std: number } {
  let s = 0, s2 = 0;
  for (const v of px) { s += v; s2 += v * v; }
  const n = Math.max(1, px.length);
  const mean = s / n;
  return { mean, std: Math.sqrt(Math.max(0, s2 / n - mean * mean)) };
}

function diff(a: Buffer, b: Buffer): number {
  let d = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) d += Math.abs(a[i]! - b[i]!);
  return d / Math.max(1, a.length) / 255;
}

async function probePage(comp: OpenedComposition): Promise<PageProbe> {
  return comp.page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-composition]') ?? document.body;
    const stage = root.getBoundingClientRect();
    const families = new Set<string>();
    const overflowText: string[] = [];
    for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim());
      if (!hasText) continue;
      const first = cs.fontFamily.split(',')[0]!.trim().replace(/^["']|["']$/g, '');
      if (first && !/^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|emoji|math|fangsong|inherit)$/i.test(first)) families.add(first);
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible' && el.clientWidth > 0) overflowText.push(el.id || el.className || el.tagName.toLowerCase());
    }
    const missingFonts = [...families].filter((f) => !document.fonts.check(`16px "${f}"`) || ![...document.fonts].some((ff) => ff.family.replace(/["']/g, '') === f && ff.status === 'loaded'));
    // A family that is installed system-wide is fine: detect by measuring against fallback.
    const reallyMissing = missingFonts.filter((f) => {
      const c = document.createElement('canvas').getContext('2d')!;
      const sample = 'mmmmmmmmmmlliWWW@#';
      c.font = `40px monospace`;
      const a = c.measureText(sample).width;
      c.font = `40px "${f}", monospace`;
      const b = c.measureText(sample).width;
      c.font = `40px serif`;
      const s1 = c.measureText(sample).width;
      c.font = `40px "${f}", serif`;
      const s2 = c.measureText(sample).width;
      return a === b && s1 === s2;
    });
    const offstage: Array<{ id: string; rect: [number, number, number, number] }> = [];
    root.querySelectorAll<HTMLElement>('[data-hf-active]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.right <= stage.left || r.left >= stage.right || r.bottom <= stage.top || r.top >= stage.bottom) {
        offstage.push({ id: el.id || el.getAttribute('data-name') || el.tagName.toLowerCase(), rect: [r.x, r.y, r.width, r.height] });
      }
    });
    return { missingFonts: reallyMissing, offstage, overflowText };
  });
}

export async function inspectProject(target: string, o: InspectOptions = {}): Promise<InspectReport> {
  await requireFfmpeg();
  const project = await loadProject(target);
  const server = await startCompositionServer({ root: project.root, mode: 'inspect' });
  const browser = o.browser ?? (await launchBrowser());
  const scenes: SceneReport[] = [];
  const thumbs: string[] = [];
  try {
    for (const scene of project.scenes) {
      const findings: Finding[] = [];
      const url = new URL(scene.relative.split('/').map(encodeURIComponent).join('/'), server.url).href;
      const cfg = scene.composition.config;
      let comp: OpenedComposition;
      try {
        comp = await openComposition(browser, url, { width: cfg.width, height: cfg.height, timeoutMs: 45_000 });
      } catch (e) {
        findings.push({ check: 'load', severity: 'error', message: (e as Error).message });
        scenes.push({ file: scene.relative, description: null as unknown as RuntimeDescription, findings, samples: [], avgSeekMs: 0 });
        continue;
      }
      const d = comp.description;
      for (const e of d.errors) findings.push({ check: 'runtime-error', severity: 'error', message: e });
      for (const w of d.warnings) findings.push({ check: 'runtime-warning', severity: 'warning', message: w });
      for (const l of comp.logs) {
        const sev: FindingSeverity = l.type === 'console' && l.level === 'warning' ? 'warning' : 'error';
        findings.push({ check: l.type, severity: sev, message: `${l.text}${l.url ? ` (${l.url})` : ''}` });
      }
      // ---- duration / timelines
      const dur = d.config.duration;
      if (!(dur > 0)) findings.push({ check: 'duration', severity: 'error', message: 'composition duration is 0' });
      for (const a of d.adapters) {
        if (a.duration === null) continue;
        const end = a.offset + a.duration;
        if (d.config.declaredDuration !== null && end > d.config.declaredDuration + 0.05) {
          findings.push({ check: 'duration', severity: 'warning', message: `${a.type} animation ends at ${end.toFixed(2)}s but the composition is ${d.config.declaredDuration}s: it will be cut` });
        }
      }
      for (const c of d.clips) {
        if ((c.kind === 'audio' || c.kind === 'video') && c.mediaDuration !== null && !c.loop && c.duration > c.mediaDuration - c.mediaStart + 0.05) {
          findings.push({ check: 'av-sync', severity: 'warning', clip: c.id, message: `${c.id} is ${c.duration.toFixed(2)}s long but its media has ${(c.mediaDuration - c.mediaStart).toFixed(2)}s` });
        }
        if (c.end > dur + 0.01 && !(c.kind === 'audio' || c.kind === 'video')) findings.push({ check: 'duration', severity: 'info', clip: c.id, message: `${c.id} ends at ${c.end.toFixed(2)}s, after the composition (${dur.toFixed(2)}s)` });
      }
      // ---- sampled frames
      const n = Math.max(2, o.samples ?? 8);
      const times = Array.from({ length: n }, (_, i) => Math.min(dur - 1 / d.config.fps, (dur * i) / (n - 1)));
      const samples: SceneReport['samples'] = [];
      const grays: Buffer[] = [];
      const fontsReported = new Set<string>();
      const offReported = new Set<string>();
      for (const [i, t] of times.entries()) {
        const s0 = performance.now();
        const shot = await captureFrame(comp, Math.max(0, t), { format: 'jpeg', quality: 80, width: cfg.width, height: cfg.height });
        const seekMs = performance.now() - s0;
        const g = await grayscale(shot);
        grays.push(g);
        const { std } = stats(g);
        const blank = std < 0.5;
        let thumbnail: string | undefined;
        if (o.thumbnailsDir) {
          await mkdir(o.thumbnailsDir, { recursive: true });
          thumbnail = path.join(o.thumbnailsDir, `${scene.relative.replace(/[^\w.-]+/g, '_')}-${String(i).padStart(2, '0')}.jpg`);
          await writeFile(thumbnail, shot);
          thumbs.push(thumbnail);
        }
        samples.push({ time: t, seekMs: Math.round(seekMs), blank, thumbnail });
        const p = await probePage(comp);
        for (const f of p.missingFonts) if (!fontsReported.has(f)) {
          fontsReported.add(f);
          findings.push({ check: 'fonts', severity: 'warning', time: t, message: `font "${f}" is not loaded; a fallback font is used (add @font-face with a local file)` });
        }
        for (const off of p.offstage) if (!offReported.has(off.id)) {
          offReported.add(off.id);
          findings.push({ check: 'layout', severity: 'info', time: t, clip: off.id, message: `active clip "${off.id}" is entirely outside the stage at ${t.toFixed(2)}s` });
        }
      }
      const blanks = samples.filter((s) => s.blank);
      if (blanks.length === samples.length) findings.push({ check: 'blank', severity: 'error', message: 'every sampled frame is a single flat colour' });
      else for (const b of blanks) findings.push({ check: 'blank', severity: 'info', time: b.time, message: `frame at ${b.time.toFixed(2)}s is a flat colour` });
      // ---- determinism: re-seek in reverse order and compare
      if (o.determinism !== false) {
        for (let i = times.length - 1; i >= 0; i--) {
          const again = await grayscale(await captureFrame(comp, Math.max(0, times[i]!), { format: 'jpeg', quality: 80, width: cfg.width, height: cfg.height }));
          const delta = diff(again, grays[i]!);
          if (delta > 0.02) {
            findings.push({ check: 'determinism', severity: 'warning', time: times[i], message: `frame at ${times[i]!.toFixed(2)}s differs by ${(delta * 100).toFixed(1)}% when rendered again (time-dependent code outside the timeline?)` });
          }
        }
      }
      await comp.close();
      const avgSeekMs = Math.round(samples.reduce((a, s) => a + s.seekMs, 0) / Math.max(1, samples.length));
      if (avgSeekMs > 500) findings.push({ check: 'performance', severity: 'info', message: `slow frames: ${avgSeekMs} ms per frame on average` });
      scenes.push({ file: scene.relative, description: d, findings, samples, avgSeekMs });
    }
    let contactSheet: string | undefined;
    if (o.thumbnailsDir && thumbs.length) {
      contactSheet = path.join(o.thumbnailsDir, 'contact-sheet.jpg');
      const cols = Math.min(4, thumbs.length);
      const rows = Math.ceil(thumbs.length / cols);
      const inputs = thumbs.flatMap((t) => ['-i', t]);
      const filter = thumbs.map((_, i) => `[${i}:v]scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2,setsar=1[t${i}]`).join(';') +
        ';' + thumbs.map((_, i) => `[t${i}]`).join('') + `concat=n=${thumbs.length}:v=1:a=0,tile=${cols}x${rows}[out]`;
      await ffmpeg([...inputs, '-filter_complex', filter, '-map', '[out]', '-frames:v', '1', '-q:v', '3', contactSheet]);
    }
    const counts = { error: 0, warning: 0, info: 0 } as Record<FindingSeverity, number>;
    for (const s of scenes) for (const f of s.findings) counts[f.severity]++;
    return { root: project.root, scenes, counts, ok: counts.error === 0, contactSheet };
  } finally {
    await server.close();
    if (!o.browser) await browser.close().catch(() => {});
  }
}

export function formatInspectReport(r: InspectReport): string {
  const out: string[] = [];
  for (const s of r.scenes) {
    const d = s.description;
    out.push(`▸ ${s.file}${d ? `  ${d.config.width}x${d.config.height} @ ${d.config.fps}fps, ${d.config.duration.toFixed(2)}s, ${d.clips.length} clips, adapters: ${d.adapters.map((a) => a.type).join(', ') || 'none'}, ~${s.avgSeekMs} ms/frame` : ''}`);
    if (!s.findings.length) out.push('    ✓ no problems found');
    for (const f of s.findings) out.push(`    ${f.severity.padEnd(7)} [${f.check}]${f.time !== undefined ? ` @${f.time.toFixed(2)}s` : ''} ${f.message}`);
  }
  out.push('', `${r.counts.error} error(s), ${r.counts.warning} warning(s), ${r.counts.info} info${r.contactSheet ? `\ncontact sheet: ${r.contactSheet}` : ''}`);
  return out.join('\n');
}
