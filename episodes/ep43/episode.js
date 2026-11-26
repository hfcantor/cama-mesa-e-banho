// EP43 — Receita caseira #7: chá de gengibre
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const T = (word) => ({ line: 'L12', word, offset: 0 });
export default buildFato({
  id: 'ep43', titulo: 'Chá de gengibre', lines: LINES, defaultSubject: 'kit',
  fato: {
    sky: 'kitchen', ground: 'wood', seed: 13, center: [0, 0, 0],
    props: [
      { id: 'wall', type: 'wall', pos: [0, 0, -10], o: { tile: '#f7efdf', windowX: 4, shelfX: -8 } },
      { id: 'mug', type: 'vessel', pos: [0, 0, 0], s: 1.7, o: { kind: 'mug', clear: true, c0: '#cfe9f5', c1: '#e8cf7a', color: '#f4f1ea', leaf: '#ecd488' }, v: { fill: 0 } },
      { id: 'mug2', type: 'vessel', pos: [-3.6, 0, 0], s: 1.7, o: { kind: 'mug', clear: true, c0: '#e8cf7a', color: '#f4f1ea' }, v: { fill: 0, steam: 1 }, hide: true },
      { id: 'kettle', type: 'vessel', pos: [1.25, 0.9, 0], s: 1.4, o: { kind: 'kettle', c0: '#cfe9f5' }, v: { fill: 0.7, steam: 1, drop: 1.9 }, hide: true },
      { id: 'board', type: 'board', pos: [-5.2, 0, 0.8] },
      { id: 'gin', type: 'ginger', pos: [-5.0, 0.19, 0.8], s: 1.6 },
      { id: 'knife', type: 'knife', pos: [-3.4, 0.2, 1.6], s: 1.5, ry: 0.2 },
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
    ginL: { at: [-5.0, 0.9, 0.8], r: 3.8, ly: 1.3, styles: ['mid', 'close'] },
    chop: { at: [-4.6, 1.0, 1.0], r: 3.8, ly: 1.0, styles: ['mid', 'close', 'macro'], v: { knife: { chop: 1 }, gin: { slice: 0.6 } } },
    sliced: { at: [-4.6, 0.9, 1.0], r: 3.4, ly: 1.0, styles: ['mid', 'close', 'macro'], v: { gin: { slice: 1 } } },
    potS: { at: [5.1, 2.2, -4.0], r: 4.2, ly: 0.9, styles: ['mid', 'close', 'low'], v: { stove: { vis: 1, flame: 1 }, pot: { vis: 1 } } },
    pourK: { at: [0.5, 2.3, 0], r: 4.8, ly: 1.0, styles: ['mid', 'low', 'close'], v: { kettle: { vis: 1, stream: 1 } } },
    lid: { at: [0, 1.9, 0], r: 3.4, ly: 1.0, styles: ['mid', 'close', 'low'], v: { saucer: { vis: 1 } } },
    strain: { at: [-2.8, 2.4, 0], r: 5.0, ly: 1.0, styles: ['mid', 'low', 'close'], v: { mug: { x: -2.55, y: 1.45, tilt: 1, stream: 1, drop: 0.7 }, mug2: { vis: 1 }, strainer: { vis: 1 }, saucer: { vis: 0 } } },
    sip: { at: [-3.6, 1.0, 0], r: 3.6, ly: 1.0, styles: ['mid', 'close'], v: { mug: { vis: 0 }, mug2: { vis: 1, fill: 0.8 }, strainer: { vis: 0 } } },
    tito: { at: [7.0, 1.25, 3.2], r: 1.2, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { smile: 0.6 } } } },
    titoSick: { at: [7.0, 1.25, 3.2], r: 1.2, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 0.7, smile: 0 } } } },
    titoHappy: { at: [7.0, 1.25, 3.2], r: 1.2, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { smile: 1 } } } },
  },
  plan: {
    L01: { n: 4, s: ['kit', 'titoSick', 'ginL', 'mug'], v: { tito: { vis: 1 } }, hud: [[0, 'kicker', { n: 7, name: 'CHÁ DE GENGIBRE', uses: ['ENJOO E NÁUSEA', 'ESTÔMAGO EMBRULHADO', 'MAIS ESTUDADO'], color: 'orange' }], [1, 'pop', 'UUUGH...', 540, 520, { size: 130, color: '#6BE37A', dur: 1.2 }]] },
    L02: { n: 3, s: ['ginL', 'mugLow', 'ginL'], v: { tito: { vis: 0 } }, hud: [['*', 'ingr', [
      { amt: '2 RODELAS', name: 'Gengibre fresco', sub: 'bem finas', line: 'L02', word: 4 },
      { amt: '1 XÍCARA', name: 'Água quente', sub: 'cerca de 200 ml', line: 'L02', word: 11 }], { y: 450, color: 'orange' }]] },
    L03: { n: 3, s: ['chop', 'chop', 'sliced'], hud: [[0, 'step', { n: 1, total: 4, title: 'DESCASQUE E CORTE', color: 'orange' }], [2, 'qty', { amount: '2 RODELAS FINAS', note: 'sem exagerar no gengibre', y: 560, color: 'gold' }]] },
    L04: { n: 2, s: ['potS', 'potS'], hud: [[0, 'step', { n: 2, total: 4, title: 'FERVA A ÁGUA', color: 'orange' }], [1, 'tag', 'DESLIGUE O FOGO', { dot: 'orange', size: 46, y: 520 }]] },
    L05: { n: 3, s: ['sliced', 'pourK', 'pourK'], v: { stove: { vis: 0 }, pot: { vis: 0 } }, la: { 'mug.floaters': [0.3, 0.4], 'mug.fill': [0, 0.85], 'mug.mix': [0, 0.5] }, hud: [[0, 'step', { n: 3, total: 4, title: 'RODELAS E ÁGUA', color: 'gold' }]] },
    L06: { n: 3, s: ['lid', 'lid', 'mugLow'], v: { kettle: { vis: 0, stream: 0 }, board: { vis: 0 }, knife: { vis: 0 }, gin: { vis: 0 } }, la: { 'mug.mix': [0.5, 1] }, hud: [[0, 'step', { n: 4, total: 4, title: 'TAMPE E ESPERE', color: 'orange' }], [0, 'timer', { label: 'INFUSÃO', secs: 600, p0: 0, p1: 1, y: 600, color: 'orange' }], [2, 'qty', { amount: '5 A 10 MINUTOS', note: 'tampado', y: 470, color: 'gold' }]] },
    L07: { n: 3, s: ['strain', 'sip', 'titoHappy'], v: { saucer: { vis: 0 }, tito: { vis: 1 } }, la: { 'mug2.fill': [0, 0.85], 'mug.fill': [0.85, 0.3] }, hud: [[1, 'tag', 'MORNO, EM PEQUENOS GOLES', { dot: 'orange', size: 40, y: 520 }]] },
    L08: { n: 2, s: ['titoHappy', 'sip'], v: { strainer: { vis: 0 } }, hud: [[0, 'tag', 'ESTUDOS: ALÍVIO DA NÁUSEA', { dot: 'green', size: 40, y: 460 }], [1, 'tag', 'VIAGEM: EVIDÊNCIA MAIS FRACA', { dot: 'orange', size: 38, y: 520 }]] },
    L09: { n: 3, s: ['titoSick', 'sip', 'titoSick'], hud: [[0, 'caution', { title: 'ATENÇÃO', items: ['Gestante: fale com o obstetra antes', 'Pode causar azia ou queimação em algumas pessoas'], y: 380 }]] },
    L10: { n: 2, s: ['titoSick', 'tito'], hud: [[0, 'caution', { title: 'PROCURE UM MÉDICO', items: ['Vômitos que não param', 'Dor forte na barriga, sangue ou febre'], y: 400 }], [1, 'disc', { y: 1500 }]] },
    L11: { n: 1, s: ['kit'], hud: [[0, 'quiz', { q: 'Quantas rodelas finas de gengibre por xícara?', opts: ['Uma ou duas', 'Dez', 'Vinte'], ans: 0, reveal: 9.8, y: 300, color: 'orange' }]], sfx: [[0, 'ding', 9.9, { level: 0.2 }]] },
    L12: { n: 1, s: ['kit'], noSubs: true, hud: [[0, 'card', { name: 'CHÁ DE GENGIBRE', para: 'enjoo e náusea', color: 'orange',
      ingredients: ['2 rodelas finas de gengibre fresco', '1 xícara (200 ml) de água quente'],
      steps: ['Descasque e corte 2 rodelas finas', 'Ferva a água e desligue o fogo', 'Rodelas na xícara, água por cima', 'Tampe 5 a 10 min. Beba morno, aos goles'], note: 'Gestante: fale com o obstetra. Vômito forte: médico',
      at: [T(1), T(4), T(10), T(14), T(15), T(17), T(18)], y: 270 }]] },
    L13: { n: 2, s: ['titoHappy', 'kit'], hud: [[0, 'thought', 'q', 780, 520], [-1, 'chip', 'COMENTA AÍ', { delay: 0.5 }]] },
  },
  final: { s: 'kit', v: { mug2: { vis: 1, fill: 0.8 }, mug: { vis: 0 } } },
  music: [['L01', 'wonder', 0.55], ['L03', 'calm', 0.55], ['L09', 'tension', 0.45], ['L11', 'wonder', 0.6], ['L12', 'calm', 0.6]],
});
