/** `hfr preview`: serves a project with the runtime in preview mode, a player page and live reload. */
import { watch } from 'node:fs';
import http, { type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { loadProject } from '@hfr/core';
import { createCompositionHandler } from '@hfr/engine';
import { bundlePlayer, playerPage } from '@hfr/player';

export async function startPreview(o: { project: string; port?: number; host?: string; scene?: number; log?: (s: string) => void }): Promise<{ url: string; close: () => Promise<void> }> {
  const project = await loadProject(o.project);
  const scene = project.scenes[o.scene ?? 0];
  if (!scene) throw new Error(`scene ${o.scene} does not exist (project has ${project.scenes.length})`);
  const handler = createCompositionHandler({ root: project.root, mode: 'preview', base: '/project/', log: o.log });
  const clients = new Set<ServerResponse>();
  let timer: NodeJS.Timeout | null = null;
  const watcher = watch(project.root, { recursive: true }, (_e, file) => {
    if (!file || /(^|[\\/])(\.hfr-cache|renders|node_modules|\.git)([\\/]|$)/.test(String(file))) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { for (const c of clients) c.write(`event: change\ndata: ${JSON.stringify(String(file))}\n\n`); }, 120);
  });
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      if (url.pathname === '/') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(playerPage({ title: `${project.manifest.name} — ${scene.relative}`, src: `/project/${scene.relative}`, playerUrl: '/__hfr/player.js', liveReloadUrl: '/__hfr/events' }));
        return;
      }
      if (url.pathname === '/__hfr/player.js') {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
        res.end(await bundlePlayer());
        return;
      }
      if (url.pathname === '/__hfr/events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        res.write(': connected\n\n');
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
      }
      // the composition references /__hf/… absolute URLs: rewrite to the mounted handler
      const pathname = url.pathname.startsWith('/__hf/') ? `/project${url.pathname}` : url.pathname;
      if (!(await handler(req, res, pathname))) { res.writeHead(404); res.end('not found'); }
    } catch (e) {
      res.writeHead(500); res.end(String(e));
    }
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(o.port ?? 4321, o.host ?? '127.0.0.1', resolve); });
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://${o.host && o.host !== '0.0.0.0' ? o.host : '127.0.0.1'}:${port}/`,
    close: async () => { watcher.close(); for (const c of clients) c.end(); server.closeAllConnections(); await new Promise((r) => server.close(r)); },
  };
}

export const projectRelative = (root: string, f: string) => path.relative(root, f).split(path.sep).join('/');
