// Overlays 2D do EP02 (estilo dos vídeos de referência): carimbo de nível,
// contador LED, selos "CÂMERA LENTA"/"REBOBINANDO", etiquetas com ponto
// colorido, ✅/❌, balões de pensamento, checklist e texto de impacto.
// Tudo em modo imediato (função do tempo), igual ao overlays.js.
import { W, H, clamp01, ease } from './stage.js';
import { FONT_TITLE, FONT_SUB, COLORS } from './overlays.js';

const spring = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; return 1 - Math.exp(-6 * k) * Math.cos(k * 10); };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// ---------------- carimbo: "NÍVEL 1 · 1 SEMANA" ----------------
// lt = segundos desde que o carimbo apareceu. Cai de cima, bate e "pula".
export function drawLevelStamp(g, level, sub, lt, { y = 470, alpha = 1, color = '#FFC83D' } = {}) {
  if (lt < 0 || alpha <= 0) return;
  const fall = clamp01(lt / 0.16);
  const sc = lt < 0.16 ? 2.6 - 1.6 * ease.in(fall) : 1 + Math.exp(-lt * 9) * Math.sin(lt * 26) * 0.1;
  const a = alpha * clamp01(lt / 0.06);
  g.save();
  g.globalAlpha = a;
  g.translate(W / 2, y); g.rotate(-0.06); g.scale(sc, sc);
  // faixa escura
  const pw = 900, ph = 230;
  rr(g, -pw / 2, -ph / 2, pw, ph, 38);
  g.fillStyle = 'rgba(8,12,34,0.92)'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.fill();
  g.shadowBlur = 0; g.lineWidth = 8; g.strokeStyle = color; g.stroke();
  rr(g, -pw / 2 + 16, -ph / 2 + 16, pw - 32, ph - 32, 26); g.lineWidth = 2; g.strokeStyle = 'rgba(255,200,61,0.35)'; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `150px ${FONT_TITLE}`; g.letterSpacing = '6px';
  g.lineWidth = 12; g.strokeStyle = '#1a0d02'; g.lineJoin = 'round';
  g.strokeText(level, 0, -22);
  const gr = g.createLinearGradient(0, -90, 0, 50); gr.addColorStop(0, '#FFF2B0'); gr.addColorStop(0.5, color); gr.addColorStop(1, '#E08A10');
  g.fillStyle = gr; g.shadowColor = color; g.shadowBlur = 24; g.fillText(level, 0, -22);
  g.shadowBlur = 0; g.letterSpacing = '4px';
  g.font = `900 56px ${FONT_SUB}`; g.fillStyle = '#fff'; g.fillText(sub, 0, 70);
  g.restore();
  // onda de impacto
  if (lt > 0.14 && lt < 0.55) {
    const k = (lt - 0.14) / 0.41;
    g.save(); g.globalAlpha = (1 - k) * 0.5 * alpha; g.strokeStyle = '#fff'; g.lineWidth = 10 * (1 - k);
    g.beginPath(); g.ellipse(W / 2, y, 380 + k * 420, 120 + k * 160, -0.06, 0, 7); g.stroke(); g.restore();
  }
}

// ---------------- contador LED (painel de pontos laranja) ----------------
export function drawLedPanel(g, label, value, x, y, { alpha = 1, scale = 1, color = '#FFA22E', danger = 0, w = 760 } = {}) {
  if (alpha <= 0) return;
  g.save();
  g.globalAlpha = alpha; g.translate(x, y); g.scale(scale, scale);
  // placa branca com o rótulo (como a placa "SEM FAZER NADA HÁ")
  rr(g, -w / 2, -150, w, 100, 14); g.fillStyle = '#f6f1e6'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 24; g.fill(); g.shadowBlur = 0;
  g.lineWidth = 6; g.strokeStyle = '#d63a30'; g.stroke();
  g.fillStyle = '#1d1d24'; g.font = `800 46px ${FONT_SUB}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '3px';
  g.fillText(label, 0, -98);
  // painel LED
  rr(g, -w / 2, -50, w, 190, 18); g.fillStyle = '#16120e'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#3a342c'; g.stroke();
  const col = danger > 0 ? `rgb(255,${Math.round(162 - danger * 110)},${Math.round(46 - danger * 20)})` : color;
  g.font = `150px ${FONT_TITLE}`; g.letterSpacing = '8px';
  g.shadowColor = col; g.shadowBlur = 28; g.fillStyle = col; g.fillText(value, 0, 52);
  g.shadowBlur = 0;
  // trama de pontos (efeito LED)
  g.save(); rr(g, -w / 2, -50, w, 190, 18); g.clip(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(0,0,0,0.55)';
  for (let yy = -50; yy < 140; yy += 8) g.fillRect(-w / 2, yy, w, 3);
  for (let xx = -w / 2; xx < w / 2; xx += 8) g.fillRect(xx, -50, 3, 190);
  g.restore();
  g.restore();
}

// ---------------- selos no canto: câmera lenta / rebobinando ----------------
export function drawSpeedBadge(g, text, kind = 'slow', { x = 60, y = 255, alpha = 1, t = 0 } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = alpha; g.translate(x, y);
  g.font = `900 38px ${FONT_SUB}`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const tw = g.measureText(text).width, pw = tw + 100, ph = 74;
  rr(g, 0, -ph / 2, pw, ph, 18); g.fillStyle = 'rgba(8,10,24,0.88)'; g.fill();
  g.lineWidth = 4; g.strokeStyle = kind === 'rew' ? '#5EC8FF' : '#FFC83D'; g.stroke();
  g.fillStyle = kind === 'rew' ? '#5EC8FF' : '#FFC83D';
  const px = 34, s = 15;
  g.beginPath();
  if (kind === 'rew') { g.moveTo(px + s, -s); g.lineTo(px, 0); g.lineTo(px + s, s); g.moveTo(px + s * 2, -s); g.lineTo(px + s, 0); g.lineTo(px + s * 2, s); }
  else { g.moveTo(px - 6, -s); g.lineTo(px + s, 0); g.lineTo(px - 6, s); }
  g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.fillText(text, 62, 3);
  g.restore();
}

// Chiado de TV de "rebobinando": linhas, aberração e brilho
export function drawRewindFx(g, t, alpha = 1) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = 0.28 * alpha; g.fillStyle = '#9fd6ff';
  const off = (t * 260) % 24;
  for (let y = -24 + off; y < H; y += 24) g.fillRect(0, y, W, 5);
  g.globalAlpha = 0.5 * alpha;
  const by = ((t * 700) % (H + 300)) - 150; const gr = g.createLinearGradient(0, by - 80, 0, by + 80);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, by - 80, W, 160);
  g.restore();
}

// ---------------- etiqueta branca com ponto colorido ----------------
export function drawTag(g, text, x, y, { dot = '#FF4D4D', alpha = 1, scale = 1, size = 34, sub = null } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = alpha; g.translate(x, y); g.scale(scale, scale);
  g.font = `900 ${size}px ${FONT_SUB}`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const tw = g.measureText(text).width;
  g.font = `700 ${size * 0.62}px ${FONT_SUB}`; const sw = sub ? g.measureText(sub).width : 0;
  const pw = Math.max(tw, sw) + size * 1.9, ph = sub ? size * 2.5 : size * 1.75;
  rr(g, -pw / 2, -ph / 2, pw, ph, ph / 2 > 40 ? 34 : ph / 2); g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 16; g.fill(); g.shadowBlur = 0;
  g.beginPath(); g.arc(-pw / 2 + size * 0.8, sub ? -size * 0.35 : 0, size * 0.22, 0, 7); g.fillStyle = dot; g.fill();
  g.fillStyle = '#16161e'; g.font = `900 ${size}px ${FONT_SUB}`; g.fillText(text, -pw / 2 + size * 1.25, sub ? -size * 0.35 : 2);
  if (sub) { g.font = `700 ${size * 0.62}px ${FONT_SUB}`; g.fillStyle = '#6a6a7a'; g.fillText(sub, -pw / 2 + size * 0.8, size * 0.55); }
  g.restore();
}

// ---------------- ✅ / ❌ ----------------
export function drawMark(g, kind, x, y, r = 70, alpha = 1, lt = 1) {
  if (alpha <= 0 || lt < 0) return;
  const s = spring(clamp01(lt / 0.35));
  g.save(); g.globalAlpha = alpha; g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = kind === 'ok' ? '#2fbf5b' : '#e03232'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fill();
  g.shadowBlur = 0; g.lineWidth = r * 0.12; g.strokeStyle = '#fff'; g.stroke();
  g.lineWidth = r * 0.24; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.beginPath();
  if (kind === 'ok') { g.moveTo(-r * 0.42, 0); g.lineTo(-r * 0.1, r * 0.34); g.lineTo(r * 0.46, -r * 0.32); }
  else { g.moveTo(-r * 0.32, -r * 0.32); g.lineTo(r * 0.32, r * 0.32); g.moveTo(r * 0.32, -r * 0.32); g.lineTo(-r * 0.32, r * 0.32); }
  g.stroke(); g.restore();
}

// ---------------- balão de pensamento com ícone ----------------
const ICONS = {
  fork(g, s) { // garfo e faca
    g.lineWidth = s * 0.07; g.lineCap = 'round'; g.strokeStyle = '#444';
    g.beginPath(); g.moveTo(-s * 0.2, -s * 0.5); g.lineTo(-s * 0.2, s * 0.5); g.moveTo(-s * 0.32, -s * 0.5); g.lineTo(-s * 0.32, -s * 0.12); g.moveTo(-s * 0.08, -s * 0.5); g.lineTo(-s * 0.08, -s * 0.12); g.moveTo(-s * 0.32, -s * 0.12); g.quadraticCurveTo(-s * 0.2, 0, -s * 0.08, -s * 0.12); g.stroke();
    g.beginPath(); g.moveTo(s * 0.22, s * 0.5); g.lineTo(s * 0.22, -s * 0.5); g.quadraticCurveTo(s * 0.45, -s * 0.3, s * 0.3, s * 0.05); g.stroke();
  },
  moon(g, s) { g.fillStyle = '#6b78d0'; g.beginPath(); g.arc(0, 0, s * 0.42, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 0.2, -s * 0.12, s * 0.36, 0, 7); g.fill(); },
  q(g, s) { g.fillStyle = '#444'; g.font = `900 ${s}px ${FONT_SUB}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 4); },
  heart(g, s) { g.fillStyle = '#ff4d6d'; g.beginPath(); g.moveTo(0, s * 0.3); g.bezierCurveTo(-s * 0.7, -s * 0.1, -s * 0.4, -s * 0.6, 0, -s * 0.25); g.bezierCurveTo(s * 0.4, -s * 0.6, s * 0.7, -s * 0.1, 0, s * 0.3); g.fill(); },
  bed(g, s) { g.fillStyle = '#8a5a3a'; g.fillRect(-s * 0.5, s * 0.05, s, s * 0.14); g.fillRect(-s * 0.5, -s * 0.25, s * 0.08, s * 0.44); g.fillStyle = '#4a86d6'; g.fillRect(-s * 0.4, -s * 0.06, s * 0.9, s * 0.12); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-s * 0.25, -s * 0.1, s * 0.16, s * 0.08, 0, 0, 7); g.fill(); },
  sneeze(g, s) { g.fillStyle = '#444'; g.font = `900 ${s * 0.5}px ${FONT_SUB}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('😤', 0, 0); },
};
export function drawThought(g, icon, x, y, { alpha = 1, scale = 1, lt = 1, tail = 'left' } = {}) {
  if (alpha <= 0 || lt < 0) return;
  const s = spring(clamp01(lt / 0.4));
  g.save(); g.globalAlpha = alpha; g.translate(x, y); g.scale(scale * s, scale * s);
  g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 20;
  [[0, 0, 105], [-90, 18, 62], [88, 14, 66], [-30, -62, 60], [40, -66, 56], [-50, 52, 56], [60, 54, 52]].forEach(([cx, cy, r]) => { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); });
  const d = tail === 'left' ? -1 : 1;
  g.beginPath(); g.arc(d * 90, 150, 22, 0, 7); g.fill(); g.beginPath(); g.arc(d * 120, 195, 13, 0, 7); g.fill();
  g.shadowBlur = 0; (ICONS[icon] || ICONS.q)(g, 120);
  g.restore();
}

// ---------------- texto de impacto (ATCHIM!, SPLASH!…) ----------------
export function drawPopText(g, text, x, y, lt, { color = '#FFC83D', size = 150, rot = -0.08, dur = 1.1 } = {}) {
  if (lt < 0 || lt > dur) return;
  const k = clamp01(lt / 0.22), out = clamp01((dur - lt) / 0.25);
  const s = spring(k) * (0.95 + 0.05 * Math.sin(lt * 20));
  g.save(); g.globalAlpha = out; g.translate(x, y); g.rotate(rot + Math.sin(lt * 25) * 0.015); g.scale(s, s);
  g.font = `${size}px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * 0.14; g.strokeStyle = '#1a0d02'; g.strokeText(text, 0, 0);
  g.lineWidth = size * 0.05; g.strokeStyle = '#fff'; g.strokeText(text, 0, 0);
  g.shadowColor = color; g.shadowBlur = 30; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}

// ---------------- checklist da solução ----------------
export function drawChecklist(g, items, t0, t, { y = 560 } = {}) {
  // items: [{ text, sub, at }] — `at` em segundos de episódio
  items.forEach((it, i) => {
    const lt = t - it.at;
    if (lt < -0.3) return;
    const k = clamp01((lt + 0.3) / 0.35);
    const yy = y + i * 190;
    g.save(); g.globalAlpha = k; g.translate(W / 2 + (1 - ease.out(k)) * 220, yy);
    const pw = 900, ph = 150;
    rr(g, -pw / 2, -ph / 2, pw, ph, 34); g.fillStyle = 'rgba(255,255,255,0.96)'; g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 26; g.fill(); g.shadowBlur = 0;
    g.fillStyle = '#16161e'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = `900 64px ${FONT_SUB}`; g.fillText(it.text, -pw / 2 + 60, it.sub ? -22 : 2);
    if (it.sub) { g.font = `700 36px ${FONT_SUB}`; g.fillStyle = '#6a6a7a'; g.fillText(it.sub, -pw / 2 + 62, 40); }
    g.restore();
    drawMark(g, 'ok', W / 2 + 360, yy, 52, k, lt - 0.15);
  });
  void t0;
}

// ---------------- chamada "like + seguir" com coração batendo ----------------
export function drawZzz(g, t, x, y, alpha = 1) {
  g.save(); g.font = `900 80px ${FONT_SUB}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 10;
  for (let i = 0; i < 3; i++) { const k = ((t * 0.55 + i / 3) % 1); g.globalAlpha = Math.sin(k * Math.PI) * alpha; g.fillText('z', x + k * 120 + i * 12, y - k * 260); }
  g.restore();
}

// Vinheta de clima (verde/doente ou quente) barata: gradiente radial pré-renderizado
const _vig = {};
export function drawMoodTint(g, rgb, strength) {
  if (strength <= 0.01) return;
  const key = rgb.join(',');
  if (!_vig[key]) {
    const c = document.createElement('canvas'); c.width = W / 6; c.height = H / 6; const v = c.getContext('2d');
    const gr = v.createRadialGradient(c.width / 2, c.height / 2, c.height * 0.12, c.width / 2, c.height / 2, c.height * 0.62);
    gr.addColorStop(0, `rgba(${key},0)`); gr.addColorStop(1, `rgba(${key},1)`); v.fillStyle = gr; v.fillRect(0, 0, c.width, c.height); _vig[key] = c;
  }
  g.save(); g.globalAlpha = Math.min(1, strength); g.drawImage(_vig[key], 0, 0, W, H); g.restore();
}

// Folha de calendário que voa de lado (transição entre níveis)
export function drawFlyingPage(g, num, lt, { label = 'DIA' } = {}) {
  if (lt < 0 || lt > 0.9) return;
  const k = lt / 0.9, e = ease.in(k);
  g.save(); g.translate(W / 2 + e * 900, H * 0.4 - Math.sin(k * 3.1) * 180); g.rotate(e * 1.8);
  const s = 1.2 - 0.4 * k;
  g.scale(s, s);
  rr(g, -220, -260, 440, 520, 26); g.fillStyle = '#fdfaf2'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 40; g.fill(); g.shadowBlur = 0;
  rr(g, -220, -260, 440, 110, 26); g.fillStyle = '#d63a30'; g.fill(); g.fillRect(-220, -190, 440, 40);
  g.fillStyle = '#fff'; g.font = `900 72px ${FONT_SUB}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, -205);
  g.fillStyle = '#2a2a2a'; g.font = `300px ${FONT_TITLE}`; g.fillText(String(num), 0, 50);
  g.restore();
}

// Lupa: escurece tudo fora do círculo e desenha aro, cabo e reflexo (zoom no tecido)
export function drawLens(g, cx, cy, r, t, alpha = 1) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = alpha;
  g.beginPath(); g.rect(0, 0, W, H); g.arc(cx, cy, r, 0, Math.PI * 2, true);
  g.fillStyle = 'rgba(4,4,10,0.92)'; g.fill('evenodd');
  g.beginPath(); g.arc(cx, cy, r, 0, 7); g.lineWidth = 30; g.strokeStyle = '#c99a2e'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 24; g.stroke();
  g.shadowBlur = 0; g.lineWidth = 6; g.strokeStyle = '#ffe9a8'; g.beginPath(); g.arc(cx, cy, r - 12, 0, 7); g.stroke();
  // cabo
  g.save(); g.translate(cx + r * 0.72, cy + r * 0.72); g.rotate(Math.PI / 4);
  rr(g, r * 0.12, -26, r * 0.62, 52, 26); g.fillStyle = '#5a3a22'; g.fill(); g.restore();
  // reflexo
  g.globalAlpha = alpha * 0.35; g.strokeStyle = '#fff'; g.lineWidth = 18; g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cy, r * 0.8, Math.PI * 1.1, Math.PI * 1.35); g.stroke();
  g.restore();
}

export { COLORS };
