/** Headless Chromium control (Playwright) and frame capture via the DevTools protocol. */
import { chromium, type Browser, type BrowserContext, type CDPSession, type Page } from 'playwright-core';

export interface LaunchOptions {
  /** Chromium/Chrome binary (defaults: HFR_CHROMIUM_PATH, then Playwright's managed browser). */
  executablePath?: string;
  headless?: boolean;
  args?: string[];
}

export const CHROMIUM_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--autoplay-policy=no-user-gesture-required',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--hide-scrollbars',
  '--mute-audio',
  '--font-render-hinting=none',
  '--force-color-profile=srgb',
  '--disable-lcd-text',
];

export async function launchBrowser(o: LaunchOptions = {}): Promise<Browser> {
  const executablePath = o.executablePath ?? process.env.HFR_CHROMIUM_PATH ?? undefined;
  try {
    return await chromium.launch({ headless: o.headless ?? true, executablePath, args: [...CHROMIUM_ARGS, ...(o.args ?? [])] });
  } catch (e) {
    const msg = (e as Error).message;
    throw new Error(`Could not launch Chromium. Install it with "npx playwright install chromium" or set HFR_CHROMIUM_PATH.\n${msg.split('\n').slice(0, 4).join('\n')}`);
  }
}

export interface PageLog { type: 'console' | 'pageerror' | 'requestfailed' | 'http-error'; level?: string; text: string; url?: string }

export interface RuntimeDescription {
  version: string;
  mode: string;
  ready: boolean;
  config: { id: string | null; width: number; height: number; fps: number; duration: number; declaredDuration: number | null; background: string | null };
  frames: number;
  clips: Array<{
    id: string; kind: string; name: string | null; tag: string; start: number; end: number; duration: number; track: number;
    src: string | null; mediaStart: number; mediaDuration: number | null; volume: number; muted: boolean; loop: boolean;
    fadeIn: number; fadeOut: number; hasEffects: boolean;
  }>;
  adapters: Array<{ type: string; offset: number; duration: number | null }>;
  libraries: Record<string, boolean>;
  errors: string[];
  warnings: string[];
}

export interface OpenedComposition {
  context: BrowserContext;
  page: Page;
  cdp: CDPSession;
  description: RuntimeDescription;
  logs: PageLog[];
  close(): Promise<void>;
}

export interface OpenOptions {
  width: number;
  height: number;
  /** Device scale factor (2 = render a 1080p layout at 4K). */
  scale?: number;
  timeoutMs?: number;
}

// The runtime API as seen from page.evaluate() callbacks.
interface HfApi { isReady: boolean; seek(t: number): Promise<void>; describe(): RuntimeDescription }

export async function openComposition(browser: Browser, url: string, o: OpenOptions): Promise<OpenedComposition> {
  const context = await browser.newContext({
    viewport: { width: o.width, height: o.height },
    deviceScaleFactor: o.scale ?? 1,
    reducedMotion: 'no-preference',
    colorScheme: 'light',
  });
  const page = await context.newPage();
  const logs: PageLog[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push({ type: 'console', level: m.type(), text: m.text() });
  });
  page.on('pageerror', (e) => logs.push({ type: 'pageerror', text: e.stack || e.message || String(e) }));
  page.on('requestfailed', (r) => {
    const err = r.failure()?.errorText ?? 'failed';
    // Media elements routinely abort their own range requests (e.g. when paused/muted): not an error.
    if (err === 'net::ERR_ABORTED' && ['media', 'image'].includes(r.resourceType())) return;
    logs.push({ type: 'requestfailed', text: err, url: r.url() });
  });
  page.on('response', (r) => {
    if (r.status() >= 400) logs.push({ type: 'http-error', text: `HTTP ${r.status()}`, url: r.url() });
  });
  const timeout = o.timeoutMs ?? 60_000;
  await page.goto(url, { waitUntil: 'load', timeout });
  try {
    await page.waitForFunction(() => (window as unknown as { __hf?: HfApi }).__hf?.isReady === true, undefined, { timeout, polling: 50 });
  } catch {
    const hasRuntime = await page.evaluate(() => typeof (window as unknown as { __hf?: HfApi }).__hf !== 'undefined');
    throw new Error(`composition did not become ready within ${timeout} ms (runtime ${hasRuntime ? 'loaded' : 'missing'}).\n${logs.map((l) => `${l.type}: ${l.text} ${l.url ?? ''}`).join('\n')}`);
  }
  const description = await page.evaluate(() => (window as unknown as { __hf: HfApi }).__hf.describe());
  const cdp = await context.newCDPSession(page);
  return {
    context, page, cdp, description, logs,
    close: async () => { await context.close().catch(() => {}); },
  };
}

export interface CaptureOptions {
  format: 'jpeg' | 'png';
  /** JPEG quality 0-100 */
  quality?: number;
  width: number;
  height: number;
}

/** Seeks the composition to `time` and captures the viewport. */
export async function captureFrame(comp: OpenedComposition, time: number, o: CaptureOptions): Promise<Buffer> {
  await comp.page.evaluate((t) => (window as unknown as { __hf: HfApi }).__hf.seek(t), time);
  const res = (await comp.cdp.send('Page.captureScreenshot', {
    format: o.format,
    quality: o.format === 'jpeg' ? o.quality ?? 92 : undefined,
    clip: { x: 0, y: 0, width: o.width, height: o.height, scale: 1 },
    captureBeyondViewport: false,
    optimizeForSpeed: o.format === 'jpeg',
  })) as { data: string };
  return Buffer.from(res.data, 'base64');
}
