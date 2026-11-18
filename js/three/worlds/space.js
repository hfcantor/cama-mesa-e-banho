// Mundo: espaço (Terra, Lua, fragmentação e anéis)
import * as THREE from 'three';
import { moonTexture, earthTextures, crackTexture, glowTexture, starfield, atmosphere, ringTexture, rng } from '../textures.js';
import { Particles } from '../particles.js';

export class SpaceWorld {
  constructor(shared) {
    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color('#010208');
    this.bloom = { strength: 0.9, radius: 0.6, threshold: 0.7 };
    this.stars = starfield(5000, 800); s.add(this.stars);
    // nebulosa suave
    const neb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(80,60,160,0.5)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    neb.scale.set(900, 700, 1); neb.position.set(-200, 150, -600); s.add(neb);
    const neb2 = neb.clone(); neb2.material = neb.material.clone(); neb2.material.map = glowTexture('rgba(30,120,170,0.4)', 'rgba(0,0,0,0)');
    neb2.position.set(300, -200, -650); s.add(neb2);

    this.sun = new THREE.DirectionalLight('#fff4e0', 3.2);
    this.sun.position.set(-60, 20, 40); s.add(this.sun);
    s.add(new THREE.AmbientLight('#2a3550', 0.25));
    const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,230,180,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sunGlow.position.set(-480, 160, 320); sunGlow.scale.set(160, 160, 1); s.add(sunGlow);

    // Terra
    const et = shared.earth || (shared.earth = earthTextures(1024));
    this.earth = new THREE.Group(); s.add(this.earth);
    this.earthMesh = new THREE.Mesh(new THREE.SphereGeometry(10, 96, 64), new THREE.MeshStandardMaterial({ map: et.map, roughness: 0.75, metalness: 0.0 }));
    this.clouds = new THREE.Mesh(new THREE.SphereGeometry(10.12, 96, 64), new THREE.MeshStandardMaterial({ map: et.clouds, transparent: true, depthWrite: false, roughness: 1 }));
    this.atmo = atmosphere(10, '#5fb0ff', 2.6, 1.6);
    this.earth.add(this.earthMesh, this.clouds, this.atmo);
    this.earth.rotation.z = 0.41;
    // cidades acesas no lado noturno (pontos)
    const r = rng(9), cityN = 900, cp = new Float32Array(cityN * 3);
    for (let i = 0; i < cityN; i++) { const u = r() * 1.6 - 0.8, th = r() * 6.28, q = Math.sqrt(1 - u * u); cp.set([Math.cos(th) * q * 10.03, u * 10.03, Math.sin(th) * q * 10.03], i * 3); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3));
    this.cities = new THREE.Points(cg, new THREE.PointsMaterial({ color: '#ffcf7a', size: 0.08, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.earthMesh.add(this.cities);

    // Lua
    const mt = shared.moon || (shared.moon = moonTexture(1024));
    this.moonMat = new THREE.MeshStandardMaterial({ map: mt, bumpMap: mt, bumpScale: 2.5, roughness: 1, metalness: 0 });
    this.moon = new THREE.Group(); s.add(this.moon);
    this.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(2.7, 96, 64), this.moonMat);
    this.cracks = new THREE.Mesh(new THREE.SphereGeometry(2.72, 96, 64), new THREE.MeshBasicMaterial({ map: shared.crack || (shared.crack = crackTexture()), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,140,60,1)'), blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false }));
    this.moonGlow.scale.set(14, 14, 1);
    this.moon.add(this.moonMesh, this.cracks, this.moonGlow);

    // Fragmentos (para a quebra no limite de Roche)
    this.fragments = [];
    const fr = rng(77);
    const fg = [new THREE.DodecahedronGeometry(1, 0), new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0)];
    const fragMat = new THREE.MeshStandardMaterial({ map: mt, roughness: 1, flatShading: true, color: '#d8d2c8' });
    const hot = new THREE.MeshStandardMaterial({ color: '#3a2b22', emissive: '#ff6a1a', emissiveIntensity: 1.5, roughness: 1, flatShading: true });
    for (let i = 0; i < 220; i++) {
      const m = new THREE.Mesh(fg[i % 3], i % 7 === 0 ? hot : fragMat);
      const dir = new THREE.Vector3(fr() * 2 - 1, fr() * 2 - 1, fr() * 2 - 1).normalize();
      const size = i < 30 ? 0.35 + fr() * 0.55 : 0.08 + fr() * 0.25;
      m.scale.set(size * (0.7 + fr() * 0.6), size * (0.7 + fr() * 0.6), size);
      m.visible = false;
      s.add(m);
      this.fragments.push({ m, dir, size, spin: new THREE.Vector3(fr(), fr(), fr()).multiplyScalar(2), ringR: 15 + fr() * 13, ang0: fr() * Math.PI * 2, w: 0.5 + fr() * 0.3, yoff: (fr() - 0.5) * 0.6, inner: Math.cbrt(fr()) });
    }
    // Anéis
    const rg = new THREE.RingGeometry(14.5, 29, 256, 1);
    const pos = rg.attributes.position, uv = rg.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const d = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (d - 14.5) / 14.5, 0.5); }
    this.ring = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: shared.ringTex || (shared.ringTex = ringTexture()), transparent: true, side: THREE.DoubleSide, opacity: 0, depthWrite: false, roughness: 1, emissive: '#5a4a3a', emissiveIntensity: 0.4 }));
    this.ring.rotation.x = -Math.PI / 2 + 0.25;
    this.ringPlane = new THREE.Group(); this.ringPlane.rotation.z = 0.41; s.add(this.ringPlane);
    this.ringPlane.add(this.ring);
    // poeira dos anéis
    const rp = 6000, rpp = new Float32Array(rp * 3);
    for (let i = 0; i < rp; i++) { const rr = 15 + Math.pow(fr(), 0.8) * 14, a = fr() * 6.28; rpp.set([Math.cos(a) * rr, (fr() - 0.5) * 0.25, Math.sin(a) * rr], i * 3); }
    const rpg = new THREE.BufferGeometry(); rpg.setAttribute('position', new THREE.BufferAttribute(rpp, 3));
    this.ringDust = new THREE.Points(rpg, new THREE.PointsMaterial({ color: '#e8dccb', size: 0.07, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.ringDust.rotation.x = 0.25;
    this.ringPlane.add(this.ringDust);

    // limite de Roche (círculo de alerta)
    this.roche = new THREE.Mesh(new THREE.TorusGeometry(29, 0.09, 8, 256), new THREE.MeshBasicMaterial({ color: '#ff6a30', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.roche.rotation.x = Math.PI / 2;
    this.ringPlane.add(this.roche);

    this.sparks = new Particles(3000, { additive: true });
    this.dust = new Particles(1500, { additive: false });
    s.add(this.sparks.points, this.dust.points);
    this.breakAt = null;
    this.state = { moonDist: 60, moonAngle: 0.6, moonY: 4, stretch: 0, crack: 0, ring: 0, broken: -1, roche: 0 };
  }

  reset() {
    this.sparks.clear(); this.dust.clear();
    this.fragments.forEach(f => (f.m.visible = false));
    this.moon.visible = true;
    this._lastBreak = -1;
  }

  // broken: segundos desde a quebra (<0 = intacta)
  update(t, dt) {
    const st = this.state;
    this.earthMesh.rotation.y = t * 0.03;
    this.clouds.rotation.y = t * 0.036;
    this.stars.material.uniforms.time.value = t;
    const mp = st.moonPos ? new THREE.Vector3().fromArray(st.moonPos) : new THREE.Vector3(Math.sin(st.moonAngle) * st.moonDist, st.moonY, Math.cos(st.moonAngle) * st.moonDist);
    this.moon.position.copy(mp);
    this.moon.lookAt(0, 0, 0);
    this.moonMesh.scale.set(1 - st.stretch * 0.15, 1 - st.stretch * 0.15, 1 + st.stretch * 0.6);
    this.cracks.scale.copy(this.moonMesh.scale);
    this.cracks.material.opacity = st.crack;
    this.moonGlow.material.opacity = st.crack * 0.6;
    this.moonMesh.rotation.z = t * 0.02;
    const b = st.broken;
    if (b >= 0) {
      this.moon.visible = b < 0.08;
      if (this._lastBreak < 0 && b < 0.5) {
        this.sparks.emit({ pos: mp.toArray(), spread: 2.5, sphere: true, vel: [0, 0, 0], velSpread: 7, radial: true, life: 2.2, size: 0.5, sizeEnd: 0.05, color: [1, 0.7, 0.3, 1], colorEnd: [1, 0.2, 0, 0], drag: 0.6, count: 900 });
        this.dust.emit({ pos: mp.toArray(), spread: 2.5, sphere: true, velSpread: 3, radial: true, life: 4, size: 1.5, sizeEnd: 4, color: [0.6, 0.58, 0.55, 0.4], colorEnd: [0.3, 0.3, 0.3, 0], drag: 0.5, count: 250 });
      }
      this._lastBreak = b;
      const toRing = Math.min(1, Math.max(0, (b - 1.5) / 7));
      const k = toRing * toRing * (3 - 2 * toRing);
      const tilt = new THREE.Euler(0.25, 0, 0.41, 'ZYX');
      const v = new THREE.Vector3();
      this.fragments.forEach(f => {
        f.m.visible = true;
        const burst = mp.clone().addScaledVector(f.dir, 2.7 * f.inner + Math.min(b, 4) * (1.2 + f.size * 0.4) * (1 - k * 0.6));
        const a = f.ang0 + b * f.w * 0.35;
        v.set(Math.cos(a) * f.ringR, f.yoff, Math.sin(a) * f.ringR).applyEuler(tilt);
        f.m.position.copy(burst.lerp(v, k));
        f.m.rotation.set(f.spin.x * b, f.spin.y * b, f.spin.z * b);
      });
    } else {
      this.fragments.forEach(f => (f.m.visible = false));
      this._lastBreak = -1;
    }
    this.roche.material.opacity = st.roche * (0.6 + 0.4 * Math.sin(t * 8));
    this.ring.material.opacity = st.ring * 0.95;
    this.ringDust.material.opacity = st.ring * 0.8;
    this.ring.rotation.z = t * 0.01;
    this.ringDust.rotation.y = t * 0.02;
    this.sparks.update(dt); this.dust.update(dt);
  }
}
