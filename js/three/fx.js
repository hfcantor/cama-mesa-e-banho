// Efeitos de partículas SEM ESTADO: a posição de cada partícula é uma função do tempo
// (calculada no shader). Assim o mesmo quadro sai igual em qualquer ordem de render
// (importante: o export divide o vídeo em partes renderizadas por processos diferentes).
import * as THREE from 'three';
import { rng } from './textures.js';

// o: { count, life, origin:[x,y,z], spread:[x,y,z], vel:[x,y,z], velSpread:[x,y,z], gravity:[x,y,z],
//      s0, s1, c0:[r,g,b,a], c1:[r,g,b,a], additive, soft, drift }
export function loopFx(o = {}) {
  const n = o.count || 200, r = rng((o.seed || 1) * 131 + n);
  const seeds = new Float32Array(n), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) seeds[i] = r();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const V3 = (a, d) => new THREE.Vector3(...(a || d));
  const V4 = (a, d) => new THREE.Vector4(...(a || d));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      time: { value: 0 }, scale: { value: 800 }, amt: { value: 1 }, life: { value: o.life || 2 },
      origin: { value: V3(o.origin, [0, 0, 0]) }, spread: { value: V3(o.spread, [0, 0, 0]) },
      vel: { value: V3(o.vel, [0, 1, 0]) }, velSpread: { value: V3(o.velSpread, [0, 0, 0]) }, gravity: { value: V3(o.gravity, [0, 0, 0]) },
      s0: { value: o.s0 ?? 0.3 }, s1: { value: o.s1 ?? 0.3 }, c0: { value: V4(o.c0, [1, 1, 1, 1]) }, c1: { value: V4(o.c1, [1, 1, 1, 0]) },
      soft: { value: o.soft ?? 1 }, flick: { value: o.flick || 0 }, swirl: { value: o.swirl || 0 },
    },
    vertexShader: `
      attribute float seed; uniform float time, scale, amt, life, s0, s1, soft, flick, swirl;
      uniform vec3 origin, spread, vel, velSpread, gravity; uniform vec4 c0, c1; varying vec4 vC; varying float vS;
      float h(float x){ return fract(sin(x * 127.1 + 13.7) * 43758.5453); }
      void main(){
        float ph = time / life + seed;
        float age01 = fract(ph), cyc = floor(ph);
        float k = seed * 91.3 + cyc * 7.17;
        vec3 rn = vec3(h(k), h(k + 1.3), h(k + 2.9)) * 2. - 1.;
        vec3 rv = vec3(h(k + 4.1), h(k + 5.7), h(k + 6.3)) * 2. - 1.;
        float age = age01 * life;
        vec3 p = origin + spread * rn + (vel + velSpread * rv) * age + 0.5 * gravity * age * age;
        p.x += sin(age * 2.1 + seed * 40.) * swirl * age01; p.z += cos(age * 1.7 + seed * 33.) * swirl * age01;
        float on = step(h(seed * 53.1 + 0.37), amt);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float fade = smoothstep(0., 0.1, age01) * (1. - age01);
        float fl = flick > 0. ? 0.6 + 0.4 * sin(time * flick + seed * 60.) : 1.;
        vC = mix(c0, c1, age01); vC.a *= clamp(fade * 1.8, 0., 1.) * on * fl; vS = soft;
        gl_PointSize = on * mix(s0, s1, age01) * scale / max(0.1, -mv.z);
      }`,
    fragmentShader: `varying vec4 vC; varying float vS;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.; float a = 1. - smoothstep(1. - vS, 1., d);
        if (a <= 0.01 || vC.a <= 0.003) discard; gl_FragColor = vec4(vC.rgb, vC.a * a); }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  points.renderOrder = o.additive ? 6 : 5;
  return { points, mat, u: mat.uniforms };
}

// presets prontos
export const FX = {
  fire: (extra = {}) => loopFx({ count: 90, life: 0.9, vel: [0, 2.4, 0], velSpread: [0.5, 0.8, 0.5], spread: [0.5, 0.1, 0.5], s0: 1.3, s1: 0.2, c0: [1, 0.72, 0.18, 1], c1: [0.9, 0.12, 0.02, 0], additive: true, flick: 18, ...extra }),
  smoke: (extra = {}) => loopFx({ count: 70, life: 4, vel: [0, 2.2, 0], velSpread: [0.5, 0.6, 0.5], spread: [0.5, 0, 0.5], s0: 1.2, s1: 5, c0: [0.28, 0.26, 0.25, 0.7], c1: [0.5, 0.48, 0.46, 0], swirl: 0.6, ...extra }),
  white: (extra = {}) => loopFx({ count: 70, life: 4, vel: [0, 2.2, 0], velSpread: [0.5, 0.6, 0.5], spread: [0.5, 0, 0.5], s0: 1.2, s1: 5, c0: [0.95, 0.95, 0.95, 0.7], c1: [0.8, 0.82, 0.85, 0], swirl: 0.6, ...extra }),
  sparks: (extra = {}) => loopFx({ count: 80, life: 1.4, vel: [0, 5, 0], velSpread: [2.5, 2.5, 2.5], gravity: [0, -7, 0], s0: 0.12, s1: 0.05, c0: [1, 0.85, 0.4, 1], c1: [1, 0.3, 0.05, 0], additive: true, soft: 0.5, ...extra }),
  bubbles: (extra = {}) => loopFx({ count: 60, life: 2.4, vel: [0, 1.4, 0], velSpread: [0.4, 0.3, 0.4], spread: [0.4, 0, 0.4], s0: 0.3, s1: 0.5, c0: [0.9, 0.97, 1, 0.55], c1: [1, 1, 1, 0], soft: 0.25, swirl: 0.3, ...extra }),
  water: (extra = {}) => loopFx({ count: 80, life: 0.9, vel: [0, -2, 0], velSpread: [0.1, 0.5, 0.1], gravity: [0, -4, 0], s0: 0.25, s1: 0.2, c0: [0.6, 0.85, 1, 0.9], c1: [0.7, 0.9, 1, 0], soft: 0.5, ...extra }),
  ash: (extra = {}) => loopFx({ count: 600, life: 7, vel: [0.4, -2.2, 0.2], velSpread: [0.4, 0.5, 0.4], spread: [22, 0, 22], origin: [0, 14, 0], s0: 0.18, s1: 0.16, c0: [0.62, 0.6, 0.58, 0.95], c1: [0.55, 0.53, 0.5, 0.8], soft: 0.4, ...extra }),
  snow: (extra = {}) => loopFx({ count: 500, life: 7, vel: [0.3, -1.6, 0.1], velSpread: [0.3, 0.4, 0.3], spread: [22, 0, 22], origin: [0, 12, 0], s0: 0.16, s1: 0.14, c0: [1, 1, 1, 0.95], c1: [1, 1, 1, 0.9], soft: 0.4, ...extra }),
  embers: (extra = {}) => loopFx({ count: 300, life: 4, vel: [0.6, 2.6, 0.3], velSpread: [1, 1, 1], spread: [14, 0, 14], origin: [0, 0, 0], s0: 0.14, s1: 0.05, c0: [1, 0.7, 0.2, 1], c1: [1, 0.25, 0.05, 0], additive: true, soft: 0.5, flick: 14, ...extra }),
  dust: (extra = {}) => loopFx({ count: 160, life: 3, vel: [-3, 0.5, 0], velSpread: [1.2, 0.6, 1], spread: [3, 0.2, 3], s0: 1, s1: 4, c0: [0.82, 0.68, 0.45, 0.55], c1: [0.8, 0.66, 0.44, 0], ...extra }),
  stars: (extra = {}) => loopFx({ count: 40, life: 2.2, vel: [0, 0, 0], spread: [3, 3, 3], s0: 0.2, s1: 0.05, c0: [1, 1, 0.7, 1], c1: [1, 1, 0.7, 0], additive: true, soft: 0.5, flick: 20, ...extra }),
};
