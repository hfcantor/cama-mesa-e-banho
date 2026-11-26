// Cenário: dormitório (cama com lençol, 2 fronhas, edredom e colchão — tudo suja).
import * as THREE from 'three';
import { RoomWorld, M, tex } from './room.js';
import { woodTexture, wallTexture, BED_TOP } from './quarto.js';
import { makeCanvas } from '../cloth.js';

// câmeras prontas: [posA, lookA, fovA, posB, lookB, fovB]
const C = (a, la, fa, b, lb, fb) => [{ u: 0, pos: a, look: la, fov: fa }, { u: 1, pos: b, look: lb ?? la, fov: fb ?? fa }];
export const CAMS = {
  wide: C([0, 1.9, 3.0], [0, 0.8, -1.4], 52, [0, 1.7, 2.4], null, 50),
  wide2: C([-1.9, 2.1, 0.8], [0.1, 0.6, -1.5], 50, [-1.5, 1.8, 0.4], null, 48),
  wide3: C([1.7, 2.4, 0.5], [-0.1, 0.6, -1.5], 50, [1.2, 2.1, 0.4], null, 48),
  room: C([0, 1.7, 3.3], [0, 0.8, -1.4], 52, [0, 2.35, 3.6], [0, 0.7, -1.4], 54),
  top: C([0, 3.2, -0.6], [0, 0.6, -1.4], 46, [0.4, 2.7, -0.9], null, 46),
  item: C([1.6, 1.6, 0.5], [-0.4, 0.8, -1.5], 50, [1.2, 1.4, 0.0], [-0.4, 0.8, -1.6], 48),
  itemClose: C([0.6, 1.5, -0.8], [-0.2, 0.95, -1.8], 44, [0.3, 1.3, -1.1], [-0.3, 0.9, -1.8], 38),
  macro: C([0.0, 1.0, -0.6], [-0.15, 0.62, -1.4], 40, [-0.1, 0.85, -0.85], [-0.15, 0.62, -1.45], 26),
  face: C([-0.3, 2.05, -0.8], [-0.4, 1.0, -2.05], 40, [-0.35, 1.8, -1.0], null, 36),
  faceFar: C([1.0, 1.7, -0.2], [-0.4, 0.95, -2.0], 42, [0.8, 1.6, -0.5], null, 38),
  hero: C([0.3, 1.1, -0.65], [0.5, 0.8, -2.0], 38, [0.4, 1.0, -0.85], null, 32),
  heroSide: C([1.4, 1.25, -0.8], [0.45, 0.8, -2.05], 42, [1.1, 1.1, -0.9], null, 36),
  pillow: C([1.0, 1.25, -0.6], [0.1, 0.7, -2.1], 46, [0.3, 1.2, -0.8], [0.0, 0.72, -2.1], 42),
  crowd: C([0.6, 1.6, 0.5], [0, 0.66, -1.65], 40, [0.4, 1.35, 0.1], null, 36),
  calendar: C([1.55, 1.6, -1.2], [1.55, 1.55, -2.46], 44, [1.55, 1.58, -1.5], null, 40),
  door: C([-0.9, 1.4, 0.7], [2.3, 1.1, 1.6], 46, [-0.5, 1.35, 0.9], null, 40),
  doorWide: C([-1.2, 1.6, 0.4], [2.3, 1.1, 1.6], 50, [-0.6, 1.5, 0.7], null, 46),
  tower: C([0, 0.9, 0.9], [0, 1.0, -1.3], 50, [0.4, 1.4, 1.5], [0, 1.5, -1.3], 54),
  sign: C([0.3, 1.0, -0.8], [0.5, 0.85, -2.0], 44, [0.4, 1.1, -0.8], [0.4, 1.3, -2.4], 40),
  stand: C([0.2, 1.5, 3.8], [0, 1.1, 0.7], 44, [0.1, 1.4, 3.1], [0, 1.2, 0.7], 40),
  low: C([0, 1.5, 1.6], [0, 0.5, -1.0], 56, [0.4, 1.1, 1.4], [0.4, 0.4, -0.8], 56),
  sunny: C([1.5, 1.7, 1.4], [0, 0.8, -1.4], 50, [0.8, 1.4, 0.8], [0, 0.75, -1.5], 46),
  side: C([1.4, 1.5, -0.4], [-0.4, 0.9, -1.7], 48, [1.0, 1.3, -0.7], [-0.4, 0.9, -1.8], 42),
  tall: C([0, 1.4, 2.2], [0, 1.2, 0.7], 44, [0, 1.5, 3.0], [0, 1.1, 0.7], 50),
};
export const STAND = [-1.15, -1.3, 0.35]; // onde o Tito fica de pé ao lado da cama (x, z, giro)

export class DormitorioWorld extends RoomWorld {
  constructor() {
    super({ w: 5, d: 6.6, h: 2.8, cz: 0.8, floor: woodTexture(), wall: wallTexture(), win: { x: -1.5, y: 1.65, w: 1.2, h: 1.36 }, cal: { x: 1.55, y: 1.55 }, doorZ: 1.6, lamp: [1.2, 1.05, -2.0], bg: '#2a1d14' });
    const s = this.scene, wood = M('#8a5a3a', { roughness: 0.7 });
    // tapete e cortinas
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.02, 40), M('#3f7f8f', { roughness: 1 })); rug.position.set(0, 0.01, 0.9); rug.scale.z = 0.7; rug.receiveShadow = true; s.add(rug);
    const rug2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.025, 40), M('#e7c76a', { roughness: 1 })); rug2.position.set(0, 0.012, 0.9); rug2.scale.z = 0.7; s.add(rug2);
    const cc = makeCanvas(128, 64), cg = cc.getContext('2d');
    for (let i = 0; i < 8; i++) { cg.fillStyle = i % 2 ? '#c9684a' : '#e08a64'; cg.fillRect(i * 16, 0, 16, 64); }
    const curM = new THREE.MeshStandardMaterial({ map: tex(cc), side: THREE.DoubleSide, roughness: 1 });
    [-0.7, 0.7].forEach(x => { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.4), curM); c.position.set(-1.5 + x, 1.65, -2.4); s.add(c); });
    // quadro
    const fc = makeCanvas(160, 120), fg = fc.getContext('2d'); fg.fillStyle = '#9fd0e8'; fg.fillRect(0, 0, 160, 120); fg.fillStyle = '#5fa85a'; fg.fillRect(0, 70, 160, 50); fg.fillStyle = '#ffd24d'; fg.beginPath(); fg.arc(120, 30, 16, 0, 7); fg.fill();
    const pic = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.46, 0.03), M('#fff', { map: tex(fc) })); pic.position.set(0, 1.9, -2.48); s.add(pic);
    const picF = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.54, 0.025), wood); picF.position.set(0, 1.9, -2.49); s.add(picF);
    // criado-mudo + abajur
    const ns = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.45), wood); ns.position.set(1.4, 0.28, -2.22); ns.castShadow = true; s.add(ns);
    const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.25, 12), M('#d9c9a0')); lb.position.set(1.4, 0.68, -2.22);
    this.lampMat = new THREE.MeshStandardMaterial({ color: '#fff1c8', emissive: '#ffb65a', emissiveIntensity: 1.4, roughness: 0.6, side: THREE.DoubleSide });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.22, 16, 1, true), this.lampMat); shade.position.set(1.4, 0.92, -2.22);
    s.add(lb, shade);

    // cama
    const bed = this.bed = new THREE.Group(); s.add(bed);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.34, 2.14), wood); base.position.set(0, 0.2, -1.41); base.castShadow = base.receiveShadow = true;
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.84, 1.05, 0.09), wood); head.position.set(0, 0.62, -2.46); head.castShadow = true;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.5, 0.08), wood); foot.position.set(0, 0.35, -0.34);
    bed.add(base, head, foot);
    // colchão
    const mt = this.cloth('mattress', { seed: 11, w: 512, h: 512 });
    this.mattress = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.26, 2.02), mt.mat); this.mattress.position.set(0, 0.47, -1.41); this.mattress.receiveShadow = true; bed.add(this.mattress);
    this.fresh(mt, this.mattress);
    // lençol
    const sh = this.cloth('linen', { seed: 1 });
    this.sheet = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.03, 2.06), sh.mat); this.sheet.position.set(0, BED_TOP - 0.015, -1.41); this.sheet.receiveShadow = true; this.sheet.castShadow = true; bed.add(this.sheet);
    this.sheetF = this.fresh(sh, this.sheet);
    // fronhas
    this.pillows = [-0.4, 0.4].map((x, i) => {
      const pc = this.cloth('linen', { seed: 2 + i, w: 256, h: 256 });
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 18), pc.mat); p.scale.set(0.62, 0.17, 0.4); p.position.set(x, BED_TOP + 0.08, -2.1); p.rotation.y = (i ? -0.06 : 0.05); p.castShadow = p.receiveShadow = true; bed.add(p);
      this.fresh(pc, p); return p;
    });
    // edredom (cobre a metade de baixo; colorido para parecer edredom, não lençol)
    const dv = this.cloth('duvet', { seed: 7 });
    this.duvet = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.16, 1.1), dv.mat); this.duvet.position.set(0, BED_TOP + 0.08, -0.95); this.duvet.castShadow = this.duvet.receiveShadow = true; bed.add(this.duvet);
    this.duvetF = this.fresh(dv, this.duvet);

    this.area = { x0: -0.7, x1: 0.7, y0: BED_TOP, y1: BED_TOP, z0: -2.2, z1: -0.6 };
    this.headPos = [-0.4, BED_TOP + 0.4, -2.0];
    this.towerPos = [0, BED_TOP, -1.3];
    this.signPos = [0.4, 1.3, -2.38];
    this.stovePos = [0.55, BED_TOP + 0.2, -2.05];
    this.finish();
  }

  setTitoLying(x = -0.4) { this.setTitoAt([x, BED_TOP + 0.2, -0.78], [-Math.PI / 2, 0, 0]); this.state.titoInBed = 1; }
  onUpdate(t, dt, st) {
    const A = this.area, f = this.focus || 'sheet';
    if (f === 'pillow') Object.assign(A, { x0: -0.5, x1: 0.55, y0: 0.76, y1: 0.76, z0: -2.25, z1: -1.95 });
    else if (f === 'duvet') Object.assign(A, { x0: -0.7, x1: 0.7, y0: 0.79, y1: 0.79, z0: -1.4, z1: -0.5 });
    else if (f === 'mattress') Object.assign(A, { x0: -0.7, x1: 0.7, y0: 0.61, y1: 0.61, z0: -2.2, z1: -0.6 });
    else { A.x0 = st.titoInBed ? 0.1 : -0.7; A.x1 = 0.7; A.y0 = A.y1 = BED_TOP; A.z0 = -2.2; A.z1 = -0.6; }
    if (st.bare) { this.sheet.visible = this.sheetF.visible = this.duvet.visible = this.duvetF.visible = false; } // colchão "pelado"
    this.lampMat.emissiveIntensity = 1.4 * st.lamp;
    this.bed.rotation.z = Math.sin(t * 38) * 0.01 * st.bedShake;
  }
}
