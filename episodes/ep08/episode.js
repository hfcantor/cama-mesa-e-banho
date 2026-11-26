// ============================================================================
//  E SE...? — Episódio 08: "CASO MESSI: por que ele saiu do Barcelona?"
//  Estilo "investigação": juiz, detetive, mural de suspeitos, provas e veredito.
//  (visual de bonecos de madeira em js/render/ref.js)
// ----------------------------------------------------------------------------
//  FATOS CONFERIDOS (fontes públicas):
//   - Estatísticas do Messi no Barcelona (site oficial do clube): 778 jogos, 672 gols; 2003/04 a 2020/21 = 17 temporadas.
//   - 5 de agosto de 2021: comunicado do Barcelona diz que, apesar do acordo entre as partes, o novo contrato
//     não pôde ser formalizado por "obstáculos econômicos e estruturais" (regulamentos da LaLiga).
//   - 8 de agosto de 2021: despedida em lágrimas; Messi disse ter aceitado reduzir o salário em 50%.
//   - Dias depois, ele assinou com o PSG; em 2023 foi para o Inter Miami.
//  Veredito: sem "vilão único" — a conta do clube e a regra da LaLiga, segundo o comunicado do próprio clube.
//  É caricatura/comentário: sem escudos, sem imagens reais, sem acusar ninguém de nada além do documentado.
//
//  NARRAÇÃO: audio/ep08/narracao/L01 ... L18 (tools/gerar_narracao.py ep08).
// ============================================================================
import { drawMidCTA, drawEndCard } from '../../js/render/overlays.js';
import { puppet, gavel, magnifier, briefcase, headline, tag, chipBox, stamp, subtitles, vignette, grain, confetti, snap, ghostIn, stadiumBG, courtBG, wallBG, skylineBG, skyBG, palmsBG, corkBoard, polaroid, moneyPile, calendar, phoneCard, clamp01, lerp, ease, jit, W, H } from '../../js/render/ref.js';

const FEET = 1580;
const SUIT_RED = '#6e2424', SUIT_BLUE = '#2a4ea0';
const VOICE = { voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' };
void VOICE;

function camBegin(g, { zoom = 1, px = 0, py = 0, shake = 0, t = 0 } = {}) { g.save(); g.translate(540 + px + jit(t, 1, shake), 960 + py + jit(t, 2, shake)); g.scale(zoom, zoom); g.translate(-540, -960); }
const camEnd = (g) => g.restore();
const blink = (t, o = 0) => ((t + o) % 3.6) < 0.12 ? 1 : 0;
const pop = (c, a, d = 0.3) => ease(c.k(a, { ...a, offset: (a.offset || 0) + d }));
const countTo = (k, n) => Math.round(n * clamp01(k)).toLocaleString('pt-BR');
const wrap = (g, c, bgFn, body, cam = {}) => { camBegin(g, { t: c.t, ...cam }); bgFn(g, c.t); body(); camEnd(g); vignette(g, 0.45); grain(g, c.t); ghostIn(g, c.lt); subtitles(g, c.tl, c.t); snap(g); };

const messi = (o) => ({ kind: 'player', kit: 'barca', num: '10', head: { beard: true, hair: 'messi', freckles: false }, ...o });
const judge = (g, t, x, y, s, pose, face, hold = {}) => puppet(g, t, { x, y, s, kind: 'judge', head: { face: { eyes: 'half', mouth: 'flat', brow: -0.25, blink: blink(t), ...face } }, pose, ...hold });
const GAVEL = { holdR: (gg, x, y) => { gg.save(); gg.translate(x + 8, y - 8); gavel(gg, 0.45); gg.restore(); } };
const detective = (g, t, x, y, s, pose, face, hold = {}) => puppet(g, t, { x, y, s, kind: 'detective', head: { face: { eyes: 'dot', mouth: 'smirk', brow: -0.3, blink: blink(t, 1), ...face } }, pose, ...hold });
function desk(g, x, y, w, h, label) { g.save(); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 16, y + 18, w, h); g.beginPath(); g.roundRect(x, y, w, h, 12); g.fillStyle = '#9a5f32'; g.fill(); g.lineWidth = 6; g.strokeStyle = 'rgba(20,28,58,0.85)'; g.stroke(); g.strokeStyle = 'rgba(60,30,10,0.5)'; g.lineWidth = 5; for (let i = 0; i < 3; i++) g.strokeRect(x + 24 + i * (w / 3), y + 40, w / 3 - 36, h - 70); if (label) { g.fillStyle = '#e8c53a'; g.font = '900 64px Montserrat, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x + w / 2, y + 100); } g.restore(); }

export default {
  id: 'ep08',
  titulo: 'CASO MESSI: por que ele saiu do Barcelona?',
  roteiroStatus: 'aprovado',
  intro: 0.9,
  narration: { dir: 'audio/ep08/narracao/', formats: ['wav', 'mp3'], timings: 'audio/ep08/narracao/timings.json' },

  // ---------------------------- ROTEIRO ----------------------------------
  lines: [
    { id: 'L01', text: 'O caso de hoje: por que o Messi saiu do Barcelona?', emph: {}, pause: 0.45, ...{ voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' } },
    { id: 'L02', text: 'Muita gente já tinha um culpado. Mas, aqui, só vale o que tem prova.', emph: {}, pause: 0.4, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L03', text: 'Veja bem: o caso começa em agosto de dois mil e vinte e um.', emph: {}, pause: 0.4, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L04', text: 'O Messi estava no Barcelona havia dezessete temporadas, com seiscentos e setenta e dois gols em setecentos e setenta e oito jogos.', emph: {}, pause: 0.35, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L05', text: 'E, de repente, ele estava de saída. Começaram os suspeitos.', emph: {}, pause: 0.45, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L06', text: 'Suspeito número um: o dinheiro. O clube vivia uma crise financeira.', emph: {}, pause: 0.4, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L07', text: 'Suspeito número dois: a regra da LaLiga, que limita quanto cada clube pode gastar com salários.', emph: {}, pause: 0.4, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L08', text: 'Suspeito número três: o próprio Messi.', emph: {}, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L09', text: 'Só que, na despedida, ele afirmou que aceitou cortar o salário pela metade.', emph: {}, pause: 0.45, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L10', text: 'Prova número um: o comunicado do Barcelona, de cinco de agosto.', emph: {}, pause: 0.4, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L11', text: 'O clube disse que, mesmo com acordo entre as partes, o contrato não pôde ser assinado: obstáculos econômicos e estruturais, ligados às regras da LaLiga.', emph: {}, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L12', text: 'Três dias depois, o Messi se despediu entre lágrimas.', emph: {}, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '+4%', pitch: '-3Hz' },
    { id: 'L13', text: 'Se tá curtindo, já deixa o like e segue o perfil… porque o veredito vem agora.', emph: {}, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L14', text: 'Veredito: não houve um vilão único. A conta do clube não fechou e, segundo o próprio Barcelona, a regra da LaLiga impediu a assinatura.', emph: {}, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '+6%', pitch: '-2Hz' },
    { id: 'L15', text: 'Dias depois, o Messi já estava em Paris, no PSG.', emph: {}, pause: 0.35, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L16', text: 'E, em dois mil e vinte e três, foi para o Inter Miami.', emph: {}, pause: 0.45, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
    { id: 'L17', text: 'Caso encerrado: sem culpado único, só uma conta que não fechou.', emph: {}, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '+6%', pitch: '-2Hz' },
    { id: 'L18', text: 'E você? Quem você acha que foi o culpado? Comenta aí!', emph: {}, pause: 0.6, voice: 'pt-BR-AntonioNeural', rate: '+8%', pitch: '-1Hz' },
  ],

  cues: [],

  // ------------------------------ CENAS ----------------------------------
  scenes: [
    // 1. O JUIZ ABRE O CASO
    {
      id: 'juiz', world: 'blank', start: { at: 0 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'mystery', intensity: 0.5 },
      cues: [{ sfx: 'impact', at: { line: 'L01', word: 'caso', offset: 0.1 }, p: { level: 0.5, size: 0.8 } }, { sfx: 'braam', at: { local: 0.1 }, p: { dur: 2, level: 0.25 } }],
      draw2D(g, c) {
        const t = c.t, hit = c.k({ line: 'L01', word: 'caso', offset: -0.2 }, { line: 'L01', word: 'caso', offset: 0.1 });
        wrap(g, c, (gg) => courtBG(gg), () => {
          judge(g, t, 540, 1470, 1.35, { armL: 0.35, armR: lerp(2.75, 2.2, hit) + Math.sin(t * 2) * 0.03, bendR: -0.2 }, { mouth: 'flat' }, GAVEL);
          g.save(); g.translate(0, 0); desk(g, 40, 1400, 1000, 520, 'JUIZ'); g.restore();
        }, { zoom: lerp(1, 1.06, c.u), t });
        headline(g, 'O CASO MESSI', 210, { size: 96, alpha: pop(c, { local: 0.3 }), scale: 0.8 + 0.2 * pop(c, { local: 0.3 }) });
      },
    },
    // 2. O DETETIVE: SÓ VALE PROVA
    {
      id: 'detetive', world: 'blank', start: { line: 'L02', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'mystery', intensity: 0.55 },
      cues: [{ sfx: 'pop', at: { line: 'L02', word: 'prova' }, p: { level: 0.3, freq: 620 } }, { sfx: 'whoosh', at: { local: 0 }, p: { dur: 0.4, level: 0.2 } }],
      draw2D(g, c) {
        const t = c.t, a = pop(c, { line: 'L02', word: 'prova', offset: -0.1 });
        wrap(g, c, (gg) => wallBG(gg), () => {
          detective(g, t, 520, 1720, 1.55, { armL: 0.2, armR: lerp(0.4, 1.9, a), bendR: -0.5 }, { mouth: 'smirk', brow: -0.3 }, { holdR: (gg, x, y) => { gg.save(); gg.translate(x + 10, y - 10); magnifier(gg); gg.restore(); } });
        }, { zoom: lerp(1, 1.07, c.u), t });
        headline(g, 'SÓ VALE PROVA!', 230, { size: 88, alpha: a, scale: 0.8 + 0.2 * a });
      },
    },
    // 3. AGOSTO DE 2021
    {
      id: 'calendario', world: 'blank', start: { line: 'L03', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'mystery', intensity: 0.55 },
      cues: [{ sfx: 'pop', at: { line: 'L03', word: 'agosto' }, p: { level: 0.3, freq: 560 } }],
      draw2D(g, c) {
        const t = c.t;
        wrap(g, c, (gg) => wallBG(gg), () => {
          detective(g, t, 330, 1720, 1.35, { armL: 0.2, armR: 2.3, bendR: 0.1 }, { mouth: 'smirk' });
          desk(g, 520, 1450, 520, 330, '');
          g.save(); g.translate(790, 1430); g.rotate(-0.06); g.fillStyle = '#e8c76a'; g.fillRect(-190, -140, 380, 220); g.lineWidth = 6; g.strokeStyle = 'rgba(20,28,58,0.85)'; g.strokeRect(-190, -140, 380, 220); g.fillStyle = '#6a3a14'; g.font = '800 40px Montserrat'; g.textAlign = 'center'; g.fillText('CASO', 0, -60); g.font = '900 62px Montserrat'; g.fillText('MESSI', 0, 10); g.restore();
          calendar(g, 760, 560, 'AGOSTO', '2021', c.k({ line: 'L03', word: 'agosto' }, { line: 'L03', word: 'agosto', offset: 0.3 }));
        }, { zoom: lerp(1, 1.05, c.u), t });
        headline(g, 'COMEÇOU AQUI', 240, { size: 78, alpha: pop(c, { local: 0.35 }) });
      },
    },
    // 4. O ESTÁDIO — 17 temporadas, 672 gols, 778 jogos
    {
      id: 'estadio', world: 'blank', start: { line: 'L04', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'wonder', intensity: 0.6 },
      cues: [
        { sfx: 'pop', at: { line: 'L04', word: 'dezessete' }, p: { level: 0.25, freq: 520 } },
        { sfx: 'pop', at: { line: 'L04', word: 'seiscentos' }, p: { level: 0.25, freq: 620 } },
        { sfx: 'pop', at: { line: 'L04', word: 'setecentos', offset: 0.1 }, p: { level: 0.25, freq: 720 } },
        { sfx: 'braam', at: { line: 'L05', word: 'saida' }, p: { dur: 2, level: 0.3 } },
      ],
      draw2D(g, c) {
        const t = c.t, sad = c.k({ line: 'L05', word: 'repente' }, { line: 'L05', word: 'saida' });
        const k1 = c.k({ line: 'L04', word: 'dezessete' }, { line: 'L04', word: 'dezessete', offset: 0.9 });
        const k2 = c.k({ line: 'L04', word: 'seiscentos' }, { line: 'L04', word: 'seiscentos', offset: 1.4 });
        const k3 = c.k({ line: 'L04', word: 'setecentos', offset: 0.1 }, { line: 'L04', word: 'setecentos', offset: 1.4 });
        wrap(g, c, (gg) => stadiumBG(gg), () => {
          puppet(g, t, messi({ x: 540, y: FEET, s: 1.5, pose: { armL: lerp(0.45, 0.2, sad), armR: lerp(0.45, 1.6, sad), bendR: lerp(0.2, 0.4, sad), tilt: sad * 0.06 }, head: { beard: true, hair: 'messi', face: { eyes: sad > 0.5 ? 'wide' : 'happy', mouth: sad > 0.5 ? 'o' : 'open', smile: 0.8, brow: sad * 0.5, blink: blink(t), sweat: sad } },
            holdR: sad > 0.5 ? (gg, x, y) => { gg.save(); gg.translate(x + 20, y + 10); briefcase(gg); gg.restore(); } : null }));
        }, { zoom: lerp(1.0, 1.08, c.u), t });
        confetti(g, t, 1 - sad, 40);
        chipBox(g, countTo(k1, 17) + ' TEMPORADAS', 540, 360, { alpha: pop(c, { line: 'L04', word: 'dezessete' }), size: 62, fg: '#7dffa8' });
        chipBox(g, countTo(k2, 672) + ' GOLS', 540, 490, { alpha: pop(c, { line: 'L04', word: 'seiscentos' }), size: 62, fg: '#7dffa8' });
        chipBox(g, countTo(k3, 778) + ' JOGOS', 540, 620, { alpha: pop(c, { line: 'L04', word: 'setecentos', offset: 0.1 }), size: 62, fg: '#7dffa8' });
        headline(g, 'MAS DE REPENTE...', 220, { size: 80, alpha: pop(c, { line: 'L05', word: 'repente' }) });
      },
    },
    // 5. SUSPEITO 1 — o dinheiro (mural)
    {
      id: 'suspeito1', world: 'blank', start: { line: 'L06', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'tension', intensity: 0.6 },
      cues: [{ sfx: 'pop', at: { line: 'L06', word: 'dinheiro' }, p: { level: 0.3, freq: 560 } }, { sfx: 'impact', at: { line: 'L06', word: 'dinheiro', offset: 0.2 }, p: { level: 0.3, size: 0.5 } }],
      draw2D(g, c) {
        const t = c.t, k = c.k({ line: 'L06', word: 'dinheiro', offset: -0.2 }, { line: 'L06', word: 'dinheiro', offset: 0.3 });
        wrap(g, c, (gg) => wallBG(gg), () => {
          corkBoard(g, 50, 470, 980, 560);
          [[210, 0], [540, 1], [870, 2]].forEach(([x, i]) => polaroid(g, x, 750, 250, 360, i === 0 ? 'DINHEIRO' : '?', i === 0 ? 'money' : 'blank', i === 0 ? k : 1, (i - 1) * 0.05));
          detective(g, t, 220, 1790, 1.1, { armL: 0.2, armR: 0.4 }, { mouth: 'smirk' });
        }, { zoom: lerp(1, 1.04, c.u), t });
        headline(g, 'SUSPEITOS', 240, { size: 90, color: '#ff4a5a' });
        tag(g, 'SUSPEITO 1', 1340, { alpha: k });
      },
    },
    // 6. CRISE FINANCEIRA
    {
      id: 'crise', world: 'blank', start: { line: 'L06', word: 'crise', offset: -0.4 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'tension', intensity: 0.7 },
      cues: [{ sfx: 'alarm', at: { line: 'L06', word: 'crise' }, p: { level: 0.06 } }],
      draw2D(g, c) {
        const t = c.t, drop = c.k({ line: 'L06', word: 'crise' }, { line: 'L06', word: 'financeira', offset: 0.8 });
        wrap(g, c, (gg) => skylineBG(gg, t), () => {
          moneyPile(g, t, 1 - 0.85 * drop);
          puppet(g, t, { x: 720, y: FEET + 40, s: 1.4, kind: 'exec', suit: SUIT_BLUE, tie: '#e8c53a', head: { moustache: true, hair: 'exec', hairColor: '#aaaaaa', face: { eyes: 'wide', mouth: 'o', brow: 0.5, sweat: drop, blink: blink(t) } }, pose: { armL: 1.6, armR: 1.6, bendL: -0.3, bendR: -0.3 } });
          puppet(g, t, { x: 260, y: FEET + 40, s: 1.3, kind: 'exec', suit: SUIT_RED, tie: '#e8c53a', head: { moustache: true, hair: 'exec', face: { eyes: 'half', mouth: 'frown', brow: -0.3 } }, pose: { armL: 0.3, armR: 0.3 } });
        }, { zoom: lerp(1, 1.05, c.u), t });
        headline(g, 'CRISE FINANCEIRA', 230, { size: 80, alpha: pop(c, { line: 'L06', word: 'crise' }), color: '#ff6a6a' });
        chipBox(g, '▼ CONTAS NO VERMELHO', 540, 370, { alpha: pop(c, { line: 'L06', word: 'financeira' }), size: 46, fg: '#ff7a7a' });
      },
    },
    // 7. SUSPEITO 2 — a regra da LaLiga
    {
      id: 'regra', world: 'blank', start: { line: 'L07', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'tension', intensity: 0.7 },
      cues: [{ sfx: 'pop', at: { line: 'L07', word: 'laliga' }, p: { level: 0.3, freq: 600 } }, { sfx: 'impact', at: { line: 'L07', word: 'limita' }, p: { level: 0.4, size: 0.6 } }],
      draw2D(g, c) {
        const t = c.t, lim = c.k({ line: 'L07', word: 'limita' }, { line: 'L07', word: 'salarios', offset: 0.2 });
        wrap(g, c, (gg) => skylineBG(gg, t), () => {
          g.save(); g.translate(790, 560); g.beginPath(); g.roundRect(-110, -34, 220, 68, 10); g.fillStyle = '#f4f6fa'; g.fill(); g.lineWidth = 5; g.strokeStyle = 'rgba(20,28,58,0.85)'; g.stroke(); g.fillStyle = '#d6283b'; g.font = '900 44px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LALIGA', 0, 2); g.restore();
          puppet(g, t, { x: 790, y: FEET + 40, s: 1.4, kind: 'exec', suit: SUIT_RED, tie: '#e8c53a', head: { moustache: true, hair: 'exec', face: { eyes: 'half', mouth: 'flat', brow: -0.4 } }, pose: { armL: 0.3, armR: 1.4, bendR: -0.2 } });
          puppet(g, t, { x: 280, y: FEET + 40, s: 1.35, kind: 'exec', suit: SUIT_BLUE, tie: '#e8c53a', head: { moustache: true, hair: 'exec', hairColor: '#aaaaaa', face: { eyes: 'wide', mouth: 'o', brow: 0.4, sweat: lim, blink: blink(t) } }, pose: { armL: 1.5, armR: 0.3 } });
          // medidor do limite salarial
          g.save(); g.translate(540, 830); g.beginPath(); g.roundRect(-300, -34, 600, 68, 16); g.fillStyle = 'rgba(10,14,24,0.85)'; g.fill(); g.fillStyle = lim > 0.9 ? '#ff5a6a' : '#7dffa8'; g.beginPath(); g.roundRect(-290, -24, 580 * Math.min(1, lim * 0.95), 48, 10); g.fill(); g.fillStyle = '#fff'; g.fillRect(250, -48, 8, 96); g.restore();
        }, { zoom: lerp(1, 1.05, c.u), t });
        headline(g, 'REGRA DA LALIGA', 240, { size: 80, alpha: pop(c, { line: 'L07', word: 'regra' }) });
        chipBox(g, 'LIMITE DE SALÁRIOS', 540, 380, { alpha: pop(c, { line: 'L07', word: 'limita' }), size: 50, fg: '#ffd24a' });
        tag(g, 'SUSPEITO 2', 1340, { alpha: pop(c, { line: 'L07', word: 'dois' }) });
      },
    },
    // 8. SUSPEITO 3 — o próprio Messi (cortou o salário)
    {
      id: 'proprio', world: 'blank', start: { line: 'L08', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'mystery', intensity: 0.6 },
      cues: [{ sfx: 'pop', at: { line: 'L08', word: 'messi' }, p: { level: 0.3, freq: 640 } }, { sfx: 'impact', at: { line: 'L09', word: 'metade', offset: 0.1 }, p: { level: 0.5, size: 0.8 } }],
      draw2D(g, c) {
        const t = c.t, card = c.k({ line: 'L08', word: 'proprio' }, { line: 'L08', word: 'messi', offset: 0.3 }), st = c.since({ line: 'L09', word: 'metade', offset: 0.1 });
        wrap(g, c, (gg) => wallBG(gg), () => {
          corkBoard(g, 50, 360, 980, 500);
          polaroid(g, 210, 610, 230, 330, 'DINHEIRO', 'money', 1, -0.05); polaroid(g, 540, 610, 230, 330, 'LALIGA', 'liga', 1, 0.03); polaroid(g, 870, 610, 230, 330, 'MESSI', 'messi', card, -0.03);
          puppet(g, t, messi({ x: 540, y: FEET + 60, s: 1.35, pose: { armL: 0.5, armR: 1.1, bendR: 0.5 }, head: { beard: true, face: { eyes: st > 0 ? 'happy' : 'dot', mouth: st > 0 ? 'smile' : 'flat', smile: 0.5, brow: st > 0 ? 0 : -0.2, blink: blink(t) } } }));
        }, { zoom: lerp(1, 1.04, c.u), t });
        tag(g, 'SUSPEITO 3', 1340, { alpha: card });
        chipBox(g, '−50% DO SALÁRIO', 540, 940, { alpha: pop(c, { line: 'L09', word: 'cortar' }), size: 66, fg: '#7dffa8' });
        stamp(g, 'DESCARTADO', 540, 1080, st, { color: '#3aa85a', rot: -0.12, size: 70 });
      },
    },
    // 9. PROVA 1 — o comunicado do clube
    {
      id: 'comunicado', world: 'blank', start: { line: 'L10', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'mystery', intensity: 0.6 },
      cues: [{ sfx: 'pop', at: { line: 'L10', word: 'comunicado' }, p: { level: 0.3, freq: 600 } }, { sfx: 'impact', at: { line: 'L11', word: 'obstaculos' }, p: { level: 0.4, size: 0.6 } }],
      draw2D(g, c) {
        const t = c.t, hi = c.since({ line: 'L11', word: 'obstaculos' }) >= 0 ? 3 : -1;
        const show = pop(c, { line: 'L10', word: 'comunicado', offset: -0.1 });
        wrap(g, c, (gg) => wallBG(gg), () => {
          phoneCard(g, 540, 720, 760, 760, 'COMUNICADO · 5 DE AGOSTO', ['APESAR DO ACORDO ENTRE AS', 'PARTES, O CONTRATO NÃO', 'PÔDE SER ASSINADO:', 'OBSTÁCULOS ECONÔMICOS', 'E ESTRUTURAIS (LALIGA)'].map((s2) => s2.replace('PÔDE', 'PÔDE')), hi, show);
          detective(g, t, 210, 1790, 1.1, { armL: 0.2, armR: 1.3, bendR: -0.3 }, { mouth: 'smirk' }, { holdR: (gg, x, y) => { gg.save(); gg.translate(x, y); gg.scale(0.8, 0.8); magnifier(gg); gg.restore(); } });
        }, { zoom: lerp(1, 1.03, c.u), t });
        headline(g, 'PROVA Nº 1', 230, { size: 86, alpha: pop(c, { line: 'L10', word: 'prova' }) });
        stamp(g, 'DOCUMENTO OFICIAL', 540, 1110, c.since({ line: 'L11', word: 'assinado', offset: 0.3 }), { color: '#d8283a', rot: -0.08, size: 54 });
      },
    },
    // 10. A DESPEDIDA
    {
      id: 'despedida', world: 'blank', start: { line: 'L12', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'calm', intensity: 0.5 },
      cues: [{ sfx: 'pop', at: { line: 'L12', word: 'despediu' }, p: { level: 0.25, freq: 440 } }],
      draw2D(g, c) {
        const t = c.t;
        wrap(g, c, (gg) => { stadiumBG(gg, { flags: false }); gg.fillStyle = 'rgba(40,50,80,0.35)'; gg.fillRect(0, 0, W, H); }, () => {
          puppet(g, t, messi({ x: 540, y: FEET, s: 1.5, pose: { armL: 0.25, armR: 0.25, tilt: Math.sin(t * 1.2) * 0.03, bob: Math.sin(t * 1.4) * 3 }, head: { beard: true, face: { eyes: 'cry', mouth: 'frown', brow: 0.4, blink: 0 } } }));
        }, { zoom: lerp(1.0, 1.1, c.u), t });
        headline(g, 'ENTRE LÁGRIMAS', 230, { size: 80, alpha: pop(c, { line: 'L12', word: 'lagrimas', offset: -0.3 }), color: '#9fd0ff' });
        chipBox(g, '8 DE AGOSTO DE 2021', 540, 370, { alpha: pop(c, { line: 'L12', word: 'tres', offset: 0.1 }), size: 46, fg: '#ffffff' });
      },
    },
    // 11. CHAMADA PARA CURTIR/SEGUIR
    {
      id: 'cta', world: 'blank', start: { line: 'L13', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'tension', intensity: 0.7 },
      cues: [{ sfx: 'pop', at: { line: 'L13', offset: 0.1 }, p: { level: 0.25 } }, { sfx: 'ding', at: { line: 'L13', word: 'like' }, p: { level: 0.14 } }, { sfx: 'pop', at: { line: 'L13', word: 'segue' }, p: { level: 0.2, freq: 700 } }, { sfx: 'braam', at: { line: 'L13', word: 'veredito' }, p: { dur: 2, level: 0.3 } }],
      draw2D(g, c) {
        const t = c.t;
        wrap(g, c, (gg) => wallBG(gg), () => {
          judge(g, t, 770, 1700, 1.3, { armL: 0.3, armR: 2.6, bendR: -0.2 }, { mouth: 'flat' }, GAVEL);
          g.save(); g.translate(0, 0); g.restore();
          detective(g, t, 280, 1720, 1.3, { armL: 0.2, armR: 1.8, bendR: -0.4 }, { mouth: 'smirk', eyes: 'dot' });
        }, { zoom: 1.0, t });
        const L = c.tl.byId.L13; drawMidCTA(g, c.t - L.start + 0.1, L.end - L.start + 0.5, c.t);
      },
    },
    // 12. VEREDITO
    {
      id: 'veredito', world: 'blank', start: { line: 'L14', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'action', intensity: 0.7 },
      cues: [{ sfx: 'impact', at: { line: 'L14', word: 'veredito', offset: 0.2 }, p: { level: 0.6, size: 0.9 } }, { sfx: 'pop', at: { line: 'L14', word: 'conta' }, p: { level: 0.25, freq: 600 } }, { sfx: 'pop', at: { line: 'L14', word: 'regra' }, p: { level: 0.25, freq: 700 } }],
      draw2D(g, c) {
        const t = c.t, hit = c.k({ line: 'L14', word: 'veredito', offset: -0.2 }, { line: 'L14', word: 'veredito', offset: 0.2 });
        wrap(g, c, (gg) => courtBG(gg), () => {
          judge(g, t, 540, 1470, 1.35, { armL: 0.35, armR: lerp(2.75, 2.2, hit), bendR: -0.2 }, { mouth: 'flat' }, GAVEL);
          desk(g, 40, 1400, 1000, 520, 'JUIZ');
        }, { zoom: lerp(1.0, 1.06, c.u), t });
        headline(g, 'VEREDITO', 210, { size: 100, alpha: pop(c, { line: 'L14', word: 'veredito' }) });
        stamp(g, 'SEM VILÃO ÚNICO', 540, 400, c.since({ line: 'L14', word: 'vilao' }), { color: '#3a8ae0', rot: -0.1, size: 70 });
        chipBox(g, 'A CONTA NÃO FECHOU', 540, 530, { alpha: pop(c, { line: 'L14', word: 'conta' }), size: 52, fg: '#ff8a8a' });
        chipBox(g, 'REGRA DA LALIGA', 540, 650, { alpha: pop(c, { line: 'L14', word: 'regra' }), size: 52, fg: '#ffd24a' });
      },
    },
    // 13. PARIS
    {
      id: 'paris', world: 'blank', start: { line: 'L15', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'wonder', intensity: 0.65 },
      cues: [{ sfx: 'shimmer', at: { line: 'L15', word: 'paris' }, p: { level: 0.14 } }],
      draw2D(g, c) {
        const t = c.t;
        wrap(g, c, (gg, tt) => skyBG(gg, tt), () => {
          puppet(g, t, messi({ x: 470, y: FEET, s: 1.5, kit: 'psg', num: '30', pose: { armL: 2.4, armR: 2.4, bendL: 0.6, bendR: 0.6, bob: Math.sin(t * 2) * 4 }, head: { beard: true, face: { eyes: 'happy', mouth: 'open', smile: 0.8 } } }));
        }, { zoom: lerp(1.0, 1.06, c.u), t });
        headline(g, 'PARIS', 230, { size: 110, alpha: pop(c, { line: 'L15', word: 'paris', offset: -0.2 }), white: true });
        chipBox(g, 'DIAS DEPOIS', 540, 380, { alpha: pop(c, { line: 'L15', word: 'dias' }), size: 46, fg: '#ffffff' });
      },
    },
    // 14. INTER MIAMI
    {
      id: 'miami', world: 'blank', start: { line: 'L16', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'wonder', intensity: 0.7 },
      cues: [{ sfx: 'shimmer', at: { line: 'L16', word: 'miami' }, p: { level: 0.14 } }],
      draw2D(g, c) {
        const t = c.t;
        wrap(g, c, (gg, tt) => palmsBG(gg, tt), () => {
          puppet(g, t, messi({ x: 540, y: FEET, s: 1.5, kit: 'miami', num: '10', pose: { armL: 0.5, armR: 2.3, bendR: 0.2, bob: Math.sin(t * 2) * 4 }, head: { beard: true, face: { eyes: 'happy', mouth: 'open', smile: 0.8 } } }));
        }, { zoom: lerp(1.0, 1.06, c.u), t });
        headline(g, 'INTER MIAMI', 230, { size: 96, alpha: pop(c, { line: 'L16', word: 'miami', offset: -0.4 }), white: true });
        chipBox(g, '2023', 540, 380, { alpha: pop(c, { line: 'L16', word: 'dois' }), size: 60, fg: '#ffffff' });
      },
    },
    // 15. CASO ENCERRADO
    {
      id: 'encerrado', world: 'blank', start: { line: 'L17', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'action', intensity: 0.65 },
      cues: [{ sfx: 'impact', at: { line: 'L17', word: 'encerrado', offset: 0.05 }, p: { level: 0.6, size: 0.9 } }],
      draw2D(g, c) {
        const t = c.t, hit = c.k({ line: 'L17', word: 'encerrado', offset: -0.2 }, { line: 'L17', word: 'encerrado', offset: 0.1 });
        wrap(g, c, (gg) => courtBG(gg), () => {
          judge(g, t, 540, 1470, 1.35, { armL: 0.35, armR: lerp(2.75, 2.2, hit), bendR: -0.2 }, { mouth: 'flat' }, GAVEL);
          desk(g, 40, 1400, 1000, 520, 'JUIZ');
        }, { zoom: lerp(1.0, 1.05, c.u), t });
        stamp(g, 'CASO ENCERRADO', 540, 420, c.since({ line: 'L17', word: 'encerrado' }), { color: '#d8283a', rot: -0.1, size: 78 });
        headline(g, 'SEM CULPADO ÚNICO', 230, { size: 76, alpha: pop(c, { line: 'L17', word: 'culpado' }) });
      },
    },
    // 16. CHAMADA PARA AÇÃO
    {
      id: 'pergunta', world: 'blank', start: { line: 'L18', offset: -0.3 }, transition: 'cut', noSubtitles: true, noBug: true,
      music: { mood: 'calm', intensity: 0.7 },
      cues: [{ sfx: 'pop', at: { line: 'L18', word: 'comenta' }, p: { level: 0.28, freq: 620 } }],
      draw2D(g, c) {
        const t = c.t, w = c.k({ line: 'L18', word: 'comenta', offset: -0.2 }, { line: 'L18', word: 'comenta', offset: 0.2 });
        wrap(g, c, (gg) => wallBG(gg), () => {
          detective(g, t, 330, 1720, 1.4, { armL: 0.2, armR: lerp(0.4, 2.6 + Math.sin(t * 9) * 0.3, w), bendR: -0.3 }, { mouth: 'smirk' });
          judge(g, t, 780, 1720, 1.3, { armL: 0.3, armR: 0.3 }, { mouth: 'flat', eyes: 'half' });
        }, { zoom: lerp(1.0, 1.05, c.u), t });
        headline(g, 'QUEM É O CULPADO?', 240, { size: 84, alpha: pop(c, { line: 'L18', word: 'culpado' }) });
        chipBox(g, 'COMENTA AÍ 💬', 540, 400, { alpha: pop(c, { line: 'L18', word: 'comenta' }), size: 60, fg: '#5ec8ff' });
      },
    },
    // 17. TELA FINAL
    {
      id: 'final', world: 'blank', start: { after: 'L18', offset: 0.5 }, transition: 'flash', duration: 6.8, noSubtitles: true, noBug: true,
      music: { mood: 'outro', intensity: 0.9 },
      cues: [
        { sfx: 'logo', at: { local: 0.15 }, p: { level: 0.55 } }, { sfx: 'whoosh', at: { local: 1.3 }, p: { dur: 0.5, level: 0.2 } },
        { sfx: 'pop', at: { local: 2.1 }, p: { level: 0.3, freq: 500 } }, { sfx: 'ding', at: { local: 2.15 }, p: { level: 0.12 } },
        { sfx: 'pop', at: { local: 2.45 }, p: { level: 0.3, freq: 620 } }, { sfx: 'pop', at: { local: 2.8 }, p: { level: 0.3, freq: 760 } }, { sfx: 'shimmer', at: { local: 3.1 }, p: { level: 0.1 } },
      ],
      draw2D(g, c) {
        wallBG(g); g.fillStyle = 'rgba(20,10,50,0.62)'; g.fillRect(0, 0, W, H); vignette(g, 0.6);
        drawEndCard(g, c.lt, c.dur, c.t);
      },
    },
  ],
};
