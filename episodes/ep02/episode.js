// ============================================================================
//  E SE...? — Episódio 02: "E se você nunca trocasse o lençol?"
//  HISTÓRIAS DO TABOCAL
// ----------------------------------------------------------------------------
//  Estilo de referência (vídeos enviados): cortes a cada 1–2 s, um assunto por
//  plano, close em objeto-chave, contador LED, níveis numerados com carimbo,
//  selos de câmera lenta/rebobinando, etiquetas com ponto colorido, ✅/❌.
//
//  ROTEIRO: episodes/ep02/lines.js (L01…L16). As cenas são ancoradas nas
//  palavras da narração, então se reajustam sozinhas se o áudio mudar.
//  NARRAÇÃO: audio/ep02/narracao/L01.mp3 … L16.mp3 + timings.json
//  (python3 tools/gerar_narracao.py ep02).
// ============================================================================
import { LINES } from './lines.js';
import { cameraPath, shake, clamp01 } from '../../js/render/stage.js';
import { drawOpeningTitle, drawMidCTA, drawCounter, drawChip, drawEndCard, COLORS } from '../../js/render/overlays.js';
import {
  drawLevelStamp, drawLedPanel, drawSpeedBadge, drawRewindFx, drawTag, drawMark, drawThought,
  drawPopText, drawChecklist, drawZzz, drawMoodTint, drawFlyingPage, drawLens,
} from '../../js/render/overlays2.js';

const lerp = (a, b, k) => a + (b - a) * k;
const A = (line, word, offset = 0, extra = {}) => ({ line, word, offset, ...extra }); // âncora na palavra
const FIN = { after: 'L16', offset: 0.5 };

// ----------------------------- presets do quarto -----------------------------
const clean = (w) => { w.reset(); Object.assign(w.state, { day: 0, lamp: 1, mood: 0, dirt: 0, mites: 0, calLabel: 'DIA', calNum: 1, calNext: 2 }); };
const lvl1 = (w, d = 0.3) => { clean(w); Object.assign(w.state, { dirt: d, mites: 0.2 }); };
const lvl2 = (w) => { clean(w); Object.assign(w.state, { dirt: 0.6, mites: 0.7, mood: 0.3 }); };
const lvl3 = (w) => { clean(w); Object.assign(w.state, { dirt: 1, mold: 1, mites: 1, mood: 1, flies: 1, stink: 0.6, titoInBed: 0 }); w.hideTito(); };
const bright = (w) => { clean(w); Object.assign(w.state, { day: 1, lamp: 0.2, titoInBed: 0 }); w.hideTito(); };

// ------------------------- fábrica de cenas curtas ---------------------------
// spec: { tr, base(w,c), upd(w,c), cam:[keys], shake(w,c)->amount, hud(g,c), cues, ease }
function sc(id, start, spec = {}) {
  return {
    id, world: 'quarto', start, transition: spec.tr, duration: spec.dur, cues: spec.cues || [],
    noBug: spec.noBug, noSubtitles: spec.noSubtitles,
    setup(w, c) { w._f = {}; spec.base && spec.base(w, c); },
    update(w, c) {
      spec.upd && spec.upd(w, c);
      if (spec.cam) cameraPath(c.cam, spec.cam, c.u, spec.ease);
      if (spec.shake) shake(c.cam, spec.shake(w, c), c.t);
    },
    draw2D(g, c) { spec.hud && spec.hud(g, c); },
  };
}

// LED "SEM TROCAR HÁ: N DIAS" — n é função do tempo entre dois âncoras
const led = (g, c, from, to, a0, a1, { y = 1560, alpha = 1, danger = 0 } = {}) => {
  const k = c.k(a0, a1);
  const n = Math.round(lerp(from, to, k));
  const a = alpha * clamp01(c.since(a0) / 0.25 + 0.001) ;
  drawLedPanel(g, 'SEM TROCAR HÁ:', `${n} ${n === 1 ? 'DIA' : 'DIAS'}`, 540, y, { alpha: Math.min(1, a + 0.0), scale: 0.82, danger });
};
// checklist da solução: cada item marca ✅ na palavra correspondente da fala L14
const check = (g, c, y = 460) => drawChecklist(g, [
  { text: 'LENÇOL', sub: 'toda semana', at: c.T(A('L14', 'semana', 0.1)) },
  { text: 'TRAVESSEIRO', sub: 'a cada 2 ou 3 dias', at: c.T(A('L14', 'travesseiro', 0.1)) },
  { text: 'FRONHAS', sub: 'a cada 2 ou 3 dias', at: c.T(A('L14', 'fronhas', 0.1)) },
], 0, c.t, { y });

// ================================ ROTEIRO =====================================
export default {
  id: 'ep02',
  titulo: 'E se você nunca trocasse o lençol?',
  roteiroStatus: 'aprovado',
  intro: 1.25,
  narration: { dir: 'audio/ep02/narracao/', formats: ['mp3', 'wav', 'ogg', 'm4a'], timings: 'audio/ep02/narracao/timings.json' },
  lines: LINES,

  // trilha por trechos longos (as cenas têm 1–2 s e reiniciariam a música)
  musicPlan: [
    { from: { at: 0 }, to: A('L03', 'nivel', -0.2), mood: 'mystery', intensity: 0.5 },
    { from: A('L03', 'nivel', -0.2), to: A('L06', 'nivel', -0.2), mood: 'calm', intensity: 0.65 },
    { from: A('L06', 'nivel', -0.2), to: A('L10', 'nivel', -0.2), mood: 'tension', intensity: 0.75 },
    { from: A('L10', 'nivel', -0.2), to: A('L13', 'mas', -0.1), mood: 'action', intensity: 0.9 },
    { from: A('L13', 'mas', -0.1), to: A('L16', 'e', -0.1), mood: 'wonder', intensity: 0.7 },
    { from: A('L16', 'e', -0.1), to: FIN, mood: 'calm', intensity: 0.6 },
    { from: FIN, to: 'end', mood: 'outro', intensity: 0.9 },
  ],

  // ---------------------------- EFEITOS GLOBAIS ------------------------------
  cues: [
    { sfx: 'logo', at: { at: 0.35 }, p: { level: 0.45 } },
    { sfx: 'riser', at: A('L01', 'nunca', -0.3), until: A('L01', 'lencol', 0.5), p: { level: 0.16 } },
    { sfx: 'ding', at: A('L01', 'voce', 0.1), p: { level: 0.12 } },
    { sfx: 'whoosh', at: A('L01', 'o', -0.05), p: { dur: 0.4, level: 0.25 } },
    { sfx: 'pop', at: A('L02', 'terco', 0.05), p: { level: 0.22, freq: 560 } },
    // nível 1
    { sfx: 'impact', at: A('L03', 'nivel', 0.14), p: { level: 0.7, size: 1 } },
    { sfx: 'ding', at: A('L03', 'semana', 0.05), p: { level: 0.1 } },
    { sfx: 'splash', at: A('L04', 'suor', 0.0), p: { level: 0.22 } },
    { sfx: 'pop', at: A('L04', 'suor', 0.1), p: { level: 0.2, freq: 640 } },
    { sfx: 'shimmer', at: A('L04', 'milhares', 0.0), p: { level: 0.1 } },
    { sfx: 'pop', at: A('L04', 'milhares', 0.2), p: { level: 0.2, freq: 520 } },
    { sfx: 'braam', at: A('L05', 'alguem', 0.0), p: { dur: 2, level: 0.18 } },
    { sfx: 'pop', at: A('L05', 'feliz', 0.0), p: { level: 0.25, freq: 700 } },
    { sfx: 'tech', at: A('L05', 'acaros', 0.1), p: { count: 8, step: 0.05, level: 0.06 } },
    { sfx: 'whoosh', at: A('L06', 'nivel', -0.3), p: { dur: 0.6, level: 0.3 } },
    // nível 2
    { sfx: 'impact', at: A('L06', 'nivel', 0.14), p: { level: 0.7, size: 1 } },
    { sfx: 'tech', at: A('L06', 'dois', 0.3), p: { count: 10, step: 0.06, level: 0.06 } },
    { sfx: 'pop', at: A('L07', 'restaurante', 0.05), p: { level: 0.3, freq: 480 } },
    { sfx: 'shimmer', at: A('L07', 'restaurante', 0.15), p: { level: 0.12 } },
    { sfx: 'pop', at: A('L08', 'coceira', 0.0), p: { level: 0.25, freq: 600 } },
    { sfx: 'pop', at: A('L08', 'entupido', 0.0), p: { level: 0.25, freq: 540 } },
    { sfx: 'impact', at: A('L08', 'alergia', 0.12), p: { level: 0.6, size: 0.8 } },
    { sfx: 'crack', at: A('L08', 'alergia', 0.1), p: { level: 0.3 } },
    { sfx: 'pop', at: A('L09', 'like', 0.0), p: { level: 0.28, freq: 620 } },
    { sfx: 'ding', at: A('L09', 'like', 0.05), p: { level: 0.12 } },
    { sfx: 'pop', at: A('L09', 'segue', 0.0), p: { level: 0.26, freq: 760 } },
    { sfx: 'riser', at: A('L09', 'porque', 0.0), until: A('L10', 'nivel', 0.0), p: { level: 0.2 } },
    // nível 3
    { sfx: 'braam', at: A('L10', 'nivel', 0.1), p: { dur: 3.5, level: 0.45 } },
    { sfx: 'impact', at: A('L10', 'nivel', 0.14), p: { level: 0.85, size: 1.2 } },
    { sfx: 'alarm', at: A('L10', 'ano', 0.0), until: A('L11', 'milhoes', 0.0), p: { level: 0.06 } },
    { sfx: 'tech', at: A('L10', 'um', 0.0), p: { count: 14, step: 0.05, level: 0.07 } },
    { sfx: 'rumble', at: A('L11', 'milhoes', 0.0), until: A('L12', 'tito', 0.0), p: { level: 0.2 } },
    { sfx: 'pop', at: A('L11', 'fungos', 0.0), p: { level: 0.26, freq: 460 } },
    { sfx: 'pop', at: A('L11', 'manchas', 0.0), p: { level: 0.26, freq: 520 } },
    { sfx: 'wind', at: A('L11', 'cheiro', 0.0), until: A('L12', 'tito', 0.0), p: { level: 0.12 } },
    { sfx: 'steps', at: A('L12', 'tito', 0.0), p: { count: 3, step: 0.3, level: 0.2 } },
    { sfx: 'impact', at: A('L12', 'quarto', 0.0), p: { level: 0.7, size: 1 } },
    { sfx: 'crack', at: A('L12', 'quarto', 0.0), p: { level: 0.35 } },
    // solução
    { sfx: 'whoosh', at: A('L13', 'mas', -0.1), p: { dur: 0.7, level: 0.3, reverse: true } },
    { sfx: 'shimmer', at: A('L13', 'calma', 0.0), p: { level: 0.16 } },
    { sfx: 'whoosh', at: A('L13', 'solucao', 0.1), p: { dur: 0.8, level: 0.28 } },
    { sfx: 'ding', at: A('L13', 'simples', 0.1), p: { level: 0.16 } },
    { sfx: 'ding', at: A('L14', 'semana', 0.15), p: { level: 0.13 } },
    { sfx: 'ding', at: A('L14', 'travesseiro', 0.15), p: { level: 0.13 } },
    { sfx: 'ding', at: A('L14', 'fronhas', 0.15), p: { level: 0.13 } },
    { sfx: 'shimmer', at: A('L15', 'limpa', 0.0), p: { level: 0.14 } },
    { sfx: 'pop', at: A('L15', 'sono', 0.0), p: { level: 0.2, freq: 520 } },
    { sfx: 'ding', at: A('L15', 'tito', 0.2), p: { level: 0.12 } },
    { sfx: 'pop', at: A('L16', 'comenta', 0.0), p: { level: 0.28, freq: 620 } },
    { sfx: 'ding', at: A('L16', 'comenta', 0.05), p: { level: 0.12 } },
  ],

  // ------------------------------ CENAS --------------------------------------
  scenes: [
    // ===== ABERTURA / GANCHO =====
    sc('abertura', { at: 0 }, {
      base: (w) => { clean(w); w.hideTito(); },
      cam: [{ u: 0, pos: [0.5, 1.5, 0.6], look: [0, 0.6, -1.5], fov: 46 }, { u: 1, pos: [0.2, 1.1, -0.3], look: [0, 0.6, -1.7], fov: 44 }],
      hud: (g, c) => drawOpeningTitle(g, c.lt, c.dur, c.t),
    }),
    sc('tito-feliz', A('L01', 'voce'), {
      base: (w) => { clean(w); w.tito.pose.sleep = 1; w.tito.pose.smile = 0.8; w.tito.cur.sleep = 1; w.tito.cur.smile = 0.8; },
      cam: [{ u: 0, pos: [1.6, 1.6, 0.5], look: [-0.4, 0.8, -1.5], fov: 50 }, { u: 1, pos: [1.2, 1.4, 0.0], look: [-0.4, 0.8, -1.6], fov: 48 }],
      hud: (g, c) => led(g, c, 0, 0, A('L01', 'voce', 0.05), A('L01', 'o')),
    }),
    sc('calendario', A('L01', 'o', 0.0), {
      tr: 'zoom',
      base: (w) => { clean(w); w.hideTito(); Object.assign(w.state, { calNum: 0, calNext: 1, calLabel: 'DIA' }); },
      upd: (w, c) => { w.state.calFlip = c.k(A('L01', 'lencol', -0.1), A('L01', 'lencol', 0.45)); },
      cam: [{ u: 0, pos: [1.55, 1.6, -1.2], look: [1.55, 1.55, -2.46], fov: 44 }, { u: 1, pos: [1.55, 1.58, -1.5], look: [1.55, 1.55, -2.46], fov: 40 }],
    }),
    sc('tito-susto', { line: 'L02', offset: -0.04 }, {
      tr: 'whip',
      base: (w) => { clean(w); w.tito.pose.surprise = 1; w.tito.pose.smile = 0; w.tito.cur.surprise = 1; w.tito.cur.smile = 0; },
      upd: (w) => { w.state.sweat = 0.35; },
      cam: [{ u: 0, pos: [-0.3, 2.05, -0.8], look: [-0.4, 1.0, -2.05], fov: 40 }, { u: 1, pos: [-0.35, 1.8, -1.0], look: [-0.4, 1.0, -2.05], fov: 36 }],
      hud: (g, c) => drawThought(g, 'q', 780, 480, { lt: c.since({ line: 'L02', offset: 0.15 }), alpha: 1 }),
    }),
    sc('terco', A('L02', 'terco', -0.05), {
      tr: 'zoom',
      base: (w) => { clean(w); w.tito.pose.sleep = 1; w.tito.pose.smile = 0.5; w.tito.cur.sleep = 1; },
      cam: [{ u: 0, pos: [0, 1.7, 3.3], look: [0, 0.8, -1.4], fov: 52 }, { u: 1, pos: [0, 2.35, 3.6], look: [0, 0.7, -1.4], fov: 54 }],
      hud: (g, c) => {
        drawTag(g, 'UM TERÇO DA VIDA', 540, 560, { dot: COLORS.gold, sub: 'dormindo na cama', alpha: clamp01(c.since(A('L02', 'terco')) / 0.15), scale: 0.9 + 0.1 * clamp01(c.since(A('L02', 'terco')) / 0.3), size: 46 });
        drawZzz(g, c.t, 640, 1020, clamp01(c.since(A('L02', 'deitado')) / 0.4));
      },
    }),

    // ===== NÍVEL 1 · 1 SEMANA =====
    sc('n1-carimbo', A('L03', 'nivel', -0.02), {
      tr: 'whip',
      base: (w) => { lvl1(w, 0.05); w.tito.pose.sleep = 1; w.tito.cur.sleep = 1; w.tito.pose.smile = 0.5; },
      upd: (w, c) => { w.state.dirt = lerp(0.05, 0.3, c.u); w.state.mites = lerp(0, 0.2, c.u); w.state.calNum = Math.round(c.u * 7); },
      cam: [{ u: 0, pos: [1.7, 2.4, 0.5], look: [-0.1, 0.6, -1.5], fov: 50 }, { u: 1, pos: [1.2, 2.1, 0.4], look: [-0.1, 0.6, -1.5], fov: 48 }],
      shake: (w, c) => Math.max(0, 1 - c.since(A('L03', 'nivel', 0.14)) * 5) * 0.05,
      hud: (g, c) => {
        drawLevelStamp(g, 'NÍVEL 1', '1 SEMANA', c.since(A('L03', 'nivel', 0.14)), { y: 470 });
        led(g, c, 0, 7, A('L03', 'um', 0.2), A('L03', 'semana', 0.4));
      },
    }),
    sc('n1-suor', A('L04', 'toda', -0.02), {
      base: (w) => { lvl1(w, 0.3); w.tito.pose.sleep = 1; w.tito.cur.sleep = 1; },
      upd: (w, c) => { w.state.sweat = 1; w.state.flakes = 0.2; },
      cam: [{ u: 0, pos: [-1.0, 1.4, -1.2], look: [-0.4, 0.95, -2.0], fov: 38 }, { u: 1, pos: [-0.85, 1.3, -1.4], look: [-0.4, 0.95, -2.0], fov: 32 }],
      hud: (g, c) => {
        const k = clamp01(c.since(A('L04', 'suor', 0.0)) / 0.2);
        drawTag(g, 'SUOR', 540, 600, { dot: COLORS.blue, sub: 'toda noite', alpha: k, scale: 0.85 + 0.15 * k, size: 52 });
      },
    }),
    sc('n1-pele', A('L04', 'milhares', -0.02), {
      base: (w) => { lvl1(w, 0.4); w.tito.pose.sleep = 1; w.tito.cur.sleep = 1; },
      upd: (w) => { w.state.flakes = 1; },
      cam: [{ u: 0, pos: [0.6, 1.5, -0.8], look: [-0.2, 0.95, -1.8], fov: 44 }, { u: 1, pos: [0.3, 1.3, -1.1], look: [-0.3, 0.9, -1.8], fov: 38 }],
      hud: (g, c) => {
        drawSpeedBadge(g, 'CÂMERA LENTA 0,1x', 'slow', { alpha: 1 });
        const k = clamp01(c.since(A('L04', 'milhares', 0.1)) / 0.2);
        drawTag(g, 'PELE MORTA', 540, 640, { dot: COLORS.orange, sub: 'milhares de células', alpha: k, scale: 0.85 + 0.15 * k, size: 48 });
      },
    }),
    sc('n1-lupa', A('L04', 'de', 0.0, { nth: 1 }), {
      tr: 'zoom',
      base: (w) => { lvl1(w, 0.5); w.hideTito(); w.state.titoInBed = 0; },
      upd: (w) => { w.state.flakes = 1; },
      cam: [{ u: 0, pos: [0.0, 1.0, -0.6], look: [-0.15, 0.62, -1.4], fov: 40 }, { u: 1, pos: [-0.1, 0.85, -0.85], look: [-0.15, 0.62, -1.45], fov: 26 }],
      hud: (g, c) => drawLens(g, 540, 800, 440, c.t, clamp01(c.lt / 0.12)),
    }),
    sc('n1-acaro', A('L05', 'e', -0.02), {
      tr: 'whip',
      base: (w) => { lvl1(w, 0.5); w.state.mites = 0; w.hero(3, { pos: [0.3, 0.625, -1.75], ry: 0.15, scale: 1.5, mood: 'sly' }); },
      cam: [{ u: 0, pos: [0.3, 1.05, -0.7], look: [0.3, 0.76, -1.75], fov: 40 }, { u: 1, pos: [0.3, 0.9, -0.85], look: [0.3, 0.75, -1.75], fov: 34 }],
    }),
    sc('n1-banquete', A('L05', 'feliz', -0.05), {
      base: (w) => {
        lvl1(w, 0.5); w.state.mites = 0.35; w.tito.pose.sleep = 1; w.tito.cur.sleep = 1; w.tito.pose.smile = 0.9;
        w.hero(1, { pos: [0.18, 0.625, -1.4], ry: 0.3, scale: 1.3, mood: 'cheer' });
        w.hero(4, { pos: [0.5, 0.625, -1.25], ry: -0.3, scale: 1.3, mood: 'hungry' });
      },
      upd: (w) => { w.state.flakes = 0.5; },
      cam: [{ u: 0, pos: [1.4, 1.15, -0.5], look: [0.2, 0.7, -1.5], fov: 46 }, { u: 1, pos: [1.1, 1.0, -0.7], look: [0.2, 0.7, -1.5], fov: 42 }],
      hud: (g, c) => {
        const lt = c.since(A('L05', 'feliz', 0.05));
        drawThought(g, 'bed', 280, 540, { lt, tail: 'right', scale: 0.8 });
        drawThought(g, 'fork', 800, 520, { lt: lt - 0.2, tail: 'left', scale: 0.8 });
      },
    }),
    sc('n1-colonia', A('L05', 'os', 0.0), {
      tr: 'zoom',
      base: (w) => { lvl1(w, 0.5); w.hideTito(); w.state.titoInBed = 0; w.state.mites = 0.05; },
      upd: (w, c) => { w.state.mites = lerp(0.05, 1, c.u * c.u); w.state.flakes = 0.3; },
      cam: [{ u: 0, pos: [0, 3.2, -0.6], look: [0, 0.6, -1.4], fov: 46 }, { u: 1, pos: [0.4, 2.7, -0.9], look: [0, 0.6, -1.4], fov: 46 }],
      hud: (g, c) => {
        const n = Math.round(lerp(10, 1000, Math.pow(clamp01(c.u * 1.1), 1.6)));
        drawCounter(g, 'ÁCAROS', n.toLocaleString('pt-BR'), 540, 520, { alpha: clamp01(c.since(A('L05', 'acaros', -0.1)) / 0.2), danger: c.u * 0.6 });
        drawFlyingPage(g, 7, c.since({ at: c.scene.end - 0.85 }));
      },
    }),

    // ===== NÍVEL 2 · 1 MÊS =====
    sc('n2-carimbo', A('L06', 'nivel', -0.02), {
      tr: 'whip',
      base: (w) => { lvl2(w); w.hideTito(); w.state.titoInBed = 0; w.state.mites = 0.6; },
      upd: (w, c) => { w.state.dirt = lerp(0.5, 0.65, c.u); },
      cam: [{ u: 0, pos: [-1.9, 2.1, 0.8], look: [0.1, 0.6, -1.5], fov: 50 }, { u: 1, pos: [-1.5, 1.8, 0.4], look: [0.1, 0.6, -1.5], fov: 48 }],
      shake: (w, c) => Math.max(0, 1 - c.since(A('L06', 'nivel', 0.14)) * 5) * 0.05,
      hud: (g, c) => {
        drawLevelStamp(g, 'NÍVEL 2', '1 MÊS', c.since(A('L06', 'nivel', 0.14)), { y: 470, color: '#FF9A3D' });
        led(g, c, 7, 30, A('L06', 'dois', 0.3), A('L06', 'mes', 0.5));
      },
    }),
    sc('n2-chef', A('L07', 'o', -0.02), {
      tr: 'whip',
      base: (w) => { lvl2(w); w.hideTito(); w.state.titoInBed = 0; w.state.mites = 0.3; w.state.kitchen = 1; w.hero(0, { pos: [0.4, 0.64, -2.0], ry: 0.1, scale: 1.4, mood: 'cheer' }); },
      cam: [{ u: 0, pos: [0.3, 1.1, -0.65], look: [0.5, 0.8, -2.0], fov: 38 }, { u: 1, pos: [0.4, 1.0, -0.85], look: [0.5, 0.8, -2.0], fov: 32 }],
    }),
    sc('n2-neon', A('L07', 'restaurante', 0.0), {
      base: (w) => { lvl2(w); w.hideTito(); w.state.titoInBed = 0; w.state.mites = 0.3; w.state.kitchen = 1; w.state.neon = 1; w.state.lamp = 0.4; w.hero(0, { pos: [0.4, 0.64, -2.0], ry: 0.1, scale: 1.2, mood: 'cheer' }); },
      cam: [{ u: 0, pos: [0.3, 1.0, -0.8], look: [0.5, 0.85, -2.0], fov: 44 }, { u: 1, pos: [0.4, 1.1, -0.8], look: [0.4, 1.3, -2.4], fov: 40 }],
    }),
    sc('n2-fila', A('L07', 'restaurante', 0.85), {
      base: (w) => {
        lvl2(w); w.hideTito(); w.state.titoInBed = 0; w.state.mites = 0.5; w.state.kitchen = 1; w.state.neon = 1; w.state.lamp = 0.4;
        [[0.0, 3], [0.2, 1], [0.4, 4]].forEach(([x, i], k) => w.hero(i, { pos: [-0.2 + x, 0.625, -1.55], ry: Math.PI / 2, scale: 1.1, mood: 'hungry' }));
      },
      cam: [{ u: 0, pos: [-0.6, 1.0, -0.4], look: [0.2, 0.68, -1.55], fov: 44 }, { u: 1, pos: [-0.3, 0.95, -0.4], look: [0.2, 0.68, -1.55], fov: 40 }],
    }),
    sc('n2-travesseiro', A('L07', 'seu', -0.02), {
      tr: 'whip',
      base: (w) => { lvl2(w); w.hideTito(); w.state.titoInBed = 0; w.state.mites = 0.4; w.state.kitchen = 1; w.state.neon = 1; w.state.lamp = 0.4; w.hero(0, { pos: [0.4, 0.64, -2.0], ry: 0.1, scale: 1.3, mood: 'cheer' }); w.hero(3, { pos: [0.7, 0.64, -1.9], ry: -0.5, scale: 1.2, mood: 'happy' }); },
      cam: [{ u: 0, pos: [1.4, 1.25, -0.8], look: [0.45, 0.8, -2.05], fov: 42 }, { u: 1, pos: [1.1, 1.1, -0.9], look: [0.45, 0.8, -2.05], fov: 36 }],
    }),
    sc('n2-cozinha', A('L07', 'a', 0.0), {
      base: (w) => { lvl2(w); w.hideTito(); w.state.titoInBed = 0; w.state.kitchen = 1; w.state.mites = 0.3; w.state.lamp = 0.5; w.hero(0, { pos: [0.4, 0.64, -2.0], ry: 0.3, scale: 1.3, mood: 'cheer' }); },
      cam: [{ u: 0, pos: [1.1, 1.05, -1.1], look: [0.52, 0.8, -2.0], fov: 36 }, { u: 1, pos: [1.0, 1.0, -1.2], look: [0.52, 0.8, -2.0], fov: 30 }],
    }),
    sc('n2-coceira', A('L08', 'ai', -0.02), {
      tr: 'whip',
      base: (w) => { lvl2(w); w.state.mites = 0.5; w.tito.pose.sleep = 0.2; w.tito.pose.surprise = 0.3; w.tito.cur.surprise = 0.3; },
      upd: (w) => { w.tito.pose.shake = 1; w.tito.pose.sleep = 0; },
      cam: [{ u: 0, pos: [-0.2, 2.0, -0.7], look: [-0.4, 1.0, -2.05], fov: 40 }, { u: 1, pos: [-0.3, 1.8, -0.95], look: [-0.4, 1.0, -2.05], fov: 35 }],
      hud: (g, c) => {
        const k = clamp01(c.since(A('L08', 'coceira', 0.0)) / 0.2);
        drawTag(g, 'COCEIRA', 540, 600, { dot: COLORS.red, alpha: k, scale: 0.85 + 0.15 * k, size: 56 });
      },
    }),
    sc('n2-nariz', A('L08', 'nariz', -0.05), {
      base: (w) => { lvl2(w); w.state.mites = 0.5; w.tito.pose.scared = 0.6; w.tito.cur.scared = 0.6; w.tito.pose.surprise = 0.4; w.tito.cur.surprise = 0.4; },
      upd: (w) => { w.state.sweat = 0.3; w.state.dust = 0.3; },
      cam: [{ u: 0, pos: [-0.4, 1.75, -1.1], look: [-0.4, 1.0, -2.1], fov: 34 }, { u: 1, pos: [-0.4, 1.6, -1.3], look: [-0.4, 1.0, -2.1], fov: 28 }],
      hud: (g, c) => {
        const k = clamp01(c.since(A('L08', 'entupido', 0.0)) / 0.2);
        drawTag(g, 'NARIZ ENTUPIDO', 540, 600, { dot: COLORS.red, alpha: k, scale: 0.85 + 0.15 * k, size: 50 });
      },
    }),
    sc('n2-alergia', A('L08', 'alergia', -0.04), {
      tr: 'flash',
      base: (w) => { lvl2(w); w.state.mites = 0.6; w.tito.pose.surprise = 1; w.tito.cur.surprise = 1; w.tito.pose.scared = 0.6; },
      upd: (w, c) => {
        const s = c.since(A('L08', 'alergia', 0.12));
        w.state.bedShake = s > 0 ? Math.max(0, 1 - s * 1.5) * 2 : 0;
        w.state.dust = s > 0 && s < 1 ? 1 : 0;
        if (s > 0 && !w._f.puff) { w._f.puff = 1; w.puff([-0.4, 1.0, -1.7], 120, 1.6); }
      },
      cam: [{ u: 0, pos: [0.4, 1.6, -0.7], look: [-0.4, 0.95, -1.9], fov: 46 }, { u: 1, pos: [0.2, 1.55, -0.9], look: [-0.4, 0.95, -1.9], fov: 40 }],
      shake: (w, c) => Math.max(0, 1 - c.since(A('L08', 'alergia', 0.12)) * 2) * 0.09,
      hud: (g, c) => {
        drawPopText(g, 'ATCHIM!', 540, 420, c.since(A('L08', 'alergia', 0.1)), { dur: 1.0 });
        drawMark(g, 'no', 800, 620, 64, 1, c.since(A('L08', 'alergia', 0.2)));
        drawTag(g, 'ALERGIA', 400, 620, { dot: COLORS.red, alpha: clamp01(c.since(A('L08', 'alergia', 0.2)) / 0.2), size: 48 });
      },
    }),
    sc('n2-predio', A('L09', 'se', -0.02), {
      tr: 'whip',
      base: (w) => { lvl2(w); w.hideTito(); w.state.titoInBed = 0; w.state.mites = 0.9; w.state.mood = 0.45; w.state.dirt = 0.75; },
      upd: (w, c) => { w.state.city = Math.pow(c.u, 0.8); },
      cam: [{ u: 0, pos: [0.0, 0.9, 0.9], look: [0, 1.0, -1.3], fov: 50 }, { u: 1, pos: [0.4, 1.4, 1.5], look: [0, 1.5, -1.3], fov: 54 }],
      hud: (g, c) => {
        const n = Math.round(lerp(1000, 100000, Math.pow(c.u, 1.5)) / 1000) * 1000;
        drawCounter(g, 'ÁCAROS', n.toLocaleString('pt-BR'), 540, 520, { alpha: 1, danger: c.u * 0.9 });
      },
    }),
    sc('n2-cta', A('L09', 'deixa', 0.0), {
      base: (w) => { lvl2(w); w.hideTito(); w.state.titoInBed = 0; w.state.mites = 1; w.state.mood = 0.5; w.state.dirt = 0.8; w.state.city = 1; },
      cam: [{ u: 0, pos: [-1.8, 1.5, 0.9], look: [0, 1.0, -1.3], fov: 50 }, { u: 1, pos: [-1.2, 1.7, 1.3], look: [0, 1.1, -1.3], fov: 50 }],
      hud: (g, c) => {
        const L = c.tl.byId.L09;
        drawMidCTA(g, c.since(A('L09', 'deixa', -0.2)), L.end - c.T(A('L09', 'deixa', -0.2)) + 0.3, c.t);
      },
    }),
    sc('n2-fusao', A('L09', 'nivel', -0.02), {
      tr: 'zoom',
      base: (w) => { lvl2(w); w.hideTito(); w.state.titoInBed = 0; w.state.mood = 0.55; Object.assign(w.state, { calLabel: 'DIA', calNum: 30, calNext: 31 }); },
      upd: (w, c) => {
        const n = c.lt * 9, i = Math.floor(n);
        Object.assign(w.state, { calNum: 30 + i, calNext: 31 + i, calFlip: n - i, mood: lerp(0.55, 0.9, c.u), dirt: lerp(0.8, 1, c.u) });
      },
      cam: [{ u: 0, pos: [1.55, 1.6, -1.3], look: [1.55, 1.55, -2.46], fov: 44 }, { u: 1, pos: [1.55, 1.58, -1.55], look: [1.55, 1.55, -2.46], fov: 38 }],
      hud: (g, c) => drawMoodTint(g, [70, 130, 30], c.u * 0.6),
    }),

    // ===== NÍVEL 3 · 1 ANO =====
    sc('n3-carimbo', A('L10', 'nivel', -0.02), {
      tr: 'flash',
      base: (w) => { lvl3(w); },
      upd: (w) => { w.state.stink = 0.6; },
      cam: [{ u: 0, pos: [0, 1.9, 3.0], look: [0, 0.8, -1.4], fov: 52 }, { u: 1, pos: [0, 1.7, 2.4], look: [0, 0.8, -1.4], fov: 50 }],
      shake: (w, c) => Math.max(0, 1 - c.since(A('L10', 'nivel', 0.14)) * 4) * 0.08,
      hud: (g, c) => {
        drawMoodTint(g, [60, 110, 20], 0.55);
        drawLevelStamp(g, 'NÍVEL 3', '1 ANO', c.since(A('L10', 'nivel', 0.14)), { y: 470, color: '#FF5A4D' });
      },
    }),
    sc('n3-ano', A('L10', 'um', 0.0), {
      base: (w) => { lvl3(w); },
      cam: [{ u: 0, pos: [0.6, 1.4, 0.4], look: [0, 0.85, -1.4], fov: 50 }, { u: 1, pos: [0.3, 1.1, -0.3], look: [0, 0.75, -1.5], fov: 46 }],
      shake: () => 0.012,
      hud: (g, c) => {
        drawMoodTint(g, [60, 110, 20], 0.55);
        const k = c.k(A('L10', 'um', 0.1), A('L10', 'inteiro', 0.2)), n = Math.round(lerp(30, 365, k));
        const blink = Math.sin(c.t * 14) > 0 ? 1 : 0.55;
        drawLedPanel(g, 'SEM TROCAR HÁ:', `${n} DIAS`, 540, 520, { alpha: blink * 0.5 + 0.5, danger: k, scale: 1.0 });
      },
    }),
    sc('n3-milhoes', A('L11', 'milhoes', -0.03), {
      tr: 'whip',
      base: (w) => { lvl3(w); w.state.miteScale = 1.0; },
      cam: [{ u: 0, pos: [0.6, 1.6, 0.5], look: [0.0, 0.66, -1.65], fov: 40 }, { u: 1, pos: [0.4, 1.35, 0.1], look: [0.0, 0.66, -1.65], fov: 36 }],
      hud: (g, c) => {
        drawMoodTint(g, [60, 110, 20], 0.5);
        drawSpeedBadge(g, 'CÂMERA LENTA 0,05x', 'slow');
        const k = clamp01(c.since(A('L11', 'milhoes', 0.1)) / 0.2);
        drawTag(g, 'MILHÕES DE ÁCAROS', 540, 640, { dot: COLORS.gold, alpha: k, scale: 0.85 + 0.15 * k, size: 46 });
      },
    }),
    sc('n3-fungos', A('L11', 'fungos', -0.03), {
      base: (w) => { lvl3(w); w.state.mites = 0.3; },
      cam: [{ u: 0, pos: [-0.35, 0.95, -1.15], look: [-0.45, 0.65, -1.85], fov: 34 }, { u: 1, pos: [-0.42, 0.82, -1.3], look: [-0.45, 0.65, -1.85], fov: 26 }],
      hud: (g, c) => {
        drawMoodTint(g, [60, 110, 20], 0.5);
        const k = clamp01(c.since(A('L11', 'fungos', 0.05)) / 0.2);
        drawTag(g, 'FUNGOS', 540, 640, { dot: COLORS.green, alpha: k, scale: 0.85 + 0.15 * k, size: 56 });
      },
    }),
    sc('n3-manchas', A('L11', 'manchas', -0.03), {
      tr: 'whip',
      base: (w) => { lvl3(w); w.state.mites = 0.2; },
      cam: [{ u: 0, pos: [0.3, 1.1, -1.4], look: [-0.4, 0.74, -2.1], fov: 40 }, { u: 1, pos: [0.0, 0.95, -1.55], look: [-0.4, 0.74, -2.1], fov: 32 }],
      hud: (g, c) => {
        drawMoodTint(g, [60, 110, 20], 0.5);
        const k = clamp01(c.since(A('L11', 'manchas', 0.05)) / 0.2);
        drawTag(g, 'MANCHAS', 540, 640, { dot: COLORS.orange, alpha: k, scale: 0.85 + 0.15 * k, size: 56 });
      },
    }),
    sc('n3-cheiro', A('L11', 'um', -0.03), {
      base: (w) => { lvl3(w); w.state.stink = 1; },
      upd: (w) => { w.state.stink = 1; },
      cam: [{ u: 0, pos: [1.6, 1.2, 0.5], look: [0, 1.0, -1.4], fov: 52 }, { u: 1, pos: [1.0, 1.5, 0.0], look: [0, 1.1, -1.4], fov: 50 }],
      hud: (g, c) => {
        drawMoodTint(g, [70, 130, 20], 0.7);
        const k = clamp01(c.since(A('L11', 'cheiro', 0.0)) / 0.2);
        drawTag(g, 'CHEIRO', 540, 640, { dot: COLORS.green, alpha: k, scale: 0.85 + 0.15 * k, size: 56 });
      },
    }),
    sc('n3-selva', A('L11', 'aguenta', -0.03), {
      tr: 'zoom',
      base: (w) => { lvl3(w); w.state.stink = 1; },
      upd: (w, c) => { w.state.jungle = c.k({ local: 0 }, { local: 0.6 }); },
      cam: [{ u: 0, pos: [0, 1.0, 0.5], look: [0, 0.9, -1.4], fov: 55 }, { u: 1, pos: [0, 1.5, 0.9], look: [0, 0.9, -1.4], fov: 50 }],
      hud: (g, c) => { drawMoodTint(g, [70, 130, 20], 0.6); },
    }),
    sc('n3-porta', A('L12', 'o', -0.02), {
      tr: 'whip',
      base: (w) => {
        lvl3(w); w.state.doorOpen = 1; w.setTitoStanding(2.15, 1.55, -Math.PI / 2);
        w.tito.pose.cover = 1; w.tito.pose.scared = 0.8; w.tito.cur.cover = 1; w.tito.cur.scared = 0.8;
      },
      upd: (w) => { w.state.sweat = 0; },
      cam: [{ u: 0, pos: [-0.9, 1.4, 0.7], look: [2.3, 1.1, 1.6], fov: 46 }, { u: 1, pos: [-0.5, 1.35, 0.9], look: [2.3, 1.1, 1.6], fov: 40 }],
      hud: (g, c) => drawMoodTint(g, [70, 130, 20], 0.5),
    }),
    sc('n3-nao-entra', A('L12', 'entrar', -0.03), {
      base: (w) => {
        lvl3(w); w.state.doorOpen = 1; w.setTitoStanding(2.0, 1.55, -Math.PI / 2);
        w.tito.pose.cover = 1; w.tito.pose.scared = 0.8; w.tito.cur.cover = 1; w.tito.cur.scared = 0.8;
      },
      upd: (w, c) => {
        const out = c.k(A('L12', 'entrar', 0.0), A('L12', 'quarto', 0.0));
        w.setTitoStanding(lerp(2.0, 2.62, out), 1.55, -Math.PI / 2);
        w.tito.pose.walk = out > 0 && out < 1 ? 1 : 0;
        w.state.doorOpen = 1 - c.k(A('L12', 'quarto', 0.0), A('L12', 'quarto', 0.18));
      },
      cam: [{ u: 0, pos: [-1.2, 1.6, 0.4], look: [2.3, 1.1, 1.6], fov: 50 }, { u: 1, pos: [-0.6, 1.5, 0.7], look: [2.3, 1.1, 1.6], fov: 46 }],
      hud: (g, c) => {
        drawMoodTint(g, [70, 130, 20], 0.5);
        drawMark(g, 'no', 540, 620, 78, 1, c.since(A('L12', 'quarto', 0.0)));
      },
    }),

    // ===== A SOLUÇÃO =====
    sc('rebobina', A('L13', 'mas', -0.03), {
      tr: 'glitch',
      base: (w) => { lvl3(w); },
      upd: (w, c) => {
        const k = c.k({ local: 0.0 }, { local: 1.0 });
        Object.assign(w.state, { dirt: lerp(1, 0.4, k), mold: lerp(1, 0, k), mood: lerp(1, 0, k), flies: 1 - k, stink: 1 - k, mites: lerp(1, 0.2, k), calNum: Math.round(lerp(365, 330, k)) });
        w.state.calNext = w.state.calNum + 1; w.state.calFlip = 1 - ((c.lt * 7) % 1);
      },
      cam: [{ u: 0, pos: [0, 1.9, 3.0], look: [0, 0.8, -1.4], fov: 52 }, { u: 1, pos: [0, 1.8, 3.2], look: [0, 0.8, -1.4], fov: 54 }],
      hud: (g, c) => {
        drawRewindFx(g, c.t, 1);
        drawSpeedBadge(g, 'REBOBINANDO', 'rew', { t: c.t });
        drawMoodTint(g, [70, 130, 20], 0.55 * (1 - c.u));
      },
    }),
    sc('novo-lencol', A('L13', 'solucao', -0.04), {
      tr: 'whip',
      base: (w) => { clean(w); w.hideTito(); w.state.titoInBed = 0; w.state.dirt = 0.4; w.state.mites = 0.4; w.state.newSheet = -0.45; w.hero(2, { pos: [0.5, 0.625, -1.0], ry: 1.2, scale: 1.3, mood: 'scared' }); },
      upd: (w, c) => { w.state.newSheet = lerp(-0.4, 1.05, c.u); w.state.mites = lerp(0.4, 0.45, c.u); },
      cam: [{ u: 0, pos: [1.8, 2.2, 0.6], look: [0, 0.9, -1.4], fov: 50 }, { u: 1, pos: [1.3, 1.5, 0.1], look: [0, 0.7, -1.4], fov: 46 }],
      hud: (g, c) => drawSpeedBadge(g, 'CÂMERA LENTA 0,1x', 'slow'),
    }),
    sc('fuga', A('L13', 'simples', 0.3), {
      base: (w) => { clean(w); w.hideTito(); w.state.titoInBed = 0; w.state.dirt = 0.4; w.state.newSheet = 1; w.state.mites = 0.7; w.state.miteRun = 1; },
      upd: (w, c) => {
        w.state.flee = c.k({ local: 0.0 }, { local: 1.0 });
        const f = w.state.flee;
        w.hero(2, { pos: [lerp(0.5, 3.4, f), 0.03 + (1 - f) * 0.59, lerp(-1.0, -0.3, f)], ry: Math.PI / 2, scale: 1.4, mood: 'scared', run: 1 });
        w.hero(3, { pos: [lerp(-0.3, -3.2, f), 0.03 + (1 - f) * 0.59, lerp(-1.3, -0.2, f)], ry: -Math.PI / 2, scale: 1.2, mood: 'scared', run: 1 });
      },
      cam: [{ u: 0, pos: [0, 1.5, 1.6], look: [0, 0.5, -1.0], fov: 56 }, { u: 1, pos: [0.4, 1.1, 1.4], look: [0.4, 0.4, -0.8], fov: 56 }],
    }),
    sc('semanal', A('L14', 'troque', -0.02), {
      tr: 'zoom',
      base: (w) => { bright(w); Object.assign(w.state, { calLabel: 'SEMANAL', calNum: 7, calNext: 14, titoInBed: 0 }); w.state.newSheet = 1; w.state.dirt = 0; w.state.mites = 0; },
      upd: (w, c) => { w.state.calFlip = c.k(A('L14', 'semana', 0.2), A('L14', 'semana', 0.65)); },
      cam: [{ u: 0, pos: [1.55, 1.6, -1.2], look: [1.55, 1.55, -2.46], fov: 44 }, { u: 1, pos: [1.55, 1.58, -1.5], look: [1.55, 1.55, -2.46], fov: 40 }],
      hud: (g, c) => check(g, c),
    }),
    sc('fronha', A('L14', 'travesseiro', -0.15), {
      base: (w) => { bright(w); w.state.newSheet = 1; w.state.dirt = 0; w.state.mites = 0; },
      cam: [{ u: 0, pos: [1.0, 1.25, -0.6], look: [0.1, 0.7, -2.1], fov: 46 }, { u: 1, pos: [0.3, 1.2, -0.8], look: [0.0, 0.72, -2.1], fov: 42 }],
      hud: (g, c) => check(g, c),
    }),
    sc('dias', A('L14', 'cada', -0.1), {
      tr: 'whip',
      base: (w) => { bright(w); Object.assign(w.state, { calLabel: 'A CADA', calNum: 2, calNext: 3, newSheet: 1 }); w.state.dirt = 0; },
      upd: (w, c) => { const n = c.lt * 1.8; w.state.calFlip = n % 1; w.state.calNum = 2 + Math.floor(n) % 2; w.state.calNext = 2 + (Math.floor(n) + 1) % 2; },
      cam: [{ u: 0, pos: [1.55, 1.6, -1.2], look: [1.55, 1.55, -2.46], fov: 44 }, { u: 1, pos: [1.55, 1.58, -1.45], look: [1.55, 1.55, -2.46], fov: 40 }],
      hud: (g, c) => check(g, c),
    }),
    sc('quarto-limpo', A('L14', 'dias', 0.15), {
      base: (w) => { bright(w); w.state.newSheet = 1; w.state.dirt = 0; w.state.mites = 0; },
      cam: [{ u: 0, pos: [-1.9, 1.8, 2.2], look: [0, 0.8, -1.4], fov: 52 }, { u: 1, pos: [-1.2, 1.7, 2.0], look: [0, 0.8, -1.4], fov: 50 }],
      hud: (g, c) => check(g, c),
    }),
    sc('limpa', A('L15', 'cama', -0.03), {
      tr: 'whip',
      base: (w) => { bright(w); w.state.newSheet = 1; w.state.dirt = 0; w.state.day = 0.9; },
      upd: (w) => { w.state.dust = 0.15; },
      cam: [{ u: 0, pos: [1.5, 1.7, 1.4], look: [0, 0.8, -1.4], fov: 50 }, { u: 1, pos: [0.8, 1.4, 0.8], look: [0, 0.75, -1.5], fov: 46 }],
      hud: (g, c) => {
        const k = clamp01(c.since(A('L15', 'limpa', 0.0)) / 0.2);
        drawMark(g, 'ok', 540, 600, 74, k, c.since(A('L15', 'limpa', 0.0)));
        drawTag(g, 'CAMA LIMPA', 540, 760, { dot: COLORS.green, alpha: k, size: 52 });
      },
    }),
    sc('sono', A('L15', 'sono', -0.03), {
      base: (w) => { clean(w); w.state.newSheet = 1; w.state.dirt = 0; w.state.lamp = 0.7; w.tito.pose.sleep = 1; w.tito.cur.sleep = 1; w.tito.pose.smile = 1; w.tito.cur.smile = 1; },
      cam: [{ u: 0, pos: [1.4, 1.5, -0.4], look: [-0.4, 0.9, -1.7], fov: 48 }, { u: 1, pos: [1.0, 1.3, -0.7], look: [-0.4, 0.9, -1.8], fov: 42 }],
      hud: (g, c) => {
        drawThought(g, 'moon', 800, 520, { lt: c.since(A('L15', 'sono', 0.1)), tail: 'left', scale: 0.8 });
        drawZzz(g, c.t, 560, 1060, 1);
      },
    }),
    sc('acorda', A('L15', 'o', -0.02, { nth: 0 }), {
      tr: 'flash',
      base: (w) => { bright(w); w.state.newSheet = 1; w.state.dirt = 0; w.setTitoStanding(-1.15, -1.3, 0.35); w.tito.pose.armsUp = 1; w.tito.pose.smile = 1; w.tito.cur.armsUp = 1; w.tito.cur.smile = 1; },
      upd: (w, c) => { w.tito.pose.wave = c.k(A('L15', 'agradece', -0.1), A('L15', 'agradece', 0.2)); w.tito.pose.armsUp = 1 - w.tito.pose.wave; w.state.dust = 0.1; },
      cam: [{ u: 0, pos: [0.5, 1.5, 1.4], look: [-0.9, 1.0, -1.4], fov: 46 }, { u: 1, pos: [0.0, 1.45, 1.0], look: [-1.0, 1.0, -1.4], fov: 40 }],
    }),
    sc('pergunta', { line: 'L16', offset: -0.02 }, {
      tr: 'whip',
      base: (w) => { bright(w); Object.assign(w.state, { calLabel: 'ÚLTIMA VEZ', calNum: '?', calNext: '?', newSheet: 1, dirt: 0 }); },
      cam: [{ u: 0, pos: [1.55, 1.6, -1.1], look: [1.55, 1.55, -2.46], fov: 46 }, { u: 1, pos: [1.55, 1.58, -1.5], look: [1.55, 1.55, -2.46], fov: 36 }],
      hud: (g, c) => {
        const k = clamp01(c.since(A('L16', 'quando', 0.0)) / 0.25);
        drawThought(g, 'q', 540, 520, { lt: c.since(A('L16', 'quando', 0.0)), tail: 'left' });
        drawTag(g, 'QUANDO FOI A ÚLTIMA VEZ?', 540, 760, { dot: COLORS.gold, alpha: k, size: 40 });
      },
    }),
    sc('comenta', A('L16', 'trocou', 0.3), {
      tr: 'zoom',
      base: (w) => { bright(w); w.state.newSheet = 1; w.state.dirt = 0; w.setTitoStanding(0.0, 0.7, 0.0); w.tito.pose.smile = 1; w.tito.cur.smile = 1; },
      upd: (w, c) => { w.tito.pose.wave = c.k(A('L16', 'comenta', -0.2), A('L16', 'comenta', 0.2)); },
      cam: [{ u: 0, pos: [0.2, 1.4, 3.4], look: [0, 1.15, 0.7], fov: 40 }, { u: 1, pos: [0.1, 1.35, 2.8], look: [0, 1.2, 0.7], fov: 36 }],
      hud: (g, c) => {
        const a = c.k(A('L16', 'comenta', 0.0), A('L16', 'comenta', 0.3));
        drawChip(g, 'COMENTA AÍ 💬', 540, 330, { size: 54, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.blue });
      },
    }),

    // ===== TELA FINAL =====
    sc('final', FIN, {
      tr: 'flash', dur: 6.8, noBug: true, noSubtitles: true,
      base: (w) => { bright(w); w.state.newSheet = 1; w.state.dirt = 0; w.setTitoStanding(-1.15, -1.3, 0.35); },
      cam: [{ u: 0, pos: [0.5, 1.6, 2.4], look: [-0.5, 1.0, -1.4], fov: 54 }, { u: 1, pos: [-0.2, 1.6, 2.9], look: [-0.3, 1.0, -1.4], fov: 56 }],
      cues: [
        { sfx: 'logo', at: { local: 0.15 }, p: { level: 0.55 } },
        { sfx: 'whoosh', at: { local: 1.3 }, p: { dur: 0.5, level: 0.2 } },
        { sfx: 'pop', at: { local: 2.1 }, p: { level: 0.3, freq: 500 } },
        { sfx: 'ding', at: { local: 2.15 }, p: { level: 0.12 } },
        { sfx: 'pop', at: { local: 2.45 }, p: { level: 0.3, freq: 620 } },
        { sfx: 'pop', at: { local: 2.8 }, p: { level: 0.3, freq: 760 } },
        { sfx: 'shimmer', at: { local: 3.1 }, p: { level: 0.1 } },
      ],
      hud: (g, c) => drawEndCard(g, c.lt, c.dur, c.t),
    }),
  ],
};

