// Palco: renderizador WebGL (Three.js + bloom) e compositor 2D 1080x1920.
// Todo o vídeo final (3D + legendas + overlays) é desenhado num único canvas,
// o que permite gravar exatamente o que se vê.
import * as THREE from 'three';
import { EffectComposer } from '../../vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../../vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../../vendor/jsm/postprocessing/OutputPass.js';

export const W = 1080, H = 1920;

export class Stage {
  constructor(outCanvas, { quality = 0.75, bloom = true } = {}) {
    this.out = outCanvas;
    this.out.width = W; this.out.height = H;
    this.g = outCanvas.getContext('2d');
    this.quality = quality;
    this.glCanvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.glCanvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 2000);
    this.bloomOn = bloom;
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(new THREE.Scene(), this.camera);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.5, 0.82);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.setQuality(quality);
    this.grain = makeGrain();
  }

  setQuality(q) {
    this.quality = q;
    const w = Math.round(W * q), h = Math.round(H * q);
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.rw = w; this.rh = h;
  }

  render(world) {
    const b = world.bloom || { strength: 0.6, radius: 0.5, threshold: 0.82 };
    this.renderer.toneMappingExposure = world.exposure ?? 1;
    if (this.bloomOn) {
      this.bloom.strength = b.strength; this.bloom.radius = b.radius; this.bloom.threshold = b.threshold;
      this.renderPass.scene = world.scene;
      this.composer.render();
    } else {
      this.renderer.setRenderTarget(null);
      this.renderer.render(world.scene, this.camera);
    }
  }

  // Desenha o quadro 3D no canvas final, com zoom/deslocamento 2D opcional
  blit({ zoom = 1, ox = 0, oy = 0, rot = 0, whip = 0 } = {}) {
    const g = this.g;
    g.save();
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.translate(W / 2 + ox, H / 2 + oy);
    if (rot) g.rotate(rot);
    g.scale(zoom, zoom);
    if (whip > 0.01) {
      // borrão direcional simulado (vários desenhos deslocados)
      const n = 6;
      for (let i = 0; i < n; i++) {
        g.globalAlpha = i === 0 ? 1 : 0.35;
        g.drawImage(this.glCanvas, -W / 2 + (i - n / 2) * whip * 28, -H / 2, W, H);
      }
      g.globalAlpha = 1;
    } else {
      g.drawImage(this.glCanvas, -W / 2, -H / 2, W, H);
    }
    g.restore();
  }

  post({ vignette = 0.55, grain = 0.06, tint = null, t = 0 } = {}) {
    const g = this.g;
    if (tint) { g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = tint; g.fillRect(0, 0, W, H); g.restore(); }
    if (vignette > 0) {
      const grd = g.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.62);
      grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, `rgba(0,0,0,${vignette})`);
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
    }
    if (grain > 0) {
      g.save();
      g.globalAlpha = grain;
      g.globalCompositeOperation = 'overlay';
      const k = Math.floor(t * 24) % 8;
      const ox = (k * 137) % 256, oy = (k * 71) % 256;
      g.translate(-ox, -oy);
      g.fillStyle = this.grain; g.fillRect(0, 0, W + 256, H + 256);
      g.restore();
    }
  }
}

function makeGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); const img = g.createImageData(256, 256);
  let s = 3;
  for (let i = 0; i < img.data.length; i += 4) {
    const v = ((s = (s * 1664525 + 1013904223) >>> 0) >>> 24);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return g.createPattern(c, 'repeat');
}

// ---------- utilitários de câmera ----------
export const ease = {
  linear: k => k,
  inOut: k => k * k * (3 - 2 * k),
  inOut5: k => k * k * k * (k * (k * 6 - 15) + 10),
  out: k => 1 - Math.pow(1 - k, 3),
  in: k => k * k * k,
};
export const clamp01 = x => Math.max(0, Math.min(1, x));
export const smooth = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

const _v = new THREE.Vector3(), _l = new THREE.Vector3();
// keys: [{u, pos:[x,y,z], look:[x,y,z], fov}]
export function cameraPath(cam, keys, u, e = ease.inOut5) {
  u = clamp01(u);
  let i = 0;
  while (i < keys.length - 2 && u > keys[i + 1].u) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b.u === a.u ? 1 : e(clamp01((u - a.u) / (b.u - a.u)));
  _v.fromArray(a.pos).lerp(_l.fromArray(b.pos), k);
  cam.position.copy(_v);
  _v.fromArray(a.look).lerp(_l.fromArray(b.look), k);
  cam.lookAt(_v);
  const fa = a.fov ?? 50, fb = b.fov ?? fa;
  const fov = fa + (fb - fa) * k;
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  if (a.roll != null || b.roll != null) cam.rotateZ((a.roll || 0) + ((b.roll || 0) - (a.roll || 0)) * k);
}

// Tremor de câmera determinístico (função do tempo)
export function shake(cam, amount, t) {
  if (amount <= 0.0001) return;
  const n = (f, p) => Math.sin(t * f + p) * 0.5 + Math.sin(t * f * 2.3 + p * 1.7) * 0.3 + Math.sin(t * f * 5.1 + p * 0.3) * 0.2;
  cam.position.x += n(23, 1) * amount;
  cam.position.y += n(29, 2) * amount;
  cam.rotateZ(n(17, 3) * amount * 0.05);
}
