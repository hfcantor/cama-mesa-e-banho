// Cômodo genérico para os episódios "E se você nunca lavasse…?".
// A casca (piso, paredes, janela, calendário, porta, luzes, Tito, ácaros-herói,
// enxame, prédio de ácaros, neon, selva, moscas, partículas) é igual para todos;
// cada cenário (dormitório, banheiro, cozinha) só acrescenta os móveis e os
// tecidos que sujam (this.cloth). Tudo é função de `state`, mexido pelas cenas.
import * as THREE from 'three';
import { rng } from '../textures.js';
import { Particles } from '../particles.js';
import { Character } from '../characters.js';
import { makeMite, moodMite, animMite, mix } from './quarto.js';
import { paintCloth, makeCloth, makeCanvas } from '../cloth.js';

export const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
export const lerp = (a, b, k) => a + (b - a) * k;
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const tex = (c, repeat) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t; };
const back = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2); // easeOutBack

function windowsTexture() {
  const c = makeCanvas(128, 512), g = c.getContext('2d'), r = rng(9);
  g.fillStyle = '#c9b48d'; g.fillRect(0, 0, 128, 512);
  for (let y = 12; y < 500; y += 34) for (let x = 10; x < 120; x += 28) { g.fillStyle = r() > 0.25 ? '#ffcf5a' : '#6b5a3a'; g.fillRect(x, y, 16, 20); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function signTexture(l1, l2) {
  const c = makeCanvas(1024, 256), g = c.getContext('2d');
  g.fillStyle = '#1b0f2a'; g.fillRect(0, 0, 1024, 256);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const fit = (txt, max, base) => { let s = base; g.font = `${s}px Anton, Impact, sans-serif`; while (g.measureText(txt).width > max && s > 30) { s -= 4; g.font = `${s}px Anton, Impact, sans-serif`; } return s; };
  fit(l1, 900, 110); g.shadowColor = '#ff3d9a'; g.shadowBlur = 34; g.fillStyle = '#ffd1ea'; g.fillText(l1, 512, 78);
  fit(l2, 900, 86); g.shadowColor = '#37e1ff'; g.fillStyle = '#d1f6ff'; g.fillText(l2, 512, 190);
  g.shadowBlur = 0; g.strokeStyle = '#ff3d9a'; g.lineWidth = 8; g.strokeRect(10, 10, 1004, 236);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function calendarTexture(c, num, label) {
  const g = c.getContext('2d');
  g.fillStyle = '#fdfaf2'; g.fillRect(0, 0, 256, 300);
  g.fillStyle = '#d63a30'; g.fillRect(0, 0, 256, 70);
  g.fillStyle = '#fff'; g.font = `900 ${String(label).length > 8 ? 30 : 42}px Montserrat, Arial Black, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, 128, 36);
  g.fillStyle = '#2a2a2a'; g.font = '900 150px Anton, Impact, sans-serif'; g.fillText(String(num), 128, 184);
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 300);
}

export class RoomWorld {
  // o: { w, d, h, cz, floor, wall, win:{x,y,w,h}|null, cal:{x,y}, doorZ, bg, lamp:[x,y,z] }
  constructor(o) {
    const s = this.scene = new THREE.Scene();
    this.cfg = o;
    this.bloom = { strength: 0.35, radius: 0.5, threshold: 0.9 };
    this.exposure = 1.1;
    s.background = new THREE.Color(o.bg || '#2a1d14');
    s.fog = new THREE.Fog('#2a1d14', 9, 22);
    const { w: RW, d: RD, h: RH, cz: RZ } = o;
    this.RW = RW; this.RD = RD; this.RH = RH; this.RZ = RZ;
    this.cloths = [];

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), M('#ffffff', { map: o.floor, roughness: 0.55 }));
    floor.rotation.x = -Math.PI / 2; floor.position.z = RZ; floor.receiveShadow = true; s.add(floor);
    const wallMat = M('#ffffff', { map: o.wall, roughness: 0.95 });
    const mkWall = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; s.add(m); return m; };
    const BZ = RZ - RD / 2; this.backZ = BZ;
    mkWall(RW, RH, 0, RH / 2, BZ, 0);
    mkWall(RD, RH, -RW / 2, RH / 2, RZ, Math.PI / 2);
    mkWall(RD, RH, RW / 2, RH / 2, RZ, -Math.PI / 2);
    mkWall(RW, RH, 0, RH / 2, RZ + RD / 2, Math.PI);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), M('#efe3cf', { roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, RH, RZ); s.add(ceil);

    // janela
    this.glassMat = new THREE.MeshBasicMaterial({ color: '#0e1a3a', fog: false });
    this.stars = null;
    if (o.win) {
      const win = this.win = new THREE.Group(); win.position.set(o.win.x, o.win.y, BZ + 0.02); s.add(win);
      const fm = M('#f3ece0', { roughness: 0.7 }), ww = o.win.w, wh = o.win.h;
      [[0, wh / 2, ww, 0.08], [0, -wh / 2, ww, 0.08], [-ww / 2, 0, 0.08, wh], [ww / 2, 0, 0.08, wh], [0, 0, 0.04, wh]].forEach(([x, y, w, h]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), fm); f.position.set(x, y, 0.02); win.add(f); });
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.06, wh - 0.06), this.glassMat); glass.position.z = -0.01; win.add(glass);
      const sc = makeCanvas(128, 128), sg = sc.getContext('2d'), rr = rng(4); sg.fillStyle = '#fff';
      for (let i = 0; i < 26; i++) { sg.globalAlpha = 0.4 + rr() * 0.6; sg.fillRect(rr() * 128, rr() * 128, 2, 2); }
      this.stars = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.06, wh - 0.06), new THREE.MeshBasicMaterial({ map: tex(sc), transparent: true, fog: false })); this.stars.position.z = -0.005; win.add(this.stars);
    }

    // calendário de parede
    this.cal = new THREE.Group(); this.cal.position.set(o.cal.x, o.cal.y, BZ + 0.04); s.add(this.cal);
    this.calCanvasA = makeCanvas(256, 300); this.calCanvasB = makeCanvas(256, 300);
    this.calTexA = tex(this.calCanvasA); this.calTexB = tex(this.calCanvasB);
    const cb = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.66), new THREE.MeshStandardMaterial({ map: this.calTexB, roughness: 0.8 })); cb.position.z = 0.012;
    this.calPageHinge = new THREE.Group(); this.calPageHinge.position.set(0, 0.33, 0.02);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.66), new THREE.MeshStandardMaterial({ map: this.calTexA, roughness: 0.8, side: THREE.DoubleSide })); front.position.y = -0.33;
    this.calPageHinge.add(front);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.74, 0.02), M('#8a5a3a'));
    const rings = [-0.18, 0, 0.18].map(x => { const rg = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 12), M('#222')); rg.position.set(x, 0.33, 0.03); return rg; });
    this.cal.add(board, cb, this.calPageHinge, ...rings);

    // porta (parede direita)
    this.door = new THREE.Group(); this.door.position.set(RW / 2 - 0.02, 0, o.doorZ); s.add(this.door);
    const hall = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.1), new THREE.MeshBasicMaterial({ color: '#f6e3b8' })); hall.position.set(0.04, 1.05, 0.55); hall.rotation.y = -Math.PI / 2; this.door.add(hall);
    const dFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 1.2), M('#f3ece0')); dFrame.position.set(0.03, 1.1, 0.55); dFrame.scale.x = 0.4; this.door.add(dFrame);
    this.doorPanel = new THREE.Group(); this.doorPanel.position.set(0, 0, 1.12);
    const dp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.1, 1.1), M('#a8794d')); dp.position.set(-0.02, 1.05, -0.55); this.doorPanel.add(dp);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), M('#e0c060', { metalness: 0.6, roughness: 0.3 })); knob.position.set(-0.08, 1.0, -0.95); this.doorPanel.add(knob);
    this.door.add(this.doorPanel);

    // luzes
    this.hemi = new THREE.HemisphereLight('#ffe9d0', '#8a6a50', 0.85); s.add(this.hemi);
    const lp = o.lamp || [1.2, 1.5, BZ + 0.5];
    this.lamp = new THREE.PointLight('#ffb65a', 12, 7, 1.5); this.lamp.position.set(...lp); s.add(this.lamp);
    this.sun = new THREE.DirectionalLight('#fff0d0', 0); this.sun.position.set(-3, 3.4, BZ - 2); this.sun.target.position.set(0, 0.6, BZ + 1.5);
    this.sun.castShadow = true; const sc2 = this.sun.shadow.camera; sc2.left = -3; sc2.right = 3; sc2.top = 3; sc2.bottom = -3; sc2.near = 0.5; sc2.far = 14; this.sun.shadow.mapSize.set(1024, 1024); this.sun.shadow.bias = -0.0008;
    s.add(this.sun, this.sun.target);
    this.key = new THREE.PointLight('#fff2dc', 10, 12, 1.4); this.key.position.set(0.4, RH - 0.3, RZ); s.add(this.key);
    this.sick = new THREE.PointLight('#8fb040', 0, 6, 1.6); this.sick.position.set(0, 1.0, BZ + 1.2); s.add(this.sick);

    // Tito
    this.tito = new Character({ kid: true, shirt: '#4a86d6', pants: '#3a4a8a', skin: '#c68a5c', hair: '#2a1a12', scale: 0.92 });
    s.add(this.tito.root);

    // valores padrão que os cenários sobrescrevem
    this.area = { x0: -0.6, x1: 0.6, y0: 0.05, y1: 0.05, z0: BZ + 1, z1: BZ + 2, wall: false };
    this.headPos = [0, 1.3, BZ + 1.5];
    this.towerPos = [0, 0, BZ + 1.5];
    this.signPos = [0, 1.6, BZ + 0.1];
    this.stovePos = [0.7, 0.4, BZ + 1.0];
    this.showerPos = null;
  }

  // ---- chamado pelo cenário depois de montar os móveis ----
  finish() {
    const s = this.scene, rr = rng(77), A = this.area;
    // enxame
    this.swarm = [];
    for (let i = 0; i < 34; i++) {
      const m = makeMite({ tint: ['#cdbfe0', '#c3d2e6', '#d8c2dc', '#bfcfdc'][i % 4] });
      moodMite(m, i % 5 === 0 ? 'cheer' : 'happy');
      m.hx = rr(); m.hy = rr(); m.hz = rr(); m.hs = 0.8 + rr() * 0.5; m.ang = rr() * 6.28; m.dirx = rr() > 0.5 ? 1 : -1;
      m.root.visible = false; s.add(m.root); this.swarm.push(m);
    }
    this.heroes = [{ chef: true }, { napkin: true }, { bag: true }, {}, { napkin: true, tint: '#d8c2dc' }].map(d => { const m = makeMite(d); m.root.visible = false; s.add(m.root); return m; });

    // cozinha de ácaros (fogão + panelas) e placa de neon
    this.kitchen = new THREE.Group(); this.kitchen.visible = false; s.add(this.kitchen);
    const [sx, sy, sz] = this.stovePos;
    const stove = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.2), M('#bbbbc0', { metalness: 0.4, roughness: 0.4 })); stove.position.set(sx, sy, sz);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.07, 14), M('#555a66', { metalness: 0.5 })); pot.position.set(sx - 0.03, sy + 0.085, sz);
    const pot2 = pot.clone(); pot2.position.set(sx + 0.04, sy + 0.075, sz + 0.05); pot2.scale.setScalar(0.8);
    this.kitchen.add(stove, pot, pot2);
    this.signMat = new THREE.MeshBasicMaterial({ map: signTexture('RESTAURANTE', 'DOS GERMES'), toneMapped: false });
    this.neon = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), this.signMat); this.neon.position.set(...this.signPos); this.neon.visible = false; s.add(this.neon);
    this.neonLight = new THREE.PointLight('#ff3d9a', 0, 3, 1.6); this.neonLight.position.set(this.signPos[0], this.signPos[1] - 0.1, this.signPos[2] + 0.4); s.add(this.neonLight);
    this._sign = 'RESTAURANTE|DOS GERMES';

    // prédio de ácaros
    this.city = new THREE.Group(); s.add(this.city);
    const wt = windowsTexture(); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(1, 0.5);
    this.floors = [];
    for (let i = 0; i < 12; i++) {
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.46), new THREE.MeshStandardMaterial({ color: '#fff', map: wt, emissive: '#ffcf5a', emissiveMap: wt, emissiveIntensity: 0.9, roughness: 0.8 }));
      fl.visible = false; fl.castShadow = true; this.city.add(fl); this.floors.push(fl);
    }
    this.roof = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 4), M('#d63a30')); this.roof.rotation.y = Math.PI / 4; this.city.add(this.roof);

    // selva (brotos) e moscas
    this.sprouts = [];
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.3, 6), M('#4f7a2a')); stem.position.y = 0.15; g.add(stem);
      for (let k = 0; k < 3; k++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 5), M(['#5f9a30', '#7bb43a', '#3f7a2a'][k])); lf.position.set(Math.cos(k * 2.1) * 0.05, 0.3 + k * 0.03, Math.sin(k * 2.1) * 0.05); lf.rotation.set(Math.sin(k * 2.1) * 0.9, 0, -Math.cos(k * 2.1) * 0.9); g.add(lf); }
      g.position.set(lerp(A.x0, A.x1, rr()), A.y0, lerp(A.z0, A.z1, rr())); g.visible = false; s.add(g); this.sprouts.push({ g, k: rr() });
    }
    this.flies = [];
    for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M('#101010')); f.visible = false; s.add(f); this.flies.push({ m: f, ph: i * 0.9, rad: 0.3 + (i % 4) * 0.2 }); }

    // partículas
    this.flakes = new Particles(900, { soft: 0.4 }); this.sweat = new Particles(300, { soft: 0.8 });
    this.dust = new Particles(900, { soft: 1 }); this.smoke = new Particles(900, { soft: 1 });
    this.spores = new Particles(600, { soft: 0.6 }); this.steam = new Particles(400, { soft: 1 });
    this.water = new Particles(900, { soft: 0.9 });
    this.parts = [this.flakes, this.sweat, this.dust, this.smoke, this.spores, this.steam, this.water];
    this.parts.forEach(p => s.add(p.points));
    this.reset();
  }

  // ---- tecidos ----
  // cria o tecido `kind`, registra para repintar com a sujeira e devolve {mat,…}
  cloth(kind, o = {}) { const c = makeCloth(kind, o); this.cloths.push(c); return c; }
  // cópia "recém-lavada" de um objeto (aparece com `state.fresh`)
  fresh(rec, mesh) {
    const canvas = makeCanvas(rec.canvas.width, rec.canvas.height); paintCloth(canvas, rec.kind, { seed: rec.seed + 5, color: rec.color, n: rec.n });
    const mat = rec.mat.clone(); mat.map = tex(canvas);
    const fm = mesh.clone(); fm.material = mat; fm.visible = false; mesh.parent.add(fm);
    (this.freshPairs ||= []).push({ dirty: mesh, fresh: fm, s0: mesh.scale.clone() });
    return fm;
  }

  reset() {
    this.state = {
      dirt: 0, mold: 0, mood: 0, day: 0, lamp: 1, mites: 0, miteScale: 1, flee: 0, miteRun: 0,
      city: 0, neon: 0, jungle: 0, stink: 0, flies: 0, sweat: 0, flakes: 0, dust: 0, kitchen: 0,
      calNum: 0, calNext: 1, calFlip: 0, calLabel: 'DIA', doorOpen: 0, bedShake: 0, fresh: 0, shower: 0, bare: 0, steamAmt: 0, titoInBed: 1,
    };
    if (this.parts) this.parts.forEach(p => p.clear());
    if (this.heroes) this.heroes.forEach(h => { h.root.visible = false; });
    this._cloth = null; this._lastCal = null;
    this.hideTito();
    const t = this.tito; Object.keys(t.pose).forEach(k => { t.pose[k] = 0; }); t.pose.smile = 0.3; t.cur = { ...t.pose };
    if (this.onReset) this.onReset();
  }

  setTitoStanding(x, z, ry = 0) { const t = this.tito; t.root.position.set(x, 0, z); t.root.rotation.set(0, ry, 0); t.root.visible = true; }
  setTitoAt(pos, rot) { const t = this.tito; t.root.position.set(...pos); t.root.rotation.set(...rot); t.root.visible = true; }
  hideTito() { this.tito.root.visible = false; }
  hero(i, { pos, ry = 0, scale = 1, mood = 'happy', run = 0 } = {}) {
    const h = this.heroes[i]; if (!h) return h;
    if (!pos) { h.root.visible = false; return h; }
    h.root.visible = true; h.root.position.set(...pos); h.root.rotation.y = ry; h.root.scale.setScalar(scale); h.run = run;
    if (h.mood !== mood) moodMite(h, mood);
    return h;
  }
  // reposiciona a cozinha de ácaros e a placa de neon (perto do tecido em foco)
  setSet(stove, sign) {
    if (stove) { const o = this._stove0 ||= [...this.stovePos]; this.kitchen.position.set(stove[0] - o[0], stove[1] - o[1], stove[2] - o[2]); this.stovePos = [...stove]; }
    if (sign) { this.neon.position.set(...sign); this.neonLight.position.set(sign[0], sign[1] - 0.1, sign[2] + 0.4); }
  }
  setSign(l1, l2) { const k = `${l1}|${l2}`; if (k === this._sign) return; this._sign = k; this.signMat.map = signTexture(l1, l2); this.signMat.needsUpdate = true; }
  puff(pos, n = 80, speed = 1.2) { this.dust.emit({ pos, spread: 0.1, sphere: true, radial: true, vel: [0, 0.3, 0.6], velSpread: [speed, speed * 0.6, speed], life: 1.6, size: 0.12, sizeEnd: 0.5, color: [0.9, 0.85, 0.75, 0.45], colorEnd: [0.8, 0.75, 0.65, 0], drag: 1.6, count: n }); }

  _repaint() {
    const st = this.state, key = `${Math.round(st.dirt * 40)}|${Math.round(st.mold * 40)}`;
    if (key === this._cloth) return;
    this._cloth = key;
    this.cloths.forEach(c => { paintCloth(c.canvas, c.kind, { seed: c.seed, dirt: st.dirt, mold: st.mold, color: c.color, n: c.n }); c.tex.needsUpdate = true; });
  }

  update(t, dt, et, cam) {
    const st = this.state, A = this.area;
    this._repaint();
    const k2 = `${st.calNum}|${st.calNext}|${st.calLabel}`;
    if (k2 !== this._lastCal) { this._lastCal = k2; calendarTexture(this.calCanvasA, st.calNum, st.calLabel); calendarTexture(this.calCanvasB, st.calNext, st.calLabel); this.calTexA.needsUpdate = true; this.calTexB.needsUpdate = true; }
    const mood = st.mood, sunK = clamp01(st.day);

    // luz e clima
    this.sun.intensity = sunK * 3.2; this.sun.color.set(mix('#ffd9a0', '#fff6e0', sunK));
    this.hemi.intensity = lerp(0.55, 1.05, sunK) * (1 - mood * 0.25);
    this.hemi.color.set(mix('#ffe9d0', '#c8e0a0', mood)); this.hemi.groundColor.set(mix('#8a6a50', '#4a5a30', mood));
    this.lamp.intensity = 12 * st.lamp * (1 - sunK * 0.5);
    this.key.intensity = lerp(11, 7, mood) * lerp(1, 1.2, sunK); this.key.color.set(mix('#fff2dc', '#d6e8a8', mood));
    this.sick.intensity = mood * 5;
    this.exposure = lerp(1.15, 0.95, mood) * lerp(1, 1.1, sunK);
    this.glassMat.color.set(mix('#0e1a3a', '#8fd2ff', sunK)); if (this.stars) this.stars.visible = sunK < 0.5;
    this.scene.background.set(mix('#2a1d14', '#7a6a40', mood)); this.scene.fog.color.copy(this.scene.background);
    this.calPageHinge.rotation.x = -clamp01(st.calFlip) * 2.4; this.calPageHinge.position.y = 0.33 - clamp01(st.calFlip) * 0.05; this.calPageHinge.visible = st.calFlip < 0.98;
    this.doorPanel.rotation.y = -st.doorOpen * 1.45;

    // tecido novo "aparece" no lugar do sujo
    (this.freshPairs || []).forEach(({ dirty, fresh, s0 }) => {
      const f = clamp01(st.fresh);
      dirty.visible = f < 0.35; fresh.visible = f > 0.01;
      fresh.scale.copy(s0).multiplyScalar(Math.max(0.01, f > 0 ? back(clamp01(f * 1.6)) : 0));
    });

    if (this.onUpdate) this.onUpdate(t, dt, st);
    this.tito.update(t, dt);

    // enxame
    const n = Math.round(st.mites * this.swarm.length);
    this.swarm.forEach((m, i) => {
      m.root.visible = i < n; if (i >= n) return;
      m.ang += dt * 0.5 * m.dirx;
      let x = lerp(A.x0, A.x1, m.hx) + Math.cos(m.ang) * 0.06, z = lerp(A.z0, A.z1, m.hz) + Math.sin(m.ang) * 0.06, y = lerp(A.y0, A.y1, m.hy);
      if (st.flee > 0) { x += m.dirx * st.flee * (2.6 + (i % 5) * 0.2); z += st.flee * 0.8; y = lerp(y, 0.03, clamp01(st.flee * 1.5)); }
      m.root.position.set(x, y, z);
      m.root.rotation.y = st.flee > 0 ? (m.dirx > 0 ? Math.PI / 2 : -Math.PI / 2) : m.ang;
      m.root.scale.setScalar(st.miteScale * m.hs);
      animMite(m, t, dt, st.flee > 0 ? 1 : st.miteRun);
    });
    this.heroes.forEach(h => { if (h.root.visible) animMite(h, t, dt, h.run || 0); });

    // cozinha de ácaros e neon
    this.kitchen.visible = st.kitchen > 0.01; this.kitchen.scale.setScalar(Math.max(0.01, st.kitchen));
    this.neon.visible = st.neon > 0.01;
    const flick = st.neon * (0.75 + 0.25 * (Math.sin(t * 17) > -0.6 ? 1 : 0.2));
    this.signMat.color.setScalar(Math.max(0.05, flick)); this.neonLight.intensity = 8 * flick;
    if (st.kitchen > 0.5 && Math.random() < 0.5) this.steam.emit({ pos: [this.stovePos[0], this.stovePos[1] + 0.2, this.stovePos[2]], spread: 0.03, vel: [0, 0.35, 0], velSpread: 0.05, life: 1.6, size: 0.07, sizeEnd: 0.2, color: [1, 1, 1, 0.5], colorEnd: [1, 1, 1, 0], count: 1 });

    // prédio
    const tp = this.towerPos, fc = Math.round(st.city * this.floors.length);
    this.floors.forEach((f, i) => { f.visible = i < fc; const k = clamp01(st.city * this.floors.length - i); f.scale.set(1, Math.max(0.01, k), 1); f.position.set(tp[0], tp[1] + 0.1 * k + i * 0.2, tp[2]); });
    this.roof.visible = fc > 0; this.roof.position.set(tp[0], tp[1] + fc * 0.2 + 0.15, tp[2]);
    // selva e moscas
    this.sprouts.forEach(({ g, k }) => { const s = clamp01(st.jungle * 1.4 - k * 0.4); g.visible = s > 0.01; g.scale.setScalar(Math.max(0.01, s) * (0.7 + k * 0.7)); g.rotation.y = k * 6; });
    const cx = (A.x0 + A.x1) / 2, cz = (A.z0 + A.z1) / 2, cy = Math.max(A.y0, A.y1);
    this.flies.forEach((f, i) => { f.m.visible = st.flies > (i / this.flies.length); const a = t * (2 + i * 0.3) + f.ph; f.m.position.set(cx + Math.cos(a) * f.rad, cy + 0.5 + Math.sin(t * 3 + i) * 0.15 + (i % 3) * 0.12, cz + Math.sin(a * 1.3) * f.rad); });

    // partículas
    const R = Math.random, hp = this.headPos;
    if (st.sweat > 0.01 && R() < st.sweat) this.sweat.emit({ pos: hp, spread: [0.12, 0.05, 0.08], vel: [0, 0.25, 0.1], velSpread: 0.1, life: 0.9, size: 0.035, sizeEnd: 0.03, color: [0.6, 0.85, 1, 0.9], colorEnd: [0.7, 0.9, 1, 0], gravity: 2.5, count: 1 });
    const rx = () => lerp(A.x0, A.x1, R()), rz = () => lerp(A.z0, A.z1, R());
    if (st.flakes > 0.01 && R() < st.flakes) this.flakes.emit({ pos: [rx(), cy + 0.55 + R() * 0.4, rz()], spread: 0.1, vel: [0, -0.12, 0], velSpread: [0.05, 0.03, 0.05], life: 3.2, size: 0.03, sizeEnd: 0.026, color: [0.93, 0.85, 0.74, 0.95], colorEnd: [0.9, 0.82, 0.7, 0.4], gravity: 0.05, count: 3 });
    if (st.dust > 0.01 && R() < st.dust) this.dust.emit({ pos: [rx(), cy + 0.1, rz()], spread: 0.05, vel: [0, 0.7, 0], velSpread: [0.5, 0.35, 0.5], life: 2.2, size: 0.12, sizeEnd: 0.4, color: [0.8, 0.7, 0.55, 0.28], colorEnd: [0.7, 0.62, 0.5, 0], drag: 0.6, count: 4 });
    if (st.stink > 0.01 && R() < st.stink) this.smoke.emit({ pos: [rx(), cy + 0.1, rz()], spread: 0.08, vel: [0, 0.35, 0.1], velSpread: [0.18, 0.1, 0.18], life: 3.2, size: 0.25, sizeEnd: 0.9, color: [0.52, 0.72, 0.2, 0.34], colorEnd: [0.4, 0.55, 0.15, 0], drag: 0.3, count: 2 });
    if (st.mold > 0.3 && R() < st.mold * 0.5) this.spores.emit({ pos: [rx(), cy + 0.05, rz()], spread: 0.05, vel: [0, 0.2, 0], velSpread: [0.12, 0.08, 0.12], life: 3, size: 0.03, sizeEnd: 0.02, color: [0.55, 0.8, 0.25, 0.9], colorEnd: [0.5, 0.7, 0.2, 0], count: 1 });
    if (st.steamAmt > 0.01 && R() < st.steamAmt) this.steam.emit({ pos: [rx(), 1.2 + R() * 0.8, rz()], spread: 0.2, vel: [0, 0.25, 0], velSpread: 0.1, life: 2.4, size: 0.3, sizeEnd: 0.9, color: [1, 1, 1, 0.22], colorEnd: [1, 1, 1, 0], count: 2 });
    if (st.shower > 0.01 && this.showerPos && R() < st.shower) { const sp = this.showerPos; this.water.emit({ pos: sp, spread: [0.12, 0.02, 0.12], vel: [0, -2.2, 0.5], velSpread: [0.25, 0.3, 0.25], life: 0.9, size: 0.03, sizeEnd: 0.03, color: [0.65, 0.85, 1, 0.8], colorEnd: [0.7, 0.9, 1, 0], gravity: 3, count: 6 }); }
    this.parts.forEach(p => p.update(dt));
  }
}
