// EP17 — Pompeia (79 d.C.)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const HS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ALL = (k, a, b) => Object.fromEntries(HS.map(id => [`${id}.${k}`, [a, b]]));
const VALL = (k, val) => Object.fromEntries(HS.map(id => [id, { [k]: val }]));
const house = (id, x, z) => ({ id, type: 'house', pos: [x, 0, z], ry: x < 0 ? 0.12 : -0.12, o: { style: 'roman', w: 4, h: 3.4, d: 5, seed: z } });
export default buildFato({
  id: 'ep17', titulo: 'Pompeia, 79 d.C.', lines: LINES, defaultSubject: 'street', ctaLine: 'L12',
  title: { kicker: 'FATO REAL', title: ['POMPEIA'], sub: 'ANO 79 D.C.' },
  fato: {
    sky: 'day', ground: 'cobble', center: [0, 0, -10], seed: 5,
    props: [
      { id: 'vesu', type: 'volcano', pos: [0, 0, -75], s: 2.8 },
      house('h1', -6, -4), house('h2', 6, -4), house('h3', -6, -12), house('h4', 6, -12), house('h5', -6, -20), house('h6', 6, -20),
      { id: 'colon', type: 'colonnade', pos: [0, 0, -27], o: { n: 7 } },
      { id: 't1', type: 'tree', pos: [-11, 0, -2], o: { h: 3.4 } }, { id: 't2', type: 'tree', pos: [11, 0, -9], o: { h: 3.6 } },
      { id: 'tito', type: 'char', pos: [0, 0, 4], ry: 0, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    street: { at: [0, 3, -9], r: 8, az: 10, styles: ['wide', 'mid', 'low', 'high'] },
    vesu: { at: [0, 14, -75], r: 27, az: 0, minY: 3, styles: ['wide', 'mid', 'low'] },
    top: { at: [0, 30, -75], r: 12, az: 0, minY: 14, styles: ['mid', 'close', 'low'] },
    house: { at: [-6, 2.2, -4], r: 4, az: 30, styles: ['mid', 'close', 'low', 'side'] },
    colon: { at: [0, 2.2, -27], r: 5.5, az: 0, styles: ['mid', 'wide', 'low'] },
    tito: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.5 } } } },
    titoScared: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 1, surprise: 0.7, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['street', 'vesu', 'street'] },
    L02: { s: ['street', 'colon', 'tito', 'vesu'], hud: [[0, 'tag', 'POMPEIA', { dot: 'gold', sub: 'cidade romana · Itália' }]] },
    L03: { s: ['tito', 'vesu', 'tito'], hud: [[0, 'thought', 'q', 780, 480], [1, 'tag', 'MUITOS NEM SABIAM', { dot: 'gold', sub: 'que era um vulcão' }]] },
    L04: { s: ['vesu', 'top', 'vesu'], sky: ['day', 'ash', 0, 1], la: { 'vesu.erupt': [0.1, 1], 'vesu.glow': [0.2, 1] }, shake: 'hit', hud: [[0, 'pop', 'BOOM!', 540, 520, { size: 200, color: '#FF5A4D' }], [1, 'stat', { text: '+30 KM', label: 'COLUNA DE CINZAS', unit: 'DE ALTURA' }]], sfx: [[0, 'impact', 0.1, { level: 0.9, size: 1.3 }]] },
    L05: { s: ['street', 'house', 'titoScared'], sky: 'ash', v: { vesu: { erupt: 1, glow: 1 } }, sta: { ash: [0.2, 1] }, hud: [[0, 'tag', 'CHUVA DE PEDRA-POMES', { dot: 'orange', sub: 'e cinzas, por horas' }]] },
    L06: { s: ['vesu', 'street', 'vesu'], sky: 'ash', v: { vesu: { erupt: 1, glow: 1 } }, st: { ash: 1, embers: 0.7 }, shake: 0.03, hud: [[0, 'tag', 'NUVENS MUITO QUENTES', { dot: 'red', sub: 'descendo a montanha' }], [1, 'badge', 'ALTA VELOCIDADE', 'slow']] },
    L07: { s: ['street', 'house', 'colon', 'street'], sky: ['ash', 'gray', 0, 1], v: { vesu: { erupt: 0.5 } }, st: { ash: 1 }, la: ALL('ash', 0.2, 1), hud: [[0, 'stat', { text: 'METROS', label: 'COBERTA POR', unit: 'DE CINZAS E PEDRAS' }]] },
    L08: { s: ['street', 'vesu', 'street'], sky: 'gray', v: { vesu: { erupt: 0.1 }, ...VALL('ash', 1) }, st: { ash: 0.4 }, hud: [[0, 'stat', { from: 0, to: 1600, label: 'ESQUECIDA POR', unit: 'ANOS', suffix: '+', t: 1.4 }], [1, 'badge', 'SÉCULOS DEPOIS', 'slow']] },
    L09: { s: ['street', 'house', 'colon', 'tito'], sky: ['gray', 'day', 0, 1], v: { vesu: { erupt: 0 } }, st: { ash: 0 }, la: ALL('ash', 1, 0.45), hud: [[0, 'tag', 'ESCAVAÇÕES · SÉCULO 18', { dot: 'green' }], [2, 'tag', 'OBJETOS DO DIA A DIA', { dot: 'gold' }]] },
    L10: { s: ['street', 'tito', 'colon'], sky: 'day', v: { ...VALL('ash', 0.3) }, hud: [[0, 'mark', 'ok', 800, 640, 70], [0, 'tag', 'SÍTIO ARQUEOLÓGICO', { dot: 'green', y: 800 }]] },
    L11: { s: ['vesu', 'titoScared', 'vesu'], sky: 'day', v: { ...VALL('ash', 0.3), vesu: { erupt: 0.12, glow: 0.4 } }, hud: [[0, 'tag', 'VULCÃO ATIVO', { dot: 'red', sub: 'vigiado por cientistas' }]] },
    L12: { s: ['tito', 'street'], v: { ...VALL('ash', 0.3), vesu: { erupt: 0.12 } } },
    L13: { s: ['tito', 'colon'], v: { ...VALL('ash', 0.3), vesu: { erupt: 0.12 } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'vesu', sky: 'dusk' },
  music: [['L01', 'mystery', 0.5], ['L03', 'tension', 0.7], ['L04', 'action', 0.95], ['L08', 'calm', 0.6], ['L09', 'wonder', 0.65]],
});
