/**
 * hfr — HyperFrames-compatible command line.
 * Every command maps to a library function; nothing here is simulated.
 */
import { readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, type ParseArgsConfig } from 'node:util';
import { loadProject, RESOLUTION_PRESETS, type CaptionDocument } from '@hfr/core';
import { formatInspectReport, inspectProject } from '@hfr/inspector';
import { formatLintResult, lintProject, RULES } from '@hfr/lint';
import {
  analyzeAudio, detectScenes, detectSilence, extractFrames, extractPalette, FFMPEG, FFPROBE, listAssets, measureLoudness, probe,
  run, thumbnail, transcode, which,
} from '@hfr/media';
import { parseCaptions, retimeCaptions, serializeCaptions, wordsToCues, type CaptionFormat } from '@hfr/parsers';
import { renderProject, type RenderProgress } from '@hfr/producer';
import { addItemToComposition, instantiateTemplate, loadRegistry, searchRegistry, type ItemType } from '@hfr/registry';
import { createShareBundle } from '@hfr/share';
import { listSceneTransitions } from '@hfr/shader-transitions';
import { captureWebsite, convertFigmaJson, convertRemotion, createSlideshow, importFigma, parseFigmaUrl, reverseVideo, sampleStyle } from '@hfr/skills';
import { alignText, synthesize, transcribe, transcriptionProviders, TTS_PROVIDERS, type TtsProviderName } from '@hfr/voice';
import { vendorLibraries, FONT_PACKAGES, launchBrowser } from '@hfr/engine';
import { startPreview } from './preview.ts';

const VERSION = '0.1.0';
const isTTY = process.stdout.isTTY;
const c = (code: string, s: string) => (isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = (s: string) => c('1', s), dim = (s: string) => c('2', s), green = (s: string) => c('32', s), yellow = (s: string) => c('33', s), red = (s: string) => c('31', s);

type Opts = Record<string, string | boolean | string[] | undefined>;
interface Command {
  summary: string;
  usage: string;
  options?: ParseArgsConfig['options'];
  run: (args: string[], opts: Opts) => Promise<number | void>;
}

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === 'string' && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);
const json = (data: unknown) => console.log(JSON.stringify(data, null, 2));
const bytes = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${(n / 1e3).toFixed(0)} KB`);

function progressBar(p: RenderProgress) {
  if (!isTTY) { if (p.phase !== 'frames') console.log(`[${p.phase}] ${p.message ?? ''}`); return; }
  const w = 30, filled = Math.round((p.percent / 100) * w);
  const extra = p.phase === 'frames' ? ` ${p.frame}/${p.totalFrames} frames · ${p.fps} fps · eta ${p.etaSeconds}s` : ` ${p.message ?? ''}`;
  process.stdout.write(`\r${p.phase.padEnd(7)} [${'█'.repeat(filled)}${'░'.repeat(w - filled)}] ${p.percent.toFixed(0).padStart(3)}%${extra}`.padEnd(100));
  if (p.phase === 'done') process.stdout.write('\n');
}

const COMMANDS: Record<string, Command> = {
  init: {
    summary: 'create a project from a template',
    usage: 'hfr init <dir> [--template promo] [--title "My video"]   (hfr registry list --type template)',
    options: { template: { type: 'string', short: 't' }, title: { type: 'string' }, force: { type: 'boolean' } },
    async run([dir], o) {
      if (!dir) throw new Error('usage: hfr init <dir>');
      const target = path.resolve(dir);
      const existing = await stat(path.join(target, 'hyperframes.json')).then(() => true, () => false);
      if (existing && !o.force) throw new Error(`${dir} already contains a project (use --force to overwrite)`);
      const name = str(o.template) ?? 'blank';
      const item = (await loadRegistry()).find((i) => i.name === name && i.type === 'template');
      if (!item) throw new Error(`unknown template "${name}". Available: ${(await loadRegistry()).filter((i) => i.type === 'template').map((i) => i.name).join(', ')}`);
      const files = await instantiateTemplate(item, target, { title: str(o.title) ?? path.basename(target) });
      console.log(`${green('✓')} created ${bold(dir)} from template ${bold(name)} (${files.length} files)\n\n  cd ${dir}\n  hfr preview        ${dim('# live preview in the browser')}\n  hfr lint           ${dim('# static checks')}\n  hfr render         ${dim('# → renders/*.mp4')}`);
    },
  },

  preview: {
    summary: 'live preview with player controls and auto-reload',
    usage: 'hfr preview [project] [--port 4321] [--scene 0] [--host 127.0.0.1]',
    options: { port: { type: 'string', short: 'p' }, scene: { type: 'string' }, host: { type: 'string' } },
    async run([dir = '.'], o) {
      const p = await startPreview({ project: dir, port: num(o.port), scene: num(o.scene), host: str(o.host), log: (s) => console.error(dim(s)) });
      console.log(`${green('●')} preview running at ${bold(p.url)}  ${dim('(Ctrl+C to stop)')}`);
      await new Promise<void>((resolve) => process.once('SIGINT', () => resolve()));
      await p.close();
    },
  },

  lint: {
    summary: 'static validation (HTML, CSS, JS, timing, assets, media, captions)',
    usage: 'hfr lint [project] [--json] [--no-probe] [--disable rule,rule]   (hfr lint --rules)',
    options: { json: { type: 'boolean' }, 'no-probe': { type: 'boolean' }, disable: { type: 'string' }, rules: { type: 'boolean' } },
    async run([dir = '.'], o) {
      if (o.rules) { for (const [id, r] of Object.entries(RULES)) console.log(`${r.severity.padEnd(8)} ${id.padEnd(28)} ${dim(r.description)}`); return 0; }
      const r = await lintProject(dir, { probeMedia: !o['no-probe'], disable: str(o.disable)?.split(',') });
      if (o.json) json(r); else console.log(formatLintResult(r, { color: isTTY }));
      return r.ok ? 0 : 1;
    },
  },

  inspect: {
    summary: 'runtime diagnostics in headless Chromium (errors, fonts, blank frames, determinism, A/V sync)',
    usage: 'hfr inspect [project] [--samples 8] [--thumbnails dir] [--json] [--no-determinism]',
    options: { samples: { type: 'string' }, thumbnails: { type: 'string' }, json: { type: 'boolean' }, 'no-determinism': { type: 'boolean' } },
    async run([dir = '.'], o) {
      const r = await inspectProject(dir, { samples: num(o.samples), thumbnailsDir: str(o.thumbnails), determinism: !o['no-determinism'] });
      if (o.json) json(r); else console.log(formatInspectReport(r));
      return r.ok ? 0 : 1;
    },
  },

  render: {
    summary: 'render a project to MP4/WebM/MOV/GIF',
    usage: 'hfr render [project] [-o out.mp4] [--resolution 1080p|4k|…] [--width W] [--height H] [--scale 2] [--fps 30] [--quality draft|standard|high] [--crf N] [--workers N] [--range 2:5] [--png] [--subtitles file] [--allow-errors] [--json]',
    options: {
      output: { type: 'string', short: 'o' }, resolution: { type: 'string', short: 'r' }, width: { type: 'string' }, height: { type: 'string' }, scale: { type: 'string' },
      fps: { type: 'string' }, quality: { type: 'string', short: 'q' }, crf: { type: 'string' }, workers: { type: 'string', short: 'w' }, range: { type: 'string' },
      png: { type: 'boolean' }, subtitles: { type: 'string' }, 'allow-errors': { type: 'boolean' }, json: { type: 'boolean' }, 'keep-temp': { type: 'boolean' }, 'skip-lint': { type: 'boolean' },
    },
    async run([dir = '.'], o) {
      const project = await loadProject(dir);
      if (!o['skip-lint']) {
        const l = await lintProject(dir);
        if (!l.ok) { console.log(formatLintResult(l, { color: isTTY })); throw new Error('lint found errors (fix them or pass --skip-lint)'); }
      }
      const res = str(o.resolution) ? RESOLUTION_PRESETS[str(o.resolution)!.toLowerCase()] : undefined;
      if (o.resolution && !res) throw new Error(`unknown resolution "${o.resolution}" (${Object.keys(RESOLUTION_PRESETS).join(', ')})`);
      const output = str(o.output) ?? path.join(project.root, project.manifest.output?.file ?? `renders/${path.basename(project.root)}.mp4`);
      let range: { start: number; end: number } | undefined;
      if (str(o.range)) {
        const [a, b] = str(o.range)!.split(':').map(Number);
        if (!Number.isFinite(a) || !Number.isFinite(b) || b! <= a!) throw new Error('--range must be start:end in seconds, e.g. 2:5');
        range = { start: a!, end: b! };
      }
      const quality = (str(o.quality) ?? 'standard') as 'draft' | 'standard' | 'high';
      if (!['draft', 'standard', 'high'].includes(quality)) throw new Error('--quality must be draft, standard or high');
      const r = await renderProject({
        project: dir, output, width: num(o.width) ?? res?.width, height: num(o.height) ?? res?.height, scale: num(o.scale), fps: num(o.fps),
        quality, crf: num(o.crf), workers: num(o.workers), range, frameFormat: o.png ? 'png' : 'jpeg', subtitles: str(o.subtitles),
        allowErrors: !!o['allow-errors'], keepTemp: !!o['keep-temp'], onProgress: o.json ? undefined : progressBar,
      });
      if (o.json) { json(r); return 0; }
      for (const w of r.warnings) console.log(yellow(`warning: ${w}`));
      console.log(`${green('✓')} ${bold(path.relative(process.cwd(), r.output) || r.output)}  ${r.width}x${r.height} @ ${r.fps}fps · ${r.duration.toFixed(2)}s · ${r.frames} frames · ${r.audioTracks} audio track(s) · ${bytes(r.size)} · ${(r.timings.totalMs / 1000).toFixed(1)}s`);
    },
  },

  studio: {
    summary: 'start the Studio web app (projects, editor, timeline, media, renders)',
    usage: 'hfr studio [--workspace ./projects] [--port 4400] [--host 127.0.0.1]',
    options: { workspace: { type: 'string' }, port: { type: 'string', short: 'p' }, host: { type: 'string' } },
    async run(_a, o) {
      const { startStudioServer } = await import('@hfr/studio-server');
      const s = await startStudioServer({ workspace: str(o.workspace) ?? path.resolve('hfr-projects'), port: num(o.port) ?? 4400, host: str(o.host) ?? '127.0.0.1' });
      console.log(`${green('●')} Studio at ${bold(s.url)}  ${dim(`workspace: ${s.workspace}`)}${s.token ? `\n  token: ${s.token}` : ''}`);
      await new Promise<void>((resolve) => process.once('SIGINT', () => resolve()));
      await s.close();
    },
  },

  doctor: {
    summary: 'check the environment (Node, FFmpeg, Chromium, codecs, optional tools, API keys)',
    usage: 'hfr doctor [--json]',
    options: { json: { type: 'boolean' } },
    async run(_a, o) {
      const checks: Array<{ name: string; ok: boolean; detail: string; required: boolean }> = [];
      const [major, minor] = process.versions.node.split('.').map(Number) as [number, number];
      checks.push({ name: 'Node.js ≥ 22.18 (TypeScript type stripping)', ok: major > 22 || (major === 22 && minor >= 18), detail: process.version, required: true });
      const ff = await which(FFMPEG);
      checks.push({ name: 'FFmpeg', ok: !!ff, detail: ff ? (await run(FFMPEG, ['-version'])).stdout.split('\n')[0]! : 'not found', required: true });
      checks.push({ name: 'FFprobe', ok: !!(await which(FFPROBE)), detail: (await which(FFPROBE)) ?? 'not found', required: true });
      if (ff) {
        const enc = (await run(FFMPEG, ['-hide_banner', '-encoders'])).stdout;
        for (const [codec, req] of [['libx264', true], ['aac', true], ['libvpx-vp9', false], ['libopus', false], ['prores_ks', false], ['libmp3lame', false]] as const) {
          checks.push({ name: `encoder ${codec}`, ok: enc.includes(` ${codec} `), detail: enc.includes(` ${codec} `) ? 'available' : 'missing', required: req });
        }
        const filters = (await run(FFMPEG, ['-hide_banner', '-filters'])).stdout;
        checks.push({ name: 'filter xfade (scene transitions)', ok: / xfade /.test(filters), detail: / xfade /.test(filters) ? 'available' : 'missing (FFmpeg ≥ 4.3)', required: false });
      }
      try {
        const b = await launchBrowser();
        const page = await b.newPage();
        const gl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl'));
        checks.push({ name: 'Chromium (Playwright)', ok: true, detail: b.version(), required: true });
        checks.push({ name: 'WebGL in headless Chromium (Three.js, shaders)', ok: gl, detail: gl ? 'available (SwiftShader)' : 'unavailable', required: false });
        await b.close();
      } catch (e) {
        checks.push({ name: 'Chromium (Playwright)', ok: false, detail: (e as Error).message.split('\n')[0]!, required: true });
      }
      for (const [name, p] of Object.entries(TTS_PROVIDERS)) {
        const a = await p.available();
        checks.push({ name: `TTS provider ${name}`, ok: a.ok, detail: a.ok ? 'available' : a.reason!, required: false });
      }
      for (const [name, a] of Object.entries(await transcriptionProviders())) checks.push({ name: `transcription ${name}`, ok: a.ok, detail: a.ok ? 'available' : a.reason!, required: false });
      checks.push({ name: 'Figma API token', ok: !!process.env.FIGMA_TOKEN, detail: process.env.FIGMA_TOKEN ? 'FIGMA_TOKEN set' : 'set FIGMA_TOKEN for `hfr figma`', required: false });
      checks.push({ name: 'CPU cores', ok: true, detail: `${os.availableParallelism()} (render workers default to half)`, required: false });
      if (o.json) { json(checks); return checks.some((x) => x.required && !x.ok) ? 1 : 0; }
      for (const x of checks) console.log(`${x.ok ? green('✓') : x.required ? red('✗') : yellow('○')} ${x.name.padEnd(48)} ${dim(x.detail)}`);
      return checks.some((x) => x.required && !x.ok) ? 1 : 0;
    },
  },

  media: {
    summary: 'media tools: probe, transcode, frames, thumbnail, analyze, scenes, silence, loudness, palette, list',
    usage: 'hfr media probe <file> | transcode <in> <out> [--codec h264|vp9] [--max-height 1080] | frames <video> <dir> [--fps 30] | thumbnail <video> <out.jpg> [--time 1]\n           | analyze <audio> [--fps 30] [--bands 32] | scenes <video> [--threshold 0.3] | silence <audio> | loudness <file> | palette <image|video> | list [project]',
    options: { codec: { type: 'string' }, 'max-height': { type: 'string' }, fps: { type: 'string' }, time: { type: 'string' }, bands: { type: 'string' }, threshold: { type: 'string' }, out: { type: 'string', short: 'o' } },
    async run([sub, a, b], o) {
      switch (sub) {
        case 'probe': json(await probe(need(a, 'file'))); return;
        case 'transcode': await transcode(need(a, 'input'), need(b, 'output'), { codec: (str(o.codec) as 'h264' | 'vp9') ?? 'h264', maxHeight: num(o['max-height']) }); console.log(`${green('✓')} ${b}`); return;
        case 'frames': console.log(`${green('✓')} ${await extractFrames(need(a, 'video'), need(b, 'dir'), { fps: num(o.fps) ?? 30 })} frames → ${b}`); return;
        case 'thumbnail': await thumbnail(need(a, 'video'), need(b, 'out'), num(o.time) ?? 0); console.log(`${green('✓')} ${b}`); return;
        case 'analyze': {
          const r = await analyzeAudio(need(a, 'audio'), { fps: num(o.fps) ?? 30, bands: num(o.bands) ?? 32 });
          if (str(o.out)) { await writeFile(str(o.out)!, JSON.stringify(r)); console.log(`${green('✓')} ${r.frames.length} frames → ${o.out}`); }
          else json({ fps: r.fps, bands: r.bands, duration: r.duration, frames: r.frames.length, peakFrame: r.frames.reduce((m, f, i) => (f[0]! > r.frames[m]![0]! ? i : m), 0) });
          return;
        }
        case 'scenes': json(await detectScenes(need(a, 'video'), { threshold: num(o.threshold) })); return;
        case 'silence': json(await detectSilence(need(a, 'audio'))); return;
        case 'loudness': json(await measureLoudness(need(a, 'file'))); return;
        case 'palette': json(await extractPalette(need(a, 'file'))); return;
        case 'list': json(await listAssets((await loadProject(a ?? '.')).root)); return;
        default: throw new Error(`unknown media command "${sub ?? ''}"\n${COMMANDS.media!.usage}`);
      }
    },
  },

  captions: {
    summary: 'captions: convert, retime, transcribe (ASR), align a script, build word timings',
    usage: 'hfr captions convert <in> -o <out.srt|vtt|ass|json> [--karaoke] | retime <in> -o <out> [--offset 0.5] [--scale 1]\n             | transcribe <audio> -o <out.json> [--provider openai|whisper] [--language pt] | align <audio> <script.txt> -o <out.json>',
    options: { out: { type: 'string', short: 'o' }, karaoke: { type: 'boolean' }, offset: { type: 'string' }, scale: { type: 'string' }, provider: { type: 'string' }, language: { type: 'string' }, model: { type: 'string' } },
    async run([sub, a, b], o) {
      const out = str(o.out);
      const write = async (doc: CaptionDocument) => {
        if (!out) { json(doc); return; }
        const fmt = (path.extname(out).slice(1) || 'json') as CaptionFormat;
        await writeFile(out, serializeCaptions(doc, fmt, { karaoke: !!o.karaoke }));
        console.log(`${green('✓')} ${doc.cues.length} cue(s) → ${out}`);
      };
      switch (sub) {
        case 'convert': return write(parseCaptions(need(a, 'input'), await readFile(a!, 'utf8')));
        case 'retime': return write(retimeCaptions(parseCaptions(need(a, 'input'), await readFile(a!, 'utf8')), { offset: num(o.offset), scale: num(o.scale) }));
        case 'transcribe': {
          const doc = await transcribe(need(a, 'audio'), { provider: str(o.provider) as 'openai' | 'whisper' | undefined, language: str(o.language), model: str(o.model) });
          console.log(dim(`provider: ${doc.provider}`));
          return write(doc);
        }
        case 'align': {
          const words = await alignText(need(a, 'audio'), await readFile(need(b, 'script'), 'utf8'));
          console.log(dim('offline alignment (silence-based estimate); use transcribe for exact word timings'));
          return write({ cues: wordsToCues(words) });
        }
        default: throw new Error(`unknown captions command "${sub ?? ''}"\n${COMMANDS.captions!.usage}`);
      }
    },
  },

  tts: {
    summary: 'text to speech with word timings (espeak-ng, command, ElevenLabs, OpenAI)',
    usage: 'hfr tts "text" | --file script.txt  -o narration.mp3 [--provider espeak|command|elevenlabs|openai] [--voice id] [--language pt-BR] [--rate 160] [--captions out.json]',
    options: { out: { type: 'string', short: 'o' }, file: { type: 'string', short: 'f' }, provider: { type: 'string' }, voice: { type: 'string' }, language: { type: 'string' }, rate: { type: 'string' }, captions: { type: 'string' }, model: { type: 'string' } },
    async run([text], o) {
      const input = str(o.file) ? await readFile(str(o.file)!, 'utf8') : text;
      if (!input?.trim()) throw new Error('give the text as an argument or with --file');
      const provider = str(o.provider) as TtsProviderName | undefined;
      if (provider && !(provider in TTS_PROVIDERS)) throw new Error(`unknown provider ${provider}`);
      const r = await synthesize({ text: input.trim(), out: str(o.out) ?? 'narration.mp3', provider, voice: str(o.voice), language: str(o.language), rate: num(o.rate), model: str(o.model) });
      console.log(`${green('✓')} ${r.file} · ${r.duration.toFixed(2)}s · ${r.words.length} words · provider ${r.provider} · timings: ${r.timing}`);
      if (str(o.captions)) {
        const doc: CaptionDocument = { language: str(o.language), cues: wordsToCues(r.words) };
        const f = str(o.captions)!;
        await writeFile(f, serializeCaptions(doc, (path.extname(f).slice(1) || 'json') as CaptionFormat));
        console.log(`${green('✓')} captions → ${f}`);
      }
    },
  },

  registry: {
    summary: 'browse and install components/templates',
    usage: 'hfr registry list [--type block|template|transition] [--search q] | show <item> | add <item> [--to index.html] [--param key=value …] [--project .]',
    options: { type: { type: 'string' }, search: { type: 'string', short: 's' }, to: { type: 'string' }, param: { type: 'string', multiple: true }, project: { type: 'string' }, json: { type: 'boolean' }, source: { type: 'string', multiple: true } },
    async run([sub = 'list', name], o) {
      const items = await loadRegistry((o.source as string[] | undefined) ?? []);
      if (sub === 'list') {
        const list = searchRegistry(items, str(o.search) ?? '', str(o.type) as ItemType | undefined);
        if (o.json) return json(list);
        for (const i of list) console.log(`${bold(i.name.padEnd(20))} ${dim(i.type.padEnd(10))} ${i.description}`);
        return;
      }
      const item = items.find((i) => i.name === name);
      if (!item) throw new Error(`unknown item "${name}"`);
      if (sub === 'show') {
        if (o.json) return json(item);
        console.log(`${bold(item.title)} (${item.name}, ${item.type})\n${item.description}\n`);
        for (const [k, p] of Object.entries(item.params ?? {})) console.log(`  --param ${k}=${dim(String(p.default))}  ${p.description ?? ''}${p.options ? ` [${p.options.join('|')}]` : ''}`);
        if (item.requires?.length) console.log(`\nrequires: ${item.requires.join(', ')}`);
        return;
      }
      if (sub === 'add') {
        const project = await loadProject(str(o.project) ?? '.');
        const params = Object.fromEntries(((o.param as string[] | undefined) ?? []).map((kv) => { const i = kv.indexOf('='); if (i < 0) throw new Error(`--param needs key=value: ${kv}`); return [kv.slice(0, i), kv.slice(i + 1)]; }));
        const target = str(o.to) ?? project.scenes[0]!.relative;
        const r = await addItemToComposition(project.root, target, item, params);
        console.log(`${green('✓')} added ${bold(item.name)} to ${r.file}${r.headAdded.length ? ` · head: ${r.headAdded.join(', ')}` : ''}${r.copied.length ? ` · files: ${r.copied.join(', ')}` : ''}`);
        return;
      }
      throw new Error(`unknown registry command "${sub}"`);
    },
  },

  slideshow: {
    summary: 'build a presentation video project from Markdown or images (optional narration)',
    usage: 'hfr slideshow <deck.md | images…> -o <dir> [--theme midnight|paper|sunset] [--transition fade|slide|zoom|wipe|iris|blur] [--duration 4] [--music file] [--narrate --provider espeak --voice pt-br] [--resolution vertical-1080]',
    options: { out: { type: 'string', short: 'o' }, theme: { type: 'string' }, transition: { type: 'string' }, duration: { type: 'string' }, music: { type: 'string' }, narrate: { type: 'boolean' }, provider: { type: 'string' }, voice: { type: 'string' }, language: { type: 'string' }, resolution: { type: 'string' }, title: { type: 'string' } },
    async run(inputs, o) {
      if (!inputs.length) throw new Error(COMMANDS.slideshow!.usage);
      const res = str(o.resolution) ? RESOLUTION_PRESETS[str(o.resolution)!] : undefined;
      const md = inputs.length === 1 && inputs[0]!.endsWith('.md') ? inputs[0] : undefined;
      const r = await createSlideshow({
        outDir: str(o.out) ?? 'slideshow', markdown: md, images: md ? undefined : inputs, theme: (str(o.theme) ?? 'midnight') as 'midnight', transition: str(o.transition),
        slideDuration: num(o.duration), music: str(o.music), width: res?.width, height: res?.height, title: str(o.title),
        narrate: o.narrate ? { provider: str(o.provider) as TtsProviderName | undefined, voice: str(o.voice), language: str(o.language) } : undefined,
      });
      console.log(`${green('✓')} ${r.slides} slides · ${r.duration.toFixed(1)}s → ${r.dir}${r.narration ? ` · narration ${r.narration}` : ''}\n  hfr render ${path.relative(process.cwd(), r.dir)}`);
    },
  },

  reverse: {
    summary: 'analyse a video (cuts, timing, palette, camera, audio) and scaffold a reconstruction',
    usage: 'hfr reverse <video> -o <dir> [--threshold 0.3] [--reference]',
    options: { out: { type: 'string', short: 'o' }, threshold: { type: 'string' }, reference: { type: 'boolean' } },
    async run([video], o) {
      const r = await reverseVideo(need(video, 'video'), { outDir: str(o.out) ?? 'reverse', threshold: num(o.threshold), referenceLayer: !!o.reference });
      for (const s of r.analysis.scenes) console.log(`  scene ${String(s.index).padStart(2)}  ${s.start.toFixed(2)}s  ${s.duration.toFixed(2)}s  ${s.camera.padEnd(10)} ${s.palette.slice(0, 3).map((p) => p.hex).join(' ')}`);
      console.log(`${green('✓')} ${r.analysis.scenes.length} scene(s), ${r.analysis.pacing} pacing → ${r.dir} (report.md, analysis.json, index.html)`);
    },
  },

  'style-sample': {
    summary: 'extract design tokens (palette, roles, typography) from an image, video or web page',
    usage: 'hfr style-sample <image|video|url|page.html> -o <dir>',
    options: { out: { type: 'string', short: 'o' } },
    async run([src], o) {
      const r = await sampleStyle(need(src, 'source'), { outDir: str(o.out) ?? 'style' });
      console.log(JSON.stringify(r.tokens.roles, null, 2));
      console.log(`${green('✓')} ${r.files.join(', ')} → ${str(o.out) ?? 'style'}`);
    },
  },

  capture: {
    summary: 'capture a web page and generate a scrolling "site tour" composition',
    usage: 'hfr capture <url> -o <dir> [--duration 10] [--width 1920 --height 1080]',
    options: { out: { type: 'string', short: 'o' }, duration: { type: 'string' }, width: { type: 'string' }, height: { type: 'string' } },
    async run([url], o) {
      const r = await captureWebsite(need(url, 'url'), { outDir: str(o.out) ?? 'capture', duration: num(o.duration), width: num(o.width), height: num(o.height) });
      console.log(`${green('✓')} "${r.title}" (${r.pageHeight}px tall) → ${r.dir}`);
    },
  },

  figma: {
    summary: 'import a Figma frame as a composition (Figma REST API or a saved JSON)',
    usage: 'hfr figma <figma-url | fileKey> --node <id> -o <dir>   |   hfr figma --from-json node.json -o <dir>',
    options: { out: { type: 'string', short: 'o' }, node: { type: 'string' }, 'from-json': { type: 'string' }, duration: { type: 'string' } },
    async run([ref], o) {
      const out = str(o.out) ?? 'figma';
      if (str(o['from-json'])) {
        const r = await convertFigmaJson(JSON.parse(await readFile(str(o['from-json'])!, 'utf8')), out, { duration: num(o.duration) });
        r.warnings.forEach((w) => console.log(yellow(`warning: ${w}`)));
        console.log(`${green('✓')} → ${r.dir}`);
        return;
      }
      const { fileKey, nodeId } = parseFigmaUrl(need(ref, 'figma url or file key'));
      const node = str(o.node) ?? nodeId;
      if (!node) throw new Error('--node <id> is required (or a URL with ?node-id=)');
      const r = await importFigma({ fileKey, nodeId: node, outDir: out, duration: num(o.duration) });
      r.warnings.forEach((w) => console.log(yellow(`warning: ${w}`)));
      console.log(`${green('✓')} → ${r.dir}`);
    },
  },

  remotion: {
    summary: 'convert a Remotion project to a HyperFrames composition (with a compatibility report)',
    usage: 'hfr remotion <src/index.ts|Root.tsx> -o <dir> [--composition id] [--public dir]',
    options: { out: { type: 'string', short: 'o' }, composition: { type: 'string' }, public: { type: 'string' } },
    async run([entry], o) {
      const r = await convertRemotion(need(entry, 'entry file'), { outDir: str(o.out) ?? 'remotion-converted', compositionId: str(o.composition), publicDir: str(o.public) });
      const count = (l: string) => r.notes.filter((n) => n.level === l).length;
      for (const n of r.notes.filter((x) => x.level !== 'converted')) console.log(`${n.level === 'unsupported' ? red('unsupported ') : yellow('approximated')} ${n.file}:${n.line} ${n.message}`);
      console.log(`${green('✓')} ${r.composition.id} ${r.composition.width}x${r.composition.height}@${r.composition.fps} → ${r.dir}  (${count('converted')} converted, ${count('approximated')} approximated, ${count('unsupported')} unsupported; see conversion-report.md)`);
    },
  },

  share: {
    summary: 'package a video as a static share page (+poster, captions, checksums, project zip)',
    usage: 'hfr share <video> -o <dir> [--title t] [--description d] [--captions file] [--project dir] [--public-url https://…]',
    options: { out: { type: 'string', short: 'o' }, title: { type: 'string' }, description: { type: 'string' }, captions: { type: 'string' }, project: { type: 'string' }, 'public-url': { type: 'string' } },
    async run([video], o) {
      const r = await createShareBundle({ video: need(video, 'video'), outDir: str(o.out) ?? 'share', title: str(o.title), description: str(o.description), captions: str(o.captions), project: str(o.project), publicUrl: str(o['public-url']) });
      console.log(`${green('✓')} ${r.files.join(', ')} → ${r.dir}`);
    },
  },

  transitions: {
    summary: 'list scene transitions (FFmpeg xfade) and clip presets',
    usage: 'hfr transitions',
    async run() {
      const { PRESETS } = await import('@hfr/core');
      console.log(`${bold('clip presets')} (data-enter / data-exit):\n  ${Object.keys(PRESETS).join(', ')}\n\n${bold('scene transitions')} (hyperframes.json scenes[].transition.type):\n  ${listSceneTransitions().join(', ')}`);
      const { GLSL_TRANSITIONS } = await import('@hfr/shader-transitions');
      console.log(`\n${bold('WebGL shaders')} (<canvas data-hf-shader>):\n  ${Object.keys(GLSL_TRANSITIONS).join(', ')}`);
    },
  },

  libs: {
    summary: 'list libraries and fonts served to compositions',
    usage: 'hfr libs',
    async run() {
      for (const [k, v] of Object.entries(vendorLibraries())) console.log(`  /__hf/lib/${k.padEnd(26)} ${dim(v.description)}`);
      console.log('  /__hf/lib/three/addons/…      ' + dim('three/examples/jsm'));
      console.log('  /__hf/lib/shader-transitions.js ' + dim('WebGL transitions'));
      for (const [k, v] of Object.entries(FONT_PACKAGES)) console.log(`  /__hf/fonts/${k}/index.css`.padEnd(40) + dim(`font-family: "${v.family}"`));
    },
  },
};

function need(v: string | undefined, what: string): string {
  if (!v) throw new Error(`missing ${what}`);
  return v;
}

function help(): void {
  console.log(`${bold('hfr')} ${VERSION} — HTML to video (HyperFrames-compatible)\n\n${bold('Usage:')} hfr <command> [options]\n`);
  for (const [name, cmd] of Object.entries(COMMANDS)) console.log(`  ${name.padEnd(14)} ${cmd.summary}`);
  console.log(`\nRun ${bold('hfr <command> --help')} for options.`);
}

export async function main(argv: string[]): Promise<number> {
  const [name, ...rest] = argv;
  if (!name || name === '--help' || name === '-h' || name === 'help') { help(); return 0; }
  if (name === '--version' || name === '-v') { console.log(VERSION); return 0; }
  const cmd = COMMANDS[name];
  if (!cmd) { console.error(`unknown command "${name}"\n`); help(); return 1; }
  if (rest.includes('--help') || rest.includes('-h')) { console.log(`${cmd.summary}\n\nusage: ${cmd.usage}`); return 0; }
  const { values, positionals } = parseArgs({ args: rest, options: cmd.options ?? {}, allowPositionals: true, strict: true });
  const code = await cmd.run(positionals, values as Opts);
  return code ?? 0;
}

export { startPreview };
