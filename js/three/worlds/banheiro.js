// Cenário: banheiro (toalha de banho, tapete, cortina do box, pia, chuveiro).
import * as THREE from 'three';
import { RoomWorld, M, tex } from './room.js';
import { makeCanvas } from '../cloth.js';

const C = (a, la, fa, b, lb, fb) => [{ u: 0, pos: a, look: la, fov: fa }, { u: 1, pos: b, look: lb ?? la, fov: fb ?? fa }];
// Banheiro 4,2 × 4,6 (parede de fundo em z = -1.5). Box à esquerda, toalheiro ao centro, pia à direita.
export const CAMS = {
  wide: C([0, 1.8, 2.7], [0, 0.9, -1.2], 54, [0, 1.65, 2.2], null, 52),
  wide2: C([-1.6, 2.0, 1.6], [0.2, 0.8, -1.2], 52, [-1.2, 1.8, 1.2], null, 50),
  wide3: C([1.6, 2.2, 1.4], [-0.3, 0.8, -1.2], 52, [1.2, 1.9, 1.0], null, 50),
  room: C([0, 1.6, 2.8], [0, 0.9, -1.2], 54, [0, 2.2, 3.1], [0, 0.8, -1.2], 56),
  top: C([0, 3.0, 0.4], [0, 0.4, -1.0], 48, [0.4, 2.6, 0.0], null, 48),
  item: C([0.9, 1.6, 0.3], [0.5, 1.0, -1.35], 46, [0.6, 1.5, -0.1], null, 42),            // toalha
  itemClose: C([0.7, 1.5, -0.1], [0.5, 1.05, -1.38], 38, [0.55, 1.35, -0.45], null, 32),
  macro: C([0.5, 1.2, -0.45], [0.5, 0.95, -1.38], 30, [0.5, 1.05, -0.7], null, 22),
  rug: C([0.2, 1.5, 0.7], [-0.2, 0.05, -0.55], 50, [0.1, 1.2, 0.3], null, 44),            // tapete
  rugClose: C([-0.1, 0.9, 0.2], [-0.2, 0.03, -0.55], 40, [-0.15, 0.55, -0.1], null, 30),
  curtain: C([-0.9, 1.4, 1.2], [-1.35, 1.0, -0.8], 50, [-1.1, 1.3, 0.6], null, 44),      // cortina do box
  curtainClose: C([-1.2, 0.8, 0.0], [-1.35, 0.45, -0.8], 40, [-1.3, 0.6, -0.3], null, 30),
  face: C([-0.2, 1.8, 0.9], [-0.3, 1.0, -0.3], 42, [-0.2, 1.6, 0.6], null, 38),
  faceFar: C([1.0, 1.8, 1.4], [-0.2, 1.0, -0.3], 46, [0.8, 1.7, 1.1], null, 42),
  hero: C([0.5, 1.0, 0.1], [0.55, 0.8, -1.3], 40, [0.5, 0.95, -0.1], null, 34),
  heroSide: C([1.4, 1.1, 0.0], [0.5, 0.8, -1.2], 42, [1.1, 1.0, 0.0], null, 36),
  pillow: C([1.0, 1.3, 0.3], [0.55, 0.9, -1.35], 46, [0.6, 1.2, 0.0], null, 42),
  crowd: C([0.8, 1.5, 1.1], [0, 0.1, -0.7], 42, [0.5, 1.3, 0.8], null, 38),
  calendar: C([-0.1, 1.7, 0.1], [-0.1, 1.7, -1.46], 44, [-0.1, 1.72, -0.2], null, 40),
  door: C([-0.6, 1.4, 0.1], [2.1, 1.1, 0.55], 46, [-0.2, 1.35, 0.2], null, 40),
  doorWide: C([-1.0, 1.6, -0.4], [2.0, 1.1, 0.55], 50, [-0.5, 1.5, -0.2], null, 46),
  tower: C([0, 0.9, 1.5], [0, 1.0, -0.5], 50, [0.4, 1.4, 2.0], [0, 1.5, -0.5], 54),
  sign: C([0.3, 1.1, 0.0], [0.4, 1.1, -1.4], 44, [0.4, 1.3, -0.1], [0.4, 1.6, -1.4], 40),
  stand: C([0.2, 1.5, 3.6], [0, 1.1, 0.4], 44, [0.1, 1.4, 3.0], [0, 1.15, 0.4], 40),
  low: C([0, 1.4, 1.4], [0, 0.3, -0.6], 56, [0.4, 1.0, 1.2], [0.4, 0.3, -0.5], 56),
  sunny: C([1.4, 1.7, 1.6], [0, 0.9, -1.0], 50, [0.8, 1.4, 1.0], [0, 0.85, -1.1], 46),
  side: C([1.3, 1.5, 0.6], [-0.4, 0.9, -0.8], 48, [1.0, 1.3, 0.3], null, 42),
  tall: C([0, 1.4, 2.0], [0, 1.2, 0.2], 44, [0, 1.5, 2.8], [0, 1.1, 0.2], 50),
};
export const STAND = [0.2, 0.5, 0.0];

function tileTexture(w, h, base, grout, rows) {
  const c = makeCanvas(w, h), g = c.getContext('2d');
  g.fillStyle = grout; g.fillRect(0, 0, w, h);
  const cw = w / 4, ch = h / rows;
  for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) { g.fillStyle = base; g.fillRect(x * cw + (y % 2 ? cw / 2 : 0) + 3, y * ch + 3, cw - 6, ch - 6); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x * cw + (y % 2 ? cw / 2 : 0) + 5, y * ch + 5, cw - 10, 6); }
  return c;
}

export class BanheiroWorld extends RoomWorld {
  constructor() {
    const fl = tileTexture(512, 512, '#c9d3d6', '#8f9a9e', 4); const wl = tileTexture(512, 512, '#e9f1f3', '#b8c4c8', 8);
    super({ w: 4.2, d: 4.6, h: 2.7, cz: 0.8, floor: tex(fl, [2, 2]), wall: tex(wl, [2, 1.4]), win: null, cal: { x: -0.1, y: 1.7 }, doorZ: 0.5, lamp: [0.3, 2.2, 0.0], bg: '#33383a' });
    const s = this.scene, BZ = this.backZ; // -1.5
    // box (esquerda): bandeja, chuveiro, cortina
    const tray = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.1), M('#dfe6e8', { roughness: 0.4 })); tray.position.set(-1.35, 0.03, BZ + 0.6); tray.receiveShadow = true; s.add(tray);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), M('#c0c4c8', { metalness: 0.8, roughness: 0.3 })); pipe.position.set(-1.35, 1.5, BZ + 0.05); s.add(pipe);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 20), M('#d6dade', { metalness: 0.8, roughness: 0.3 })); head.position.set(-1.35, 2.15, BZ + 0.3); head.rotation.x = 0.4; s.add(head);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 8), M('#c0c4c8', { metalness: 0.8 })); rod.rotation.z = Math.PI / 2; rod.position.set(-1.35, 2.15, BZ + 1.15); s.add(rod);
    const cur = this.cloth('curtain', { seed: 21, w: 512, h: 512, rough: 1, side: THREE.DoubleSide });
    const cg = new THREE.PlaneGeometry(1.4, 2.0, 28, 4), cp = cg.attributes.position; // dobras
    for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin(cp.getX(i) * 14) * 0.035);
    cg.computeVertexNormals();
    this.curtain = new THREE.Mesh(cg, cur.mat); this.curtain.position.set(-1.35, 1.1, BZ + 1.15); this.curtain.castShadow = true; s.add(this.curtain);
    this.fresh(cur, this.curtain);
    // toalheiro + toalha de banho (centro)
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), M('#c0c4c8', { metalness: 0.8, roughness: 0.3 })); bar.rotation.z = Math.PI / 2; bar.position.set(0.5, 1.45, BZ + 0.12); s.add(bar);
    const tw = this.cloth('terry', { seed: 31, w: 512, h: 512 });
    this.towel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.95, 0.06), tw.mat); this.towel.position.set(0.5, 0.95, BZ + 0.15); this.towel.castShadow = true; s.add(this.towel);
    this.fresh(tw, this.towel);
    // pia (direita) com espelho
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.5), M('#e8dcc8')); cab.position.set(1.5, 0.4, BZ + 0.3); cab.castShadow = true; s.add(cab);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.1, 20), M('#f4f6f7', { roughness: 0.3 })); basin.position.set(1.5, 0.83, BZ + 0.3); s.add(basin);
    const mir = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), new THREE.MeshStandardMaterial({ color: '#cfe6f2', metalness: 0.9, roughness: 0.1 })); mir.position.set(1.5, 1.7, BZ + 0.02); s.add(mir);
    const mf = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.98, 0.02), M('#8a5a3a')); mf.position.set(1.5, 1.7, BZ + 0.01); s.add(mf);
    // tapete de banho (em frente ao box) e cesto
    const rg = this.cloth('rug', { seed: 41, w: 512, h: 384 });
    this.rug = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.65), rg.mat); this.rug.position.set(-0.2, 0.02, -0.55); this.rug.receiveShadow = true; s.add(this.rug);
    this.fresh(rg, this.rug);
    const bask = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.45, 14), M('#c9a36a')); bask.position.set(0.95, 0.23, 0.1); bask.castShadow = true; s.add(bask);

    this.showerPos = [-1.35, 2.1, BZ + 0.35];
    this.area = { x0: -0.65, x1: 0.2, y0: 0.05, y1: 0.05, z0: -0.85, z1: -0.25 }; // em cima do tapete
    this.headPos = [0.0, 1.5, 0.3];
    this.towerPos = [0.1, 0, -0.2];
    this.signPos = [0.45, 1.65, BZ + 0.1];
    this.stovePos = [0.35, 0.05, -0.1];
    this.finish();
  }
  onUpdate(t, dt, st) {
    // com `towelArea`, os ácaros se espalham pela toalha; com `curtainArea`, pela cortina; senão, pelo tapete
    const A = this.area, f = this.focus || 'rug';
    if (f === 'towel') Object.assign(A, { x0: 0.3, x1: 0.7, y0: 0.6, y1: 1.3, z0: -1.25, z1: -1.2 });
    else if (f === 'curtain') Object.assign(A, { x0: -1.95, x1: -0.75, y0: 0.15, y1: 1.5, z0: -0.33, z1: -0.3 });
    else Object.assign(A, { x0: -0.65, x1: 0.2, y0: 0.05, y1: 0.05, z0: -0.85, z1: -0.25 });
  }
}
