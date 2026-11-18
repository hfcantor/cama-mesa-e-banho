// Personagens 3D estilizados (proporção cartoon, cabeça grande, olhos
// expressivos) com esqueleto simples e poses procedurais.
import * as THREE from 'three';

const geoCache = {};
const G = (k, f) => geoCache[k] || (geoCache[k] = f());
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o });

const lerp = (a, b, k) => a + (b - a) * k;
const damp = (cur, target, k, dt) => lerp(cur, target, 1 - Math.exp(-k * dt));

export class Character {
  constructor(o = {}) {
    const {
      skin = '#c98a5e', shirt = '#d94f2b', pants = '#2f4a7a', shoes = '#3b2a20',
      hair = '#2a1a12', hat = false, coat = false, glasses = false, scale = 1, kid = false,
    } = o;
    this.root = new THREE.Group();
    this.root.scale.setScalar(scale);
    const S = mat(skin), SH = mat(shirt), P = mat(pants), SO = mat(shoes, { roughness: 0.8 });
    const legL = kid ? 0.42 : 0.55;

    this.hips = new THREE.Group(); this.hips.position.y = legL + 0.1; this.root.add(this.hips);
    // tronco
    const torsoH = kid ? 0.5 : 0.62;
    this.torso = new THREE.Group(); this.hips.add(this.torso);
    const body = new THREE.Mesh(G('torso' + kid, () => new THREE.CapsuleGeometry(kid ? 0.24 : 0.27, torsoH - 0.3, 8, 16)), coat ? mat('#d6dbe3') : SH);
    body.position.y = torsoH * 0.5; body.scale.set(1, 1, 0.8);
    this.torso.add(body);
    if (coat) {
      const shirtV = new THREE.Mesh(G('vneck', () => new THREE.BoxGeometry(0.12, 0.3, 0.05)), SH);
      shirtV.position.set(0, torsoH * 0.72, 0.21); this.torso.add(shirtV);
      const coatTail = new THREE.Mesh(G('tail', () => new THREE.CylinderGeometry(0.27, 0.33, 0.35, 16, 1, true)), mat('#d6dbe3', { side: THREE.DoubleSide }));
      coatTail.position.y = -0.05; coatTail.scale.z = 0.8; this.torso.add(coatTail);
    }
    // cabeça
    this.neck = new THREE.Group(); this.neck.position.y = torsoH + 0.05; this.torso.add(this.neck);
    this.head = new THREE.Group(); this.neck.add(this.head);
    const headR = kid ? 0.34 : 0.3;
    this.headR = headR;
    const skull = new THREE.Mesh(G('head' + headR, () => new THREE.SphereGeometry(headR, 32, 24)), S);
    skull.position.y = headR * 0.95; skull.scale.set(1, 1.02, 0.96);
    this.head.add(skull);
    const ear = G('ear', () => new THREE.SphereGeometry(0.07, 12, 8));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(ear, S); e.position.set(s * headR * 0.97, headR * 0.9, 0); e.scale.set(0.5, 1, 0.8); this.head.add(e); });
    const nose = new THREE.Mesh(G('nose', () => new THREE.SphereGeometry(0.055, 12, 8)), S);
    nose.position.set(0, headR * 0.82, headR * 0.95); this.head.add(nose);
    // cabelo
    const hm = mat(hair, { roughness: 0.9 });
    const hairM = new THREE.Mesh(G('hair' + headR, () => new THREE.SphereGeometry(headR * 1.04, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42)), hm);
    hairM.position.y = headR * 1.0; hairM.rotation.x = -0.25; this.head.add(hairM);
    // olhos
    this.eyes = [];
    const white = mat('#e6e6e2', { roughness: 0.35 }), black = mat('#111111', { roughness: 0.1 });
    [-1, 1].forEach(s => {
      const eg = new THREE.Group();
      eg.position.set(s * headR * 0.36, headR * 1.05, headR * 0.82);
      const sclera = new THREE.Mesh(G('scl', () => new THREE.SphereGeometry(0.085, 16, 12)), white);
      sclera.scale.set(1, 1.2, 0.6);
      const pupil = new THREE.Mesh(G('pup', () => new THREE.SphereGeometry(0.045, 12, 8)), black);
      pupil.position.z = 0.045;
      const shine = new THREE.Mesh(G('shn', () => new THREE.SphereGeometry(0.014, 8, 6)), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.35 }));
      shine.position.set(0.015, 0.02, 0.085);
      eg.add(sclera, pupil, shine);
      const lid = new THREE.Mesh(G('lid', () => new THREE.SphereGeometry(0.092, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5)), S);
      lid.scale.set(1.02, 1.25, 0.7);
      eg.add(lid);
      const brow = new THREE.Mesh(G('brow', () => new THREE.CapsuleGeometry(0.018, 0.09, 4, 8)), hm);
      brow.rotation.z = Math.PI / 2; brow.position.set(0, 0.14, 0.03);
      const browG = new THREE.Group(); browG.add(brow); eg.add(browG);
      this.head.add(eg);
      this.eyes.push({ g: eg, pupil, lid, brow: browG, s, shine });
    });
    // boca
    this.mouth = new THREE.Mesh(G('mouth', () => new THREE.SphereGeometry(0.06, 16, 10)), mat('#5a1a1a', { roughness: 0.5 }));
    this.mouth.position.set(0, headR * 0.55, headR * 0.9); this.mouth.scale.set(1, 0.25, 0.4);
    this.head.add(this.mouth);
    if (glasses) {
      const gm = mat('#222', { metalness: 0.5, roughness: 0.3 });
      [-1, 1].forEach(s => { const r = new THREE.Mesh(G('gl', () => new THREE.TorusGeometry(0.1, 0.012, 8, 24)), gm); r.position.set(s * headR * 0.36, headR * 1.05, headR * 0.93); this.head.add(r); });
      const br = new THREE.Mesh(G('glb', () => new THREE.BoxGeometry(0.08, 0.015, 0.015)), gm); br.position.set(0, headR * 1.08, headR * 0.95); this.head.add(br);
    }
    if (hat) {
      const hmM = mat('#e2c071', { roughness: 0.95 });
      const brim = new THREE.Mesh(G('brim', () => new THREE.CylinderGeometry(headR * 1.75, headR * 1.85, 0.03, 32)), hmM);
      brim.position.y = headR * 1.55;
      const crown = new THREE.Mesh(G('crown', () => new THREE.CylinderGeometry(headR * 0.8, headR * 0.98, headR * 0.6, 24)), hmM);
      crown.position.y = headR * 1.85;
      const band = new THREE.Mesh(G('band', () => new THREE.CylinderGeometry(headR * 0.985, headR * 0.99, 0.06, 24)), mat('#8a3b1e'));
      band.position.y = headR * 1.6;
      const hatG = new THREE.Group(); hatG.add(brim, crown, band); hatG.rotation.x = -0.12;
      this.head.add(hatG); this.hat = hatG;
    }
    // braços
    this.arms = [-1, 1].map(s => {
      const sh = new THREE.Group(); sh.position.set(s * (kid ? 0.27 : 0.31), torsoH * 0.85, 0);
      const upper = new THREE.Mesh(G('arm' + kid, () => new THREE.CapsuleGeometry(0.075, kid ? 0.28 : 0.36, 6, 12)), coat ? mat('#d6dbe3') : SH);
      upper.position.y = -(kid ? 0.2 : 0.24);
      const elbow = new THREE.Group(); elbow.position.y = -(kid ? 0.36 : 0.44);
      const fore = new THREE.Mesh(G('fore' + kid, () => new THREE.CapsuleGeometry(0.065, kid ? 0.18 : 0.24, 6, 12)), S);
      fore.position.y = -0.13;
      const hand = new THREE.Mesh(G('hand', () => new THREE.SphereGeometry(0.08, 12, 10)), S);
      hand.position.y = -(kid ? 0.3 : 0.34);
      elbow.add(fore, hand); sh.add(upper, elbow);
      this.torso.add(sh);
      return { sh, elbow, s };
    });
    // pernas
    this.legs = [-1, 1].map(s => {
      const hip = new THREE.Group(); hip.position.set(s * 0.13, 0.02, 0);
      const leg = new THREE.Mesh(G('leg' + kid, () => new THREE.CapsuleGeometry(0.09, legL - 0.12, 6, 12)), P);
      leg.position.y = -legL * 0.5;
      const shoe = new THREE.Mesh(G('shoe', () => new THREE.SphereGeometry(0.11, 12, 8)), SO);
      shoe.scale.set(0.9, 0.55, 1.4); shoe.position.set(0, -legL - 0.03, 0.05);
      hip.add(leg, shoe); this.hips.add(hip);
      return { hip, s };
    });
    this.root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

    // Estado de pose (o roteiro manipula estes valores)
    this.pose = { walk: 0, run: 0, armsUp: 0, point: 0, cover: 0, scared: 0, surprise: 0, smile: 0.3, sleep: 0, lookYaw: 0, lookPitch: 0, typing: 0, shake: 0, wave: 0 };
    this.cur = { ...this.pose };
    this.phase = 0;
  }

  update(t, dt) {
    const p = this.pose, c = this.cur;
    for (const k in p) c[k] = damp(c[k], p[k], 7, dt);
    const speed = c.walk * 6 + c.run * 11;
    this.phase += dt * speed;
    const ph = this.phase;
    const stride = c.walk * 0.5 + c.run * 0.9;
    const bounce = Math.abs(Math.sin(ph)) * (c.walk * 0.04 + c.run * 0.09);
    const breath = Math.sin(t * 2.2) * 0.012 * (1 - c.sleep);
    const tremble = c.scared * Math.sin(t * 40) * 0.012 + c.shake * Math.sin(t * 31) * 0.03;
    this.hips.position.y = this.hips.userData.y0 ?? (this.hips.userData.y0 = this.hips.position.y);
    this.hips.position.y = this.hips.userData.y0 + bounce + breath;
    this.torso.rotation.x = c.run * 0.25 + c.scared * -0.08 + c.typing * 0.15 - c.sleep * 0.2;
    this.torso.rotation.z = Math.sin(ph) * 0.03 * stride + tremble;
    this.torso.scale.y = 1 + breath * 1.5;
    // cabeça
    this.head.rotation.y = c.lookYaw + Math.sin(t * 0.7) * 0.04 * (1 - c.sleep);
    this.head.rotation.x = -c.lookPitch - c.run * 0.15 + c.sleep * 0.35 + c.typing * 0.15;
    this.head.rotation.z = c.sleep * 0.3 + tremble * 2;
    // braços
    this.arms.forEach(({ sh, elbow, s }, i) => {
      const swing = Math.sin(ph + (i ? Math.PI : 0)) * stride;
      let rx = swing, rz = s * 0.12, ex = -0.25 - c.run * 0.9;
      rx = lerp(rx, -2.9, c.armsUp); rz = lerp(rz, s * 0.45, c.armsUp); ex = lerp(ex, -0.2, c.armsUp);
      if (i === 1) { rx = lerp(rx, -2.6, c.point); rz = lerp(rz, 0.15, c.point); ex = lerp(ex, 0, c.point); }
      if (i === 1 && c.wave > 0.01) { rx = lerp(rx, -2.8, c.wave); rz = lerp(rz, 0.5 + Math.sin(t * 9) * 0.35, c.wave); ex = lerp(ex, -0.3, c.wave); }
      rx = lerp(rx, -1.3, c.cover); rz = lerp(rz, -s * 0.7, c.cover); ex = lerp(ex, -1.9, c.cover);
      rx = lerp(rx, -1.1 + Math.sin(t * 18 + i * 2) * 0.06, c.typing); rz = lerp(rz, -s * 0.25, c.typing); ex = lerp(ex, -0.7, c.typing);
      rx = lerp(rx, 0.1, c.sleep); ex = lerp(ex, -1.6, c.sleep); rz = lerp(rz, -s * 0.6, c.sleep);
      sh.rotation.set(rx, 0, rz + tremble * 3);
      elbow.rotation.x = ex;
    });
    this.legs.forEach(({ hip }, i) => {
      const swing = Math.sin(ph + (i ? 0 : Math.PI)) * stride;
      hip.rotation.x = swing;
    });
    // rosto
    const blink = (t % 3.7) < 0.12 ? 1 : 0;
    this.eyes.forEach(e => {
      const open = Math.max(0, 1 - blink - c.sleep);
      e.lid.rotation.x = lerp(-1.9, -0.15, 1 - open) - c.surprise * 0.3 - c.scared * 0.2;
      e.pupil.position.x = Math.sin(c.lookYaw * 0.3) * 0.02;
      e.pupil.scale.setScalar(1 - c.surprise * 0.35);
      e.brow.position.y = c.surprise * 0.05 + c.scared * 0.03;
      e.brow.rotation.z = e.s * (c.scared * 0.35 - c.smile * 0.05) * -1;
    });
    const open = Math.max(c.surprise, c.scared * 0.6);
    this.mouth.scale.set(1 - open * 0.25 + c.smile * 0.4, 0.22 + open * 0.95, 0.4);
  }
}
