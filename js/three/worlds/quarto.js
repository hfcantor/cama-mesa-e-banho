// Mundo: o quarto do Tito (cama, lençol que vai ficando sujo, ácaros, janela,
// calendário, porta). Tudo é função de `state`, que as cenas do episódio
// alteram no tempo; assim o mesmo quarto serve para "1 semana", "1 mês" e "1 ano".
import * as THREE from 'three';
import { rng } from '../textures.js';
import { Particles } from '../particles.js';
import { Character } from '../characters.js';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c, repeat) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t; };
const mix = (a, b, k) => { const ca = new THREE.Color(a), cb = new THREE.Color(b); return '#' + ca.lerp(cb, k).getHexString(); };

export const BED_TOP = 0.62; // altura do lençol (m)
const HEAD_Z = -2.42, FOOT_Z = -0.4;

// ------------------------------------------------------------------
//  Texturas procedurais
// ------------------------------------------------------------------
function woodTexture() {
  const c = cv(512, 512), g = c.getContext('2d'), r = rng(5);
  const cols = ['#b98a5a', '#a87c4f', '#c4966a', '#ae8156'];
  for (let i = 0; i < 8; i++) {
    g.fillStyle = cols[i % 4]; g.fillRect(0, i * 64, 512, 64);
    g.strokeStyle = 'rgba(60,35,15,0.35)'; g.lineWidth = 2; g.strokeRect(0, i * 64, 512, 64);
    for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(80,50,25,${0.06 + r() * 0.08})`; g.beginPath(); const y = i * 64 + r() * 64; g.moveTo(r() * 512, y); g.lineTo(r() * 512, y + (r() - 0.5) * 6); g.stroke(); }
  }
  return tex(c, [2, 2]);
}

function wallTexture() {
  const c = cv(256, 512), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#e9d5b4'); gr.addColorStop(0.6, '#e2c9a2'); gr.addColorStop(1, '#d1b48a');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = 'rgba(140,100,70,0.35)'; g.fillRect(0, 380, 256, 132); // rodapé alto
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 376, 256, 6);
  return tex(c);
}

// Lençol/fronha: a sujeira é desenhada de forma determinística (mesma semente → mesmas manchas)
function paintLinen(c, { seed = 1, dirt = 0, mold = 0, pillow = false }) {
  const g = c.getContext('2d'), W = c.width, H = c.height, r = rng(seed * 977 + 13);
  g.fillStyle = mix('#f6f3ec', '#cdb277', clamp01(dirt) * 0.85); g.fillRect(0, 0, W, H);
  // trama do tecido
  g.globalAlpha = 0.07; g.fillStyle = '#7a6a50';
  for (let i = 0; i < W; i += 6) g.fillRect(i, 0, 1, H);
  for (let i = 0; i < H; i += 6) g.fillRect(0, i, W, 1);
  g.globalAlpha = 1;
  if (!pillow) { // vincos suaves
    for (let i = 0; i < 9; i++) { const y = r() * H; const gr = g.createLinearGradient(0, y - 12, 0, y + 12); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(90,70,40,0.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, y - 12, W, 24); }
  }
  // mancha de suor (silhueta do corpo) aparece cedo e escurece
  if (dirt > 0.04) {
    const a = clamp01(dirt * 0.95);
    const gr = g.createRadialGradient(W * 0.3, H * (pillow ? 0.5 : 0.45), 8, W * 0.3, H * (pillow ? 0.5 : 0.45), (pillow ? W * 0.32 : H * 0.34));
    gr.addColorStop(0, `rgba(178,132,52,${a * 0.75})`); gr.addColorStop(0.7, `rgba(190,150,70,${a * 0.4})`); gr.addColorStop(1, 'rgba(190,150,70,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  // manchas menores
  const nb = Math.floor(8 + dirt * 26);
  for (let i = 0; i < nb; i++) {
    const x = r() * W, y = r() * H, rad = (10 + r() * 38) * (0.4 + dirt), th = r();
    if (th > dirt * 1.25) continue;
    const gr = g.createRadialGradient(x, y, 1, x, y, rad);
    const col = r() > 0.5 ? '120,84,30' : '96,70,36';
    gr.addColorStop(0, `rgba(${col},${0.5 * dirt})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // pintinhas de pele morta
  const nd = Math.floor(dirt * 420);
  for (let i = 0; i < nd; i++) { g.fillStyle = `rgba(${70 + r() * 40},${55 + r() * 30},${35},${0.25 + r() * 0.4})`; g.fillRect(r() * W, r() * H, 1.5 + r() * 2.5, 1.5 + r() * 2.5); }
  // fungos (verde-preto) crescendo em manchas
  if (mold > 0.02) {
    const nm = 14;
    for (let i = 0; i < nm; i++) {
      const x = r() * W, y = r() * H, rad = (14 + r() * 50) * mold;
      if (rad < 3) continue;
      const gr = g.createRadialGradient(x, y, 1, x, y, rad);
      gr.addColorStop(0, `rgba(30,45,20,${0.85 * mold})`); gr.addColorStop(0.55, `rgba(84,118,40,${0.6 * mold})`); gr.addColorStop(1, 'rgba(100,140,50,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
      for (let k = 0; k < 10 * mold; k++) { g.fillStyle = 'rgba(20,28,14,0.8)'; g.beginPath(); g.arc(x + (r() - 0.5) * rad * 1.6, y + (r() - 0.5) * rad * 1.6, 1 + r() * 2.4, 0, 7); g.fill(); }
    }
  }
}

function calendarTexture(c, num, label) {
  const g = c.getContext('2d');
  g.fillStyle = '#fdfaf2'; g.fillRect(0, 0, 256, 300);
  g.fillStyle = '#d63a30'; g.fillRect(0, 0, 256, 70);
  g.fillStyle = '#fff'; g.font = '900 42px Montserrat, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, 128, 36);
  g.fillStyle = '#2a2a2a'; g.font = '900 150px Anton, Impact, sans-serif';
  g.fillText(String(num), 128, 184);
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 300);
}

function windowsTexture() {
  const c = cv(128, 512), g = c.getContext('2d'), r = rng(9);
  g.fillStyle = '#c9b48d'; g.fillRect(0, 0, 128, 512);
  for (let y = 12; y < 500; y += 34) for (let x = 10; x < 120; x += 28) {
    const on = r() > 0.25;
    g.fillStyle = on ? '#ffcf5a' : '#6b5a3a'; g.fillRect(x, y, 16, 20);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function neonTexture() {
  const c = cv(1024, 256), g = c.getContext('2d');
  g.fillStyle = '#1b0f2a'; g.fillRect(0, 0, 1024, 256);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '110px Anton, Impact, sans-serif';
  g.shadowColor = '#ff3d9a'; g.shadowBlur = 34; g.fillStyle = '#ffd1ea';
  g.fillText('RESTAURANTE', 512, 78);
  g.shadowColor = '#37e1ff'; g.fillStyle = '#d1f6ff';
  g.font = '86px Anton, Impact, sans-serif';
  g.fillText('DO TRAVESSEIRO', 512, 190);
  g.strokeStyle = '#ff3d9a'; g.lineWidth = 8; g.strokeRect(10, 10, 1004, 236);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ------------------------------------------------------------------
//  Ácaro (cartoon)
// ------------------------------------------------------------------
const GC = {};
const G = (k, f) => GC[k] || (GC[k] = f());

function makeMite({ chef = false, napkin = false, bag = false, tint = '#cdbfe0' } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const bm = M(tint, { roughness: 0.55 }), lm = M(mix(tint, '#4a3a6a', 0.55), { roughness: 0.6 });
  const b = new THREE.Mesh(G('mb', () => new THREE.SphereGeometry(0.1, 24, 18)), bm); b.scale.set(1.05, 0.9, 1.1); b.position.y = 0.09; body.add(b);
  // manchinhas do corpo
  [[-0.05, 0.15, 0.05], [0.06, 0.17, -0.02], [0, 0.12, -0.08]].forEach(([x, y, z]) => { const s = new THREE.Mesh(G('ms', () => new THREE.SphereGeometry(0.018, 8, 6)), M(mix(tint, '#7a5aa0', 0.5))); s.position.set(x, y, z); body.add(s); });
  // pernas
  const legs = [];
  for (let i = 0; i < 6; i++) {
    const s = i % 2 ? 1 : -1, row = Math.floor(i / 2);
    const leg = new THREE.Group(); leg.position.set(s * 0.085, 0.07, 0.05 - row * 0.065);
    const m = new THREE.Mesh(G('ml', () => new THREE.CapsuleGeometry(0.014, 0.075, 4, 6)), lm);
    m.rotation.z = s * -1.15; m.position.set(s * 0.04, -0.02, 0); leg.add(m); body.add(leg); legs.push({ g: leg, s, row });
  }
  // olhos
  const eyes = [];
  [-1, 1].forEach(s => {
    const eg = new THREE.Group(); eg.position.set(s * 0.04, 0.115, 0.085);
    const sc = new THREE.Mesh(G('me', () => new THREE.SphereGeometry(0.035, 14, 10)), M('#ffffff', { roughness: 0.3 })); sc.scale.set(1, 1.15, 0.7);
    const pu = new THREE.Mesh(G('mp', () => new THREE.SphereGeometry(0.018, 10, 8)), M('#111', { roughness: 0.2 })); pu.position.z = 0.016;
    eg.add(sc, pu); body.add(eg); eyes.push({ g: eg, pu });
  });
  // bochechas e boca
  [-1, 1].forEach(s => { const ch = new THREE.Mesh(G('mc', () => new THREE.SphereGeometry(0.016, 8, 6)), M('#ff8aa0')); ch.position.set(s * 0.07, 0.075, 0.09); ch.scale.set(1, 0.7, 0.4); body.add(ch); });
  const smile = new THREE.Mesh(G('msm', () => new THREE.TorusGeometry(0.03, 0.006, 6, 14, Math.PI)), M('#3a1a14')); smile.rotation.z = Math.PI; smile.position.set(0, 0.075, 0.1); body.add(smile);
  const open = new THREE.Mesh(G('mo', () => new THREE.SphereGeometry(0.03, 12, 8)), M('#5a1a1a')); open.position.set(0, 0.06, 0.098); open.scale.set(1, 0.8, 0.4); open.visible = false; body.add(open);
  let hat = null;
  if (chef) {
    hat = new THREE.Group();
    const base = new THREE.Mesh(G('hb', () => new THREE.CylinderGeometry(0.055, 0.06, 0.07, 14)), M('#fff'));
    const puff = new THREE.Mesh(G('hp', () => new THREE.SphereGeometry(0.075, 14, 10)), M('#fff')); puff.position.y = 0.06; puff.scale.set(1, 0.8, 1);
    hat.add(base, puff); hat.position.set(0, 0.2, 0.0); body.add(hat);
  }
  if (napkin) {
    const n = new THREE.Mesh(G('nk', () => new THREE.BoxGeometry(0.1, 0.1, 0.012)), M('#fff')); n.position.set(0, 0.04, 0.105); n.rotation.z = 0.78; body.add(n);
    const st = new THREE.Mesh(G('nk2', () => new THREE.BoxGeometry(0.1, 0.012, 0.014)), M('#d63a30')); st.position.set(0, 0.04, 0.106); st.rotation.z = 0.78; body.add(st);
  }
  if (bag) {
    const bg = new THREE.Mesh(G('bg', () => new THREE.BoxGeometry(0.09, 0.07, 0.035)), M('#7a4a2a')); bg.position.set(0.13, 0.04, 0.02);
    const hd = new THREE.Mesh(G('bgh', () => new THREE.TorusGeometry(0.022, 0.005, 6, 12, Math.PI)), M('#3a2414')); hd.position.set(0.13, 0.078, 0.02);
    body.add(bg, hd);
  }
  root.traverse(m => { if (m.isMesh) { m.castShadow = true; } });
  return { root, body, legs, eyes, smile, open, hat, mood: 'happy', phase: Math.random() * 6 };
}

function moodMite(m, mood) {
  m.mood = mood;
  m.smile.visible = mood === 'happy' || mood === 'sly';
  m.open.visible = mood === 'hungry' || mood === 'scared' || mood === 'cheer';
  m.open.scale.set(mood === 'cheer' ? 1.3 : 1, mood === 'cheer' ? 1.1 : 0.8, 0.4);
}

function animMite(m, t, dt, run = 0) {
  const ph = m.phase + t * (3 + run * 9);
  m.body.position.y = Math.abs(Math.sin(ph)) * (0.012 + run * 0.03);
  m.body.rotation.z = Math.sin(ph) * (0.05 + run * 0.12);
  m.legs.forEach(({ g, s, row }) => { g.rotation.x = Math.sin(ph * 1.6 + row * 2.1 + (s > 0 ? 1.7 : 0)) * (0.3 + run * 0.6); });
  m.eyes.forEach(e => { e.pu.position.x = Math.sin(t * 0.8 + m.phase) * 0.005; });
}

// ------------------------------------------------------------------
export class QuartoWorld {
  constructor() {
    const s = this.scene = new THREE.Scene();
    this.bloom = { strength: 0.35, radius: 0.5, threshold: 0.9 };
    this.exposure = 1.1;
    s.background = new THREE.Color('#2a1d14');
    s.fog = new THREE.Fog('#2a1d14', 8, 18);
    const r = this.r = rng(21);

    // ---- sala ----
    const RW = 5, RD = 6.6, RH = 2.8, RZ = 0.8; // largura, profundidade, altura, centro z
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), M('#ffffff', { map: woodTexture(), roughness: 0.55 }));
    floor.rotation.x = -Math.PI / 2; floor.position.z = RZ; floor.receiveShadow = true; s.add(floor);
    const wallMat = M('#ffffff', { map: wallTexture(), roughness: 0.95 });
    const mkWall = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; s.add(m); return m; };
    this.backWall = mkWall(RW, RH, 0, RH / 2, -2.5, 0);
    mkWall(RD, RH, -RW / 2, RH / 2, RZ, Math.PI / 2);
    mkWall(RD, RH, RW / 2, RH / 2, RZ, -Math.PI / 2);
    mkWall(RW, RH, 0, RH / 2, RZ + RD / 2, Math.PI);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), M('#efe3cf', { roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, RH, RZ); s.add(ceil);
    // tapete
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.02, 40), M('#3f7f8f', { roughness: 1 })); rug.position.set(0, 0.01, 0.9); rug.scale.z = 0.7; rug.receiveShadow = true; s.add(rug);
    const rug2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.025, 40), M('#e7c76a', { roughness: 1 })); rug2.position.set(0, 0.012, 0.9); rug2.scale.z = 0.7; s.add(rug2);

    // ---- janela (parede de fundo, à esquerda) ----
    const win = new THREE.Group(); win.position.set(-1.5, 1.65, -2.48); s.add(win);
    const frameM = M('#f3ece0', { roughness: 0.7 });
    [[0, 0.64, 1.2, 0.08], [0, -0.64, 1.2, 0.08], [-0.6, 0, 0.08, 1.36], [0.6, 0, 0.08, 1.36], [0, 0, 0.04, 1.2]].forEach(([x, y, w, h]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), frameM); f.position.set(x, y, 0.02); win.add(f); });
    this.glassMat = new THREE.MeshBasicMaterial({ color: '#0e1a3a', fog: false });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.24), this.glassMat); glass.position.z = -0.01; win.add(glass);
    this.stars = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.24), new THREE.MeshBasicMaterial({ map: (() => { const c = cv(128, 128), g = c.getContext('2d'), rr = rng(4); g.clearRect(0, 0, 128, 128); g.fillStyle = '#fff'; for (let i = 0; i < 26; i++) { g.globalAlpha = 0.4 + rr() * 0.6; g.fillRect(rr() * 128, rr() * 128, 2, 2); } return tex(c); })(), transparent: true, fog: false })); this.stars.position.z = -0.005; win.add(this.stars);
    // cortina
    const cc = cv(128, 64), cg = cc.getContext('2d');
    for (let i = 0; i < 8; i++) { cg.fillStyle = i % 2 ? '#c9684a' : '#e08a64'; cg.fillRect(i * 16, 0, 16, 64); }
    const curM = new THREE.MeshStandardMaterial({ map: tex(cc), side: THREE.DoubleSide, roughness: 1 });
    const cur = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.4), curM); cur.position.set(-0.7, 0, 0.09); win.add(cur);
    const cur2 = cur.clone(); cur2.position.x = 0.7; win.add(cur2);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 8), M('#3a2a1a')); rod.rotation.z = Math.PI / 2; rod.position.set(0, 0.73, 0.1); win.add(rod);
    this.win = win;

    // ---- calendário de parede ----
    this.cal = new THREE.Group(); this.cal.position.set(1.55, 1.55, -2.46); s.add(this.cal);
    this.calCanvasA = cv(256, 300); this.calCanvasB = cv(256, 300);
    this.calTexA = tex(this.calCanvasA); this.calTexB = tex(this.calCanvasB);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.66), new THREE.MeshStandardMaterial({ map: this.calTexB, roughness: 0.8 })); back.position.z = 0.012;
    this.calPageHinge = new THREE.Group(); this.calPageHinge.position.set(0, 0.33, 0.02);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.66), new THREE.MeshStandardMaterial({ map: this.calTexA, roughness: 0.8, side: THREE.DoubleSide })); front.position.y = -0.33;
    this.calPageHinge.add(front);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.74, 0.02), M('#8a5a3a')); board.position.z = 0.0;
    const rings = [-0.18, 0, 0.18].map(x => { const rg = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 12), M('#222')); rg.position.set(x, 0.33, 0.03); return rg; });
    this.cal.add(board, back, this.calPageHinge, ...rings);
    this._cal = { a: null, b: null };

    // ---- cama ----
    this.bed = new THREE.Group(); s.add(this.bed);
    const wood = M('#8a5a3a', { roughness: 0.7 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.34, 2.14), wood); base.position.set(0, 0.2, -1.41); base.castShadow = base.receiveShadow = true;
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.84, 1.05, 0.09), wood); head.position.set(0, 0.62, -2.46); head.castShadow = true;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.5, 0.08), wood); foot.position.set(0, 0.35, -0.34);
    this.mattress = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.26, 2.02), M('#f0ece4', { roughness: 0.95 })); this.mattress.position.set(0, 0.47, -1.41); this.mattress.receiveShadow = true;
    this.sheetCanvas = cv(512, 512);
    this.sheetTex = tex(this.sheetCanvas);
    this.sheetMat = M('#ffffff', { map: this.sheetTex, roughness: 1 });
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.03, 2.06), this.sheetMat); sheet.position.set(0, BED_TOP - 0.015, -1.41); sheet.receiveShadow = true; sheet.castShadow = true;
    this.bed.add(base, head, foot, this.mattress, sheet);
    // fronhas
    this.pillowCanvas = [cv(256, 256), cv(256, 256)];
    this.pillowTex = this.pillowCanvas.map(c => tex(c));
    this.pillows = [-0.4, 0.4].map((x, i) => {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 18), M('#ffffff', { map: this.pillowTex[i], roughness: 1 }));
      p.scale.set(0.62, 0.17, 0.4); p.position.set(x, BED_TOP + 0.08, -2.1); p.rotation.y = (i ? -0.06 : 0.05); p.castShadow = p.receiveShadow = true; this.bed.add(p); return p;
    });
    // manta dobrada no pé da cama
    const bc = cv(256, 128), bg = bc.getContext('2d'); ['#2f7a8a', '#e7c76a', '#d9593a', '#f2e6c8', '#2f7a8a', '#e7c76a'].forEach((c, i) => { bg.fillStyle = c; bg.fillRect(i * 43, 0, 43, 128); });
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.5), M('#fff', { map: tex(bc), roughness: 1 })); blanket.position.set(0, BED_TOP + 0.06, -0.7); blanket.castShadow = true; this.bed.add(blanket);
    this.blanket = blanket;
    // lençol novo (cai sobre a cama)
    const ng = new THREE.PlaneGeometry(1.72, 2.1, 22, 28); ng.rotateX(-Math.PI / 2);
    this.newSheet = new THREE.Mesh(ng, M('#fbfdff', { roughness: 0.9, side: THREE.DoubleSide })); this.newSheet.visible = false; this.newSheet.castShadow = true; s.add(this.newSheet);
    this._ng = ng.attributes.position.array.slice();

    // criado-mudo + abajur
    const ns = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.45), wood); ns.position.set(1.4, 0.28, -2.22); ns.castShadow = true; s.add(ns);
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.25, 12), M('#d9c9a0')); lampBase.position.set(1.4, 0.68, -2.22);
    this.lampMat = new THREE.MeshStandardMaterial({ color: '#fff1c8', emissive: '#ffb65a', emissiveIntensity: 1.4, roughness: 0.6 });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.22, 16, 1, true), this.lampMat); shade.material.side = THREE.DoubleSide; shade.position.set(1.4, 0.92, -2.22);
    s.add(lampBase, shade);

    // quadro na parede
    const fc = cv(160, 120), fg = fc.getContext('2d'); fg.fillStyle = '#9fd0e8'; fg.fillRect(0, 0, 160, 120); fg.fillStyle = '#5fa85a'; fg.fillRect(0, 70, 160, 50); fg.fillStyle = '#ffd24d'; fg.beginPath(); fg.arc(120, 30, 16, 0, 7); fg.fill();
    const pic = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.46, 0.03), M('#fff', { map: tex(fc) })); pic.position.set(0, 1.9, -2.48); s.add(pic);
    const picF = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.54, 0.025), wood); picF.position.set(0, 1.9, -2.49); s.add(picF);

    // porta (parede direita) e corredor
    this.door = new THREE.Group(); this.door.position.set(2.48, 0, 1.6); s.add(this.door);
    const hall = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.1), new THREE.MeshBasicMaterial({ color: '#f6e3b8' })); hall.position.set(0.1, 1.05, 0.55); hall.rotation.y = -Math.PI / 2; this.door.add(hall);
    const dFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 1.2), M('#f3ece0')); dFrame.position.set(0.03, 1.1, 0.55); dFrame.scale.x = 0.4; this.door.add(dFrame);
    hall.position.x = 0.04;
    this.doorPanel = new THREE.Group(); this.doorPanel.position.set(0, 0, 1.12);
    const dp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.1, 1.1), M('#a8794d')); dp.position.set(-0.02, 1.05, -0.55); this.doorPanel.add(dp);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), M('#e0c060', { metalness: 0.6, roughness: 0.3 })); knob.position.set(-0.08, 1.0, -0.95); this.doorPanel.add(knob);
    this.door.add(this.doorPanel);

    // ---- luzes ----
    this.hemi = new THREE.HemisphereLight('#ffe9d0', '#8a6a50', 0.85); s.add(this.hemi);
    this.lamp = new THREE.PointLight('#ffb65a', 12, 7, 1.5); this.lamp.position.set(1.2, 1.05, -2.0); s.add(this.lamp);
    this.sun = new THREE.DirectionalLight('#fff0d0', 0); this.sun.position.set(-3, 3.4, -4.5); this.sun.target.position.set(0, 0.6, -1.2);
    this.sun.castShadow = true; const sc = this.sun.shadow.camera; sc.left = -3; sc.right = 3; sc.top = 3; sc.bottom = -3; sc.near = 0.5; sc.far = 14; this.sun.shadow.mapSize.set(1024, 1024); this.sun.shadow.bias = -0.0008;
    s.add(this.sun, this.sun.target);
    this.key = new THREE.PointLight('#fff2dc', 10, 12, 1.4); this.key.position.set(0.4, 2.5, 1.2); s.add(this.key);
    this.sick = new THREE.PointLight('#8fb040', 0, 6, 1.6); this.sick.position.set(0, 1.0, -1.4); s.add(this.sick);

    // ---- Tito ----
    this.tito = new Character({ kid: true, shirt: '#4a86d6', pants: '#3a4a8a', skin: '#c68a5c', hair: '#2a1a12', scale: 0.92 });
    s.add(this.tito.root);

    // ---- ácaros ----
    this.swarm = [];
    const rr = rng(77);
    for (let i = 0; i < 34; i++) {
      const m = makeMite({ tint: ['#cdbfe0', '#c3d2e6', '#d8c2dc', '#bfcfdc'][i % 4] });
      moodMite(m, i % 5 === 0 ? 'cheer' : 'happy');
      m.hx = (rr() - 0.5) * 2; m.hz = (rr() - 0.5) * 2; m.hs = 0.8 + rr() * 0.5; m.ang = rr() * 6.28; m.dirx = rr() > 0.5 ? 1 : -1;
      m.root.visible = false; s.add(m.root); this.swarm.push(m);
    }
    this.heroDefs = [{ chef: true }, { napkin: true }, { bag: true }, {}, { napkin: true, tint: '#d8c2dc' }];
    this.heroes = this.heroDefs.map(d => { const m = makeMite(d); m.root.visible = false; s.add(m.root); return m; });

    // cozinha no travesseiro (panelas, fogão, placa neon)
    this.kitchen = new THREE.Group(); this.kitchen.visible = false; s.add(this.kitchen);
    const stove = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.2), M('#bbbbc0', { metalness: 0.4, roughness: 0.4 })); stove.position.set(0.58, BED_TOP + 0.2, -2.05);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.07, 14), M('#555a66', { metalness: 0.5 })); pot.position.set(0.55, BED_TOP + 0.285, -2.05);
    const pot2 = pot.clone(); pot2.position.set(0.62, BED_TOP + 0.275, -2.0); pot2.scale.setScalar(0.8);
    this.kitchen.add(stove, pot, pot2);
    this.neon = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), new THREE.MeshBasicMaterial({ map: neonTexture(), toneMapped: false }));
    this.neon.position.set(0.4, 1.3, -2.38); this.neon.visible = false; s.add(this.neon);
    this.neonLight = new THREE.PointLight('#ff3d9a', 0, 3, 1.6); this.neonLight.position.set(0.4, 1.2, -2.0); s.add(this.neonLight);

    // cidade de ácaros (prédio sobre a cama)
    this.city = new THREE.Group(); s.add(this.city);
    const wt = windowsTexture(); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(1, 0.5);
    this.floors = [];
    for (let i = 0; i < 12; i++) {
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.46), new THREE.MeshStandardMaterial({ color: '#fff', map: wt, emissive: '#ffcf5a', emissiveMap: wt, emissiveIntensity: 0.9, roughness: 0.8 }));
      fl.position.set(0, BED_TOP + 0.1 + i * 0.2, -1.3); fl.visible = false; fl.castShadow = true; this.city.add(fl); this.floors.push(fl);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 4), M('#d63a30')); roof.rotation.y = Math.PI / 4; this.roof = roof; this.city.add(roof);

    // brotos de mofo/"selva" na cama
    this.sprouts = [];
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.3, 6), M('#4f7a2a')); stem.position.y = 0.15; g.add(stem);
      for (let k = 0; k < 3; k++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 5), M(['#5f9a30', '#7bb43a', '#3f7a2a'][k])); lf.position.set(Math.cos(k * 2.1) * 0.05, 0.3 + k * 0.03, Math.sin(k * 2.1) * 0.05); lf.rotation.set(Math.sin(k * 2.1) * 0.9, 0, -Math.cos(k * 2.1) * 0.9); g.add(lf); }
      const x = (rr() - 0.5) * 1.3, z = -0.6 - rr() * 1.7; g.position.set(x, BED_TOP, z); g.visible = false; s.add(g); this.sprouts.push({ g, k: rr() });
    }
    // moscas
    this.flies = [];
    for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M('#101010')); f.visible = false; s.add(f); this.flies.push({ m: f, ph: i * 0.9, rad: 0.3 + (i % 4) * 0.2 }); }

    // partículas
    this.flakes = new Particles(900, { soft: 0.4 });
    this.sweat = new Particles(300, { soft: 0.8 });
    this.dust = new Particles(900, { soft: 1 });
    this.smoke = new Particles(900, { soft: 1 });
    this.spores = new Particles(600, { soft: 0.6 });
    this.steam = new Particles(300, { soft: 1 });
    s.add(this.flakes.points, this.sweat.points, this.dust.points, this.smoke.points, this.spores.points, this.steam.points);

    this.state = {};
    this.reset();
  }

  reset() {
    this.state = {
      dirt: 0, mold: 0, mood: 0, day: 0, lamp: 1, mites: 0, miteScale: 1, flee: 0, titoInBed: 1,
      city: 0, neon: 0, jungle: 0, stink: 0, flies: 0, sweat: 0, flakes: 0, dust: 0, kitchen: 0,
      calNum: 0, calNext: 1, calFlip: 0, calLabel: 'ABRIL', newSheet: -1, doorOpen: 0, bedShake: 0, miteRun: 0,
    };
    [this.flakes, this.sweat, this.dust, this.smoke, this.spores, this.steam].forEach(p => p.clear());
    this.heroes.forEach(h => { h.root.visible = false; });
    this._lastPaint = null; this._lastCal = null;
    this.setTitoLying();
    const t = this.tito;
    Object.keys(t.pose).forEach(k => { t.pose[k] = 0; }); t.pose.smile = 0.3; t.cur = { ...t.pose };
  }

  // --- Tito ---
  setTitoLying(x = -0.4) {
    const t = this.tito;
    t.root.position.set(x, BED_TOP + 0.2, -0.78);
    t.root.rotation.set(-Math.PI / 2, 0, 0);
    t.root.visible = true;
  }
  setTitoStanding(x, z, ry = 0) { const t = this.tito; t.root.position.set(x, 0, z); t.root.rotation.set(0, ry, 0); t.root.visible = true; }
  hideTito() { this.tito.root.visible = false; }

  // --- ácaros-herói (cenas com personagem em destaque) ---
  hero(i, { pos, ry = 0, scale = 1, mood = 'happy', run = 0 } = {}) {
    const h = this.heroes[i]; if (!h) return h;
    if (!pos) { h.root.visible = false; return h; }
    h.root.visible = true; h.root.position.set(...pos); h.root.rotation.y = ry; h.root.scale.setScalar(scale); h.run = run;
    if (h.mood !== mood) moodMite(h, mood);
    return h;
  }

  _paint() {
    const st = this.state;
    const key = `${Math.round(st.dirt * 40)}|${Math.round(st.mold * 40)}`;
    if (key === this._lastPaint) return;
    this._lastPaint = key;
    paintLinen(this.sheetCanvas, { seed: 1, dirt: st.dirt, mold: st.mold });
    paintLinen(this.pillowCanvas[0], { seed: 2, dirt: st.dirt, mold: st.mold, pillow: true });
    paintLinen(this.pillowCanvas[1], { seed: 3, dirt: st.dirt, mold: st.mold, pillow: true });
    this.sheetTex.needsUpdate = true; this.pillowTex.forEach(t => (t.needsUpdate = true));
  }

  _calendar() {
    const st = this.state, key = `${st.calNum}|${st.calNext}|${st.calLabel}`;
    if (key === this._lastCal) return;
    this._lastCal = key;
    calendarTexture(this.calCanvasA, st.calNum, st.calLabel); calendarTexture(this.calCanvasB, st.calNext, st.calLabel);
    this.calTexA.needsUpdate = true; this.calTexB.needsUpdate = true;
  }

  update(t, dt, et, cam) {
    const st = this.state;
    this._paint(); this._calendar();
    const mood = st.mood, day = st.day;

    // luz e clima
    const sunK = clamp01(day);
    this.sun.intensity = sunK * 3.2; this.sun.color.set(mix('#ffd9a0', '#fff6e0', sunK));
    this.hemi.intensity = lerp(0.55, 1.05, sunK) * (1 - mood * 0.25);
    this.hemi.color.set(mix(mix('#ffe9d0', '#bcd0ff', 0), '#c8e0a0', mood)); this.hemi.groundColor.set(mix('#8a6a50', '#4a5a30', mood));
    this.lamp.intensity = 12 * st.lamp * (1 - sunK * 0.5); this.lampMat.emissiveIntensity = 1.4 * st.lamp;
    this.key.intensity = lerp(11, 7, mood) * lerp(1, 1.2, sunK); this.key.color.set(mix('#fff2dc', '#d6e8a8', mood));
    this.sick.intensity = mood * 5;
    this.exposure = lerp(1.15, 0.95, mood) * lerp(1, 1.1, sunK);
    this.glassMat.color.set(mix('#0e1a3a', '#8fd2ff', sunK)); this.stars.visible = sunK < 0.5;
    this.scene.background.set(mix('#2a1d14', '#7a6a40', mood)); this.scene.fog.color.copy(this.scene.background);
    this.scene.fog.near = 9; this.scene.fog.far = 22;
    this.bed.rotation.z = Math.sin(t * 38) * 0.01 * st.bedShake;

    // calendário
    this.calPageHinge.rotation.x = -clamp01(st.calFlip) * 2.4;
    this.calPageHinge.position.y = 0.33 - clamp01(st.calFlip) * 0.05;
    this.calPageHinge.visible = st.calFlip < 0.98;

    // porta
    this.doorPanel.rotation.y = -st.doorOpen * 1.45;

    // Tito (pose dentro do loop)
    this.tito.update(t, dt);

    // ácaros: enxame
    const n = Math.round(st.mites * this.swarm.length);
    this.swarm.forEach((m, i) => {
      const on = i < n;
      m.root.visible = on;
      if (!on) return;
      const sc = st.miteScale * m.hs;
      m.ang += dt * 0.5 * m.dirx;
      const wander = 0.06;
      let x = (st.titoInBed ? lerp(0.1, 0.74, (m.hx + 1) / 2) : m.hx * 0.74) + Math.cos(m.ang) * wander, z = lerp(-0.7, -2.2, (m.hz + 1) / 2) + Math.sin(m.ang) * wander;
      let y = BED_TOP + 0.005;
      if (st.flee > 0) { x += m.dirx * st.flee * (2.6 + (i % 5) * 0.2); z += st.flee * 0.8; if (Math.abs(x) > 0.82) y = lerp(y, 0.03, clamp01((Math.abs(x) - 0.82) / 0.2)); }
      m.root.position.set(x, y, z);
      m.root.rotation.y = m.ang * (st.flee > 0 ? 0 : 1) + (st.flee > 0 ? (m.dirx > 0 ? Math.PI / 2 : -Math.PI / 2) : 0);
      m.root.scale.setScalar(sc);
      animMite(m, t, dt, st.flee > 0 ? 1 : st.miteRun);
    });
    this.heroes.forEach(h => { if (h.root.visible) animMite(h, t, dt, h.run || 0); });

    // cozinha e neon
    this.kitchen.visible = st.kitchen > 0.01; this.kitchen.scale.setScalar(Math.max(0.01, st.kitchen));
    this.neon.visible = st.neon > 0.01;
    const flick = st.neon * (0.75 + 0.25 * (Math.sin(t * 17) > -0.6 ? 1 : 0.2));
    this.neon.material.color.setScalar(Math.max(0.05, flick)); this.neonLight.intensity = 8 * flick;
    if (st.kitchen > 0.5 && Math.random() < 0.5) this.steam.emit({ pos: [0.57, BED_TOP + 0.35, -2.05], spread: 0.03, vel: [0, 0.35, 0], velSpread: [0.05, 0.05, 0.05], life: 1.6, size: 0.07, sizeEnd: 0.2, color: [1, 1, 1, 0.5], colorEnd: [1, 1, 1, 0], count: 1 });

    // prédio de ácaros
    const fc = Math.round(st.city * this.floors.length);
    this.floors.forEach((f, i) => { f.visible = i < fc; const k = clamp01(st.city * this.floors.length - i); f.scale.set(1, Math.max(0.01, k), 1); f.position.y = BED_TOP + 0.1 * k + i * 0.2; });
    this.roof.visible = fc > 0; this.roof.position.set(0, BED_TOP + fc * 0.2 + 0.15, -1.3);

    // selva
    this.sprouts.forEach(({ g, k }) => { const s = clamp01(st.jungle * 1.4 - k * 0.4); g.visible = s > 0.01; g.scale.setScalar(Math.max(0.01, s) * (0.7 + k * 0.7)); g.rotation.y = k * 6; });

    // moscas
    this.flies.forEach((f, i) => {
      f.m.visible = st.flies > (i / this.flies.length);
      const a = t * (2 + i * 0.3) + f.ph;
      f.m.position.set(Math.cos(a) * f.rad, BED_TOP + 0.5 + Math.sin(t * 3 + i) * 0.15 + (i % 3) * 0.12, -1.3 + Math.sin(a * 1.3) * f.rad);
    });

    // lençol novo: cai e assenta
    const ns = st.newSheet;
    this.newSheet.visible = ns > -0.5;
    if (this.newSheet.visible) {
      const k = clamp01(ns), pos = this.newSheet.geometry.attributes.position, src = this._ng;
      const h = BED_TOP + 0.025 + Math.pow(1 - k, 2) * 1.6;
      for (let i = 0; i < pos.count; i++) {
        const x = src[i * 3], z = src[i * 3 + 2];
        const wave = Math.sin(x * 4 + z * 3 + ns * 9) * 0.09 * (1 - k) * (1 - k) + Math.cos(z * 5 - ns * 7) * 0.05 * (1 - k);
        const bow = (1 - k) * (0.35 - 0.35 * Math.pow(Math.abs(x) / 0.86, 2)) * 0.4;
        pos.setXYZ(i, x * (1 - 0.12 * (1 - k)), h + wave + bow, z * (1 - 0.1 * (1 - k)) - 1.41);
      }
      pos.needsUpdate = true; this.newSheet.geometry.computeVertexNormals();
    }

    // partículas
    const head = [-0.4, BED_TOP + 0.4, -2.0];
    if (st.sweat > 0.01 && Math.random() < st.sweat) this.sweat.emit({ pos: head, spread: [0.12, 0.05, 0.08], vel: [0, 0.25, 0.1], velSpread: [0.1, 0.1, 0.1], life: 0.9, size: 0.035, sizeEnd: 0.03, color: [0.6, 0.85, 1, 0.9], colorEnd: [0.7, 0.9, 1, 0], gravity: 2.5, count: 1 });
    if (st.flakes > 0.01 && Math.random() < st.flakes) this.flakes.emit({ pos: [-0.2 + (Math.random() - 0.5) * 0.9, BED_TOP + 0.55 + Math.random() * 0.4, -1.4 + (Math.random() - 0.5) * 1.4], spread: [0.1, 0.1, 0.1], vel: [0, -0.12, 0], velSpread: [0.05, 0.03, 0.05], life: 3.2, size: 0.03, sizeEnd: 0.026, color: [0.93, 0.85, 0.74, 0.95], colorEnd: [0.9, 0.82, 0.7, 0.4], gravity: 0.05, count: 3 });
    if (st.dust > 0.01 && Math.random() < st.dust) this.dust.emit({ pos: [(Math.random() - 0.5) * 1.5, BED_TOP + 0.1, -1.4 + (Math.random() - 0.5) * 1.6], spread: 0.05, vel: [0, 0.7, 0], velSpread: [0.5, 0.35, 0.5], life: 2.2, size: 0.12, sizeEnd: 0.4, color: [0.8, 0.7, 0.55, 0.28], colorEnd: [0.7, 0.62, 0.5, 0], drag: 0.6, count: 4 });
    if (st.stink > 0.01 && Math.random() < st.stink) this.smoke.emit({ pos: [(Math.random() - 0.5) * 1.0, BED_TOP + 0.1, -1.4 + (Math.random() - 0.5) * 1.2], spread: 0.08, vel: [0, 0.35, 0.1], velSpread: [0.18, 0.1, 0.18], life: 3.2, size: 0.25, sizeEnd: 0.9, color: [0.52, 0.72, 0.2, 0.34], colorEnd: [0.4, 0.55, 0.15, 0], drag: 0.3, count: 2 });
    if (st.mold > 0.3 && Math.random() < st.mold * 0.5) this.spores.emit({ pos: [(Math.random() - 0.5) * 1.3, BED_TOP + 0.05, -1.4 + (Math.random() - 0.5) * 1.6], spread: 0.05, vel: [0, 0.2, 0], velSpread: [0.12, 0.08, 0.12], life: 3, size: 0.03, sizeEnd: 0.02, color: [0.55, 0.8, 0.25, 0.9], colorEnd: [0.5, 0.7, 0.2, 0], count: 1 });
    [this.flakes, this.sweat, this.dust, this.smoke, this.spores, this.steam].forEach(p => p.update(dt));
  }

  // poeirão/espirro: puxado pelas cenas
  puff(pos, n = 80, speed = 1.2) {
    this.dust.emit({ pos, spread: 0.1, sphere: true, radial: true, vel: [0, 0.3, 0.6], velSpread: [speed, speed * 0.6, speed], life: 1.6, size: 0.12, sizeEnd: 0.5, color: [0.9, 0.85, 0.75, 0.45], colorEnd: [0.8, 0.75, 0.65, 0], drag: 1.6, count: n });
  }
}
