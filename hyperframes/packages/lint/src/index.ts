/**
 * @hfr/lint — static checks. Every rule has an id, a severity and, when
 * possible, a location and a suggested fix. Media checks use FFprobe when
 * available (pass `probeMedia: false` to skip them).
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  findTrackOverlaps, isLocalRef, isRemoteRef, loadProject, offsetToLineCol, parseKeyframes, parseTransitionSpec,
  resolveTimings, safeJoin, ProjectError, TimingError,
  type ClipInfo, type CompositionInfo, type LoadedProject, type RawTiming,
} from '@hfr/core';
import { probe, which, FFPROBE, type MediaInfo } from '@hfr/media';
import { checkCss, checkJavaScript, parseCaptions, scanJavaScript } from '@hfr/parsers';
import { listSceneTransitions } from '@hfr/shader-transitions';

export type Severity = 'error' | 'warning' | 'info';

export interface LintIssue {
  rule: string;
  severity: Severity;
  message: string;
  file: string;
  line?: number;
  col?: number;
  clip?: string;
  fix?: string;
}

export interface LintResult {
  root: string;
  files: string[];
  issues: LintIssue[];
  counts: Record<Severity, number>;
  ok: boolean;
}

export interface LintOptions {
  probeMedia?: boolean;
  /** Rule ids to disable. */
  disable?: string[];
}

export const RULES: Record<string, { severity: Severity; description: string }> = {
  'project/invalid': { severity: 'error', description: 'hyperframes.json or entry file cannot be loaded' },
  'project/scene-size': { severity: 'error', description: 'scenes must share width/height' },
  'project/transition': { severity: 'error', description: 'unknown scene transition or longer than the scenes it joins' },
  'html/parse-error': { severity: 'warning', description: 'HTML that browsers will silently repair' },
  'composition/missing-root': { severity: 'error', description: 'no element with data-composition' },
  'composition/config': { severity: 'error', description: 'invalid width/height/fps/duration' },
  'composition/odd-size': { severity: 'warning', description: 'H.264 needs even dimensions' },
  'composition/no-duration': { severity: 'info', description: 'duration will be derived from clips/timelines' },
  'timing/invalid': { severity: 'error', description: 'clip timing cannot be resolved' },
  'timing/out-of-bounds': { severity: 'warning', description: 'clip extends past the composition end' },
  'timing/never-visible': { severity: 'error', description: 'clip starts after the composition ends' },
  'timing/track-overlap': { severity: 'warning', description: 'clips overlap on the same track' },
  'timing/zero-duration': { severity: 'warning', description: 'clip has zero duration' },
  'timing/duplicate-id': { severity: 'error', description: 'two elements share an id' },
  'effects/invalid': { severity: 'error', description: 'invalid data-enter/data-exit/data-keyframes' },
  'assets/missing': { severity: 'error', description: 'referenced file does not exist' },
  'assets/remote': { severity: 'warning', description: 'remote URL fetched at render time (non-deterministic, may fail offline)' },
  'css/syntax': { severity: 'error', description: 'CSS parse error' },
  'css/unknown-property': { severity: 'warning', description: 'property not in the CSS spec' },
  'js/syntax': { severity: 'error', description: 'JavaScript parse error' },
  'js/timer-animation': { severity: 'warning', description: 'setTimeout/setInterval are wall-clock based and not seekable' },
  'js/unregistered-animation': { severity: 'warning', description: 'animation object is not registered with hf.register()' },
  'js/raf-loop': { severity: 'info', description: 'requestAnimationFrame loops work but hf.onFrame() is explicit and seek-safe' },
  'libraries/missing': { severity: 'error', description: 'library used but not loaded' },
  'libraries/remote': { severity: 'warning', description: 'library loaded from a CDN; prefer /__hf/lib/*' },
  'media/no-audio': { severity: 'error', description: '<audio> source has no audio stream' },
  'media/no-video': { severity: 'error', description: '<video> source has no video stream' },
  'media/too-short': { severity: 'warning', description: 'clip is longer than its media (audio/video will stop early: A/V sync risk)' },
  'media/unreadable': { severity: 'error', description: 'FFprobe cannot read the file' },
  'captions/invalid': { severity: 'error', description: 'captions file cannot be parsed' },
  'captions/out-of-bounds': { severity: 'warning', description: 'captions extend past the clip/composition' },
};


class Collector {
  issues: LintIssue[] = [];
  private disabled: Set<string>;
  constructor(disable: string[] = []) { this.disabled = new Set(disable); }
  add(rule: string, file: string, message: string, extra: Partial<LintIssue> = {}) {
    if (this.disabled.has(rule)) return;
    this.issues.push({ rule, severity: extra.severity ?? RULES[rule]?.severity ?? 'warning', message, file, ...extra });
  }
}

const BENIGN_PARSE_ERRORS = new Set(['missing-doctype']);

async function exists(p: string): Promise<boolean> {
  return stat(p).then(() => true, () => false);
}

export async function lintProject(target: string, o: LintOptions = {}): Promise<LintResult> {
  const c = new Collector(o.disable);
  let project: LoadedProject;
  try {
    project = await loadProject(target);
  } catch (e) {
    c.add('project/invalid', target, (e as Error).message);
    return finish(path.resolve(target), [], c.issues);
  }
  const canProbe = o.probeMedia !== false && !!(await which(FFPROBE));
  const sizes = new Set<string>();
  for (const scene of project.scenes) {
    const html = await readFile(scene.file, 'utf8');
    await lintComposition(scene.composition, html, { root: project.root, file: scene.relative, probeMedia: canProbe }, c);
    const cfg = scene.composition.config;
    sizes.add(`${cfg.width}x${cfg.height}`);
  }
  if (sizes.size > 1) c.add('project/scene-size', 'hyperframes.json', `scenes have different sizes: ${[...sizes].join(', ')}`);
  const known = new Set(listSceneTransitions());
  project.scenes.forEach((s, i) => {
    const tr = s.def.transition;
    if (!tr) return;
    if (!known.has(tr.type)) c.add('project/transition', 'hyperframes.json', `scenes[${i}]: unknown transition "${tr.type}"`, { fix: `use one of: ${[...known].slice(0, 12).join(', ')}, …` });
    const prev = project.scenes[i - 1]!.composition.config.duration;
    const cur = s.composition.config.duration;
    if ((prev !== null && tr.duration >= prev) || (cur !== null && tr.duration >= cur)) {
      c.add('project/transition', 'hyperframes.json', `scenes[${i}]: transition (${tr.duration}s) must be shorter than both scenes`);
    }
  });
  for (const [i, a] of (project.manifest.audio ?? []).entries()) {
    const abs = safeJoinOrNull(project.root, a.src);
    if (!abs || !(await exists(abs))) c.add('assets/missing', 'hyperframes.json', `audio[${i}].src not found: ${a.src}`);
  }
  if (project.manifest.captions) {
    const abs = safeJoinOrNull(project.root, project.manifest.captions.src);
    if (!abs || !(await exists(abs))) c.add('assets/missing', 'hyperframes.json', `captions.src not found: ${project.manifest.captions.src}`);
  }
  return finish(project.root, project.scenes.map((s) => s.relative), c.issues);
}

function safeJoinOrNull(root: string, rel: string): string | null {
  try { return safeJoin(root, rel); } catch { return null; }
}

function finish(root: string, files: string[], issues: LintIssue[]): LintResult {
  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0));
  const counts = { error: 0, warning: 0, info: 0 } as Record<Severity, number>;
  for (const i of issues) counts[i.severity]++;
  return { root, files, issues, counts, ok: counts.error === 0 };
}

export interface CompositionLintContext { root: string; file: string; probeMedia: boolean }

export async function lintComposition(info: CompositionInfo, html: string, ctx: CompositionLintContext, collector?: Collector): Promise<LintIssue[]> {
  const c = collector ?? new Collector();
  const { file } = ctx;
  const fileDir = path.dirname(safeJoin(ctx.root, file));

  for (const e of info.parseErrors) {
    if (BENIGN_PARSE_ERRORS.has(e.code)) continue;
    c.add('html/parse-error', file, e.message, { line: e.line, col: e.col });
  }
  if (!info.hasRoot) {
    c.add('composition/missing-root', file, 'no element with data-composition', { fix: '<div data-composition data-width="1920" data-height="1080" data-fps="30" data-duration="10">…</div>' });
  }
  const cfg = info.config;
  if (!(cfg.width > 0 && cfg.width <= 7680) || !(cfg.height > 0 && cfg.height <= 4320)) c.add('composition/config', file, `invalid size ${cfg.width}x${cfg.height} (1..7680 x 1..4320)`);
  if (!(cfg.fps >= 1 && cfg.fps <= 120)) c.add('composition/config', file, `invalid fps ${cfg.fps} (1..120)`);
  if (cfg.duration !== null && !(cfg.duration > 0)) c.add('composition/config', file, `invalid duration ${cfg.duration}`);
  if (cfg.width % 2 || cfg.height % 2) c.add('composition/odd-size', file, `${cfg.width}x${cfg.height} has odd dimensions; MP4 output will be cropped by 1px`);
  if (cfg.duration === null && info.hasRoot) c.add('composition/no-duration', file, 'no data-duration on the root; the duration is derived from clips and registered timelines');

  // ---- ids
  const seen = new Map<string, number>();
  for (const cl of info.clips) seen.set(cl.id, (seen.get(cl.id) ?? 0) + 1);
  for (const [id, n] of seen) if (n > 1) c.add('timing/duplicate-id', file, `id "${id}" is used by ${n} clips`);

  // ---- media probing
  const media = new Map<string, MediaInfo | null>();
  const resolveRef = (ref: string): string | null => {
    const clean = ref.split(/[?#]/)[0]!;
    try {
      return clean.startsWith('/') ? safeJoin(ctx.root, clean) : safeJoin(ctx.root, path.relative(ctx.root, path.resolve(fileDir, decodeURIComponent(clean))));
    } catch {
      return null;
    }
  };
  if (ctx.probeMedia) {
    for (const cl of info.clips) {
      if ((cl.kind === 'audio' || cl.kind === 'video') && cl.src && isLocalRef(cl.src)) {
        const abs = resolveRef(cl.src);
        if (!abs || !(await exists(abs))) continue;
        try {
          const m = await probe(abs);
          media.set(cl.id, m);
          if (cl.kind === 'audio' && !m.audio) c.add('media/no-audio', file, `${cl.src} has no audio stream`, { clip: cl.id, line: cl.location?.line });
          if (cl.kind === 'video' && !m.video) c.add('media/no-video', file, `${cl.src} has no video stream`, { clip: cl.id, line: cl.location?.line });
        } catch (e) {
          media.set(cl.id, null);
          c.add('media/unreadable', file, `${cl.src}: ${(e as Error).message.split('\n')[0]}`, { clip: cl.id, line: cl.location?.line });
        }
      }
    }
  }

  // ---- timing
  const raws: RawTiming[] = info.clips.map((cl) => ({
    id: cl.id, start: cl.start, duration: cl.duration, end: cl.end, track: cl.track,
    mediaStart: cl.mediaStart, mediaDuration: media.get(cl.id)?.duration ?? null,
  }));
  try {
    const timings = resolveTimings(raws, { fps: cfg.fps, compositionDuration: cfg.duration ?? null });
    const byId = new Map(info.clips.map((cl) => [cl.id, cl]));
    for (const t of timings) {
      const cl = byId.get(t.id)!;
      const at = { clip: t.id, line: cl.location?.line, col: cl.location?.col };
      if (cfg.duration !== null && t.start >= cfg.duration) c.add('timing/never-visible', file, `"${label(cl)}" starts at ${t.start}s, after the composition ends (${cfg.duration}s)`, at);
      else if (cfg.duration !== null && t.end > cfg.duration + 1e-6 && !((cl.kind === 'audio' || cl.kind === 'video') && !cl.duration && !cl.end)) c.add('timing/out-of-bounds', file, `"${label(cl)}" ends at ${round(t.end)}s, after the composition (${cfg.duration}s)`, at);
      if (t.duration === 0) c.add('timing/zero-duration', file, `"${label(cl)}" has zero duration`, at);
      const m = media.get(t.id);
      if (m?.duration && !cl.loop && (cl.kind === 'audio' || cl.kind === 'video')) {
        const available = m.duration - cl.mediaStart;
        if (t.duration > available + 0.05) {
          c.add('media/too-short', file, `"${label(cl)}" lasts ${round(t.duration)}s but ${cl.src} only has ${round(available)}s after data-media-start`, { ...at, fix: 'shorten the clip, add data-loop or change data-media-start' });
        }
      }
    }
    for (const [a, b] of findTrackOverlaps(timings.filter((t) => byId.get(t.id)!.track !== null && byId.get(t.id)!.kind !== 'audio'))) {
      c.add('timing/track-overlap', file, `"${a.id}" and "${b.id}" overlap on track ${a.track} (${round(b.start)}s < ${round(a.end)}s)`, { clip: b.id, line: byId.get(b.id)!.location?.line });
    }
  } catch (e) {
    if (e instanceof TimingError) {
      const cl = info.clips.find((x) => x.id === e.clipId);
      c.add('timing/invalid', file, e.message, { clip: e.clipId, line: cl?.location?.line, col: cl?.location?.col });
    } else if (!(e instanceof ProjectError)) throw e;
  }

  // ---- effects
  for (const cl of info.clips) {
    const at = { clip: cl.id, line: cl.location?.line };
    if (cl.enter && !parseTransitionSpec(cl.enter)) c.add('effects/invalid', file, `unknown data-enter preset "${cl.enter}"`, at);
    if (cl.exit && !parseTransitionSpec(cl.exit)) c.add('effects/invalid', file, `unknown data-exit preset "${cl.exit}"`, at);
    if (cl.keyframes) {
      try { parseKeyframes(cl.keyframes); } catch (e) { c.add('effects/invalid', file, `data-keyframes: ${(e as Error).message}`, at); }
    }
  }

  // ---- assets
  const checked = new Set<string>();
  for (const a of info.assets) {
    if (a.ref.startsWith('/__hf/')) continue;
    if (isRemoteRef(a.ref)) {
      c.add('assets/remote', file, `${a.ref} is fetched from the network at render time`, { line: a.location?.line, fix: 'download it into the project (e.g. assets/)' });
      continue;
    }
    if (!isLocalRef(a.ref)) continue;
    const abs = resolveRef(a.ref);
    const key = `${abs}`;
    if (checked.has(key)) continue;
    checked.add(key);
    if (!abs) { c.add('assets/missing', file, `${a.ref} points outside the project`, { line: a.location?.line }); continue; }
    if (!(await exists(abs))) c.add('assets/missing', file, `${a.ref} not found (${a.tag} ${a.attr})`, { line: a.location?.line });
  }

  // ---- css
  for (const s of info.styles) {
    if (s.tailwind) continue;
    for (const issue of checkCss(s.content, { declarationList: s.inlineAttribute })) {
      const line = s.inlineAttribute ? s.location?.line : (s.location ? s.location.line + issue.line - 1 : issue.line);
      const rule = issue.message.startsWith('unknown property') ? 'css/unknown-property' : 'css/syntax';
      c.add(rule, file, issue.message, { line, col: s.inlineAttribute ? s.location?.col : issue.col });
    }
  }

  // ---- js
  const inlineJs = info.scripts.filter((s) => s.inline !== null && s.inline.trim() && isJsType(s.type));
  const allCode = inlineJs.map((s) => s.inline).join('\n');
  for (const s of inlineJs) {
    const module = s.type === 'module';
    const base = s.location ? offsetToLineCol(html, s.location.startOffset) : { line: 1, col: 1 };
    for (const issue of checkJavaScript(s.inline!, { module })) {
      c.add('js/syntax', file, issue.message, { line: base.line + issue.line - 1, col: issue.col });
    }
    const { calls } = scanJavaScript(s.inline!, { module });
    for (const call of calls) {
      const at = { line: base.line + call.line - 1, col: call.col };
      if (/^(window\.)?(setTimeout|setInterval)$/.test(call.name)) {
        c.add('js/timer-animation', file, `${call.name}() runs on wall-clock time; renders seek frames out of order`, { ...at, fix: 'use a GSAP timeline, data-keyframes or hf.onFrame((t) => …)' });
      }
      if (/^(window\.)?requestAnimationFrame$/.test(call.name)) c.add('js/raf-loop', file, 'requestAnimationFrame loop detected (virtualised during renders)', at);
      if (/^(anime\.)?(animate|createTimeline|timeline)$/.test(call.name) && /anime/.test(allCode) && !/hf\.register\(/.test(allCode) && !/__timelines/.test(allCode)) {
        c.add('js/unregistered-animation', file, `Anime.js ${call.name}() result must be passed to hf.register() to be seekable`, at);
      }
      if (call.name === 'lottie.loadAnimation' && !/hf\.register\(/.test(allCode)) {
        c.add('js/unregistered-animation', file, 'lottie.loadAnimation() result must be passed to hf.register() (or use data-hf-lottie)', at);
      }
    }
  }

  // ---- libraries
  const srcs = info.scripts.map((s) => s.src ?? '').join('\n');
  const hasLib = (re: RegExp) => re.test(srcs) || info.scripts.some((s) => s.type === 'importmap' && re.test(s.inline ?? ''));
  for (const s of info.scripts) {
    if (s.src && isRemoteRef(s.src) && /gsap|anime|lottie|three|tailwind/i.test(s.src)) {
      c.add('libraries/remote', file, `${s.src} is loaded from a CDN`, { line: s.location?.line, fix: 'use /__hf/lib/gsap.js, /__hf/lib/anime.js, /__hf/lib/lottie.js or /__hf/lib/three.module.js' });
    }
  }
  if (/\bgsap\.(to|from|fromTo|timeline|set)\(/.test(allCode) && !hasLib(/gsap/i) && !/import .* from ['"]gsap/.test(allCode)) {
    c.add('libraries/missing', file, 'GSAP is used but not loaded', { fix: '<script src="/__hf/lib/gsap.js"></script>' });
  }
  if (info.clips.some((cl) => cl.kind === 'lottie') && !hasLib(/lottie/i)) {
    c.add('libraries/missing', file, 'data-hf-lottie requires lottie-web', { fix: '<script src="/__hf/lib/lottie.js"></script>' });
  }
  if (/\banime\.(animate|createTimeline)\(/.test(allCode) && !hasLib(/anime/i) && !/from ['"].*anime/.test(allCode)) {
    c.add('libraries/missing', file, 'Anime.js is used but not loaded', { fix: '<script src="/__hf/lib/anime.js"></script>' });
  }
  if (/from ['"]three['"]/.test(allCode) && !hasLib(/three/i)) {
    c.add('libraries/missing', file, 'import from "three" needs an importmap', { fix: '<script type="importmap">{"imports":{"three":"/__hf/lib/three.module.js","three/addons/":"/__hf/lib/three/addons/"}}</script>' });
  }
  if (/HFShaderTransitions|data-hf-shader/.test(allCode + html) && !/shader-transitions\.js/.test(srcs)) {
    c.add('libraries/missing', file, 'data-hf-shader needs the shader transitions library', { fix: '<script src="/__hf/lib/shader-transitions.js"></script>' });
  }

  // ---- captions
  for (const cl of info.clips.filter((x) => x.kind === 'captions' && x.src)) {
    const abs = resolveRef(cl.src!);
    if (!abs || !(await exists(abs))) continue;
    try {
      const doc = parseCaptions(abs, await readFile(abs, 'utf8'), { duration: cfg.duration ?? 10 });
      const end = Math.max(0, ...doc.cues.map((q) => q.end));
      if (cfg.duration !== null && end > cfg.duration + 0.05) c.add('captions/out-of-bounds', file, `${cl.src} ends at ${round(end)}s, after the composition (${cfg.duration}s)`, { clip: cl.id, line: cl.location?.line });
    } catch (e) {
      c.add('captions/invalid', file, `${cl.src}: ${(e as Error).message}`, { clip: cl.id, line: cl.location?.line });
    }
  }
  return c.issues;
}

function isJsType(type: string | null): boolean {
  return !type || type === 'module' || /javascript|ecmascript/.test(type);
}

const round = (n: number) => Math.round(n * 1000) / 1000;
const label = (cl: ClipInfo) => cl.name ?? cl.id;

/** Human readable report. */
export function formatLintResult(r: LintResult, o: { color?: boolean } = {}): string {
  const col = (code: string, s: string) => (o.color ? `\x1b[${code}m${s}\x1b[0m` : s);
  const sev = { error: col('31', 'error'), warning: col('33', 'warn '), info: col('36', 'info ') };
  const lines = r.issues.map((i) => `${sev[i.severity]} ${i.file}${i.line ? `:${i.line}${i.col ? `:${i.col}` : ''}` : ''}  ${i.message}  ${col('2', i.rule)}${i.fix ? `\n        ${col('2', 'fix:')} ${i.fix}` : ''}`);
  lines.push('', `${r.files.length} file(s): ${r.counts.error} error(s), ${r.counts.warning} warning(s), ${r.counts.info} info`);
  return lines.join('\n');
}
