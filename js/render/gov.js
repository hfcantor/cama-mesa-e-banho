// Desenhos de palito para o EP06 (IA governando o Brasil): gabinete, robô, balões e objetos.
import { INK, W, H, jit, lerp, clamp01, poly, circ, ell, seg, stroke, TAU } from './toon.js';

export function drawOffice(g, t, { flag = true } = {}) {
  const wall = g.createLinearGradient(0, 0, 0, 1250); wall.addColorStop(0, '#f6e9c8'); wall.addColorStop(1, '#e3cc98');
  g.fillStyle = wall; g.fillRect(0, 0, W, 1250);
  g.fillStyle = '#c9a272'; g.fillRect(0, 1010, W, 240); g.beginPath(); g.moveTo(0, 1010); g.lineTo(W, 1010); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  // janela com a cidade
  g.save(); g.beginPath(); g.rect(90, 200, 360, 420); g.clip();
  const sk = g.createLinearGradient(0, 200, 0, 620); sk.addColorStop(0, '#7ec8ee'); sk.addColorStop(1, '#d9f0f5'); g.fillStyle = sk; g.fillRect(90, 200, 360, 420);
  [[110, 120, 330], [190, 90, 280], [260, 130, 360], [350, 100, 300]].forEach(([x, w, y], i) => { g.fillStyle = i % 2 ? '#8aa0b4' : '#6e8498'; g.fillRect(x, y + 120, w, 400); g.lineWidth = 6; g.strokeStyle = INK; g.strokeRect(x, y + 120, w, 400); });
  g.restore(); g.lineWidth = 12; g.strokeStyle = INK; g.strokeRect(90, 200, 360, 420); seg(g, 270, 200, 270, 620, 8); seg(g, 90, 410, 450, 410, 8);
  if (flag) { // bandeira do Brasil
    seg(g, 960, 300, 960, 1010, 12);
    g.save(); g.translate(960, 330); g.scale(-1, 1);
    const fw = 360, fh = 250, wave = Math.sin(t * 2) * 6;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(fw / 2, wave, fw, 0); g.lineTo(fw, fh); g.quadraticCurveTo(fw / 2, fh + wave, 0, fh); g.closePath(); g.fillStyle = '#2e9e3f'; g.fill(); stroke(g, 8);
    poly(g, [[fw / 2, 26 + wave], [fw - 36, fh / 2 + wave / 2], [fw / 2, fh - 26 + wave], [36, fh / 2 + wave / 2]], '#ffd23f', 6);
    circ(g, fw / 2, fh / 2 + wave / 2, 52, '#2a4aa0', 6);
    g.beginPath(); g.moveTo(fw / 2 - 52, fh / 2 + wave / 2 + 4); g.quadraticCurveTo(fw / 2, fh / 2 - 12 + wave / 2, fw / 2 + 52, fh / 2 + 18 + wave / 2); g.lineWidth = 8; g.strokeStyle = '#fff'; g.stroke();
    g.restore();
  }
  // piso de madeira
  g.fillStyle = '#a87a4a'; g.fillRect(0, 1250, W, H - 1250); g.beginPath(); g.moveTo(0, 1250); g.lineTo(W, 1250); g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
  for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(0, 1320 + i * 66); g.lineTo(W, 1320 + i * 66); g.lineWidth = 4; g.strokeStyle = 'rgba(40,20,5,0.35)'; g.stroke(); }
  for (let i = 0; i < 14; i++) { const x = (i * 97 + (i % 3) * 30) % W, y = 1330 + (i % 8) * 66; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 66); g.lineWidth = 4; g.strokeStyle = 'rgba(40,20,5,0.3)'; g.stroke(); }
}

// robô de palito: cabeça com tela, antena, corpo e membros finos
export function drawRobot(g, t, { x, y, s = 1, flip = 1, mood = 'normal', armL = 0.3, armR = 0.3, talk = 0, extraArms = 0, tint = '#e9eef3', spin = 0 }) {
  g.save(); g.translate(x, y); g.scale(s * flip, s);
  const legLen = 210, torsoH = 190;
  [[-34, 0.07], [34, -0.07]].forEach(([lx, a]) => { const fx = lx + Math.sin(a) * legLen, fy = -legLen + Math.cos(a) * legLen; seg(g, lx, -legLen, fx, fy, 12); ell(g, fx + 12, fy - 4, 34, 13, INK, 0); });
  const hipY = -legLen + Math.sin(t * 2) * 2;
  // corpo
  g.beginPath(); g.roundRect(-82, hipY - torsoH, 164, torsoH, 28); g.fillStyle = '#c3ced8'; g.fill(); stroke(g, 8);
  g.beginPath(); g.roundRect(-46, hipY - torsoH + 36, 92, 70, 12); g.fillStyle = '#0e2a3a'; g.fill(); stroke(g, 6);
  ['#ff5a5a', '#ffd23f', '#5aff8a'].forEach((c, i) => circ(g, -26 + i * 26, hipY - torsoH + 70, 8 + (Math.sin(t * 6 + i) > 0.5 ? 2 : 0), c, 0));
  // braços (extras para o robô "multitarefa")
  const arms = [[-1, armL], [1, armR]];
  for (let i = 0; i < extraArms; i++) arms.push([i % 2 ? 1 : -1, 0.6 + i * 0.35 + Math.sin(t * 5 + i) * 0.15]);
  arms.forEach(([side, a], i) => {
    const sx = side * 82, sy = hipY - torsoH + 50 + (i > 1 ? (i - 1) * 22 : 0);
    const ex = sx + side * Math.sin(a) * 200, ey = sy + Math.cos(a) * 200;
    seg(g, sx, sy, ex, ey, 11, (sx + ex) / 2 + side * 10, (sy + ey) / 2); circ(g, ex, ey, 16, '#c3ced8', 6);
  });
  // cabeça
  const hy = hipY - torsoH - 100;
  seg(g, 0, hipY - torsoH, 0, hy + 70, 14);
  g.beginPath(); g.roundRect(-110, hy - 70, 220, 150, 36); g.fillStyle = tint; g.fill(); stroke(g, 8);
  seg(g, 0, hy - 70, 0, hy - 118, 8); circ(g, 0, hy - 128, 14, Math.sin(t * 5) > 0 ? '#ff5a5a' : '#8a2a2a', 6);
  circ(g, -118, hy, 14, '#c3ced8', 6); circ(g, 118, hy, 14, '#c3ced8', 6);
  g.beginPath(); g.roundRect(-88, hy - 50, 176, 106, 22); g.fillStyle = '#0e2a3a'; g.fill(); stroke(g, 6);
  g.strokeStyle = '#5fe3ff'; g.fillStyle = '#5fe3ff'; g.lineWidth = 9; g.lineCap = 'round';
  const ey = hy - 8;
  if (mood === 'happy') { [-34, 34].forEach((ex) => { g.beginPath(); g.arc(ex, ey + 8, 18, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }); }
  else if (mood === 'error') { [-34, 34].forEach((ex) => { g.beginPath(); g.moveTo(ex - 14, ey - 14); g.lineTo(ex + 14, ey + 14); g.moveTo(ex + 14, ey - 14); g.lineTo(ex - 14, ey + 14); g.strokeStyle = '#ff6a6a'; g.stroke(); }); }
  else if (mood === 'loading') { g.beginPath(); g.arc(0, ey + 4, 24, t * 6, t * 6 + 4.2); g.stroke(); }
  else if (mood === 'think') { [-26, 0, 26].forEach((ex, i) => { g.globalAlpha = 0.4 + 0.6 * (Math.sin(t * 5 - i) > 0 ? 1 : 0.3); g.beginPath(); g.arc(ex, ey + 4, 9, 0, TAU); g.fill(); }); g.globalAlpha = 1; }
  else { [-34, 34].forEach((ex) => { g.beginPath(); g.arc(ex, ey, 15, 0, TAU); g.fill(); }); }
  if (mood !== 'loading' && mood !== 'think') { g.beginPath(); g.moveTo(-30, hy + 30); g.lineTo(30, hy + 30 + (talk ? Math.sin(t * 16) * 6 : 0)); g.lineWidth = 8; g.strokeStyle = mood === 'error' ? '#ff6a6a' : '#5fe3ff'; g.stroke(); }
  g.restore();
}

// balão de fala com quebra de linha
export function drawBubble(g, x, y, text, { w = 520, size = 38, tail = 'down', tx = 0, color = '#ffffff', fg = INK, alpha = 1 } = {}) {
  if (alpha <= 0.01) return;
  g.save(); g.globalAlpha = alpha; g.font = `800 ${size}px Montserrat, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const words = text.split(' '), lines = []; let cur = '';
  words.forEach((wd) => { const test = cur ? cur + ' ' + wd : wd; if (g.measureText(test).width > w - 60 && cur) { lines.push(cur); cur = wd; } else cur = test; });
  lines.push(cur);
  const lh = size * 1.25, h = lines.length * lh + 50;
  g.translate(x, y);
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 36); g.fillStyle = color; g.fill(); stroke(g, 8);
  if (tail === 'down') poly(g, [[tx - 24, h / 2 - 4], [tx + 20, h / 2 - 4], [tx + 40, h / 2 + 50]], color, 8, false);
  g.fillStyle = color; if (tail === 'down') g.fillRect(tx - 22, h / 2 - 10, 40, 14);
  g.fillStyle = fg; lines.forEach((ln, i) => g.fillText(ln, 0, -h / 2 + 25 + lh * (i + 0.5)));
  g.restore();
}

export function drawPaper(g, x, y, w, h, title = '', rot = 0, color = '#fffdf2') {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.fillStyle = color; g.fill(); stroke(g, 6);
  if (title) { g.fillStyle = INK; g.font = `900 ${Math.min(34, w / 3)}px Montserrat, Arial Black, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, 0, -h / 2 + Math.min(40, h / 3)); }
  for (let i = 0; i < Math.floor((h - 70) / 26); i++) { g.beginPath(); g.moveTo(-w / 2 + 14, -h / 2 + 64 + i * 26); g.lineTo(w / 2 - 14 - (i % 3) * 20, -h / 2 + 64 + i * 26); g.lineWidth = 4; g.strokeStyle = 'rgba(40,30,20,0.5)'; g.stroke(); }
  g.restore();
}

export function drawBookCF(g, x, y, s = 1, open = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.roundRect(-210, -280, 420, 560, 22); g.fillStyle = '#1f5a3a'; g.fill(); stroke(g, 10);
  g.beginPath(); g.roundRect(-186, -256, 372, 512, 14); g.strokeStyle = '#f2c14e'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#f2c14e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 46px Montserrat, Arial Black, sans-serif'; g.fillText('CONSTITUIÇÃO', 0, -120);
  g.font = '800 30px Montserrat, sans-serif'; g.fillText('DA REPÚBLICA', 0, -64); g.font = '800 25px Montserrat, sans-serif'; g.fillText('FEDERATIVA DO BRASIL', 0, -26);
  g.font = '900 90px Anton, Impact, sans-serif'; g.fillText('1988', 0, 110);
  circ(g, 0, 200, 34, '#2a4aa0', 6); poly(g, [[0, 176], [30, 200], [0, 224], [-30, 200]], '#ffd23f', 4);
  g.restore(); void open;
}

export function drawCard(g, x, y, w, h, label, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 18); g.fillStyle = '#e8f2ff'; g.fill(); stroke(g, 7);
  g.fillStyle = INK; g.font = '900 34px Montserrat, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, -h / 2 + 34);
  circ(g, -w / 2 + 60, 14, 28, '#c3ced8', 5); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-w / 2 + 110, -2 + i * 26); g.lineTo(w / 2 - 24, -2 + i * 26); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
  g.restore();
}
