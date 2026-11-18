// Camada 2D: legendas sincronizadas, identidade visual da série, chamadas
// para ação, títulos e indicadores. Tudo em modo imediato (função do tempo).
import { W, H, clamp01, ease } from './stage.js';
import { SERIES } from '../series.js';

export const FONT_TITLE = 'Anton, Impact, "Arial Black", sans-serif';
export const FONT_SUB = 'Montserrat, "Arial Black", Arial, sans-serif';
export const COLORS = { gold: '#FFC83D', red: '#FF4D4D', blue: '#5EC8FF', green: '#6BE37A', orange: '#FF8A3D', white: '#FFFFFF' };
const CURRENT = '#FFE14D';

const spring = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; return 1 - Math.exp(-6 * k) * Math.cos(k * 10); };

// ---------------- LEGENDAS ----------------
const SUB_Y = 1235, SUB_SIZE = 82, SUB_MAXW = 900;
export function drawSubtitles(g, timeline, t) {
  for (const L of timeline.lines) {
    if (t < L.start - 0.2 || t > L.end + 0.5) continue;
    for (const ch of L.chunks) {
      if (t < ch.start || t >= ch.end) continue;
      drawChunk(g, ch, t);
    }
  }
}

function drawChunk(g, ch, t) {
  g.save();
  g.font = `900 ${SUB_SIZE}px ${FONT_SUB}`;
  g.textBaseline = 'middle';
  const words = ch.words.map(w => ({ ...w, txt: w.w.toUpperCase() }));
  const space = SUB_SIZE * 0.34;
  // quebra em linhas
  const rows = [[]];
  let rw = 0;
  words.forEach(w => {
    w.width = g.measureText(w.txt).width * (w.color ? 1.05 : 1);
    if (rows[rows.length - 1].length && rw + w.width > SUB_MAXW) { rows.push([]); rw = 0; }
    rows[rows.length - 1].push(w); rw += w.width + space;
  });
  const lh = SUB_SIZE * 1.12;
  const fadeOut = clamp01((ch.end - t) / 0.12);
  rows.forEach((row, ri) => {
    const tw = row.reduce((a, w) => a + w.width, 0) + space * (row.length - 1);
    let x = W / 2 - tw / 2;
    const y = SUB_Y + (ri - (rows.length - 1) / 2) * lh;
    row.forEach(w => {
      const since = t - w.start;
      if (since >= -0.02) {
        const k = clamp01(since / 0.16);
        const pop = 0.6 + 0.4 * spring(k);
        const speaking = t >= w.start && t <= w.end + 0.05;
        const cx = x + w.width / 2;
        g.save();
        g.translate(cx, y + (1 - ease.out(k)) * 18);
        const sc = Math.min(pop, 1.04) * (w.color ? 1.04 : 1);
        g.scale(sc, sc);
        if (w.color && speaking) g.rotate(Math.sin(since * 18) * 0.025);
        g.globalAlpha = clamp01(k * 3) * fadeOut;
        g.textAlign = 'center';
        g.lineJoin = 'round';
        g.lineWidth = 15;
        g.strokeStyle = 'rgba(0,0,0,0.92)';
        g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
        g.strokeText(w.txt, 0, 0);
        g.shadowColor = 'transparent';
        const col = w.color ? (COLORS[w.color] || w.color) : speaking ? CURRENT : '#FFFFFF';
        if (w.color) { g.shadowColor = col; g.shadowBlur = speaking ? 30 : 12; }
        g.fillStyle = col;
        g.fillText(w.txt, 0, 0);
        g.restore();
      }
      x += w.width + space;
    });
  });
  g.restore();
}

// ---------------- IDENTIDADE ----------------
export function drawEmblem(g, x, y, r, t = 0, alpha = 1) {
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y);
  // aro dourado
  const gold = g.createLinearGradient(-r, -r, r, r);
  gold.addColorStop(0, '#FFE69A'); gold.addColorStop(0.5, '#E0A425'); gold.addColorStop(1, '#FFD45E');
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fillStyle = gold; g.fill();
  const bg = g.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r * 0.9);
  bg.addColorStop(0, '#2a4a7a'); bg.addColorStop(1, '#0b1630');
  g.beginPath(); g.arc(0, 0, r * 0.88, 0, Math.PI * 2); g.fillStyle = bg; g.fill();
  g.save(); g.beginPath(); g.arc(0, 0, r * 0.88, 0, Math.PI * 2); g.clip();
  // lua crescente
  g.fillStyle = '#FFF3C4';
  g.beginPath(); g.arc(r * 0.32, -r * 0.35, r * 0.22, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1a3058';
  g.beginPath(); g.arc(r * 0.42, -r * 0.42, r * 0.19, 0, Math.PI * 2); g.fill();
  // estrelas
  g.fillStyle = '#fff';
  [[-0.5, -0.5], [-0.2, -0.65], [0.6, -0.05], [-0.62, -0.15]].forEach(([a, b], i) => { g.globalAlpha = alpha * (0.5 + 0.5 * Math.sin(t * 3 + i)); g.beginPath(); g.arc(a * r, b * r, r * 0.025, 0, 7); g.fill(); });
  g.globalAlpha = alpha;
  // tabocas (bambus)
  [[-0.38, 0.06], [-0.12, -0.03], [0.14, 0.1]].forEach(([bx, lean], i) => {
    const sway = Math.sin(t * 1.5 + i) * 0.03;
    g.save(); g.translate(bx * r, r * 0.9); g.rotate(lean + sway);
    g.fillStyle = i === 1 ? '#8BC34A' : '#6E9F33';
    const h = r * (1.35 - i * 0.12), w = r * 0.09;
    g.fillRect(-w / 2, -h, w, h);
    g.fillStyle = '#4E7A1E';
    for (let k = 1; k < 6; k++) g.fillRect(-w / 2 - 2, -h * k / 6, w + 4, r * 0.025);
    g.fillStyle = '#7CB342';
    for (let k = 0; k < 3; k++) { g.save(); g.translate(0, -h * (0.55 + k * 0.15)); g.rotate((k % 2 ? 1 : -1) * 0.9); g.beginPath(); g.ellipse(r * 0.13, 0, r * 0.16, r * 0.04, 0, 0, 7); g.fill(); g.restore(); }
    g.restore();
  });
  // chão
  g.fillStyle = '#0a2a14'; g.fillRect(-r, r * 0.62, r * 2, r);
  g.restore();
  g.restore();
}

export function drawBrandText(g, x, y, size, alpha = 1, glow = 0) {
  g.save();
  g.globalAlpha = alpha;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${size * 0.42}px ${FONT_TITLE}`;
  g.letterSpacing = `${size * 0.08}px`;
  g.fillStyle = '#FFFFFF';
  g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 12;
  g.fillText('HISTÓRIAS DO', x, y - size * 0.6);
  g.letterSpacing = `${size * 0.03}px`;
  g.font = `${size}px ${FONT_TITLE}`;
  const gr = g.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  gr.addColorStop(0, '#FFF2B0'); gr.addColorStop(0.5, '#FFC83D'); gr.addColorStop(1, '#E08A10');
  g.lineWidth = size * 0.09; g.strokeStyle = '#3a1e05'; g.lineJoin = 'round';
  g.strokeText('TABOCAL', x, y + size * 0.15);
  g.shadowColor = glow ? '#FFB000' : 'transparent'; g.shadowBlur = glow * 40;
  g.fillStyle = gr; g.fillText('TABOCAL', x, y + size * 0.15);
  g.restore();
}

// Selo discreto no canto durante o episódio
export function drawBug(g, t, alpha = 0.85) {
  g.save();
  g.globalAlpha = alpha;
  drawEmblem(g, 92, 150, 40, t, alpha);
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = `30px ${FONT_TITLE}`; g.fillStyle = '#fff'; g.letterSpacing = '2px';
  g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 8;
  g.fillText('HISTÓRIAS DO TABOCAL', 146, 136);
  g.font = `800 22px ${FONT_SUB}`; g.fillStyle = COLORS.gold; g.letterSpacing = '4px';
  g.fillText('E SE...?', 146, 168);
  g.restore();
}

// Título de abertura "E SE...?"
export function drawOpeningTitle(g, lt, dur, t) {
  const inK = clamp01(lt / 0.9);
  const out = clamp01((dur - lt) / 0.6);
  if (out <= 0) return;
  g.save();
  g.globalAlpha = out;
  const y = 560;
  // logo da série
  drawEmblem(g, W / 2, y - 330, 78 * (0.6 + 0.4 * spring(clamp01(lt / 0.7))), t, clamp01(lt / 0.4));
  drawBrandText(g, W / 2, y - 175, 74, clamp01((lt - 0.2) / 0.5), 0.3);
  // "E SE...?" com letras caindo
  const letters = ['E', ' ', 'S', 'E', '.', '.', '.', '?'];
  g.font = `250px ${FONT_TITLE}`;
  g.textBaseline = 'middle';
  const widths = letters.map(l => g.measureText(l).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = W / 2 - total / 2;
  letters.forEach((l, i) => {
    const k = clamp01((lt - 0.35 - i * 0.07) / 0.45);
    const s = spring(k);
    g.save();
    g.translate(x + widths[i] / 2, y + 60 + (1 - ease.out(k)) * -160);
    g.scale(0.4 + 0.6 * s, 0.4 + 0.6 * s);
    g.globalAlpha = out * clamp01(k * 2);
    g.textAlign = 'center';
    g.lineWidth = 16; g.strokeStyle = '#1a0d02'; g.lineJoin = 'round';
    g.strokeText(l, 0, 0);
    const gr = g.createLinearGradient(0, -110, 0, 110);
    gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.45, '#FFE27A'); gr.addColorStop(1, '#FF9A1F');
    g.shadowColor = '#FFAA00'; g.shadowBlur = 40 + 20 * Math.sin(t * 4);
    g.fillStyle = gr; g.fillText(l, 0, 0);
    g.restore();
    x += widths[i];
  });
  // brilho varrendo
  const sw = -1;
  if (sw > 0 && sw < 1) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const gx = W * (-0.2 + sw * 1.4);
    const grd = g.createLinearGradient(gx - 120, 0, gx + 120, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.5, 'rgba(255,240,200,0.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, y - 80, W, 280);
    g.restore();
  }
  g.restore();
}

export function drawChip(g, text, x, y, { size = 44, bg = 'rgba(10,14,30,0.78)', color = '#fff', border = COLORS.gold, alpha = 1, scale = 1, icon = null } = {}) {
  if (alpha <= 0) return;
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y); g.scale(scale, scale);
  g.font = `900 ${size}px ${FONT_SUB}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const tw = g.measureText(text).width + (icon ? size * 1.2 : 0);
  const pw = tw + size * 1.2, ph = size * 1.7;
  g.beginPath(); g.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2);
  g.fillStyle = bg; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fill();
  g.shadowBlur = 0; g.lineWidth = 4; g.strokeStyle = border; g.stroke();
  g.fillStyle = color;
  g.fillText(text, icon ? size * 0.6 : 0, 2);
  if (icon) icon(g, -tw / 2 + size * 0.35, 0, size * 0.5);
  g.restore();
}

// Indicador numérico (ex.: distância Terra-Lua)
export function drawCounter(g, label, value, x, y, { alpha = 1, color = '#fff', danger = 0 } = {}) {
  if (alpha <= 0) return;
  g.save();
  g.globalAlpha = alpha;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 34px ${FONT_SUB}`; g.letterSpacing = '6px';
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 10;
  g.fillText(label, x, y - 82);
  g.letterSpacing = '0px';
  g.font = `110px ${FONT_TITLE}`;
  g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.strokeText(value, x, y + 10);
  g.fillStyle = danger > 0 ? `rgb(255,${Math.round(255 - danger * 180)},${Math.round(255 - danger * 200)})` : color;
  if (danger) { g.shadowColor = '#ff3030'; g.shadowBlur = 30 * danger; }
  g.fillText(value, x, y + 10);
  g.restore();
}

export function heartIcon(g, x, y, s, fill = COLORS.red) {
  g.save(); g.translate(x, y); g.scale(s / 16, s / 16);
  g.beginPath();
  g.moveTo(0, 6); g.bezierCurveTo(-14, -4, -8, -16, 0, -8); g.bezierCurveTo(8, -16, 14, -4, 0, 6);
  g.fillStyle = fill; g.fill();
  g.restore();
}

// Chamada no meio do vídeo (não interrompe a história)
export function drawMidCTA(g, lt, dur, t) {
  const inK = clamp01(lt / 0.5), outK = clamp01((dur - lt) / 0.4);
  const a = Math.min(inK, outK);
  if (a <= 0) return;
  const y = 420;
  const s = spring(inK) * (0.85 + 0.15 * outK);
  const beat = 1 + Math.max(0, Math.sin(t * 7)) * 0.12;
  g.save();
  g.globalAlpha = a;
  g.translate(W / 2, y); g.scale(s, s);
  const pw = 760, ph = 130;
  g.beginPath(); g.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2);
  const gr = g.createLinearGradient(-pw / 2, 0, pw / 2, 0);
  gr.addColorStop(0, 'rgba(255,60,90,0.95)'); gr.addColorStop(1, 'rgba(255,140,40,0.95)');
  g.fillStyle = gr; g.shadowColor = 'rgba(255,80,60,0.7)'; g.shadowBlur = 40; g.fill();
  g.shadowBlur = 0;
  // ícone coração
  g.beginPath(); g.arc(-pw / 2 + 68, 0, 46, 0, 7); g.fillStyle = '#fff'; g.fill();
  heartIcon(g, -pw / 2 + 68, 4, 34 * beat, '#FF3355');
  g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = `900 46px ${FONT_SUB}`;
  g.fillText('CURTA E SIGA', -pw / 2 + 140, -18);
  g.font = `700 30px ${FONT_SUB}`; g.globalAlpha = a * 0.92;
  g.fillText(SERIES.handle, -pw / 2 + 142, 28);
  // botão seguir
  g.globalAlpha = a;
  const bk = clamp01((lt - 0.6) / 0.3);
  g.save(); g.translate(pw / 2 - 95, 0); g.scale(spring(bk), spring(bk));
  g.beginPath(); g.roundRect(-70, -36, 140, 72, 36); g.fillStyle = '#fff'; g.fill();
  g.fillStyle = '#FF3355'; g.textAlign = 'center'; g.font = `900 34px ${FONT_SUB}`; g.fillText(lt > 1.4 ? '✓' : '+ SEGUIR', 0, 2);
  g.restore();
  g.restore();
  // corações flutuando
  for (let i = 0; i < 7; i++) {
    const k = ((lt * 0.8 + i / 7) % 1);
    if (lt < 0.3) break;
    const hx = W / 2 - 300 + i * 100 + Math.sin(k * 6 + i) * 30;
    const hy = y - 40 - k * 300;
    g.save(); g.globalAlpha = a * (1 - k) * 0.9; heartIcon(g, hx, hy, 18 + (i % 3) * 8, i % 2 ? '#FF4D6D' : '#FF8A3D'); g.restore();
  }
}

// Tela final obrigatória
export function drawEndCard(g, lt, dur, t) {
  g.save();
  // escurecimento do fundo
  const bgA = clamp01(lt / 0.6) * 0.72;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, `rgba(6,10,30,${bgA})`); bg.addColorStop(0.5, `rgba(10,16,40,${bgA * 0.85})`); bg.addColorStop(1, `rgba(4,6,18,${bgA})`);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // raios de luz
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(W / 2, 640);
  for (let i = 0; i < 12; i++) {
    g.rotate(Math.PI / 6 + Math.sin(t * 0.2) * 0.01);
    const gr = g.createLinearGradient(0, 0, 0, -900);
    gr.addColorStop(0, `rgba(255,190,60,${0.10 * clamp01((lt - 0.2) / 0.8)})`); gr.addColorStop(1, 'rgba(255,190,60,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-30, 0); g.lineTo(-120, -900); g.lineTo(120, -900); g.lineTo(30, 0); g.fill();
  }
  g.restore();
  // partículas douradas
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 60; i++) {
    const k = ((t * 0.08 + i * 0.137) % 1);
    const px = (i * 173) % W, py = H - k * H;
    g.globalAlpha = Math.sin(k * Math.PI) * 0.7 * clamp01(lt);
    g.fillStyle = i % 3 ? '#FFD45E' : '#FFFFFF';
    g.beginPath(); g.arc(px + Math.sin(t + i) * 20, py, 2 + (i % 4), 0, 7); g.fill();
  }
  g.restore();
  // logo
  const lk = clamp01((lt - 0.15) / 0.8);
  const ls = spring(lk);
  g.save(); g.translate(W / 2, 520); g.scale(ls, ls); g.rotate((1 - ease.out(lk)) * -0.5);
  drawEmblem(g, 0, 0, 150, t, clamp01(lk * 2));
  g.restore();
  drawBrandText(g, W / 2, 790, 150 * (0.8 + 0.2 * spring(clamp01((lt - 0.4) / 0.6))), clamp01((lt - 0.4) / 0.4), 0.6 + 0.4 * Math.sin(t * 3));
  // série
  const sk = clamp01((lt - 0.9) / 0.5);
  drawChip(g, 'SÉRIE  E SE...?', W / 2, 935, { size: 34, alpha: sk, scale: 0.8 + 0.2 * spring(sk), bg: 'rgba(255,200,61,0.12)', color: COLORS.gold });
  // "Gostou dessa história?"
  const qk = clamp01((lt - 1.4) / 0.6);
  g.save();
  g.globalAlpha = qk; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.translate(W / 2, 1100 + (1 - ease.out(qk)) * 40);
  g.font = `900 74px ${FONT_SUB}`;
  g.lineWidth = 12; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineJoin = 'round';
  g.strokeText('Gostou dessa história?', 0, 0);
  g.fillStyle = '#fff'; g.fillText('Gostou dessa história?', 0, 0);
  g.restore();
  // "CURTA ❤️ COMENTE 💬 E SIGA O PERFIL!"
  const items = [
    { txt: 'CURTA ❤️', col: '#FF3355', at: 2.1 },
    { txt: 'COMENTE 💬', col: '#2F9BFF', at: 2.45 },
    { txt: 'E SIGA O PERFIL!', col: '#FFB000', at: 2.8 },
  ];
  items.forEach((it, i) => {
    const k = clamp01((lt - it.at) / 0.4);
    if (k <= 0) return;
    const s = spring(k) * (1 + Math.max(0, Math.sin((t - it.at) * 5 - i)) * 0.04 * clamp01(lt - 3.4));
    const y = 1280 + i * 150;
    g.save(); g.translate(W / 2, y); g.scale(s, s);
    g.font = `900 64px ${FONT_SUB}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(it.txt).width + 90;
    g.beginPath(); g.roundRect(-tw / 2, -58, tw, 116, 58);
    g.fillStyle = 'rgba(14,18,36,0.92)'; g.shadowColor = it.col; g.shadowBlur = 35; g.fill();
    g.shadowBlur = 0; g.lineWidth = 6; g.strokeStyle = it.col; g.stroke();
    g.fillStyle = '#fff'; g.fillText(it.txt, 0, 4);
    g.restore();
  });
  // fade final
  const fo = clamp01((lt - (dur - 0.5)) / 0.5);
  if (fo > 0) { g.fillStyle = `rgba(0,0,0,${fo})`; g.fillRect(0, 0, W, H); }
  g.restore();
}

// Rachadura "na tela" e letreiro de alerta
export function drawAlertBanner(g, text, lt, t, alpha = 1) {
  if (alpha <= 0) return;
  const k = clamp01(lt / 0.3);
  g.save();
  g.globalAlpha = alpha * k;
  const y = 470;
  const blink = Math.sin(t * 9) > 0 ? 1 : 0.75;
  g.fillStyle = `rgba(200,20,20,${0.85 * blink})`;
  g.fillRect(0, y - 60, W, 120);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  for (let x = -((t * 120) % 80); x < W; x += 80) { g.beginPath(); g.moveTo(x, y - 60); g.lineTo(x + 40, y - 60); g.lineTo(x, y + 60); g.lineTo(x - 40, y + 60); g.fill(); }
  g.fillStyle = '#fff'; g.font = `80px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.letterSpacing = '6px';
  g.fillText(text, W / 2, y + 4);
  g.restore();
}

export function drawLetterLabel(g, text, sub, lt, alpha = 1, y = 520) {
  if (alpha <= 0) return;
  const k = clamp01(lt / 0.5);
  g.save();
  g.globalAlpha = alpha * k;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `100px ${FONT_TITLE}`; g.letterSpacing = `${8 + (1 - k) * 30}px`;
  g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.strokeText(text, W / 2, y);
  g.fillStyle = '#FFC83D'; g.shadowColor = '#FF8A00'; g.shadowBlur = 30; g.fillText(text, W / 2, y);
  if (sub) { g.shadowBlur = 0; g.font = `800 38px ${FONT_SUB}`; g.letterSpacing = '3px'; g.fillStyle = '#fff'; g.strokeText(sub, W / 2, y + 85); g.fillText(sub, W / 2, y + 85); }
  g.restore();
}
