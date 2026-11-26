// Overlays dos episódios de "fatos reais": título de abertura do tema, número grande e faixa de selo.
import { W, H, clamp01, ease } from './stage.js';
import { FONT_TITLE, FONT_SUB, drawEmblem, drawBrandText } from './overlays.js';

const spring = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; return 1 - Math.exp(-6 * k) * Math.cos(k * 10); };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// Abertura: logo da série + selo "FATO REAL" + título do tema (1–2 linhas) + subtítulo
export function drawFactTitle(g, lt, dur, t, { kicker = 'FATO REAL', title = ['TEMA'], sub = '' } = {}) {
  const out = clamp01((dur - lt) / 0.6); if (out <= 0) return;
  g.save(); g.globalAlpha = out;
  drawEmblem(g, W / 2, 230, 78 * (0.6 + 0.4 * spring(clamp01(lt / 0.7))), t, clamp01(lt / 0.4));
  drawBrandText(g, W / 2, 385, 74, clamp01((lt - 0.2) / 0.5), 0.3);
  // selo
  const kk = spring(clamp01((lt - 0.3) / 0.4));
  g.save(); g.translate(W / 2, 560); g.scale(kk, kk); g.font = `900 46px ${FONT_SUB}`; g.letterSpacing = '8px';
  const kw = g.measureText(kicker).width + 90; rr(g, -kw / 2, -42, kw, 84, 42); g.fillStyle = '#e8453c'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(kicker, 4, 3); g.restore();
  // título
  const n = title.length, size = n > 1 ? 230 : 290;
  title.forEach((line, i) => {
    const k = spring(clamp01((lt - 0.45 - i * 0.18) / 0.5));
    g.save(); g.translate(W / 2, 760 + i * size * 0.95 + (1 - ease.out(clamp01((lt - 0.45 - i * 0.18) / 0.5))) * -140); g.scale(0.5 + 0.5 * k, 0.5 + 0.5 * k); g.globalAlpha = out * clamp01(k * 2);
    g.font = `${size}px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '4px';
    let fs = size; while (g.measureText(line).width > W - 90 && fs > 60) { fs -= 8; g.font = `${fs}px ${FONT_TITLE}`; }
    g.lineWidth = 16; g.strokeStyle = '#1a0d02'; g.lineJoin = 'round'; g.strokeText(line, 0, 0);
    const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.45, '#FFE27A'); gr.addColorStop(1, '#FF9A1F');
    g.shadowColor = '#FFAA00'; g.shadowBlur = 36 + 16 * Math.sin(t * 4); g.fillStyle = gr; g.fillText(line, 0, 0); g.restore();
  });
  if (sub) {
    const k = clamp01((lt - 0.9) / 0.4);
    g.save(); g.globalAlpha = out * k; g.font = `800 52px ${FONT_SUB}`; g.letterSpacing = '4px'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const sw = g.measureText(sub).width + 70, y = 760 + n * size * 0.95 + 20; rr(g, W / 2 - sw / 2, y - 48, sw, 96, 48); g.fillStyle = 'rgba(8,12,34,0.82)'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#FFC83D'; g.stroke();
    g.fillStyle = '#fff'; g.fillText(sub, W / 2, y + 4); g.restore();
  }
  g.restore();
}

// Número grande com contagem: label pequeno em cima, valor enorme, unidade embaixo
export function drawBigStat(g, lt, { value = '0', label = '', unit = '', y = 560, color = '#FFC83D', danger = 0, scale = 1 } = {}) {
  if (lt < 0) return;
  const k = spring(clamp01(lt / 0.35)), a = clamp01(lt / 0.15);
  g.save(); g.globalAlpha = a; g.translate(W / 2, y); g.scale(k * scale, k * scale); g.textAlign = 'center'; g.textBaseline = 'middle';
  if (label) { g.font = `800 40px ${FONT_SUB}`; g.letterSpacing = '6px'; g.fillStyle = 'rgba(255,255,255,0.92)'; g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = 12; }
  g.letterSpacing = '4px'; let fs = 230; g.font = `${fs}px ${FONT_TITLE}`; while (g.measureText(value).width > W - 110 && fs > 70) { fs -= 8; g.font = `${fs}px ${FONT_TITLE}`; }
  if (label) { g.save(); g.font = `800 40px ${FONT_SUB}`; g.letterSpacing = '6px'; g.fillStyle = 'rgba(255,255,255,0.92)'; g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = 12; g.fillText(label, 0, -fs * 0.5 - 36); g.restore(); }
  g.lineWidth = 18; g.strokeStyle = 'rgba(10,6,0,0.92)'; g.lineJoin = 'round'; g.strokeText(value, 0, 0);
  const gr = g.createLinearGradient(0, -fs / 2, 0, fs / 2); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, danger > 0 ? '#FF9A8A' : color); gr.addColorStop(1, danger > 0 ? '#E0301A' : '#E08A10');
  g.shadowColor = danger > 0 ? '#ff3030' : color; g.shadowBlur = 30 + 20 * danger; g.fillStyle = gr; g.fillText(value, 0, 0); g.shadowBlur = 0;
  if (unit) { g.font = `800 50px ${FONT_SUB}`; g.letterSpacing = '5px'; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = 12; g.fillText(unit, 0, fs * 0.5 + 40); }
  g.restore();
}

// faixa com texto (ex.: "FIM DE UMA ERA") que desliza
export function drawBanner(g, lt, text, { y = 330, color = '#e8453c', size = 54 } = {}) {
  if (lt < 0) return;
  const k = ease.out(clamp01(lt / 0.3));
  g.save(); g.translate((1 - k) * -W, 0); g.font = `900 ${size}px ${FONT_SUB}`; g.letterSpacing = '5px'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(text).width + 120; rr(g, W / 2 - w / 2, y - 55, w, 110, 20); g.fillStyle = color; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#fff'; g.fillText(text, W / 2, y + 4); g.restore();
}
