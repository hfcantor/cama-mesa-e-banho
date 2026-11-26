// Estilo "investigação": bonecos de madeira com cabeção brilhante, plateia desfocada, sombras longas,
// legenda branca com contorno, chips amarelos, carimbos e transições "fantasma".
// Tudo em Canvas 2D (1080×1920), sem imagens externas. Usado pelo EP08.
export const W = 1080, H = 1920;
export const NAVY = 'rgba(18,26,58,0.85)';
const TAU = Math.PI * 2;
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const rnd = (seed) => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const jit = (t, i, amp = 1) => { const f = Math.floor(t * 12); const x = Math.sin(f * 12.9898 + i * 78.233) * 43758.5453; return ((x - Math.floor(x)) - 0.5) * 2 * amp; };

const ol = (g, lw = 5) => { g.lineWidth = lw; g.strokeStyle = NAVY; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); };
const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
function circle(g, x, y, r, fill, lw = 5) { g.beginPath(); g.arc(x, y, r, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) ol(g, lw); }
function ellipse(g, x, y, rx, ry, fill, lw = 5, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) ol(g, lw); }
function rrect(g, x, y, w, h, r, fill, lw = 5) { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) ol(g, lw); }

// -------------------------------------------------------------- kits (sem escudos)
export const KITS = {
  barca: { shirt: '#1f3f96', stripe: '#a81d33', shorts: '#1f3f96', sock: '#1f3f96', hoop: '#a81d33', num: '#ffd24a', style: 'stripes' },
  psg: { shirt: '#10214d', stripe: '#d6283b', shorts: '#10214d', sock: '#10214d', hoop: '#d6283b', num: '#ffffff', style: 'center' },
  miami: { shirt: '#f4a6c4', stripe: '#f4a6c4', shorts: '#1a1a1a', sock: '#f4a6c4', hoop: '#1a1a1a', num: '#1a1a1a', style: 'plain' },
  arg: { shirt: '#7fc2ee', stripe: '#ffffff', shorts: '#16213f', sock: '#ffffff', hoop: '#7fc2ee', num: '#16213f', style: 'stripes' },
};

// -------------------------------------------------------------- cabeça
function drawHead(g, t, o) {
  const R = 125, { skin = '#f2c18d', hair = 'messi', beard = false, cap = false, white = false, face = {} } = o;
  const F = { brow: 0, eyes: 'dot', mouth: 'smile', smile: 0.6, look: 0, blink: 0, sweat: 0, ...face };
  const base = white ? '#f6f6f8' : skin;
  // orelhas
  [-1, 1].forEach((s) => circle(g, s * R * 0.98, R * 0.1, R * 0.2, white ? '#e6e6ea' : shade(skin, -14), 4));
  // cabeça com gradiente e brilho
  g.beginPath(); g.arc(0, 0, R, 0, TAU);
  const rg = g.createRadialGradient(-R * 0.4, -R * 0.5, R * 0.1, 0, 0, R * 1.1);
  rg.addColorStop(0, white ? '#ffffff' : shade(skin, 22)); rg.addColorStop(0.65, base); rg.addColorStop(1, white ? '#dcdce4' : shade(skin, -20));
  g.fillStyle = rg; g.fill(); ol(g, 5);
  g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
  // cabelo
  if (hair === 'messi') { g.beginPath(); g.moveTo(-R * 1.05, R * 0.05); g.bezierCurveTo(-R * 1.1, -R * 1.2, R * 1.1, -R * 1.2, R * 1.05, R * 0.05); g.bezierCurveTo(R * 0.8, -R * 0.45, R * 0.2, -R * 0.62, -R * 0.2, -R * 0.4); g.bezierCurveTo(-R * 0.55, -R * 0.3, -R * 0.85, -R * 0.2, -R * 1.05, R * 0.05); g.fillStyle = '#6b4427'; g.fill(); ol(g, 4); g.beginPath(); g.moveTo(-R * 0.5, -R * 0.78); g.bezierCurveTo(-R * 0.1, -R * 0.95, R * 0.4, -R * 0.9, R * 0.7, -R * 0.65); g.strokeStyle = 'rgba(255,214,160,0.45)'; g.lineWidth = 9; g.stroke(); }
  if (hair === 'exec') { g.beginPath(); g.moveTo(-R * 1.05, 0); g.bezierCurveTo(-R * 1.05, -R * 1.0, R * 1.05, -R * 1.0, R * 1.05, 0); g.bezierCurveTo(R * 0.8, -R * 0.55, -R * 0.8, -R * 0.55, -R * 1.05, 0); g.fillStyle = o.hairColor || '#3a3a44'; g.fill(); ol(g, 4); }
  if (cap) { // boina de detetive
    g.beginPath(); g.moveTo(-R * 1.08, -R * 0.2); g.bezierCurveTo(-R * 1.05, -R * 1.2, R * 1.05, -R * 1.2, R * 1.08, -R * 0.2); g.bezierCurveTo(R * 0.6, -R * 0.38, -R * 0.6, -R * 0.38, -R * 1.08, -R * 0.2); g.fillStyle = lin(g, 0, -R, 0, -R * 0.3, [[0, '#c9a06a'], [1, '#9c7440']]); g.fill(); ol(g, 5);
    g.strokeStyle = 'rgba(90,60,25,0.6)'; g.lineWidth = 4; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(i * R * 0.24, -R * 1.0); g.lineTo(i * R * 0.27, -R * 0.4); g.stroke(); }
  }
  // barba cheia
  if (beard) { g.beginPath(); g.moveTo(-R * 1.06, R * 0.02); g.bezierCurveTo(-R * 0.8, R * 0.36, -R * 0.38, R * 0.18, -R * 0.2, R * 0.3); g.bezierCurveTo(-R * 0.05, R * 0.4, R * 0.05, R * 0.4, R * 0.2, R * 0.3); g.bezierCurveTo(R * 0.38, R * 0.18, R * 0.8, R * 0.36, R * 1.06, R * 0.02); g.lineTo(R * 1.1, R * 1.2); g.lineTo(-R * 1.1, R * 1.2); g.closePath(); g.fillStyle = '#4b2d18'; g.fill(); ol(g, 4); }
  g.restore();
  // brilho (reflexo curvo no alto à esquerda)
  g.beginPath(); g.arc(0, 0, R * 0.84, Math.PI * 1.1, Math.PI * 1.43); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = R * 0.075; g.lineCap = 'round'; g.stroke();
  circle(g, -R * 0.56, -R * 0.62, R * 0.045, 'rgba(255,255,255,0.8)', 0);
  // sardas
  if (!white && o.freckles) { g.fillStyle = 'rgba(120,70,30,0.35)'; [[-0.62, 0.12], [-0.52, 0.2], [-0.7, 0.22], [0.62, 0.12], [0.52, 0.22], [0.7, 0.2]].forEach(([fx, fy]) => { g.beginPath(); g.arc(fx * R, fy * R, R * 0.028, 0, TAU); g.fill(); }); }
  // rosto
  const eyeY = -R * 0.04, ex = R * 0.36, look = F.look * R * 0.05;
  [-1, 1].forEach((s) => {
    g.save(); g.translate(s * ex, eyeY);
    if (F.blink > 0.5 || F.eyes === 'closed') { g.beginPath(); g.moveTo(-R * 0.12, 0); g.quadraticCurveTo(0, R * 0.06, R * 0.12, 0); g.lineWidth = 6; g.strokeStyle = '#1b1f33'; g.stroke(); }
    else if (F.eyes === 'happy') { g.beginPath(); g.arc(0, R * 0.05, R * 0.12, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 7; g.strokeStyle = '#1b1f33'; g.stroke(); }
    else if (F.eyes === 'wide') { circle(g, 0, 0, R * 0.16, '#fff', 4); circle(g, look, R * 0.01, R * 0.07, '#1b1f33', 0); }
    else if (F.eyes === 'half') { circle(g, 0, 0, R * 0.14, '#fff', 4); g.fillStyle = '#1b1f33'; g.beginPath(); g.arc(look, R * 0.02, R * 0.07, 0, TAU); g.fill(); g.fillStyle = base; g.fillRect(-R * 0.2, -R * 0.18, R * 0.4, R * 0.17); g.beginPath(); g.moveTo(-R * 0.15, -R * 0.01); g.lineTo(R * 0.15, -R * 0.01); g.lineWidth = 6; g.strokeStyle = '#1b1f33'; g.stroke(); }
    else if (F.eyes === 'cry') { circle(g, 0, 0, R * 0.14, '#fff', 4); circle(g, look, R * 0.03, R * 0.07, '#1b1f33', 0); }
    else { g.beginPath(); g.ellipse(look, 0, R * 0.065, R * 0.09, 0, 0, TAU); g.fillStyle = '#1b1f33'; g.fill(); }
    // sobrancelha
    g.restore();
    g.save(); g.translate(s * ex, eyeY - R * 0.2);
    g.rotate(s * F.brow * 0.45 * -1 + (F.eyes === 'happy' ? 0 : 0));
    g.beginPath(); g.moveTo(-R * 0.17, 0); g.lineTo(R * 0.17, 0); g.lineWidth = 8; g.strokeStyle = o.browColor || '#3a2615'; g.lineCap = 'round'; g.stroke();
    g.restore();
  });
  // lágrimas / suor
  if (F.eyes === 'cry') { [-1, 1].forEach((s) => { const u = (t * 1.2 + (s > 0 ? 0.5 : 0)) % 1; g.fillStyle = 'rgba(120,190,255,0.9)'; g.beginPath(); g.ellipse(s * ex, eyeY + R * 0.18 + u * R * 0.5, R * 0.04, R * 0.07, 0, 0, TAU); g.fill(); }); }
  if (F.sweat > 0.05) { g.fillStyle = 'rgba(130,200,255,0.95)'; g.beginPath(); g.moveTo(R * 0.8, -R * 0.4); g.quadraticCurveTo(R * 0.95, -R * 0.15, R * 0.8, -R * 0.1); g.quadraticCurveTo(R * 0.65, -R * 0.15, R * 0.8, -R * 0.4); g.fill(); ol(g, 3); }
  // boca
  const my = R * 0.42;
  g.save(); g.translate(0, my);
  if (F.mouth === 'open') { g.beginPath(); g.moveTo(-R * 0.27, 0); g.quadraticCurveTo(0, R * 0.5, R * 0.27, 0); g.quadraticCurveTo(0, -R * 0.08, -R * 0.27, 0); g.fillStyle = '#6a1f2a'; g.fill(); ol(g, 4); g.save(); g.clip(); g.fillStyle = '#ff7b8a'; g.beginPath(); g.ellipse(0, R * 0.28, R * 0.16, R * 0.1, 0, 0, TAU); g.fill(); g.restore(); g.fillStyle = '#fff'; g.fillRect(-R * 0.2, -R * 0.02, R * 0.4, R * 0.07); }
  else if (F.mouth === 'o') { ellipse(g, 0, R * 0.06, R * 0.09, R * 0.12, '#6a1f2a', 4); }
  else if (F.mouth === 'flat') { g.beginPath(); g.moveTo(-R * 0.17, 0); g.lineTo(R * 0.17, 0); g.lineWidth = 7; g.strokeStyle = '#1b1f33'; g.stroke(); }
  else if (F.mouth === 'frown') { g.beginPath(); g.moveTo(-R * 0.2, R * 0.08); g.quadraticCurveTo(0, -R * 0.06, R * 0.2, R * 0.08); g.lineWidth = 7; g.strokeStyle = '#1b1f33'; g.stroke(); }
  else if (F.mouth === 'smirk') { g.beginPath(); g.moveTo(-R * 0.17, R * 0.02); g.quadraticCurveTo(R * 0.05, R * 0.1, R * 0.2, -R * 0.04); g.lineWidth = 7; g.strokeStyle = '#1b1f33'; g.stroke(); }
  else { g.beginPath(); g.moveTo(-R * 0.22, 0); g.quadraticCurveTo(0, R * 0.34 * F.smile, R * 0.22, 0); g.lineWidth = 7; g.strokeStyle = beard ? '#f6c9c0' : '#1b1f33'; g.stroke(); }
  g.restore();
  if (o.moustache) { g.fillStyle = '#2e2018'; g.beginPath(); g.moveTo(-R * 0.3, R * 0.32); g.quadraticCurveTo(0, R * 0.2, R * 0.3, R * 0.32); g.quadraticCurveTo(0, R * 0.38, -R * 0.3, R * 0.32); g.fill(); }
}
function shade(hex, d) { const n = parseInt(hex.slice(1), 16); const c = (v) => Math.max(0, Math.min(255, v + d)); return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`; }

// -------------------------------------------------------------- corpo
const WOOD = '#ecc590';
function limb(g, x1, y1, x2, y2, w = 26, fill = WOOD) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineWidth = w + 7; g.strokeStyle = NAVY; g.lineCap = 'round'; g.stroke(); g.lineWidth = w; g.strokeStyle = fill; g.stroke(); g.lineWidth = w * 0.28; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.moveTo(x1 - 5, y1 - 2); g.lineTo(x2 - 5, y2 - 2); g.stroke(); }

function arm(g, sx, sy, a1, a2, side, skin = WOOD, sleeve = null, len1 = 80, len2 = 74) {
  const ex = sx + side * Math.sin(a1) * len1, ey = sy + Math.cos(a1) * len1;
  const hx = ex + side * Math.sin(a1 + a2) * len2, hy = ey + Math.cos(a1 + a2) * len2;
  limb(g, sx, sy, ex, ey, 26, sleeve || skin); limb(g, ex, ey, hx, hy, 24, sleeve || skin);
  circle(g, ex, ey, 16, skin, 4);
  circle(g, hx, hy, 21, skin === WOOD ? '#f4d8aa' : skin, 4);
  return [hx, hy];
}

export function puppet(g, t, o) {
  const { x, y, s = 1, flip = 1, kind = 'player', kit = 'barca', num = '10', pose = {}, head = {}, shadow = true, holdR, holdL } = o;
  const P = { armL: 0.25, armR: 0.25, bendL: 0.15, bendR: 0.15, bob: Math.sin(t * 2.2) * 3, tilt: 0, lean: 0, legSpread: 0.0, ...pose };
  g.save(); g.translate(x, y); g.scale(s * flip, s);
  if (shadow) { g.save(); g.fillStyle = 'rgba(15,20,40,0.28)'; g.beginPath(); g.ellipse(110, 4, 190, 28, 0, 0, TAU); g.fill(); g.restore(); }
  const K = KITS[kit] || KITS.barca;
  const suit = kind === 'exec' ? o.suit : null;
  // ---- pernas
  const legCol = kind === 'detective' ? '#15151c' : kind === 'exec' ? (suit || '#5a1f1f') : WOOD;
  [-1, 1].forEach((sd) => {
    const lx = sd * 36 + P.legSpread * sd * 30;
    if (kind === 'judge') { ellipse(g, lx + sd * 6, -10, 38, 16, '#101018', 4); }
    else if (kind === 'player') {
      limb(g, lx, -122, lx, -80, 22); circle(g, lx, -82, 14, WOOD, 4);
      g.beginPath(); g.roundRect(lx - 21, -80, 42, 66, 10); g.fillStyle = K.sock; g.fill(); ol(g, 4);
      g.fillStyle = K.hoop; g.fillRect(lx - 21, -52, 42, 13); g.beginPath(); g.roundRect(lx - 21, -80, 42, 66, 10); ol(g, 4);
      ellipse(g, lx + sd * 8, -10, 36, 15, '#15151f', 4);
    } else {
      limb(g, lx, -130, lx, -22, 30, legCol);
      if (kind === 'detective') { g.fillStyle = '#fff'; g.fillRect(lx + sd * 12 - 3, -130, 6, 108); }
      ellipse(g, lx + sd * 6, -10, 38, 16, '#101018', 4);
    }
  });
  // ---- tronco
  g.save(); g.translate(0, P.bob); g.rotate(P.lean);
  if (kind === 'player') {
    // short
    g.beginPath(); g.roundRect(-70, -176, 140, 60, 14); g.fillStyle = K.shorts; g.fill(); ol(g, 5);
    g.fillStyle = K.num; g.font = '900 34px Montserrat, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(num, 40, -146);
    // camisa
    g.beginPath(); g.moveTo(-76, -296); g.quadraticCurveTo(0, -312, 76, -296); g.lineTo(70, -172); g.lineTo(-70, -172); g.closePath();
    g.save(); g.clip(); g.fillStyle = K.shirt; g.fillRect(-90, -320, 180, 160);
    if (K.style === 'stripes') for (let i = -3; i <= 3; i += 2) { g.fillStyle = K.stripe; g.fillRect(i * 20 - 11, -320, 22, 160); }
    if (K.style === 'center') { g.fillStyle = '#fff'; g.fillRect(-19, -320, 38, 160); g.fillStyle = K.stripe; g.fillRect(-12, -320, 24, 160); }
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(-90, -320, 50, 160); g.restore();
    g.beginPath(); g.moveTo(-76, -296); g.quadraticCurveTo(0, -312, 76, -296); g.lineTo(70, -172); g.lineTo(-70, -172); g.closePath(); ol(g, 5);
    g.beginPath(); g.moveTo(-24, -300); g.lineTo(0, -270); g.lineTo(24, -300); g.fillStyle = K.num === '#ffffff' ? '#fff' : '#ffd24a'; g.fill(); ol(g, 3);
    const hs = arm(g, -76, -284, P.armL, P.bendL, -1, WOOD, null);
    const hs2 = arm(g, 76, -284, P.armR, P.bendR, 1, WOOD, null);
    if (holdL) holdL(g, hs[0], hs[1]); if (holdR) holdR(g, hs2[0], hs2[1]);
  } else if (kind === 'judge') {
    g.beginPath(); g.moveTo(-84, -300); g.quadraticCurveTo(0, -316, 84, -300); g.lineTo(108, -30); g.lineTo(-108, -30); g.closePath(); g.fillStyle = '#17171f'; g.fill(); ol(g, 5);
    g.beginPath(); g.moveTo(-26, -304); g.lineTo(0, -230); g.lineTo(26, -304); g.strokeStyle = '#f2c14e'; g.lineWidth = 7; g.stroke(); ellipse(g, 0, -226, 11, 14, '#f4f4f8', 4);
    const h1 = arm(g, -80, -284, P.armL, P.bendL, -1, '#f6f6f8', '#17171f'); const h2 = arm(g, 80, -284, P.armR, P.bendR, 1, '#f6f6f8', '#17171f');
    if (holdL) holdL(g, h1[0], h1[1]); if (holdR) holdR(g, h2[0], h2[1]);
  } else if (kind === 'detective') {
    g.beginPath(); g.moveTo(-84, -300); g.quadraticCurveTo(0, -316, 84, -300); g.lineTo(80, -130); g.lineTo(-80, -130); g.closePath(); g.fillStyle = '#15151c'; g.fill(); ol(g, 5);
    g.fillStyle = '#fff'; g.fillRect(-60, -300, 5, 170); g.fillRect(55, -300, 5, 170);
    g.beginPath(); g.moveTo(-24, -304); g.lineTo(0, -240); g.lineTo(24, -304); g.strokeStyle = '#f2c14e'; g.lineWidth = 7; g.stroke(); ellipse(g, 0, -236, 11, 13, '#f4f4f8', 4);
    const h1 = arm(g, -80, -284, P.armL, P.bendL, -1, '#f6f6f8', '#15151c'); const h2 = arm(g, 80, -284, P.armR, P.bendR, 1, '#f6f6f8', '#15151c');
    if (holdL) holdL(g, h1[0], h1[1]); if (holdR) holdR(g, h2[0], h2[1]);
  } else { // executivo de terno
    g.beginPath(); g.moveTo(-82, -300); g.quadraticCurveTo(0, -316, 82, -300); g.lineTo(78, -130); g.lineTo(-78, -130); g.closePath(); g.fillStyle = suit; g.fill(); ol(g, 5);
    g.beginPath(); g.moveTo(-22, -304); g.lineTo(0, -240); g.lineTo(22, -304); g.fillStyle = '#f4f4f8'; g.fill();
    g.beginPath(); g.moveTo(-9, -300); g.lineTo(9, -300); g.lineTo(13, -200); g.lineTo(0, -184); g.lineTo(-13, -200); g.closePath(); g.fillStyle = o.tie || '#e8c53a'; g.fill(); ol(g, 3);
    const h1 = arm(g, -78, -284, P.armL, P.bendL, -1, WOOD, suit); const h2 = arm(g, 78, -284, P.armR, P.bendR, 1, WOOD, suit);
    if (holdL) holdL(g, h1[0], h1[1]); if (holdR) holdR(g, h2[0], h2[1]);
  }
  // ---- cabeça
  g.save(); g.translate(0, -388); g.rotate(P.tilt);
  drawHead(g, t, { ...head, white: kind === 'judge' || kind === 'detective', cap: kind === 'detective', hair: head.hair || (kind === 'exec' ? 'exec' : kind === 'player' ? 'messi' : 'none') });
  g.restore();
  g.restore(); g.restore();
}

// -------------------------------------------------------------- objetos
export function gavel(g, rot = 0) { g.save(); g.rotate(rot); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -120); g.lineWidth = 12; g.strokeStyle = '#7a4a22'; g.stroke(); g.beginPath(); g.roundRect(-34, -150, 68, 38, 8); g.fillStyle = '#9a5f2e'; g.fill(); ol(g, 5); g.restore(); }
export function magnifier(g) { g.beginPath(); g.moveTo(0, 0); g.lineTo(44, 80); g.lineWidth = 12; g.strokeStyle = '#7a4a22'; g.stroke(); circle(g, -6, -12, 40, 'rgba(210,235,255,0.55)', 8); g.beginPath(); g.arc(-6, -12, 28, Math.PI * 1.1, Math.PI * 1.5); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 6; g.stroke(); }
export function briefcase(g) { rrect(g, -48, -36, 96, 72, 10, '#b46a2a', 5); g.beginPath(); g.moveTo(-22, -36); g.lineTo(-22, -50); g.lineTo(22, -50); g.lineTo(22, -36); ol(g, 5); g.fillStyle = '#e8c53a'; g.fillRect(-9, -8, 18, 14); }
export function cassette(g, label = 'PROVA') { g.save(); rrect(g, -88, -56, 176, 112, 14, '#23243a', 5); rrect(g, -62, -42, 124, 40, 6, '#fff', 3); g.fillStyle = '#23243a'; g.font = '800 26px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, -22); circle(g, -34, 22, 20, '#8a8aa0', 4); circle(g, 34, 22, 20, '#8a8aa0', 4); g.restore(); }
export function trophy(g) { g.beginPath(); g.arc(0, 0, 54, 0, TAU); g.fillStyle = lin(g, -40, -40, 40, 40, [[0, '#ffe680'], [1, '#d9a21a']]); g.fill(); ol(g, 5); g.beginPath(); g.arc(-18, -20, 14, Math.PI, Math.PI * 1.5); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 7; g.stroke(); rrect(g, -30, 56, 60, 22, 6, '#3a2a18', 4); }

// -------------------------------------------------------------- textos
export function headline(g, text, y, { size = 70, color = '#ffd23a', rot = -0.03, alpha = 1, scale = 1, white = false } = {}) {
  if (alpha <= 0.01) return;
  g.save(); g.globalAlpha = alpha; g.translate(540, y); g.rotate(rot); g.scale(scale, scale);
  g.font = `900 ${size}px Montserrat, Arial Black, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = size * 0.2; g.strokeStyle = '#1a1a33'; g.strokeText(text, 0, 0);
  g.lineWidth = size * 0.1; g.strokeStyle = white ? '#1a1a33' : '#b8841a'; g.strokeText(text, 0, 0);
  g.fillStyle = white ? '#ffffff' : color; g.fillText(text, 0, 0);
  g.restore();
}
export function tag(g, text, y, { alpha = 1, size = 40, rot = -0.02 } = {}) { headline(g, text, y, { size, white: true, rot, alpha }); }
export function chipBox(g, text, x, y, { alpha = 1, size = 56, fg = '#7dffa8', bg = 'rgba(10,14,24,0.85)', scale = 1 } = {}) {
  if (alpha <= 0.01) return;
  g.save(); g.globalAlpha = alpha; g.translate(x, y); g.scale(scale, scale);
  g.font = `900 ${size}px Montserrat, Arial Black, sans-serif`; const w = g.measureText(text).width + 56;
  g.beginPath(); g.roundRect(-w / 2, -size * 0.85, w, size * 1.7, 22); g.fillStyle = bg; g.fill();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 2); g.restore();
}
export function stamp(g, text, x, y, k, { color = '#d8283a', rot = -0.2, size = 74 } = {}) {
  if (k <= 0) return; const sc = 1 + (1 - clamp01(k / 0.2)) * 2.4;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.globalAlpha = Math.min(1, k * 4);
  g.font = `900 ${size}px Montserrat, Arial Black, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(text).width + 60;
  g.beginPath(); g.roundRect(-w / 2, -size * 0.8, w, size * 1.6, 14); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill(); g.lineWidth = 9; g.strokeStyle = color; g.stroke();
  g.fillStyle = color; g.fillText(text, 0, 3); g.restore();
}
// legenda: 2 a 3 palavras por vez, branca com contorno grosso, como no vídeo de referência
export function subtitles(g, tl, t) {
  for (const L of tl.lines) {
    if (t < L.start - 0.15 || t > L.end + 0.4) continue;
    const ws = L.words; let i = 0;
    while (i < ws.length) {
      let j = i, len = 0;
      while (j < ws.length && j - i < 3 && len + ws[j].w.length < 19) { len += ws[j].w.length + 1; j++; if (/[.!?…:,]$/.test(ws[j - 1].w)) break; }
      if (j === i) j = i + 1;
      const a = ws[i].start - 0.03, b = j < ws.length ? ws[j].start - 0.03 : L.end + 0.3;
      if (t >= a && t < b) {
        const text = ws.slice(i, j).map((w) => w.w).join(' ');
        const k = clamp01((t - a) / 0.09), sc = 0.92 + 0.08 * k;
        g.save(); g.translate(540, 1236); g.scale(sc, sc); g.font = '800 64px Montserrat, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
        g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 12; g.shadowOffsetY = 5; g.lineWidth = 16; g.strokeStyle = '#0c0c18'; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
        g.fillStyle = '#fff'; g.fillText(text, 0, 0); g.restore();
        return;
      }
      i = j;
    }
  }
}

// -------------------------------------------------------------- efeitos
export function vignette(g, a = 0.5) { const gr = g.createRadialGradient(540, 960, 480, 540, 960, 1250); gr.addColorStop(0, 'rgba(20,10,0,0)'); gr.addColorStop(1, `rgba(20,10,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
let grainC = null;
export function grain(g, t, a = 0.07) { if (!grainC) { grainC = mk(256, 256); const c = grainC.getContext('2d'), im = c.createImageData(256, 256), r = rnd(9); for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } c.putImageData(im, 0, 0); } g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'overlay'; const k = Math.floor(t * 18) % 6; g.translate(-((k * 71) % 256), -((k * 43) % 256)); g.fillStyle = g.createPattern(grainC, 'repeat'); g.fillRect(0, 0, W + 256, H + 256); g.restore(); }
export function confetti(g, t, k, n = 70) { if (k <= 0) return; for (let i = 0; i < n; i++) { const u = (t * 0.55 + i * 0.137) % 1, x = (i * 97.7) % W, y = -30 + u * 1100; g.save(); g.translate(x, y); g.rotate(u * 12 + i); g.fillStyle = ['#ffd24a', '#e8334a', '#3b6fe0', '#fff', '#3ad06a'][i % 5]; g.globalAlpha = clamp01(k); g.fillRect(-9, -5, 18, 10); g.restore(); } }

// "fantasma" de transição: o último quadro da cena anterior some por cima com desfoque
let snapC = null;
export function snap(g) { if (!snapC) snapC = mk(W / 2, H / 2); snapC.getContext('2d').drawImage(g.canvas, 0, 0, W / 2, H / 2); }
export function ghostIn(g, lt, dur = 0.5) {
  if (!snapC || lt >= dur) return; const k = 1 - lt / dur;
  g.save(); g.globalAlpha = 0.85 * k * k; g.filter = `blur(${Math.round(10 * k)}px)`; g.drawImage(snapC, -20, -20, W + 40, H + 40); g.restore();
}

// -------------------------------------------------------------- cenários
const bgCache = {};
function cached(key, draw, blur = 0) { if (bgCache[key]) return bgCache[key]; const c = mk(W, H), g = c.getContext('2d'); draw(g); if (blur) { const o = mk(W, H); const og = o.getContext('2d'); og.filter = `blur(${blur}px)`; og.drawImage(c, 0, 0); bgCache[key] = o; } else bgCache[key] = c; return bgCache[key]; }

export function stadiumBG(g, { flags = true, hills = true } = {}) {
  const c = cached('stadium' + flags, (cg) => {
    const sky = lin(cg, 0, 0, 0, 700, [[0, '#9fc3e6'], [1, '#dfe9ee']]); cg.fillStyle = sky; cg.fillRect(0, 0, W, 800);
    cg.beginPath(); cg.moveTo(0, 520); for (let x = 0; x <= W; x += 40) cg.lineTo(x, 470 - Math.sin(x * 0.006 + 1) * 70 - Math.sin(x * 0.02) * 12); cg.lineTo(W, 700); cg.lineTo(0, 700); cg.closePath(); cg.fillStyle = '#8aa88a'; cg.fill();
    cg.fillStyle = '#b9a98f'; cg.fillRect(0, 560, W, 330);
    const r = rnd(21);
    for (let row = 0; row < 15; row++) { const yy = 560 + row * 22; for (let x = -10; x < W + 20; x += 16) { const ox = (row % 2) * 8; cg.fillStyle = ['#e8d3b0', '#d9a066', '#8a5a3a', '#f2c9a0'][Math.floor(r() * 4)]; cg.beginPath(); cg.arc(x + ox, yy, 6, 0, TAU); cg.fill(); cg.fillStyle = ['#e8c53a', '#1f3f96', '#a81d33', '#f2f2f2', '#2a2a2a', '#3a8a4a'][Math.floor(r() * 6)]; cg.fillRect(x + ox - 7, yy + 6, 14, 15); } }
    cg.fillStyle = 'rgba(80,60,40,0.35)'; cg.fillRect(0, 880, W, 40);
    cg.fillStyle = '#c97a3a'; cg.fillRect(0, 900, W, 70);
    const gr = lin(cg, 0, 960, 0, H, [[0, '#4f9a3a'], [1, '#2f7a28']]); cg.fillStyle = gr; cg.fillRect(0, 960, W, H - 960);
    for (let i = 0; i < 9; i++) { cg.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'; cg.fillRect(0, 960 + i * i * 12 + i * 30, W, 40 + i * 14); }
    cg.fillStyle = 'rgba(255,255,255,0.9)'; cg.fillRect(0, 1010, W, 8);
  }, 3);
  g.drawImage(c, 0, 0);
  if (flags) { for (let i = 0; i < 4; i++) { const x = 90 + i * 290; g.fillStyle = '#9aa0a8'; g.fillRect(x - 5, 80, 10, 420); const wv = Math.sin(performance.now() * 0.0015 + i) * 0; g.beginPath(); g.moveTo(x + 5, 90); g.lineTo(x + 175, 100 + wv); g.lineTo(x + 175, 250 + wv); g.lineTo(x + 5, 240); g.closePath(); g.fillStyle = '#a81d33'; g.fill(); g.fillStyle = '#1f3f96'; g.fillRect(x + 5, 92, 56, 150); g.fillRect(x + 118, 98, 56, 150); g.strokeStyle = NAVY; g.lineWidth = 4; g.stroke(); } }
}

export function courtBG(g) {
  const c = cached('court', (cg) => {
    cg.fillStyle = lin(cg, 0, 0, 0, 1000, [[0, '#8a6a4a'], [1, '#6a4a30']]); cg.fillRect(0, 0, W, H);
    [60, 330, 600, 870].forEach((x) => { cg.fillStyle = '#c9b690'; cg.fillRect(x, 70, 130, 600); cg.fillStyle = '#e3d3ab'; cg.fillRect(x - 12, 40, 154, 54); });
    cg.fillStyle = '#b9aa88'; cg.fillRect(200, 180, 680, 360); cg.strokeStyle = '#7a5a3a'; cg.lineWidth = 10; cg.strokeRect(200, 180, 680, 360);
    cg.fillStyle = '#5a3a22'; cg.fillRect(0, 1250, W, H - 1250);
    cg.fillStyle = lin(cg, 0, 1050, 0, 1500, [[0, '#a8683a'], [1, '#7a4a26']]); cg.fillRect(0, 1050, W, 420);
    cg.strokeStyle = 'rgba(40,20,5,0.5)'; cg.lineWidth = 6; for (let i = 0; i < 4; i++) cg.strokeRect(30 + i * 262, 1100, 240, 320);
    cg.fillStyle = '#3a2412'; cg.fillRect(0, 1040, W, 26);
  }, 4);
  g.drawImage(c, 0, 0);
}
export function wallBG(g, { floor = true } = {}) {
  const c = cached('wall' + floor, (cg) => {
    cg.fillStyle = lin(cg, 0, 0, W, H, [[0, '#efe2c4'], [1, '#d9c7a0']]); cg.fillRect(0, 0, W, H);
    cg.fillStyle = 'rgba(120,90,50,0.06)'; for (let i = 0; i < 80; i++) { cg.beginPath(); cg.arc((i * 137) % W, (i * 311) % H, 30 + (i % 5) * 20, 0, TAU); cg.fill(); }
    if (floor) { cg.fillStyle = lin(cg, 0, 1280, 0, H, [[0, '#8a6038'], [1, '#6a4626']]); cg.fillRect(0, 1280, W, H - 1280); cg.fillStyle = 'rgba(0,0,0,0.12)'; cg.fillRect(0, 1280, W, 10); }
  }, 2);
  g.drawImage(c, 0, 0);
}
export function skylineBG(g, t) {
  const c = cached('skyline', (cg) => {
    cg.fillStyle = lin(cg, 0, 0, 0, 1100, [[0, '#2a3a5a'], [1, '#4a5a7a']]); cg.fillRect(0, 0, W, 1250);
    const r = rnd(5);
    for (let i = 0; i < 12; i++) { const bx = i * 100 - 20, bh = 400 + r() * 500, bw = 90 + r() * 40; cg.fillStyle = i % 2 ? '#3a4a66' : '#2e3c58'; cg.fillRect(bx, 1100 - bh, bw, bh); for (let wy = 1100 - bh + 20; wy < 1090; wy += 34) for (let wx = bx + 10; wx < bx + bw - 14; wx += 26) { cg.fillStyle = r() > 0.55 ? '#ffd66a' : 'rgba(255,255,255,0.08)'; cg.fillRect(wx, wy, 12, 18); } }
    cg.fillStyle = '#1a2236'; cg.fillRect(0, 1090, W, 180);
    cg.fillStyle = lin(cg, 0, 1250, 0, H, [[0, '#6a4a2a'], [1, '#3e2a18']]); cg.fillRect(0, 1250, W, H - 1250);
    cg.strokeStyle = 'rgba(10,10,20,0.7)'; cg.lineWidth = 14; for (let x = 0; x <= W; x += 270) { cg.beginPath(); cg.moveTo(x, 0); cg.lineTo(x, 1090); cg.stroke(); }
  }, 3);
  g.drawImage(c, 0, 0); void t;
}
export function skyBG(g, t, { tower = true, beam = true } = {}) {
  g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#6fb0ee'], [1, '#d6ecfb']]); g.fillRect(0, 0, W, H);
  [[160, 300, 1.6], [820, 520, 1.3], [300, 880, 1.8], [900, 1150, 1.2]].forEach(([cx, cy, sc], i) => { g.save(); g.globalAlpha = 0.9; g.translate(((cx + t * (8 + i * 3)) % (W + 500)) - 250, cy); g.scale(sc, sc); g.fillStyle = '#fff'; [[-70, 12, 46], [-20, -12, 62], [40, 0, 52], [90, 16, 38]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(dx, dy, r, 0, TAU); g.fill(); }); g.restore(); });
  if (beam) { g.save(); g.globalAlpha = 0.55; g.fillStyle = lin(g, 0, 0, 0, 1300, [[0, 'rgba(255,255,230,0.9)'], [1, 'rgba(255,255,230,0)']]); g.beginPath(); g.moveTo(300, -50); g.lineTo(560, -50); g.lineTo(820, 1500); g.lineTo(80, 1500); g.closePath(); g.fill(); g.restore(); }
  if (tower) { g.save(); g.translate(880, 1200); g.fillStyle = '#8a6a50'; g.beginPath(); g.moveTo(-190, 0); g.lineTo(-60, -700); g.lineTo(-30, -1100); g.lineTo(30, -1100); g.lineTo(60, -700); g.lineTo(190, 0); g.lineTo(110, 0); g.lineTo(0, -380); g.lineTo(-110, 0); g.closePath(); g.fill(); ol(g, 6); [[-760, 56], [-520, 90], [-260, 130]].forEach(([yy, ww]) => { g.fillStyle = '#a98a6e'; g.fillRect(-ww, yy, ww * 2, 26); g.strokeStyle = NAVY; g.lineWidth = 4; g.strokeRect(-ww, yy, ww * 2, 26); }); g.restore(); }
}
export function palmsBG(g, t) {
  g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#ffb36b'], [0.5, '#ffd9a0'], [1, '#bfe8ff']]); g.fillRect(0, 0, W, H);
  g.fillStyle = '#ff8a5a'; g.beginPath(); g.arc(760, 560, 150, 0, TAU); g.fill();
  g.fillStyle = '#4fb8d8'; g.fillRect(0, 1000, W, 330); g.fillStyle = '#f0d9a0'; g.fillRect(0, 1250, W, H - 1250);
  [[120, 1300, 1.2], [930, 1280, 1.0], [520, 1220, 0.7]].forEach(([x, y, sc]) => { g.save(); g.translate(x, y); g.scale(sc, sc); g.beginPath(); g.moveTo(-14, 0); g.quadraticCurveTo(30, -300, 10, -640); g.lineWidth = 36; g.strokeStyle = '#7a5230'; g.stroke(); for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.55 + Math.sin(t * 1.4 + k) * 0.04; g.save(); g.translate(10, -640); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(120, -60, 260, 20); g.quadraticCurveTo(120, -10, 0, 0); g.fillStyle = '#3a9a4a'; g.fill(); ol(g, 4); g.restore(); } g.restore(); });
}

export function corkBoard(g, x, y, w, h) { g.save(); g.translate(x, y); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(14, 18, w, h); g.beginPath(); g.roundRect(0, 0, w, h, 10); g.fillStyle = lin(g, 0, 0, w, h, [[0, '#c99a5a'], [1, '#b08040']]); g.fill(); g.lineWidth = 16; g.strokeStyle = '#6a4220'; g.stroke(); g.fillStyle = 'rgba(90,60,20,0.35)'; const r = rnd(8); for (let i = 0; i < 120; i++) { g.fillRect(8 + r() * (w - 16), 8 + r() * (h - 16), 3, 3); } g.restore(); }
export function polaroid(g, x, y, w, h, label, icon, k = 1, rot = 0) {
  if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(0.6 + 0.4 * ease(k), 0.6 + 0.4 * ease(k)); g.globalAlpha = clamp01(k * 2);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-w / 2 + 8, -h / 2 + 10, w, h); g.fillStyle = '#fbfbfb'; g.fillRect(-w / 2, -h / 2, w, h); g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.25)'; g.strokeRect(-w / 2, -h / 2, w, h);
  g.fillStyle = '#e9edf2'; g.fillRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 80);
  g.save(); g.translate(0, -h / 2 + 12 + (h - 80) / 2);
  if (icon === 'money') { g.beginPath(); g.ellipse(0, 18, 56, 62, 0, 0, TAU); g.fillStyle = '#4aa85a'; g.fill(); ol(g, 5); g.beginPath(); g.moveTo(-26, -34); g.quadraticCurveTo(0, -78, 26, -34); g.fillStyle = '#3a8a4a'; g.fill(); ol(g, 5); g.fillStyle = '#ffe680'; g.font = '900 54px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('€', 0, 22); }
  if (icon === 'liga') { g.beginPath(); g.moveTo(-50, -60); g.lineTo(50, -60); g.lineTo(50, 20); g.quadraticCurveTo(0, 80, -50, 20); g.closePath(); g.fillStyle = '#d6283b'; g.fill(); ol(g, 5); g.fillStyle = '#fff'; g.font = '900 36px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LL', 0, -14); }
  if (icon === 'q') { g.fillStyle = '#1b1f2a'; g.fillRect(-w / 2 + 12, -(h - 80) / 2, w - 24, h - 80); g.fillStyle = '#fff'; g.font = '900 58px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('???', 0, 0); }
  if (icon === 'messi') { g.scale(0.42, 0.42); puppet(g, 0, { x: 0, y: 190, s: 1, kit: 'barca', num: '10', shadow: false, head: { beard: true, hair: 'messi' }, pose: { armL: 0.2, armR: 0.2 } }); }
  g.restore();
  g.fillStyle = '#1b1f2a'; g.font = '800 26px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, h / 2 - 32);
  circle(g, 0, -h / 2 + 4, 9, '#d6283b', 3); g.restore();
}

export function moneyPile(g, t, k = 1) { const r = rnd(33); for (let i = 0; i < 46 * k; i++) { const x = 140 + r() * 800, y = 1290 - Math.pow(r(), 0.7) * 300 + 40, rot = (r() - 0.5) * 1.2; g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.roundRect(-70, -34, 140, 68, 8); g.fillStyle = r() > 0.5 ? '#5cc06a' : '#49a85a'; g.fill(); ol(g, 4); circle(g, 0, 0, 20, '#8fe39a', 3); g.fillStyle = '#2a6a36'; g.font = '800 22px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('€', 0, 1); g.restore(); } void t; }

export function calendar(g, x, y, mes, ano, k = 1) { if (k <= 0) return; g.save(); g.translate(x, y); g.scale(0.7 + 0.3 * ease(k), 0.7 + 0.3 * ease(k)); g.globalAlpha = clamp01(k * 2); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-150, -128, 320, 280); g.beginPath(); g.roundRect(-160, -140, 320, 280, 16); g.fillStyle = '#fff'; g.fill(); ol(g, 5); g.fillStyle = '#d8283a'; g.beginPath(); g.roundRect(-160, -140, 320, 70, [16, 16, 0, 0]); g.fill(); g.fillStyle = '#fff'; g.font = '900 38px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(mes, 0, -104); g.fillStyle = '#1f2a44'; g.font = '900 92px Montserrat'; g.fillText(ano, 0, 20); g.restore(); }

export function phoneCard(g, x, y, w, h, title, lines, hi = -1, k = 1) {
  if (k <= 0) return; g.save(); g.translate(x, y); g.globalAlpha = clamp01(k * 2); g.scale(0.85 + 0.15 * ease(k), 0.85 + 0.15 * ease(k));
  g.beginPath(); g.roundRect(-w / 2 - 20, -h / 2 - 20, w + 40, h + 40, 50); g.fillStyle = '#12141f'; g.fill(); ol(g, 5);
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 28); g.fillStyle = '#f3f6fb'; g.fill();
  circle(g, -w / 2 + 56, -h / 2 + 62, 30, '#1f3f96', 0); g.fillStyle = '#1b1f2a'; g.font = '800 30px Montserrat'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(title, -w / 2 + 100, -h / 2 + 62);
  lines.forEach((ln, i) => { const yy = -h / 2 + 150 + i * 56; if (i === hi) { g.fillStyle = 'rgba(255,214,58,0.7)'; g.fillRect(-w / 2 + 30, yy - 26, w - 60, 52); } g.fillStyle = '#222838'; g.font = '700 34px Montserrat'; g.fillText(ln, -w / 2 + 40, yy); });
  g.restore();
}
