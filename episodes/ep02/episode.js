// ============================================================================
//  E SE...? — Episódio 02: "E se o presidente virasse ditador?"
//  HISTÓRIAS DO TABOCAL
// ----------------------------------------------------------------------------
//  Sátira absurda e FICTÍCIA: o personagem é genérico (sem nome nem rosto de
//  pessoa real) e os decretos são piadas do cotidiano. Nada aqui afirma fatos.
//
//  NARRAÇÃO: audio/ep02/narracao_cartesia/L01.wav ... L11.wav
//  (gerada por tools/gerar_narracao_cartesia.py a partir das falas abaixo).
// ============================================================================
import { cameraPath, shake, clamp01 } from '../../js/render/stage.js';
import { drawOpeningTitle, drawChip, drawEndCard, COLORS, FONT_TITLE } from '../../js/render/overlays.js';
import { SETS } from '../../js/three/worlds/palace.js';

const lerp = (a, b, k) => a + (b - a) * k;
const X = SETS;

// Relógio digital fixo no alto da tela: a graça do vídeo é a hora de cada decreto.
function drawClock(g, label, lt, { alpha = 1, danger = false } = {}) {
  if (!label || alpha <= 0.01) return;
  const k = clamp01(lt / 0.25);
  g.save();
  g.globalAlpha = alpha * k;
  g.translate(830, 120); g.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k);
  g.fillStyle = 'rgba(8,10,22,0.82)'; g.strokeStyle = danger ? '#ff4d4d' : '#ffd24a'; g.lineWidth = 6;
  g.beginPath(); g.roundRect(-190, -62, 380, 124, 30); g.fill(); g.stroke();
  g.fillStyle = danger ? '#ff6a6a' : '#ff4040'; g.shadowColor = '#ff2a2a'; g.shadowBlur = 26;
  g.font = `96px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, 0, 6);
  g.restore();
}

function place(c, x, y, z, ry = 0) { c.root.visible = true; c.root.position.set(x, y, z); c.root.rotation.set(0, ry, 0); }

export default {
  id: 'ep02',
  titulo: 'E se o presidente virasse ditador?',
  roteiroStatus: 'aprovado',
  intro: 1.25,
  narration: {
    dir: 'audio/ep02/narracao_cartesia/',
    formats: ['wav', 'mp3'],
    timings: 'audio/ep02/narracao_cartesia/timings.json',
  },

  // ---------------------------- ROTEIRO ----------------------------------
  lines: [
    { id: 'L01', text: 'O presidente virou ditador às oito da manhã.', emph: { presidente: 'gold', ditador: 'red', oito: 'gold' }, pause: 0.7 },
    { id: 'L02', text: 'Às oito e cinco, ele já tinha proibido três coisas que você faz todo dia.', emph: { cinco: 'gold', proibido: 'red', tres: 'gold', dia: 'blue' }, pause: 0.5 },
    { id: 'L03', text: 'Decreto um: proibido segunda-feira. A semana agora começa na terça. O povo comemorou.', emph: { um: 'gold', proibido: 'red', segundafeira: 'red', terca: 'green', comemorou: 'green' }, pause: 0.45 },
    { id: 'L04', text: 'Decreto dois: proibido fila. Agora todo mundo é o primeiro. O banco virou um ringue.', emph: { dois: 'gold', proibido: 'red', fila: 'red', ringue: 'orange' }, pause: 0.45 },
    { id: 'L05', text: 'Decreto três: proibido dizer só mais cinco minutinhos. O despertador agora tem braços.', emph: { tres: 'gold', proibido: 'red', minutinhos: 'red', despertador: 'gold', bracos: 'orange' }, pause: 0.5 },
    { id: 'L06', text: 'Às oito e dez, o ditador estava no auge. Decreto quatro: proibido spoiler. Quem contar o final da série vai para a prisão do sofá.', emph: { dez: 'gold', auge: 'red', quatro: 'gold', spoiler: 'red', prisao: 'orange', sofa: 'orange' }, pause: 0.45 },
    { id: 'L07', text: 'Decreto cinco: proibido grupo de família no WhatsApp antes do meio-dia. Silêncio. Pela primeira vez, silêncio.', emph: { cinco: 'gold', proibido: 'red', whatsapp: 'green', silencio: 'blue' }, pause: 0.55 },
    { id: 'L08', text: 'Mas aí veio o decreto seis. Proibido... feijoada de domingo. Ninguém. Aceitou. Isso.', emph: { seis: 'gold', proibido: 'red', feijoada: 'orange', ninguem: 'red', aceitou: 'red' }, pause: 0.6 },
    { id: 'L09', text: 'Às oito e vinte, o povo se levantou. Segunda-feira de volta! Fila de volta! Cinco minutinhos de volta! Menos o grupo da família. Esse ficou.', emph: { vinte: 'gold', levantou: 'red', volta: 'green', grupo: 'blue', familia: 'blue', ficou: 'gold' }, pause: 0.55 },
    { id: 'L10', text: 'A ditadura durou vinte minutos. O ditador foi demitido por carimbo. O despertador continuou com os braços.', emph: { vinte: 'gold', minutos: 'gold', demitido: 'red', carimbo: 'red', bracos: 'orange' }, pause: 0.6 },
    { id: 'L11', text: 'Agora me conta: qual decreto você proibiria? Comenta aí.', emph: { decreto: 'gold', proibiria: 'red', comenta: 'blue' }, pause: 0.6 },
  ],

  cues: [],

  // ------------------------------ CENAS ----------------------------------
  scenes: [
    // 1. ABERTURA — "E SE...?" sobre o trono
    {
      id: 'abertura', world: 'palace', start: { at: 0 }, transition: 'fade',
      music: { mood: 'mystery', intensity: 0.45 },
      cues: [
        { sfx: 'logo', at: { local: 0.35 }, p: { level: 0.45 } },
        { sfx: 'whoosh', at: { local: 0.2 }, p: { dur: 0.8, level: 0.3 } },
      ],
      setup(w) { w.reset(); w.seatPresident(); w.pres.pose.smile = 0.1; w.state.sit = 1; },
      update(w, c) {
        w.pres.pose.lookPitch = 0.1;
        cameraPath(c.cam, [
          { u: 0, pos: [0, 5.5, 22], look: [0, 4, -7], fov: 52 },
          { u: 1, pos: [0, 3.6, 12], look: [0, 3.2, -7], fov: 46 },
        ], c.u);
      },
      draw2D(g, c) { drawOpeningTitle(g, c.lt, c.dur, c.t); },
    },

    // 2. GANCHO — o ditador no trono, 08:05, três proibições
    {
      id: 'trono', world: 'palace', start: { line: 'L01', word: 'ditador', offset: -0.1 }, transition: 'whip',
      music: { mood: 'action', intensity: 0.5 },
      cues: [
        { sfx: 'braam', at: { line: 'L01', word: 'ditador' }, p: { dur: 2.5, level: 0.3 } },
        { sfx: 'ding', at: { line: 'L02', word: 'cinco' }, p: { level: 0.16 } },
        { sfx: 'pop', at: { line: 'L02', word: 'proibido', offset: 0.1 }, p: { level: 0.2, freq: 520 } },
        { sfx: 'pop', at: { line: 'L02', word: 'tres', offset: 0.1 }, p: { level: 0.22, freq: 620 } },
        { sfx: 'pop', at: { line: 'L02', word: 'dia', offset: -0.1 }, p: { level: 0.22, freq: 740 } },
      ],
      setup(w) { w.reset(); w.seatPresident(); w.state.sit = 1; w.pres.pose.smile = 1; },
      update(w, c) {
        const rule = c.k({ line: 'L01', word: 'ditador' }, { line: 'L01', word: 'ditador', offset: 0.5 });
        w.pres.pose.point = c.k({ line: 'L02', word: 'proibido' }, { line: 'L02', word: 'tres' }) * 0.8;
        w.pres.pose.lookPitch = 0.1 - rule * 0.05;
        cameraPath(c.cam, [
          { u: 0, pos: [2.5, 3.4, 7.5], look: [0, 3.1, -7], fov: 44 },
          { u: 0.5, pos: [1.2, 3.2, 5.0], look: [0, 3.1, -7], fov: 38 },
          { u: 1, pos: [0.3, 3.1, 3.4], look: [0, 3.1, -7], fov: 34 },
        ], c.u);
        shake(c.cam, rule * 0.02, c.t);
      },
      draw2D(g, c) {
        const five = c.k({ line: 'L02', word: 'cinco', offset: -0.1 }, { line: 'L02', word: 'cinco', offset: 0.1 });
        drawClock(g, five < 0.5 ? '08:00' : '08:05', c.lt, { alpha: 1 });
        ['proibido', 'tres', 'dia'].forEach((wd, i) => {
          const a = c.k({ line: 'L02', word: wd, offset: 0.05 }, { line: 'L02', word: wd, offset: 0.35 });
          drawChip(g, '???', 540 + (i - 1) * 260, 330, { size: 70, alpha: a, scale: 0.6 + 0.4 * a, border: COLORS.red });
        });
      },
    },

    // 3. DECRETO 1 — proibido segunda-feira
    {
      id: 'calendario', world: 'palace', start: { line: 'L03', offset: -0.3 }, transition: 'flash',
      music: { mood: 'action', intensity: 0.55 },
      cues: [
        { sfx: 'pop', at: { line: 'L03', word: 'um' }, p: { level: 0.22, freq: 520 } },
        { sfx: 'crack', at: { line: 'L03', word: 'segundafeira', offset: 0.2 }, p: { level: 0.45 } },
        { sfx: 'whoosh', at: { line: 'L03', word: 'segundafeira', offset: 0.1 }, p: { dur: 0.7, level: 0.3 } },
        { sfx: 'shimmer', at: { line: 'L03', word: 'comemorou' }, p: { level: 0.12 } },
      ],
      setup(w) {
        w.reset();
        for (let i = 0; i < 6; i++) place(w.crowd[i], X.cal - 3.75 + i * 1.5, 0, 1.2 + (i % 2) * 0.9, (i - 2.5) * -0.05);
      },
      update(w, c) {
        w.state.calRip = c.k({ line: 'L03', word: 'segundafeira', offset: 0.15 }, { line: 'L03', word: 'terca', offset: -0.1 });
        const cheer = c.k({ line: 'L03', word: 'comemorou', offset: -0.2 }, { line: 'L03', word: 'comemorou', offset: 0.3 });
        w.crowd.slice(0, 6).forEach((ch, i) => {
          ch.pose.armsUp = cheer; ch.pose.smile = 1;
          ch.root.position.y = cheer * Math.abs(Math.sin(c.t * 7 + i * 1.3)) * 0.55;
        });
        cameraPath(c.cam, [
          { u: 0, pos: [X.cal + 0.4, 2.8, 12.5], look: [X.cal, 5.6, -13], fov: 54 },
          { u: 1, pos: [X.cal - 0.3, 2.6, 11], look: [X.cal, 5.2, -13], fov: 54 },
        ], c.u);
        shake(c.cam, cheer * 0.012, c.t);
      },
      draw2D(g, c) {
        drawClock(g, '08:01', c.lt);
        const a = c.k({ line: 'L03', word: 'um' }, { line: 'L03', word: 'um', offset: 0.3 });
        drawChip(g, 'DECRETO Nº 1', 540, 300, { size: 60, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.gold });
        const b = c.k({ line: 'L03', word: 'proibido' }, { line: 'L03', word: 'proibido', offset: 0.3 });
        drawChip(g, 'PROIBIDO SEGUNDA-FEIRA', 540, 400, { size: 48, alpha: b, scale: 0.7 + 0.3 * b, border: COLORS.red });
      },
    },

    // 4. DECRETO 2 — proibido fila
    {
      id: 'banco', world: 'palace', start: { line: 'L04', offset: -0.3 }, transition: 'whip',
      music: { mood: 'action', intensity: 0.65 },
      cues: [
        { sfx: 'pop', at: { line: 'L04', word: 'dois' }, p: { level: 0.22, freq: 560 } },
        { sfx: 'impact', at: { line: 'L04', word: 'primeiro' }, p: { level: 0.35, size: 0.7 } },
        { sfx: 'steps', at: { line: 'L04', word: 'primeiro', offset: 0.1 }, p: { count: 8, step: 0.12, level: 0.3 } },
        { sfx: 'impact', at: { line: 'L04', word: 'ringue' }, p: { level: 0.5 } },
      ],
      setup(w) {
        w.reset();
        for (let i = 0; i < 8; i++) place(w.crowd[i], X.bank - 3.5 + i * 1.0, 0, -3.2 - (i % 3) * 0.6, 0);
      },
      update(w, c) {
        const chaos = c.k({ line: 'L04', word: 'agora' }, { line: 'L04', word: 'ringue' });
        w.state.chaos = chaos;
        w.crowd.slice(0, 8).forEach((ch, i) => {
          const home = X.bank - 3.5 + i * 1.0;
          const rush = chaos * (X.bank - 1 - home) * 0.0 + Math.sin(c.t * (9 + i) + i) * chaos * 1.0;
          ch.root.position.x = home * (1 - chaos * 0.0) + rush;
          ch.root.position.z = -3.2 - (i % 3) * 0.6 - chaos * (1.5 + (i % 3) * 0.4) + Math.sin(c.t * 11 + i * 2) * chaos * 0.35;
          ch.root.position.y = chaos * Math.max(0, Math.sin(c.t * 8 + i * 1.7)) * 0.6;
          ch.pose.armsUp = chaos > 0.2 ? 1 : 0; ch.pose.surprise = chaos * 0.8; ch.root.rotation.y = Math.sin(c.t * 6 + i) * 0.5 * chaos;
        });
        cameraPath(c.cam, [
          { u: 0, pos: [X.bank + 0.6, 3.0, 8.5], look: [X.bank, 4.0, -8], fov: 54 },
          { u: 1, pos: [X.bank - 0.4, 2.8, 7.2], look: [X.bank, 3.8, -8], fov: 54 },
        ], c.u);
        shake(c.cam, chaos * 0.05, c.t);
      },
      draw2D(g, c) {
        drawClock(g, '08:03', c.lt);
        const a = c.k({ line: 'L04', word: 'dois' }, { line: 'L04', word: 'dois', offset: 0.3 });
        drawChip(g, 'DECRETO Nº 2', 540, 300, { size: 60, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.gold });
        const b = c.k({ line: 'L04', word: 'proibido' }, { line: 'L04', word: 'proibido', offset: 0.3 });
        drawChip(g, 'PROIBIDO FILA', 540, 400, { size: 52, alpha: b, scale: 0.7 + 0.3 * b, border: COLORS.red });
      },
    },

    // 5. DECRETO 3 — proibido "só mais cinco minutinhos"
    {
      id: 'despertador', world: 'palace', start: { line: 'L05', offset: -0.3 }, transition: 'glitch',
      music: { mood: 'tension', intensity: 0.55 },
      cues: [
        { sfx: 'pop', at: { line: 'L05', word: 'tres' }, p: { level: 0.22, freq: 600 } },
        { sfx: 'alarm', at: { line: 'L05', word: 'despertador' }, until: { line: 'L05', word: 'bracos', offset: 0.5 }, p: { level: 0.07 } },
        { sfx: 'whoosh', at: { line: 'L05', word: 'bracos', offset: 0.1 }, p: { dur: 0.5, level: 0.35 } },
        { sfx: 'impact', at: { line: 'L05', word: 'bracos', offset: 0.35 }, p: { level: 0.4 } },
      ],
      setup(w) {
        w.reset();
        const s = w.sleeper.root; s.visible = true;
        s.position.set(X.bed + 0.7, 1.62, -7);
        s.rotation.set(-Math.PI / 2, Math.PI / 2, 0, 'YXZ');
      },
      update(w, c) {
        w.state.pull = c.k({ line: 'L05', word: 'bracos', offset: 0.05 }, { line: 'L05', word: 'bracos', offset: 0.7 });
        w.sleeper.pose.sleep = 1 - w.state.pull * 0.6; w.sleeper.pose.scared = w.state.pull;
        cameraPath(c.cam, [
          { u: 0, pos: [X.bed + 2.4, 4.6, 13], look: [X.bed + 1.8, 2.8, -7], fov: 56 },
          { u: 1, pos: [X.bed + 1.8, 4.0, 11], look: [X.bed + 1.8, 2.6, -7], fov: 56 },
        ], c.u);
        shake(c.cam, w.state.pull * 0.03, c.t);
      },
      draw2D(g, c) {
        drawClock(g, '08:05', c.lt);
        const a = c.k({ line: 'L05', word: 'tres' }, { line: 'L05', word: 'tres', offset: 0.3 });
        drawChip(g, 'DECRETO Nº 3', 540, 300, { size: 60, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.gold });
        const b = c.k({ line: 'L05', word: 'proibido' }, { line: 'L05', word: 'proibido', offset: 0.3 });
        drawChip(g, 'PROIBIDO "MAIS 5 MINUTINHOS"', 540, 400, { size: 42, alpha: b, scale: 0.7 + 0.3 * b, border: COLORS.red });
      },
    },

    // 6. DECRETO 4 — proibido spoiler (prisão do sofá)
    {
      id: 'sofa', world: 'palace', start: { line: 'L06', offset: -0.3 }, transition: 'whip',
      music: { mood: 'action', intensity: 0.65 },
      cues: [
        { sfx: 'ding', at: { line: 'L06', word: 'dez' }, p: { level: 0.14 } },
        { sfx: 'braam', at: { line: 'L06', word: 'auge' }, p: { dur: 2.5, level: 0.3 } },
        { sfx: 'pop', at: { line: 'L06', word: 'quatro' }, p: { level: 0.22, freq: 640 } },
        { sfx: 'impact', at: { line: 'L06', word: 'prisao' }, p: { level: 0.55 } },
        { sfx: 'crack', at: { line: 'L06', word: 'prisao', offset: 0.05 }, p: { level: 0.3 } },
      ],
      setup(w) {
        w.reset();
        w.prisoner.root.visible = true;
        w.prisoner.root.position.set(X.sofa, 1.18, -6.9);
        w.prisoner.root.rotation.set(0, 0, 0);
        w.prisoner.pose.smile = 0.8;
      },
      update(w, c) {
        w.state.bars = c.k({ line: 'L06', word: 'prisao', offset: -0.05 }, { line: 'L06', word: 'prisao', offset: 0.35 });
        const talk = c.k({ line: 'L06', word: 'contar' }, { line: 'L06', word: 'final' });
        w.prisoner.pose.point = talk * (1 - w.state.bars);
        w.prisoner.pose.smile = 1 - w.state.bars; w.prisoner.pose.scared = w.state.bars; w.prisoner.pose.armsUp = w.state.bars * 0.8;
        cameraPath(c.cam, [
          { u: 0, pos: [X.sofa - 0.6, 3.6, 12], look: [X.sofa, 3.4, -7], fov: 54 },
          { u: 1, pos: [X.sofa + 0.4, 3.2, 9.5], look: [X.sofa, 3.2, -7], fov: 50 },
        ], c.u);
        shake(c.cam, Math.max(0, 1 - c.since({ line: 'L06', word: 'prisao' }) * 3) * 0.1 * (c.since({ line: 'L06', word: 'prisao' }) > 0 ? 1 : 0), c.t);
      },
      draw2D(g, c) {
        const pre = c.k({ line: 'L06', word: 'dez' }, { line: 'L06', word: 'dez', offset: 0.2 });
        drawClock(g, pre < 0.5 ? '08:08' : '08:10', c.lt);
        const a = c.k({ line: 'L06', word: 'quatro' }, { line: 'L06', word: 'quatro', offset: 0.3 });
        drawChip(g, 'DECRETO Nº 4', 540, 300, { size: 60, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.gold });
        const b = c.k({ line: 'L06', word: 'spoiler' }, { line: 'L06', word: 'spoiler', offset: 0.3 });
        drawChip(g, 'PROIBIDO SPOILER', 540, 400, { size: 52, alpha: b, scale: 0.7 + 0.3 * b, border: COLORS.red });
      },
    },

    // 7. DECRETO 5 — proibido grupo da família no WhatsApp
    {
      id: 'zap', world: 'palace', start: { line: 'L07', offset: -0.3 }, transition: 'glitch',
      music: { mood: 'action', intensity: 0.6 },
      cues: [
        { sfx: 'pop', at: { line: 'L07', word: 'cinco' }, p: { level: 0.22, freq: 680 } },
        { sfx: 'ding', at: { line: 'L07', word: 'grupo' }, until: { line: 'L07', word: 'silencio' }, p: { level: 0.1, repeat: 0.2 } },
        { sfx: 'ding', at: { line: 'L07', word: 'familia' }, p: { level: 0.14 } },
        { sfx: 'ding', at: { line: 'L07', word: 'whatsapp' }, p: { level: 0.14 } },
        { sfx: 'shimmer', at: { line: 'L07', word: 'silencio' }, p: { level: 0.1 } },
      ],
      setup(w) {
        w.reset();
        for (let i = 0; i < 4; i++) place(w.crowd[i], X.phone - 4.5 + i * 3, 0, -3.4 - (i % 2) * 0.8, 0);
      },
      update(w, c) {
        w.state.muted = c.k({ line: 'L07', word: 'silencio', offset: -0.05 }, { line: 'L07', word: 'silencio', offset: 0.1 }) > 0.5 ? 1 : 0;
        const ease = w.state.muted;
        w.crowd.slice(0, 4).forEach((ch, i) => {
          ch.pose.scared = (1 - ease) * 0.9; ch.pose.cover = (1 - ease) * (i % 2 ? 0.8 : 0.0);
          ch.pose.smile = ease; ch.pose.lookPitch = -ease * 0.1;
          ch.root.position.y = (1 - ease) * Math.abs(Math.sin(c.t * 14 + i)) * 0.06;
        });
        cameraPath(c.cam, [
          { u: 0, pos: [X.phone, 5.8, 15.5], look: [X.phone, 5.2, -7], fov: 52 },
          { u: 1, pos: [X.phone, 5.6, 11], look: [X.phone, 5.2, -7], fov: 48 },
        ], c.u);
        shake(c.cam, (1 - ease) * 0.03, c.t);
      },
      draw2D(g, c) {
        drawClock(g, '08:12', c.lt);
        const a = c.k({ line: 'L07', word: 'cinco' }, { line: 'L07', word: 'cinco', offset: 0.3 });
        drawChip(g, 'DECRETO Nº 5', 540, 300, { size: 60, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.gold });
        const b = c.k({ line: 'L07', word: 'proibido' }, { line: 'L07', word: 'proibido', offset: 0.3 });
        drawChip(g, 'PROIBIDO GRUPO DA FAMÍLIA', 540, 400, { size: 44, alpha: b, scale: 0.7 + 0.3 * b, border: COLORS.red });
      },
    },

    // 8. DECRETO 6 — proibido feijoada de domingo (o povo não aceita)
    {
      id: 'feijoada', world: 'palace', start: { line: 'L08', offset: -0.3 }, transition: 'flash',
      music: { mood: 'tension', intensity: 0.75 },
      cues: [
        { sfx: 'riser', at: { line: 'L08', word: 'proibido' }, until: { line: 'L08', word: 'feijoada', offset: 0.1 }, p: { level: 0.25 } },
        { sfx: 'braam', at: { line: 'L08', word: 'feijoada', offset: 0.1 }, p: { dur: 3, level: 0.45 } },
        { sfx: 'impact', at: { line: 'L08', word: 'feijoada', offset: 0.1 }, p: { level: 0.6 } },
        { sfx: 'heartbeat', at: { line: 'L08', word: 'ninguem' }, until: { after: 'L08' }, p: { bpm: 70, bpmEnd: 110, level: 0.6 } },
      ],
      setup(w) {
        w.reset();
        for (let i = 0; i < 5; i++) place(w.crowd[i], X.pot - 5 + i * 2.5, 0, -3.2 - (i % 2) * 0.9, 0);
      },
      update(w, c) {
        w.state.ban = c.k({ line: 'L08', word: 'feijoada', offset: 0.05 }, { line: 'L08', word: 'feijoada', offset: 0.45 });
        const stare = c.k({ line: 'L08', word: 'ninguem' }, { line: 'L08', word: 'aceitou' });
        w.crowd.slice(0, 5).forEach((ch, i) => {
          ch.pose.surprise = w.state.ban * (1 - stare * 0.6); ch.pose.scared = w.state.ban * 0.5 + stare * 0.3;
          ch.pose.armsUp = stare; ch.root.rotation.y = Math.sin(c.t * 2 + i) * 0.1;
          ch.root.position.y = stare * Math.abs(Math.sin(c.t * 9 + i * 1.4)) * 0.2;
        });
        cameraPath(c.cam, [
          { u: 0, pos: [X.pot + 0.5, 5.4, 11.5], look: [X.pot, 4.6, -7], fov: 54 },
          { u: 1, pos: [X.pot - 0.3, 5.0, 9.2], look: [X.pot, 4.6, -6.5], fov: 52 },
        ], c.u);
        shake(c.cam, w.state.ban * 0.03 + stare * 0.03, c.t);
      },
      draw2D(g, c) {
        drawClock(g, '08:15', c.lt, { danger: c.k({ line: 'L08', word: 'feijoada' }, { line: 'L08', word: 'feijoada', offset: 0.3 }) > 0.5 });
        const a = c.k({ line: 'L08', word: 'seis' }, { line: 'L08', word: 'seis', offset: 0.3 });
        drawChip(g, 'DECRETO Nº 6', 540, 300, { size: 60, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.gold });
        const b = c.k({ line: 'L08', word: 'feijoada', offset: 0.1 }, { line: 'L08', word: 'feijoada', offset: 0.4 });
        drawChip(g, 'PROIBIDO FEIJOADA', 540, 400, { size: 52, alpha: b, scale: 0.7 + 0.3 * b, border: COLORS.red });
      },
    },

    // 9. A REVOLTA — o povo desobedece
    {
      id: 'revolta', world: 'palace', start: { line: 'L09', offset: -0.3 }, transition: 'whip',
      music: { mood: 'action', intensity: 0.95 },
      cues: [
        { sfx: 'steps', at: { line: 'L09', word: 'levantou' }, until: { line: 'L09', word: 'familia', offset: -0.4 }, p: { count: 16, step: 0.14, level: 0.4 } },
        { sfx: 'siren', at: { line: 'L09', word: 'levantou' }, until: { line: 'L09', word: 'ficou' }, p: { level: 0.05, rate: 0.4 } },
        { sfx: 'pop', at: { line: 'L09', word: 'segundafeira' }, p: { level: 0.25, freq: 520 } },
        { sfx: 'pop', at: { line: 'L09', word: 'fila' }, p: { level: 0.25, freq: 620 } },
        { sfx: 'pop', at: { line: 'L09', word: 'minutinhos' }, p: { level: 0.25, freq: 740 } },
        { sfx: 'ding', at: { line: 'L09', word: 'ficou' }, p: { level: 0.16 } },
      ],
      setup(w) {
        w.reset(); w.seatPresident(); w.state.sit = 1; w.pres.pose.smile = 0;
        for (let i = 0; i < 8; i++) place(w.crowd[i], X.throne - 7 + i * 2, 0, 20, Math.PI * 0);
      },
      update(w, c) {
        const march = c.k({ line: 'L09', word: 'levantou' }, { line: 'L09', word: 'volta', offset: 0.1 });
        w.state.mob = march;
        w.crowd.slice(0, 8).forEach((ch, i) => {
          ch.root.position.set(X.throne - 7 + i * 2 + Math.sin(i * 2.1) * 0.8, Math.abs(Math.sin(c.t * 8 + i)) * 0.25 * march, lerp(22, 0.5 + (i % 3) * 0.6, march));
          ch.pose.run = march < 0.98 ? 1 : 0; ch.pose.armsUp = march > 0.4 ? 1 : 0; ch.pose.surprise = 0.2;
        });
        w.pres.pose.scared = march; w.pres.pose.surprise = march * 0.7;
        const fam = c.k({ line: 'L09', word: 'grupo' }, { line: 'L09', word: 'familia' });
        w.pres.pose.smile = 0.6 * fam * (1 - c.k({ line: 'L09', word: 'ficou' }, { line: 'L09', word: 'ficou', offset: 0.1 })) * 0 + 0;
        cameraPath(c.cam, [
          { u: 0, pos: [0, 6.5, 24], look: [0, 3, 2], fov: 52 },
          { u: 0.6, pos: [0, 4.0, 11], look: [0, 3.2, -4], fov: 50 },
          { u: 1, pos: [0.4, 3.4, 6.8], look: [0, 3.2, -6], fov: 44 },
        ], c.u);
        shake(c.cam, march * 0.03, c.t);
      },
      draw2D(g, c) {
        drawClock(g, '08:20', c.lt, { danger: true });
        const row = [['segundafeira', 'SEGUNDA VOLTOU', 330], ['fila', 'FILA VOLTOU', 420], ['minutinhos', '5 MINUTINHOS VOLTARAM', 510]];
        row.forEach(([wd, txt, y]) => {
          const a = c.k({ line: 'L09', word: wd }, { line: 'L09', word: wd, offset: 0.25 });
          drawChip(g, txt, 540, y, { size: 44, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.green, color: '#c8ffd0' });
        });
        const gp = c.k({ line: 'L09', word: 'grupo' }, { line: 'L09', word: 'grupo', offset: 0.25 });
        drawChip(g, 'GRUPO DA FAMÍLIA: CONTINUA PROIBIDO', 540, 600, { size: 38, alpha: gp, scale: 0.7 + 0.3 * gp, border: COLORS.blue });
      },
    },

    // 10. DEMISSÃO — carimbo
    {
      id: 'demissao', world: 'palace', start: { line: 'L10', offset: -0.3 }, transition: 'flash',
      music: { mood: 'wonder', intensity: 0.6 },
      cues: [
        { sfx: 'braam', at: { line: 'L10', word: 'ditadura' }, p: { dur: 2, level: 0.25 } },
        { sfx: 'impact', at: { line: 'L10', word: 'carimbo' }, p: { level: 0.75, size: 1.2 } },
        { sfx: 'crack', at: { line: 'L10', word: 'carimbo', offset: 0.05 }, p: { level: 0.4 } },
        { sfx: 'pop', at: { line: 'L10', word: 'bracos' }, p: { level: 0.25, freq: 700 } },
        { sfx: 'shimmer', at: { line: 'L10', word: 'bracos', offset: 0.2 }, p: { level: 0.1 } },
      ],
      setup(w) {
        w.reset(); w.seatPresident(); w.state.sit = 1; w.pres.pose.scared = 0.7;
        for (let i = 0; i < 6; i++) place(w.crowd[i], X.throne - 6 + i * 2.4, 0, -1 + (i % 2) * 1.4, 0);
      },
      update(w, c) {
        w.state.crownFall = c.k({ line: 'L10', word: 'carimbo', offset: 0.05 }, { line: 'L10', word: 'carimbo', offset: 0.9 });
        const done = c.k({ line: 'L10', word: 'demitido' }, { line: 'L10', word: 'carimbo' });
        w.pres.pose.scared = 0.7 + done * 0.3; w.pres.pose.cover = done * 0.5;
        w.crowd.slice(0, 6).forEach((ch, i) => { ch.pose.armsUp = 1; ch.pose.smile = 1; ch.root.position.y = Math.abs(Math.sin(c.t * 7 + i * 1.2)) * 0.45; });
        cameraPath(c.cam, [
          { u: 0, pos: [0, 4.4, 11], look: [0, 3.2, -6], fov: 50 },
          { u: 1, pos: [0.5, 3.4, 5.6], look: [0, 3.2, -7], fov: 42 },
        ], c.u);
        const st = c.since({ line: 'L10', word: 'carimbo' });
        shake(c.cam, st > 0 ? Math.max(0, 1 - st * 2.2) * 0.14 : 0, c.t);
      },
      draw2D(g, c) {
        drawClock(g, '08:20', c.lt, { danger: true });
        const a = c.k({ line: 'L10', word: 'vinte' }, { line: 'L10', word: 'vinte', offset: 0.3 });
        drawChip(g, 'DITADURA: 20 MINUTOS', 540, 330, { size: 48, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.gold });
        // carimbo "DEMITIDO"
        const s = c.since({ line: 'L10', word: 'carimbo' });
        if (s > 0) {
          const k = clamp01(s / 0.18), sc = 1 + (1 - k) * 2.4;
          g.save(); g.translate(540, 940); g.rotate(-0.22); g.scale(sc, sc); g.globalAlpha = Math.min(1, k * 1.4);
          g.strokeStyle = '#e5202a'; g.lineWidth = 16; g.fillStyle = 'rgba(255,255,255,0.12)';
          g.beginPath(); g.roundRect(-380, -120, 760, 240, 24); g.fill(); g.stroke();
          g.fillStyle = '#e5202a'; g.font = `190px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText('DEMITIDO', 0, 8); g.restore();
        }
      },
    },

    // 11. PERGUNTA — chamada para comentar
    {
      id: 'pergunta', world: 'palace', start: { line: 'L11', offset: -0.3 }, transition: 'whip',
      music: { mood: 'calm', intensity: 0.7 },
      cues: [
        { sfx: 'pop', at: { line: 'L11', word: 'comenta' }, p: { level: 0.28, freq: 620 } },
      ],
      setup(w) {
        w.reset(); w.seatPresident(); w.state.sit = 1; w.state.crownFall = 1; w.pres.pose.smile = 0.2;
        for (let i = 0; i < 4; i++) place(w.crowd[i], X.throne - 3.6 + i * 2.4, 0, 0.5 + (i % 2) * 0.8, 0);
      },
      update(w, c) {
        w.crowd.slice(0, 4).forEach((ch, i) => { ch.pose.wave = 1; ch.pose.smile = 1; ch.root.position.y = Math.abs(Math.sin(c.t * 5 + i)) * 0.15; });
        w.pres.pose.surprise = c.k({ line: 'L11', word: 'proibiria' }, { line: 'L11', word: 'proibiria', offset: 0.3 }) * 0.6;
        cameraPath(c.cam, [
          { u: 0, pos: [0, 3.4, 9], look: [0, 3.0, -4], fov: 46 },
          { u: 1, pos: [0.4, 3.2, 6.8], look: [0, 3.0, -4], fov: 42 },
        ], c.u);
      },
      draw2D(g, c) {
        const a = c.k({ line: 'L11', word: 'comenta' }, { line: 'L11', word: 'comenta', offset: 0.3 });
        drawChip(g, 'QUAL DECRETO VOCÊ PROIBIRIA?', 540, 330, { size: 44, alpha: Math.max(a, c.k({ local: 0.1 }, { local: 0.5 })), scale: 0.8 + 0.2 * a, border: COLORS.gold });
        drawChip(g, 'COMENTA AÍ 💬', 540, 430, { size: 54, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.blue });
      },
    },

    // 12. TELA FINAL OBRIGATÓRIA — HISTÓRIAS DO TABOCAL
    {
      id: 'final', world: 'palace', start: { after: 'L11', offset: 0.5 }, transition: 'flash', duration: 6.8,
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
      setup(w) { w.reset(); w.seatPresident(); w.state.sit = 1; w.state.crownFall = 1; },
      update(w, c) {
        cameraPath(c.cam, [
          { u: 0, pos: [0, 5, 20], look: [0, 3, -7], fov: 50 },
          { u: 1, pos: [0, 6, 28], look: [0, 4, -7], fov: 52 },
        ], c.u);
      },
      draw2D(g, c) { drawEndCard(g, c.lt, c.dur, c.t); },
      noSubtitles: true, noBug: true,
    },
  ],
};
