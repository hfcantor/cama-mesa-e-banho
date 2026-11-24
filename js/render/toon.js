// Estilo "desenho animado de bonequinho": cabeça redonda, contorno grosso, cenário pintado.
// Tudo desenhado em Canvas 2D (1080×1920), sem imagens externas. Usado pelo EP03.
export const INK = '#2a190d';
const TAU = Math.PI * 2;
export const W = 1080, H = 1920;

// ruído "tremido" de desenho à mão: muda 8 vezes por segundo, determinístico
export const jit = (t, i, amp = 1) => {
  const f = Math.floor(t * 8);
  const x = Math.sin(f * 12.9898 + i * 78.233) * 43758.5453;
  return ((x - Math.floor(x)) - 0.5) * 2 * amp;
};
const rand = (seed) => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const lerp = (a, b, k) => a + (b - a) * k;
export const clamp01 = (x) => Math.max(0, Math.min(1, x));

// ---------------------------------------------------------------- primitivas
function stroke(g, lw = 8) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function poly(g, pts, fill, lw = 8, close = true) {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); } if (lw) stroke(g, lw);
}
function circ(g, x, y, r, fill, lw = 8) { g.beginPath(); g.arc(x, y, r, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) stroke(g, lw); }
function ell(g, x, y, rx, ry, fill, lw = 8, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) stroke(g, lw); }
function seg(g, x1, y1, x2, y2, lw = 8, cx = null, cy = null) {
  g.beginPath(); g.moveTo(x1, y1); cx == null ? g.lineTo(x2, y2) : g.quadraticCurveTo(cx, cy, x2, y2); stroke(g, lw);
}

// ----------------------------------------------------------- o bonequinho
/**
 * @param o { x, y (pés), s (escala), flip, tunic, hat, pose, hold: (g,x,y)=>void }
 * pose: armL, armR (rad, 0 = braço caído, π = para cima), legL, legR, lean, bob, tilt,
 *       smile (-1..1), mouth (0..1 aberta), eyeX, eyeY, brow (-1..1), surprise (0..1), sweat, blink
 */
export function drawStickman(g, t, o) {
  const P = { armL: 0.3, armR: 0.3, legL: 0.07, legR: -0.07, lean: 0, bob: 0, tilt: 0, smile: 0.6, mouth: 0, eyeX: 0, eyeY: 0, brow: 0, surprise: 0, sweat: 0, blink: 0, ...(o.pose || {}) };
  const { x, y, s = 1, flip = 1, tunic = '#e0563a', hat = true } = o;
  const legLen = 240, torso = 190, R = 100;
  g.save(); g.translate(x, y); g.scale(s * flip, s);
  const hip = [0, -legLen + P.bob];
  // pernas
  [[-1, P.legL], [1, P.legR]].forEach(([side, a], i) => {
    const hx = side * 30, fx = hx + Math.sin(a) * legLen, fy = hip[1] + Math.cos(a) * legLen;
    seg(g, hx, hip[1], fx, fy, 11, hx + Math.sin(a) * legLen * 0.5 + jit(t, 20 + i, 2), (hip[1] + fy) / 2);
    ell(g, fx + 14, fy - 4, 34, 13, INK, 0);
  });
  // tronco + braços + cabeça (giram juntos com a inclinação)
  g.save(); g.translate(hip[0], hip[1]); g.rotate(P.lean);
  const top = -torso;
  const pts = [[-60, top + 6], [60, top + 6], [92, 0]];
  for (let i = 0; i < 6; i++) pts.push([92 - (i + 0.5) * (184 / 6), i % 2 ? -4 : -26]);
  pts.push([-92, 0]);
  poly(g, pts.map(([px, py], i) => [px + jit(t, i, 2.2), py + jit(t, i + 40, 2.2)]), tunic, 8);
  if (o.spots) { // pele de onça: manchas escuras recortadas na túnica
    g.save(); g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.clip();
    [[-34, top + 40], [26, top + 52], [-6, top + 96], [44, top + 120], [-46, top + 134], [10, top + 150], [-18, top + 28]].forEach(([sx, sy], i) => { ell(g, sx, sy, 15 + (i % 3) * 3, 11 + (i % 2) * 4, o.spots, 0, i * 0.7); });
    g.restore();
  }
  // costura/mancha na camiseta
  g.beginPath(); g.moveTo(-30, top + 70); g.lineTo(-10, top + 110); g.lineTo(-34, top + 120); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fill();
  // pescoço
  seg(g, 0, top + 6, 0, top - 12, 10);
  // braços
  const armLen = 215;
  const hands = [-1, 1].map((side, i) => {
    const a = i === 0 ? P.armL : P.armR;
    const sx = side * 56, sy = top + 34;
    const ex = sx + side * Math.sin(a) * armLen, ey = sy + Math.cos(a) * armLen;
    seg(g, sx, sy, ex, ey, 10, (sx + ex) / 2 + side * 14, (sy + ey) / 2);
    return [ex, ey];
  });
  hands.forEach(([hx, hy]) => circ(g, hx, hy, 17, '#fdfaf3', 7));
  if (o.holdR) o.holdR(g, hands[1][0], hands[1][1]);
  if (o.holdL) o.holdL(g, hands[0][0], hands[0][1]);
  // cabeça
  g.save(); g.translate(0, top - 14 - R + 12); g.rotate(P.tilt);
  circ(g, 0, 0, R, '#fdfaf3', 8);
  if (hat) {
    const hy = -R * 0.55;
    g.beginPath(); g.moveTo(-R * 0.75, hy); g.quadraticCurveTo(-R * 0.7, hy - R * 0.85, 0, hy - R * 0.9); g.quadraticCurveTo(R * 0.7, hy - R * 0.85, R * 0.75, hy); g.closePath();
    g.fillStyle = '#e8c872'; g.fill(); stroke(g, 8);
    seg(g, -R * 0.74, hy - 6, R * 0.74, hy - 6, 14); // faixa
    ell(g, 0, hy + 4, R * 1.28, R * 0.2, '#e8c872', 8);
  } else {
    for (let i = -2; i <= 2; i++) {
      const a = -Math.PI / 2 + i * 0.3, bx = Math.cos(a) * R * 0.96, by = Math.sin(a) * R * 0.96;
      const tx = Math.cos(a + i * 0.12) * (R + 52 - Math.abs(i) * 8), ty = Math.sin(a + i * 0.12) * (R + 52 - Math.abs(i) * 8);
      poly(g, [[bx - 14, by + 4], [tx, ty], [bx + 14, by + 4]], INK, 4);
    }
  }
  // rosto
  const ex = P.eyeX * 7, ey = P.eyeY * 7, sur = P.surprise;
  [-1, 1].forEach((side, i) => {
    const cx = side * 36, cy = -4;
    if (P.blink > 0.5) seg(g, cx - 14, cy, cx + 14, cy, 6);
    else if (sur > 0.35) { circ(g, cx, cy, 16 + sur * 5, '#fff', 5); circ(g, cx + ex, cy + ey, 6, INK, 0); }
    else circ(g, cx + ex, cy + ey, 9, INK, 0);
    const bl = P.brow * 14 + sur * 12;
    seg(g, cx - side * 16, cy - 28 - bl * 0.3 + side * P.brow * 6, cx + side * 18, cy - 34 - bl - side * P.brow * 8, 7);
  });
  seg(g, 4, 8, 16, 26, 5, 20, 12); seg(g, 16, 26, 3, 28, 5);
  const my = 50;
  if (P.mouth > 0.08) {
    const mo = P.mouth;
    g.beginPath(); g.ellipse(0, my + mo * 8, 24 + mo * 4, 8 + mo * 26, 0, 0, TAU); g.fillStyle = '#6a1f18'; g.fill(); stroke(g, 6);
  } else {
    const sm = P.smile;
    seg(g, -34, my - 4 * sm, 34, my - 4 * sm, 7, 0, my + 40 * sm);
  }
  if (P.sweat > 0.05) {
    const sy = -R * 0.45 + (P.sweat * 30) % 40;
    g.beginPath(); g.moveTo(R * 0.82, sy - 18); g.quadraticCurveTo(R * 0.98, sy + 6, R * 0.82, sy + 14); g.quadraticCurveTo(R * 0.66, sy + 6, R * 0.82, sy - 18);
    g.fillStyle = '#7fd0ff'; g.fill(); stroke(g, 4);
  }
  g.restore(); // cabeça
  g.restore(); // tronco
  g.restore();
  return { hands };
}

// ------------------------------------------------------------------- objetos
export function drawProp(g, kind, size = 70, t = 0) {
  g.save(); g.scale(size / 70, size / 70);
  switch (kind) {
    case 'balde':
      seg(g, -26, -34, 26, -34, 5, 0, -74);
      poly(g, [[-34, -30], [34, -30], [26, 34], [-26, 34]], '#3d8fd0', 7);
      ell(g, 0, -30, 34, 9, '#7ec4f0', 6);
      break;
    case 'bola':
      circ(g, 0, 0, 34, '#f2c14e', 7);
      g.beginPath(); g.arc(0, 0, 34, 0.6, 2.5); stroke(g, 5);
      g.beginPath(); g.arc(-30, 0, 34, -0.7, 0.7); stroke(g, 5);
      break;
    case 'chapeu':
      ell(g, 0, 10, 52, 12, '#e8c872', 7);
      g.beginPath(); g.moveTo(-30, 8); g.quadraticCurveTo(-30, -34, 0, -34); g.quadraticCurveTo(30, -34, 30, 8); g.closePath(); g.fillStyle = '#e8c872'; g.fill(); stroke(g, 7);
      seg(g, -29, 0, 29, 0, 10);
      break;
    case 'cadeira':
      seg(g, -26, -50, -26, 10, 8); seg(g, -26, -50, 22, -50, 8);
      poly(g, [[-30, -10], [30, -10], [30, 0], [-30, 0]], '#b4743c', 7);
      seg(g, -24, 0, -24, 44, 8); seg(g, 24, 0, 24, 44, 8);
      break;
    case 'caixote':
      poly(g, [[-34, -34], [34, -34], [34, 34], [-34, 34]], '#c89b5a', 7);
      seg(g, -34, -12, 34, -12, 5); seg(g, -34, 12, 34, 12, 5);
      break;
    case 'vaso':
      for (let i = 0; i < 3; i++) { const a = -2.1 + i * 0.9; ell(g, Math.cos(a) * 20, -34 + Math.sin(a) * 6 - 10, 16, 30, '#58b24a', 6, a + Math.PI / 2); }
      poly(g, [[-30, -4], [30, -4], [22, 36], [-22, 36]], '#c4552d', 7);
      break;
    default: break;
  }
  g.restore();
}
export const PROP_KINDS = ['balde', 'bola', 'chapeu', 'cadeira', 'caixote', 'vaso'];

// objetos soltos pelo quintal, posição em função de f (0..1) — igual ao 3D do EP03
const FR = rand(7);
export const FLOATERS = Array.from({ length: 22 }, (_, i) => ({
  kind: PROP_KINDS[i % PROP_KINDS.length], x: 90 + FR() * 900, rest: 1560 + FR() * 120, rise: 700 + FR() * 1900,
  delay: FR(), spin: (FR() - 0.5) * 3, ph: FR() * 6, drift: (FR() - 0.5) * 160, size: 62 + FR() * 30,
}));
export function drawFloaters(g, t, f, { onlyRest = false } = {}) {
  for (const o of FLOATERS) {
    const k = clamp01((f - o.delay * 0.45) / (1 - o.delay * 0.45));
    const y = o.rest - k * o.rise + Math.sin(t * 1.4 + o.ph) * 14 * k;
    if (y < -260) continue;
    if (k < 0.02) { g.fillStyle = 'rgba(40,25,10,0.18)'; g.beginPath(); g.ellipse(o.x, o.rest + 36, o.size * 0.5, 9, 0, 0, TAU); g.fill(); }
    g.save(); g.translate(o.x + o.drift * k, y); g.rotate(k * o.spin * (1 + t * 0.35));
    drawProp(g, o.kind, o.size, t); g.restore();
  }
  void onlyRest;
}

// --------------------------------------------------------------------- bambu
export function drawBamboo(g, t, x, ground, lift = 0, sway = 0) {
  g.save(); g.translate(x, ground - lift); g.rotate(Math.sin(t * 0.9) * 0.02 * sway);
  const stalks = [[-62, 1700, 0.9], [-26, 1900, 1], [14, 2000, 1.05], [52, 1800, 0.95], [88, 1500, 0.85]];
  stalks.forEach(([dx, h, wsc], si) => {
    const w = 34 * wsc;
    g.fillStyle = '#86b83e'; g.fillRect(dx - w / 2, -h, w, h); g.lineWidth = 7; g.strokeStyle = INK; g.strokeRect(dx - w / 2, -h, w, h);
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(dx - w / 2 + 5, -h, 7, h);
    for (let y = 120 + si * 40; y < h; y += 190) seg(g, dx - w / 2 - 4, -y, dx + w / 2 + 4, -y, 8);
    for (let y = 260 + si * 70; y < h - 200; y += 420) {
      const dir = (si + Math.round(y / 100)) % 2 ? 1 : -1;
      g.save(); g.translate(dx + dir * w / 2, -y); g.rotate(dir * (-0.9 + Math.sin(t * 1.3 + y) * 0.04));
      poly(g, [[0, 0], [dir * 70, -14], [dir * 150, 2], [dir * 70, 18]], '#5f9a2c', 6); g.restore();
    }
  });
  // torrão de terra e raízes (só aparece quando solta do chão)
  if (lift > 8) {
    const r = clamp01(lift / 80);
    g.globalAlpha = r;
    g.beginPath(); g.moveTo(-120, 0); g.quadraticCurveTo(-110, 90, -20, 100); g.quadraticCurveTo(80, 110, 130, 10); g.quadraticCurveTo(0, 30, -120, 0);
    g.fillStyle = '#7a4d2a'; g.fill(); stroke(g, 8);
    for (let i = 0; i < 7; i++) seg(g, -80 + i * 26, 10, -90 + i * 30 + jit(t, i, 6), 80 + (i % 3) * 22, 5, -84 + i * 28, 50);
    for (let i = 0; i < 8; i++) { g.fillStyle = '#7a4d2a'; g.beginPath(); g.arc(-90 + i * 26 + jit(t, 60 + i, 8), 110 + ((t * 120 + i * 47) % 160), 6, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  }
  g.restore();
}

// ------------------------------------------------------------------- nuvens
export function drawCloud(g, x, y, s = 1, a = 1) {
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a;
  g.beginPath(); [[-70, 10, 48], [-20, -10, 62], [40, 0, 54], [90, 14, 40]].forEach(([cx, cy, r]) => { g.moveTo(cx + r, cy); g.arc(cx, cy, r, 0, TAU); });
  g.fillStyle = '#ffffff'; g.fill();
  g.beginPath(); g.moveTo(-118, 26); g.quadraticCurveTo(-70, 66, 0, 52); g.quadraticCurveTo(70, 66, 130, 30); g.strokeStyle = 'rgba(120,150,180,0.55)'; g.lineWidth = 5; g.stroke();
  g.restore();
}

// ------------------------------------------------------------ cenário pintado
let landCache = null, paperCache = null;
const LAND_W = 1280, LAND_H = 2280, MX = 100, MY = 180; // margem para o movimento de câmera

function paperTexture() {
  if (paperCache) return paperCache;
  const c = mk(512, 512), g = c.getContext('2d'), r = rand(5);
  for (let i = 0; i < 5200; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(40,20,0,0.05)'; g.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 3); }
  return (paperCache = c);
}

// camada de terra (céu transparente): colinas, casa, cerca, chão
export function landCanvas() {
  if (landCache) return landCache;
  const c = mk(LAND_W, LAND_H), g = c.getContext('2d'), r = rand(11);
  g.translate(MX, MY);
  const hill = (y0, amp, col, lw, ph) => {
    g.beginPath(); g.moveTo(-MX, H + MY);
    for (let x = -MX; x <= W + MX; x += 20) g.lineTo(x, y0 + Math.sin(x * 0.006 + ph) * amp + Math.sin(x * 0.017 + ph) * amp * 0.35);
    g.lineTo(W + MX, H + MY); g.closePath(); g.fillStyle = col; g.fill();
    g.beginPath(); for (let x = -MX; x <= W + MX; x += 20) { const y = y0 + Math.sin(x * 0.006 + ph) * amp + Math.sin(x * 0.017 + ph) * amp * 0.35; x === -MX ? g.moveTo(x, y) : g.lineTo(x, y); }
    stroke(g, lw);
  };
  hill(1020, 34, '#a6cf6e', 6, 0.4);
  // casa
  const hx = 640, hy = 1050;
  poly(g, [[hx, hy - 260], [hx + 380, hy - 260], [hx + 380, hy], [hx, hy]], '#f4e3bd', 8);
  poly(g, [[hx - 40, hy - 255], [hx + 190, hy - 430], [hx + 420, hy - 255]], '#bd5430', 8);
  poly(g, [[hx + 40, hy - 170], [hx + 130, hy - 170], [hx + 130, hy], [hx + 40, hy]], '#3d6fa8', 7);
  poly(g, [[hx + 230, hy - 200], [hx + 330, hy - 200], [hx + 330, hy - 110], [hx + 230, hy - 110]], '#bfe3f2', 7);
  seg(g, hx + 280, hy - 200, hx + 280, hy - 110, 5); seg(g, hx + 230, hy - 155, hx + 330, hy - 155, 5);
  hill(1130, 26, '#86bb55', 7, 1.9);
  // chão e caminho
  g.fillStyle = '#76ac49'; g.fillRect(-MX, 1180, W + 2 * MX, H + MY - 1180);
  g.beginPath(); g.moveTo(-MX, 1180); g.lineTo(W + MX, 1180); stroke(g, 6);
  poly(g, [[400, 1182], [700, 1182], [980, H + MY], [60, H + MY]], '#d9b87c', 7);
  // tufos de grama
  for (let i = 0; i < 90; i++) {
    const gx = -MX + r() * (W + 2 * MX), gy = 1200 + r() * 720; if (gx > 330 && gx < 760 && gy > 1250) continue;
    g.beginPath(); g.moveTo(gx - 10, gy); g.lineTo(gx - 6, gy - 22); g.moveTo(gx, gy); g.lineTo(gx, gy - 30); g.moveTo(gx + 10, gy); g.lineTo(gx + 7, gy - 20);
    g.strokeStyle = '#3f7a28'; g.lineWidth = 5; g.lineCap = 'round'; g.stroke();
  }
  // cerca
  for (let i = -1; i < 14; i++) {
    const px = i * 90 + 20; poly(g, [[px, 1110], [px + 26, 1110], [px + 26, 1230], [px, 1230]], '#b8824d', 6);
  }
  seg(g, -MX, 1150, W + MX, 1150, 10); seg(g, -MX, 1200, W + MX, 1200, 10);
  // pintura: pinceladas de luz e sombra
  g.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(80,60,20,${0.02 + r() * 0.03})`; g.beginPath(); g.ellipse(r() * W, 1200 + r() * 720, 40 + r() * 120, 8 + r() * 24, 0, 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  return (landCache = c);
}

// céu em gradiente: alt (px de altitude) escurece o azul; t anima as nuvens
export function drawSky(g, t, alt = 0, dusk = 0, night = 0) {
  const k = clamp01(alt / 2600);
  const gr = g.createLinearGradient(0, 0, 0, H);
  const c0 = [lerp(126, 40, k), lerp(200, 110, k), lerp(238, 210, k)];
  const c1 = [lerp(214, 150, k), lerp(240, 215, k), lerp(245, 250, k)];
  const mix = (a, b, m) => a.map((v, i) => Math.round(lerp(v, b[i], m)));
  const d0 = mix(c0, [250, 160, 110], dusk), d1 = mix(c1, [255, 224, 160], dusk);
  gr.addColorStop(0, `rgb(${d0})`); gr.addColorStop(0.62, `rgb(${d1})`); gr.addColorStop(1, `rgb(${d1})`);
  if (night > 0) {
    const ng = g.createLinearGradient(0, 0, 0, H); ng.addColorStop(0, '#0a1030'); ng.addColorStop(0.65, '#1b2a5c'); ng.addColorStop(1, '#2b3a70');
    g.fillStyle = gr; g.fillRect(-MX, -MY, W + 2 * MX, H + 2 * MY);
    g.globalAlpha = night; g.fillStyle = ng; g.fillRect(-MX, -MY, W + 2 * MX, H + 2 * MY); g.globalAlpha = 1;
    const sr = rand(3);
    for (let i = 0; i < 70; i++) { const sx = sr() * W, sy = sr() * 900, tw = 0.5 + 0.5 * Math.sin(t * 2 + i); g.fillStyle = `rgba(255,255,230,${night * (0.35 + 0.5 * tw)})`; g.beginPath(); g.arc(sx, sy, 2 + (i % 3), 0, TAU); g.fill(); }
    g.globalAlpha = night; circ(g, 800, 330, 80, '#fff6cf', 7); g.globalAlpha = 1;
    return;
  }
  g.fillStyle = gr; g.fillRect(-MX, -MY, W + 2 * MX, H + 2 * MY);
  const sun = g.createRadialGradient(880, 300 + alt * 0.1, 10, 880, 300 + alt * 0.1, 420);
  sun.addColorStop(0, 'rgba(255,250,200,0.9)'); sun.addColorStop(1, 'rgba(255,250,200,0)');
  g.fillStyle = sun; g.fillRect(0, 0, W, H);
  const cl = [[160, 320, 1.3], [620, 220, 1.0], [900, 520, 1.5], [300, 700, 1.1]];
  cl.forEach(([x, y, s], i) => drawCloud(g, ((x + t * (12 + i * 4)) % (W + 400)) - 200, y + alt * (0.5 + i * 0.12) % 2400 - (alt > 0 ? 0 : 0), s, 0.95));
}

// terra (colinas/casa/chão) deslocada para baixo conforme sobe a altitude; ilha pequena vista de cima
export function drawLand(g, alt = 0, { island = 0, t = 0 } = {}) {
  const land = landCanvas();
  if (island > 0.01) {
    const sc = lerp(1, 0.34, island), w = LAND_W * sc, h = LAND_H * sc;
    g.save(); g.translate(540, 1680 + Math.sin(t * 0.8) * 8);
    g.beginPath(); g.ellipse(0, 0, 250, 150, 0, 0, TAU); g.clip();
    g.fillStyle = '#76ac49'; g.fillRect(-300, -160, 600, 320);
    g.drawImage(land, (-MX - 540 + 0) * sc - 20, (-MY - 1180) * sc - 70, w, h);
    g.restore();
    g.save(); g.translate(540, 1680 + Math.sin(t * 0.8) * 8); g.beginPath(); g.ellipse(0, 0, 250, 150, 0, 0, TAU); stroke(g, 8); g.restore();
    return;
  }
  g.drawImage(land, -MX, -MY + alt);
}

export function vignette(g, a = 0.5) {
  const gr = g.createRadialGradient(540, 960, 520, 540, 960, 1250);
  gr.addColorStop(0, 'rgba(30,15,0,0)'); gr.addColorStop(1, `rgba(30,15,0,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.9; g.fillStyle = g.createPattern(paperTexture(), 'repeat'); g.fillRect(0, 0, W, H); g.restore();
}

export function groundShadow(g, x, y, w, a = 0.22) { g.fillStyle = `rgba(40,25,10,${a})`; g.beginPath(); g.ellipse(x, y, w, w * 0.14, 0, 0, TAU); g.fill(); }

export function speedLines(g, t, x, y, n = 16, len = 700, a = 0.5) {
  g.save(); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 6; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const sx = x + ((i * 97 + 13) % 900) - 450, off = ((t * 1800 + i * 313) % 1700);
    g.beginPath(); g.moveTo(sx, y - 800 + off); g.lineTo(sx, y - 800 + off + len * (0.4 + (i % 3) * 0.3)); g.stroke();
  }
  g.restore();
}

export function drawDust(g, t, x, y, k) {
  if (k <= 0 || k >= 1) return;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI + Math.PI, d = 40 + k * 280;
    g.globalAlpha = (1 - k) * 0.85; circ(g, x + Math.cos(a) * d * 1.3, y + Math.sin(a) * d * 0.45, 30 + k * 55 + (i % 3) * 10, '#e8d6b0', 6);
  }
  g.globalAlpha = 1;
}

export function drawRuler(g, x, ground, pxPerM, upToM, markM) {
  const h = pxPerM * upToM;
  poly(g, [[x - 46, ground], [x + 46, ground], [x + 46, ground - h - 20], [x - 46, ground - h - 20]], '#f2d27a', 7);
  for (let i = 0; i <= upToM * 4; i++) {
    const y = ground - i * pxPerM / 4, long = i % 4 === 0;
    seg(g, x - 46, y, x - 46 + (long ? 52 : 28), y, long ? 6 : 4);
    if (long) { g.fillStyle = INK; g.font = '900 38px Montserrat, Arial Black, sans-serif'; g.textAlign = 'left'; g.fillText(`${i / 4} m`, x + 12, y + 13); }
  }
  if (markM != null) {
    const y = ground - markM * pxPerM;
    g.fillStyle = '#e5202a'; g.fillRect(x - 130, y - 4, 120, 8);
    g.font = '900 34px Montserrat, Arial Black, sans-serif'; g.textAlign = 'right'; g.fillText('1,7 m', x - 140, y + 12);
  }
}


// =============================================================== PRÉ-HISTÓRIA (EP04)
// savana vista pela boca da caverna
export function drawSavanna(g, t, night = 0) {
  const hill = (y0, amp, col, ph) => {
    g.beginPath(); g.moveTo(-MX, 1200);
    for (let x = -MX; x <= W + MX; x += 20) g.lineTo(x, y0 + Math.sin(x * 0.006 + ph) * amp + Math.sin(x * 0.019 + ph) * amp * 0.3);
    g.lineTo(W + MX, 1200); g.closePath(); g.fillStyle = col; g.fill(); stroke(g, 6);
  };
  hill(760, 30, '#c9c46a', 0.5); hill(860, 24, '#a9b955', 2.1);
  // acácia
  g.save(); g.translate(700, 800);
  seg(g, 0, 0, 6, -150, 14, -8, -80); seg(g, 6, -110, 70, -170, 9); seg(g, 6, -130, -60, -180, 9);
  ell(g, 6, -200, 130, 44, '#5f9a38', 8); ell(g, -50, -178, 60, 24, '#6fae42', 0);
  g.restore();
  g.fillStyle = '#a9b955'; g.fillRect(-MX, 900, W + 2 * MX, 300);
  if (night > 0) { g.fillStyle = `rgba(10,20,60,${0.55 * night})`; g.fillRect(-MX, 560, W + 2 * MX, 700); }
}

let caveCache = null;
export function caveCanvas() {
  if (caveCache) return caveCache;
  const c = mk(LAND_W, LAND_H), g = c.getContext('2d'), r = rand(23);
  g.translate(MX, MY);
  // parede de rocha
  const rg = g.createLinearGradient(0, 0, 0, H); rg.addColorStop(0, '#6e4a33'); rg.addColorStop(0.6, '#4a3020'); rg.addColorStop(1, '#2e1d12');
  g.fillStyle = rg; g.fillRect(-MX, -MY, W + 2 * MX, H + 2 * MY);
  for (let i = 0; i < 70; i++) {
    const cx = -MX + r() * (W + 2 * MX), cy = -MY + r() * (H + 2 * MY), rr = 50 + r() * 140, n = 5 + Math.floor(r() * 3);
    const pts = Array.from({ length: n }, (_, k) => { const a = (k / n) * TAU + r() * 0.5; return [cx + Math.cos(a) * rr * (0.7 + r() * 0.5), cy + Math.sin(a) * rr * (0.6 + r() * 0.5)]; });
    g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
    g.fillStyle = r() > 0.5 ? 'rgba(255,220,170,0.07)' : 'rgba(0,0,0,0.12)'; g.fill();
    g.strokeStyle = 'rgba(25,12,4,0.55)'; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke();
  }
  // abertura em arco (transparente)
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
  g.beginPath(); g.moveTo(190, 1090); g.lineTo(190, 640); g.bezierCurveTo(190, 120, 890, 120, 890, 640); g.lineTo(890, 1090); g.closePath(); g.fill(); g.restore();
  g.beginPath(); g.moveTo(190, 1090); g.lineTo(190, 640); g.bezierCurveTo(190, 120, 890, 120, 890, 640); g.lineTo(890, 1090);
  g.strokeStyle = INK; g.lineWidth = 14; g.lineJoin = 'round'; g.stroke();
  g.strokeStyle = 'rgba(255,225,180,0.35)'; g.lineWidth = 6; g.stroke();
  // chão de terra
  const fg = g.createLinearGradient(0, 1060, 0, H); fg.addColorStop(0, '#9a6a42'); fg.addColorStop(1, '#5d3b22');
  g.beginPath(); g.moveTo(-MX, 1100); g.lineTo(190, 1090); g.lineTo(890, 1090); g.lineTo(W + MX, 1100); g.lineTo(W + MX, H + MY); g.lineTo(-MX, H + MY); g.closePath();
  g.fillStyle = fg; g.fill(); g.beginPath(); g.moveTo(-MX, 1100); g.lineTo(190, 1090); g.lineTo(890, 1090); g.lineTo(W + MX, 1100); stroke(g, 8);
  for (let i = 0; i < 40; i++) { const x = r() * W, y = 1150 + r() * 700; g.fillStyle = 'rgba(40,20,5,0.14)'; g.beginPath(); g.ellipse(x, y, 20 + r() * 50, 6 + r() * 10, 0, 0, TAU); g.fill(); }
  // palha, lança e tigela (como na referência)
  ell(g, 330, 1560, 250, 56, '#d8b13e', 7);
  for (let i = 0; i < 30; i++) seg(g, 120 + r() * 420, 1540 + r() * 40, 120 + r() * 420 + (r() - 0.5) * 60, 1510 + r() * 50, 3);
  seg(g, 120, 1700, 215, 1010, 10); poly(g, [[190, 1020], [232, 1000], [218, 940]], '#cfc7b8', 7);
  g.beginPath(); g.ellipse(120, 1740, 70, 26, 0, 0, TAU); g.fillStyle = '#8a5a30'; g.fill(); stroke(g, 7);
  ell(g, 120, 1732, 52, 12, '#b83a2a', 5);
  [[820, 1640, 70], [930, 1700, 50], [760, 1760, 40]].forEach(([x, y, rr]) => { ell(g, x, y, rr, rr * 0.6, '#8d8378', 7); });
  return (caveCache = c);
}
export function drawCave(g, t, { night = 0, outsideNight = night } = {}) {
  drawSky(g, t, 0, 0, outsideNight);
  drawSavanna(g, t, outsideNight);
  g.drawImage(caveCanvas(), -MX, -MY);
}

// tom de ambiente: frio (azul), escuro com holofote, calor (laranja)
export function tint(g, color, a) { g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = a; g.fillStyle = color; g.fillRect(0, 0, W, H); g.restore(); }
export function darkness(g, a, cx = 540, cy = 1000, r = 380) {
  const gr = g.createRadialGradient(cx, cy, r * 0.25, cx, cy, r * 2.6);
  gr.addColorStop(0, 'rgba(3,4,14,0)'); gr.addColorStop(0.35, `rgba(3,4,14,${a * 0.75})`); gr.addColorStop(1, `rgba(3,4,14,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
export function glow(g, x, y, r, a = 0.5) {
  const gr = g.createRadialGradient(x, y, 10, x, y, r); gr.addColorStop(0, `rgba(255,170,60,${a})`); gr.addColorStop(1, 'rgba(255,120,20,0)');
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
}

// fogueira: toras, pedras e chamas em camadas
export function drawFire(g, t, x, y, s = 1, k = 1) {
  if (k <= 0.01) return;
  g.save(); g.translate(x, y); g.scale(s, s);
  [[-70, 0.35], [70, -0.35]].forEach(([dx, rot]) => { g.save(); g.translate(dx * 0.3, -14); g.rotate(rot); poly(g, [[-90, -16], [90, -16], [90, 16], [-90, 16]], '#8a5a30', 7); g.restore(); });
  const flame = (w, h, col, ph, lw) => {
    const hh = h * k * (0.9 + 0.12 * Math.sin(t * 11 + ph)), ww = w * (0.95 + 0.06 * Math.sin(t * 9 + ph));
    g.beginPath(); g.moveTo(-ww, -10); g.bezierCurveTo(-ww * 1.1, -hh * 0.5, -ww * 0.2, -hh * 0.55, Math.sin(t * 7 + ph) * 12, -hh);
    g.bezierCurveTo(ww * 0.3, -hh * 0.55, ww * 1.1, -hh * 0.45, ww, -10); g.closePath(); g.fillStyle = col; g.fill(); if (lw) stroke(g, lw);
  };
  flame(95, 250, '#ff8a1f', 0, 8); flame(62, 180, '#ffc83a', 1.3, 0); flame(30, 105, '#fff4b8', 2.1, 0);
  for (let i = 0; i < 7; i++) { const u = ((t * 0.9 + i / 7) % 1); g.fillStyle = `rgba(255,190,70,${1 - u})`; g.beginPath(); g.arc(Math.sin(i * 3.1 + t) * 60, -200 - u * 220, 5 - u * 3, 0, TAU); g.fill(); }
  [[-110, 4, 34], [100, 6, 30], [-40, 18, 26], [50, 18, 24]].forEach(([dx, dy, rr]) => ell(g, dx, dy, rr, rr * 0.6, '#8d8378', 7));
  g.restore();
}

// olhos amarelos no escuro
export function drawEyes(g, x, y, s = 1, blink = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  [-46, 46].forEach((dx) => {
    g.save(); g.translate(dx, 0);
    g.fillStyle = '#ffe14a'; g.shadowColor = '#ffd21a'; g.shadowBlur = 24;
    g.beginPath(); g.ellipse(0, 0, 26, 20 * (1 - blink * 0.9), 0, 0, TAU); g.fill(); g.shadowBlur = 0;
    g.fillStyle = '#1a0d00'; g.beginPath(); g.ellipse(0, 0, 6, 17 * (1 - blink * 0.9), 0, 0, TAU); g.fill();
    g.restore();
  });
  g.restore();
}

// vaporzinho da respiração no frio
export function drawBreath(g, t, x, y, s = 1) {
  for (let i = 0; i < 4; i++) { const u = ((t * 0.7 + i / 4) % 1); g.globalAlpha = (1 - u) * 0.8; circ(g, x + u * 120 * s, y - u * 70 * s, (14 + u * 30) * s, '#ffffff', 0); }
  g.globalAlpha = 1;
}

// pedaço de carne no osso
export function drawMeat(g, s = 1) {
  g.save(); g.scale(s, s);
  seg(g, -60, 30, 60, -30, 14); circ(g, -70, 38, 16, '#fdfaf3', 6); circ(g, 70, -38, 16, '#fdfaf3', 6);
  g.beginPath(); g.ellipse(0, 0, 54, 34, -0.4, 0, TAU); g.fillStyle = '#b8473a'; g.fill(); stroke(g, 7);
  g.beginPath(); g.ellipse(-8, -6, 22, 10, -0.4, 0, TAU); g.fillStyle = '#e0867a'; g.fill();
  g.restore();
}

// ícones de "pintura rupestre" para a cena do metal
export function drawIcon(g, kind, size = 150) {
  g.save(); g.scale(size / 150, size / 150); g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'panela') { poly(g, [[-60, -30], [60, -30], [50, 40], [-50, 40]], '#c4552d', 8); ell(g, 0, -30, 60, 14, '#e7916a', 7); seg(g, -60, -20, -85, -10, 8); seg(g, 60, -20, 85, -10, 8); }
  if (kind === 'espada') { poly(g, [[-8, -70], [8, -70], [8, 30], [-8, 30]], '#c9d3dc', 7); seg(g, -34, 34, 34, 34, 10); seg(g, 0, 34, 0, 66, 10); }
  if (kind === 'ponte') { seg(g, -80, 20, 80, 20, 12); g.beginPath(); g.moveTo(-70, 20); g.quadraticCurveTo(0, -70, 70, 20); g.stroke(); for (let x = -50; x <= 50; x += 25) seg(g, x, 20, x, -10 - (50 - Math.abs(x)) * 0.2, 5); seg(g, -80, 20, -80, 50, 10); seg(g, 80, 20, 80, 50, 10); }
  if (kind === 'foguete') { poly(g, [[-20, 40], [-20, -30], [0, -70], [20, -30], [20, 40]], '#e8e8ee', 8); circ(g, 0, -10, 9, '#7ec4f0', 5); poly(g, [[-20, 20], [-42, 50], [-20, 40]], '#e5202a', 6); poly(g, [[20, 20], [42, 50], [20, 40]], '#e5202a', 6); }
  g.restore();
}
export function drawX(g, size = 150, k = 1) {
  g.save(); g.scale(size / 150, size / 150); g.strokeStyle = '#e5202a'; g.lineWidth = 16; g.lineCap = 'round';
  const a = Math.min(1, k * 2), b = Math.max(0, k * 2 - 1);
  g.beginPath(); g.moveTo(-70, -70); g.lineTo(-70 + 140 * a, -70 + 140 * a); g.stroke();
  if (b > 0) { g.beginPath(); g.moveTo(70, -70); g.lineTo(70 - 140 * b, -70 + 140 * b); g.stroke(); }
  g.restore();
}
