/** Builds the browser runtime with esbuild (cached per process). */
import { fileURLToPath } from 'node:url';

export const RUNTIME_ENTRY = fileURLToPath(new URL('./runtime/index.ts', import.meta.url));

let cached: Promise<string> | null = null;

export function bundleRuntime(opts: { minify?: boolean; force?: boolean } = {}): Promise<string> {
  if (cached && !opts.force) return cached;
  cached = (async () => {
    const esbuild = await import('esbuild');
    const result = await esbuild.build({
      entryPoints: [RUNTIME_ENTRY],
      bundle: true,
      write: false,
      format: 'iife',
      target: ['chrome110'],
      minify: opts.minify ?? true,
      sourcemap: false,
      legalComments: 'none',
      banner: { js: '/* hfr runtime */' },
    });
    return result.outputFiles[0]!.text;
  })();
  cached.catch(() => { cached = null; });
  return cached;
}
