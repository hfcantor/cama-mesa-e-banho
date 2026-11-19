/**
 * Project loading (Node only). A project is a directory with either
 *  - hyperframes.json (manifest: single entry or multiple scenes), or
 *  - index.html (single composition).
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseComposition } from './composition.ts';
import type { CompositionInfo, ProjectManifest, SceneDef } from './types.ts';

export const MANIFEST_FILE = 'hyperframes.json';

export interface LoadedScene {
  def: SceneDef;
  file: string; // absolute
  relative: string; // relative to project root (POSIX)
  composition: CompositionInfo;
}

export interface LoadedProject {
  root: string;
  manifest: ProjectManifest;
  hasManifest: boolean;
  scenes: LoadedScene[];
}

export class ProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectError';
  }
}

/** Resolves `rel` inside `root`, refusing anything that escapes it. */
export function safeJoin(root: string, rel: string): string {
  const decoded = rel.replace(/\\/g, '/');
  if (decoded.includes('\0')) throw new ProjectError(`invalid path "${rel}"`);
  const abs = path.resolve(root, '.' + path.posix.sep + decoded.replace(/^\/+/, ''));
  const rootAbs = path.resolve(root);
  if (abs !== rootAbs && !abs.startsWith(rootAbs + path.sep)) {
    throw new ProjectError(`path "${rel}" escapes the project directory`);
  }
  return abs;
}

export function validateManifest(data: unknown): ProjectManifest {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new ProjectError('hyperframes.json must be an object');
  const m = data as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof m.name !== 'string' || !m.name) errors.push('"name" is required');
  for (const k of ['width', 'height', 'fps'] as const) {
    if (m[k] !== undefined && (typeof m[k] !== 'number' || !(Number(m[k]) > 0))) errors.push(`"${k}" must be a positive number`);
  }
  if (m.entry !== undefined && typeof m.entry !== 'string') errors.push('"entry" must be a string');
  if (m.scenes !== undefined) {
    if (!Array.isArray(m.scenes) || m.scenes.length === 0) errors.push('"scenes" must be a non-empty array');
    else m.scenes.forEach((s: unknown, i: number) => {
      const sc = s as Record<string, unknown>;
      if (typeof sc?.src !== 'string') errors.push(`scenes[${i}].src must be a string`);
      if (sc?.transition !== undefined) {
        const tr = sc.transition as Record<string, unknown>;
        if (typeof tr?.type !== 'string' || typeof tr?.duration !== 'number' || tr.duration <= 0) {
          errors.push(`scenes[${i}].transition needs {type: string, duration: number > 0}`);
        }
        if (i === 0) errors.push('scenes[0] cannot have a transition (it applies between a scene and the previous one)');
      }
    });
  }
  if (m.entry !== undefined && m.scenes !== undefined) errors.push('use either "entry" or "scenes", not both');
  if (m.audio !== undefined && !Array.isArray(m.audio)) errors.push('"audio" must be an array');
  else if (Array.isArray(m.audio)) m.audio.forEach((a: unknown, i: number) => {
    if (typeof (a as Record<string, unknown>)?.src !== 'string') errors.push(`audio[${i}].src must be a string`);
  });
  if (errors.length) throw new ProjectError(`invalid ${MANIFEST_FILE}: ${errors.join('; ')}`);
  return m as unknown as ProjectManifest;
}

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true; } catch { return false; }
}

export async function loadProject(dirOrFile: string): Promise<LoadedProject> {
  const abs = path.resolve(dirOrFile);
  const st = await stat(abs).catch(() => null);
  if (!st) throw new ProjectError(`not found: ${dirOrFile}`);
  let root = abs;
  let manifest: ProjectManifest;
  let hasManifest = false;
  if (st.isFile()) {
    root = path.dirname(abs);
    manifest = { name: path.basename(abs, path.extname(abs)), entry: path.basename(abs) };
  } else if (await exists(path.join(abs, MANIFEST_FILE))) {
    const raw = await readFile(path.join(abs, MANIFEST_FILE), 'utf8');
    let data: unknown;
    try { data = JSON.parse(raw); } catch (e) { throw new ProjectError(`${MANIFEST_FILE} is not valid JSON: ${(e as Error).message}`); }
    manifest = validateManifest(data);
    hasManifest = true;
  } else if (await exists(path.join(abs, 'index.html'))) {
    manifest = { name: path.basename(abs), entry: 'index.html' };
  } else {
    throw new ProjectError(`no ${MANIFEST_FILE} or index.html in ${dirOrFile}`);
  }
  const defs: SceneDef[] = manifest.scenes ?? [{ src: manifest.entry ?? 'index.html' }];
  const scenes: LoadedScene[] = [];
  for (const def of defs) {
    const file = safeJoin(root, def.src);
    const html = await readFile(file, 'utf8').catch(() => {
      throw new ProjectError(`scene file not found: ${def.src}`);
    });
    const composition = parseComposition(html, file);
    // Manifest-level overrides of the composition size/fps.
    if (manifest.width) composition.config.width = manifest.width;
    if (manifest.height) composition.config.height = manifest.height;
    if (manifest.fps) composition.config.fps = manifest.fps;
    scenes.push({ def, file, relative: path.relative(root, file).split(path.sep).join('/'), composition });
  }
  return { root, manifest, hasManifest, scenes };
}

/** Start time of each scene and total duration once transitions overlap scenes. */
export function sceneOffsets(durations: number[], transitions: Array<number | undefined>): { offsets: number[]; total: number } {
  const offsets: number[] = [];
  let t = 0;
  durations.forEach((d, i) => {
    const overlap = i > 0 ? (transitions[i] ?? 0) : 0;
    t -= overlap;
    offsets.push(t);
    t += d;
  });
  return { offsets, total: t };
}
