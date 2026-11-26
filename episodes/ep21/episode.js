// EP21 — Guerra dos Emus (1932)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const ES = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'];
const P = [[-8, -6], [-3, -9], [2, -7], [6, -11], [-5, -14], [0, -16], [4, -19], [-9, -20]];
const emu = (id, i) => ({ id, type: 'emu', pos: [P[i][0], 0, P[i][1]], ry: (i % 3 - 1) * 0.12, s: 0.55, o: { color: i % 2 ? '#7a6a58' : '#6e604f' }, v: { run: 0 } });
const RUN = (a, b) => Object.fromEntries(ES.map((id, i) => [`${id}.x`, [a + i * 0.4, b - i * 0.6]]));
const RUNV = (k) => Object.fromEntries(ES.map(id => [id, { run: k }]));
export default buildFato({
  id: 'ep21', titulo: 'A Guerra dos Emus, 1932', lines: LINES, defaultSubject: 'herd', ctaLine: 'L12',
  title: { kicker: 'FATO REAL', title: ['GUERRA', 'DOS EMUS'], sub: 'AUSTRÁLIA · 1932' },
  fato: {
    sky: 'day', ground: 'sand', center: [0, 0, -8], seed: 2,
    props: [
      { id: 'wheat', type: 'wheat', pos: [-9, 0, -26], o: { w: 22, d: 8, n: 900 } },
      ...ES.map((id, i) => emu(id, i)),
      { id: 'gun', type: 'gun', pos: [7, 0, 3], ry: -0.7, s: 1.2 },
      { id: 'sold', type: 'char', pos: [5.2, 0, 3.8], ry: -0.5, o: { hat: true, shirt: '#7a8a4a', pants: '#6a7a3a', skin: '#d9a07a' }, v: { pose: { typing: 1, smile: 0 } } },
      { id: 'maj', type: 'char', pos: [9, 0, 4.6], ry: -0.8, o: { hat: true, shirt: '#8a7a3a', pants: '#6a7a3a', skin: '#c68a5c', glasses: true }, hide: true },
      { id: 'tito', type: 'char', pos: [-3, 0, 5], ry: 0.2, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
      { id: 'bush1', type: 'tree', pos: [-12, 0, -2], o: { h: 2.2, leaf: '#7a8a3a' } }, { id: 'bush2', type: 'tree', pos: [13, 0, -8], o: { h: 2.6, leaf: '#7a8a3a' } },
    ],
  },
  subjects: {
    herd: { at: [-1, 1.4, -12], r: 9, az: 12, styles: ['wide', 'mid', 'low', 'side'] },
    herdClose: { at: [-1, 1.5, -8], r: 4.5, az: 25, styles: ['mid', 'low', 'close', 'side'] },
    wheat: { at: [-9, 1, -26], r: 8, az: 0, styles: ['mid', 'wide', 'low'] },
    gun: { at: [7, 1.2, 3], r: 2.2, az: 25, styles: ['mid', 'close', 'low', 'side'] },
    soldier: { at: [5.2, 1.3, 3.8], r: 0.9, az: 20, styles: ['close', 'mid', 'side'] },
    major: { at: [9, 1.3, 4.6], r: 0.9, az: 25, styles: ['close', 'mid'], v: { maj: { vis: 1 } } },
    tito: { at: [-3, 1.25, 5], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.4 } } } },
    titoSurprise: { at: [-3, 1.25, 5], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { surprise: 1, smile: 0.2 } } } },
  },
  plan: {
    L01: { s: ['herd', 'soldier', 'herd'], st: { dust: 0.3 }, hud: [[0, 'tag', 'AUSTRÁLIA · 1932', { dot: 'gold' }]] },
    L02: { s: ['herdClose', 'tito', 'herdClose'], hud: [[1, 'thought', '?', 800, 520], [2, 'tag', 'GUERRA DOS EMUS', { dot: 'orange' }]] },
    L03: { s: ['wheat', 'herd', 'wheat'], st: { dust: 0.4 }, hud: [[0, 'tag', 'SECA · MILHARES DE EMUS', { dot: 'orange', sub: 'oeste da Austrália' }], [1, 'badge', 'PLANTAÇÕES DE TRIGO', 'slow']] },
    L04: { s: ['tito', 'soldier', 'tito'], hud: [[0, 'tag', 'FAZENDEIROS', { dot: 'gold', sub: 'muitos ex-soldados da 1ª Guerra' }]] },
    L05: { s: ['gun', 'soldier', 'gun'], hud: [[0, 'stat', { text: '2', label: 'METRALHADORAS', unit: '+ MUITAS BALAS' }]] },
    L06: { s: ['major', 'soldier', 'major'], hud: [[0, 'tag', 'MAJOR MEREDITH', { dot: 'gold', sub: 'o comandante' }]] },
    L07: { s: ['herd', 'herdClose', 'herd', 'herdClose'], v: { ...RUNV(1) }, la: RUN(-2, 4), st: { dust: 0.8 }, hud: [[0, 'tag', 'PEQUENOS GRUPOS', { dot: 'orange', sub: 'e muito rápidos' }], [1, 'badge', 'CÂMERA LENTA 0,3x', 'slow']] },
    L08: { s: ['gun', 'herd', 'soldier'], v: { ...RUNV(1), gun: { fire: 1 } }, la: RUN(4, 10), st: { dust: 0.8 }, shake: 0.015, hud: [[1, 'mark', 'no', 800, 700, 64], [-1, 'badge', 'ALGUMAS SEMANAS', 'slow']] },
    L09: { s: ['herd', 'tito', 'herd'], v: { ...RUNV(1) }, la: RUN(10, 16), st: { dust: 0.6 }, hud: [[0, 'stat', { text: '~1.000', label: 'EMUS ABATIDOS (REGISTROS)', unit: 'E O PROBLEMA CONTINUOU' }]] },
    L10: { s: ['tito', 'herdClose', 'tito'], v: { ...RUNV(0) }, st: { dust: 0 }, hud: [[0, 'thought', 'heart', 800, 520], [1, 'tag', 'NATUREZA TEIMOSA', { dot: 'green' }]] },
    L11: { s: ['herdClose', 'soldier', 'herd'], v: { ...RUNV(0) }, hud: [[0, 'banner', 'EMUS 1 × 0 EXÉRCITO', { color: '#e8453c', size: 46 }]] },
    L12: { s: ['tito', 'herd'], v: { ...RUNV(0) } },
    L13: { s: ['tito', 'herdClose'], v: { ...RUNV(0) }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'herd', sky: 'dusk' },
  music: [['L01', 'mystery', 0.5], ['L03', 'calm', 0.6], ['L05', 'tension', 0.7], ['L07', 'action', 0.9], ['L10', 'wonder', 0.6]],
});
