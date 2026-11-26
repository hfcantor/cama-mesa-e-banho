// Mundo "palco de fatos": um cenário montado por DADOS (episode.fato) com objetos da
// biblioteca fatoProps.js, céu/luz por preset, chão (terra/areia/lua/água…) e Tito.
//   fato = { sky, ground, water, props:[{id,type,pos,ry,s,o,v,hide}], fog }
// Os planos (factEpisode.js) só mudam valores: w.apply({id:{chave:valor}}), céu e estado.
import * as THREE from 'three';
import { skyDome, rng } from '../textures.js';
import { PROPS } from '../fatoProps.js';
import { FX } from '../fx.js';

const C = (s) => new THREE.Color(s);
// top, mid, bottom, brilho, intensidade do brilho, estrelas, neblina (cor, densidade), luz ambiente, luz direta (cor, intensidade), direção
export const SKIES = {
  day: { top: '#3d8be0', mid: '#86c1f0', bot: '#d9eefa', glow: '#fff4c8', ga: 0.35, stars: 0, fog: '#cfe6f5', fd: 0.006, amb: 1.05, sunC: '#fff6e0', sun: 2.6 },
  dusk: { top: '#2f2a6a', mid: '#c85a7c', bot: '#f6a85a', glow: '#ffb56a', ga: 0.7, stars: 0.2, fog: '#c47a6a', fd: 0.008, amb: 0.7, sunC: '#ffc890', sun: 1.8 },
  night: { top: '#0a1332', mid: '#1a3166', bot: '#38568f', glow: '#8fb0ff', ga: 0.35, stars: 1, fog: '#1b2d55', fd: 0.005, amb: 1.0, sunC: '#b4c6ff', sun: 1.8 },
  ash: { top: '#26201d', mid: '#54463d', bot: '#8a7a68', glow: '#ff8a3a', ga: 0.2, stars: 0, fog: '#4a3e36', fd: 0.014, amb: 0.55, sunC: '#ffb27a', sun: 0.9 },
  fire: { top: '#240808', mid: '#7a1f10', bot: '#ff7a2a', glow: '#ff9a3a', ga: 0.6, stars: 0, fog: '#5a1a10', fd: 0.01, amb: 0.55, sunC: '#ff9a5a', sun: 1.5 },
  gray: { top: '#6a727e', mid: '#9aa2ac', bot: '#c9cfd6', glow: '#ffffff', ga: 0.1, stars: 0, fog: '#aab1ba', fd: 0.009, amb: 1.0, sunC: '#f0f2f5', sun: 1.4 },
  toxic: { top: '#26352a', mid: '#587a4c', bot: '#a9c58a', glow: '#b5ff9a', ga: 0.3, stars: 0, fog: '#7e9a6a', fd: 0.01, amb: 0.9, sunC: '#e8ffd0', sun: 1.4 },
  eclipse: { top: '#02030a', mid: '#181030', bot: '#d08a46', glow: '#ffb060', ga: 0.9, stars: 0.7, fog: '#2a1e2a', fd: 0.004, amb: 0.35, sunC: '#ff9a50', sun: 0.5 },
  space: { top: '#010208', mid: '#02040c', bot: '#03060f', glow: '#3a3a8a', ga: 0.1, stars: 1, fog: '#000000', fd: 0, amb: 0.3, sunC: '#fff4e0', sun: 3.2 },
  redsky: { top: '#3a0a04', mid: '#a8280e', bot: '#ff8a2a', glow: '#ffd08a', ga: 0.8, stars: 0, fog: '#a8300e', fd: 0.004, amb: 0.8, sunC: '#ffb070', sun: 2.0 },
  lab: { top: '#1a2a4a', mid: '#2a3f6a', bot: '#3a5080', glow: '#8fb0ff', ga: 0.2, stars: 0.2, fog: '#1c2a46', fd: 0.003, amb: 1.1, sunC: '#ffffff', sun: 1.6 },
};
const GROUNDS = { sand: '#dcbd7e', grass: '#62ab4c', dirt: '#8c6c4b', stone: '#8d9098', moon: '#a9a59d', snow: '#eef2f6', road: '#4d5159', ash: '#6e6963', cobble: '#7d776b', floor: '#c9b79a', wood: '#9a6b3f' };

function groundTexture(kind, seed) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), r = rng(seed || 4);
  g.fillStyle = GROUNDS[kind] || '#888'; g.fillRect(0, 0, 256, 256);
  const dots = kind === 'moon' ? 260 : 500;
  for (let i = 0; i < dots; i++) { const k = r(); g.fillStyle = `rgba(${k > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.08})`; g.beginPath(); g.arc(r() * 256, r() * 256, 1 + r() * (kind === 'moon' ? 9 : 4), 0, 7); g.fill(); }
  if (kind === 'cobble') { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? 0 : 16; x < 256; x += 32) g.strokeRect(x, y, 32, 32); }
  if (kind === 'wood') { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; for (let x = 0; x < 256; x += 42) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } }
  if (kind === 'floor') { g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let i = 0; i < 256; i += 64) { g.strokeRect(i, 0, 64, 256); g.strokeRect(0, i, 256, 64); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(70, 70); t.anisotropy = 4; return t;
}

export class FatoWorld {
  constructor(shared) {
    const cfg = this.cfg = (window.__tabocal && window.__tabocal.episode && window.__tabocal.episode.fato) || {};
    const s = this.scene = new THREE.Scene();
    this.bloom = { strength: 0.5, radius: 0.55, threshold: 0.82 };
    this.exposure = cfg.exposure || 1.0;
    this.fogObj = s.fog = new THREE.FogExp2('#101830', 0.006);
    this.sky = skyDome(480); s.add(this.sky);
    this.hemi = new THREE.HemisphereLight('#bcd0ff', '#4a3f35', 1); s.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff', 2); this.sun.position.set(-30, 50, 40); s.add(this.sun);
    this.fill = new THREE.DirectionalLight('#9fb0ff', 0.5); this.fill.position.set(25, 12, 30); s.add(this.fill);

    // chão
    if (cfg.ground) {
      const gm = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ map: groundTexture(cfg.ground, cfg.seed), roughness: 1 }));
      gm.rotation.x = -Math.PI / 2; gm.position.y = cfg.groundY || 0; s.add(gm); this.groundMesh = gm;
    }
    // água
    if (cfg.water) {
      const wg = new THREE.PlaneGeometry(600, 600, 90, 90); wg.rotateX(-Math.PI / 2);
      this.waterBase = Float32Array.from(wg.attributes.position.array);
      this.water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: cfg.water.color || '#0e4660', roughness: 0.18, metalness: 0.3, transparent: true, opacity: 0.93 }));
      this.water.position.y = cfg.water.y || 0; s.add(this.water);
    }
    // estrelas/partículas globais
    this.gfx = { ash: FX.ash(), snow: FX.snow(), embers: FX.embers(), dust: FX.dust({ origin: [0, 1.5, 0], spread: [24, 1, 24], count: 200, vel: [-5, 0.3, 0], life: 4, s0: 3, s1: 7 }) };
    Object.values(this.gfx).forEach(f => s.add(f.points));

    // objetos
    this.items = []; this.byId = {};
    (cfg.props || []).forEach(r => {
      const mk = PROPS[r.type]; if (!mk) { console.warn('fato: tipo desconhecido', r.type); return; }
      const it = mk(r.o || {}, this);
      it.id = r.id; it.cfg = r; it.d = { ...it.v };
      it.base = { pos: r.pos || [0, 0, 0], ry: r.ry || 0, s: r.s ?? (r.type === 'char' ? ((r.o && r.o.scale) || 0.92) : 1) };
      s.add(it.g); this.items.push(it); if (r.id) this.byId[r.id] = it;
    });
    this.fxList = [];
    s.traverse(o => { if (o.isPoints && o.material.uniforms && o.material.uniforms.time) this.fxList.push(o.material.uniforms); });
    this.st = {};
    this.reset();
  }

  reset() {
    this.st = { ground: 1, skyA: this.cfg.sky || 'night', skyB: null, k: 0, ash: 0, snow: 0, embers: 0, dust: 0, waves: 1, fogMul: 1 };
    this.items.forEach(it => { it.v = { ...it.d, ...(it.cfg.v || {}) }; if (it.cfg.hide) it.v.vis = 0; else if (it.v.vis == null) it.v.vis = 1; it.fresh = true; });
  }

  // aplica valores: { id: { chave: valor } }
  apply(vals) {
    if (!vals) return;
    for (const id in vals) { const it = this.byId[id]; if (!it) { console.warn('fato: objeto inexistente', id); continue; } Object.assign(it.v, vals[id]); if ('pose' in vals[id]) it.fresh = true; }
  }
  setV(id, key, val) { const it = this.byId[id]; if (it) it.v[key] = val; }

  _sky() {
    const st = this.st, A = SKIES[st.skyA] || SKIES.night, B = st.skyB ? (SKIES[st.skyB] || A) : A, k = st.skyB ? st.k : 0;
    const L = (key) => C(A[key]).lerp(C(B[key]), k), N = (key) => A[key] + (B[key] - A[key]) * k;
    const u = this.sky.material.uniforms;
    u.top.value.copy(L('top')); u.mid.value.copy(L('mid')); u.bottom.value.copy(L('bot')); u.glowColor.value.copy(L('glow')); u.glowAmt.value = N('ga'); u.starAmt.value = N('stars');
    const fogc = L('fog'); this.fogObj.color.copy(fogc); this.fogObj.density = N('fd') * (st.fogMul ?? 1);
    this.hemi.color.copy(L('mid')).lerp(C('#ffffff'), 0.5); this.hemi.groundColor.copy(L('bot')).multiplyScalar(0.5); this.hemi.intensity = N('amb');
    this.sun.color.copy(L('sunC')); this.sun.intensity = N('sun');
    this.fill.color.copy(L('top')).lerp(C('#ffffff'), 0.4); this.fill.intensity = 0.25 + 0.25 * N('amb');
    this.scene.background = null;
  }

  update(t, dt) {
    const st = this.st;
    this._sky();
    this.items.forEach(it => {
      const v = it.v, g = it.g, b = it.base;
      g.visible = v.vis !== 0;
      g.position.set(b.pos[0] + (v.x || 0), b.pos[1] + (v.y || 0), b.pos[2] + (v.z || 0));
      g.rotation.y = b.ry + (v.ry || 0);
      g.scale.setScalar(b.s * (v.s ?? 1));
      if (g.visible) it.upd && it.upd.call(it, v, t, dt, it, this);
    });
    if (this.groundMesh) this.groundMesh.visible = st.ground !== 0;
    this.gfx.ash.u.amt.value = st.ash; this.gfx.snow.u.amt.value = st.snow; this.gfx.embers.u.amt.value = st.embers; this.gfx.dust.u.amt.value = st.dust;
    const T = this.cfg.center || [0, 0, 0];
    Object.values(this.gfx).forEach(f => f.points.position.set(T[0], 0, T[2]));
    this.fxList.forEach(u => { u.time.value = t; });
    if (this.water) {
      const p = this.water.geometry.attributes.position, B = this.waterBase, A = (this.cfg.water.amp ?? 0.28) * st.waves;
      for (let i = 0; i < p.count; i++) { const x = B[i * 3], z = B[i * 3 + 2]; p.setY(i, (Math.sin(x * 0.22 + t * 1.3) * 0.5 + Math.sin(z * 0.31 + t * 0.9) * 0.35 + Math.sin((x + z) * 0.11 + t * 0.6) * 0.5) * A); }
      p.needsUpdate = true; this.water.geometry.computeVertexNormals();
    }
  }
}
