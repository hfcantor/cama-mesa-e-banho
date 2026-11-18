// Mundo: litoral com maré gigante sob uma Lua enorme
import * as THREE from 'three';
import { moonTexture, sandTexture, glowTexture, skyDome, rng } from '../textures.js';
import { Particles } from '../particles.js';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });

function palm(r) {
  const g = new THREE.Group();
  const segs = 9, h = 6 + r() * 2, bend = 0.6 + r() * 0.6;
  const tm = M('#7a5a3a');
  let x = 0, y = 0;
  for (let i = 0; i < segs; i++) {
    const k = i / segs;
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.17 - k * 0.06, 0.2 - k * 0.06, h / segs + 0.05, 7), tm);
    x = Math.pow(k, 2) * bend * 2; y = k * h + h / segs / 2;
    s.position.set(x, y, 0); s.rotation.z = -k * bend * 0.8; s.castShadow = true; g.add(s);
  }
  const top = new THREE.Group(); top.position.set(Math.pow(1, 2) * bend * 2, h, 0); g.add(top);
  const lm = new THREE.MeshStandardMaterial({ color: '#2f7a2a', roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3.2, 1, 6), lm);
    const p = leaf.geometry.attributes.position;
    for (let k = 0; k < p.count; k++) { const yy = p.getY(k) + 1.6; p.setZ(k, -yy * yy * 0.12); p.setY(k, yy); }
    leaf.geometry.computeVertexNormals();
    leaf.rotation.set(-0.9, (i / 8) * Math.PI * 2, 0, 'YXZ');
    leaf.castShadow = true;
    top.add(leaf);
  }
  g.userData.top = top;
  return g;
}

export class OceanWorld {
  constructor(shared) {
    const s = this.scene = new THREE.Scene();
    this.bloom = { strength: 0.8, radius: 0.6, threshold: 0.75 };
    this.exposure = 1.05;
    s.fog = new THREE.FogExp2('#203050', 0.009);
    this.sky = skyDome(420); s.add(this.sky);
    const u = this.sky.material.uniforms;
    u.top.value.set('#070b20'); u.mid.value.set('#1c2850'); u.bottom.value.set('#3a4a70');
    const r = rng(8);

    // água
    const wg = new THREE.PlaneGeometry(500, 500, 150, 150);
    wg.rotateX(-Math.PI / 2);
    this.water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: '#0d3a52', roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.94 }));
    this.water.receiveShadow = true;
    this.base = Float32Array.from(wg.attributes.position.array);
    s.add(this.water);
    // praia e encosta
    const bg = new THREE.PlaneGeometry(200, 60, 80, 30);
    const bp = bg.attributes.position;
    for (let i = 0; i < bp.count; i++) { const y = bp.getY(i); bp.setZ(i, (30 - y) * 0.18 + Math.sin(bp.getX(i) * 0.1) * 0.4); }
    bg.computeVertexNormals();
    this.beach = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ map: shared.sand || (shared.sand = sandTexture()), roughness: 1 }));
    this.beach.rotation.x = -Math.PI / 2; this.beach.position.set(0, -2.5, 22); this.beach.receiveShadow = true; s.add(this.beach);
    // casinhas de pescador e coqueiros
    const walls = ['#f2e6c8', '#9cc7e0', '#e8a5b8', '#f5d76e'];
    this.huts = [];
    for (let i = 0; i < 6; i++) {
      const h = new THREE.Group();
      const w = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 2.6), M(walls[i % 4])); w.position.y = 1.1; h.add(w);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4), M('#b0603a')); roof.position.y = 2.9; roof.rotation.y = Math.PI / 4; h.add(roof);
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ffb347', emissiveIntensity: 1.4 }));
      win.position.set(0.6, 1.3, 1.31); h.add(win);
      const hz = 17 + r() * 4 + (i % 2) * 3;
      h.position.set(-22 + i * 8.5 + r() * 2, this.groundH(hz) - 0.1, hz);
      h.rotation.y = (r() - 0.5) * 0.5 + Math.PI;
      h.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      s.add(h); this.huts.push(h);
    }
    this.palms = [];
    for (let i = 0; i < 7; i++) { if (i === 3) continue; const p = palm(r); const pz = 11 + r() * 4; p.position.set(-26 + i * 8 + r() * 3, this.groundH(pz) - 0.2, pz); p.rotation.y = r() * 6; s.add(p); this.palms.push(p); }
    // barquinho
    this.boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 1.2), M('#c0392b')); this.boat.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), M('#5a3d28')); mast.position.y = 1.6; this.boat.add(mast);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2), new THREE.MeshStandardMaterial({ color: '#f0ead6', side: THREE.DoubleSide })); sail.position.set(0.7, 1.8, 0); this.boat.add(sail);
    this.boat.traverse(m => { if (m.isMesh) m.castShadow = true; });
    this.boat.position.set(6, 0, -6); s.add(this.boat);

    // Lua gigante
    const mt = shared.moon || (shared.moon = moonTexture(1024));
    this.moonGroup = new THREE.Group();
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshBasicMaterial({ map: mt, fog: false }));
    this.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(190,210,255,0.9)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
    this.moonGroup.add(this.moonGlow, this.moon);
    this.moonGroup.position.set(10, 55, -320); s.add(this.moonGroup);
    // reflexo da lua na água
    this.reflect = new THREE.Mesh(new THREE.PlaneGeometry(30, 260), new THREE.MeshBasicMaterial({ map: glowTexture('rgba(200,220,255,0.6)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.reflect.rotation.x = -Math.PI / 2; this.reflect.position.set(8, 0.3, -140); s.add(this.reflect);

    this.hemi = new THREE.HemisphereLight('#7088c8', '#101820', 0.6); s.add(this.hemi);
    this.moonLight = new THREE.DirectionalLight('#c0d0ff', 2.2); this.moonLight.position.set(10, 50, -60);
    this.moonLight.castShadow = true;
    const sc = this.moonLight.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.far = 200;
    this.moonLight.shadow.mapSize.set(1024, 1024);
    s.add(this.moonLight);
    this.lightning = new THREE.DirectionalLight('#dfe8ff', 0); this.lightning.position.set(-30, 80, -20); s.add(this.lightning);

    this.spray = new Particles(3000);
    this.rain = new Particles(2500, { soft: 0.6 });
    s.add(this.spray.points, this.rain.points);
    this.state = { level: 0, waveAmp: 0.6, moonScale: 22, flash: 0, rain: 0 };
  }

  groundH(z) { return (z + 8) * 0.18 - 2.5; }

  reset() { this.spray.clear(); this.rain.clear(); }

  waveH(x, z, t, A) {
    return A * (Math.sin(x * 0.08 + t * 1.1) * 0.6 + Math.sin(z * 0.11 - t * 1.4) * 0.5 + Math.sin((x + z) * 0.21 + t * 2.1) * 0.25 + Math.sin(z * 0.03 + t * 0.6) * 1.2);
  }

  update(t, dt) {
    const st = this.state;
    const p = this.water.geometry.attributes.position.array, b = this.base;
    const A = st.waveAmp;
    for (let i = 0; i < p.length; i += 3) p[i + 1] = st.level + this.waveH(b[i], b[i + 2], t, A);
    this.water.geometry.attributes.position.needsUpdate = true;
    this.water.geometry.computeVertexNormals();
    this.moon.scale.setScalar(st.moonScale);
    this.moonGlow.scale.setScalar(st.moonScale * 4);
    this.reflect.position.y = st.level + 0.4;
    this.boat.position.y = st.level + this.waveH(6, -6, t, A) + 0.2;
    this.boat.rotation.z = Math.sin(t * 1.3) * 0.15 * A; this.boat.rotation.x = Math.cos(t * 1.1) * 0.1 * A;
    this.boat.position.z = -6 + Math.max(0, st.level) * 4;
    this.palms.forEach((pm, i) => { pm.rotation.z = Math.sin(t * 1.6 + i) * 0.05 * (1 + st.rain * 2); });
    this.lightning.intensity = st.flash * 12;
    this.sky.material.uniforms.glowAmt.value = 0.5 + st.flash * 2;
    // respingos na arrebentação
    const shoreZ = (st.level + 2.5) / 0.18 - 8;
    if (A > 0.5) this.spray.emit({ pos: [(Math.random() - 0.5) * 60, st.level + 0.5, shoreZ], spread: [3, 0.3, 1], vel: [0, 3 * A, 1.5], velSpread: [1.5, 1.5, 1], life: 1.3, size: 0.25, sizeEnd: 0.7, color: [0.8, 0.88, 0.95, 0.16], colorEnd: [0.8, 0.9, 1, 0], gravity: 6, count: Math.ceil(A * 3) });
    if (st.rain > 0) this.rain.emit({ pos: [0, 30, -5], spread: [40, 5, 30], vel: [-4, -38, 0], velSpread: 1, life: 1.2, size: 0.09, sizeEnd: 0.09, color: [0.75, 0.8, 0.9, 0.5], colorEnd: [0.75, 0.8, 0.9, 0.5], count: Math.ceil(st.rain * 30) });
    this.spray.update(dt); this.rain.update(dt);
  }
}
