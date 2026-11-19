/** Process helpers for FFmpeg / FFprobe and other CLI tools. */
import { spawn, type ChildProcess } from 'node:child_process';
import { access, constants } from 'node:fs/promises';
import path from 'node:path';

export class CommandError extends Error {
  readonly code: number | null;
  readonly stderr: string;
  constructor(cmd: string, code: number | null, stderr: string) {
    const tail = stderr.trim().split('\n').slice(-12).join('\n');
    super(`${cmd} exited with code ${code}\n${tail}`);
    this.name = 'CommandError';
    this.code = code;
    this.stderr = stderr;
  }
}

export interface RunOptions {
  signal?: AbortSignal;
  input?: Buffer | string;
  onStderr?: (chunk: string) => void;
  cwd?: string;
  /** Keep stdout as Buffer (binary) instead of a string. */
  binary?: boolean;
  maxBuffer?: number;
  env?: NodeJS.ProcessEnv;
}

export interface RunResult<T = string> {
  stdout: T;
  stderr: string;
  code: number;
}

export function run(cmd: string, args: string[], opts: RunOptions & { binary: true }): Promise<RunResult<Buffer>>;
export function run(cmd: string, args: string[], opts?: RunOptions): Promise<RunResult<string>>;
export function run(cmd: string, args: string[], opts: RunOptions = {}): Promise<RunResult<string | Buffer>> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, signal: opts.signal, env: opts.env ?? process.env, stdio: ['pipe', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    let outLen = 0;
    let err = '';
    const max = opts.maxBuffer ?? 1024 * 1024 * 512;
    child.stdout.on('data', (d: Buffer) => {
      outLen += d.length;
      if (outLen > max) child.kill('SIGKILL');
      else out.push(d);
    });
    child.stderr.on('data', (d: Buffer) => {
      const s = d.toString();
      err += s;
      if (err.length > 2_000_000) err = err.slice(-1_000_000);
      opts.onStderr?.(s);
    });
    child.on('error', (e) => reject(e));
    child.on('close', (code) => {
      if (code !== 0) return reject(new CommandError(`${path.basename(cmd)} ${args.slice(0, 6).join(' ')}…`, code, err));
      const buf = Buffer.concat(out);
      resolve({ stdout: opts.binary ? buf : buf.toString(), stderr: err, code: 0 });
    });
    if (opts.input !== undefined) child.stdin.end(opts.input);
    else child.stdin.end();
  });
}

/** Spawns a long-running process whose stdin we write to (e.g. ffmpeg image2pipe). */
export function spawnPiped(cmd: string, args: string[], opts: { signal?: AbortSignal; onStderr?: (s: string) => void } = {}): {
  child: ChildProcess;
  write: (chunk: Buffer) => Promise<void>;
  end: () => Promise<void>;
} {
  const child = spawn(cmd, args, { stdio: ['pipe', 'ignore', 'pipe'], signal: opts.signal });
  let stderr = '';
  child.stderr!.on('data', (d: Buffer) => {
    const s = d.toString();
    stderr += s;
    if (stderr.length > 1_000_000) stderr = stderr.slice(-500_000);
    opts.onStderr?.(s);
  });
  const closed = new Promise<void>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new CommandError(`${path.basename(cmd)}`, code, stderr))));
  });
  closed.catch(() => {});
  const write = (chunk: Buffer) =>
    new Promise<void>((resolve, reject) => {
      if (!child.stdin || child.stdin.destroyed) return reject(new Error(`${cmd} stdin closed\n${stderr.slice(-2000)}`));
      child.stdin.write(chunk, (e) => (e ? reject(e) : resolve()));
    });
  const end = async () => {
    child.stdin?.end();
    await closed;
  };
  return { child, write, end };
}

const whichCache = new Map<string, string | null>();

/** Locates an executable on PATH (or returns null). */
export async function which(bin: string): Promise<string | null> {
  if (whichCache.has(bin)) return whichCache.get(bin)!;
  let found: string | null = null;
  if (bin.includes('/')) {
    found = await access(bin, constants.X_OK).then(() => bin, () => null);
  } else {
    for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
      const p = path.join(dir, bin);
      if (await access(p, constants.X_OK).then(() => true, () => false)) { found = p; break; }
    }
  }
  whichCache.set(bin, found);
  return found;
}

export const FFMPEG = process.env.HFR_FFMPEG ?? 'ffmpeg';
export const FFPROBE = process.env.HFR_FFPROBE ?? 'ffprobe';

export async function requireFfmpeg(): Promise<void> {
  if (!(await which(FFMPEG))) throw new Error('FFmpeg not found on PATH (set HFR_FFMPEG to its location). Install: https://ffmpeg.org/download.html');
  if (!(await which(FFPROBE))) throw new Error('FFprobe not found on PATH (set HFR_FFPROBE).');
}

export function ffmpeg(args: string[], opts: RunOptions & { binary: true }): Promise<RunResult<Buffer>>;
export function ffmpeg(args: string[], opts?: RunOptions): Promise<RunResult<string>>;
export function ffmpeg(args: string[], opts: RunOptions = {}): Promise<RunResult<string | Buffer>> {
  return run(FFMPEG, ['-hide_banner', '-nostdin', '-y', ...args], opts as RunOptions & { binary: true });
}
