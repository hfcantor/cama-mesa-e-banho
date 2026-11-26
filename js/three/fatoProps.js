// Biblioteca de objetos do "palco de fatos": cada tipo devolve { g, v, upd(v, t, dt, inst, w) }.
//  g   = THREE.Group; v = valores animáveis (os planos mudam v.<chave>); upd roda todo quadro.
// Tudo é feito de formas simples e cores vivas (estilo cartoon), sem texturas externas.
import * as THREE from 'three';
import { Character } from './characters.js';
import { FX } from './fx.js';
import { rng, glowTexture, earthTextures, atmosphere } from './textures.js';
import { RECIPE_PROPS } from './receitaProps.js';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, ...o });
const EM = (c, i = 1, o = {}) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.6, ...o });
const mt = (c) => (typeof c === 'string' ? M(c) : c);
const add = (g, geometry, material, pos = [0, 0, 0], rot, scl) => {
  const m = new THREE.Mesh(geometry, mt(material)); m.position.set(...pos);
  if (rot) m.rotation.set(...rot); if (scl) m.scale.set(...scl); g.add(m); return m;
};
const bx = (g, w, h, d, c, p, r, s) => add(g, new THREE.BoxGeometry(w, h, d), c, p, r, s);
const cy = (g, rt, rb, h, c, p, r, s, seg = 20) => add(g, new THREE.CylinderGeometry(rt, rb, h, seg), c, p, r, s);
const sp = (g, rad, c, p, r, s) => add(g, new THREE.SphereGeometry(rad, 24, 16), c, p, r, s);
const cn = (g, rad, h, c, p, r, s, seg = 24) => add(g, new THREE.ConeGeometry(rad, h, seg), c, p, r, s);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
// haste entre dois pontos
function rod(g, a, b, rad, c) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 8), mt(c));
  m.position.copy(A.clone().add(B).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(m); return m;
}
function canvasTex(w, h, fn, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
// deformação contínua (não rasga geometrias sem índice)
function bump(geo, amp, f = 1.3) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + amp * (Math.sin(x * f * 1.7 + z * f * 2.3) * Math.cos(y * f * 1.9 + x * f * 1.1) + 0.5 * Math.sin(z * f * 3.1 + y * f * 2.7));
    p.setXYZ(i, x * k, y * (0.9 + 0.1 * k), z * k);
  }
  geo.computeVertexNormals(); return geo;
}
const sprite = (c0, size, op = 1, add_ = true) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(c0), blending: add_ ? THREE.AdditiveBlending : THREE.NormalBlending, transparent: true, depthWrite: false, opacity: op }));
  s.scale.set(size, size, 1); return s;
};
const wpos = (g, x, y, z) => { g.updateWorldMatrix(true, false); return new THREE.Vector3(x, y, z).applyMatrix4(g.matrixWorld); };

// ---- etiquetas/placas com texto desenhado em canvas ----
function drawTrefoil(g, w, h) {
  g.fillStyle = '#ffd21a'; g.fillRect(0, 0, w, h); g.lineWidth = w * 0.04; g.strokeStyle = '#111'; g.strokeRect(w * 0.03, h * 0.03, w * 0.94, h * 0.94);
  g.fillStyle = '#111'; const cx = w / 2, cy_ = h / 2, R = w * 0.4;
  for (let i = 0; i < 3; i++) { const a0 = i * 2.094 - 1.57 - 0.52; g.beginPath(); g.moveTo(cx, cy_); g.arc(cx, cy_, R, a0, a0 + 1.047); g.closePath(); g.fill(); }
  g.beginPath(); g.arc(cx, cy_, R * 0.2, 0, 7); g.fill(); g.fillStyle = '#ffd21a'; g.beginPath(); g.arc(cx, cy_, R * 0.12, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(cx, cy_, R * 0.1, 0, 7); g.fill();
}
function drawWarn(g, w, h) {
  g.fillStyle = '#ffd21a'; g.beginPath(); g.moveTo(w / 2, h * 0.04); g.lineTo(w * 0.97, h * 0.94); g.lineTo(w * 0.03, h * 0.94); g.closePath(); g.fill();
  g.lineWidth = w * 0.045; g.strokeStyle = '#111'; g.lineJoin = 'round'; g.stroke();
  g.fillStyle = '#111'; g.font = `900 ${h * 0.62}px Montserrat, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', w / 2, h * 0.64);
}
function drawText(g, w, h, text, bg, fg, font = 'Anton') {
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = h * 0.7; g.font = `${size}px ${font}, Impact, sans-serif`;
  while (g.measureText(text).width > w * 0.92 && size > 12) { size -= 4; g.font = `${size}px ${font}, Impact, sans-serif`; }
  g.fillText(text, w / 2, h * 0.54);
}

export const PROPS = {
  // ------------------------------------------------------------------ placas
  sign(o) {
    const g = new THREE.Group(), W = o.w || 4, H = o.h || 1.4, kind = o.kind || 'text';
    const draw = (g2, w, h, text) => (kind === 'trefoil' ? drawTrefoil(g2, w, h) : kind === 'warn' ? drawWarn(g2, w, h) : drawText(g2, w, h, text, o.bg ?? '#111', o.fg || '#fff', o.font));
    const tex = canvasTex(512, Math.round(512 * H / W), (g2, w, h) => draw(g2, w, h, o.text || ''));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: kind === 'warn', toneMapped: false }));
    m.position.y = (o.pole || 0) + H / 2; g.add(m);
    if (o.pole) { cy(g, 0.06, 0.06, o.pole + 0.1, '#444', [0, o.pole / 2, 0]); }
    const inst = { g, v: { text: o.text || '' }, last: o.text || '', upd(v) { if (v.text !== this.last && kind === 'text') { this.last = v.text; const c = tex.image; draw(c.getContext('2d'), c.width, c.height, v.text); tex.needsUpdate = true; } } };
    return inst;
  },

  // ------------------------------------------------------------------ navio (Titanic)
  ship(o) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const sh = new THREE.Shape(); sh.moveTo(-9, -1.6); sh.lineTo(7, -1.6); sh.quadraticCurveTo(10.6, -1.3, 11.6, 0); sh.quadraticCurveTo(10.6, 1.3, 7, 1.6); sh.lineTo(-9, 1.6); sh.closePath();
    const hull = new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false }); hull.rotateX(-Math.PI / 2);
    add(body, hull, M('#a3281f'), [0, 0, 0], null, [1.003, 0.28, 1.003]);
    add(body, hull, M('#2c303b'), [0, 0.6, 0], null, [1, 0.73, 1]);
    bx(body, 15, 1.1, 2.5, '#f4f1ea', [-1, 2.75, 0]); bx(body, 11, 0.9, 2.1, '#f4f1ea', [-1.5, 3.75, 0]); bx(body, 2.8, 0.9, 2.2, '#f4f1ea', [6.4, 3.6, 0]);
    bx(body, 3.2, 0.5, 2.0, '#d9b98a', [6.4, 4.3, 0]);
    [-5, -2, 1, 4].forEach((x, i) => { cy(body, 0.85, 0.95, 4.2, '#e3a22f', [x, 6.0, 0]); cy(body, 0.87, 0.87, 0.6, '#111', [x, 8.0, 0]); });
    cy(body, 0.07, 0.07, 6, '#ddd', [8.6, 6, 0]); cy(body, 0.07, 0.07, 5, '#ddd', [-8, 5.5, 0]);
    for (let i = 0; i < 8; i++) { const x = -6 + i * 1.7; [-1, 1].forEach(s => bx(body, 0.9, 0.3, 0.4, '#f1e9d6', [x, 3.45, s * 1.3])); }
    const wt = canvasTex(512, 16, (g2, w, h) => { g2.fillStyle = 'rgba(0,0,0,0)'; g2.clearRect(0, 0, w, h); g2.fillStyle = '#ffd37a'; for (let x = 4; x < w; x += 12) g2.fillRect(x, 3, 7, 9); });
    const wm = new THREE.MeshBasicMaterial({ map: wt, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false });
    [[2.82, 1.27], [3.82, 1.07]].forEach(([y, z]) => [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.PlaneGeometry(o.deckW || 13, 0.4), wm); p.position.set(-1, y, s * (z + 0.02)); if (s < 0) p.rotation.y = Math.PI; body.add(p); }));
    const nt = canvasTex(512, 64, (g2, w, h) => drawText(g2, w, h, o.name || 'TITANIC', null, '#f5f5f5'));
    [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.5), new THREE.MeshBasicMaterial({ map: nt, transparent: true, toneMapped: false })); p.position.set(4.2, 1.5, s * 1.58); p.rotation.y = s > 0 ? 0 : Math.PI; body.add(p); });
    const light = sprite('rgba(255,210,120,1)', 6, 0.0); light.position.set(-1, 4, 0); body.add(light);
    return {
      g, v: { tilt: 0, roll: 0, sink: 0, lights: 1 },
      upd(v, t) { body.position.y = -1.0 + v.sink + Math.sin(t * 0.8) * 0.06; body.rotation.z = v.tilt; body.rotation.x = v.roll + Math.sin(t * 0.6) * 0.008; wm.opacity = v.lights; light.material.opacity = 0.25 * v.lights; },
    };
  },

  iceberg(o) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(bump(new THREE.IcosahedronGeometry(3, 2), 0.16, 0.9), M('#eef8ff', { flatShading: true, roughness: 0.45 })); top.scale.set(1, 1.2, 1); top.position.y = 1.4; g.add(top);
    const peak = new THREE.Mesh(bump(new THREE.IcosahedronGeometry(1.6, 1), 0.2, 1.1), M('#ffffff', { flatShading: true, roughness: 0.4 })); peak.scale.set(0.9, 1.6, 0.9); peak.position.set(-1.1, 3.6, 0.4); g.add(peak);
    const under = new THREE.Mesh(bump(new THREE.IcosahedronGeometry(6, 2), 0.14, 0.7), M('#7fc4e8', { flatShading: true, roughness: 0.4, transparent: true, opacity: 0.55 })); under.scale.set(1.1, 1.3, 1); under.position.y = -5.2; g.add(under);
    return { g, v: { under: 1 }, upd(v) { under.visible = v.under > 0; } };
  },

  // ------------------------------------------------------------------ vulcão
  volcano(o) {
    const g = new THREE.Group(), R = o.r || 9, H = o.h || 12;
    const geo = new THREE.CylinderGeometry(R * 0.16, R, H, 40, 8); bump(geo, 0.07, 0.6);
    const cone = new THREE.Mesh(geo, M(o.color || '#5b4036', { flatShading: true })); cone.position.y = H / 2; g.add(cone);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(R * 0.17, 0.35, 8, 24), M('#3d2a24')); lip.rotation.x = Math.PI / 2; lip.position.y = H - 0.05; g.add(lip);
    const lava = new THREE.Mesh(new THREE.CircleGeometry(R * 0.16, 24), EM('#ff5a14', 1.4)); lava.rotation.x = -Math.PI / 2; lava.position.y = H + 0.05; g.add(lava);
    const glow = sprite('rgba(255,110,30,1)', R * 2.2, 0); glow.position.y = H + 1; g.add(glow);
    const fire = FX.fire({ count: 140, life: 1.6, origin: [0, H, 0], spread: [R * 0.12, 0, R * 0.12], vel: [0, 9, 0], velSpread: [3.5, 3, 3.5], gravity: [0, -6, 0], s0: 1.6, s1: 0.5 });
    const smoke = FX.smoke({ count: 90, life: 6, origin: [0, H, 0], spread: [R * 0.1, 0, R * 0.1], vel: [0, 5.5, 0], velSpread: [1.4, 1, 1.4], s0: 3, s1: 12, c0: [0.2, 0.17, 0.16, 0.85], c1: [0.36, 0.33, 0.3, 0] });
    g.add(fire.points, smoke.points);
    g.userData.fx = [fire, smoke];
    return { g, v: { erupt: 0, glow: 0 }, upd(v) { fire.u.amt.value = v.erupt; smoke.u.amt.value = v.erupt > 0 ? 0.3 + 0.7 * v.erupt : 0; glow.material.opacity = Math.max(v.glow, v.erupt * 0.9); lava.material.emissiveIntensity = 0.6 + v.glow + v.erupt; } };
  },

  // ------------------------------------------------------------------ usina nuclear (cartoon)
  reactor(o) {
    const g = new THREE.Group();
    bx(g, 9, 5, 6, '#a7a49c', [0, 2.5, 0]); bx(g, 3, 4, 5.6, '#8d8a83', [5.5, 2, 0]);
    for (let i = 0; i < 5; i++) bx(g, 0.5, 3.2, 0.1, '#6f6d66', [-3.6 + i * 1.8, 2.4, 3.03]);
    const roof = new THREE.Group(); roof.position.y = 5; g.add(roof);
    bx(roof, 7, 1.6, 5, '#8d8a83', [-0.5, 0.8, 0]); bx(roof, 7.4, 0.3, 5.4, '#6b6963', [-0.5, 1.7, 0]);
    for (let i = 0; i < 5; i++) cy(g, 1.0 - i * 0.06, 1.0 - (i + 1) * 0.06, 3.2, i % 2 ? '#f2f2f2' : '#c8321f', [-6.5, 1.6 + i * 3.2, 0]);
    const glow = sprite('rgba(120,255,170,1)', 16, 0); glow.position.set(0, 7, 1); g.add(glow);
    const smoke = FX.white({ count: 80, origin: [-0.5, 6.5, 0], s0: 2, s1: 9, vel: [0, 3, 0], c0: [0.75, 0.78, 0.74, 0.7] }); g.add(smoke.points);
    const sparks = FX.sparks({ count: 70, origin: [-0.5, 6, 0], vel: [0, 8, 0], velSpread: [3, 3, 3], s0: 0.2 }); g.add(sparks.points);
    return { g, v: { glow: 0, smoke: 0, sparks: 0, blast: 0 }, upd(v, t) { roof.position.y = 5 + v.blast * 2.5; roof.rotation.z = v.blast * 0.45; roof.rotation.x = v.blast * 0.1; glow.material.opacity = v.glow * (0.7 + 0.3 * Math.sin(t * 9)); smoke.u.amt.value = v.smoke; sparks.u.amt.value = v.sparks; } };
  },

  block(o) {
    const g = new THREE.Group(), W = o.w || 3.6, H = o.h || 9, D = o.d || 9;
    const lit = canvasTex(128, 256, (g2, w, h) => { g2.fillStyle = '#000'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#ffd88a'; const r = rng(o.seed || 3); for (let y = 12; y < h - 12; y += 24) for (let x = 12; x < w - 12; x += 26) if (r() > 0.35) g2.fillRect(x, y, 14, 14); });
    const map = canvasTex(128, 256, (g2, w, h) => { g2.fillStyle = o.color || '#c9c3b4'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#4b5666'; for (let y = 12; y < h - 12; y += 24) for (let x = 12; x < w - 12; x += 26) g2.fillRect(x, y, 14, 14); g2.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = 0; y < h; y += 24) g2.fillRect(0, y, w, 2); });
    const mat = new THREE.MeshStandardMaterial({ map, emissiveMap: lit, emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.9 });
    add(g, new THREE.BoxGeometry(W, H, D), mat, [0, H / 2, 0]);
    bx(g, W + 0.2, 0.3, D + 0.2, '#6f6a60', [0, H + 0.15, 0]);
    return { g, v: { lit: o.lit ?? 0, dark: 0 }, upd(v) { mat.emissiveIntensity = v.lit; mat.color.setScalar(1 - v.dark * 0.55); } };
  },

  ferris(o) {
    const g = new THREE.Group(), R = o.r || 4, wheel = new THREE.Group(); wheel.position.y = R + 1.2; g.add(wheel);
    [-0.3, 0.3].forEach(z => { const t = new THREE.Mesh(new THREE.TorusGeometry(R, 0.09, 8, 48), M('#d8d2c0')); t.position.z = z; wheel.add(t); });
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; [-0.3, 0.3].forEach(z => rod(wheel, [0, 0, z], [Math.cos(a) * R, Math.sin(a) * R, z], 0.04, '#d8d2c0')); const cab = bx(wheel, 0.9, 0.7, 0.7, ['#e8453c', '#f2c230', '#3b82d6', '#58b86a'][i % 4], [Math.cos(a) * R, Math.sin(a) * R, 0]); cab.userData.a = a; }
    rod(g, [0, R + 1.2, -0.5], [-2, 0, -1.2], 0.1, '#bbb'); rod(g, [0, R + 1.2, -0.5], [2, 0, -1.2], 0.1, '#bbb'); rod(g, [0, R + 1.2, 0.5], [-2, 0, 1.2], 0.1, '#bbb'); rod(g, [0, R + 1.2, 0.5], [2, 0, 1.2], 0.1, '#bbb');
    return { g, v: { spin: 0.15 }, upd(v, t) { wheel.rotation.z = t * v.spin; wheel.children.forEach(c => { if (c.userData.a != null) c.rotation.z = -t * v.spin; }); } };
  },

  // ------------------------------------------------------------------ espaço: foguete, módulo lunar, bandeira
  saturn(o) {
    const g = new THREE.Group();
    const W = '#f2f2ee', K = '#1a1a1d';
    cy(g, 1.5, 1.7, 10, W, [0, 5, 0]); cy(g, 1.52, 1.52, 1.2, K, [0, 3.2, 0]); cy(g, 1.52, 1.52, 1.2, K, [0, 7.6, 0]);
    cy(g, 1.3, 1.5, 6, W, [0, 13, 0]); cy(g, 1.32, 1.32, 0.8, K, [0, 14.4, 0]);
    cy(g, 1.05, 1.3, 3, W, [0, 17.5, 0]); cy(g, 1.05, 1.05, 0.5, '#2a2a2a', [0, 19.3, 0]);
    cn(g, 1.05, 2.2, '#e8e8e4', [0, 20.6, 0]); cy(g, 0.05, 0.05, 3, '#ccc', [0, 23.1, 0]); cn(g, 0.12, 0.5, '#d33', [0, 24.8, 0]);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const f = bx(g, 0.15, 2.6, 1.7, K, [Math.cos(a) * 2.0, 1.3, Math.sin(a) * 2.0]); f.rotation.y = -a; }
    const flame = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1.4, 5, 16, 1, true), EM('#ffb13a', 1.6, { transparent: true, opacity: 0.9, side: THREE.DoubleSide })); flame.position.y = -2.4; g.add(flame);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.8, 4, 16), EM('#fff4c8', 1.8, { transparent: true, opacity: 0.95 })); core.position.y = -2; g.add(core);
    const smoke = FX.white({ count: 110, life: 4, origin: [0, 0.5, 0], spread: [1.4, 0, 1.4], vel: [0, 1, 0], velSpread: [5, 1, 5], s0: 3, s1: 11, c0: [0.95, 0.93, 0.9, 0.8] }); g.add(smoke.points);
    const glow = sprite('rgba(255,170,70,1)', 14, 0); glow.position.y = -1; g.add(glow);
    return { g, v: { thrust: 0 }, upd(v, t) { const k = v.thrust; flame.visible = core.visible = k > 0.01; flame.scale.set(k, k * (0.9 + 0.2 * Math.sin(t * 40)), k); core.scale.set(k, k, k); smoke.u.amt.value = k; glow.material.opacity = 0.8 * k; } };
  },

  lander(o) {
    const g = new THREE.Group();
    cy(g, 1.4, 1.5, 1.2, '#d9a82b', [0, 2.1, 0], null, null, 8); bx(g, 1.8, 1.1, 1.8, '#c9cdd2', [0, 3.25, 0]); cy(g, 0.6, 0.8, 0.5, '#bfc3c8', [0, 3.95, 0], null, null, 8);
    bx(g, 0.5, 0.35, 0.05, '#243246', [0, 3.35, 0.92]); cn(g, 0.55, 0.7, '#555', [0, 1.1, 0], [Math.PI, 0, 0]);
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([x, z]) => { rod(g, [x * 0.9, 2.2, z * 0.9], [x * 2.3, 0.15, z * 2.3], 0.07, '#d9a82b'); cy(g, 0.5, 0.5, 0.1, '#b5b8bc', [x * 2.3, 0.05, z * 2.3]); });
    rod(g, [0, 2.0, 1.4], [0, 0.2, 2.3], 0.05, '#aaa');
    return { g, v: {}, upd() {} };
  },

  flag(o) {
    const g = new THREE.Group();
    cy(g, 0.04, 0.04, 3.4, '#cfcfcf', [0, 1.7, 0]);
    const tex = canvasTex(256, 160, (g2, w, h) => { for (let i = 0; i < 13; i++) { g2.fillStyle = i % 2 ? '#fff' : '#c8322d'; g2.fillRect(0, i * h / 13, w, h / 13 + 1); } g2.fillStyle = '#2d3a7a'; g2.fillRect(0, 0, w * 0.42, h * 7 / 13); g2.fillStyle = '#fff'; for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) g2.fillRect(8 + x * 20 + (y % 2) * 10, 8 + y * 17, 5, 5); });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.2), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); f.position.set(0.95, 2.7, 0); g.add(f);
    cy(g, 0.02, 0.02, 1.9, '#ccc', [0.95, 3.3, 0], [0, 0, Math.PI / 2]);
    return { g, v: {}, upd() {} };
  },

  planet(o) {
    const g = new THREE.Group(), R = o.r || 5;
    let mat;
    if (o.kind === 'earth') { const et = earthTextures(512); mat = new THREE.MeshStandardMaterial({ map: et.map, roughness: 0.75 }); }
    else if (o.kind === 'moon') { const c = canvasTex(512, 256, (g2, w, h) => { g2.fillStyle = '#b9b6b0'; g2.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 140; i++) { const x = r() * w, y = r() * h, rr = 3 + r() * 16; g2.fillStyle = `rgba(80,78,74,${0.15 + r() * 0.25})`; g2.beginPath(); g2.arc(x, y, rr, 0, 7); g2.fill(); g2.strokeStyle = 'rgba(235,232,225,0.4)'; g2.lineWidth = 1.5; g2.beginPath(); g2.arc(x - 1, y - 1, rr, 0, 7); g2.stroke(); } }); mat = new THREE.MeshStandardMaterial({ map: c, roughness: 1 }); }
    else if (o.kind === 'venus') { const c = canvasTex(512, 256, (g2, w, h) => { g2.fillStyle = '#e8c27a'; g2.fillRect(0, 0, w, h); const r = rng(8); for (let i = 0; i < 90; i++) { const y = r() * h, th = 3 + r() * 14; g2.fillStyle = `rgba(${r() > 0.5 ? '255,236,180' : '170,110,50'},${0.12 + r() * 0.22})`; g2.beginPath(); g2.moveTo(0, y); for (let x = 0; x <= w; x += 16) g2.lineTo(x, y + Math.sin(x * 0.03 + i) * 6 * r() + th * Math.sin(x * 0.012 + i * 2)); g2.lineTo(w, y + th); g2.lineTo(0, y + th); g2.fill(); } }); mat = new THREE.MeshStandardMaterial({ map: c, roughness: 0.9 }); }
    else mat = M(o.color || '#c98a4a');
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), mat); g.add(mesh);
    let atmo = null; if (o.atmo) { atmo = atmosphere(R, o.atmo, 2.8, 1.5); g.add(atmo); }
    const heat = new THREE.Mesh(new THREE.SphereGeometry(R * 1.005, 48, 32), EM('#ff4a10', 1.6, { transparent: true, opacity: 0 })); g.add(heat);
    return { g, v: { heat: 0, spin: 0.05 }, upd(v, t) { mesh.rotation.y = t * v.spin; heat.material.opacity = v.heat * 0.75; if (atmo) atmo.visible = v.heat < 0.5; } };
  },

  sun(o) {
    const g = new THREE.Group(), R = o.r || 4;
    const tex = o.tex === 'granule' ? canvasTex(512, 256, (g2, w, h) => { g2.fillStyle = o.color || '#ff6a1a'; g2.fillRect(0, 0, w, h); const r = rng(11); for (let i = 0; i < 700; i++) { const k = r(); g2.fillStyle = `rgba(${k > 0.5 ? '255,200,80' : '150,30,10'},${0.1 + r() * 0.3})`; g2.beginPath(); g2.arc(r() * w, r() * h, 3 + r() * 14, 0, 7); g2.fill(); } }) : null;
    const disc = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), new THREE.MeshBasicMaterial({ color: tex ? '#ffffff' : (o.color || '#fff1b0'), map: tex, toneMapped: false })); g.add(disc);
    const glow = sprite(o.glow || 'rgba(255,220,140,1)', R * 5, 0.9); g.add(glow);
    const corona = sprite('rgba(255,255,255,1)', R * 7, 0); corona.position.z = -0.2; g.add(corona);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 40, 24), new THREE.MeshBasicMaterial({ color: '#030306', toneMapped: false })); moon.visible = false; g.add(moon);
    const beams = FX.sparks({ count: 140, life: 1.3, origin: [0, 0, 0], vel: [o.aim ? o.aim[0] : 0, o.aim ? o.aim[1] : -9, o.aim ? o.aim[2] : 2], velSpread: [0.4, 0.4, 0.4], gravity: [0, 0, 0], s0: 0.45, s1: 0.4, c0: [1, 0.95, 0.35, 0.9], c1: [0.7, 0.4, 1, 0], soft: 0.3, spread: [R, R, R] }); g.add(beams.points);
    return { g, v: { cover: 0, beams: 0, pulse: 0 }, upd(v, t) {
      moon.visible = v.cover > 0.001; moon.position.set(lerp(-R * 2.4, 0, v.cover), lerp(R * 0.3, 0, v.cover), R * 0.6);
      glow.material.opacity = 0.9 * (1 - 0.85 * clamp((v.cover - 0.5) * 2)); corona.material.opacity = clamp((v.cover - 0.93) * 14) * (0.8 + 0.2 * Math.sin(t * 3));
      const s = 1 + v.pulse * 0.05 * Math.sin(t * 2.4); disc.scale.setScalar(s); beams.u.amt.value = v.beams; } };
  },

  comet(o) {
    const g = new THREE.Group(), R = o.r || 0.7;
    const head = new THREE.Mesh(bump(new THREE.IcosahedronGeometry(R, 2), 0.18, 1.5), M('#e8f2ff', { emissive: '#8fb8ff', emissiveIntensity: 0.7, flatShading: true })); g.add(head);
    const hg = sprite('rgba(170,210,255,1)', R * 7, 0.9); g.add(hg);
    const tail = [];
    for (let i = 0; i < 36; i++) { const s = sprite(i % 2 ? 'rgba(150,200,255,0.9)' : 'rgba(220,235,255,0.8)', R * (4.6 - i * 0.11), 0.5 * (1 - i / 40)); s.position.set(-i * R * 0.95, Math.sin(i * 0.35) * R * 0.25, 0); g.add(s); tail.push(s); }
    return { g, v: {}, upd(v, t) { head.rotation.y = t; tail.forEach((s, i) => { s.position.y = Math.sin(i * 0.35 + t * 2) * R * (0.15 + i * 0.012); }); } };
  },

  // ------------------------------------------------------------------ casas (várias épocas)
  house(o) {
    const g = new THREE.Group(), W = o.w || 3, H = o.h || 3.2, D = o.d || 3, style = o.style || 'timber';
    const pal = { timber: ['#e6d3a3', '#8a3b2a', '#4a2f20'], roman: ['#e8c99a', '#b3492f', '#c0a070'], medieval: ['#b8ad98', '#5a4632', '#6a5f4c'], brick: ['#b0553d', '#4a4a52', '#7a3a2a'] }[style];
    const wallTex = canvasTex(256, 256, (g2, w, h) => {
      g2.fillStyle = pal[0]; g2.fillRect(0, 0, w, h);
      if (style === 'timber') { g2.fillStyle = pal[2]; for (let x = 0; x <= w; x += 85) g2.fillRect(x - 5, 0, 10, h); for (let y = 0; y <= h; y += 85) g2.fillRect(0, y - 5, w, 10); g2.strokeStyle = pal[2]; g2.lineWidth = 8; g2.beginPath(); g2.moveTo(0, h); g2.lineTo(85, h - 85); g2.moveTo(w, 0); g2.lineTo(w - 85, 85); g2.stroke(); }
      if (style === 'roman') { g2.fillStyle = '#b3492f'; g2.fillRect(0, h * 0.78, w, h * 0.22); g2.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 40; i++) g2.fillRect((i * 53) % w, (i * 91) % h, 30, 4); }
      if (style === 'medieval' || style === 'brick') { g2.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < h; y += 24) { g2.fillRect(0, y, w, 2); for (let x = (y / 24) % 2 ? 0 : 20; x < w; x += 40) g2.fillRect(x, y, 2, 24); } }
      g2.fillStyle = '#2a3140'; g2.fillRect(w * 0.14, h * 0.28, w * 0.24, h * 0.3); g2.fillRect(w * 0.62, h * 0.28, w * 0.24, h * 0.3);
      g2.fillStyle = pal[2]; g2.fillRect(w * 0.14, h * 0.28, w * 0.24, 5); g2.fillRect(w * 0.62, h * 0.28, w * 0.24, 5);
    });
    const litTex = canvasTex(256, 256, (g2, w, h) => { g2.fillStyle = '#000'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#ffb84a'; g2.fillRect(w * 0.15, h * 0.3, w * 0.22, h * 0.26); g2.fillRect(w * 0.63, h * 0.3, w * 0.22, h * 0.26); });
    const wallM = new THREE.MeshStandardMaterial({ map: wallTex, emissiveMap: litTex, emissive: '#ff8a2a', emissiveIntensity: 0, roughness: 0.95 });
    add(g, new THREE.BoxGeometry(W, H, D), wallM, [0, H / 2, 0]);
    const roofM = M(pal[1], { roughness: 0.9 });
    const roof = cn(g, Math.hypot(W, D) / 2 * 1.06, H * 0.55, roofM, [0, H + H * 0.275, 0], [0, Math.PI / 4, 0], [W / Math.hypot(W, D) * 1.41, 1, D / Math.hypot(W, D) * 1.41], 4);
    if (style === 'roman') { roof.visible = false; bx(g, W * 1.06, 0.25, D * 1.06, roofM, [0, H + 0.12, 0]); }
    const fire = FX.fire({ count: 70, life: 1, origin: [0, H, 0], spread: [W * 0.4, 0.2, D * 0.3], vel: [0, 2.6, 0], s0: 1.5 }); g.add(fire.points);
    const smoke = FX.smoke({ count: 40, life: 4, origin: [0, H + 0.6, 0], spread: [W * 0.3, 0, D * 0.3], s0: 1.6, s1: 6, vel: [0.6, 3, 0] }); g.add(smoke.points);
    const gl = sprite('rgba(255,130,40,1)', Math.max(W, D) * 3.4, 0); gl.position.y = H * 0.8; gl.position.z = D * 0.5; g.add(gl);
    return { g, v: { fire: 0, burnt: 0, ash: 0, lit: 0 }, upd(v, t) {
      fire.u.amt.value = v.fire; smoke.u.amt.value = v.fire > 0 ? 0.4 + 0.6 * v.fire : 0; wallM.emissiveIntensity = v.lit + v.fire * (0.5 + 0.2 * Math.sin(t * 13 + W));
      gl.material.opacity = v.fire * (0.75 + 0.25 * Math.sin(t * 11 + D));
      const dark = Math.max(v.burnt * 0.85, 0); wallM.color.setScalar(1 - dark); roofM.color.set(pal[1]).lerp(new THREE.Color('#1a1512'), v.burnt);
      if (v.ash > 0) { wallM.color.lerp(new THREE.Color('#8e8a84'), v.ash * 0.8); roofM.color.lerp(new THREE.Color('#9a9690'), v.ash * 0.8); } } };
  },

  colonnade(o) {
    const g = new THREE.Group(), n = o.n || 6, sp_ = o.gap || 1.3;
    for (let i = 0; i < n; i++) { cy(g, 0.28, 0.33, 3.2, '#efe6d2', [(i - (n - 1) / 2) * sp_, 1.6, 0]); bx(g, 0.8, 0.2, 0.8, '#e4d9c0', [(i - (n - 1) / 2) * sp_, 3.3, 0]); bx(g, 0.8, 0.2, 0.8, '#e4d9c0', [(i - (n - 1) / 2) * sp_, 0.1, 0]); }
    bx(g, n * sp_ + 0.4, 0.5, 1.1, '#efe6d2', [0, 3.65, 0]);
    return { g, v: { ash: 0 }, upd() {} };
  },

  pyramid(o) {
    const g = new THREE.Group(), S = o.s || 6;
    const m = cn(g, S * 0.72, S * 0.9, M('#d9b46a', { flatShading: true }), [0, S * 0.45, 0], [0, Math.PI / 4, 0], null, 4);
    return { g, v: {}, upd() {} };
  },

  rat(o) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const fur = M(o.color || '#6e5a4c');
    sp(body, 0.5, fur, [0, 0.4, 0], null, [1.5, 0.9, 0.9]); sp(body, 0.3, fur, [0.65, 0.42, 0], null, [1.2, 0.9, 0.85]); cn(body, 0.12, 0.35, '#e9b2a6', [0.98, 0.4, 0], [0, 0, -Math.PI / 2]);
    sp(body, 0.08, '#111', [0.9, 0.55, 0.14]); sp(body, 0.08, '#111', [0.9, 0.55, -0.14]);
    sp(body, 0.14, '#e9b2a6', [0.62, 0.72, 0.2], null, [1, 1.1, 0.4]); sp(body, 0.14, '#e9b2a6', [0.62, 0.72, -0.2], null, [1, 1.1, 0.4]);
    const tail = cy(body, 0.03, 0.06, 1.2, '#e0a99c', [-0.95, 0.34, 0], [0, 0, Math.PI / 2 + 0.3]);
    const legs = [0.35, -0.35].map(x => [0.2, -0.2].map(z => sp(body, 0.12, fur, [x, 0.1, z], null, [1.2, 0.8, 0.8]))).flat();
    return { g, v: { run: 0 }, upd(v, t) { const k = v.run; body.position.y = Math.abs(Math.sin(t * 14)) * 0.12 * k; legs.forEach((l, i) => { l.position.x = (i < 2 ? 0.35 : -0.35) + Math.sin(t * 14 + i * 1.6) * 0.18 * k; }); tail.rotation.z = Math.PI / 2 + 0.3 + Math.sin(t * 6) * 0.2 * k; } };
  },

  people(o) {
    const g = new THREE.Group(), cols = o.cols || 10, rows = o.rows || 10, gap = o.gap || 0.55, n = cols * rows;
    const A = new THREE.MeshBasicMaterial({ color: o.color || '#4a9bf0', toneMapped: false }), D = new THREE.MeshBasicMaterial({ color: o.dead || '#e8453c', toneMapped: false }), figs = [];
    for (let i = 0; i < n; i++) {
      const f = new THREE.Group(); f.position.set((i % cols - (cols - 1) / 2) * gap, 0, -Math.floor(i / cols) * gap * 0.01 + (Math.floor(i / cols) - (rows - 1) / 2) * 0 );
      f.position.y = (rows - 1 - Math.floor(i / cols)) * gap * 1.45;
      const body = cn(f, 0.2, 0.55, A, [0, 0.28, 0], null, null, 12), head = sp(f, 0.14, A, [0, 0.68, 0]);
      g.add(f); figs.push({ f, body, head });
    }
    return { g, v: { alive: 1, show: 1 }, upd(v) { figs.forEach((q, i) => { const idx = n - 1 - i; const dead = idx / n >= v.alive; const vis = i / n < v.show; q.f.visible = vis; q.body.material = dead ? D : A; q.head.material = dead ? D : A; q.f.scale.setScalar(dead ? 0.85 : 1); }); } };
  },

  // ------------------------------------------------------------------ dirigível (Hindenburg)
  zeppelin(o) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const env = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), M('#cfd3d8', { metalness: 0.25, roughness: 0.45 })); env.scale.set(11, 2.5, 2.5); body.add(env);
    for (let i = -4; i <= 4; i++) { const r = 2.5 * Math.sqrt(1 - (i / 4.6) ** 2); const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 6, 32), M('#8a9099')); ring.rotation.y = Math.PI / 2; ring.position.x = i * 2.2; body.add(ring); }
    [[-9.6, 0], [-9.6, Math.PI / 2], [-9.6, Math.PI], [-9.6, -Math.PI / 2]].forEach(([x, a]) => { const f = bx(body, 2.4, 0.15, 2.8, '#aab0b8', [x, Math.sin(a) * 1.9, Math.cos(a) * 1.9]); f.rotation.x = a; });
    bx(body, 4.2, 0.9, 1.0, '#7a8089', [0.5, -2.7, 0]); cy(body, 0.08, 0.08, 0.6, '#444', [0.5, -2.2, 0.4]);
    [[-4, 1], [-4, -1], [3, 1], [3, -1]].forEach(([x, z]) => { cy(body, 0.35, 0.35, 0.6, '#555', [x, -2.2, z * 2.3], [Math.PI / 2, 0, 0]); });
    const nt = canvasTex(512, 64, (g2, w, h) => drawText(g2, w, h, 'HINDENBURG', null, '#222'));
    [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.PlaneGeometry(9, 1), new THREE.MeshBasicMaterial({ map: nt, transparent: true, toneMapped: false })); p.position.set(1.5, 0.2, s * 2.34); p.rotation.y = s > 0 ? 0 : Math.PI; body.add(p); });
    const fire = FX.fire({ count: 160, life: 1.3, origin: [-8, 0.5, 0], spread: [2.5, 1.4, 1.4], vel: [0, 4.5, 0], velSpread: [1.2, 1.2, 1.2], s0: 3.2, s1: 0.8 }); body.add(fire.points);
    const smoke = FX.smoke({ count: 80, life: 5, origin: [-8, 2, 0], spread: [2, 0, 1.2], vel: [0, 4, 0], s0: 3, s1: 12, c0: [0.12, 0.11, 0.1, 0.9] }); body.add(smoke.points);
    const gl = sprite('rgba(255,140,40,1)', 26, 0); gl.position.set(-6, 0.5, 1); body.add(gl);
    return { g, v: { fire: 0, tilt: 0 }, upd(v, t) { body.rotation.z = v.tilt; fire.u.amt.value = v.fire; smoke.u.amt.value = v.fire > 0 ? 0.5 + 0.5 * v.fire : 0; gl.material.opacity = v.fire * (0.7 + 0.3 * Math.sin(t * 12)); body.position.y = Math.sin(t * 0.7) * 0.06; } };
  },

  mast(o) {
    const g = new THREE.Group(), H = o.h || 14;
    cy(g, 0.18, 0.5, H, '#8a8f98', [0, H / 2, 0]); bx(g, 1.4, 0.8, 1.4, '#6f747c', [0, H + 0.2, 0]); cn(g, 0.5, 0.8, '#d33', [0, H + 0.9, 0]);
    for (let i = 0; i < 3; i++) rod(g, [0, H * 0.7, 0], [Math.cos(i * 2.1) * 3, 0, Math.sin(i * 2.1) * 3], 0.04, '#555');
    return { g, v: {}, upd() {} };
  },

  // ------------------------------------------------------------------ emu, soldado, metralhadora, trigo
  emu(o) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const f1 = M(o.color || '#7a6a58'), f2 = M('#5a4d40');
    sp(body, 0.75, f1, [0, 1.9, 0], null, [1.25, 1, 0.95]); sp(body, 0.5, f2, [-0.85, 1.95, 0], null, [1.2, 0.9, 0.8]);
    const neck = new THREE.Group(); neck.position.set(0.7, 2.3, 0); body.add(neck);
    cy(neck, 0.13, 0.2, 1.7, '#5d6f82', [0.1, 0.85, 0], [0, 0, -0.18]); sp(neck, 0.22, '#5d6f82', [0.28, 1.75, 0], null, [1.3, 1, 0.9]); cn(neck, 0.07, 0.34, '#c9b27a', [0.62, 1.7, 0], [0, 0, -Math.PI / 2]);
    sp(neck, 0.07, '#f2c230', [0.42, 1.84, 0.14]); sp(neck, 0.035, '#000', [0.45, 1.84, 0.17]); sp(neck, 0.07, '#f2c230', [0.42, 1.84, -0.14]); sp(neck, 0.035, '#000', [0.45, 1.84, -0.17]);
    const legs = [0.28, -0.28].map(z => { const L = new THREE.Group(); L.position.set(0, 1.5, z); cy(L, 0.1, 0.07, 1.5, '#8a8f98', [0, -0.75, 0]); bx(L, 0.5, 0.08, 0.2, '#8a8f98', [0.2, -1.5, 0]); body.add(L); return L; });
    return { g, v: { run: 0, alert: 0 }, upd(v, t) { const k = v.run; body.position.y = Math.abs(Math.sin(t * 9)) * 0.22 * k; legs.forEach((L, i) => { L.rotation.z = Math.sin(t * 9 + i * Math.PI) * 0.8 * k; }); neck.rotation.z = lerp(0.1, -0.1, v.alert) + Math.sin(t * 9) * 0.07 * k; } };
  },

  gun(o) {
    const g = new THREE.Group(), body = new THREE.Group(); body.position.y = 1.1; g.add(body);
    rod(g, [0, 1.1, 0], [0.9, 0, 0.7], 0.04, '#333'); rod(g, [0, 1.1, 0], [-0.9, 0, 0.7], 0.04, '#333'); rod(g, [0, 1.1, 0], [0, 0, -1.0], 0.04, '#333');
    cy(body, 0.12, 0.12, 1.5, '#3a3d42', [0.6, 0, 0], [0, 0, Math.PI / 2]); cy(body, 0.2, 0.2, 1.0, '#4a4e55', [0.3, 0, 0], [0, 0, Math.PI / 2]); cy(body, 0.4, 0.4, 0.12, '#25272b', [0, 0.28, 0]); bx(body, 0.7, 0.2, 0.18, '#5a3a24', [-0.5, -0.05, 0]);
    const flash = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 10), EM('#ffd060', 2, { transparent: true, opacity: 0.95 })); flash.rotation.z = -Math.PI / 2; flash.position.set(1.7, 0, 0); body.add(flash);
    const smoke = FX.white({ count: 30, life: 2, origin: [1.4, 0.1, 0], vel: [1.6, 0.4, 0], s0: 0.5, s1: 2, c0: [0.85, 0.84, 0.8, 0.6] }); body.add(smoke.points);
    return { g, v: { fire: 0 }, upd(v, t) { flash.visible = v.fire > 0 && Math.sin(t * 38) > -0.2; smoke.u.amt.value = v.fire; body.rotation.y = 0; } };
  },

  wheat(o) {
    const g = new THREE.Group(), n = o.n || 700, W = o.w || 14, D = o.d || 8, r = rng(o.seed || 7);
    const stalk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.025, 1, 4), M('#d6b04a'), n), head = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.04, 0.22, 3, 6), M('#e8c45a'), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < n; i++) { const x = (r() - 0.5) * W, z = (r() - 0.5) * D, h = 0.8 + r() * 0.5; e.set((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3); q.setFromEuler(e); m.compose(new THREE.Vector3(x, h / 2, z), q, new THREE.Vector3(1, h, 1)); stalk.setMatrixAt(i, m); m.compose(new THREE.Vector3(x, h + 0.08, z), q, new THREE.Vector3(1, 1, 1)); head.setMatrixAt(i, m); }
    g.add(stalk, head);
    return { g, v: {}, upd(v, t) { g.rotation.z = Math.sin(t * 1.3) * 0.01; } };
  },

  // ------------------------------------------------------------------ quarto, relógio, café
  bed(o) {
    const g = new THREE.Group();
    bx(g, 3.2, 0.5, 5.2, '#8a5a36', [0, 0.45, 0]); bx(g, 3.0, 0.45, 5.0, '#f0ece4', [0, 0.92, 0]); bx(g, 3.2, 1.6, 0.25, '#7a4b2a', [0, 1.1, -2.6]);
    sp(g, 0.7, '#ffffff', [-0.7, 1.35, -1.9], null, [1.1, 0.4, 0.8]); sp(g, 0.7, '#ffffff', [0.7, 1.35, -1.9], null, [1.1, 0.4, 0.8]);
    const blanket = bx(g, 3.05, 0.2, 3.0, o.color || '#4a86d6', [0, 1.22, 0.8]);
    return { g, v: { cover: 1 }, upd(v) { blanket.visible = v.cover > 0; } };
  },

  clock(o) {
    const g = new THREE.Group(), R = o.r || 2.2;
    cy(g, R, R, 0.3, '#2a2a2e', [0, 0, 0], [Math.PI / 2, 0, 0], null, 48); cy(g, R * 0.92, R * 0.92, 0.32, '#f6f2e6', [0, 0, 0.01], [Math.PI / 2, 0, 0], null, 48);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; bx(g, 0.08, R * (i % 3 ? 0.1 : 0.18), 0.05, '#222', [Math.sin(a) * R * 0.8, Math.cos(a) * R * 0.8, 0.2], [0, 0, -a]); }
    const mh = new THREE.Group(), hh = new THREE.Group(), sh = new THREE.Group(); g.add(hh, mh, sh);
    bx(hh, 0.14, R * 0.5, 0.06, '#111', [0, R * 0.25, 0.24]); bx(mh, 0.1, R * 0.75, 0.06, '#111', [0, R * 0.375, 0.27]); bx(sh, 0.04, R * 0.85, 0.04, '#d33', [0, R * 0.3, 0.3]);
    sp(g, 0.1, '#d33', [0, 0, 0.32]);
    return { g, v: { time: 0, speed: 0 }, upd(v, t) { const h = v.time + t * v.speed; hh.rotation.z = -(h / 12) * Math.PI * 2; mh.rotation.z = -h * Math.PI * 2; sh.rotation.z = -h * 60 * Math.PI * 2; } };
  },

  cup(o) {
    const g = new THREE.Group();
    cy(g, 0.35, 0.28, 0.5, o.color || '#f2f2f2', [0, 0.25, 0]); cy(g, 0.31, 0.31, 0.02, '#4a2a18', [0, 0.49, 0]); const h = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.04, 8, 16), M(o.color || '#f2f2f2')); h.position.set(0.4, 0.27, 0); g.add(h);
    const st = FX.white({ count: 14, life: 1.8, origin: [0, 0.5, 0], spread: [0.1, 0, 0.1], vel: [0, 0.8, 0], s0: 0.2, s1: 0.6, c0: [1, 1, 1, 0.5] }); g.add(st.points);
    return { g, v: { steam: 1 }, upd(v) { st.u.amt.value = v.steam; } };
  },

  // ------------------------------------------------------------------ olho gigante
  eye(o) {
    const g = new THREE.Group(), R = 1.4, ball = new THREE.Group(); g.add(ball);
    const white = M('#f7f4ee', { roughness: 0.35 }); const eyeM = ball.add(new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), white)) && ball.children[0];
    const cap = (th, c, rad = R * 1.002) => { const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 40, 16, 0, Math.PI * 2, 0, th), c); m.rotation.x = Math.PI / 2; ball.add(m); return m; };
    cap(0.62, M(o.iris || '#2f8aa8', { roughness: 0.3 })); cap(0.3, M('#0b0b0d', { roughness: 0.2 }), R * 1.004); const hl = sp(ball, 0.14, EM('#ffffff', 1), [0.35, 0.4, R * 0.96]);
    const lidM = M('#e4b08e'); const up = new THREE.Mesh(new THREE.SphereGeometry(R * 1.1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), lidM), lo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), lidM);
    lo.scale.y = -1; g.add(up, lo);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 2.6, 6, 12), M('#3a2a20')); brow.rotation.z = Math.PI / 2; brow.position.set(0, R * 1.6, 0.2); g.add(brow);
    return { g, v: { open: 1, tired: 0, look: 0, lookY: 0 }, upd(v, t) {
      const blink = Math.max(0, Math.sin(t * 1.1 + 2) - 0.97) * 30; const o2 = clamp(v.open - blink - v.tired * 0.35, 0, 1);
      const a = lerp(0.15, -1.38, o2); up.rotation.x = a; lo.rotation.x = -a * 0.45 - 0.03; brow.position.y = R * 1.6 - v.tired * 0.25;
      ball.rotation.y = v.look; ball.rotation.x = v.lookY; white.color.set('#f7f4ee').lerp(new THREE.Color('#ff9b8c'), v.tired); } };
  },

  monitor(o) {
    const g = new THREE.Group(), W = o.w || 2.4, H = o.h || 1.5;
    bx(g, W + 0.2, H + 0.2, 0.25, o.body || '#2d3036', [0, H / 2 + 0.7, 0]); bx(g, 0.3, 0.7, 0.2, '#2d3036', [0, 0.35, -0.05]); bx(g, 1.0, 0.08, 0.6, '#2d3036', [0, 0.04, 0]);
    const cv = document.createElement('canvas'); cv.width = 384; cv.height = Math.round(384 * H / W); const g2 = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.set(0, H / 2 + 0.7, 0.13); g.add(scr);
    const draw = (text, on) => { g2.fillStyle = on ? (o.bg || '#0c1f3d') : '#050505'; g2.fillRect(0, 0, cv.width, cv.height); if (!on) return; g2.fillStyle = o.fg || '#7dffb0'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; const lines = String(text).split('|'); const fs = Math.min(70, cv.width / Math.max(6, Math.max(...lines.map(l => l.length)) * 0.62)); g2.font = `700 ${fs}px "Courier New", monospace`; lines.forEach((l, i) => g2.fillText(l, cv.width / 2, cv.height / 2 + (i - (lines.length - 1) / 2) * fs * 1.25)); tex.needsUpdate = true; };
    const glow = sprite(o.glow || 'rgba(120,180,255,1)', W * 3, 0); glow.position.set(0, H / 2 + 0.7, 0.6); g.add(glow);
    const inst = { g, v: { text: o.text || '', on: 1, glow: 0 }, last: null, upd(v) { const key = v.text + '|' + v.on; if (key !== this.last) { this.last = key; draw(v.text, v.on > 0); } glow.material.opacity = v.glow * v.on; } };
    return inst;
  },

  mountain(o) {
    const g = new THREE.Group(), R = o.r || 6, H = o.h || 7;
    const m = new THREE.Mesh(bump(new THREE.ConeGeometry(R, H, 24, 6), 0.12, 0.6), M(o.color || '#6b7f6a', { flatShading: true })); m.position.y = H / 2; g.add(m);
    const sn = new THREE.Mesh(bump(new THREE.ConeGeometry(R * 0.38, H * 0.34, 24, 3), 0.08, 0.6), M('#f4f8fc', { flatShading: true })); sn.position.y = H * 0.85; g.add(sn);
    return { g, v: {}, upd() {} };
  },

  tree(o) {
    const g = new THREE.Group(), H = o.h || 3;
    cy(g, 0.15, 0.22, H * 0.5, '#6a4a2c', [0, H * 0.25, 0]);
    if (o.kind === 'palm') { for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.2, 1, 4), M('#2f8a3a', { side: THREE.DoubleSide })); l.position.y = H * 0.5; l.rotation.set(-1.1, i / 7 * Math.PI * 2, 0, 'YXZ'); l.geometry.translate(0, 1.1, 0); g.add(l); } }
    else { sp(g, H * 0.32, o.leaf || '#3f9a4a', [0, H * 0.62, 0]); sp(g, H * 0.24, o.leaf || '#3f9a4a', [0.4, H * 0.8, 0.1]); sp(g, H * 0.22, o.leaf || '#3f9a4a', [-0.4, H * 0.76, -0.1]); }
    return { g, v: {}, upd() {} };
  },

  box(o) { const g = new THREE.Group(); bx(g, o.w || 1, o.h || 1, o.d || 1, o.color || '#cccccc', [0, (o.h || 1) / 2, 0]); return { g, v: {}, upd() {} }; },
  disc(o) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CircleGeometry(o.r || 10, 48), M(o.color || '#6fae55', { roughness: 1 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.03; g.add(m); return { g, v: {}, upd() {} }; },
  rock(o) { const g = new THREE.Group(); const m = new THREE.Mesh(bump(new THREE.IcosahedronGeometry(o.r || 0.6, 1), 0.25, 1.4), M(o.color || '#8a8780', { flatShading: true })); m.scale.set(1, 0.7, 1); m.position.y = (o.r || 0.6) * 0.4; g.add(m); return { g, v: {}, upd() {} }; },

  cloud(o) { const g = new THREE.Group(); [[0, 0, 0, 1], [1, -0.1, 0.2, 0.8], [-1, -0.1, 0, 0.75], [0.4, 0.4, 0, 0.7]].forEach(([x, y, z, s]) => sp(g, (o.r || 1.5) * s, M(o.color || '#ffffff', { roughness: 1, emissive: o.color || '#ffffff', emissiveIntensity: o.emis ?? 0.25 }), [x * (o.r || 1.5), y * (o.r || 1.5), z])); return { g, v: {}, upd() {} }; },

  wave(o) {
    const g = new THREE.Group(), L = o.len || 30, R = o.r || 5;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 32, 1, true, Math.PI * 0.05, Math.PI * 0.75), M('#3fb4de', { side: THREE.DoubleSide, roughness: 0.25, metalness: 0.1, emissive: '#1c6f9a', emissiveIntensity: 1.1 })); m.rotation.z = Math.PI / 2; m.rotation.y = 0; g.add(m);
    const foam = new THREE.Mesh(new THREE.TorusGeometry(R, 0.45, 8, 32, Math.PI * 0.2), M('#ffffff', { roughness: 1 })); foam.rotation.y = Math.PI / 2; g.add(foam);
    return { g, v: {}, upd() {} };
  },

  // ------------------------------------------------------------------ saúde / dicas
  bottle(o) {
    const g = new THREE.Group();
    add(g, new THREE.CapsuleGeometry(0.55, 1.3, 8, 20), M(o.color || '#ffcf33', { roughness: 0.35 }), [0, 1.1, 0], null, [1, 1, 0.55]); cy(g, 0.28, 0.32, 0.35, '#2a6fd6', [0, 2.2, 0]); cy(g, 0.1, 0.1, 0.35, '#2a6fd6', [0, 2.5, 0.0]);
    const lt = canvasTex(256, 256, (g2, w, h) => { g2.fillStyle = '#fff'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#e8532a'; g2.fillRect(0, 0, w, 40); g2.fillStyle = '#111'; g2.textAlign = 'center'; g2.font = '900 120px Anton, Impact'; g2.fillText(o.text || 'FPS 50', w / 2, 150); g2.font = '700 30px Montserrat, Arial'; if (o.sub !== '') g2.fillText(o.sub ?? 'PROTETOR SOLAR', w / 2, 215); });
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), new THREE.MeshBasicMaterial({ map: lt, toneMapped: false })); lab.position.set(0, 1.0, 0.31); g.add(lab);
    const sq = FX.white({ count: 40, life: 1.2, origin: [0, 2.7, 0], vel: [0, 2, 0.8], velSpread: [0.3, 0.3, 0.3], gravity: [0, -4, 0], s0: 0.25, s1: 0.4, c0: [1, 1, 1, 0.95], soft: 0.5 }); g.add(sq.points);
    return { g, v: { squirt: 0 }, upd(v) { sq.u.amt.value = v.squirt; } };
  },

  tooth(o) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const W = M('#fdfcf7', { roughness: 0.25 });
    sp(body, 1.1, W, [-0.65, 1.2, 0], null, [1, 1.05, 1]); sp(body, 1.1, W, [0.65, 1.2, 0], null, [1, 1.05, 1]); sp(body, 1.1, W, [0, 1.35, 0.3], null, [1.2, 1, 1]); bx(body, 2.0, 1.4, 1.8, W, [0, 0.8, 0]);
    cn(body, 0.55, 1.8, W, [-0.7, -0.5, 0], [Math.PI, 0, 0]); cn(body, 0.55, 1.8, W, [0.7, -0.5, 0], [Math.PI, 0, 0]);
    const spots = [[-0.9, 2.0, 0.85], [0.5, 2.1, 0.8], [0.1, 1.3, 1.25], [-0.4, 0.8, 1.3], [1.1, 1.0, 1.0]].map(([x, y, z], i) => { const s = sp(body, 0.2 + (i % 2) * 0.08, M('#3b2a1c', { roughness: 1 }), [x, y, z], null, [1, 1, 0.5]); return s; });
    const hole = sp(body, 0.45, M('#150d08', { roughness: 1 }), [0.2, 1.75, 1.15], null, [1, 1, 0.45]);
    const shine = sprite('rgba(255,255,255,1)', 3, 0); shine.position.set(-0.3, 1.8, 1.4); body.add(shine);
    [-1, 1].forEach(sd => { sp(body, 0.26, '#ffffff', [sd * 0.5, 1.55, 1.42], null, [1, 1.15, 0.5]); sp(body, 0.12, '#111', [sd * 0.5, 1.5, 1.6], null, [1, 1, 0.5]); });
    const mouth = add(body, new THREE.TorusGeometry(0.28, 0.05, 8, 16, Math.PI), M('#7a2a2a'), [0, 0.95, 1.5], [0, 0, Math.PI]);
    return { g, v: { decay: 0, shine: 0, sad: 0 }, upd(v, t) { spots.forEach((s, i) => { s.visible = v.decay > i / spots.length * 0.8; }); hole.visible = v.decay > 0.85; shine.material.opacity = v.shine * (0.6 + 0.4 * Math.sin(t * 6)); body.rotation.z = Math.sin(t * 1.3) * 0.03; } };
  },

  brush(o) {
    const g = new THREE.Group();
    bx(g, 0.35, 3.6, 0.3, o.color || '#2f9bd6', [0, 0, 0]); bx(g, 0.5, 0.9, 0.35, o.color || '#2f9bd6', [0, 2.1, 0]); bx(g, 0.52, 0.8, 0.08, '#ffffff', [0, 2.15, 0.2]);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) bx(g, 0.1, 0.18, 0.22, i % 2 ? '#7fd1ff' : '#fff', [-0.14 + j * 0.28, 1.85 + i * 0.2, 0.28]);
    const paste = add(g, new THREE.CapsuleGeometry(0.1, 0.8, 4, 8), M('#ffffff'), [0, 2.15, 0.36], [0, 0, 0]);
    return { g, v: {}, upd() {} };
  },

  germ(o) {
    const g = new THREE.Group(), R = o.r || 0.6, col = o.color || '#7bd35a';
    const body = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), M(col, { roughness: 0.4 })); g.add(body);
    for (let i = 0; i < 14; i++) { const a = Math.acos(1 - 2 * (i + 0.5) / 14), b = Math.PI * (1 + Math.sqrt(5)) * i; const d = new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)); const sp_ = cn(g, R * 0.2, R * 0.5, M(col, { roughness: 0.4 }), d.clone().multiplyScalar(R * 1.1).toArray(), null, null, 10); sp_.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); }
    [-1, 1].forEach(s => { sp(g, R * 0.24, '#fff', [s * R * 0.35, R * 0.2, R * 0.85]); sp(g, R * 0.11, '#111', [s * R * 0.35, R * 0.2, R * 1.04]); });
    const mouth = bx(g, R * 0.5, R * 0.12, R * 0.1, '#3a1010', [0, -R * 0.28, R * 0.95]);
    return { g, v: { jig: 1 }, upd(v, t) { g.rotation.y = Math.sin(t * 2 + R * 9) * 0.35 * v.jig; g.position.y = Math.abs(Math.sin(t * 3 + R * 7)) * 0.1 * v.jig; } };
  },

  lock(o) {
    const g = new THREE.Group();
    const bodyM = M('#e0a82a', { metalness: 0.6, roughness: 0.35 });
    add(g, new THREE.BoxGeometry(2.2, 1.8, 0.8), bodyM, [0, 0.9, 0]);
    const sh = new THREE.Group(); sh.position.set(0.7, 1.8, 0); g.add(sh);
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.15, 12, 24, Math.PI), M('#c9ccd2', { metalness: 0.8, roughness: 0.3 })); t.position.x = -0.7; sh.add(t);
    cy(g, 0.22, 0.22, 0.1, '#222', [0, 1.0, 0.42], [Math.PI / 2, 0, 0]); bx(g, 0.14, 0.5, 0.1, '#222', [0, 0.65, 0.42]);
    const warn = sprite('rgba(255,60,60,1)', 6, 0); warn.position.set(0, 1, 0.8); g.add(warn);
    return { g, v: { open: 0, alarm: 0 }, upd(v, t) { sh.rotation.y = v.open * 1.9; sh.position.y = 1.8 + v.open * 0.3; warn.material.opacity = v.alarm * (0.5 + 0.5 * Math.sin(t * 12)); } };
  },

  hand(o) {
    const g = new THREE.Group(), skin = M(o.skin || '#d9a07a', { roughness: 0.6 });
    add(g, new THREE.BoxGeometry(1.5, 1.5, 0.55), skin, [0, 0.9, 0], null, [1, 1, 1]); sp(g, 0.8, skin, [0, 0.4, 0], null, [1, 0.9, 0.35]);
    [-0.55, -0.18, 0.2, 0.56].forEach((x, i) => { const L = [1.3, 1.5, 1.4, 1.1][i]; add(g, new THREE.CapsuleGeometry(0.17, L, 6, 10), skin, [x, 1.65 + L * 0.5, 0]); });
    const th = add(g, new THREE.CapsuleGeometry(0.19, 0.9, 6, 10), skin, [-0.95, 1.2, 0], [0, 0, 0.9]);
    const gm = [], r = rng(o.seed || 3);
    for (let i = 0; i < 18; i++) { const G = PROPS.germ({ r: 0.2 + r() * 0.1, color: i % 3 ? '#7bd35a' : '#c45ad3' }); G.g.position.set((r() - 0.5) * 1.6, 0.4 + r() * 2.2, 0.35); G.g.scale.setScalar(0.9); g.add(G.g); gm.push(G); }
    const foam = []; for (let i = 0; i < 22; i++) { const b = sp(g, 0.16 + r() * 0.14, M('#ffffff', { transparent: true, opacity: 0.85, roughness: 0.1 }), [(r() - 0.5) * 1.8, 0.3 + r() * 2.4, 0.4 + r() * 0.2]); foam.push(b); }
    return { g, v: { germs: 1, foam: 0, scrub: 0 }, upd(v, t) { gm.forEach((G, i) => { G.g.visible = i / gm.length < v.germs; G.upd({ jig: 1 }, t); }); foam.forEach((b, i) => { b.visible = i / foam.length < v.foam; }); g.rotation.z = Math.sin(t * 9) * 0.18 * v.scrub; g.position.x = Math.sin(t * 9) * 0.25 * v.scrub; } };
  },

  faucet(o) {
    const g = new THREE.Group();
    cy(g, 0.28, 0.28, 2.2, '#c9ccd2', [0, 1.1, 0]); cy(g, 0.22, 0.22, 1.6, '#c9ccd2', [0.8, 2.3, 0], [0, 0, Math.PI / 2]); cy(g, 0.3, 0.2, 0.3, '#c9ccd2', [1.55, 2.2, 0]); bx(g, 0.5, 0.3, 0.4, '#3b82d6', [0, 2.4, 0]);
    bx(g, 3.6, 0.35, 2.2, '#f0f0f0', [0.4, 0, 0]);
    const w = FX.water({ count: 70, origin: [1.55, 2.05, 0], vel: [0, -3, 0], velSpread: [0.1, 0.5, 0.1], gravity: [0, -8, 0], s0: 0.2, s1: 0.18 }); g.add(w.points);
    return { g, v: { flow: 0 }, upd(v) { w.u.amt.value = v.flow; } };
  },

  soap(o) {
    const g = new THREE.Group();
    add(g, new THREE.BoxGeometry(1.5, 0.6, 1.0), M('#ff9fc2', { roughness: 0.3 }), [0, 0.3, 0]); const b = FX.bubbles({ count: 50, origin: [0, 0.6, 0], spread: [0.7, 0, 0.4], vel: [0, 1.5, 0], s0: 0.5, s1: 0.9 }); g.add(b.points);
    return { g, v: { bubbles: 0 }, upd(v) { b.u.amt.value = v.bubbles; } };
  },

  rack(o) {
    const g = new THREE.Group();
    bx(g, 1.6, 3.2, 1.1, '#2b2f36', [0, 1.6, 0]);
    const tex = canvasTex(128, 256, () => {}); const cv = tex.image, g2 = cv.getContext('2d');
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.9), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.set(0, 1.6, 0.56); g.add(scr);
    const inst = { g, v: { lights: 1, alarm: 0 }, upd(v, t) { const f = Math.floor(t * 6); if (f === this.f && v.alarm === this.al) return; this.f = f; this.al = v.alarm; g2.fillStyle = '#0a0c10'; g2.fillRect(0, 0, 128, 256); for (let y = 0; y < 16; y++) { g2.fillStyle = '#181c24'; g2.fillRect(6, 6 + y * 15.5, 116, 12); for (let x = 0; x < 8; x++) { const on = Math.sin(f * 7.1 + y * 3.3 + x * 5.7) > 0.1; g2.fillStyle = v.alarm > 0 ? (on ? '#ff3b3b' : '#4a1010') : (on ? '#4dff8a' : '#14301c'); g2.fillRect(12 + x * 13, 9 + y * 15.5, 8, 6); } } tex.needsUpdate = true; } };
    return inst;
  },

  // ------------------------------------------------------------------ foguete/humanos genéricos
  flames(o) {
    const g = new THREE.Group();
    const f = FX.fire({ count: o.n || 100, origin: [0, 0, 0], spread: [o.w || 1, 0.1, o.d || 1], s0: o.s || 1.6, vel: [0, 3, 0] }); const s = FX.smoke({ count: 50, origin: [0, 1, 0], spread: [o.w || 1, 0, o.d || 1], s1: 7, vel: [0.7, 3.2, 0] }); const gl = sprite('rgba(255,130,40,1)', (o.w || 1) * 7, 0); gl.position.y = 1;
    g.add(f.points, s.points, gl);
    return { g, v: { amt: 1 }, upd(v, t) { f.u.amt.value = v.amt; s.u.amt.value = v.amt > 0 ? 0.3 + 0.7 * v.amt : 0; gl.material.opacity = v.amt * (0.7 + 0.3 * Math.sin(t * 12)); } };
  },


  // cogumelo de explosão: v.grow 0→1 (haste e copa), v.ring 0→1 (onda de choque no chão)
  blast(o) {
    const g = new THREE.Group(), H = o.h || 10;
    const hot = EM('#ff8a2a', 1.2, { transparent: true, opacity: 0.95 }), smoke = M('#6a5a52', { roughness: 1, emissive: '#3a1c0c', emissiveIntensity: 0.6 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.1, H * 0.18, H, 20, 1, true), hot); stem.position.y = H / 2; g.add(stem);
    const cap = new THREE.Mesh(bump(new THREE.SphereGeometry(H * 0.42, 28, 18), 0.12, 1.2), hot); g.add(cap);
    const skirt = new THREE.Mesh(new THREE.TorusGeometry(H * 0.36, H * 0.09, 12, 32), smoke); skirt.rotation.x = Math.PI / 2; g.add(skirt);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: '#fff3d0', transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring);
    const gl = sprite('rgba(255,170,70,1)', H * 2.6, 0); gl.position.y = H * 0.4; g.add(gl);
    const sm = FX.smoke({ count: 60, life: 4, origin: [0, 0.5, 0], spread: [H * 0.3, 0, H * 0.3], s0: H * 0.2, s1: H * 0.7, vel: [0, 0.4, 0] }); g.add(sm.points);
    return { g, v: { grow: 0, ring: 0 }, upd(v, t) {
      const k = clamp(v.grow), ek = 1 - Math.pow(1 - k, 2.2); g.visible = k > 0.002 || v.ring > 0.002;
      stem.scale.set(0.6 + 0.4 * ek, Math.max(0.001, ek), 0.6 + 0.4 * ek); stem.position.y = H * ek / 2;
      const cy_ = H * ek * 1.02; cap.position.y = cy_; cap.scale.set(Math.max(0.01, ek), Math.max(0.01, ek * 0.75), Math.max(0.01, ek)); cap.rotation.y = t * 0.4;
      skirt.position.y = cy_ - H * 0.1 * ek; skirt.scale.setScalar(Math.max(0.01, ek));
      const rk = clamp(v.ring); ring.scale.setScalar(Math.max(0.01, 1 + rk * H * 7)); ring.material.opacity = (1 - rk) * (rk > 0.001 ? 0.9 : 0);
      gl.material.opacity = k > 0 ? (1 - k * 0.6) * 0.9 : 0; sm.u.amt.value = ek; hot.emissiveIntensity = 1.4 - 0.7 * k;
    } };
  },

  // raio zigue-zague do céu (from) ao chão (to); v.on 0/1 (pisca sozinho se v.flick = 1)
  bolt(o) {
    const g = new THREE.Group(), A = o.from || [0, 14, 0], B = o.to || [0, 0, 0], n = o.n || 12, r = rng(o.seed || 5);
    const mat = new THREE.MeshBasicMaterial({ color: '#fffbe0', toneMapped: false });
    let prev = A;
    for (let i = 1; i <= n; i++) { const k = i / n, p = [lerp(A[0], B[0], k) + (i < n ? (r() - 0.5) * 2.4 : 0), lerp(A[1], B[1], k), lerp(A[2], B[2], k) + (i < n ? (r() - 0.5) * 1.2 : 0)]; rod(g, prev, p, o.w || 0.16, mat); prev = p; }
    const gl = sprite('rgba(190,210,255,1)', 14, 0); gl.position.set(B[0], B[1] + 2, B[2]); g.add(gl);
    return { g, v: { on: 0, flick: 0 }, upd(v, t) { const f = v.flick ? (Math.sin(t * 31) > -0.2 ? 1 : 0) * (Math.sin(t * 7.3) > -0.55 ? 1 : 0) : 1; const on = clamp(v.on) * f; g.visible = on > 0.01; gl.material.opacity = on * 0.8; } };
  },

  // personagem (Tito e figurantes): { type:'char', o:{ shirt, pants, skin, hair, hat, glasses, scale, kid, gear:'helmet'|'hood'|'hardhat'|'cap'|'visor' } }
  char(o) {
    const c = new Character({ kid: o.kid ?? true, shirt: o.shirt || '#4a86d6', pants: o.pants || '#3a4a8a', skin: o.skin || '#c68a5c', hair: o.hair || '#2a1a12', hat: !!o.hat, glasses: !!o.glasses, coat: !!o.coat, scale: o.scale || 0.92 });
    const hr = c.headR;
    if (o.gear === 'helmet') { const hm = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.45, 28, 20), new THREE.MeshStandardMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.4 })); hm.position.y = hr * 0.98; c.head.add(hm); const ring = new THREE.Mesh(new THREE.TorusGeometry(hr * 1.1, 0.05, 8, 24), M('#e8e8e8')); ring.rotation.x = Math.PI / 2; ring.position.y = hr * 0.1; c.head.add(ring); const bp = bx(c.torso, 0.42, 0.5, 0.25, '#e8e8e8', [0, 0.28, -0.26]); }
    if (o.gear === 'hood') { const hd = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.16, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), M(o.shirt || '#20242c')); hd.position.y = hr * 0.98; hd.rotation.x = -0.35; c.head.add(hd); }
    if (o.gear === 'hardhat') { const hh = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.08, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), M('#f2c230')); hh.position.y = hr * 1.12; c.head.add(hh); const br = cy(c.head, hr * 1.3, hr * 1.3, 0.03, '#f2c230', [0, hr * 1.1, 0]); }
    if (o.gear === 'cap') { const hh = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.08, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), M('#f5f5f5')); hh.position.y = hr * 1.12; c.head.add(hh); const vz = cy(c.head, hr * 0.8, hr * 0.8, 0.04, '#111', [0, hr * 1.1, hr * 0.62], null, [1, 1, 0.5]); }
    if (o.gear === 'visor') { const hh = cy(c.head, hr * 1.1, hr * 1.1, 0.04, '#e8453c', [0, hr * 1.18, 0.05]); const vz = cy(c.head, hr * 0.9, hr * 0.9, 0.04, '#e8453c', [0, hr * 1.18, hr * 0.7], null, [1, 1, 0.4]); }
    if (o.gear === 'eclipse') { bx(c.head, hr * 1.7, 0.2, 0.05, '#101010', [0, hr * 1.08, hr * 1.02]); bx(c.head, hr * 1.78, 0.26, 0.03, '#d9a84a', [0, hr * 1.08, hr * 1.0]); }
    if (o.gear === 'beard') { const b = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.7, 16, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), M('#e8e6e0')); b.position.set(0, hr * 0.55, hr * 0.35); c.head.add(b); }
    return { g: c.root, v: { pose: null, rx: 0 }, c, fresh: true, upd(v, t, dt) {
      if (this.fresh) { Object.keys(c.pose).forEach(k => { c.pose[k] = 0; }); c.pose.smile = 0.3; if (v.pose) Object.assign(c.pose, v.pose); c.cur = { ...c.pose }; this.fresh = false; }
      else if (v.pose) Object.assign(c.pose, v.pose);
      c.update(t, dt); c.root.rotation.x = v.rx || 0; c.root.rotation.z = v.rz || 0; } };
  },
  ...RECIPE_PROPS,
};
