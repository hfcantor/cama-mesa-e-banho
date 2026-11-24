// ============================================================================
//  E SE...? — Episódio 04: "E se a gente nunca tivesse descoberto o fogo?"
//  HISTÓRIAS DO TABOCAL  ·  estilo bonequinho 2D (js/render/toon.js)
// ----------------------------------------------------------------------------
//  Único número do texto: nossos ancestrais já controlavam o fogo há cerca de
//  1 milhão de anos (indícios na caverna Wonderwerk, África do Sul, ~1 Ma —
//  Berna et al., PNAS, 2012). O resto é ficção divertida.
//
//  NARRAÇÃO: audio/ep04/narracao/L01 ... L12 (tools/gerar_narracao.py ep04).
// ============================================================================
import { drawOpeningTitle, drawMidCTA, drawChip, drawEndCard, COLORS } from '../../js/render/overlays.js';
import { drawStickman, drawCave, drawFire, drawEyes, drawBreath, drawMeat, drawIcon, drawX, tint, darkness, glow, vignette, groundShadow, jit, clamp01, lerp, INK } from '../../js/render/toon.js';

const FLOOR = 1500; // pés do Tito: a cabeça fica acima da faixa das legendas
const S = 0.85;

function cam(g, { zoom = 1, px = 0, py = 0, shake = 0, t = 0 } = {}) {
  g.save();
  g.translate(540 + px + jit(t, 1, shake), 960 + py + jit(t, 2, shake));
  g.scale(zoom, zoom); g.translate(-540, -960);
}
const idle = (t, extra = {}) => ({ bob: Math.sin(t * 2.2) * 3, blink: (t % 3.7) < 0.12 ? 1 : 0, ...extra });
// o Tito das cavernas: túnica de pele de onça e cabelo espetado, como na referência
function caveman(g, t, x, y, pose = {}, o = {}) {
  return drawStickman(g, t, { x, y, s: S, tunic: '#e08a2e', spots: '#5a2f12', hat: false, pose: idle(t, pose), ...o });
}
const shiver = (t, a = 1) => ({ lean: jit(t, 7, 0.03 * a), tilt: jit(t, 8, 0.05 * a) });
const hug = { armL: -1.0, armR: -1.0 };

export default {
  id: 'ep04',
  titulo: 'E se a gente nunca tivesse descoberto o fogo?',
  roteiroStatus: 'aprovado',
  intro: 1.25,
  narration: {
    dir: 'audio/ep04/narracao/',
    formats: ['wav', 'mp3'],
    timings: 'audio/ep04/narracao/timings.json',
  },

  // ---------------------------- ROTEIRO ----------------------------------
  lines: [
    { id: 'L01', text: 'E se... a gente nunca tivesse descoberto o fogo?', emph: { gente: 'gold', nunca: 'red', fogo: 'orange' }, pause: 0.7 },
    { id: 'L02', text: 'Numa noite fria, há muito tempo, o Tito tremia dentro da caverna.', emph: { fria: 'blue', tito: 'gold', tremia: 'blue', caverna: 'gold' }, pause: 0.45 },
    { id: 'L03', text: 'Sem fogo, a caverna era escura. E o escuro tinha olhos.', emph: { fogo: 'orange', escura: 'red', olhos: 'gold' }, pause: 0.7 },
    { id: 'L04', text: 'Sem fogo, a comida só podia ser crua. Raiz crua, carne crua… e muita mastigação.', emph: { crua: 'red', raiz: 'green', carne: 'orange', mastigacao: 'gold' }, pause: 0.55 },
    { id: 'L05', text: 'Sem fogo, não havia calor, nem luz, nem um jeito de afastar os bichos.', emph: { calor: 'orange', luz: 'gold', bichos: 'red' }, pause: 0.5 },
    { id: 'L06', text: 'Se tá curtindo, já deixa o like e segue o perfil… porque a coisa só piora sem o fogo.', emph: { like: 'red', segue: 'gold', piora: 'red', fogo: 'orange' }, pause: 0.55 },
    { id: 'L07', text: 'Sem fogo, nada de cerâmica, nada de metal.', emph: { ceramica: 'orange', metal: 'blue' }, pause: 0.35 },
    { id: 'L08', text: 'E sem metal, nada de ferramentas, nada de pontes, nada de foguetes.', emph: { ferramentas: 'gold', pontes: 'gold', foguetes: 'gold' }, pause: 0.7 },
    { id: 'L09', text: 'O Tito ainda estaria lá, tremendo e mastigando.', emph: { tito: 'gold', tremendo: 'blue', mastigando: 'orange' }, pause: 0.7 },
    { id: 'L10', text: 'Mas calma. Na vida real, nossos ancestrais já controlavam o fogo há cerca de um milhão de anos.', emph: { calma: 'green', ancestrais: 'gold', fogo: 'orange', milhao: 'gold', anos: 'gold' }, pause: 0.55 },
    { id: 'L11', text: 'Ou seja… o Tito pode dormir quentinho.', emph: { dormir: 'green', quentinho: 'orange' }, pause: 0.8 },
    { id: 'L12', text: 'E você? O que você faria sem fogo? Comenta aí!', emph: { voce: 'gold', fogo: 'orange', comenta: 'blue' }, pause: 0.6 },
  ],

  cues: [],

  // ------------------------------ CENAS ----------------------------------
  scenes: [
    // 1. ABERTURA — Tito na caverna, de dia (como na referência)
    {
      id: 'abertura', world: 'blank', start: { at: 0 }, transition: 'fade',
      music: { mood: 'wonder', intensity: 0.45 },
      cues: [
        { sfx: 'logo', at: { local: 0.35 }, p: { level: 0.45 } },
        { sfx: 'whoosh', at: { local: 0.2 }, p: { dur: 0.8, level: 0.3 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        cam(g, { zoom: lerp(1, 1.08, c.u), t });
        drawCave(g, t);
        groundShadow(g, 540, FLOOR + 14, 130);
        caveman(g, t, 540, FLOOR, { smile: 0.9, armL: 2.4, armR: 2.4 }, { s: 0.7 });
        g.restore(); vignette(g, 0.6);
        drawOpeningTitle(g, c.lt, c.dur, c.t);
      },
    },

    // 2. GANCHO — noite fria, Tito tremendo
    {
      id: 'caverna', world: 'blank', start: { line: 'L02', offset: -0.35 }, transition: 'cut',
      music: { mood: 'mystery', intensity: 0.5 },
      cues: [
        { sfx: 'wind', span: 'scene', p: { level: 0.14 } },
        { sfx: 'crickets', span: 'scene', p: { level: 0.04 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const cold = c.k({ line: 'L02', word: 'fria' }, { line: 'L02', word: 'tremia' });
        cam(g, { zoom: lerp(1.0, 1.18, c.u), py: lerp(0, -30, c.u), t });
        drawCave(g, t, { night: 1 });
        groundShadow(g, 540, FLOOR + 14, 130);
        caveman(g, t, 540 + jit(t, 3, 4 * cold), FLOOR, { smile: -0.6, ...hug, ...shiver(t, cold), eyeX: 0, brow: -0.6 * cold });
        drawBreath(g, t, 590, 1100, 0.9);
        g.restore();
        tint(g, '#8fa6e8', 0.35 + 0.2 * cold); vignette(g, 0.65);
      },
    },

    // 3. SEM FOGO, O ESCURO TEM OLHOS
    {
      id: 'escuro', world: 'blank', start: { line: 'L03', offset: -0.35 }, transition: 'cut',
      music: { mood: 'tension', intensity: 0.65 },
      cues: [
        { sfx: 'heartbeat', at: { line: 'L03', word: 'escura' }, until: { after: 'L03' }, p: { bpm: 70, bpmEnd: 105, level: 0.7 } },
        { sfx: 'braam', at: { line: 'L03', word: 'olhos' }, p: { dur: 2.6, level: 0.4 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const dark = c.k({ line: 'L03', word: 'escura', offset: -0.2 }, { line: 'L03', word: 'escura', offset: 0.5 });
        const eyes = c.k({ line: 'L03', word: 'olhos', offset: -0.2 }, { line: 'L03', word: 'olhos', offset: 0.3 });
        cam(g, { zoom: 1.1, t, shake: eyes * 2 });
        drawCave(g, t, { night: 1 });
        groundShadow(g, 540, FLOOR + 14, 130);
        caveman(g, t, 540 + jit(t, 3, 3), FLOOR, { smile: -0.8, mouth: eyes * 0.7, surprise: eyes, sweat: eyes, armL: lerp(-1, 0.7, eyes), armR: lerp(-1, 0.7, eyes), ...shiver(t, 1), eyeX: 1, brow: -0.4 });
        g.restore();
        tint(g, '#8fa6e8', 0.45);
        darkness(g, 0.4 + dark * 0.55, 540, 1040, lerp(520, 330, dark));
        if (eyes > 0.01) { g.globalAlpha = eyes; drawEyes(g, 800, 1190 - eyes * 20, lerp(0.7, 1.15, eyes), (t % 2.4) < 0.15 ? 1 : 0); drawEyes(g, 200, 1330, 0.6 * eyes, (t % 3.1) < 0.12 ? 1 : 0); g.globalAlpha = 1; }
        vignette(g, 0.7);
      },
    },

    // 4. COMIDA CRUA
    {
      id: 'crua', world: 'blank', start: { line: 'L04', offset: -0.35 }, transition: 'cut',
      music: { mood: 'mystery', intensity: 0.55 },
      cues: [
        { sfx: 'pop', at: { line: 'L04', word: 'raiz' }, p: { level: 0.2, freq: 520 } },
        { sfx: 'pop', at: { line: 'L04', word: 'carne' }, p: { level: 0.2, freq: 640 } },
        { sfx: 'steps', at: { line: 'L04', word: 'mastigacao', offset: -0.4 }, p: { count: 8, step: 0.18, level: 0.25 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const chew = c.k({ line: 'L04', word: 'carne' }, { line: 'L04', word: 'mastigacao' });
        cam(g, { zoom: lerp(1.05, 1.2, c.u), px: -20, t });
        drawCave(g, t, { night: 0.4, outsideNight: 0 });
        groundShadow(g, 540, FLOOR + 14, 130);
        const mouth = chew > 0 ? (0.5 + 0.5 * Math.sin(t * 12)) * 0.7 : 0;
        caveman(g, t, 540, FLOOR, { smile: 0.1, mouth, armL: 0.4, armR: 1.7, tilt: Math.sin(t * 12) * 0.03 * chew, brow: -0.3 }, {
          holdR: (gg, hx, hy) => { gg.save(); gg.translate(hx + 18, hy - 16); drawMeat(gg, 0.9); gg.restore(); },
        });
        g.restore(); vignette(g, 0.55);
        [['raiz', 'RAIZ CRUA', 330], ['carne', 'CARNE CRUA', 430]].forEach(([wd, txt, y]) => {
          const a = c.k({ line: 'L04', word: wd }, { line: 'L04', word: wd, offset: 0.25 });
          drawChip(g, txt, 540, y, { size: 50, alpha: a, scale: 0.7 + 0.3 * a, border: wd === 'raiz' ? COLORS.green : COLORS.red });
        });
      },
    },

    // 5. SEM CALOR, SEM LUZ, SEM PROTEÇÃO
    {
      id: 'semcalor', world: 'blank', start: { line: 'L05', offset: -0.35 }, transition: 'cut',
      music: { mood: 'tension', intensity: 0.7 },
      cues: [
        { sfx: 'wind', span: 'scene', p: { level: 0.14 } },
        { sfx: 'pop', at: { line: 'L05', word: 'calor' }, p: { level: 0.22, freq: 480 } },
        { sfx: 'pop', at: { line: 'L05', word: 'luz' }, p: { level: 0.22, freq: 600 } },
        { sfx: 'pop', at: { line: 'L05', word: 'bichos' }, p: { level: 0.22, freq: 720 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        cam(g, { zoom: 1.1, t });
        drawCave(g, t, { night: 1 });
        // gravetos no chão e fumacinha que não vira fogo
        g.save(); g.translate(540, FLOOR + 10);
        [[-60, 0.2], [20, -0.15], [60, 0.4]].forEach(([dx, rot]) => { g.save(); g.translate(dx, 0); g.rotate(rot); g.fillStyle = '#8a5a30'; g.fillRect(-60, -7, 120, 14); g.lineWidth = 6; g.strokeStyle = INK; g.strokeRect(-60, -7, 120, 14); g.restore(); });
        for (let i = 0; i < 3; i++) { const u = (t * 0.5 + i / 3) % 1; g.globalAlpha = (1 - u) * 0.6; g.fillStyle = '#c9c9c9'; g.beginPath(); g.arc(Math.sin(i * 2 + t) * 14, -30 - u * 120, 12 + u * 26, 0, Math.PI * 2); g.fill(); }
        g.globalAlpha = 1; g.restore();
        groundShadow(g, 540, FLOOR + 14, 130);
        caveman(g, t, 540, FLOOR - 40, { smile: -0.7, armL: 1.0 + Math.sin(t * 14) * 0.08, armR: 1.0 - Math.sin(t * 14) * 0.08, ...shiver(t, 0.6), brow: -0.5, sweat: 0.6, legL: 0.12, legR: -0.12 });
        g.restore();
        tint(g, '#8fa6e8', 0.4); darkness(g, 0.55, 540, 1040, 460); vignette(g, 0.65);
        [['calor', 'SEM CALOR', 330, COLORS.orange], ['luz', 'SEM LUZ', 430, COLORS.gold], ['bichos', 'SEM PROTEÇÃO', 530, COLORS.red]].forEach(([wd, txt, y, col]) => {
          const a = c.k({ line: 'L05', word: wd }, { line: 'L05', word: wd, offset: 0.25 });
          drawChip(g, txt, 540, y, { size: 48, alpha: a, scale: 0.7 + 0.3 * a, border: col });
        });
      },
    },

    // 6. CHAMADA PARA CURTIR/SEGUIR
    {
      id: 'cta', world: 'blank', start: { line: 'L06', offset: -0.3 }, transition: 'cut',
      music: { mood: 'tension', intensity: 0.8 },
      cues: [
        { sfx: 'pop', at: { line: 'L06', offset: 0.1 }, p: { level: 0.25 } },
        { sfx: 'ding', at: { line: 'L06', word: 'like' }, p: { level: 0.14 } },
        { sfx: 'pop', at: { line: 'L06', word: 'segue' }, p: { level: 0.2, freq: 700 } },
        { sfx: 'heartbeat', at: { line: 'L06', word: 'piora' }, until: { after: 'L06' }, p: { bpm: 80, bpmEnd: 120, level: 0.6 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        cam(g, { zoom: 1.12, py: -30, t });
        drawCave(g, t, { night: 1 });
        groundShadow(g, 540, FLOOR + 14, 130);
        caveman(g, t, 540 + jit(t, 3, 4), FLOOR, { smile: -0.7, ...hug, ...shiver(t, 1), brow: -0.5 });
        drawBreath(g, t, 590, 1100, 0.9);
        g.restore();
        tint(g, '#8fa6e8', 0.4); vignette(g, 0.65);
        const L = c.tl.byId.L06;
        drawMidCTA(g, c.t - L.start + 0.1, L.end - L.start + 0.5, c.t);
      },
    },

    // 7. SEM METAL — pinturas rupestres riscadas
    {
      id: 'metal', world: 'blank', start: { line: 'L07', offset: -0.3 }, transition: 'cut',
      music: { mood: 'mystery', intensity: 0.65 },
      cues: [
        { sfx: 'pop', at: { line: 'L07', word: 'ceramica' }, p: { level: 0.22, freq: 520 } },
        { sfx: 'crack', at: { line: 'L07', word: 'ceramica', offset: 0.5 }, p: { level: 0.3 } },
        { sfx: 'pop', at: { line: 'L07', word: 'metal' }, p: { level: 0.22, freq: 600 } },
        { sfx: 'crack', at: { line: 'L07', word: 'metal', offset: 0.5 }, p: { level: 0.3 } },
        { sfx: 'pop', at: { line: 'L08', word: 'pontes' }, p: { level: 0.22, freq: 680 } },
        { sfx: 'crack', at: { line: 'L08', word: 'pontes', offset: 0.5 }, p: { level: 0.3 } },
        { sfx: 'pop', at: { line: 'L08', word: 'foguetes' }, p: { level: 0.22, freq: 760 } },
        { sfx: 'crack', at: { line: 'L08', word: 'foguetes', offset: 0.5 }, p: { level: 0.3 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        cam(g, { zoom: lerp(1, 1.06, c.u), t });
        drawCave(g, t, { night: 1 });
        // painel de pedra com os desenhos
        g.save();
        g.beginPath(); g.roundRect(120, 330, 840, 880, 40); g.fillStyle = '#c9a77a'; g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
        g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(90,60,30,0.25)'; g.fillRect(140, 350, 800, 840); g.restore();
        const items = [['panela', { line: 'L07', word: 'ceramica' }, 340, 620], ['espada', { line: 'L07', word: 'metal' }, 740, 620], ['ponte', { line: 'L08', word: 'pontes' }, 340, 1000], ['foguete', { line: 'L08', word: 'foguetes' }, 740, 1000]];
        items.forEach(([kind, a, x, y]) => {
          const k = c.k(a, { ...a, offset: 0.3 }), xk = c.k({ ...a, offset: 0.45 }, { ...a, offset: 0.85 });
          if (k <= 0) return;
          g.save(); g.translate(x, y); g.scale(0.5 + 0.5 * k, 0.5 + 0.5 * k); g.globalAlpha = k;
          drawIcon(g, kind, 230); g.globalAlpha = 1; drawX(g, 250, xk); g.restore();
        });
        groundShadow(g, 540, FLOOR + 14, 110);
        caveman(g, t, 540, FLOOR + 10, { smile: -0.4, surprise: 0.3, armL: 0.5, armR: 2.2, eyeY: -1 }, { s: 0.6 });
        g.restore();
        tint(g, '#8fa6e8', 0.3); vignette(g, 0.65);
        const b = c.k({ line: 'L07', word: 'ceramica', offset: -0.4 }, { line: 'L07', word: 'ceramica' });
        drawChip(g, 'SEM FOGO, SEM...', 540, 260, { size: 46, alpha: b, scale: 0.8 + 0.2 * b, border: COLORS.orange });
      },
    },

    // 8. O TITO CONTINUA NA CAVERNA
    {
      id: 'tremendo', world: 'blank', start: { line: 'L09', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.5 },
      cues: [
        { sfx: 'wind', span: 'scene', p: { level: 0.12 } },
        { sfx: 'steps', at: { line: 'L09', word: 'mastigando', offset: -0.2 }, p: { count: 6, step: 0.18, level: 0.25 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const chew = c.k({ line: 'L09', word: 'mastigando', offset: -0.3 }, { line: 'L09', word: 'mastigando' });
        cam(g, { zoom: lerp(1.05, 1.2, c.u), t });
        drawCave(g, t, { night: 1 });
        groundShadow(g, 540, FLOOR + 14, 130);
        caveman(g, t, 540 + jit(t, 3, 3), FLOOR, { smile: -0.4, mouth: chew * (0.5 + 0.5 * Math.sin(t * 12)) * 0.6, armL: -0.9, armR: 1.6, ...shiver(t, 1), brow: -0.4 }, {
          holdR: (gg, hx, hy) => { gg.save(); gg.translate(hx + 18, hy - 16); drawMeat(gg, 0.9); gg.restore(); },
        });
        drawBreath(g, t, 590, 1100, 0.9);
        g.restore();
        tint(g, '#8fa6e8', 0.4); darkness(g, 0.5, 540, 1040, 480);
        drawEyes(g, 820, 1240, 0.6, (t % 2.8) < 0.15 ? 1 : 0);
        vignette(g, 0.7);
      },
    },

    // 9. "Mas calma" — na vida real
    {
      id: 'realidade', world: 'blank', start: { line: 'L10', offset: -0.3 }, transition: 'flash',
      music: { mood: 'wonder', intensity: 0.6 },
      cues: [
        { sfx: 'shimmer', at: { local: 0.2 }, p: { level: 0.14 } },
        { sfx: 'crack', at: { line: 'L10', word: 'fogo' }, p: { level: 0.35 } },
        { sfx: 'pop', at: { line: 'L10', word: 'milhao' }, p: { level: 0.22, freq: 640 } },
        { sfx: 'ding', at: { line: 'L10', word: 'anos' }, p: { level: 0.12 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const fire = c.k({ local: 0 }, { line: 'L10', word: 'calma', offset: 0.4 });
        cam(g, { zoom: lerp(1.0, 1.1, c.u), t });
        drawCave(g, t, { night: 0.5, outsideNight: 0 });
        glow(g, 540, FLOOR - 30, 760, 0.35 * fire);
        drawFire(g, t, 600, FLOOR + 40, 0.95, fire);
        groundShadow(g, 300, FLOOR + 14, 120);
        caveman(g, t, 300, FLOOR, { smile: 1, armL: 0.5, armR: 0.5 }, { s: 0.8 });
        g.restore();
        tint(g, '#ffd9a0', 0.15); vignette(g, 0.5);
        const b = c.k({ line: 'L10', word: 'calma' }, { line: 'L10', word: 'calma', offset: 0.3 });
        drawChip(g, 'NA VIDA REAL', 540, 330, { size: 52, alpha: b, scale: 0.8 + 0.2 * b, border: COLORS.gold });
        const a = c.k({ line: 'L10', word: 'milhao', offset: -0.2 }, { line: 'L10', word: 'milhao', offset: 0.3 });
        drawChip(g, 'FOGO CONTROLADO HÁ ~1 MILHÃO DE ANOS', 540, 430, { size: 34, alpha: a, scale: 0.8 + 0.2 * a, border: COLORS.orange });
      },
    },

    // 10. DORMINDO QUENTINHO
    {
      id: 'quentinho', world: 'blank', start: { line: 'L11', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.6 },
      cues: [{ sfx: 'shimmer', at: { line: 'L11', word: 'quentinho' }, p: { level: 0.1 } }],
      draw2D(g, c) {
        const t = c.t;
        cam(g, { zoom: lerp(1.0, 1.12, c.u), t });
        drawCave(g, t, { night: 0.6, outsideNight: 1 });
        glow(g, 560, FLOOR - 30, 800, 0.4);
        drawFire(g, t, 700, FLOOR + 40, 0.9, 1);
        // Tito deitado na palha
        g.save(); g.translate(430, FLOOR - 10); g.rotate(-Math.PI / 2 + 0.03);
        drawStickman(g, t, { x: 0, y: 0, s: 0.62, tunic: '#e08a2e', spots: '#5a2f12', hat: false, pose: { smile: 0.9, blink: 1, bob: Math.sin(t * 1.6) * 3, armL: 0.5, armR: 0.5 } });
        g.restore();
        const zk = c.since({ line: 'L11', word: 'dormir' });
        if (zk > 0) { g.font = '900 70px Montserrat, Arial Black, sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = INK; for (let i = 0; i < 3; i++) { const u = (zk * 0.5 + i / 3) % 1; g.globalAlpha = Math.sin(u * Math.PI); g.strokeText('Z', 300 + u * 90 + i * 14, 1180 - u * 280); g.fillText('Z', 300 + u * 90 + i * 14, 1180 - u * 280); } g.globalAlpha = 1; }
        g.restore();
        tint(g, '#ffd9a0', 0.2); vignette(g, 0.6);
      },
    },

    // 11. CHAMADA PARA AÇÃO
    {
      id: 'pergunta', world: 'blank', start: { line: 'L12', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.7 },
      cues: [
        { sfx: 'crack', at: { line: 'L12', word: 'faria' }, p: { level: 0.25 } },
        { sfx: 'pop', at: { line: 'L12', word: 'comenta' }, p: { level: 0.28, freq: 620 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const wave = c.k({ line: 'L12', word: 'comenta', offset: -0.2 }, { line: 'L12', word: 'comenta', offset: 0.2 });
        const think = c.k({ line: 'L12', word: 'faria' }, { line: 'L12', word: 'fogo' }) * (1 - wave);
        cam(g, { zoom: lerp(1.08, 1.2, c.u), t });
        drawCave(g, t, { night: 0.5, outsideNight: 0 });
        glow(g, 540, FLOOR - 30, 760, 0.3);
        drawFire(g, t, 740, FLOOR + 40, 0.85, 1);
        groundShadow(g, 420, FLOOR + 14, 130);
        caveman(g, t, 420, FLOOR, { smile: 0.9, surprise: think * 0.5, armL: 0.45, armR: lerp(0.45, 2.6 + Math.sin(t * 9) * 0.35, wave), eyeY: -think * 0.6 });
        g.restore();
        tint(g, '#ffd9a0', 0.12); vignette(g, 0.5);
        const a = c.k({ line: 'L12', word: 'comenta' }, { line: 'L12', word: 'comenta', offset: 0.3 });
        drawChip(g, 'COMENTA AÍ 💬', 540, 330, { size: 54, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.blue });
      },
    },

    // 12. TELA FINAL OBRIGATÓRIA — HISTÓRIAS DO TABOCAL
    {
      id: 'final', world: 'blank', start: { after: 'L12', offset: 0.5 }, transition: 'flash', duration: 6.8,
      music: { mood: 'outro', intensity: 0.9 },
      cues: [
        { sfx: 'logo', at: { local: 0.15 }, p: { level: 0.55 } },
        { sfx: 'whoosh', at: { local: 1.3 }, p: { dur: 0.5, level: 0.2 } },
        { sfx: 'pop', at: { local: 2.1 }, p: { level: 0.3, freq: 500 } },
        { sfx: 'ding', at: { local: 2.15 }, p: { level: 0.12 } },
        { sfx: 'pop', at: { local: 2.45 }, p: { level: 0.3, freq: 620 } },
        { sfx: 'pop', at: { local: 2.8 }, p: { level: 0.3, freq: 760 } },
        { sfx: 'shimmer', at: { local: 3.1 }, p: { level: 0.1 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        cam(g, { zoom: 1.05, t });
        drawCave(g, t, { night: 0.7, outsideNight: 1 });
        glow(g, 540, FLOOR, 800, 0.35);
        drawFire(g, t, 540, FLOOR + 40, 0.9, 1);
        g.restore(); vignette(g, 0.65);
        drawEndCard(g, c.lt, c.dur, c.t);
      },
      noSubtitles: true, noBug: true,
    },
  ],
};
