// Overlays dos episódios de RECEITAS: ingredientes, passo a passo, medida em destaque, timer,
// quiz interativo, aviso de cuidado e cartão-resumo para salvar. Modo imediato (função do tempo).
import { W, H, clamp01, ease } from './stage.js';
import { FONT_TITLE, FONT_SUB, COLORS } from './overlays.js';
import { drawMark } from './overlays2.js';

const spring = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; return 1 - Math.exp(-6 * k) * Math.cos(k * 10); };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
function wrap(g, text, maxW) {
  const words = String(text).split(' '), lines = []; let cur = '';
  words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
  if (cur) lines.push(cur); return lines;
}
const ACC = { gold: '#FFC83D', green: '#2fbf5b', blue: '#3b9be0', red: '#e8453c', orange: '#ff8a3d', pink: '#ff5d9b', teal: '#25b8a8' };
const col = (c) => ACC[c] || c || ACC.gold;

// ---------------- selo "RECEITA #n" + para que serve (abertura da receita) ----------------
export function drawRecipeKicker(g, lt, { n = 1, name = '', uses = [], color = 'green', y = 330 } = {}) {
  if (lt < 0) return;
  const k = spring(clamp01(lt / 0.45)), a = clamp01(lt / 0.2), c = col(color);
  g.save(); g.globalAlpha = a; g.translate(W / 2, y); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 46px ${FONT_SUB}`; g.letterSpacing = '6px'; const label = `RECEITA CASEIRA #${n}`, lw = g.measureText(label).width + 90;
  rr(g, -lw / 2, -44, lw, 88, 44); g.fillStyle = c; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fill(); g.shadowBlur = 0; g.fillStyle = '#fff'; g.fillText(label, 4, 3);
  if (name) { g.font = `${130}px ${FONT_TITLE}`; g.letterSpacing = '3px'; let fs = 130; while (g.measureText(name).width > W - 110 && fs > 60) { fs -= 6; g.font = `${fs}px ${FONT_TITLE}`; } g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#1a0d02'; g.strokeText(name, 0, 130); g.fillStyle = '#fff'; g.shadowColor = c; g.shadowBlur = 28; g.fillText(name, 0, 130); g.shadowBlur = 0; }
  g.restore();
  // "PARA:" chips
  uses.forEach((u, i) => {
    const kk = spring(clamp01((lt - 0.5 - i * 0.22) / 0.4)); if (kk <= 0) return;
    g.save(); g.globalAlpha = a; g.translate(W / 2, y + 250 + i * 104); g.scale(kk, kk); g.font = `900 46px ${FONT_SUB}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    const tw = g.measureText(u).width, pw = tw + 150; rr(g, -pw / 2, -44, pw, 88, 44); g.fillStyle = 'rgba(255,255,255,0.97)'; g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 18; g.fill(); g.shadowBlur = 0;
    g.beginPath(); g.arc(-pw / 2 + 50, 0, 17, 0, 7); g.fillStyle = c; g.fill(); g.lineWidth = 5; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-pw / 2 + 41, 1); g.lineTo(-pw / 2 + 48, 9); g.lineTo(-pw / 2 + 60, -8); g.stroke();
    g.fillStyle = '#16161e'; g.fillText(u, -pw / 2 + 86, 3); g.restore();
  });
}

// ---------------- lista de ingredientes (linhas aparecem junto da fala) ----------------
export function drawIngredients(g, items, t, { y = 380, title = 'INGREDIENTES', color = 'green' } = {}) {
  const c = col(color), t0 = items.length ? items[0].at : 0, k0 = clamp01((t - t0 + 0.3) / 0.35); if (k0 <= 0) return;
  g.save(); g.globalAlpha = k0; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 44px ${FONT_SUB}`; g.letterSpacing = '8px';
  const tw = g.measureText(title).width + 90; rr(g, W / 2 - tw / 2, y - 150, tw, 70, 35); g.fillStyle = c; g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 18; g.fill(); g.shadowBlur = 0; g.fillStyle = '#fff'; g.fillText(title, W / 2 + 4, y - 113); g.restore();
  items.forEach((it, i) => {
    const lt = t - it.at; if (lt < -0.3) return; const k = clamp01((lt + 0.3) / 0.35), yy = y + i * 150;
    g.save(); g.globalAlpha = k; g.translate(W / 2 + (1 - ease.out(k)) * 240, yy);
    const pw = 940, ph = 122; rr(g, -pw / 2, -ph / 2, pw, ph, 30); g.fillStyle = 'rgba(255,255,255,0.97)'; g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 24; g.fill(); g.shadowBlur = 0;
    // medida em destaque (esquerda)
    g.font = `${it.amt.length > 9 ? 44 : 56}px ${FONT_TITLE}`; g.letterSpacing = '1px'; g.textAlign = 'center'; const aw = Math.max(250, g.measureText(it.amt).width + 50);
    rr(g, -pw / 2 + 14, -ph / 2 + 14, aw, ph - 28, 22); g.fillStyle = c; g.fill(); g.fillStyle = '#fff'; g.fillText(it.amt, -pw / 2 + 14 + aw / 2, 4);
    g.textAlign = 'left'; g.fillStyle = '#16161e'; g.letterSpacing = '0px'; g.font = `900 ${it.name.length > 20 ? 42 : 50}px ${FONT_SUB}`; g.fillText(it.name, -pw / 2 + aw + 40, it.sub ? -16 : 2);
    if (it.sub) { g.font = `700 32px ${FONT_SUB}`; g.fillStyle = '#6a6a7a'; g.fillText(it.sub, -pw / 2 + aw + 42, 32); }
    g.restore();
  });
}

// ---------------- selo do passo: (1) MISTURE ----------------
export function drawStep(g, lt, { n = 1, total = 3, title = '', color = 'green', y = 300 } = {}) {
  if (lt < 0) return;
  const k = spring(clamp01(lt / 0.4)), c = col(color);
  g.save(); g.translate(W / 2, y); g.scale(k, k); g.textBaseline = 'middle'; g.textAlign = 'left';
  g.font = `${72}px ${FONT_TITLE}`; g.letterSpacing = '2px'; const tw = g.measureText(title).width, pw = tw + 330;
  rr(g, -pw / 2, -64, pw, 128, 64); g.fillStyle = 'rgba(10,14,30,0.9)'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 22; g.fill(); g.shadowBlur = 0; g.lineWidth = 5; g.strokeStyle = c; g.stroke();
  g.beginPath(); g.arc(-pw / 2 + 72, 0, 50, 0, 7); g.fillStyle = c; g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `${68}px ${FONT_TITLE}`; g.fillText(String(n), -pw / 2 + 72, 4);
  g.textAlign = 'left'; g.font = `${72}px ${FONT_TITLE}`; g.fillStyle = '#fff'; g.fillText(title, -pw / 2 + 150, 4);
  g.font = `800 30px ${FONT_SUB}`; g.letterSpacing = '3px'; g.fillStyle = 'rgba(255,255,255,0.65)'; g.textAlign = 'right'; g.fillText(`${n}/${total}`, pw / 2 - 40, 6);
  g.restore();
}

// ---------------- medida em destaque: "2 COLHERES DE SOPA" + nota ----------------
export function drawQty(g, lt, { amount = '', note = '', x = W / 2, y = 560, color = 'gold', size = 68 } = {}) {
  if (lt < 0) return;
  const k = spring(clamp01(lt / 0.4)), c = col(color);
  g.save(); g.globalAlpha = clamp01(lt / 0.12); g.translate(x, y); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${size}px ${FONT_TITLE}`; g.letterSpacing = '2px'; let fs = size; while (g.measureText(amount).width > W - 190 && fs > 40) { fs -= 4; g.font = `${fs}px ${FONT_TITLE}`; }
  const tw = g.measureText(amount).width, pw = tw + 100, ph = note ? size * 2.05 : size * 1.5;
  rr(g, -pw / 2, -ph / 2, pw, ph, 36); g.fillStyle = 'rgba(10,14,30,0.9)'; g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 24; g.fill(); g.shadowBlur = 0; g.lineWidth = 6; g.strokeStyle = c; g.stroke();
  g.fillStyle = '#fff'; g.fillText(amount, 0, note ? -size * 0.3 : 3);
  if (note) { g.font = `800 ${size * 0.42}px ${FONT_SUB}`; g.letterSpacing = '1px'; g.fillStyle = c; let nf = size * 0.42; while (g.measureText(note).width > pw - 50 && nf > 22) { nf -= 2; g.font = `800 ${nf}px ${FONT_SUB}`; } g.fillText(note, 0, size * 0.52); }
  g.restore();
}

// ---------------- timer em anel: tempo restante (acelerado) ----------------
export function drawTimer(g, lt, u, { label = 'TEMPO', secs = 300, p0 = 0, p1 = 1, x = W / 2, y = 560, color = 'orange', fast = true } = {}) {
  if (lt < 0) return;
  const k = spring(clamp01(lt / 0.4)), c = col(color), p = p0 + (p1 - p0) * clamp01(u), left = Math.max(0, Math.round(secs * (1 - p))), R = 150;
  g.save(); g.translate(x, y); g.scale(k, k);
  g.beginPath(); g.arc(0, 0, R + 30, 0, 7); g.fillStyle = 'rgba(10,14,30,0.88)'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 24; g.fill(); g.shadowBlur = 0;
  g.lineWidth = 26; g.strokeStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(0, 0, R, 0, 7); g.stroke();
  g.strokeStyle = c; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); g.stroke();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${96}px ${FONT_TITLE}`; g.letterSpacing = '2px'; g.fillText(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 0, 6);
  g.font = `800 28px ${FONT_SUB}`; g.letterSpacing = '4px'; g.fillStyle = c; g.fillText(label, 0, -R * 0.52);
  if (fast) { g.font = `800 20px ${FONT_SUB}`; g.letterSpacing = '1px'; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText('TEMPO ACELERADO', 0, R * 0.55); }
  g.restore();
}

// ---------------- aviso de cuidado (caixa vermelha) ----------------
export function drawCaution(g, lt, { title = 'CUIDADO', items = [], y = 470, color = 'red' } = {}) {
  if (lt < 0) return;
  const k = spring(clamp01(lt / 0.4)), c = col(color);
  g.save(); g.globalAlpha = clamp01(lt / 0.12); g.translate(W / 2, y); g.scale(k, k); g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = `800 40px ${FONT_SUB}`; const lines = items.map(t => wrap(g, t, 700)), n = lines.reduce((a, l) => a + l.length, 0), ph = 150 + n * 54 + items.length * 18, pw = 940;
  rr(g, -pw / 2, 0, pw, ph, 36); g.fillStyle = 'rgba(255,255,255,0.98)'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 26; g.fill(); g.shadowBlur = 0; g.lineWidth = 8; g.strokeStyle = c; g.stroke();
  rr(g, -pw / 2, 0, pw, 108, 36); g.fillStyle = c; g.fill(); g.fillRect(-pw / 2, 60, pw, 48);
  // triângulo de alerta
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-pw / 2 + 74, 22); g.lineTo(-pw / 2 + 116, 88); g.lineTo(-pw / 2 + 32, 88); g.closePath(); g.fill(); g.fillStyle = c; g.font = `900 46px ${FONT_SUB}`; g.textAlign = 'center'; g.fillText('!', -pw / 2 + 74, 66);
  g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = `${72}px ${FONT_TITLE}`; g.letterSpacing = '3px'; g.fillText(title, -pw / 2 + 150, 56);
  g.letterSpacing = '0px'; let yy = 150;
  items.forEach((_, i) => {
    const it = clamp01((lt - 0.35 - i * 0.3) / 0.3);
    lines[i].forEach((ln, j) => { g.save(); g.globalAlpha = it; g.fillStyle = '#16161e'; g.font = `800 40px ${FONT_SUB}`; g.fillText(ln, -pw / 2 + 110, yy + 22); if (j === 0) { g.beginPath(); g.arc(-pw / 2 + 62, yy + 22, 13, 0, 7); g.fillStyle = c; g.fill(); } g.restore(); yy += 54; });
    yy += 18;
  });
  g.restore();
}

// ---------------- quiz interativo (pergunta, 3 opções, barra de tempo, revela a resposta) ----------------
export function drawQuiz(g, lt, { q = '', opts = [], ans = 0, reveal = 3.4, y = 330, color = 'blue' } = {}) {
  if (lt < 0) return;
  const k = spring(clamp01(lt / 0.4)), c = col(color), revealed = lt >= reveal, rk = clamp01((lt - reveal) / 0.35);
  g.save(); g.globalAlpha = clamp01(lt / 0.12); g.translate(W / 2, y); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 40px ${FONT_SUB}`; g.letterSpacing = '8px'; const hw = 270; rr(g, -hw / 2, -10, hw, 80, 40); g.fillStyle = c; g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 18; g.fill(); g.shadowBlur = 0; g.fillStyle = '#fff'; g.fillText('QUIZ', 6, 32);
  // pergunta
  g.font = `900 54px ${FONT_SUB}`; g.letterSpacing = '0px'; const ql = wrap(g, q, 860), qh = ql.length * 66 + 50;
  rr(g, -470, 100, 940, qh, 34); g.fillStyle = 'rgba(10,14,30,0.92)'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 24; g.fill(); g.shadowBlur = 0; g.lineWidth = 5; g.strokeStyle = c; g.stroke();
  g.fillStyle = '#fff'; ql.forEach((ln, i) => g.fillText(ln, 0, 100 + 25 + 33 + i * 66));
  // opções
  const top = 100 + qh + 36;
  opts.forEach((o, i) => {
    const ik = spring(clamp01((lt - 0.4 - i * 0.18) / 0.4)); if (ik <= 0) return;
    const yy = top + i * 138, isAns = i === ans, dim = revealed && !isAns ? 0.35 : 1;
    g.save(); g.globalAlpha *= dim; g.translate(0, yy + 54); g.scale(ik, ik);
    rr(g, -470, -54, 940, 108, 30); g.fillStyle = revealed && isAns ? `rgb(${Math.round(255 - 208 * rk)},${Math.round(255 - 64 * rk)},${Math.round(255 - 164 * rk)})` : '#ffffff'; g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 18; g.fill(); g.shadowBlur = 0;
    g.beginPath(); g.arc(-470 + 62, 0, 38, 0, 7); g.fillStyle = revealed && isAns ? '#1f8f45' : c; g.fill(); g.fillStyle = '#fff'; g.font = `${54}px ${FONT_TITLE}`; g.fillText('ABC'[i], -470 + 62, 3);
    g.textAlign = 'left'; g.font = `900 44px ${FONT_SUB}`; g.fillStyle = revealed && isAns ? '#fff' : '#16161e'; let fs = 44; while (g.measureText(o).width > 700 && fs > 24) { fs -= 2; g.font = `900 ${fs}px ${FONT_SUB}`; } g.fillText(o, -470 + 120, 3);
    g.restore();
    if (revealed && isAns) drawMark(g, 'ok', W / 2 + 395, y + yy + 54, 46, 1, lt - reveal - 0.1);
  });
  // barra de tempo
  if (!revealed) { const pw = 940, pr = 1 - clamp01((lt - 0.8) / (reveal - 0.8)); rr(g, -pw / 2, top + opts.length * 138 + 6, pw, 20, 10); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fill(); rr(g, -pw / 2, top + opts.length * 138 + 6, pw * pr, 20, 10); g.fillStyle = c; g.fill(); }
  g.restore();
}

// ---------------- cartão-resumo da receita ("salve este vídeo") ----------------
export function drawRecipeCard(g, lt, t, { name = '', para = '', ingredients = [], steps = [], note = '', color = 'green', at = [], y = 250 } = {}) {
  if (lt < 0) return;
  const k = spring(clamp01(lt / 0.5)), c = col(color), pw = 980;
  g.save(); g.globalAlpha = clamp01(lt / 0.15); g.translate(W / 2, y); g.scale(k, k); g.textBaseline = 'middle'; g.textAlign = 'left';
  let rowsI = ingredients.length, rowsS = steps.length;
  const ph = 150 + 80 + rowsI * 62 + 70 + rowsS * 78 + (note ? 90 : 0) + 60; // altura
  rr(g, -pw / 2, 0, pw, ph, 40); g.fillStyle = '#fffaf0'; g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 36; g.fill(); g.shadowBlur = 0;
  rr(g, -pw / 2, 0, pw, 150, 40); g.fillStyle = c; g.fill(); g.fillRect(-pw / 2, 90, pw, 60);
  g.fillStyle = '#fff'; g.font = `800 28px ${FONT_SUB}`; g.letterSpacing = '6px'; g.fillText('RECEITA CASEIRA · SALVE ESTE VÍDEO', -pw / 2 + 44, 34);
  g.font = `${78}px ${FONT_TITLE}`; g.letterSpacing = '2px'; let fs = 78; while (g.measureText(name).width > pw - 90 && fs > 40) { fs -= 4; g.font = `${fs}px ${FONT_TITLE}`; } g.fillText(name, -pw / 2 + 44, 102);
  let yy = 190; g.fillStyle = '#6a6a7a'; g.font = `800 32px ${FONT_SUB}`; g.letterSpacing = '1px'; g.fillText(`PARA: ${para}`, -pw / 2 + 44, yy); yy += 56;
  g.fillStyle = c; g.font = `900 30px ${FONT_SUB}`; g.letterSpacing = '5px'; g.fillText('INGREDIENTES', -pw / 2 + 44, yy); yy += 52;
  ingredients.forEach((it, i) => { const a = clamp01((t - (at[i] ?? 0)) / 0.25); g.save(); g.globalAlpha = at.length ? a : 1; g.fillStyle = '#16161e'; g.font = `900 44px ${FONT_SUB}`; g.letterSpacing = '0px'; g.fillText('•  ' + it, -pw / 2 + 50, yy + i * 62 + 14); g.restore(); });
  yy += rowsI * 62 + 24; g.fillStyle = c; g.font = `900 30px ${FONT_SUB}`; g.letterSpacing = '5px'; g.fillText('MODO DE FAZER', -pw / 2 + 44, yy); yy += 52;
  steps.forEach((it, i) => { const a = clamp01((t - (at[rowsI + i] ?? 0)) / 0.25); g.save(); g.globalAlpha = at.length ? a : 1; g.beginPath(); g.arc(-pw / 2 + 70, yy + i * 78 + 10, 26, 0, 7); g.fillStyle = c; g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `${40}px ${FONT_TITLE}`; g.fillText(String(i + 1), -pw / 2 + 70, yy + i * 78 + 13); g.textAlign = 'left'; g.fillStyle = '#16161e'; g.letterSpacing = '0px'; g.font = `800 38px ${FONT_SUB}`; let f2 = 38; while (g.measureText(it).width > pw - 190 && f2 > 22) { f2 -= 2; g.font = `800 ${f2}px ${FONT_SUB}`; } g.fillText(it, -pw / 2 + 120, yy + i * 78 + 10); g.restore(); });
  if (note) { yy += rowsS * 78 + 20; rr(g, -pw / 2 + 36, yy, pw - 72, 70, 20); g.fillStyle = '#fde8e6'; g.fill(); g.fillStyle = '#b3261e'; g.font = `800 30px ${FONT_SUB}`; g.letterSpacing = '0px'; g.textAlign = 'center'; let f3 = 30; while (g.measureText(note).width > pw - 120 && f3 > 18) { f3 -= 2; g.font = `800 ${f3}px ${FONT_SUB}`; } g.fillText(note, 0, yy + 36); }
  g.restore();
}

// ---------------- aviso fixo: "não substitui médico" (rodapé discreto) ----------------
export function drawDisclaimer(g, lt, { text = 'Informação geral. Não substitui consulta médica.', y = 1790 } = {}) {
  if (lt < 0) return;
  const a = clamp01(lt / 0.3) * 0.9;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 30px ${FONT_SUB}`; g.letterSpacing = '1px';
  const w = g.measureText(text).width + 70; rr(g, W / 2 - w / 2, y - 30, w, 60, 30); g.fillStyle = 'rgba(10,14,30,0.78)'; g.fill(); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillText(text, W / 2, y + 2); g.restore();
}
void H; void COLORS;
