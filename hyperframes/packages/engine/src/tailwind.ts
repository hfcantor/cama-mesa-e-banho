/**
 * Tailwind CSS v4 compilation for compositions (server side, deterministic).
 * A composition opts in with  <style data-hf-tailwind> @import "tailwindcss"; … </style>
 * (or type="text/tailwindcss"). Candidates are scanned from the HTML with the
 * official Oxide scanner and compiled with @tailwindcss/node.
 */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const twDir = path.dirname(require.resolve('tailwindcss/package.json'));

const CSS_ENTRIES: Record<string, string> = {
  tailwindcss: 'index.css',
  'tailwindcss/index.css': 'index.css',
  'tailwindcss/theme': 'theme.css',
  'tailwindcss/theme.css': 'theme.css',
  'tailwindcss/preflight': 'preflight.css',
  'tailwindcss/preflight.css': 'preflight.css',
  'tailwindcss/utilities': 'utilities.css',
  'tailwindcss/utilities.css': 'utilities.css',
};

const cache = new Map<string, string>();

export async function compileTailwind(css: string, content: string[], base: string): Promise<string> {
  const key = createHash('sha1').update(css).update('\0').update(content.join('\0')).update(base).digest('hex');
  const hit = cache.get(key);
  if (hit) return hit;
  const { compile } = await import('@tailwindcss/node');
  const { Scanner } = await import('@tailwindcss/oxide');
  const compiler = await compile(css, {
    base,
    onDependency: () => {},
    customCssResolver: async (id: string) => (CSS_ENTRIES[id] ? path.join(twDir, CSS_ENTRIES[id]) : undefined),
  });
  const scanner = new Scanner({ sources: [] });
  const candidates = scanner.scanFiles(content.map((c) => ({ content: c, extension: 'html' })));
  const out = compiler.build(candidates);
  if (cache.size > 200) cache.clear();
  cache.set(key, out);
  return out;
}

export const TAILWIND_STYLE_RE = /<style\b([^>]*\b(?:data-hf-tailwind|type\s*=\s*["']text\/tailwindcss["'])[^>]*)>([\s\S]*?)<\/style>/gi;

/** Replaces every Tailwind <style> block in an HTML document with compiled CSS. */
export async function applyTailwind(html: string, base: string, extraContent: string[] = []): Promise<string> {
  const blocks = [...html.matchAll(TAILWIND_STYLE_RE)];
  if (!blocks.length) return html;
  let out = '';
  let last = 0;
  for (const m of blocks) {
    const source = m[2]!.includes('@import') ? m[2]! : `@import "tailwindcss";\n${m[2]!}`;
    const compiled = await compileTailwind(source, [html, ...extraContent], base);
    out += html.slice(last, m.index) + `<style data-hf-tailwind-compiled>${compiled}</style>`;
    last = m.index! + m[0].length;
  }
  return out + html.slice(last);
}
