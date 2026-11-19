/** In-process render job queue with progress events (consumed over SSE). */
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { renderProject, type RenderOptions, type RenderProgress, type RenderResult } from '@hfr/producer';

export type JobStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

export interface RenderJob {
  id: string;
  projectId: string;
  status: JobStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  progress: RenderProgress | null;
  output: string; // project-relative
  options: Omit<RenderOptions, 'project' | 'output' | 'onProgress' | 'signal'>;
  result: Omit<RenderResult, 'probe'> | null;
  error: string | null;
}

export class JobQueue extends EventEmitter {
  private jobs = new Map<string, RenderJob>();
  private controllers = new Map<string, AbortController>();
  private queue: Array<{ job: RenderJob; projectDir: string; outputAbs: string }> = [];
  private running = 0;
  readonly concurrency: number;

  constructor(concurrency = 1) {
    super();
    this.concurrency = concurrency;
    this.setMaxListeners(100);
  }

  list(): RenderJob[] {
    return [...this.jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): RenderJob | undefined {
    return this.jobs.get(id);
  }

  enqueue(projectId: string, projectDir: string, outputRel: string, outputAbs: string, options: RenderJob['options']): RenderJob {
    const job: RenderJob = {
      id: randomUUID(), projectId, status: 'queued', createdAt: new Date().toISOString(), startedAt: null, finishedAt: null,
      progress: null, output: outputRel, options, result: null, error: null,
    };
    this.jobs.set(job.id, job);
    this.queue.push({ job, projectDir, outputAbs });
    this.emit('update', job);
    this.pump();
    return job;
  }

  cancel(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    if (job.status === 'queued') {
      this.queue = this.queue.filter((q) => q.job.id !== id);
      this.finish(job, 'cancelled', 'cancelled before start');
      return true;
    }
    const ctl = this.controllers.get(id);
    if (ctl && job.status === 'running') { ctl.abort(); return true; }
    return false;
  }

  private finish(job: RenderJob, status: JobStatus, error: string | null) {
    job.status = status;
    job.error = error;
    job.finishedAt = new Date().toISOString();
    this.emit('update', job);
  }

  private pump() {
    while (this.running < this.concurrency && this.queue.length) {
      const next = this.queue.shift()!;
      this.running++;
      void this.execute(next).finally(() => { this.running--; this.pump(); });
    }
  }

  private async execute({ job, projectDir, outputAbs }: { job: RenderJob; projectDir: string; outputAbs: string }) {
    const ctl = new AbortController();
    this.controllers.set(job.id, ctl);
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    this.emit('update', job);
    let last = 0;
    try {
      const r = await renderProject({
        ...job.options, project: projectDir, output: outputAbs, signal: ctl.signal,
        onProgress: (p) => {
          job.progress = p;
          const now = Date.now();
          if (now - last > 200 || p.phase !== 'frames') { last = now; this.emit('update', job); }
        },
      });
      const { probe: _probe, ...rest } = r;
      void _probe;
      job.result = rest;
      this.finish(job, 'done', null);
    } catch (e) {
      this.finish(job, ctl.signal.aborted ? 'cancelled' : 'failed', (e as Error).message);
    } finally {
      this.controllers.delete(job.id);
    }
  }
}
