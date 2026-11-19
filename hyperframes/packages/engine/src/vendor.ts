/**
 * Vendor libraries served at /__hf/lib/<name>. Resolved from the installed
 * npm packages (real upstream builds, never re-implemented).
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

/** Package root, even for packages whose "exports" hide package.json (e.g. three). */
export function pkgDir(name: string): string {
  let dir = path.dirname(require.resolve(name));
  while (dir !== path.dirname(dir)) {
    const pj = path.join(dir, 'package.json');
    if (existsSync(pj) && (JSON.parse(readFileSync(pj, 'utf8')) as { name?: string }).name === name) return dir;
    dir = path.dirname(dir);
  }
  throw new Error(`cannot locate package ${name}`);
}

export interface VendorLib { file: string; contentType: string; description: string }

export function vendorLibraries(): Record<string, VendorLib> {
  const js = 'text/javascript; charset=utf-8';
  const gsap = pkgDir('gsap');
  const three = pkgDir('three');
  return {
    'gsap.js': { file: path.join(gsap, 'dist/gsap.min.js'), contentType: js, description: 'GSAP core (UMD, window.gsap)' },
    'gsap/ScrollTrigger.js': { file: path.join(gsap, 'dist/ScrollTrigger.min.js'), contentType: js, description: 'GSAP ScrollTrigger' },
    'gsap/SplitText.js': { file: path.join(gsap, 'dist/SplitText.min.js'), contentType: js, description: 'GSAP SplitText' },
    'gsap/MotionPathPlugin.js': { file: path.join(gsap, 'dist/MotionPathPlugin.min.js'), contentType: js, description: 'GSAP MotionPathPlugin' },
    'gsap/CustomEase.js': { file: path.join(gsap, 'dist/CustomEase.min.js'), contentType: js, description: 'GSAP CustomEase' },
    'gsap/TextPlugin.js': { file: path.join(gsap, 'dist/TextPlugin.min.js'), contentType: js, description: 'GSAP TextPlugin' },
    'gsap/DrawSVGPlugin.js': { file: path.join(gsap, 'dist/DrawSVGPlugin.min.js'), contentType: js, description: 'GSAP DrawSVGPlugin' },
    'gsap/MorphSVGPlugin.js': { file: path.join(gsap, 'dist/MorphSVGPlugin.min.js'), contentType: js, description: 'GSAP MorphSVGPlugin' },
    'anime.js': { file: path.join(pkgDir('animejs'), 'dist/bundles/anime.umd.min.js'), contentType: js, description: 'Anime.js v4 (UMD, window.anime)' },
    'anime.esm.js': { file: path.join(pkgDir('animejs'), 'dist/bundles/anime.esm.min.js'), contentType: js, description: 'Anime.js v4 (ES module)' },
    'lottie.js': { file: path.join(pkgDir('lottie-web'), 'build/player/lottie.min.js'), contentType: js, description: 'lottie-web (window.lottie)' },
    'three.module.js': { file: path.join(three, 'build/three.module.min.js'), contentType: js, description: 'Three.js (ES module; use an importmap "three")' },
    'three.core.min.js': { file: path.join(three, 'build/three.core.min.js'), contentType: js, description: 'Three.js core chunk (imported by three.module.js)' },
  };
}

/** Three.js addons (examples/jsm) are served under /__hf/lib/three/addons/… */
export function threeAddonsDir(): string {
  return path.join(pkgDir('three'), 'examples/jsm');
}

export function threeVersion(): string {
  return (JSON.parse(readFileSync(path.join(pkgDir('three'), 'package.json'), 'utf8')) as { version: string }).version;
}

/** Open-licensed fonts (Fontsource, OFL) served at /__hf/fonts/<name>/index.css for deterministic typography. */
export const FONT_PACKAGES: Record<string, { pkg: string; family: string }> = {
  inter: { pkg: '@fontsource-variable/inter', family: 'Inter Variable' },
  'bebas-neue': { pkg: '@fontsource/bebas-neue', family: 'Bebas Neue' },
  'playfair-display': { pkg: '@fontsource-variable/playfair-display', family: 'Playfair Display Variable' },
  'jetbrains-mono': { pkg: '@fontsource-variable/jetbrains-mono', family: 'JetBrains Mono Variable' },
};

export function fontDir(name: string): string | null {
  const f = FONT_PACKAGES[name];
  if (!f) return null;
  const req = createRequire(import.meta.url);
  return path.dirname(req.resolve(`${f.pkg}/index.css`));
}
