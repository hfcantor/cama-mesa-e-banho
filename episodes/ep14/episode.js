// EP14 — Chernobil (1986)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const tree = (id, x, z, h = 3) => ({ id, type: 'tree', pos: [x, 0, z], o: { h, leaf: '#4a7a3a' } });
export default buildFato({
  id: 'ep14', titulo: 'Chernobil, 1986', lines: LINES, defaultSubject: 'reactor', ctaLine: 'L12',
  title: { kicker: 'FATO REAL', title: ['CHERNOBIL'], sub: '26 DE ABRIL DE 1986' },
  fato: {
    sky: 'toxic', ground: 'stone', center: [0, 0, -6],
    props: [
      { id: 'reactor', type: 'reactor', pos: [0, 0, -6] },
      { id: 'sign', type: 'sign', pos: [4, 0, 3], o: { kind: 'trefoil', w: 2, h: 2, pole: 1.2 } },
      { id: 'zone', type: 'sign', pos: [10, 0, 2], o: { kind: 'text', w: 4, h: 1.5, pole: 1.0, text: '30 KM', bg: '#e8453c', fg: '#ffffff' } },
      { id: 'b1', type: 'block', pos: [-12, 0, -16], ry: 0.2, o: { lit: 1, h: 10, seed: 3 }, v: { lit: 1 } },
      { id: 'b2', type: 'block', pos: [-6, 0, -20], ry: -0.1, o: { h: 12, seed: 5 }, v: { lit: 1 } },
      { id: 'b3', type: 'block', pos: [6, 0, -22], ry: 0.15, o: { h: 9, seed: 8 }, v: { lit: 1 } },
      { id: 'b4', type: 'block', pos: [-20, 0, -12], ry: 0.4, o: { h: 8, seed: 9 }, v: { lit: 1 } },
      { id: 'ferris', type: 'ferris', pos: [14, 0, -14], o: { r: 4 } },
      tree('t1', -8, -2), tree('t2', 9, -3, 3.5), tree('t3', 12, 2), tree('t4', -14, -6, 4), tree('t5', 18, -8), tree('t6', -4, -10, 3.4),
      { id: 'tito', type: 'char', pos: [-2.2, 0, 5], ry: 0.3, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    reactor: { at: [0, 5, -6], r: 7, az: 25, styles: ['wide', 'mid', 'low', 'side'] },
    top: { at: [-0.5, 8, -6], r: 3.6, az: 18, styles: ['mid', 'close', 'low'] },
    city: { at: [-4, 5, -17], r: 14, az: 10, styles: ['wide', 'mid', 'high', 'side'] },
    ferris: { at: [14, 5, -14], r: 4.4, az: -20, styles: ['mid', 'low', 'close'] },
    sign: { at: [4, 2.2, 3], r: 1.7, az: -15, styles: ['mid', 'close'] },
    zone: { at: [10, 2.0, 2], r: 2.0, az: 18, styles: ['mid', 'close'] },
    tito: { at: [-2.2, 1.25, 5], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.5 } } } },
    titoScared: { at: [-2.2, 1.25, 5], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 1, surprise: 0.6, smile: 0 } } } },
    trees: { at: [4, 2, -6], r: 8, az: -25, styles: ['wide', 'mid', 'low'] },
  },
  plan: {
    L01: { s: ['reactor', 'city', 'reactor'], v: { reactor: { glow: 0.1 } } },
    L02: { s: ['sign', 'reactor', 'tito', 'reactor'], hud: [[1, 'tag', 'USINA DE CHERNOBIL', { dot: 'gold', sub: 'Ucrânia · então União Soviética', size: 44 }]] },
    L03: { s: ['reactor', 'tito', 'reactor'], v: { reactor: { glow: 0.25 } }, hud: [[0, 'tag', 'TESTE DE SEGURANÇA', { dot: 'gold', sub: 'o reator 4 saiu do controle' }], [1, 'thought', 'q', 780, 480]] },
    L04: { s: ['reactor', 'top', 'reactor'], la: { 'reactor.blast': [0.0, 1], 'reactor.glow': [0.4, 1], 'reactor.smoke': [0.2, 1], 'reactor.sparks': [0.2, 1] }, shake: 'hit', hud: [[0, 'pop', 'BOOM!', 540, 520, { size: 200, color: '#FF5A4D' }], [1, 'flashc', 0.5], [1, 'tag', '2 EXPLOSÕES', { dot: 'red' }]], sfx: [[0, 'impact', 0.1, { level: 0.9, size: 1.3 }], [1, 'impact', 0.2, { level: 0.6 }]] },
    L05: { s: ['top', 'reactor', 'city'], sta: { embers: [0.3, 1] }, st: { dust: 0.6 }, hud: [[0, 'tag', 'MATERIAL RADIOATIVO', { dot: 'green', sub: 'espalhado pelo vento' }], [2, 'badge', 'EUROPA', 'slow']] },
    L06: { s: ['city', 'ferris', 'city'], sky: ['toxic', 'gray', 0, 1], v: { reactor: { glow: 0.5, smoke: 1, blast: 1 } }, hud: [[0, 'stat', { text: '~50 MIL', label: 'MORADORES DE PRIPYAT', unit: 'PESSOAS' }]] },
    L07: { s: ['city', 'city', 'tito'], la: { 'b1.lit': [1, 0], 'b2.lit': [1, 0], 'b3.lit': [1, 0], 'b4.lit': [1, 0] }, hud: [[0, 'banner', 'EVACUAÇÃO', { color: '#e8453c' }], [1, 'tag', '27 DE ABRIL', { dot: 'orange', sub: 'cerca de 36 h depois' }]] },
    L08: { s: ['zone', 'city', 'zone'], hud: [[0, 'stat', { text: '30 KM', label: 'ZONA DE EXCLUSÃO', unit: 'AO REDOR DA USINA', danger: 0 }], [1, 'tag', 'ZONA DE EXCLUSÃO', { dot: 'orange' }]] },
    L09: { s: ['sign', 'zone', 'tito'], hud: [[0, 'tag', 'AINDA PROIBIDA', { dot: 'red', sub: 'para moradia' }], [0, 'mark', 'no', 800, 700, 64]] },
    L10: { s: ['trees', 'ferris', 'city', 'trees'], sky: ['gray', 'day', 0, 1], st: { embers: 0, dust: 0 }, hud: [[0, 'tag', 'NATUREZA VOLTOU', { dot: 'green' }]] },
    L11: { s: ['tito', 'reactor', 'tito'], sky: 'day', hud: [[0, 'mark', 'ok', 800, 560, 70], [0, 'tag', 'SEGURANÇA PRIMEIRO', { dot: 'green', y: 740 }]] },
    L12: { s: ['tito', 'city'] },
    L13: { s: ['tito', 'ferris'], hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'city', sky: 'gray' },
  music: [['L01', 'mystery', 0.5], ['L03', 'tension', 0.75], ['L04', 'action', 0.9], ['L07', 'tension', 0.65], ['L10', 'wonder', 0.6]],
});
