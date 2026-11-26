// Tecidos que sujam: cada tipo (lençol, toalha, tapete, cortina, pano de prato…)
// é pintado num canvas; a sujeira (manchas, pele morta, mofo) é a mesma para
// todos e depende só de `dirt` e `mold` (0..1), com sementes fixas → determinístico.
import * as THREE from 'three';
import { rng } from './textures.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const mixC = (a, b, k) => { const ca = new THREE.Color(a), cb = new THREE.Color(b); return '#' + ca.lerp(cb, k).getHexString(); };

export function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ------------------------------ bases por tipo ------------------------------
const BASES = {
  linen(g, W, H, d, o) { // lençol / fronha
    g.fillStyle = mixC(o.color || '#f6f3ec', '#cdb277', d * 0.85); g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.07; g.fillStyle = '#7a6a50';
    for (let i = 0; i < W; i += 6) g.fillRect(i, 0, 1, H);
    for (let i = 0; i < H; i += 6) g.fillRect(0, i, W, 1);
    g.globalAlpha = 1;
  },
  terry(g, W, H, d, o) { // toalha felpuda com listras
    g.fillStyle = mixC(o.color || '#3f8fd0', '#8a7a50', d * 0.55); g.fillRect(0, 0, W, H);
    const r = rng(3);
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(0, H * 0.12, W, H * 0.05); g.fillRect(0, H * 0.83, W, H * 0.05);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.1})`; g.fillRect(r() * W, r() * H, 2, 2); }
  },
  rug(g, W, H, d, o) { // tapete de banheiro
    g.fillStyle = mixC(o.color || '#8fb7c9', '#6b5a3a', d * 0.5); g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = Math.max(6, W * 0.025); g.strokeRect(W * 0.06, H * 0.08, W * 0.88, H * 0.84);
    const r = rng(5);
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(255,255,255,${0.06 + r() * 0.12})`; g.beginPath(); g.arc(r() * W, r() * H, 1 + r() * 2.5, 0, 7); g.fill(); }
  },
  curtain(g, W, H, d, o) { // cortina de box: translúcida, com dobras verticais
    g.fillStyle = mixC(o.color || '#dcecf2', '#bfae7a', d * 0.7); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 10; i++) { const x = (i + 0.5) * W / 10; const gr = g.createLinearGradient(x - W / 20, 0, x + W / 20, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - W / 20, 0, W / 10, H); }
    g.fillStyle = 'rgba(70,140,200,0.5)'; g.fillRect(0, 0, W, H * 0.04);
  },
  check(g, W, H, d, o) { // xadrez (pano de prato, toalha de mesa)
    const n = o.n || 10, c1 = o.color || '#d63a30';
    g.fillStyle = mixC('#fbf8f0', '#c9b27a', d * 0.8); g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.55; g.fillStyle = mixC(c1, '#4a3a2a', d * 0.5);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x + y) % 2 === 0) g.fillRect(x * W / n, y * H / n, W / n, H / n);
    g.globalAlpha = 0.3; for (let y = 0; y < n; y++) g.fillRect(0, y * H / n, W, H / n * 0.5 * ((y % 2) ? 1 : 0)); g.globalAlpha = 1;
  },
  sponge(g, W, H, d, o) { // esponja de cozinha: amarela + verde
    g.fillStyle = mixC('#f2d34a', '#6b6a2a', d * 0.75); g.fillRect(0, 0, W, H);
    const r = rng(8);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(150,110,20,${0.25 + r() * 0.3})`; g.beginPath(); g.arc(r() * W, r() * H, 2 + r() * 5, 0, 7); g.fill(); }
    g.fillStyle = mixC('#3f9a4a', '#33401f', d * 0.7); g.fillRect(0, H * 0.62, W, H * 0.38);
    for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(r() * W, H * 0.62 + r() * H * 0.38, 3, 1); }
  },
  napkin(g, W, H, d, o) { // guardanapo de pano
    g.fillStyle = mixC('#fbf9f3', '#cdb98a', d * 0.8); g.fillRect(0, 0, W, H);
    g.strokeStyle = mixC('#d9c9a0', '#8a7a4a', d); g.lineWidth = 8; g.strokeRect(14, 14, W - 28, H - 28);
    g.strokeStyle = 'rgba(0,0,0,0.05)'; g.lineWidth = 1; for (let i = 0; i < W; i += 5) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, H); g.stroke(); }
  },
  duvet(g, W, H, d, o) { // edredom acolchoado
    g.fillStyle = mixC(o.color || '#7fb5d9', '#9a8a5a', d * 0.6); g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3;
    for (let k = -H; k < W + H; k += W / 6) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + H, H); g.stroke(); g.beginPath(); g.moveTo(k, H); g.lineTo(k + H, 0); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, H * 0.82, W, H * 0.18);
  },
  mattress(g, W, H, d, o) { // colchão acolchoado
    g.fillStyle = mixC('#f0ece4', '#cdbb88', d * 0.8); g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(120,100,70,0.35)'; g.lineWidth = 2;
    for (let x = 0; x < W; x += W / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += H / 10) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = 'rgba(80,60,40,0.12)'; for (let x = W / 16; x < W; x += W / 8) for (let y = H / 20; y < H; y += H / 10) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  },
};

// --------------------------- sujeira por cima de tudo ---------------------------
function overlay(g, W, H, { seed, dirt, mold, kind }) {
  const r = rng(seed * 977 + 13);
  if (dirt > 0.04) { // mancha grande central (suor / uso) que escurece
    const a = clamp01(dirt * 0.95), cx = W * (0.3 + r() * 0.4), cy = H * (0.3 + r() * 0.4), rad = Math.min(W, H) * 0.7;
    const gr = g.createRadialGradient(cx, cy, 8, cx, cy, rad);
    gr.addColorStop(0, `rgba(150,105,40,${a * 0.6})`); gr.addColorStop(0.7, `rgba(170,130,60,${a * 0.3})`); gr.addColorStop(1, 'rgba(170,130,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  const nb = Math.floor(8 + dirt * 26);
  for (let i = 0; i < nb; i++) {
    const x = r() * W, y = r() * H, rad = (10 + r() * 38) * (0.4 + dirt) * (W / 512), th = r();
    if (th > dirt * 1.25) continue;
    const gr = g.createRadialGradient(x, y, 1, x, y, rad);
    const col = r() > 0.5 ? '110,76,26' : '88,64,32';
    gr.addColorStop(0, `rgba(${col},${0.5 * dirt})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const nd = Math.floor(dirt * 360);
  for (let i = 0; i < nd; i++) { g.fillStyle = `rgba(${70 + r() * 40},${55 + r() * 30},35,${0.25 + r() * 0.4})`; g.fillRect(r() * W, r() * H, 1.5 + r() * 2.5, 1.5 + r() * 2.5); }
  if (mold > 0.02) {
    const edge = kind === 'curtain'; // na cortina o mofo nasce da barra de baixo
    if (edge) {
      const gr = g.createLinearGradient(0, H, 0, H * (1 - 0.55 * mold));
      gr.addColorStop(0, `rgba(25,38,18,${0.95 * mold})`); gr.addColorStop(0.5, `rgba(70,110,36,${0.6 * mold})`); gr.addColorStop(1, 'rgba(90,130,50,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    for (let i = 0; i < 14; i++) {
      const x = r() * W, y = edge ? H * (0.55 + r() * 0.45) : r() * H, rad = (14 + r() * 50) * mold * (W / 512);
      if (rad < 3) continue;
      const gr = g.createRadialGradient(x, y, 1, x, y, rad);
      gr.addColorStop(0, `rgba(30,45,20,${0.85 * mold})`); gr.addColorStop(0.55, `rgba(84,118,40,${0.6 * mold})`); gr.addColorStop(1, 'rgba(100,140,50,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
      for (let k = 0; k < 10 * mold; k++) { g.fillStyle = 'rgba(20,28,14,0.8)'; g.beginPath(); g.arc(x + (r() - 0.5) * rad * 1.6, y + (r() - 0.5) * rad * 1.6, 1 + r() * 2.4, 0, 7); g.fill(); }
    }
  }
}

export function paintCloth(canvas, kind, { seed = 1, dirt = 0, mold = 0, color = null, n = 10 } = {}) {
  const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  (BASES[kind] || BASES.linen)(g, W, H, clamp01(dirt), { color, n });
  if (dirt > 0.02 || mold > 0.02) overlay(g, W, H, { seed, dirt: clamp01(dirt), mold: clamp01(mold), kind });
}

// Cria material + canvas de um tecido
export function makeCloth(kind, { w = 512, h = 512, seed = 1, color = null, n = 10, rough = 1, side = THREE.FrontSide } = {}) {
  const canvas = makeCanvas(w, h);
  paintCloth(canvas, kind, { seed, color, n });
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: rough, side });
  return { canvas, tex, mat, kind, seed, color, n, key: null };
}
