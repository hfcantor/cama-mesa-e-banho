// Desenhos de palito para o EP05 (Apocalipse): cavaleiros, anjo com trombeta, besta e cidade.
// Pessoas sagradas NÃO têm rosto: aparecem como silhueta luminosa.
import { INK, jit, lerp, clamp01, poly, circ, ell, seg, stroke, TAU } from './toon.js';

const GOLD = '#f2c14e';

export function drawHorse(g, t, { x, y, s = 1, color = '#f4f4ee', rider = 'none', speed = 1, flip = 1, glow = 0 }) {
  g.save(); g.translate(x, y); g.scale(s * flip, s);
  if (glow > 0) { const gr = g.createRadialGradient(0, -250, 20, 0, -250, 420); gr.addColorStop(0, `rgba(255,245,190,${0.85 * glow})`); gr.addColorStop(1, 'rgba(255,245,190,0)'); g.fillStyle = gr; g.fillRect(-500, -700, 1000, 900); }
  const ph = t * 9 * speed;
  // pernas
  [[-95, 0], [-55, 1], [70, 2], [112, 3]].forEach(([lx, i]) => {
    const a = Math.sin(ph + i * 1.6) * 0.55, fx = lx + Math.sin(a) * 150, fy = -140 + Math.cos(a) * 150;
    seg(g, lx, -150, fx, fy, 13, lx + Math.sin(a) * 60 + 12, -85); ell(g, fx + 6, fy, 18, 9, INK, 0);
  });
  // rabo
  g.beginPath(); g.moveTo(125, -220); g.quadraticCurveTo(215 + Math.sin(ph) * 16, -235, 235, -120); g.quadraticCurveTo(190, -185, 118, -190); g.closePath(); g.fillStyle = color; g.fill(); stroke(g, 7);
  ell(g, 0, -200, 135, 62, color, 8);
  poly(g, [[-92, -238], [-148, -350], [-205, -332], [-150, -212]], color, 8);
  ell(g, -232, -336, 60, 30, color, 8, 0.45);
  poly(g, [[-178, -372], [-166, -410], [-150, -366]], color, 6);
  circ(g, -238, -346, 7, INK, 0);
  for (let i = 0; i < 5; i++) seg(g, -112 - i * 8, -250 - i * 22, -128 - i * 8, -250 - i * 22 + 18, 6);
  // cavaleiro
  g.save(); g.translate(8, -262);
  if (rider !== 'none') {
    const death = rider === 'death';
    seg(g, 0, 0, 0, -92, 13);
    seg(g, 0, -80, -40, -52, 9); seg(g, 0, -80, 44, -64, 9);
    circ(g, 0, -126, 36, death ? '#c9d4b0' : '#fdfaf3', 7);
    if (death) { ell(g, -13, -130, 9, 13, INK, 0); ell(g, 13, -130, 9, 13, INK, 0); seg(g, -14, -108, 14, -108, 5); poly(g, [[-42, -140], [0, -190], [42, -140], [34, -100], [-34, -100]], 'rgba(30,30,40,0.55)', 6); }
    if (rider === 'light') { // silhueta luminosa, sem rosto, com muitas coroas (Ap 19:12)
      const gl = g.createRadialGradient(0, -100, 10, 0, -100, 150); gl.addColorStop(0, 'rgba(255,255,255,0.95)'); gl.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gl; g.fillRect(-170, -260, 340, 340);
      circ(g, 0, -126, 36, '#ffffff', 7);
      [-24, 0, 24].forEach((dx, i) => poly(g, [[dx - 12, -154 - i % 2 * 8], [dx, -186 - i % 2 * 8], [dx + 12, -154 - i % 2 * 8]], GOLD, 4));
    }
    if (rider === 'bow') {
      poly(g, [[-26, -154], [-18, -184], [-6, -160], [0, -190], [6, -160], [18, -184], [26, -154]], GOLD, 5);
      g.beginPath(); g.moveTo(-78, -150); g.quadraticCurveTo(-110, -90, -78, -30); stroke(g, 7); seg(g, -78, -150, -78, -30, 3);
    }
    if (rider === 'sword') { seg(g, 46, -64, 96, -200, 9); seg(g, 70, -150, 112, -132, 9); seg(g, 96, -200, 104, -226, 6); }
    if (rider === 'scales') {
      seg(g, 46, -64, 46, -150, 7); seg(g, 6, -150, 86, -150, 7);
      [[6, 0], [86, 1]].forEach(([px, i]) => { seg(g, px, -150, px - 18, -112 + i * 6, 3); seg(g, px, -150, px + 18, -112 + i * 6, 3); ell(g, px, -108 + i * 6, 24, 7, GOLD, 5); });
    }
  }
  g.restore(); g.restore();
}

export function drawAngel(g, t, x, y, s = 1, blow = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const fl = Math.sin(t * 4) * 0.12;
  [-1, 1].forEach((sd) => { g.save(); g.scale(sd, 1); g.rotate(fl * sd * -1);
    for (let i = 0; i < 4; i++) poly(g, [[40, -330], [140 + i * 40, -400 + i * 32 - 40], [120 + i * 34, -330 + i * 26], [40, -300]], '#ffffff', 6);
    g.restore(); });
  poly(g, [[-70, -250], [70, -250], [105, 0], [-105, 0]], '#ffffff', 8);
  seg(g, -90, -90, 90, -90, 4, 0, -80);
  circ(g, 0, -320, 62, '#fdfaf3', 8);
  ell(g, 0, -418, 50, 14, null, 9); g.strokeStyle = GOLD; g.lineWidth = 9; g.beginPath(); g.ellipse(0, -418, 50, 14, 0, 0, TAU); g.stroke();
  circ(g, -20, -322, 6, INK, 0); circ(g, 20, -322, 6, INK, 0);
  g.beginPath(); g.ellipse(0, -296 + blow * 4, 11, 5 + blow * 9, 0, 0, TAU); g.fillStyle = '#6a1f18'; g.fill();
  seg(g, 60, -230, 130, -300, 11);
  poly(g, [[110, -318], [310, -392], [310, -282], [110, -300]], GOLD, 8);
  if (blow > 0) for (let i = 0; i < 3; i++) { const u = ((t * 1.4 + i / 3) % 1); g.globalAlpha = (1 - u) * blow; g.beginPath(); g.arc(310, -337, 40 + u * 220, -0.7, 0.7); g.lineWidth = 8; g.strokeStyle = '#ffe9a0'; g.stroke(); }
  g.globalAlpha = 1; g.restore();
}

// besta do mar: sete cabeças e dez chifres (Ap 13:1)
export function drawBeast(g, t, x, y, s = 1, rise = 1) {
  g.save(); g.translate(x, y + (1 - rise) * 300); g.scale(s, s);
  ell(g, 0, 0, 330, 130, '#4a2a3a', 9);
  const horns = [2, 2, 2, 1, 1, 1, 1];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.12 + i * 0.1) - 0.1, len = 250 + (i % 2) * 40;
    const hx = Math.cos(a) * len * 0.62 + (i - 3) * 6, hy = Math.sin(a) * len - 30 + Math.sin(t * 2 + i) * 8;
    seg(g, (i - 3) * 38, -40, hx, hy + 40, 22, (i - 3) * 38, hy + 100);
    circ(g, hx, hy, 52, '#6a3a4c', 8);
    for (let k = 0; k < horns[i]; k++) { const hxo = (horns[i] === 2 ? (k ? 24 : -24) : 0); poly(g, [[hx + hxo - 12, hy - 40], [hx + hxo + (k ? 14 : -14), hy - 100], [hx + hxo + 12, hy - 40]], '#e8d9b0', 6); }
    circ(g, hx - 17, hy - 4, 7, '#ffe14a', 0); circ(g, hx + 17, hy - 4, 7, '#ffe14a', 0);
    seg(g, hx - 22, hy + 22, hx + 22, hy + 22, 6);
  }
  g.restore();
}

export function drawBowl(g, x, y, s = 1, tilt = 0, color = null, t = 0) {
  g.save(); g.translate(x, y); g.rotate(tilt); g.scale(s, s);
  g.beginPath(); g.moveTo(-60, -20); g.quadraticCurveTo(0, 90, 60, -20); g.closePath(); g.fillStyle = GOLD; g.fill(); stroke(g, 8);
  ell(g, 0, -20, 60, 12, '#ffe9a0', 6);
  g.restore();
  if (color && tilt) for (let i = 0; i < 8; i++) { const u = ((t * 1.6 + i / 8) % 1); g.fillStyle = color; g.beginPath(); g.ellipse(x - 70 * s - u * 30, y - 10 + u * u * 520 * s, 7, 11, 0, 0, TAU); g.fill(); }
}

// Nova Jerusalém: muralha dourada, portas, rio e árvore da vida (Ap 21-22)
export function drawCity(g, t, x, y, s = 1, light = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const gr = g.createRadialGradient(0, -260, 30, 0, -260, 760); gr.addColorStop(0, `rgba(255,240,170,${0.9 * light})`); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.fillRect(-800, -1000, 1600, 1300);
  for (let i = 0; i < 14; i++) { const a = -Math.PI + (i / 13) * Math.PI; g.beginPath(); g.moveTo(0, -260); g.lineTo(Math.cos(a) * 900, -260 + Math.sin(a) * 900); g.strokeStyle = `rgba(255,240,170,${0.18 * light})`; g.lineWidth = 26; g.stroke(); }
  poly(g, [[-340, 0], [340, 0], [340, -330], [-340, -330]], '#f6d46a', 9);
  for (let i = -3; i <= 3; i++) poly(g, [[i * 96 - 28, -330], [i * 96 - 28, -372], [i * 96 + 28, -372], [i * 96 + 28, -330]], '#f6d46a', 6);
  [-200, 0, 200].forEach((gx) => { g.beginPath(); g.moveTo(gx - 46, 0); g.lineTo(gx - 46, -110); g.arc(gx, -110, 46, Math.PI, 0); g.lineTo(gx + 46, 0); g.closePath(); g.fillStyle = '#fff6cf'; g.fill(); stroke(g, 7); circ(g, gx, -150, 10, '#ffffff', 5); });
  poly(g, [[-70, -330], [70, -330], [70, -560], [0, -640], [-70, -560]], '#fbe28a', 8);
  [[-210, -440], [210, -440]].forEach(([tx, ty]) => poly(g, [[tx - 46, -330], [tx + 46, -330], [tx + 46, ty], [tx, ty - 60], [tx - 46, ty]], '#fbe28a', 7));
  g.restore();
}
export function drawTree(g, t, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  seg(g, 0, 0, 0, -220, 34); poly(g, [[-18, 0], [18, 0], [10, -220], [-10, -220]], '#8a5a30', 7);
  [[-70, -270, 80], [70, -270, 80], [0, -340, 96], [-110, -220, 60], [110, -220, 60]].forEach(([cx, cy, r]) => circ(g, cx, cy, r, '#58b24a', 8));
  [[-60, -290], [60, -250], [20, -350], [-100, -230], [100, -210]].forEach(([fx, fy]) => circ(g, fx, fy, 14, '#ffc83a', 5));
  g.restore();
}
