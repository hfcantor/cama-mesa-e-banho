// Mundo: o Tabocal "de verdade" em 3D, com vários cenários (sets) e um elenco de figurantes (NPCs).
// Usado a partir do EP07: personagens 3D que atuam (riem, se assustam, apontam, falam) em volta do protagonista.
import * as THREE from 'three';
import { Character } from '../characters.js';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
const lerp = (a, b, k) => a + (b - a) * k;

export const TSETS = { bakery: 0, street: 60, dinner: 120, office: 180, plaza: 240 };

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
function sign(lines, w, h, { bg = '#fff', fg = '#111', border = null, size = 120 } = {}) {
  const px = 512, py = Math.max(64, Math.round(512 * h / w));
  const tex = canvasTex(px, py, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, px, py);
    if (border) { g.strokeStyle = border; g.lineWidth = 16; g.strokeRect(8, 8, px - 16, py - 16); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const L = Array.isArray(lines) ? lines : [lines];
    let fs = Math.min(size, (py * 0.78) / (L.length * 1.1));
    const fit = (f) => { g.font = `900 ${f}px Montserrat, Arial Black, sans-serif`; return Math.max(...L.map((t) => g.measureText(t).width)); };
    while (fs > 10 && fit(fs) > px * 0.88) fs *= 0.92;
    g.font = `900 ${fs}px Montserrat, Arial Black, sans-serif`;
    L.forEach((t, i) => g.fillText(t, px / 2, py / 2 + (i - (L.length - 1) / 2) * fs * 1.1));
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
}
const box = (w, h, d, color, o = {}) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color, o));

// elenco: figurantes com visual próprio (o índice é usado pelos roteiros)
const ROSTER = [
  { name: 'BETO', role: 'padeiro', o: { chefHat: true, apron: '#ffffff', shirt: '#f2f2f2', skin: '#c98a5e', hair: '#2a1a12', pants: '#3a3a4a' } },
  { name: 'DONA MARIA', role: 'cliente', o: { bun: true, dress: '#d94f2b', shirt: '#d94f2b', skin: '#e0b090', hair: '#cfcfcf', pants: '#d94f2b' } },
  { name: 'DAVI', role: 'entregador', o: { cap: '#2b7fd9', shirt: '#f2c14e', skin: '#8a5a3a', hair: '#111', pants: '#2a2a3a' } },
  { name: 'LÚCIA', role: 'cliente', o: { bun: true, dress: '#8a3ad9', shirt: '#8a3ad9', skin: '#e0b090', hair: '#3a2a20', pants: '#8a3ad9' } },
  { name: 'SEU ZÉ', role: 'marido', o: { beard: true, glasses: true, shirt: '#3a8a4a', skin: '#c98a5e', hair: '#bdbdbd', pants: '#4a4a5a' } },
  { name: 'DONA ROSA', role: 'esposa', o: { bun: true, dress: '#e0467a', shirt: '#e0467a', skin: '#d9a066', hair: '#cfcfcf', pants: '#e0467a' } },
  { name: 'DR. PAULO', role: 'chefe', o: { tie: '#c8372d', glasses: true, shirt: '#2a3a5a', skin: '#e0b090', hair: '#111', pants: '#1f2a3a' } },
  { name: 'RAFA', role: 'candidato', o: { tie: '#2a7a3a', shirt: '#e8e8e8', skin: '#a8754a', hair: '#2a1a12', pants: '#3a3a4a' } },
  { name: '', role: 'figurante', o: { shirt: '#2b7fd9', skin: '#8a5a3a', hair: '#111', pants: '#2a3a5a' } },
  { name: '', role: 'figurante', o: { shirt: '#e0b43a', skin: '#e0b090', hair: '#5a3a20', pants: '#3a4a6a', glasses: true } },
  { name: '', role: 'figurante', o: { shirt: '#a43ad9', skin: '#a8754a', hair: '#201510', pants: '#2a2a3a', kid: true } },
  { name: '', role: 'figurante', o: { dress: '#3ad9a4', shirt: '#3ad9a4', skin: '#8a5a3a', hair: '#111', bun: true, pants: '#3ad9a4' } },
  { name: '', role: 'figurante', o: { shirt: '#d93a6f', skin: '#f0c8a0', hair: '#7a4a20', pants: '#25304a', cap: '#222' } },
  { name: '', role: 'figurante', o: { shirt: '#7ad93a', skin: '#c98a5e', hair: '#201510', pants: '#3a2a4a', hat: true } },
  { name: '', role: 'figurante', o: { shirt: '#f08a2b', skin: '#e0b090', hair: '#bdbdbd', pants: '#2a3a5a', beard: true } },
  { name: '', role: 'figurante', o: { dress: '#2b7fd9', shirt: '#2b7fd9', skin: '#d9a066', hair: '#201510', pants: '#2b7fd9', kid: true } },
  { name: '', role: 'figurante', o: { shirt: '#e0563a', skin: '#8a5a3a', hair: '#111', pants: '#4a4a5a', glasses: true } },
  { name: '', role: 'figurante', o: { shirt: '#3ad9d9', skin: '#e0b090', hair: '#3a2a20', pants: '#2a2a3a', cap: '#d94f2b' } },
];

export class TownWorld {
  constructor() {
    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color('#9fd8f2');
    s.fog = new THREE.Fog('#cfeaf5', 60, 160);
    this.bloom = { strength: 0.25, radius: 0.5, threshold: 0.95 };
    this.exposure = 1.15;
    this.state = {};

    s.add(new THREE.HemisphereLight('#fff6e0', '#7a6a58', 1.05));
    const sun = new THREE.DirectionalLight('#fff0d0', 1.6); sun.position.set(20, 40, 30); s.add(sun);
    this.lights = {};
    for (const [n, x] of Object.entries(TSETS)) { const l = new THREE.PointLight('#ffe2b0', 60, 40, 1.3); l.position.set(x, 8, 5); s.add(l); this.lights[n] = l; }

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 120), M('#8bbf58', { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(120, -0.01, -10); s.add(ground);

    this.buildBakery(s); this.buildStreet(s); this.buildDinner(s); this.buildOffice(s); this.buildPlaza(s);

    this.tito = new Character({ kid: true, hat: true, shirt: '#e0563a', pants: '#2f4a7a', skin: '#c68a5c', scale: 1.15 });
    s.add(this.tito.root);
    this.npcs = ROSTER.map((r) => { const c = new Character({ ...r.o }); c.meta = { name: r.name, role: r.role }; c.root.visible = false; s.add(c.root); return c; });
    this.tito.root.visible = false;
    this.reset();
  }

  // ------------------------------------------------------------------ sets
  wall(x, w, h, color, trim = '#ffffff', z = -9) {
    const s = this.scene;
    const wl = box(w, h, 0.4, color); wl.position.set(x, h / 2, z); s.add(wl);
    const base = box(w, 1.1, 0.5, trim, { roughness: 0.5 }); base.position.set(x, 0.55, z + 0.15); s.add(base);
  }
  floorPatch(x, w, d, color, z = -2) { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M(color, { roughness: 0.55 })); f.rotation.x = -Math.PI / 2; f.position.set(x, 0.01, z); this.scene.add(f); return f; }

  buildBakery(s) {
    const x = TSETS.bakery;
    this.wall(x, 40, 16, '#f6dca6', '#c98a5e', -9);
    this.floorPatch(x, 40, 22, '#e9d6b0', -1);
    const tiles = canvasTex(256, 256, (g) => { g.fillStyle = '#f3e6c8'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#c9a56a'; g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128); });
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(10, 6);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.5 })); fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.02, -1); s.add(fl);
    const sg = sign(['PADARIA', 'DO BETO'], 8, 2.6, { bg: '#7a3a22', fg: '#ffd24a', border: '#ffd24a' }); sg.position.set(x, 7.6, -8.7); s.add(sg);
    // balcão com vitrine
    const counter = box(9, 1.3, 1.8, '#a0522d'); counter.position.set(x, 0.65, -3.4); s.add(counter);
    const top = box(9.4, 0.15, 2.2, '#d9b87c'); top.position.set(x, 1.38, -3.4); s.add(top);
    const glass = box(6.5, 1.0, 1.4, '#bfe6f5', { transparent: true, opacity: 0.35, roughness: 0.1 }); glass.position.set(x - 0.8, 1.95, -3.5); s.add(glass);
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), M(i % 2 ? '#d99a4a' : '#c47a2e')); b.scale.set(1.5, 0.8, 1); b.position.set(x - 3 + i * 1.05, 1.62, -3.5); s.add(b); }
    // prateleiras com pães
    [3.1, 4.8].forEach((y, k) => { const sh = box(9, 0.14, 1, '#8a5a30'); sh.position.set(x, y, -8.3); s.add(sh); for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 8), M(i % 3 ? '#d9a04a' : '#b8742a')); b.scale.set(1.3, 0.8, 1); b.position.set(x - 3.6 + i * 1.2, y + 0.38, -8.3); s.add(b); } void k; });
    // janela
    const win = box(3.6, 3.2, 0.1, '#9fd8f2'); win.position.set(x + 12, 4.2, -8.7); s.add(win);
    const frame = box(3.9, 3.5, 0.08, '#8a5a30'); frame.position.set(x + 12, 4.2, -8.78); s.add(frame);
  }

  buildStreet(s) {
    const x = TSETS.street;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 9), M('#585d66', { roughness: 0.9 })); road.rotation.x = -Math.PI / 2; road.position.set(x, 0.01, -1.5); s.add(road);
    for (let i = -6; i <= 6; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.18), M('#f2f2f2')); d.rotation.x = -Math.PI / 2; d.position.set(x + i * 4, 0.02, -1.5); s.add(d); }
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(60, 5), M('#d6d2c6')); walk.rotation.x = -Math.PI / 2; walk.position.set(x, 0.02, -7.5); s.add(walk);
    const cols = ['#f2e6c8', '#e8a5b8', '#9cc7e0', '#f5d76e', '#c6e0a8', '#e0b090'];
    for (let i = -3; i <= 3; i++) {
      const h = box(7.6, 8 + (i % 2) * 2, 4, cols[(i + 3) % cols.length]); h.position.set(x + i * 8.2, h.geometry.parameters.height / 2, -12); s.add(h);
      const door = box(1.3, 2.4, 0.1, '#3d6fa8'); door.position.set(x + i * 8.2 - 1.6, 1.2, -9.98); s.add(door);
      const w = box(1.6, 1.4, 0.1, '#bfe3f2'); w.position.set(x + i * 8.2 + 1.6, 3.4, -9.98); s.add(w);
      const rf = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.6, 4), M('#b5502e')); rf.rotation.y = Math.PI / 4; rf.position.set(x + i * 8.2, h.geometry.parameters.height + 1.3, -12); s.add(rf);
    }
    // moto de entrega + pizza
    const moto = this.moto = new THREE.Group();
    const body = box(2.6, 0.7, 0.7, '#d92a2a'); body.position.y = 0.9; moto.add(body);
    const seat = box(1.1, 0.2, 0.6, '#222'); seat.position.set(-0.3, 1.35, 0); moto.add(seat);
    const bar = box(0.12, 0.12, 1.2, '#444'); bar.position.set(1.0, 1.6, 0); moto.add(bar);
    [-1.1, 1.1].forEach((dx) => { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.22, 20), M('#1a1a1a')); wh.rotation.x = Math.PI / 2; wh.position.set(dx, 0.55, 0); moto.add(wh); });
    const bag = box(1.0, 0.9, 0.9, '#f2c14e'); bag.position.set(-1.1, 1.65, 0); moto.add(bag);
    moto.position.set(x - 2.6, 0, -1.2); s.add(moto);
    this.pizza = new THREE.Group();
    const pb = box(0.9, 0.1, 0.9, '#f2f2f2'); this.pizza.add(pb);
    const pc = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 20), M('#e0432a')); pc.position.y = 0.09; this.pizza.add(pc);
    this.pizza.visible = false; s.add(this.pizza);
    const sg = sign(['PIZZARIA', 'DO TABOCAL'], 5, 1.7, { bg: '#c8372d', fg: '#fff', border: '#ffd24a' }); sg.position.set(x + 8.2 * 1 - 1.6, 5.8, -9.9); s.add(sg);
  }

  buildDinner(s) {
    const x = TSETS.dinner;
    this.wall(x, 40, 16, '#bfe0c4', '#8a5a30', -9);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), M('#b98a5a', { roughness: 0.6 })); fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.02, -1); s.add(fl);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(5.5, 32), M('#c85a4a')); rug.rotation.x = -Math.PI / 2; rug.position.set(x, 0.03, -3.5); s.add(rug);
    const table = box(4.4, 0.16, 2.6, '#8a5a30'); table.position.set(x, 1.45, -3.5); s.add(table);
    [[-2, -1.1], [2, -1.1], [-2, 1.1], [2, 1.1]].forEach(([dx, dz]) => { const l = box(0.2, 1.45, 0.2, '#6a4a20'); l.position.set(x + dx, 0.72, -3.5 + dz); s.add(l); });
    const cloth = box(4.6, 0.04, 2.8, '#f2f2f2'); cloth.position.set(x, 1.55, -3.5); s.add(cloth);
    for (let i = 0; i < 6; i++) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.05, 20), M('#ffffff', { roughness: 0.3 })); pl.position.set(x - 1.2 + (i % 3) * 1.2, 1.6, -3.5 + (i < 3 ? 0.8 : -0.8)); s.add(pl); }
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.6, 20), M('#444', { metalness: 0.6 })); pot.position.set(x, 1.9, -3.5); s.add(pot);
    for (let i = 0; i < 6; i++) { // cadeiras: 3 de cada lado
      const cx = x - 1.2 + (i % 3) * 1.2, cz = i < 3 ? -1.7 : -5.3;
      const seat = box(0.8, 0.12, 0.8, '#a0522d'); seat.position.set(cx, 0.82, cz); s.add(seat);
      const back = box(0.8, 0.9, 0.1, '#a0522d'); back.position.set(cx, 1.3, cz + (i < 3 ? 0.4 : -0.4)); s.add(back);
    }
    [-2.55, 2.55].forEach((cx) => { const seat = box(0.8, 0.12, 0.8, '#a0522d'); seat.position.set(cx, 0.82, -3.5); s.add(seat); const back = box(0.1, 0.9, 0.8, '#a0522d'); back.position.set(cx + (cx < 0 ? -0.4 : 0.4), 1.3, -3.5); s.add(back); });
    const sg = sign('SUA CASA, SEU JANTAR', 7, 1.2, { bg: '#fff3d0', fg: '#8a3a22', border: '#8a5a30', size: 90 }); sg.position.set(x, 6.4, -8.7); s.add(sg);
    const win = box(3.4, 3.4, 0.1, '#9fd8f2'); win.position.set(x - 10, 4.6, -8.7); s.add(win);
  }

  buildOffice(s) {
    const x = TSETS.office;
    this.wall(x, 40, 16, '#dfe6ee', '#9aa6b4', -9);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), M('#7d8794', { roughness: 0.4 })); fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.02, -1); s.add(fl);
    const sg = sign(['EMPRESA TABOCAL', 'ENTREVISTAS'], 8, 2.2, { bg: '#2a3a5a', fg: '#ffffff', border: '#5ab0ff' }); sg.position.set(x, 7.4, -8.7); s.add(sg);
    const desk = box(3.8, 0.16, 1.8, '#6a4a2a'); desk.position.set(x + 0.4, 1.5, -5.0); s.add(desk);
    [[-1.7, -0.7], [1.7, -0.7], [-1.7, 0.7], [1.7, 0.7]].forEach(([dx, dz]) => { const l = box(0.16, 1.5, 0.16, '#4a3018'); l.position.set(x + 0.4 + dx, 0.75, -5.0 + dz); s.add(l); });
    const mon = box(1.5, 0.95, 0.1, '#111'); mon.position.set(x + 1.0, 2.2, -5.3); s.add(mon);
    const scr = sign(['CURRÍCULO', 'Excel avançado*'], 1.35, 0.8, { bg: '#e8f4ff', fg: '#2a3a5a', size: 60 }); scr.position.set(x + 1.0, 2.2, -5.24); s.add(scr);
    const bn = box(6.0, 0.18, 1.0, '#3a4a6a'); bn.position.set(x, 0.82, 0.9); s.add(bn); [-2.6, 2.6].forEach((dx) => { const l = box(0.18, 0.8, 0.18, '#222'); l.position.set(x + dx, 0.4, 0.9); s.add(l); });
    const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), M('#3f8f3a', { flatShading: true })); plant.position.set(x + 3.6, 1.8, -7); s.add(plant);
    const pot = box(0.8, 0.9, 0.8, '#c4552d'); pot.position.set(x + 3.6, 0.45, -7); s.add(pot);
  }

  buildPlaza(s) {
    const x = TSETS.plaza;
    const st = new THREE.Mesh(new THREE.CircleGeometry(16, 48), M('#d9d2c0', { roughness: 0.9 })); st.rotation.x = -Math.PI / 2; st.position.set(x, 0.02, -2); s.add(st);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; const sp = new THREE.Mesh(new THREE.CircleGeometry(0.4, 8), M('#bfb8a4')); sp.rotation.x = -Math.PI / 2; sp.position.set(x + Math.cos(a) * 9, 0.03, -2 + Math.sin(a) * 9); s.add(sp); }
    const fb = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.7, 28), M('#cfc8b6')); fb.position.set(x, 0.35, -8); s.add(fb);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.12, 28), M('#5ab0e0', { roughness: 0.1 })); water.position.set(x, 0.72, -8); s.add(water);
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.28, 2.0, 12), M('#bfe3f2', { transparent: true, opacity: 0.7 })); jet.position.set(x, 1.6, -8); s.add(jet);
    const cols = ['#f2e6c8', '#e8a5b8', '#9cc7e0', '#f5d76e', '#c6e0a8'];
    for (let i = -3; i <= 3; i++) { const h = box(7, 7 + (Math.abs(i) % 2) * 2, 4, cols[(i + 3) % cols.length]); h.position.set(x + i * 8, h.geometry.parameters.height / 2, -20); s.add(h); const rf = new THREE.Mesh(new THREE.ConeGeometry(5.4, 2.4, 4), M('#b5502e')); rf.rotation.y = Math.PI / 4; rf.position.set(x + i * 8, h.geometry.parameters.height + 1.2, -20); s.add(rf); }
    [[-13, -9], [13, -9], [-15, 2], [15, 2]].forEach(([dx, dz]) => { const tr = box(0.5, 3, 0.5, '#6a4a2a'); tr.position.set(x + dx, 1.5, dz); s.add(tr); const fo = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), M('#3f8f3a', { flatShading: true })); fo.position.set(x + dx, 4.2, dz); s.add(fo); });
    for (let i = 0; i < 3; i++) { const bn = box(3, 0.16, 0.9, '#8a5a30'); bn.position.set(x - 9 + i * 9, 0.7, 6); s.add(bn); [-1.2, 1.2].forEach((dx) => { const l = box(0.14, 0.7, 0.7, '#4a3018'); l.position.set(x - 9 + i * 9 + dx, 0.35, 6); s.add(l); }); }
    // bandeirinhas de festa
    for (let i = 0; i < 18; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 3), M(['#e5202a', '#ffd24a', '#2b7fd9', '#3ad9a4'][i % 4])); f.position.set(x - 14 + i * 1.65, 7.4 - Math.sin((i / 17) * Math.PI) * 1.1, -4); f.rotation.z = Math.PI; s.add(f); }
  }

  // ------------------------------------------------------------- controle
  reset() {
    this.npcs.forEach((c) => { c.root.visible = false; c.sit = false; Object.keys(c.pose).forEach((k) => { if (k !== 'smile') c.pose[k] = 0; c.cur[k] = c.pose[k]; }); c.root.rotation.set(0, 0, 0); c.pose.smile = 0.3; });
    this.tito.root.visible = false; this.tito.sit = false;
    Object.keys(this.tito.pose).forEach((k) => { if (k !== 'smile') this.tito.pose[k] = 0; });
    this.tito.root.rotation.set(0, 0, 0);
    this.pizza.visible = false;
  }

  // coloca um figurante (índice do elenco) em uma posição
  put(i, x, z, ry = 0, y = 0) { const c = this.npcs[i]; c.root.visible = true; c.root.position.set(x, y, z); c.root.rotation.set(0, ry, 0); c.sit = false; return c; }
  putTito(x, z, ry = 0) { this.tito.root.visible = true; this.tito.root.position.set(x, 0, z); this.tito.root.rotation.set(0, ry, 0); return this.tito; }
  seat(c, seatY = 0.88) { c.sit = true; c.root.position.y = seatY - (c.hips.userData.y0 ?? 0.65) * c.root.scale.y; }

  update(t, dt) {
    const all = [this.tito, ...this.npcs];
    all.forEach((c) => {
      if (!c.root.visible) return;
      c.update(t, dt);
      if (c.sit) { c.legs.forEach(({ hip }) => { hip.rotation.x = -1.45; }); }
    });
    this.moto.rotation.y = 0;
    void lerp;
  }
}
