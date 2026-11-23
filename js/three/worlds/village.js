// Mundo: a vila do Tabocal (casinhas, bambuzal/tabocas, quintal, céu com a Lua)
import * as THREE from 'three';
import { moonTexture, grassTexture, glowTexture, skyDome, ringTexture, rng } from '../textures.js';
import { Particles } from '../particles.js';
import { Character } from '../characters.js';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });

function house(w, d, h, wall, door, r) {
  const g = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(wall));
  walls.position.y = h / 2; g.add(walls);
  // telhado de duas águas (telha colonial)
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-w / 2 - 0.35, 0); roofShape.lineTo(0, h * 0.55); roofShape.lineTo(w / 2 + 0.35, 0); roofShape.lineTo(-w / 2 - 0.35, 0);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: d + 0.7, bevelEnabled: false }), M('#a8442a', { roughness: 0.9 }));
  roof.position.set(0, h, -d / 2 - 0.35); g.add(roof);
  const dr = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.5, 0.08), M(door));
  dr.position.set(-w * 0.18, 0.75, d / 2 + 0.03); g.add(dr);
  const winMat = new THREE.MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ffb347', emissiveIntensity: 1.6 });
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.06), winMat);
  win.position.set(w * 0.22, h * 0.55, d / 2 + 0.03); g.add(win);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.15), M('#e8e0d0')); sill.position.set(w * 0.22, h * 0.55 - 0.34, d / 2 + 0.07); g.add(sill);
  const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.35, d + 0.08), M('#7a6a5a')); base.position.y = 0.17; g.add(base);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.userData.win = winMat;
  void r;
  return g;
}

function bamboo(r, n = 9) {
  const g = new THREE.Group();
  const stalkM = M('#7aa63a', { roughness: 0.6 }), nodeM = M('#5c7f28');
  const leafM = new THREE.MeshStandardMaterial({ color: '#4f8a2a', roughness: 0.8, side: THREE.DoubleSide });
  const leafG = new THREE.ConeGeometry(0.5, 1.8, 4, 1, true);
  g.userData.stalks = [];
  for (let i = 0; i < n; i++) {
    const h = 6 + r() * 5;
    const s = new THREE.Group();
    s.position.set((r() - 0.5) * 1.6, 0, (r() - 0.5) * 1.6);
    s.rotation.z = (r() - 0.5) * 0.25; s.rotation.x = (r() - 0.5) * 0.25;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, h, 8), stalkM);
    stalk.position.y = h / 2; s.add(stalk);
    for (let y = 0.8; y < h; y += 0.9) { const nd = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 4, 10), nodeM); nd.rotation.x = Math.PI / 2; nd.position.y = y; s.add(nd); }
    for (let k = 0; k < 5; k++) {
      const lf = new THREE.Mesh(leafG, leafM);
      lf.position.set((r() - 0.5) * 0.6, h * (0.6 + r() * 0.4), (r() - 0.5) * 0.6);
      lf.rotation.set(Math.PI / 2 + (r() - 0.5), r() * 6, (r() - 0.5) * 1.2);
      lf.scale.set(0.5, 1, 0.15);
      s.add(lf);
    }
    s.traverse(m => { if (m.isMesh) m.castShadow = true; });
    s.userData.ph = r() * 6; s.userData.rz = s.rotation.z;
    g.add(s); g.userData.stalks.push(s);
  }
  return g;
}

function tree(r) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 3, 8), M('#5a3d28'));
  trunk.position.y = 1.5; g.add(trunk);
  const fm = M('#2f6b2a', { flatShading: true });
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + r() * 0.6, 1), fm);
    f.position.set((r() - 0.5) * 1.8, 3.4 + r() * 1.2, (r() - 0.5) * 1.8);
    g.add(f);
  }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}

export class VillageWorld {
  constructor(shared) {
    const s = this.scene = new THREE.Scene();
    this.bloom = { strength: 0.75, radius: 0.55, threshold: 0.78 };
    this.exposure = 1.1;
    s.fog = new THREE.FogExp2('#1a2550', 0.012);
    this.sky = skyDome(420); s.add(this.sky);
    const r = rng(42);

    // chão com leves ondulações
    const gg = new THREE.PlaneGeometry(400, 400, 120, 120);
    const gp = gg.attributes.position;
    for (let i = 0; i < gp.count; i++) {
      const x = gp.getX(i), y = gp.getY(i), d = Math.hypot(x, y);
      const hills = Math.sin(x * 0.05) * Math.cos(y * 0.04) * 2 + Math.sin(x * 0.013 + 1) * 6;
      gp.setZ(i, d < 25 ? 0 : hills * Math.min(1, (d - 25) / 40));
    }
    gg.computeVertexNormals();
    this.ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ map: shared.grass || (shared.grass = grassTexture()), roughness: 1 }));
    this.ground.rotation.x = -Math.PI / 2; this.ground.receiveShadow = true; s.add(this.ground);
    // estrada de terra
    const road = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 120), M('#8a6a48', { roughness: 1 }));
    road.rotation.x = -Math.PI / 2; road.rotation.z = 0.15; road.position.set(3, 0.02, -20); road.receiveShadow = true; s.add(road);

    // casas
    const defs = [
      [-7, -6, 0.25, '#f2e6c8', '#3d6fa8'], [6.5, -10, -0.3, '#e8a5b8', '#2f5a3a'], [-14, -18, 0.6, '#9cc7e0', '#a0522d'],
      [13, -22, -0.5, '#f5d76e', '#6a3d8a'], [-3, -28, 0.1, '#ffffff', '#2c7a7b'], [20, -6, -1.1, '#c6e0a8', '#8a3b1e'],
    ];
    this.houses = defs.map(([x, z, ry, wall, door]) => {
      const h = house(4 + r() * 1.5, 3.5 + r(), 2.6 + r() * 0.5, wall, door, r);
      h.position.set(x, 0, z); h.rotation.y = ry; s.add(h);
      return h;
    });
    // bambuzais (tabocas) — marca do Tabocal
    this.bamboos = [[-11, -2], [10, -1], [-18, -10], [16, -14], [-6, -36], [24, -26], [-22, -26]].map(([x, z]) => {
      const b = bamboo(r, 7 + Math.floor(r() * 6)); b.position.set(x, 0, z); s.add(b); return b;
    });
    this.trees = [[-20, 2], [22, 4], [0, -45], [-30, -40], [35, -38]].map(([x, z]) => { const t = tree(r); t.position.set(x, 0, z); t.scale.setScalar(1 + r() * 0.5); s.add(t); return t; });
    // cerca
    const postM = M('#6b4a2e');
    for (let i = -8; i <= 8; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 0.12), postM); p.position.set(i * 1.2, 0.5, 12); p.castShadow = true; s.add(p);
    }
    [0.35, 0.75].forEach(y => { const rail = new THREE.Mesh(new THREE.BoxGeometry(19.4, 0.08, 0.06), postM); rail.position.set(0, y, 12); rail.castShadow = true; s.add(rail); });
    // rede entre dois postes (cena final)
    this.hammock = new THREE.Group();
    [-1.6, 1.6].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.2, 8), postM); p.position.set(x, 1.1, 0); p.castShadow = true; this.hammock.add(p); });
    // rede de tecido listrado (superfície curvada)
    const stc = document.createElement('canvas'); stc.width = 64; stc.height = 256;
    const sg = stc.getContext('2d');
    ['#d94f2b', '#f2c14e', '#2f7a6a', '#f2e6c8', '#d94f2b', '#3d6fa8'].forEach((c, i) => { sg.fillStyle = c; sg.fillRect(0, i * 43, 64, 43); });
    const stripe = new THREE.CanvasTexture(stc); stripe.colorSpace = THREE.SRGBColorSpace;
    const hg = new THREE.PlaneGeometry(2.6, 1.1, 24, 8);
    const hp = hg.attributes.position;
    for (let i = 0; i < hp.count; i++) {
      const x = hp.getX(i), zz = hp.getY(i);
      const sag = (1 - Math.pow(x / 1.3, 2)) * 0.75, curl = Math.pow(zz / 0.55, 2) * 0.28 * (1 - Math.pow(x / 1.3, 2));
      const pinch = 1 - 0.75 * Math.pow(Math.abs(x) / 1.3, 3);
      hp.setXYZ(i, x, 1.55 - sag + curl, zz * pinch);
    }
    hg.computeVertexNormals();
    const net = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.95, side: THREE.DoubleSide }));
    net.castShadow = true; net.receiveShadow = true; this.hammock.add(net);
    [-1, 1].forEach(sd => { const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), M('#e8dcc0')); rope.position.set(sd * 1.42, 1.62, 0); rope.rotation.z = sd * 1.2; this.hammock.add(rope); });
    this.hammockCenter = new THREE.Vector3(0, 0.85, 0);
    this.hammock.position.set(-3.5, 0, -1.5); this.hammock.rotation.y = 0.4; this.hammock.visible = false;
    s.add(this.hammock);

    // Lua no céu
    const mt = shared.moon || (shared.moon = moonTexture(1024));
    this.moonGroup = new THREE.Group(); s.add(this.moonGroup);
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshBasicMaterial({ map: mt, fog: false, color: '#fffaf0' }));
    this.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(200,215,255,0.55)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
    this.moonGroup.add(this.moonGlow, this.moon);
    this.moonGroup.position.set(-30, 70, -300);
    // anel planetário no céu (final)
    const rg = new THREE.RingGeometry(150, 190, 256, 1);
    const pos = rg.attributes.position, uv = rg.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const d = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (d - 150) / 40, 0.5); }
    this.skyRing = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: shared.ringTex || (shared.ringTex = ringTexture()), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    this.skyRing.position.set(0, -60, -150); this.skyRing.rotation.set(-1.25, 0.15, 0.3);
    s.add(this.skyRing);

    // luzes
    this.hemi = new THREE.HemisphereLight('#7a90d0', '#2a2a18', 0.8); s.add(this.hemi);
    this.moonLight = new THREE.DirectionalLight('#b8c8ff', 1.4);
    this.moonLight.position.set(-20, 40, -30);
    this.moonLight.castShadow = true;
    const sc = this.moonLight.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 150;
    this.moonLight.shadow.mapSize.set(1024, 1024); this.moonLight.shadow.bias = -0.0005; this.moonLight.shadow.radius = 4;
    s.add(this.moonLight); s.add(this.moonLight.target);
    this.fill = new THREE.PointLight('#ffb070', 6, 18, 1.6); this.fill.position.set(-5, 2.5, -2); s.add(this.fill);
    this.camLight = new THREE.PointLight('#ffd9b8', 5, 14, 1.4); s.add(this.camLight);
    this.fireLight = new THREE.PointLight('#ff7a30', 0, 80, 1.4); this.fireLight.position.set(0, 6, -10); s.add(this.fireLight);

    // Tito — o protagonista
    this.tito = new Character({ kid: true, hat: true, shirt: '#e0563a', pants: '#2f4a7a', skin: '#c68a5c', scale: 1.15 });
    this.tito.root.position.set(0, 0, 0); s.add(this.tito.root);

    // partículas
    this.fireflies = new Particles(200, { additive: true });
    this.dust = new Particles(2500);
    this.fire = new Particles(3000, { additive: true });
    this.smoke = new Particles(1500);
    this.debris = new Particles(1500, { soft: 0.3 });
    s.add(this.fireflies.points, this.smoke.points, this.dust.points, this.fire.points, this.debris.points);

    // meteoros (posição é função do tempo → sincronia exata com o som do impacto)
    this.meteors = [];
    const mg = new THREE.IcosahedronGeometry(1, 1);
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Group();
      const core = new THREE.Mesh(mg, new THREE.MeshStandardMaterial({ color: '#2a1a10', emissive: '#ff8a3a', emissiveIntensity: 1.6, flatShading: true }));
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,170,80,1)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
      glow.scale.set(3.2, 3.2, 1);
      g.add(core, glow); g.visible = false; s.add(g);
      this.meteors.push(g);
    }
    // ondas de choque e crateras
    this.shocks = [];
    for (let i = 0; i < 10; i++) {
      const sh = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 64), new THREE.MeshBasicMaterial({ color: '#ffd090', transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.visible = false; s.add(sh);
      const cr = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ color: '#1a120c', emissive: '#ff4a10', emissiveIntensity: 0.8, roughness: 1, transparent: true }));
      cr.rotation.x = -Math.PI / 2; cr.visible = false; s.add(cr);
      this.shocks.push({ sh, cr });
    }
    // rachaduras no chão (terremoto)
    this.cracks = [];
    const crM = new THREE.MeshStandardMaterial({ color: '#100804', emissive: '#ff5a10', emissiveIntensity: 0.0, roughness: 1 });
    this.crackMat = crM;
    for (let i = 0; i < 6; i++) {
      const pts = []; let x = (r() - 0.5) * 14, z = -2 - r() * 10, a = r() * 6.28;
      for (let k = 0; k < 14; k++) { pts.push(new THREE.Vector3(x, 0.03, z)); a += (r() - 0.5) * 0.9; x += Math.cos(a) * 0.9; z += Math.sin(a) * 0.9; }
      const c = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.09, 4), crM);
      c.scale.y = 0.2; c.userData.len = 0;
      c.geometry.setDrawRange(0, 0);
      s.add(c); this.cracks.push(c);
    }
    // objetos soltos pelo quintal (EP03: gravidade desligada). Só aparecem com state.props = 1.
    this.floatGroup = new THREE.Group(); this.floatGroup.visible = false; s.add(this.floatGroup);
    this.floaters = [];
    const fr = rng(7);
    const kinds = [
      () => { // balde
        const g = new THREE.Group();
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.42, 18, 1, true), new THREE.MeshStandardMaterial({ color: '#3d6fa8', roughness: 0.5, side: THREE.DoubleSide }));
        const h = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 6, 20, Math.PI), M('#cfd6e0')); h.position.y = 0.21;
        g.add(b, h); return g;
      },
      () => new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), M('#f2c14e', { roughness: 0.4 })), // bola
      () => { // chapéu de palha
        const g = new THREE.Group(); const hm = M('#e2c071', { roughness: 0.95 });
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.04, 24), hm);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.26, 20), hm); crown.position.y = 0.14;
        g.add(brim, crown); return g;
      },
      () => { // cadeira
        const g = new THREE.Group(); const wm = M('#a0522d');
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.55), wm); seat.position.y = 0.45;
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.05), wm); back.position.set(0, 0.75, -0.25);
        g.add(seat, back);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), wm); l.position.set(a * 0.24, 0.22, b * 0.24); g.add(l); });
        return g;
      },
      () => { // caixote
        const g = new THREE.Group();
        const bx = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), M('#c89b5a', { roughness: 0.9 }));
        const ripa = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.64), M('#8a6a3a')); ripa.position.y = 0.1;
        g.add(bx, ripa); return g;
      },
      () => { // vaso de planta
        const g = new THREE.Group();
        const v = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.34, 16), M('#c4552d'));
        const pl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), M('#3f8f3a', { flatShading: true })); pl.position.y = 0.38;
        g.add(v, pl); return g;
      },
    ];
    for (let i = 0; i < 24; i++) {
      const mesh = kinds[i % kinds.length]();
      mesh.traverse(m => { if (m.isMesh) m.castShadow = true; });
      const x = (fr() - 0.5) * 13, z = -3 + fr() * 8.5;
      mesh.position.set(x, 0.2, z); this.floatGroup.add(mesh);
      this.floaters.push({ mesh, x, z, y0: i % kinds.length === 1 ? 0.3 : 0.05, rise: 7 + fr() * 24, delay: fr(), spin: [(fr() - 0.5) * 2.4, (fr() - 0.5) * 2.4, (fr() - 0.5) * 2.4], ph: fr() * 6, drift: (fr() - 0.5) * 3 });
    }
    this.state = { moonScale: 9, moonY: 70, night: 1, fire: 0, ring: 0, dawn: 0, quake: 0, crack: 0, windowsOn: 1, props: 0, float: 0, bambooLift: 0 };
    this.impacts = [];
    this._spawned = new Set();
  }

  reset() {
    [this.fireflies, this.dust, this.fire, this.smoke, this.debris].forEach(p => p.clear());
    this._spawned = new Set();
    this.hammock.visible = false;
    this.tito.root.position.set(0, 0, 0); this.tito.root.rotation.set(0, 0, 0);
    this.tito.pose = { ...this.tito.pose, walk: 0, run: 0, armsUp: 0, point: 0, cover: 0, scared: 0, surprise: 0, sleep: 0, lookYaw: 0, lookPitch: 0, wave: 0 };
    this.tito.cur = { ...this.tito.pose };
    this.tito.hips.position.y = this.tito.hips.userData.y0 ?? this.tito.hips.position.y;
  }

  setMeteors(list) { this.impacts = list; } // [{time, x, z, size, from:[dx,dy,dz]}]

  update(t, dt, et, cam) {
    const st = this.state;
    if (cam) { this.camLight.position.copy(cam.position).add(new THREE.Vector3(0.8, 1.2, 0.5)); this.camLight.intensity = st.camLight ?? 5; }
    // céu: noite → incêndio → amanhecer
    const u = this.sky.material.uniforms;
    const night = [new THREE.Color('#01030c'), new THREE.Color('#081028'), new THREE.Color('#1a2248')];
    const fire = [new THREE.Color('#120304'), new THREE.Color('#4a1008'), new THREE.Color('#a8360e')];
    const dawn = [new THREE.Color('#3a6ab8'), new THREE.Color('#e8a070'), new THREE.Color('#ffd0a0')];
    ['top', 'mid', 'bottom'].forEach((k, i) => {
      u[k].value.copy(night[i]).lerp(fire[i], st.fire).lerp(dawn[i], st.dawn);
    });
    u.starAmt.value = (1 - st.dawn) * (1 - st.fire * 0.7);
    const md = new THREE.Vector3().copy(this.moonGroup.position).normalize();
    u.glowDir.value.copy(md); u.glowAmt.value = 0.12 + st.moonScale / 90;
    this.scene.fog.color.copy(u.mid.value).multiplyScalar(0.8);
    this.scene.fog.density = 0.011 - st.fire * 0.004 - st.dawn * 0.005;
    // Lua
    this.moonGroup.position.y = st.moonY;
    this.moon.scale.setScalar(st.moonScale);
    this.moonGlow.scale.setScalar(st.moonScale * 4.2);
    this.moonGroup.visible = st.moonScale > 0.01;
    this.moon.rotation.y = 0.5 + t * 0.002;
    this.moonLight.intensity = (1.1 + st.moonScale / 25) * (1 - st.dawn * 0.3);
    this.moonLight.color.set('#b8c8ff').lerp(new THREE.Color('#ffd7a8'), st.dawn);
    this.hemi.intensity = 0.8 + st.dawn * 0.9 - st.fire * 0.2;
    this.hemi.color.set('#6a80c0').lerp(new THREE.Color('#ff7a4a'), st.fire).lerp(new THREE.Color('#ffe0c0'), st.dawn);
    this.skyRing.material.opacity = st.ring;
    this.houses.forEach(h => (h.userData.win.emissiveIntensity = 1.6 * st.windowsOn));
    // bambus balançando
    const wind = 0.04 + st.quake * 0.08 + st.fire * 0.04;
    this.bamboos.forEach(b => b.userData.stalks.forEach(s => { s.rotation.z = s.userData.rz + Math.sin(t * 1.3 + s.userData.ph) * wind; }));
    // terremoto: casas tremem, poeira sobe
    const q = st.quake;
    if (q > 0.01) {
      this.houses.forEach((h, i) => { h.rotation.z = Math.sin(t * 30 + i) * 0.012 * q; h.position.y = Math.abs(Math.sin(t * 25 + i * 2)) * 0.05 * q; });
      if (Math.random() < q * 0.9) this.dust.emit({ pos: [(Math.random() - 0.5) * 30, 0.2, -Math.random() * 25], spread: [1, 0.1, 1], vel: [0, 0.8, 0], velSpread: [0.6, 0.4, 0.6], life: 2.5, size: 1.2, sizeEnd: 3.5, color: [0.55, 0.45, 0.35, 0.35], colorEnd: [0.4, 0.35, 0.3, 0], drag: 0.8, count: 3 });
    } else this.houses.forEach(h => { h.rotation.z = 0; h.position.y = 0; });
    this.crackMat.emissiveIntensity = st.crack * 2.2;
    this.cracks.forEach((c, i) => { const k = Math.max(0, Math.min(1, st.crack * 1.4 - i * 0.08)); c.geometry.setDrawRange(0, Math.floor(c.geometry.index.count * k / 3) * 3); });
    // vagalumes
    if (st.night > 0.5 && st.fire < 0.1 && this.fireflies.n < 60) this.fireflies.emit({ pos: [0, 1.2, -4], spread: [14, 1, 8], vel: [0, 0.05, 0], velSpread: 0.25, life: 5, size: 0.12, color: [0.8, 1, 0.4, 1], colorEnd: [0.8, 1, 0.4, 0], flicker: 4, count: 1 });
    // meteoros e impactos (deterministas)
    this._meteors(t, dt, et);
    this.fireLight.intensity = st.fire * 25 + this._flash * 120;
    // gravidade desligada (EP03): objetos soltos, bambuzais e árvores sobem por tempo/estado
    this.floatGroup.visible = st.props > 0.5;
    if (this.floatGroup.visible) {
      const f = st.float;
      this.floaters.forEach((o) => {
        const k = Math.max(0, Math.min(1, (f - o.delay * 0.45) / (1 - o.delay * 0.45)));
        const bob = Math.sin(t * 1.4 + o.ph) * 0.25 * k;
        o.mesh.position.set(o.x + o.drift * k, o.y0 + k * o.rise + bob, o.z);
        o.mesh.rotation.set(k * o.spin[0] * (1 + t * 0.35), k * o.spin[1] * (1 + t * 0.35), k * o.spin[2] * (1 + t * 0.35));
      });
    }
    const bl = st.bambooLift || 0;
    this.bamboos.forEach((b, i) => { b.position.y = bl * (4 + i * 1.3); b.rotation.z = Math.sin(t * 0.9 + i) * 0.07 * bl; });
    this.trees.forEach((tr, i) => { tr.position.y = bl * (2.5 + i * 0.8) * Math.max(0, bl - 0.3); });
    this.tito.update(t, dt);
    [this.fireflies, this.dust, this.fire, this.smoke, this.debris].forEach(p => p.update(dt));
  }

  _meteors(t, dt, et) {
    this._flash = 0;
    let mi = 0;
    for (const im of this.impacts) {
      const k = et - im.time; // <0 antes do impacto
      const fall = im.fall || 1.4;
      if (k > -fall && k < 0 && mi < this.meteors.length) {
        const m = this.meteors[mi++];
        const f = -k / fall; // 1 → 0
        const from = im.from || [-0.6, 1, -0.3];
        const dist = 160 * f;
        m.position.set(im.x + from[0] * dist, (from[1] * dist) + 0.5, im.z + from[2] * dist);
        m.scale.setScalar(im.size * 0.9);
        m.visible = true;
        this.fire.emit({ pos: m.position.toArray(), spread: im.size * 0.6, vel: [0, 0, 0], velSpread: 0.8, life: 0.9, size: im.size * 1.4, sizeEnd: im.size * 0.3, color: [1, 0.75, 0.35, 0.8], colorEnd: [1, 0.25, 0.05, 0], count: 4 });
        this.smoke.emit({ pos: m.position.toArray(), spread: im.size * 0.4, velSpread: 0.3, life: 2.5, size: im.size * 2, sizeEnd: im.size * 6, color: [0.15, 0.12, 0.1, 0.35], colorEnd: [0.1, 0.1, 0.1, 0], count: 1 });
      }
      const key = im.time;
      if (k >= 0 && k < 0.5 && !this._spawned.has(key)) {
        this._spawned.add(key);
        const p = [im.x, 0.5, im.z];
        this.fire.emit({ pos: p, spread: im.size * 0.6, sphere: true, velSpread: [8, 9, 8], radial: true, vel: [0, 4, 0], life: 1.1, size: im.size * 1.5, sizeEnd: im.size * 0.4, color: [1, 0.7, 0.35, 0.8], colorEnd: [0.9, 0.15, 0, 0], drag: 2.2, count: 150 });
        this.smoke.emit({ pos: p, spread: im.size * 1.5, velSpread: [3, 4, 3], vel: [0, 3, 0], life: 5, size: im.size * 3, sizeEnd: im.size * 9, color: [0.07, 0.06, 0.06, 0.55], colorEnd: [0.05, 0.05, 0.05, 0], drag: 0.9, count: 45 });
        this.debris.emit({ pos: p, spread: im.size * 0.5, velSpread: [10, 6, 10], vel: [0, 9, 0], life: 2.2, size: 0.25, sizeEnd: 0.2, color: [0.25, 0.18, 0.12, 1], colorEnd: [0.2, 0.15, 0.1, 0.9], gravity: 16, count: 120 });
      }
      if (k >= 0 && k < 0.25) this._flash = Math.max(this._flash, (1 - k / 0.25) * im.size / 3);
    }
    for (; mi < this.meteors.length; mi++) this.meteors[mi].visible = false;
    // ondas de choque e crateras
    this.impacts.forEach((im, i) => {
      if (i >= this.shocks.length) return;
      const { sh, cr } = this.shocks[i];
      const k = et - im.time;
      sh.visible = k >= 0 && k < 1.2;
      cr.visible = k >= 0;
      if (sh.visible) { const s = 1 + k * 30 * im.size / 3; sh.scale.setScalar(s); sh.material.opacity = (1 - k / 1.2) * 0.9; sh.position.set(im.x, 0.15, im.z); }
      if (cr.visible) { cr.position.set(im.x, 0.04, im.z); cr.scale.setScalar(im.size * 1.6); cr.material.emissiveIntensity = Math.max(0.2, 1.5 - k * 0.3); }
      // fogo persistente na cratera
      if (k > 0.3 && Math.random() < 0.3) this.fire.emit({ pos: [im.x, 0.3, im.z], spread: [im.size, 0.2, im.size], vel: [0, 2.2, 0], velSpread: 0.6, life: 1.0, size: im.size * 0.7, sizeEnd: im.size * 0.2, color: [1, 0.55, 0.2, 0.6], colorEnd: [1, 0.15, 0, 0], count: 1 });
    });
  }

  flash() { return this._flash || 0; }
}
