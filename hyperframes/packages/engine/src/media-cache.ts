/** Disk cache for derived media (video frames, audio analysis) keyed by source mtime. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyzeAudio, extractFrames, probe, type AudioAnalysis } from '@hfr/media';

export class MediaCache {
  readonly dir: string;
  private inflight = new Map<string, Promise<unknown>>();

  constructor(dir: string) {
    this.dir = dir;
  }

  private async key(file: string, extra: string): Promise<string> {
    const st = await stat(file);
    return createHash('sha1').update(`${path.resolve(file)}|${st.size}|${st.mtimeMs}|${extra}`).digest('hex').slice(0, 20);
  }

  private once<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) return existing as Promise<T>;
    const p = fn().finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }

  /** Directory with frames 000000.jpg… for `file` sampled at `fps`. */
  async frames(file: string, fps: number, maxHeight = 2160): Promise<{ dir: string; count: number }> {
    const key = await this.key(file, `frames|${fps}|${maxHeight}`);
    const dir = path.join(this.dir, 'frames', key);
    const marker = path.join(dir, '.complete');
    return this.once(key, async () => {
      const done = await readFile(marker, 'utf8').catch(() => null);
      if (done !== null) return { dir, count: Number(done) };
      const tmp = `${dir}.tmp-${process.pid}-${Date.now()}`;
      await rm(tmp, { recursive: true, force: true });
      const info = await probe(file);
      const h = Math.min(maxHeight, info.video?.height ?? maxHeight);
      const count = await extractFrames(file, tmp, { fps, maxHeight: h, qscale: 2 });
      await writeFile(path.join(tmp, '.complete'), String(count));
      await rm(dir, { recursive: true, force: true });
      await mkdir(path.dirname(dir), { recursive: true });
      await rename(tmp, dir);
      return { dir, count };
    });
  }

  async frameFile(file: string, fps: number, index: number): Promise<string | null> {
    const { dir, count } = await this.frames(file, fps);
    if (count === 0) return null;
    const i = Math.max(0, Math.min(count - 1, Math.floor(index)));
    return path.join(dir, `${String(i).padStart(6, '0')}.jpg`);
  }

  async analysis(file: string, fps: number, bands: number): Promise<AudioAnalysis> {
    const key = await this.key(file, `analysis|${fps}|${bands}`);
    const out = path.join(this.dir, 'analysis', `${key}.json`);
    return this.once(key, async () => {
      const cached = await readFile(out, 'utf8').catch(() => null);
      if (cached) return JSON.parse(cached) as AudioAnalysis;
      const data = await analyzeAudio(file, { fps, bands });
      await mkdir(path.dirname(out), { recursive: true });
      await writeFile(out, JSON.stringify(data));
      return data;
    });
  }
}
