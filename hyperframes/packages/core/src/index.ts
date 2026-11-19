/**
 * @hfr/core — composition model, timing, effects, captions and project loading.
 * The browser runtime lives in ./runtime and is bundled by `bundleRuntime()`.
 */
export * from './types.ts';
export * from './timing.ts';
export * from './easing.ts';
export * from './effects.ts';
export * from './captions.ts';
export * from './particles.ts';
export * from './random.ts';
export * from './composition.ts';
export * from './project.ts';
export { parseHtml, walk, attr, hasAttr, textContent, offsetToLineCol, escapeAttr, escapeHtml } from './html.ts';
export { bundleRuntime, RUNTIME_ENTRY } from './bundle.ts';
