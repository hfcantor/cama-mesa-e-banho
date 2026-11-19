/**
 * Website capture: loads a page in headless Chromium, takes full-page and
 * viewport screenshots and generates a "site tour" composition that scrolls
 * through the page with a camera move (deterministic: the scroll is a
 * keyframed transform over a still capture, not a live page).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { launchBrowser } from '@hfr/engine';
import type { ProjectManifest } from '@hfr/core';
import { escapeAttr, escapeHtml, htmlDocument } from './util.ts';

export interface CaptureOptions {
  outDir: string;
  viewport?: { width: number; height: number };
  /** Composition size (defaults to the viewport). */
  width?: number;
  height?: number;
  duration?: number;
  maxPageHeight?: number;
  waitMs?: number;
  title?: string;
}

export interface CaptureResult {
  dir: string;
  title: string;
  pageHeight: number;
  files: { fullPage: string; viewport: string; meta: string };
}

export async function captureWebsite(url: string, o: CaptureOptions): Promise<CaptureResult> {
  if (!/^(https?|file):\/\//.test(url)) throw new Error('url must start with http://, https:// or file://');
  const dir = path.resolve(o.outDir);
  await mkdir(path.join(dir, 'assets'), { recursive: true });
  const vp = o.viewport ?? { width: 1440, height: 900 };
  const browser = await launchBrowser();
  let title = '';
  let pageHeight = vp.height;
  let meta: Record<string, string | null> = {};
  try {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    // trigger lazy-loaded content by scrolling once through the page
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.8) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(o.waitMs ?? 500);
    title = await page.title();
    meta = await page.evaluate(() => ({
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
      themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null,
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null,
      lang: document.documentElement.lang || null,
    }));
    pageHeight = Math.min(o.maxPageHeight ?? 12000, await page.evaluate(() => document.documentElement.scrollHeight));
    await page.screenshot({ path: path.join(dir, 'assets', 'viewport.png') });
    await page.setViewportSize({ width: vp.width, height: pageHeight });
    await page.screenshot({ path: path.join(dir, 'assets', 'fullpage.png'), clip: { x: 0, y: 0, width: vp.width, height: pageHeight } });
  } finally {
    await browser.close();
  }
  const W = o.width ?? vp.width, H = o.height ?? vp.height;
  const duration = o.duration ?? Math.min(20, Math.max(6, pageHeight / 900 * 2.2));
  // scale page so its width fills the frame inside a browser chrome card (85% of width)
  const cardW = Math.round(W * 0.84), scale = cardW / vp.width;
  const cardH = Math.round(H * 0.78);
  const scrollPx = Math.max(0, Math.round(pageHeight * scale - (cardH - 56)));
  const kf = JSON.stringify([{ t: 0, y: 0 }, { t: 1.2, y: 0 }, { t: duration - 1.2, y: -scrollPx, ease: 'in-out-sine' }]);
  const shownTitle = o.title ?? title ?? url;
  const html = htmlDocument({
    title: shownTitle, width: W, height: H, fps: 30, duration, background: '#0b1020',
    head: `  <style>
    .bg{position:absolute;inset:0;background:radial-gradient(70% 80% at 20% 0%,#312e81,transparent),radial-gradient(60% 60% at 100% 100%,#0e7490,transparent),#0b1020}
    .card{position:absolute;left:${(W - cardW) / 2}px;top:${Math.round(H * 0.14)}px;width:${cardW}px;height:${cardH}px;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 40px 120px rgba(0,0,0,.55)}
    .chrome{height:56px;background:#e5e7eb;display:flex;align-items:center;gap:10px;padding:0 18px;font:500 20px 'Inter Variable',system-ui;color:#374151}
    .chrome i{width:14px;height:14px;border-radius:50%;background:#f87171;display:inline-block}.chrome i:nth-child(2){background:#fbbf24}.chrome i:nth-child(3){background:#34d399}
    .chrome span{margin-left:16px;flex:1;background:#fff;border-radius:999px;padding:6px 16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .viewport{position:absolute;top:56px;left:0;right:0;bottom:0;overflow:hidden}
    .page{width:${cardW}px;display:block}
    .label{position:absolute;left:${(W - cardW) / 2}px;top:${Math.round(H * 0.04)}px;color:#fff;font:800 ${Math.round(H / 20)}px 'Inter Variable',system-ui;max-width:${cardW}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  </style>`,
    body: `    <div class="bg"></div>
    <div class="label" data-start="0.2" data-enter="fade-down 0.6">${escapeHtml(shownTitle)}</div>
    <div class="card" data-start="0" data-enter="fade-up 0.8 out-expo">
      <div class="chrome"><i></i><i></i><i></i><span>${escapeHtml(url)}</span></div>
      <div class="viewport"><img class="page" src="assets/fullpage.png" alt="" data-start="0" data-keyframes='${escapeAttr(kf).replace(/&quot;/g, '"')}'></div>
    </div>`,
  });
  await writeFile(path.join(dir, 'index.html'), html);
  const manifest: ProjectManifest = { name: shownTitle.slice(0, 60) || 'site-tour', entry: 'index.html', output: { file: 'renders/site-tour.mp4' } };
  await writeFile(path.join(dir, 'hyperframes.json'), JSON.stringify(manifest, null, 2) + '\n');
  const metaFile = path.join(dir, 'capture.json');
  await writeFile(metaFile, JSON.stringify({ url, title, pageHeight, viewport: vp, capturedAt: new Date().toISOString(), ...meta }, null, 2));
  return { dir, title, pageHeight, files: { fullPage: 'assets/fullpage.png', viewport: 'assets/viewport.png', meta: 'capture.json' } };
}
