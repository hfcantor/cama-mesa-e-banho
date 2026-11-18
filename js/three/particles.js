// Sistema de partículas (fumaça, poeira, fogo, faíscas, vagalumes, respingos)
import * as THREE from 'three';
import { rng } from './textures.js';

export class Particles {
  constructor(max = 2000, { additive = false, soft = 1, renderOrder = 5 } = {}) {
    this.max = max;
    this.n = 0;
    this.rand = rng(max * 7 + 3);
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.siz = new Float32Array(max);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.age = new Float32Array(max);
    this.p = new Array(max);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('rgba', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.siz, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { scale: { value: 800 }, soft: { value: soft } },
      vertexShader: `attribute vec4 rgba; attribute float size; varying vec4 vC; uniform float scale;
        void main(){ vC = rgba; vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = size * scale / max(0.1, -mv.z); }`,
      fragmentShader: `varying vec4 vC; uniform float soft;
        void main(){ float d = length(gl_PointCoord - 0.5) * 2.; float a = 1. - smoothstep(1. - soft, 1., d);
        if (a <= 0.) discard; gl_FragColor = vec4(vC.rgb, vC.a * a); }`,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = renderOrder;
    this.geo = g;
  }

  clear() { this.n = 0; this.flush(); }

  // o: {pos:[x,y,z], spread:[x,y,z]|number, vel:[x,y,z], velSpread, life, size, sizeEnd, color:[r,g,b,a], colorEnd, gravity, drag, count}
  emit(o) {
    const r = this.rand;
    const count = o.count || 1;
    for (let k = 0; k < count; k++) {
      if (this.n >= this.max) this._kill(0);
      const i = this.n++;
      const sp = o.spread ?? 0, vs = o.velSpread ?? 0;
      const sx = Array.isArray(sp) ? sp : [sp, sp, sp];
      const vx = Array.isArray(vs) ? vs : [vs, vs, vs];
      const v = o.vel || [0, 0, 0];
      let dx = (r() - 0.5) * 2, dy = (r() - 0.5) * 2, dz = (r() - 0.5) * 2;
      if (o.sphere) { const l = Math.hypot(dx, dy, dz) || 1; const m = Math.cbrt(r()); dx = dx / l * m; dy = dy / l * m; dz = dz / l * m; }
      this.pos[i * 3] = o.pos[0] + dx * sx[0];
      this.pos[i * 3 + 1] = o.pos[1] + dy * sx[1];
      this.pos[i * 3 + 2] = o.pos[2] + dz * sx[2];
      let ux = (r() - 0.5) * 2, uy = (r() - 0.5) * 2, uz = (r() - 0.5) * 2;
      if (o.radial) { const l = Math.hypot(ux, uy, uz) || 1; ux /= l; uy /= l; uz /= l; }
      this.vel[i * 3] = v[0] + ux * vx[0];
      this.vel[i * 3 + 1] = v[1] + uy * vx[1];
      this.vel[i * 3 + 2] = v[2] + uz * vx[2];
      this.life[i] = (o.life || 1) * (0.7 + r() * 0.6);
      this.age[i] = 0;
      this.p[i] = { s0: (o.size || 1) * (0.7 + r() * 0.6), s1: o.sizeEnd ?? o.size ?? 1, c0: o.color || [1, 1, 1, 1], c1: o.colorEnd || o.color || [1, 1, 1, 0], g: o.gravity || 0, d: o.drag ?? 0, flicker: o.flicker || 0, ph: r() * 6.28 };
    }
  }

  _kill(i) {
    const j = --this.n;
    if (i === j) return;
    for (let a = 0; a < 3; a++) { this.pos[i * 3 + a] = this.pos[j * 3 + a]; this.vel[i * 3 + a] = this.vel[j * 3 + a]; }
    this.life[i] = this.life[j]; this.age[i] = this.age[j]; this.p[i] = this.p[j];
  }

  update(dt) {
    dt = Math.min(dt, 0.1);
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) { this._kill(i); i--; continue; }
      const p = this.p[i];
      const k = this.age[i] / this.life[i];
      const drag = Math.max(0, 1 - p.d * dt);
      this.vel[i * 3] *= drag; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * drag - p.g * dt; this.vel[i * 3 + 2] *= drag;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const fade = Math.min(1, k * 8) * (1 - k);
      for (let a = 0; a < 3; a++) this.col[i * 4 + a] = p.c0[a] + (p.c1[a] - p.c0[a]) * k;
      let alpha = (p.c0[3] + (p.c1[3] - p.c0[3]) * k) * fade * 1.6;
      if (p.flicker) alpha *= 0.5 + 0.5 * Math.sin(this.age[i] * p.flicker + p.ph);
      this.col[i * 4 + 3] = Math.min(1, alpha);
      this.siz[i] = p.s0 + (p.s1 - p.s0) * k;
    }
    this.flush();
  }

  flush() {
    this.geo.setDrawRange(0, this.n);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.rgba.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
  }

  setScale(h) { this.mat.uniforms.scale.value = h; }
}
