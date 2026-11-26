// EP41 — Receita caseira #5: chá de camomila
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const T = (word) => ({ line: 'L12', word, offset: 0 });
export default buildFato({
  id: 'ep41', titulo: 'Chá de camomila', lines: LINES, defaultSubject: 'kit',
  fato: {
    sky: 'kitchen', ground: 'wood', seed: 11, center: [0, 0, 0],
    props: [
      { id: 'wall', type: 'wall', pos: [0, 0, -10], o: { tile: '#f6efe0', windowX: 4, shelfX: -8 } },
      { id: 'mug', type: 'vessel', pos: [0, 0, 0], s: 1.7, o: { kind: 'mug', clear: true, c0: '#cfe9f5', c1: '#e9cf62', color: '#f4f1ea', leafKind: 'flower' }, v: { fill: 0 } },
      { id: 'mug2', type: 'vessel', pos: [-3.6, 0, 0], s: 1.7, o: { kind: 'mug', clear: true, c0: '#e9cf62', color: '#f4f1ea' }, v: { fill: 0, steam: 1 }, hide: true },
      { id: 'kettle', type: 'vessel', pos: [1.25, 0.9, 0], s: 1.4, o: { kind: 'kettle', c0: '#cfe9f5' }, v: { fill: 0.7, steam: 1, drop: 1.9 }, hide: true },
      { id: 'dry', type: 'herb', pos: [-5.0, 0, 0.8], s: 1.4, o: { kind: 'dry', color: '#d6c46a' } },
      { id: 'fresh', type: 'herb', pos: [5.2, 0, 0.6], s: 1.5, o: { kind: 'chamomile' } },
      { id: 'spS', type: 'spoon', pos: [-5.0, 3.0, 1.2], s: 1.8, o: { kind: 'sopa', powder: '#e2d27c' }, hide: true },
      { id: 'stove', type: 'stove', pos: [6.4, 0, -3.4], s: 1.3, hide: true },
      { id: 'pot', type: 'vessel', pos: [5.1, 1.3, -4.0], s: 1.3, o: { kind: 'pot', c0: '#8fd3f2' }, v: { fill: 0.6, boil: 1, steam: 1, lid: 0 }, hide: true },
      { id: 'saucer', type: 'box', pos: [0, 1.95, 0], o: { w: 2.5, h: 0.14, d: 2.5, color: '#f3f3f3' }, hide: true },
      { id: 'strainer', type: 'strainer', pos: [-3.6, 2.0, 0], s: 1.1, hide: true },
      { id: 'tito', type: 'char', pos: [7.0, 0, 3.2], ry: -0.5, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    kit: { at: [-0.2, 2.2, 0], r: 7.4, az: 6, ly: 0.6, styles: ['wide', 'mid', 'high'] },
    mug: { at: [0, 1.0, 0], r: 3.8, az: 8, ly: 0.7, styles: ['mid', 'close', 'low'] },
    mugLow: { at: [0, 1.0, 0], r: 3.8, az: 8, ly: 1.5, styles: ['mid', 'close'] },
    dryL: { at: [-5.0, 0.8, 0.8], r: 3.4, ly: 1.3, styles: ['mid', 'close'] },
    freshL: { at: [5.2, 1.0, 0.6], r: 3.6, ly: 1.3, styles: ['mid', 'close'] },
    potS: { at: [5.1, 2.2, -4.0], r: 4.2, ly: 0.9, styles: ['mid', 'close', 'low'], v: { stove: { vis: 1, flame: 1 }, pot: { vis: 1 } } },
    spoonDry: { at: [-5.0, 3.0, 1.2], r: 2.6, ly: 0.9, styles: ['mid', 'close', 'macro'], v: { spS: { vis: 1, load: 1 } } },
    spoonDump: { at: [0.3, 3.2, 0.4], r: 4.4, ly: 1.0, styles: ['mid', 'close', 'low'], v: { spS: { vis: 1, load: 1, dump: 1, x: 5.3 } } },
    pourK: { at: [0.5, 2.3, 0], r: 4.8, ly: 1.0, styles: ['mid', 'low', 'close'], v: { kettle: { vis: 1, stream: 1 } } },
    lid: { at: [0, 1.9, 0], r: 3.4, ly: 1.0, styles: ['mid', 'close', 'low'], v: { saucer: { vis: 1 } } },
    strain: { at: [-2.8, 2.4, 0], r: 5.0, ly: 1.0, styles: ['mid', 'low', 'close'], v: { mug: { x: -2.55, y: 1.45, tilt: 1, stream: 1, drop: 0.7 }, mug2: { vis: 1 }, strainer: { vis: 1 }, saucer: { vis: 0 } } },
    sip: { at: [-3.6, 1.0, 0], r: 3.6, ly: 1.0, styles: ['mid', 'close'], v: { mug: { vis: 0 }, mug2: { vis: 1, fill: 0.8 }, strainer: { vis: 0 } } },
    tito: { at: [7.0, 1.25, 3.2], r: 1.2, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { smile: 0.6 } } } },
    titoAwake: { at: [7.0, 1.25, 3.2], r: 1.2, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { surprise: 0.5, smile: 0 } } } },
    titoSleep: { at: [7.0, 1.25, 3.2], r: 1.2, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { sleep: 0.9, smile: 0.4 } } } },
  },
  plan: {
    L01: { n: 4, s: ['kit', 'titoAwake', 'freshL', 'mug'], v: { tito: { vis: 1 } }, hud: [[0, 'kicker', { n: 5, name: 'CHÁ DE CAMOMILA', uses: ['RELAXAR ANTES DE DORMIR', 'NERVOSISMO LEVE', 'DESCONFORTO LEVE'], color: 'gold' }], [1, 'thought', 'moon', 780, 520]] },
    L02: { n: 4, s: ['dryL', 'mugLow', 'freshL', 'mugLow'], v: { tito: { vis: 0 } }, hud: [['*', 'ingr', [
      { amt: '1 COLHER', name: 'Flores secas', sub: 'de sopa, de camomila', line: 'L02', word: 4 },
      { amt: '1 XÍCARA', name: 'Água quente', sub: 'cerca de 200 ml', line: 'L02', word: 14 }], { y: 450, color: 'gold' }]] },
    L03: { n: 2, s: ['potS', 'potS'], v: { fresh: { vis: 0 } }, hud: [[0, 'step', { n: 1, total: 4, title: 'FERVA A ÁGUA', color: 'orange' }], [1, 'tag', 'DESLIGUE O FOGO', { dot: 'orange', size: 46, y: 520 }]] },
    L04: { n: 3, s: ['spoonDry', 'spoonDump', 'pourK'], v: { stove: { vis: 0 }, pot: { vis: 0 } }, la: { 'mug.floaters': [0, 1], 'mug.fill': [0, 0.85], 'mug.mix': [0, 0.5] }, hud: [[0, 'step', { n: 2, total: 4, title: 'FLORES E ÁGUA', color: 'gold' }], [0, 'qty', { amount: '1 COLHER DE SOPA', note: 'de flores secas', y: 560, color: 'gold' }]] },
    L05: { n: 3, s: ['lid', 'lid', 'mugLow'], v: { spS: { vis: 0 }, kettle: { vis: 0, stream: 0 }, dry: { vis: 0 } }, la: { 'mug.mix': [0.5, 1] }, hud: [[0, 'step', { n: 3, total: 4, title: 'TAMPE E ESPERE', color: 'orange' }], [0, 'timer', { label: 'INFUSÃO', secs: 600, p0: 0, p1: 1, y: 600, color: 'orange' }], [2, 'qty', { amount: '5 A 10 MINUTOS', note: 'esse é o segredo', y: 470, color: 'gold' }]] },
    L06: { n: 3, s: ['strain', 'strain', 'sip'], v: { saucer: { vis: 0 } }, la: { 'mug2.fill': [0, 0.85], 'mug.fill': [0.85, 0.3] }, hud: [[0, 'step', { n: 4, total: 4, title: 'COE E BEBA', color: 'green' }], [2, 'tag', 'MORNO, AOS POUCOS', { dot: 'orange', size: 46, y: 520 }]] },
    L07: { n: 3, s: ['titoSleep', 'sip', 'titoSleep'], v: { strainer: { vis: 0 }, tito: { vis: 1 } }, hud: [[0, 'thought', 'moon', 780, 520], [1, 'tag', 'À NOITE, SEM PRESSA', { dot: 'blue', size: 44, y: 460 }]] },
    L08: { n: 2, s: ['sip', 'titoAwake'], hud: [[0, 'tag', 'RELAXA DE FORMA LEVE', { dot: 'green', size: 44, y: 460 }], [1, 'tag', 'NÃO É REMÉDIO PARA INSÔNIA FORTE', { dot: 'orange', size: 36, y: 520 }]] },
    L09: { n: 3, s: ['titoAwake', 'sip', 'titoAwake'], hud: [[0, 'caution', { title: 'CUIDADO', items: ['Alergia a margarida e plantas parecidas: evite', 'Gestantes e quem usa anticoagulante: fale com o médico', 'Bebê muito pequeno não toma'], y: 360 }]] },
    L10: { n: 2, s: ['titoAwake', 'tito'], hud: [[0, 'caution', { title: 'PROCURE UM MÉDICO', items: ['Insônia que dura semanas', 'Ansiedade forte ou tristeza profunda'], y: 400 }], [1, 'disc', { y: 1500 }]] },
    L11: { n: 1, s: ['kit'], hud: [[0, 'quiz', { q: 'Quanto tempo deixar a camomila em infusão?', opts: ['30 segundos', '5 a 10 minutos', '1 hora'], ans: 1, reveal: 11.6, y: 300, color: 'gold' }]], sfx: [[0, 'ding', 11.7, { level: 0.2 }]] },
    L12: { n: 1, s: ['kit'], noSubs: true, hud: [[0, 'card', { name: 'CHÁ DE CAMOMILA', para: 'relaxar antes de dormir', color: 'gold',
      ingredients: ['1 colher de sopa de flores secas', '1 xícara (200 ml) de água quente'],
      steps: ['Ferva a água e desligue o fogo', 'Flores na xícara, água por cima', 'Tampe: 5 a 10 minutos', 'Coe e beba morno, aos poucos'], note: 'Alergia a margarida? Evite. Gestante: fale com o médico',
      at: [T(1), T(7), T(13), T(17), T(18), T(20), T(21)], y: 270 }]] },
    L13: { n: 2, s: ['titoSleep', 'kit'], hud: [[0, 'thought', 'q', 780, 520], [-1, 'chip', 'COMENTA AÍ', { delay: 0.5 }]] },
  },
  final: { s: 'kit', v: { mug2: { vis: 1, fill: 0.8 }, mug: { vis: 0 } } },
  music: [['L01', 'wonder', 0.55], ['L03', 'calm', 0.55], ['L09', 'tension', 0.45], ['L11', 'wonder', 0.6], ['L12', 'calm', 0.6]],
});
