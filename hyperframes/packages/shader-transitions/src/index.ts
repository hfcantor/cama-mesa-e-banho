/** @hfr/shader-transitions */
import { fileURLToPath } from 'node:url';

export { GLSL_TRANSITIONS, VERTEX_SHADER, fragmentShader } from './glsl.ts';
export { XFADE_BUILTIN, XFADE_CUSTOM, listSceneTransitions, xfadeOptions } from './xfade.ts';

let cached: Promise<string> | null = null;

/** Bundles the browser build (window.HFShaderTransitions + data-hf-shader auto binding). */
export function bundleShaderTransitions(): Promise<string> {
  if (cached) return cached;
  cached = (async () => {
    const esbuild = await import('esbuild');
    const r = await esbuild.build({
      entryPoints: [fileURLToPath(new URL('./browser.ts', import.meta.url))],
      bundle: true, write: false, format: 'iife', minify: true, target: ['chrome110'],
    });
    return r.outputFiles[0]!.text;
  })();
  cached.catch(() => { cached = null; });
  return cached;
}
