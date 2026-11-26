// Cenário: cozinha com mesa (pano de prato, toalha de mesa, esponja, guardanapo).
import * as THREE from 'three';
import { RoomWorld, M, tex } from './room.js';
import { makeCanvas } from '../cloth.js';

const C = (a, la, fa, b, lb, fb) => [{ u: 0, pos: a, look: la, fov: fa }, { u: 1, pos: b, look: lb ?? la, fov: fb ?? fa }];
// Cozinha 5 × 5 (parede de fundo em z = -1.7). Bancada com pia à esquerda, fogão à direita, mesa no centro.
export const CAMS = {
  wide: C([0, 1.8, 2.8], [0, 0.8, -0.8], 54, [0, 1.65, 2.3], null, 52),
  wide2: C([-1.8, 2.0, 1.8], [0.2, 0.8, -0.8], 52, [-1.4, 1.8, 1.4], null, 50),
  wide3: C([1.8, 2.2, 1.6], [-0.2, 0.8, -0.8], 52, [1.4, 1.9, 1.2], null, 50),
  room: C([0, 1.6, 3.0], [0, 0.9, -0.8], 54, [0, 2.2, 3.3], [0, 0.8, -0.8], 56),
  top: C([0, 3.1, 0.6], [0, 0.6, -0.5], 48, [0.4, 2.7, 0.2], null, 48),
  item: C([1.1, 1.5, 0.6], [0.2, 0.85, -0.5], 48, [0.8, 1.3, 0.3], null, 44),            // sobre a mesa
  itemClose: C([0.7, 1.3, 0.2], [0.1, 0.8, -0.5], 42, [0.4, 1.1, -0.1], null, 36),
  macro: C([0.4, 1.0, -0.1], [0.1, 0.78, -0.55], 38, [0.2, 0.92, -0.3], null, 26),
  rug: C([1.1, 1.5, 0.6], [0.2, 0.85, -0.5], 48, [0.8, 1.3, 0.3], null, 44),
  rugClose: C([0.4, 1.0, -0.1], [0.1, 0.78, -0.55], 38, [0.2, 0.92, -0.3], null, 26),
  sink: C([-0.6, 1.5, -0.2], [-1.2, 1.0, -1.5], 44, [-0.9, 1.35, -0.55], null, 36),      // esponja na pia
  sinkClose: C([-1.0, 1.25, -0.7], [-1.2, 0.98, -1.5], 36, [-1.15, 1.12, -1.0], null, 26),
  stove: C([1.0, 1.5, -0.2], [1.5, 0.85, -1.55], 44, [1.3, 1.3, -0.6], null, 36),         // pano no fogão
  stoveClose: C([1.3, 1.1, -0.9], [1.5, 0.75, -1.55], 36, [1.45, 0.95, -1.15], null, 26),
  face: C([-0.2, 1.8, 1.4], [-0.1, 1.1, 0.7], 42, [-0.2, 1.6, 1.1], null, 38),
  faceFar: C([1.0, 1.8, 1.8], [-0.1, 1.0, 0.7], 46, [0.8, 1.7, 1.5], null, 42),
  hero: C([0.3, 1.1, 0.3], [0.2, 0.9, -0.5], 40, [0.3, 1.0, 0.1], null, 34),
  heroSide: C([1.4, 1.2, 0.2], [0.2, 0.85, -0.5], 42, [1.1, 1.1, 0.1], null, 36),
  pillow: C([0.9, 1.3, 0.4], [0.2, 0.85, -0.5], 46, [0.5, 1.2, 0.2], null, 42),
  crowd: C([0.7, 1.7, 1.2], [0.1, 0.8, -0.5], 42, [0.5, 1.5, 0.9], null, 38),
  calendar: C([1.6, 1.7, -0.3], [1.6, 1.7, -1.66], 44, [1.6, 1.72, -0.6], null, 40),
  door: C([-0.4, 1.4, 2.0], [2.4, 1.1, 2.15], 46, [0.0, 1.35, 2.1], null, 40),
  doorWide: C([-1.0, 1.6, 1.2], [2.3, 1.1, 2.15], 50, [-0.4, 1.5, 1.5], null, 46),
  tower: C([0, 0.9, 1.8], [0, 1.0, -0.3], 50, [0.4, 1.4, 2.3], [0, 1.5, -0.3], 54),
  sign: C([0.3, 1.2, 0.2], [0.4, 1.2, -1.6], 44, [0.4, 1.4, 0.0], [0.4, 1.7, -1.6], 40),
  stand: C([0.2, 1.5, 3.8], [0, 1.1, 0.8], 44, [0.1, 1.4, 3.2], [0, 1.15, 0.8], 40),
  low: C([0, 1.4, 1.8], [0, 0.4, -0.5], 56, [0.4, 1.0, 1.5], [0.4, 0.4, -0.4], 56),
  sunny: C([1.6, 1.7, 1.8], [0, 0.9, -0.7], 50, [0.9, 1.4, 1.2], [0, 0.85, -0.8], 46),
  side: C([1.4, 1.5, 0.8], [-0.1, 0.9, -0.5], 48, [1.0, 1.3, 0.5], null, 42),
  tall: C([0, 1.4, 2.4], [0, 1.2, 0.5], 44, [0, 1.5, 3.2], [0, 1.1, 0.5], 50),
};
export const STAND = [-1.2, 0.6, 0.5];

function floorTex() { const c = makeCanvas(512, 512), g = c.getContext('2d'); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#e8e2d2' : '#b9724a'; g.fillRect(x * 128, y * 128, 128, 128); } return c; }
function wallTex() { const c = makeCanvas(256, 512), g = c.getContext('2d'); g.fillStyle = '#f0e6c8'; g.fillRect(0, 0, 256, 512); g.fillStyle = '#9cc7c0'; for (let y = 300; y < 512; y += 64) for (let x = 0; x < 256; x += 64) { g.fillRect(x + 2, y + 2, 60, 60); } g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 296, 256, 4); return c; }

export class CozinhaWorld extends RoomWorld {
  constructor() {
    super({ w: 5, d: 5, h: 2.8, cz: 0.8, floor: tex(floorTex(), [2, 2]), wall: tex(wallTex(), [2, 1]), win: { x: -1.2, y: 1.7, w: 1.1, h: 0.9 }, cal: { x: 1.6, y: 1.7 }, doorZ: 1.6, lamp: [0.8, 2.3, 0.5], bg: '#3a2c1e' });
    const s = this.scene, BZ = this.backZ; // -1.7
    const wood = M('#a8794d', { roughness: 0.7 });
    // bancada: armários + tampo, pia (esq.), fogão (dir.)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.85, 0.6), wood); cab.position.set(0, 0.43, BZ + 0.32); cab.castShadow = cab.receiveShadow = true; s.add(cab);
    const top = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.05, 0.68), M('#3a3d44', { roughness: 0.4 })); top.position.set(0, 0.88, BZ + 0.34); s.add(top);
    const basin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.45), M('#c8ccd2', { metalness: 0.7, roughness: 0.3 })); basin.position.set(-1.2, 0.915, BZ + 0.34); s.add(basin);
    const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 8), M('#c0c4c8', { metalness: 0.8 })); tap.position.set(-1.2, 1.05, BZ + 0.1); s.add(tap);
    const stove = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.55), M('#d9dce0', { metalness: 0.4, roughness: 0.4 })); stove.position.set(1.5, 0.93, BZ + 0.34); s.add(stove);
    [[-0.2, -0.12], [0.2, -0.12], [-0.2, 0.12], [0.2, 0.12]].forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 14), M('#1b1b1f')); b.position.set(1.5 + x, 0.96, BZ + 0.34 + z); s.add(b); });
    const oven = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.04), M('#2a2c30', { metalness: 0.3 })); oven.position.set(1.5, 0.5, BZ + 0.65); s.add(oven);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.6, 8), M('#c0c4c8', { metalness: 0.8 })); handle.rotation.z = Math.PI / 2; handle.position.set(1.5, 0.72, BZ + 0.7); s.add(handle);
    // pano de prato pendurado na porta do forno
    const pn = this.cloth('check', { seed: 51, w: 512, h: 512, color: '#d63a30', n: 8 });
    this.pano = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.02), pn.mat); this.pano.position.set(1.5, 0.45, BZ + 0.73); this.pano.castShadow = true; s.add(this.pano);
    this.fresh(pn, this.pano);
    // esponja sobre a pia
    const sp = this.cloth('sponge', { seed: 61, w: 256, h: 256 });
    this.sponge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.1), sp.mat); this.sponge.position.set(-1.2, 0.96, BZ + 0.35); this.sponge.castShadow = true; s.add(this.sponge);
    this.fresh(sp, this.sponge);
    // mesa central com toalha, prato e guardanapo; duas cadeiras
    const leg = (x, z) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.75, 0.07), wood); l.position.set(x, 0.375, z); l.castShadow = true; s.add(l); };
    leg(-0.7, -0.95); leg(0.7, -0.95); leg(-0.7, -0.05); leg(0.7, -0.05);
    const tc = this.cloth('check', { seed: 71, w: 512, h: 512, color: '#2f6fd0', n: 12 });
    this.tablecloth = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.04, 1.1), tc.mat); this.tablecloth.position.set(0, 0.77, -0.5); this.tablecloth.castShadow = this.tablecloth.receiveShadow = true; s.add(this.tablecloth);
    this.fresh(tc, this.tablecloth);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.02, 24), M('#ffffff', { roughness: 0.3 })); plate.position.set(0.1, 0.8, -0.35); s.add(plate);
    const nk = this.cloth('napkin', { seed: 81, w: 256, h: 256 });
    this.napkin = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.012, 0.28), nk.mat); this.napkin.position.set(-0.35, 0.8, -0.3); this.napkin.rotation.y = 0.4; this.napkin.castShadow = true; s.add(this.napkin);
    this.fresh(nk, this.napkin);
    [[-0.9, -0.5], [0.9, -0.5]].forEach(([x, z]) => { const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), wood); seat.position.set(x * 1.0, 0.45, z); const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.04), wood); back.position.set(x * 1.0 + (x < 0 ? -0.2 : 0.2), 0.7, z); back.rotation.y = Math.PI / 2; s.add(seat, back); });

    this.area = { x0: -0.7, x1: 0.7, y0: 0.8, y1: 0.8, z0: -0.9, z1: -0.1 }; // sobre a mesa
    this.headPos = [-0.1, 1.5, 0.7];
    this.towerPos = [0, 0.8, -0.5];
    this.signPos = [0.4, 1.75, BZ + 0.05];
    this.stovePos = [0.45, 0.8, -0.35];
    this.finish();
  }
  onUpdate(t, dt, st) {
    const A = this.area, f = this.focus || 'table';
    if (f === 'napkin') Object.assign(A, { x0: -0.5, x1: -0.2, y0: 0.81, y1: 0.81, z0: -0.45, z1: -0.15 });
    else if (f === 'pano') Object.assign(A, { x0: 1.35, x1: 1.65, y0: 0.25, y1: 0.65, z0: -0.97, z1: -0.95 });
    else if (f === 'sponge') Object.assign(A, { x0: -1.4, x1: -1.0, y0: 0.99, y1: 0.99, z0: -1.4, z1: -1.2 });
    else Object.assign(A, { x0: -0.7, x1: 0.7, y0: 0.8, y1: 0.8, z0: -0.9, z1: -0.1 });
  }
}
