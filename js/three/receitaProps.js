// Objetos de COZINHA para os episódios de receitas caseiras (EP37+).
// Mesmo contrato do fatoProps.js: cada tipo devolve { g, v, upd(v, t, dt, inst, w) }.
// Tudo em formas simples; o que importa é MOSTRAR o gesto: encher, medir, mexer, coar, aplicar.
import * as THREE from 'three';
import { FX } from './fx.js';
import { rng } from './textures.js';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0, ...o });
const GL = (c = '#d6edf7', op = 0.26) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.08, metalness: 0, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false });
const add = (g, geo, mat, pos = [0, 0, 0], rot, scl) => {
  const m = new THREE.Mesh(geo, typeof mat === 'string' ? M(mat) : mat); m.position.set(...pos);
  if (rot) m.rotation.set(...rot); if (scl) m.scale.set(...scl); g.add(m); return m;
};
const bx = (g, w, h, d, c, p, r, s) => add(g, new THREE.BoxGeometry(w, h, d), c, p, r, s);
const cy = (g, rt, rb, h, c, p, r, s, seg = 28) => add(g, new THREE.CylinderGeometry(rt, rb, h, seg), c, p, r, s);
const sp = (g, rad, c, p, r, s) => add(g, new THREE.SphereGeometry(rad, 24, 16), c, p, r, s);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const CC = (s) => new THREE.Color(s);
function canvasTex(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function wrapText(g, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
  if (cur) lines.push(cur); return lines;
}

// ------------------------------------------------------------------------------------------
// Recipientes: copo, jarra, caneca, panela, tigela. Líquido com nível (v.fill), mistura de cores (v.mix),
// vapor, bolhas (fervura), colher mexendo (v.stir), folhas flutuando e jorro ao inclinar (v.tilt + v.stream).
const KINDS = {
  glass: { h: 1.5, rt: 0.6, rb: 0.5, clear: true },
  jug: { h: 2.5, rt: 0.85, rb: 0.78, clear: true, handle: true },
  mug: { h: 1.15, rt: 0.62, rb: 0.55, color: '#f4f1ea', handle: true },
  pot: { h: 1.2, rt: 1.05, rb: 1.05, color: '#aeb4bd', metal: true, lid: true },
  bowl: { h: 0.8, rt: 1.25, rb: 0.65, color: '#f4f1ea' },
  kettle: { h: 1.5, rt: 0.8, rb: 1.0, color: '#c9ced6', metal: true, spout: true },
};

function vessel(o) {
  const K = { ...KINDS[o.kind || 'glass'], ...o }, H = K.h, RT = K.rt, RB = K.rb;
  const g = new THREE.Group(), body = new THREE.Group(), inner = new THREE.Group(); g.add(body); body.add(inner);
  // pivô da inclinação = borda da esquerda (lado do bico)
  const lip = new THREE.Vector3(-RT, H, 0); body.position.copy(lip); inner.position.copy(lip).multiplyScalar(-1);
  const wallMat = K.clear ? GL(K.glass || '#d6edf7', 0.28) : M(K.color || '#f4f1ea', { side: THREE.DoubleSide, roughness: K.metal ? 0.3 : 0.55, metalness: K.metal ? 0.6 : 0 });
  add(inner, new THREE.CylinderGeometry(RT, RB, H, 40, 1, true), wallMat, [0, H / 2, 0]);
  cy(inner, RB, RB, 0.1, K.clear ? GL('#cfe3ee', 0.55) : M(K.color || '#f4f1ea'), [0, 0.05, 0], null, null, 40);
  if (K.clear) { // aro do copo
    add(inner, new THREE.TorusGeometry(RT, 0.018, 8, 40), M('#eaf6fb', { transparent: true, opacity: 0.7 }), [0, H, 0], [Math.PI / 2, 0, 0]);
  }
  if (K.handle) { const hh = add(inner, new THREE.TorusGeometry(H * 0.2, 0.07, 10, 24), M(K.handleColor || K.color || '#f4f1ea', { transparent: !!K.clear, opacity: K.clear ? 0.8 : 1 }), [RT + H * 0.09, H * 0.52, 0]); hh.scale.set(0.85, 1.05, 1); }
  if (K.metal && K.lid) { [-1, 1].forEach(sd => bx(inner, 0.4, 0.1, 0.16, '#555b63', [sd * (RT + 0.18), H * 0.8, 0])); }
  if (K.spout) { // chaleira: bico, cabo, corpo arredondado por cima
    add(inner, new THREE.SphereGeometry(RT * 0.98, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), wallMat, [0, H, 0], null, [1, 0.5, 1]);
    cy(inner, 0.14, 0.2, 0.9, K.color, [-RT - 0.2, H * 0.62, 0], [0, 0, 0.9]);
    const hd = add(inner, new THREE.TorusGeometry(0.55, 0.07, 8, 20, Math.PI), M('#2a2a30'), [0.1, H + 0.2, 0], [0, 0, 0]); hd.scale.set(1.3, 0.9, 1);
    sp(inner, 0.1, '#2a2a30', [0, H + 0.62, 0]);
  }
  // marcações (jarra graduada): 1 L no topo
  if (o.marks) {
    const tx = canvasTex(128, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#2a4a66'; c.fillStyle = '#2a4a66'; c.lineWidth = 6; c.font = '800 44px Montserrat, Arial'; c.textAlign = 'left'; c.textBaseline = 'middle';
      [[0.1, 0], [0.4, 0], [0.7, 0], [0.92, 1]].forEach(([y, big]) => { c.beginPath(); c.moveTo(8, h * (1 - y)); c.lineTo(big ? 70 : 44, h * (1 - y)); c.stroke(); if (big) c.fillText(o.marks, 8, h * (1 - y) - 34); }); });
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(H * 0.32, H * 0.64), new THREE.MeshBasicMaterial({ map: tx, transparent: true, toneMapped: false, depthWrite: false })); lab.position.set(0, H * 0.47, RB * 0.97 + 0.04); inner.add(lab);
  }
  // líquido
  const liqMat = new THREE.MeshStandardMaterial({ color: K.c0 || '#bfe7ff', roughness: 0.1, transparent: true, opacity: K.clear ? 0.88 : 0.96, depthWrite: !K.clear });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 36), liqMat); inner.add(liq);
  // vapor e bolhas
  const steam = FX.white({ count: 18, life: 1.8, origin: [0, H + 0.05, 0], spread: [RT * 0.5, 0, RT * 0.5], vel: [0, 0.9, 0], s0: 0.25, s1: 0.8, c0: [1, 1, 1, 0.45] }); inner.add(steam.points);
  const boil = FX.bubbles({ count: 36, life: 0.9, origin: [0, 0.9, 0], spread: [RT * 0.75, 0, RT * 0.75], vel: [0, 1.4, 0], s0: 0.22, s1: 0.32, c0: [1, 1, 1, 0.75] }); inner.add(boil.points);
  // folhas/flores boiando
  const R = rng(o.seed || 5), fl = [], leafMat = M(K.leaf || '#5aa84a', { side: THREE.DoubleSide, roughness: 0.8 });
  for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.05 + R() * 0.06, 7), K.leafKind === 'flower' ? M(i % 3 ? '#f7f3df' : '#f2c630', { side: THREE.DoubleSide }) : leafMat); m.rotation.x = -Math.PI / 2; const a = R() * 6.28, rr = Math.sqrt(R()) * RT * 0.8; m.userData = { a, rr }; inner.add(m); fl.push(m); }
  // colher de mexer
  const stirG = new THREE.Group(); inner.add(stirG);
  cy(stirG, 0.04, 0.04, H * 1.5, '#cfd3da', [0, H * 0.35, 0]); sp(stirG, 0.12, '#cfd3da', [0, -H * 0.38, 0], null, [1, 0.5, 0.8]);
  // tampa da panela
  let lidM = null; if (K.lid) { lidM = new THREE.Group(); cy(lidM, RT * 1.04, RT * 1.04, 0.07, '#9aa0a8', [0, 0, 0], null, null, 40); sp(lidM, 0.14, '#333', [0, 0.12, 0]); inner.add(lidM); }
  // jorro (fica no sistema do grupo externo, cai reto da borda)
  const strMat = new THREE.MeshStandardMaterial({ color: K.c0 || '#bfe7ff', roughness: 0.1, transparent: true, opacity: 0.78 });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10), strMat); g.add(stream);
  const splash = FX.water({ count: 22, life: 0.5, origin: [0, 0, 0], spread: [0.1, 0, 0.1], vel: [0, 1.6, 0], velSpread: [0.7, 0.5, 0.7], gravity: [0, -9, 0], s0: 0.14, s1: 0.08, c0: [0.8, 0.93, 1, 0.8] }); g.add(splash.points);
  const c0 = CC(K.c0 || '#bfe7ff'), c1 = CC(K.c1 || K.c0 || '#bfe7ff'), tmp = new THREE.Color();
  return { g, v: { fill: 0, mix: 0, steam: 0, boil: 0, stir: 0, tilt: 0, stream: 0, drop: 2, floaters: 0, lid: 0 }, upd(v, t) {
    const fillH = clamp(v.fill) * (H - 0.18), rad = lerp(RB, RT, clamp(v.fill) * 0.5 + 0.0) * 0.965;
    liq.visible = fillH > 0.01; liq.scale.set(rad, Math.max(0.001, fillH), rad); liq.position.y = 0.1 + fillH / 2;
    tmp.copy(c0).lerp(c1, clamp(v.mix)); liqMat.color.copy(tmp); strMat.color.copy(c0);
    const top = 0.1 + fillH;
    steam.u.amt.value = v.steam; boil.u.amt.value = v.boil; boil.points.position.y = top - 0.9;
    const sw = t * 3.2 * v.stir;
    fl.forEach((m, i) => { m.visible = i / fl.length < v.floaters; m.position.set(Math.cos(m.userData.a + sw * 0.5) * m.userData.rr, top + 0.012, Math.sin(m.userData.a + sw * 0.5) * m.userData.rr); m.rotation.z = m.userData.a + t * 0.2; });
    stirG.visible = v.stir > 0.01; stirG.position.set(Math.cos(sw) * RT * 0.3, 0, Math.sin(sw) * RT * 0.3); stirG.rotation.set(Math.sin(sw) * 0.18, 0, -Math.cos(sw) * 0.18);
    if (lidM) { lidM.position.set(lerp(RT * 1.7, 0, v.lid), H + 0.04 + (1 - v.lid) * 0.5, 0); lidM.rotation.z = (1 - v.lid) * 0.5; }
    body.rotation.z = v.tilt * 1.55;
    const on = v.stream > 0.02, len = Math.max(0.05, v.drop); stream.visible = on; splash.points.visible = on; splash.u.amt.value = on ? 1 : 0;
    stream.scale.set(0.045 * v.stream + 0.012, len, 0.045 * v.stream + 0.012); stream.position.set(lip.x - 0.05, lip.y - len / 2, 0); splash.points.position.set(lip.x - 0.05, lip.y - len, 0);
  } };
}

// ------------------------------------------------------------------------------------------
// Colheres medidoras (sopa/sobremesa/chá/café) com pó em cima: v.load, v.level (rasa), v.tilt, v.fall
function spoon(o) {
  const k = { sopa: 1, sobremesa: 0.8, cha: 0.6, cafe: 0.46 }[o.kind || 'sopa'], g = new THREE.Group(), sg = new THREE.Group(); g.add(sg);
  const metal = M(o.metal || '#dfe2e8', { metalness: 0.35, roughness: 0.35 });
  add(sg, new THREE.SphereGeometry(0.5 * k, 24, 14), metal, [0, -0.02 * k, 0], null, [1.05, 0.34, 0.78]);
  bx(sg, 1.9 * k, 0.07 * k, 0.16 * k, metal, [1.45 * k, 0.06 * k, 0], [0, 0, 0.06]);
  const col = o.powder || '#ffffff';
  const heap = add(sg, new THREE.SphereGeometry(0.46 * k, 18, 12), M(col, { roughness: 1 }), [0, 0.08 * k, 0], null, [1.05, 0.62, 0.74]);
  const knife = new THREE.Group(); bx(knife, 1.5 * k, 0.025 * k, 0.4 * k, '#e8eaee', [0, 0, 0]); bx(knife, 0.9 * k, 0.05 * k, 0.12 * k, '#6b3f1f', [1.1 * k, 0.02 * k, 0]); g.add(knife);
  const c = CC(col);
  const fallFx = FX.sparks({ count: 70, life: 0.75, origin: [-0.5 * k, 0.1 * k, 0], spread: [0.05, 0, 0.1], vel: [-0.4, -0.2, 0], velSpread: [0.25, 0.2, 0.25], gravity: [0, -8, 0], s0: 0.13, s1: 0.1, c0: [c.r, c.g, c.b, 1], c1: [c.r, c.g, c.b, 0.9], additive: false, soft: 0.2 }); g.add(fallFx.points);
  return { g, v: { load: 0, level: 0, tilt: 0, fall: 0, knife: 0, sweep: 0, dump: 0 }, upd(v, t) {
    let load = v.load, level = v.level, tilt = v.tilt, fall = v.fall, kp = v.knife;
    if (v.sweep > 0) { const p = (t * 0.8) % 1; kp = p; level = clamp((p - 0.3) * 2.2); }
    if (v.dump > 0) { const p = (t * 0.75) % 1, e = clamp(p * 2.0); tilt = e * e * (3 - 2 * e); fall = tilt > 0.5 && p < 0.85 ? 1 : 0; load = Math.min(load || 1, 1 - clamp((p - 0.45) * 3)); }
    sg.rotation.z = tilt * 0.95; heap.visible = load > 0.02; heap.scale.set(1.05, 0.62 * lerp(1, 0.2, level) * load, 0.74); heap.position.y = (0.05 + 0.04 * lerp(1, 0.2, level)) * k;
    fallFx.u.amt.value = fall; fallFx.points.visible = fall > 0.01;
    knife.visible = kp > 0.01 && kp < 0.995; knife.position.set(lerp(-1.4, 1.3, kp) * k, 0.2 * k, 0);
  } };
}

// ------------------------------------------------------------------------------------------
// Pote de vidro com rótulo (mel, açúcar, sal, aveia...). v.open levanta a tampa; v.dip mostra a colher de mel pingando.
function jar(o) {
  const R = o.r || 0.95, H = o.h || 1.9, g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(R, R, H, 40, 1, true), GL('#d6edf7', 0.22), [0, H / 2, 0]);
  cy(g, R, R, 0.08, GL('#cfe3ee', 0.5), [0, 0.04, 0]);
  const fill = o.fill || '#e89a14', fillM = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.96, R * 0.96, 1, 36), M(fill, { roughness: o.shiny ? 0.15 : 0.95, transparent: !!o.shiny, opacity: o.shiny ? 0.92 : 1 })); g.add(fillM);
  const lid = new THREE.Group(); cy(lid, R * 1.02, R * 1.02, 0.28, o.lid || '#d9a521', [0, 0, 0]); cy(lid, R * 1.04, R * 1.04, 0.05, o.lid || '#d9a521', [0, 0.12, 0]); g.add(lid);
  const lt = canvasTex(512, 300, (c, w, h) => { c.fillStyle = o.labelBg || '#fff7e0'; c.fillRect(0, 0, w, h); c.strokeStyle = o.labelFg || '#7a4a14'; c.lineWidth = 12; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = o.labelFg || '#7a4a14'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = 150; c.font = `${fs}px Anton, Impact, sans-serif`; while (c.measureText(o.text || 'MEL').width > w - 70 && fs > 40) { fs -= 6; c.font = `${fs}px Anton, Impact, sans-serif`; } c.fillText(o.text || 'MEL', w / 2, o.sub ? h * 0.42 : h * 0.52); if (o.sub) { c.font = '800 44px Montserrat, Arial'; c.fillText(o.sub, w / 2, h * 0.8); } });
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, H * 0.5, 24, 1, true, -0.62, 1.24), new THREE.MeshBasicMaterial({ map: lt, toneMapped: false, side: THREE.FrontSide })); lab.position.y = H * 0.46; g.add(lab);
  // colher de mel (dipper) com fio pingando
  const dip = new THREE.Group(); cy(dip, 0.05, 0.05, 2.2, '#b98a52', [0, 1.1, 0]);
  for (let i = 0; i < 6; i++) cy(dip, 0.2 - Math.abs(i - 2.5) * 0.015, 0.2 - Math.abs(i - 2.5) * 0.015, 0.07, '#d9a768', [0, -0.05 - i * 0.07, 0]);
  const thread = add(dip, new THREE.CylinderGeometry(0.035, 0.03, 1, 8), M('#e89a14', { roughness: 0.15 }), [0, -1, 0]); const drop = sp(dip, 0.075, M('#e89a14', { roughness: 0.15 }), [0, -2, 0]); g.add(dip);
  return { g, v: { open: 0, level: 0.78, dip: 0, drip: 0, len: 1.6 }, upd(v, t) {
    const h = Math.max(0.01, (H - 0.3) * v.level); fillM.scale.set(1, h, 1); fillM.position.y = 0.08 + h / 2;
    lid.position.set(v.open * R * 1.6, H + 0.1 + v.open * 0.7, 0); lid.rotation.z = -v.open * 0.9;
    dip.visible = v.dip > 0.01; dip.position.set(0, H * 0.4 + v.dip * 1.7 + (v.dip > 0.99 ? 0 : 0), 0); dip.rotation.z = v.dip * 0.0;
    const L = v.len * v.drip; thread.visible = v.drip > 0.02; thread.scale.set(1, Math.max(0.01, L), 1); thread.position.y = -0.15 - L / 2; drop.visible = v.drip > 0.02; const ph = (t * 0.7) % 1; drop.position.y = -0.15 - L - ph * 0.9 * v.drip; drop.scale.setScalar(ph < 0.15 ? ph / 0.15 : 1);
  } };
}

// ------------------------------------------------------------------------------------------
// Colher de mel (dipper) solta no ar, pingando um fio de mel (v.drip, v.len)
function dipper(o) {
  const g = new THREE.Group(), wood = M('#b98a52'), honey = M(o.color || '#e89a14', { roughness: 0.15 });
  const stick = add(g, new THREE.CylinderGeometry(0.06, 0.06, 2.6, 10), wood, [0.62, 1.15, 0], [0, 0, -0.5]);
  for (let i = 0; i < 6; i++) cy(g, 0.26 - Math.abs(i - 2.5) * 0.02, 0.26 - Math.abs(i - 2.5) * 0.02, 0.08, '#d9a768', [0, 0.06 - i * 0.08, 0]);
  const th = add(g, new THREE.CylinderGeometry(0.045, 0.035, 1, 8), honey, [0, -1, 0]), dr = sp(g, 0.1, honey, [0, -2, 0]);
  void stick;
  return { g, v: { drip: 1, len: 1.4 }, upd(v, t) {
    const L = v.len * clamp(v.drip); th.visible = v.drip > 0.02; th.scale.set(1, Math.max(0.01, L), 1); th.position.y = -0.3 - L / 2;
    dr.visible = v.drip > 0.02; const ph = (t * 0.8) % 1; dr.position.y = -0.3 - L - ph * 1.1; dr.scale.setScalar(ph < 0.15 ? ph / 0.15 : 1);
  } };
}

// ------------------------------------------------------------------------------------------
// Limão inteiro, cortado ao meio e espremido (pinga suco). v.cut 0..1, v.squeeze 0..1
function lemonFace() { return canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#f3e7a0'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, 7); c.fill(); c.fillStyle = '#fff7c9'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.42, 0, 7); c.fill(); c.strokeStyle = '#f0dd7a'; c.lineWidth = 8; for (let i = 0; i < 9; i++) { const a = i * 6.2832 / 9; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 14, h / 2 + Math.sin(a) * 14); c.lineTo(w / 2 + Math.cos(a) * w * 0.4, h / 2 + Math.sin(a) * h * 0.4); c.stroke(); } c.fillStyle = '#e6d070'; for (let i = 0; i < 9; i++) { const a = i * 6.2832 / 9 + 0.35; c.beginPath(); c.ellipse(w / 2 + Math.cos(a) * w * 0.25, h / 2 + Math.sin(a) * h * 0.25, 18, 30, a, 0, 7); c.fill(); } }); }
function lemon(o) {
  const R = o.r || 0.7, g = new THREE.Group(), yel = M('#f2d21f', { roughness: 0.55 }), tx = lemonFace();
  const whole = new THREE.Group(); add(whole, new THREE.SphereGeometry(R, 28, 18), yel, [0, R * 0.8, 0], null, [1.2, 0.86, 0.9]); sp(whole, R * 0.15, yel, [R * 1.22, R * 0.8, 0], null, [1, 0.8, 0.8]); sp(whole, R * 0.15, yel, [-R * 1.22, R * 0.8, 0], null, [1, 0.8, 0.8]); g.add(whole);
  const halves = []; const faceM = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.4 });
  for (let i = 0; i < 2; i++) { const h = new THREE.Group(); add(h, new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), yel, [0, 0, 0], null, [0.9, 0.86, 1.2]); const f = add(h, new THREE.CircleGeometry(R * 1.0, 32), faceM, [0, 0.005, 0], [-Math.PI / 2, 0, 0], [0.9, 1.2, 1]); h.position.set(0, R * 0.8, 0); h.rotation.x = -0.9; g.add(h); halves.push(h); }
  const juice = FX.water({ count: 24, life: 0.8, origin: [0, 0.2, 0.5], spread: [0.08, 0, 0.08], vel: [0, -0.4, 0], gravity: [0, -7, 0], s0: 0.12, s1: 0.1, c0: [1, 0.96, 0.5, 0.95], c1: [1, 0.95, 0.4, 0.8] }); g.add(juice.points);
  return { g, v: { cut: 0, squeeze: 0, pair: 1 }, upd(v) {
    whole.visible = v.cut < 0.02; halves.forEach((h, i) => { h.visible = v.cut >= 0.02 && (i === 0 || v.pair > 0.5); h.position.x = (i ? 1 : -1) * R * 0.2 * v.cut * 4.5; h.position.y = R * 0.55; h.scale.set(1, 1 - 0.28 * v.squeeze, 1); h.rotation.x = -0.9 - v.squeeze * 0.3; });
    juice.u.amt.value = v.squeeze; juice.points.position.set(-R * 0.9 * 1, R * 0.2, 0); juice.points.visible = v.squeeze > 0.02;
  } };
}

// ------------------------------------------------------------------------------------------
// Gengibre (raiz com nós) e rodelas; v.slice 0..1 mostra as rodelas; v.peel descasca
function ginger(o) {
  const g = new THREE.Group(), skin = M('#c9a063', { roughness: 0.9 }), pale = M('#f2dc8c', { roughness: 0.7 });
  const root = new THREE.Group(); g.add(root);
  [[0, 0.35, 0, 1.0, 0.0], [0.7, 0.45, 0.05, 0.62, 0.5], [-0.65, 0.4, -0.05, 0.6, -0.55], [1.15, 0.7, 0.1, 0.4, 0.9], [-1.05, 0.62, 0, 0.36, -0.95]].forEach(([x, y, z, s, a]) => { const m = add(root, new THREE.CapsuleGeometry(0.28 * s + 0.06, 0.8 * s, 6, 12), skin, [x, y, z], [0, 0, Math.PI / 2 + a * 0.35]); m.scale.set(1, 1, 0.9); });
  for (let i = 0; i < 5; i++) { const rg = add(root, new THREE.TorusGeometry(0.31, 0.012, 6, 16), M('#9c7a44'), [-0.4 + i * 0.22, 0.38, 0], [0, Math.PI / 2, 0]); rg.scale.set(1, 1, 1); }
  add(root, new THREE.CircleGeometry(0.29, 16), pale, [-0.95, 0.35, 0], [0, -Math.PI / 2, 0]);
  const sl = new THREE.Group(); g.add(sl);
  for (let i = 0; i < 6; i++) { const d = new THREE.Group(); cy(d, 0.34, 0.34, 0.07, '#9c7a44', [0, 0, 0], [Math.PI / 2, 0, 0]); cy(d, 0.3, 0.3, 0.075, pale, [0, 0, 0], [Math.PI / 2, 0, 0]); d.position.set(0.15 + i * 0.07, 0.34 + i * 0.015, 1.05 + i * 0.2 - 0.3); d.rotation.y = 0.2 * i; sl.add(d); }
  return { g, v: { slice: 0, root: 1 }, upd(v) { root.visible = v.root > 0.5; sl.children.forEach((d, i) => { d.visible = i / 6 < v.slice; }); } };
}

// ------------------------------------------------------------------------------------------
// Ervas: hortelã (folhas verdes), camomila (flores brancas) e "seca" (monte de flores/folhas secas)
function herb(o) {
  const g = new THREE.Group(), kind = o.kind || 'mint', R = rng(o.seed || 9);
  if (kind === 'mint') {
    const lf = M('#3fae52', { side: THREE.DoubleSide, roughness: 0.7 }), lf2 = M('#5cc46a', { side: THREE.DoubleSide, roughness: 0.7 });
    for (let s = 0; s < 4; s++) { const stem = new THREE.Group(); cy(stem, 0.03, 0.03, 2.2, '#2f7f3f', [0, 1.1, 0]); for (let i = 0; i < 7; i++) { [-1, 1].forEach(sd => { const L = add(stem, new THREE.SphereGeometry(0.34 - i * 0.025, 12, 8), i % 2 ? lf : lf2, [sd * 0.2, 0.45 + i * 0.26, 0], [0.5, 0, sd * 0.7], [1, 0.14, 1.5]); }); } stem.rotation.set((R() - 0.5) * 0.4, R() * 6, (s - 1.5) * 0.3); stem.position.set((s - 1.5) * 0.12, 0, 0); g.add(stem); }
  } else if (kind === 'chamomile') {
    for (let s = 0; s < 5; s++) { const fl = new THREE.Group(); cy(fl, 0.025, 0.025, 1.3, '#4f8f3a', [0, 0.65, 0]); const head = new THREE.Group(); for (let p = 0; p < 12; p++) { const a = p * 6.2832 / 12; add(head, new THREE.SphereGeometry(0.15, 10, 6), M('#fbf8ee', { roughness: 0.6 }), [Math.cos(a) * 0.23, Math.sin(a) * 0.23, 0], [0, 0, a], [1.6, 0.5, 0.25]); } sp(head, 0.17, '#f2c426', [0, 0, 0.03], null, [1, 1, 0.7]); head.position.y = 1.35; head.rotation.x = -1.1; fl.add(head); fl.rotation.z = (s - 2) * 0.22; fl.position.x = (s - 2) * 0.42; fl.position.z = (R() - 0.5) * 0.3; g.add(fl); }
  } else {
    const dry = o.color || '#c9b25a'; const bowl = new THREE.Group(); add(bowl, new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M('#8a5a38'), [0, 0.7, 0], null, [1.1, 0.7, 1.1]); g.add(bowl);
    for (let i = 0; i < 60; i++) { const a = R() * 6.28, rr = Math.sqrt(R()) * 0.85; sp(g, 0.07 + R() * 0.05, M(R() > 0.6 ? '#e6d79a' : dry, { roughness: 1 }), [Math.cos(a) * rr, 0.78 + (0.9 - rr) * 0.25 + R() * 0.08, Math.sin(a) * rr]); }
  }
  return { g, v: { grow: 1 }, upd() {} };
}

// ------------------------------------------------------------------------------------------
// Peneira/coador sobre a caneca
function strainer(o) {
  const g = new THREE.Group(), R = o.r || 0.7, metal = M('#cfd3da', { metalness: 0.4, roughness: 0.35 });
  add(g, new THREE.TorusGeometry(R, 0.035, 8, 32), metal, [0, 0, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.SphereGeometry(R, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#d7dbe2', metalness: 0.7, roughness: 0.35, wireframe: true }), [0, 0, 0], null, [1, 0.5, 1]);
  bx(g, R * 1.8, 0.07, 0.14, metal, [R * 1.4, 0, 0]);
  return { g, v: {}, upd() {} };
}

// ------------------------------------------------------------------------------------------
// Tábua e faca: cortar limão/gengibre (v.chop = quanto bate)
function board(o) {
  const g = new THREE.Group(); bx(g, o.w || 4.2, 0.18, o.d || 2.6, '#d7a566', [0, 0.09, 0]); bx(g, (o.w || 4.2) - 0.3, 0.02, (o.d || 2.6) - 0.3, '#c8924f', [0, 0.19, 0]);
  return { g, v: {}, upd() {} };
}
function knife(o) {
  const g = new THREE.Group(), piv = new THREE.Group(); g.add(piv);
  add(piv, new THREE.BoxGeometry(1.9, 0.5, 0.04), M('#eef0f3', { metalness: 0.3, roughness: 0.35 }), [-0.95, 0.3, 0]); bx(piv, 1.0, 0.18, 0.14, '#2a2a2f', [0.5, 0.45, 0]);
  return { g, v: { chop: 0, lift: 0 }, upd(v, t) { piv.rotation.z = v.lift * 0.5 + Math.abs(Math.sin(t * 7)) * 0.32 * v.chop * -1; } };
}

// ------------------------------------------------------------------------------------------
// Babosa: planta em vaso (v.kind 'plant') ou folha cortada com gel (kind 'leaf'; v.gel, v.latex)
function aloe(o) {
  const g = new THREE.Group(), gr = M('#4f9f56', { roughness: 0.6 });
  if ((o.kind || 'plant') === 'plant') {
    cy(g, 0.9, 0.65, 1.0, '#c0643a', [0, 0.5, 0]); cy(g, 0.95, 0.95, 0.12, '#cf7447', [0, 1.02, 0]); cy(g, 0.8, 0.8, 0.06, '#4a3320', [0, 1.05, 0]);
    for (let i = 0; i < 9; i++) { const arm = new THREE.Group(); arm.position.y = 1.05; arm.rotation.y = i * 6.2832 / 9 + 0.2; add(arm, new THREE.ConeGeometry(0.24, 2.3, 6), gr, [0.45 + (i % 3) * 0.12, 1.0, 0], [0, 0, -0.45]); for (let k = 0; k < 4; k++) sp(arm, 0.04, '#f2f3e4', [0.2 + (i % 3) * 0.12 + k * 0.2, 0.35 + k * 0.5, 0.16]); g.add(arm); }
    return { g, v: {}, upd() {} };
  }
  // folha cortada
  const sh = new THREE.Shape(); sh.moveTo(-1.8, 0); sh.quadraticCurveTo(-1.0, 0.55, 1.4, 0.28); sh.lineTo(2.2, 0); sh.lineTo(1.4, -0.28); sh.quadraticCurveTo(-1.0, -0.55, -1.8, 0);
  const leaf = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }), gr); leaf.rotation.x = -Math.PI / 2; leaf.position.set(0, 0.2, 0.15); g.add(leaf);
  const gelM = new THREE.MeshStandardMaterial({ color: '#c4efd0', roughness: 0.05, transparent: true, opacity: 0.85, emissive: '#6fd9a0', emissiveIntensity: 0.12 });
  const gel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.6), gelM); gel.position.set(0.2, 0.46, 0); g.add(gel);
  const blob = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12), gelM); blob.scale.set(1.4, 0.38, 1); blob.position.set(-3.2, 0.2, 0.6); g.add(blob);
  const latex = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.9, 8), M('#e6c21f', { roughness: 0.2 })); latex.position.set(-1.9, 0.0, 0.2); g.add(latex);
  return { g, v: { gel: 1, blob: 0, latex: 0 }, upd(v) { gel.visible = v.gel > 0.01; blob.visible = v.blob > 0.01; blob.scale.set(1.4 * v.blob, 0.38 * v.blob, v.blob); latex.visible = v.latex > 0.01; latex.scale.set(1, v.latex, 1); latex.position.y = 0.45 - 0.5 * v.latex; } };
}

// ------------------------------------------------------------------------------------------
// Membros (pele): antebraço/mão com vermelhidão e gel (v.red, v.gel), ou perna+pé com inchaço/roxo (v.swell, v.bruise)
function limb(o) {
  const g = new THREE.Group(), skinC = CC(o.skin || '#d9a07a'), redC = CC('#e2483a'), tmpC = new THREE.Color();
  const skin = M('#d9a07a', { roughness: 0.55 });
  let sheen, bruise, swell;
  if ((o.kind || 'arm') === 'arm') {
    add(g, new THREE.CapsuleGeometry(0.4, 2.6, 8, 16), skin, [0.2, 0.52, 0], [0, 0, Math.PI / 2]);
    cy(g, 0.56, 0.5, 1.3, '#4a86d6', [-1.7, 0.52, 0], [0, 0, Math.PI / 2]);
    bx(g, 0.95, 0.3, 1.0, skin, [2.2, 0.5, 0], [0, 0, 0.04]);
    [-0.38, -0.13, 0.12, 0.37].forEach((z, i) => add(g, new THREE.CapsuleGeometry(0.115, 0.55 + (i === 1 || i === 2 ? 0.12 : 0), 4, 8), skin, [3.05 + (i === 1 || i === 2 ? 0.06 : 0), 0.5, z], [0, 0, Math.PI / 2]));
    add(g, new THREE.CapsuleGeometry(0.13, 0.5, 4, 8), skin, [2.55, 0.52, 0.7], [0.3, 0, 1.0]);
    sheen = new THREE.Mesh(new THREE.CapsuleGeometry(0.44, 2.6, 8, 16), new THREE.MeshStandardMaterial({ color: '#bff1ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0, depthWrite: false })); sheen.position.set(0.2, 0.52, 0); sheen.rotation.z = Math.PI / 2; g.add(sheen);
  } else { // perna (calça) + tornozelo + tênis
    add(g, new THREE.CapsuleGeometry(0.42, 2.0, 8, 16), M('#3a4a8a'), [0, 2.55, 0]);
    add(g, new THREE.CylinderGeometry(0.36, 0.36, 0.9, 16), skin, [0, 1.05, 0]);
    cy(g, 0.43, 0.43, 0.12, '#2c3a70', [0, 1.55, 0]);
    add(g, new THREE.BoxGeometry(1.0, 0.55, 2.0), M('#d94a3a', { roughness: 0.6 }), [0, 0.45, 0.45]);
    add(g, new THREE.BoxGeometry(1.06, 0.14, 2.1), M('#f4f4f4'), [0, 0.1, 0.45]);
    add(g, new THREE.BoxGeometry(0.6, 0.12, 0.7), M('#fafafa'), [0, 0.74, 0.55]);
    swell = sp(g, 0.5, M('#d98f6a', { roughness: 0.5 }), [0.0, 1.0, 0.0], null, [1, 0.9, 1]);
    bruise = sp(g, 0.3, M('#6b3a9c', { roughness: 0.6, transparent: true, opacity: 0 }), [0.0, 0.95, 0.38], null, [1.3, 1, 0.5]);
    sheen = null;
  }
  return { g, v: { red: 0, gel: 0, swell: 0, bruise: 0 }, upd(v) {
    tmpC.copy(skinC).lerp(redC, clamp(v.red)); skin.color.copy(tmpC);
    if (sheen) sheen.material.opacity = 0.42 * clamp(v.gel);
    if (swell) { swell.scale.setScalar(1 + 0.4 * v.swell); swell.material.color.copy(tmpC.clone().lerp(CC('#d96a5a'), v.swell * 0.6)); }
    if (bruise) bruise.material.opacity = clamp(v.bruise) * 0.85;
  } };
}

// ------------------------------------------------------------------------------------------
// Compressa: 'ice' = saco com gelo (v.wrap enrola no pano), 'warm' = pano morno com vapor
function compress(o) {
  const g = new THREE.Group(), kind = o.kind || 'warm', R = rng(7);
  const cloth = new THREE.Group(); const cm = M(kind === 'ice' ? '#e9f2fa' : '#f6efe2', { roughness: 1 });
  bx(cloth, 3.0, 0.36, 1.9, cm, [0, 0.28, 0]); [-0.5, 0.5].forEach(z => bx(cloth, 3.02, 0.02, 0.12, kind === 'ice' ? '#7fb6e6' : '#e6b07a', [0, 0.47, z])); cloth.position.y = 0; g.add(cloth);
  const bag = new THREE.Group(); const bagM = GL('#e3f3ff', 0.35); bag.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.4), bagM)); bag.position.set(0, 0.5, 0);
  for (let i = 0; i < 9; i++) bx(bag, 0.42, 0.34, 0.42, M('#cdeeff', { transparent: true, opacity: 0.85, roughness: 0.1 }), [(i % 4 - 1.5) * 0.5, 0.0 + (i > 4 ? 0.28 : 0), (Math.floor(i / 5) - 0.5) * 0.45 + (R() - 0.5) * 0.1], [R(), R(), R()]); g.add(bag);
  const steam = FX.white({ count: 18, life: 1.8, origin: [0, 0.55, 0], spread: [1.1, 0, 0.7], vel: [0, 0.8, 0], s0: 0.3, s1: 0.9, c0: [1, 1, 1, 0.45] }); g.add(steam.points);
  const mist = FX.white({ count: 20, life: 2.2, origin: [0, 0.8, 0], spread: [1.1, 0, 0.7], vel: [0, -0.2, 0], velSpread: [0.4, 0.1, 0.4], s0: 0.3, s1: 0.8, c0: [0.75, 0.9, 1, 0.35] }); g.add(mist.points);
  if (o.upright) { const w = new THREE.Group(); while (g.children.length) w.add(g.children[0]); w.rotation.x = Math.PI / 2; g.add(w); }
  return { g, v: { wrap: kind === 'ice' ? 0 : 1, steam: kind === 'ice' ? 0 : 1, mist: kind === 'ice' ? 1 : 0, bag: kind === 'ice' ? 1 : 0 }, upd(v) {
    bag.visible = v.bag > 0.5; cloth.visible = v.wrap > 0.02; cloth.position.y = (1 - v.wrap) * 1.2; cloth.scale.set(1, 1 + 0.2 * v.wrap, 1); steam.u.amt.value = v.steam; mist.u.amt.value = v.mist;
  } };
}

// ------------------------------------------------------------------------------------------
// Banheira com água (v.level, v.milk: aveia dissolvida) e espuma/vapor
function tub(o) {
  const g = new THREE.Group(), W = o.w || 7, D = o.d || 3.4, Hh = o.h || 2.2, T = 0.3, shell = M(o.color || '#ffffff', { roughness: 0.25 });
  bx(g, W, 0.3, D, shell, [0, 0.15, 0]); bx(g, W, Hh, T, shell, [0, Hh / 2, D / 2 - T / 2]); bx(g, W, Hh, T, shell, [0, Hh / 2, -D / 2 + T / 2]); bx(g, T, Hh, D, shell, [-W / 2 + T / 2, Hh / 2, 0]); bx(g, T, Hh, D, shell, [W / 2 - T / 2, Hh / 2, 0]);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cy(g, 0.22, 0.28, 0.35, '#c0b08a', [a * (W / 2 - 0.5), -0.1, b * (D / 2 - 0.4)]));
  const wm = new THREE.MeshStandardMaterial({ color: '#8fd0f5', roughness: 0.1, transparent: true, opacity: 0.88 }), water = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * T, 1, D - 2 * T), wm); g.add(water);
  const steam = FX.white({ count: 20, life: 2.2, origin: [0, Hh * 0.8, 0], spread: [W * 0.35, 0, D * 0.3], vel: [0, 0.7, 0], s0: 0.5, s1: 1.4, c0: [1, 1, 1, 0.3] }); g.add(steam.points);
  const foam = FX.bubbles({ count: 40, life: 3, origin: [0, Hh * 0.8, 0], spread: [W * 0.35, 0, D * 0.3], vel: [0, 0.1, 0], velSpread: [0.3, 0.05, 0.3], s0: 0.35, s1: 0.45, c0: [1, 1, 1, 0.85] }); g.add(foam.points);
  const a = CC('#8fd0f5'), b = CC('#f3efe3'), tmp = new THREE.Color();
  return { g, v: { level: 0.2, milk: 0, steam: 0, foam: 0 }, upd(v, t) {
    const h = Math.max(0.01, (Hh - 0.35) * clamp(v.level)); water.scale.y = h; water.position.y = 0.3 + h / 2; water.visible = v.level > 0.01;
    tmp.copy(a).lerp(b, clamp(v.milk)); wm.color.copy(tmp); wm.opacity = lerp(0.82, 0.97, clamp(v.milk)); steam.u.amt.value = v.steam; foam.u.amt.value = v.foam; steam.points.position.y = h - Hh * 0.75; foam.points.position.y = h - Hh * 0.75; void t;
  } };
}

// ------------------------------------------------------------------------------------------
// Liquidificador: jarra com aveia (v.fill nível, v.grind 0→1 de flocos a pó) e lâminas girando (v.spin)
function blender(o) {
  const g = new THREE.Group(), H = 2.6, R = 0.8;
  bx(g, 2.0, 1.1, 1.8, '#3a3f48', [0, 0.55, 0]); cy(g, 0.14, 0.14, 0.1, '#e8453c', [0.55, 0.8, 0.92], [Math.PI / 2, 0, 0]); cy(g, 0.14, 0.14, 0.1, '#cfd3da', [-0.05, 0.8, 0.92], [Math.PI / 2, 0, 0]);
  cy(g, 0.85, 0.7, 0.2, '#555b63', [0, 1.2, 0]);
  const jg = new THREE.Group(); jg.position.y = 1.3; g.add(jg);
  add(jg, new THREE.CylinderGeometry(R * 1.12, R * 0.78, H, 28, 1, true), GL('#d6edf7', 0.26), [0, H / 2, 0]);
  const fm = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.7, 1, 24), M('#d9bf8a', { roughness: 1 })); jg.add(fm);
  const blades = new THREE.Group(); [0, 1].forEach(i => bx(blades, 1.1, 0.04, 0.14, '#cfd3da', [0, 0.1, 0], [0, i * 1.57, 0])); jg.add(blades);
  const lid = new THREE.Group(); cy(lid, R * 1.14, R * 1.14, 0.15, '#2a2e36', [0, 0, 0]); sp(lid, 0.14, '#2a2e36', [0, 0.14, 0]); jg.add(lid);
  const cloud = FX.white({ count: 24, life: 1.2, origin: [0, 1.4, 0], spread: [0.45, 0.6, 0.45], vel: [0, 0.2, 0], velSpread: [0.4, 0.2, 0.4], s0: 0.35, s1: 0.7, c0: [0.96, 0.92, 0.82, 0.55], swirl: 0.8 }); jg.add(cloud.points);
  const fa = CC('#d9bf8a'), fb = CC('#f2e8d0'), tmp = new THREE.Color();
  return { g, v: { fill: 0, grind: 0, spin: 0, lid: 1 }, upd(v, t) {
    const h = Math.max(0.01, clamp(v.fill) * (H * 0.7)); fm.visible = v.fill > 0.01; fm.scale.set(R * 0.95, h, R * 0.95); fm.position.y = 0.15 + h / 2; tmp.copy(fa).lerp(fb, clamp(v.grind)); fm.material.color.copy(tmp);
    blades.rotation.y = t * 40 * v.spin; cloud.u.amt.value = v.spin * 0.8 * v.lid; lid.visible = v.lid > 0.5; lid.position.y = H + 0.08;
    g.position.x += 0; g.rotation.z = Math.sin(t * 60) * 0.008 * v.spin;
  } };
}

// ------------------------------------------------------------------------------------------
// Fogão com boca acesa (v.flame) — a panela vem como outro objeto por cima
function stove(o) {
  const g = new THREE.Group(); bx(g, 4.4, 0.9, 3.2, '#e6e8ec', [0, 0.45, 0]); bx(g, 4.4, 0.1, 3.2, '#2b2e34', [0, 0.95, 0]);
  [[-1.0, -0.5], [1.0, -0.5], [-1.0, 0.7], [1.0, 0.7]].forEach(([x, z]) => { cy(g, 0.5, 0.5, 0.05, '#555a63', [x, 1.02, z]); });
  [-1.5, -0.5, 0.5, 1.5].forEach(x => cy(g, 0.12, 0.12, 0.1, '#222', [x, 0.6, 1.62], [Math.PI / 2, 0, 0]));
  const fl = FX.fire({ count: 40, life: 0.5, origin: [0, 1.05, -0.5], spread: [0.4, 0, 0.1], vel: [0, 0.7, 0], velSpread: [0.1, 0.1, 0.1], s0: 0.5, s1: 0.1 }); g.add(fl.points);
  return { g, v: { flame: 0 }, upd(v) { fl.u.amt.value = v.flame; fl.points.visible = v.flame > 0.01; } };
}

// ------------------------------------------------------------------------------------------
// Frasco apertável (lavagem nasal / soro): v.squeeze joga um fio d'água em arco
function squeeze(o) {
  const g = new THREE.Group(), H = o.h || 2.2, body = new THREE.Group(); g.add(body);
  add(body, new THREE.CylinderGeometry(0.55, 0.62, H, 24, 1, true), GL('#e6f3ff', 0.32), [0, H / 2, 0]); cy(body, 0.62, 0.62, 0.08, GL('#d9ecf8', 0.5), [0, 0.04, 0]);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.6, 1, 24), new THREE.MeshStandardMaterial({ color: '#bfe7ff', transparent: true, opacity: 0.8, roughness: 0.1 })); body.add(liq);
  cy(body, 0.2, 0.55, 0.45, '#e8eef4', [0, H + 0.22, 0]); cy(body, 0.12, 0.2, 0.45, o.cap || '#2f7ad6', [0, H + 0.62, 0]);
  const lt = canvasTex(256, 200, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#2f7ad6'; c.font = '900 56px Montserrat, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.text || 'SORO', w / 2, h * 0.38); c.font = '800 34px Montserrat, Arial'; c.fillText(o.sub || '0,9%', w / 2, h * 0.7); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.75), new THREE.MeshBasicMaterial({ map: lt, toneMapped: false })); lab.position.set(0, H * 0.45, 0.6); body.add(lab);
  const jet = FX.water({ count: 60, life: 0.75, origin: [0, H + 0.9, 0], spread: [0.02, 0, 0.02], vel: [2.6, 1.9, 0], velSpread: [0.1, 0.1, 0.05], gravity: [0, -7, 0], s0: 0.22, s1: 0.16, c0: [0.75, 0.92, 1, 0.95] }); g.add(jet.points);
  return { g, v: { squeeze: 0, fill: 0.8, tilt: 0 }, upd(v) {
    liq.scale.set(1, Math.max(0.01, (H - 0.1) * v.fill), 1); liq.position.y = 0.08 + liq.scale.y / 2; jet.u.amt.value = v.squeeze; jet.points.visible = v.squeeze > 0.02;
    const th = -v.tilt * 0.9; body.rotation.z = th; body.scale.set(1 - 0.12 * v.squeeze, 1, 1);
    const L = H + 0.9, sx = -Math.sin(th), sy = Math.cos(th); jet.u.origin.value.set(sx * L, sy * L, 0); jet.u.vel.value.set(sx * 3.0, sy * 3.0 + 0.4, 0);
  } };
}

// ------------------------------------------------------------------------------------------
// Parede de fundo (azulejo/janela/prateleira) para dar cara de cozinha ou banheiro
function wall(o) {
  const g = new THREE.Group(), Wd = o.w || 90, Ht = o.h || 34, tile = o.tile || '#f1ece0', grout = o.grout || '#c9c1ae';
  const tx = canvasTex(256, 128, (c, w, h) => { c.fillStyle = tile; c.fillRect(0, 0, w, h); c.strokeStyle = grout; c.lineWidth = 4; for (let y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < w; x += 64) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 32); c.stroke(); } } });
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(Wd / 2.6, Ht / 1.3);
  add(g, new THREE.PlaneGeometry(Wd, Ht), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.4 }), [0, Ht / 2, 0]);
  if (o.window !== false) { const wx = o.windowX ?? -7; bx(g, 8.4, 6.8, 0.2, '#8a5a38', [wx, 11, 0.12]); add(g, new THREE.PlaneGeometry(7.6, 6.0), new THREE.MeshBasicMaterial({ color: '#dff1ff', toneMapped: false }), [wx, 11, 0.24]); bx(g, 0.16, 6.0, 0.1, '#8a5a38', [wx, 11, 0.3]); bx(g, 7.6, 0.16, 0.1, '#8a5a38', [wx, 11, 0.3]); }
  if (o.shelf !== false) { const sx = o.shelfX ?? 7; bx(g, 8, 0.25, 1.4, '#9a6b3f', [sx, 8.4, 0.7]); ['#e2a13a', '#cf5a4a', '#5aa86a', '#e8d9a8', '#7a9ad1'].forEach((c, i) => { cy(g, 0.62, 0.62, 1.5 + (i % 2) * 0.5, c, [sx - 3 + i * 1.5, 9.4 + (i % 2) * 0.25, 0.7]); }); }
  return { g, v: {}, upd() {} };
}

export const RECIPE_PROPS = { blender, dipper, vessel, spoon, jar, lemon, ginger, herb, strainer, board, knife, aloe, limb, compress, tub, stove, squeeze, wall };
