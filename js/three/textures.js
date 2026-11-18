// Texturas procedurais (geradas em canvas) — nenhum arquivo de imagem externo.
import * as THREE from 'three';

export function rng(seed = 1) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Ruído de valor 2D com fBm, periódico em x (para mapas equirretangulares)
function makeNoise(seed, period) {
  const r = rng(seed);
  const N = 256;
  const perm = new Uint8Array(N * 2);
  const vals = new Float32Array(N);
  for (let i = 0; i < N; i++) { perm[i] = i; vals[i] = r(); }
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < N; i++) perm[i + N] = perm[i];
  const v = (x, y) => vals[perm[(perm[x & 255] + y) & 255]];
  return (x, y, p = period) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const x0 = p ? ((xi % p) + p) % p : xi, x1 = p ? (((xi + 1) % p) + p) % p : xi + 1;
    const a = v(x0, yi), b = v(x1, yi), c = v(x0, yi + 1), d = v(x1, yi + 1);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
}
function fbm(n, x, y, oct, period) {
  let s = 0, a = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += a * n(x * f, y * f, period ? period * f : 0); norm += a; a *= 0.5; f *= 2; }
  return s / norm;
}

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

export function moonTexture(size = 1024) {
  const W = size, H = size / 2;
  const c = canvas(W, H), g = c.getContext('2d');
  const img = g.createImageData(W, H);
  const n = makeNoise(7, 16);
  const hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x / W) * 16, ny = (y / H) * 8;
    const base = fbm(n, nx, ny, 6, 16);
    const maria = fbm(n, nx * 0.25 + 3, ny * 0.25 + 5, 3, 4);
    hgt[y * W + x] = base * 0.6 + (maria > 0.55 ? -0.35 : 0) * Math.min(1, (maria - 0.55) * 8);
  }
  // crateras
  const r = rng(11);
  for (let i = 0; i < 260; i++) {
    const cx = r() * W, cy = H * 0.08 + r() * H * 0.84, rad = Math.pow(r(), 3) * 38 + 2;
    const sx = 1 / Math.max(0.3, Math.cos(((cy / H) - 0.5) * Math.PI));
    for (let y = Math.floor(cy - rad * 1.4); y < cy + rad * 1.4; y++) for (let xx = Math.floor(cx - rad * 1.4 * sx); xx < cx + rad * 1.4 * sx; xx++) {
      if (y < 0 || y >= H) continue;
      const x = ((xx % W) + W) % W;
      const d = Math.hypot((xx - cx) / sx, y - cy) / rad;
      if (d < 1) hgt[y * W + x] -= 0.25 * (1 - d * d);
      else if (d < 1.35) hgt[y * W + x] += 0.12 * (1 - (d - 1) / 0.35);
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const h = hgt[y * W + x];
    const hx = hgt[y * W + ((x + 1) % W)] - h;
    const shade = 0.55 + h * 0.6 - hx * 2.2;
    const v = Math.max(0, Math.min(255, shade * 230));
    const i = (y * W + x) * 4;
    img.data[i] = v * 1.0; img.data[i + 1] = v * 0.98; img.data[i + 2] = v * 0.94; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export function earthTextures(size = 1024) {
  const W = size, H = size / 2;
  const c = canvas(W, H), g = c.getContext('2d');
  const cc = canvas(W, H), gc = cc.getContext('2d');
  const img = g.createImageData(W, H), cimg = gc.createImageData(W, H);
  const n = makeNoise(3, 8), n2 = makeNoise(5, 16);
  for (let y = 0; y < H; y++) {
    const lat = Math.abs(y / H - 0.5) * 2;
    for (let x = 0; x < W; x++) {
      const nx = (x / W) * 8, ny = (y / H) * 4;
      const h = fbm(n, nx, ny, 6, 8) - lat * 0.08;
      const i = (y * W + x) * 4;
      let R, G, B;
      if (lat > 0.86) { R = G = B = 240; }
      else if (h > 0.53) {
        const k = Math.min(1, (h - 0.53) * 5);
        const desert = fbm(n2, nx * 2, ny * 2, 3, 16) > 0.55 && lat < 0.5;
        R = desert ? 196 - k * 40 : 70 + k * 60; G = desert ? 165 - k * 40 : 120 + k * 15; B = desert ? 110 - k * 30 : 55 + k * 10;
      } else {
        const k = Math.max(0, Math.min(1, (0.53 - h) * 5));
        R = 20 - k * 12; G = 80 - k * 40; B = 150 - k * 40;
        if (h > 0.5) { R += 30; G += 50; B += 30; }
      }
      img.data[i] = R; img.data[i + 1] = G; img.data[i + 2] = B; img.data[i + 3] = 255;
      const cl = fbm(n2, nx * 1.5 + 9, ny * 2.5, 5, 12);
      const a = Math.max(0, Math.min(1, (cl - 0.5) * 3.2));
      cimg.data[i] = cimg.data[i + 1] = cimg.data[i + 2] = 255; cimg.data[i + 3] = a * 235;
    }
  }
  g.putImageData(img, 0, 0); gc.putImageData(cimg, 0, 0);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = THREE.RepeatWrapping;
  const clouds = new THREE.CanvasTexture(cc); clouds.colorSpace = THREE.SRGBColorSpace; clouds.wrapS = THREE.RepeatWrapping;
  return { map, clouds };
}

// Rachaduras incandescentes (para a Lua se partindo)
export function crackTexture(size = 1024) {
  const W = size, H = size / 2;
  const c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const r = rng(21);
  g.lineCap = 'round';
  const branch = (x, y, ang, len, w, depth) => {
    g.lineWidth = w;
    g.beginPath(); g.moveTo(x, y);
    for (let i = 0; i < len; i++) {
      ang += (r() - 0.5) * 0.9;
      x += Math.cos(ang) * 6; y += Math.sin(ang) * 6;
      g.lineTo(x, y);
      if (depth < 3 && r() < 0.05) { g.stroke(); branch(x, y, ang + (r() - 0.5) * 2, len * 0.5, w * 0.6, depth + 1); g.beginPath(); g.moveTo(x, y); }
    }
    g.stroke();
  };
  g.shadowColor = '#ff6a00'; g.shadowBlur = 12;
  g.strokeStyle = '#ffb347';
  for (let i = 0; i < 26; i++) branch(r() * W, H * 0.15 + r() * H * 0.7, r() * Math.PI * 2, 30 + r() * 60, 3 + r() * 3, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  return t;
}

export function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 256) {
  const c = canvas(size, size), g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, inner); grd.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.45)')); grd.addColorStop(1, outer);
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function grassTexture(size = 512) {
  const c = canvas(size, size), g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const n = makeNoise(13, 32);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v = fbm(n, x / 16, y / 16, 5, 32);
    const f = ((x * 7 + y * 13) % 17) / 17;
    const i = (y * size + x) * 4;
    img.data[i] = 50 + v * 50 + f * 10; img.data[i + 1] = 90 + v * 70 + f * 14; img.data[i + 2] = 35 + v * 25; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(24, 24); t.anisotropy = 4;
  return t;
}

export function sandTexture(size = 512) {
  const c = canvas(size, size), g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const n = makeNoise(17, 32);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v = fbm(n, x / 12, y / 12, 4, 42);
    const i = (y * size + x) * 4;
    img.data[i] = 200 + v * 40; img.data[i + 1] = 170 + v * 35; img.data[i + 2] = 120 + v * 30; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10);
  return t;
}

// Céu em degradê (esfera invertida com shader)
export function skyDome(radius = 400) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color('#0a1030') },
      mid: { value: new THREE.Color('#1b2a5a') },
      bottom: { value: new THREE.Color('#3a3a6a') },
      glowDir: { value: new THREE.Vector3(0, 0.3, -1).normalize() },
      glowColor: { value: new THREE.Color('#8fb0ff') },
      glowAmt: { value: 0.3 },
      starAmt: { value: 1 },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      uniform vec3 top, mid, bottom, glowColor, glowDir; uniform float glowAmt, starAmt; varying vec3 vDir;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
      void main(){
        float y = vDir.y;
        vec3 c = y > 0.15 ? mix(mid, top, smoothstep(0.15, 0.8, y)) : mix(bottom, mid, smoothstep(-0.1, 0.15, y));
        float g = pow(max(dot(vDir, glowDir), 0.), 6.);
        c += glowColor * g * glowAmt;
        vec3 q = floor(vDir * 380.);
        float s = h(q); float star = step(0.9975, s) * smoothstep(0.05, 0.4, y) * starAmt;
        c += vec3(star) * (0.6 + 0.4*sin(s*1000.));
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
  m.renderOrder = -10;
  return m;
}

export function starfield(count = 4000, radius = 600) {
  const r = rng(5);
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    pos.set([Math.cos(th) * s * radius, u * radius, Math.sin(th) * s * radius], i * 3);
    const k = r();
    col.set(k < 0.15 ? [1, 0.85, 0.7] : k < 0.3 ? [0.75, 0.85, 1] : [1, 1, 1], i * 3);
    size[i] = Math.pow(r(), 4) * 7 + 1.2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, opacity: { value: 1 } },
    vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float size; varying vec3 vC; varying float vT; uniform float time;
      void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv;
      vT = 0.7 + 0.3*sin(time*2. + position.x*0.1 + position.y*0.07); gl_PointSize = size * 1.4; }`,
    fragmentShader: `varying vec3 vC; varying float vT; uniform float opacity;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC * vT, a * opacity); }`,
  });
  return new THREE.Points(g, m);
}

// Atmosfera (brilho de borda / fresnel)
export function atmosphere(radius, color = '#6fb6ff', power = 3, intensity = 1.2) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: { c: { value: new THREE.Color(color) }, p: { value: power }, k: { value: intensity } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 c; uniform float p, k; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1. - abs(dot(vN, vV)), p); gl_FragColor = vec4(c, 1.) * f * k; }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.12, 64, 32), mat);
}

// Tela dinâmica (canvas atualizado por quadro) para monitores do observatório
export function dynamicScreen(w = 512, h = 320) {
  const c = canvas(w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { canvas: c, g: c.getContext('2d'), tex };
}

// Anéis planetários (textura radial)
export function ringTexture(size = 1024) {
  const c = canvas(size, 8), g = c.getContext('2d');
  const r = rng(31);
  for (let x = 0; x < size; x++) {
    const k = x / size;
    const band = 0.5 + 0.5 * Math.sin(k * 90 + Math.sin(k * 23) * 3);
    const a = Math.pow(Math.sin(k * Math.PI), 0.6) * (0.35 + 0.65 * band) * (0.8 + r() * 0.2) * (k > 0.62 && k < 0.66 ? 0.15 : 1);
    const v = 190 + band * 50;
    g.fillStyle = `rgba(${v},${v * 0.93},${v * 0.85},${a})`;
    g.fillRect(x, 0, 1, 8);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
