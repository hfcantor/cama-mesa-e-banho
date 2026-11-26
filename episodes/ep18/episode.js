// EP18 — Grande Incêndio de Londres (1666)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const HS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10'];
const ALL = (k, a, b) => Object.fromEntries(HS.map(id => [`${id}.${k}`, [a, b]]));
const VALL = (k, val) => Object.fromEntries(HS.map(id => [id, { [k]: val }]));
const NEW = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'];
const house = (id, x, z) => ({ id, type: 'house', pos: [x, 0, z], ry: (x < 0 ? 0.1 : -0.1), o: { style: 'timber', w: 3.6, h: 3.6 + ((x * 7 + z) % 3) * 0.4, d: 4, seed: x }, v: { lit: 0.7 } });
const nh = (id, x, z) => ({ id, type: 'house', pos: [x, 0, z], o: { style: 'brick', w: 3.8, h: 4, d: 4.2 }, hide: true, v: { lit: 0.4 } });
export default buildFato({
  id: 'ep18', titulo: 'O Grande Incêndio de Londres, 1666', lines: LINES, defaultSubject: 'row', ctaLine: 'L12',
  title: { kicker: 'FATO REAL', title: ['LONDRES', 'EM CHAMAS'], sub: 'SETEMBRO DE 1666' },
  fato: {
    sky: 'night', ground: 'cobble', center: [0, 0, -10], seed: 9,
    props: [
      house('h1', -9, -6), house('h2', -4.5, -6), house('h3', 0, -6), house('h4', 4.5, -6), house('h5', 9, -6),
      house('h6', -9, -14), house('h7', -4.5, -14), house('h8', 0, -14), house('h9', 4.5, -14), house('h10', 9, -14),
      { id: 'church', type: 'house', pos: [0, 0, -25], o: { style: 'brick', w: 6, h: 8, d: 6 }, v: { lit: 0.3 } },
      { id: 'sign', type: 'sign', pos: [0, 0, -3.2], o: { kind: 'text', w: 3, h: 0.9, pole: 2.4, text: 'PADARIA', bg: '#7a4a2a', fg: '#ffe9b0' } },
      nh('n1', -9, -6), nh('n2', -4.5, -6), nh('n3', 0, -6), nh('n4', 4.5, -6), nh('n5', 9, -6), nh('n6', 0, -14),
      { id: 'mon', type: 'mast', pos: [14, 0, -4], o: { h: 12 }, hide: true },
      { id: 'tito', type: 'char', pos: [0, 0, 4], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    row: { at: [0, 3, -6], r: 9, az: 10, styles: ['wide', 'mid', 'low', 'high'] },
    bakery: { at: [0, 2.4, -6], r: 3.4, az: 14, styles: ['mid', 'close', 'low', 'side'] },
    city: { at: [0, 5, -13], r: 15, az: 20, styles: ['wide', 'high', 'mid', 'side'] },
    church: { at: [0, 4.5, -25], r: 6.5, az: 0, styles: ['mid', 'wide', 'low'] },
    mon: { at: [14, 6, -4], r: 6, az: -15, styles: ['mid', 'low', 'wide'] },
    tito: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.4 } } } },
    titoScared: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 1, surprise: 0.7, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['row', 'bakery', 'city'], v: { h3: { fire: 0.3 } } },
    L02: { s: ['city', 'row', 'tito'], hud: [[0, 'tag', 'LONDRES · 2 DE SETEMBRO', { dot: 'gold', sub: 'madrugada de domingo', size: 40 }]] },
    L03: { s: ['bakery', 'bakery', 'row'], la: { 'h3.fire': [0, 0.9] }, sta: { embers: [0, 0.4] }, hud: [[0, 'tag', 'PADARIA · PUDDING LANE', { dot: 'orange', size: 40 }], [1, 'pop', 'FOGO!', 540, 520, { size: 190, color: '#FF7A3D' }]], sfx: [[1, 'impact', 0.1, { level: 0.6 }]] },
    L04: { s: ['row', 'bakery', 'city'], v: { h3: { fire: 0.9 }, h2: { fire: 0.3 }, h4: { fire: 0.3 } }, st: { embers: 0.4 }, hud: [[0, 'tag', 'CASAS DE MADEIRA', { dot: 'orange', sub: 'coladas umas nas outras' }]] },
    L05: { s: ['city', 'row', 'city'], sky: ['night', 'fire', 0, 1], la: ALL('fire', 0.3, 1), st: { embers: 0.8, dust: 0.5 }, hud: [[0, 'tag', 'VENTO FORTE', { dot: 'blue' }], [1, 'badge', 'FOGO SE ESPALHA', 'slow']] },
    L06: { s: ['city', 'row', 'city', 'row'], sky: 'fire', v: { ...VALL('fire', 1) }, st: { embers: 1 }, shake: 0.03, hud: [[0, 'stat', { from: 0, to: 13200, label: 'CASAS DESTRUÍDAS', unit: 'EM ~4 DIAS', danger: 1, t: 1.6 }]] },
    L07: { s: ['church', 'city', 'church'], sky: 'fire', v: { ...VALL('fire', 1), church: { fire: 1 } }, st: { embers: 1 }, hud: [[0, 'stat', { text: '87', label: 'IGREJAS DESTRUÍDAS', unit: 'INCLUINDO SÃO PAULO' }]] },
    L08: { s: ['titoScared', 'city', 'tito'], sky: 'fire', v: { ...VALL('fire', 0.6), ...VALL('burnt', 0.9), church: { fire: 0.6, burnt: 0.9 } }, st: { embers: 0.7 }, hud: [[0, 'stat', { text: '6', label: 'MORTES CONFIRMADAS', unit: 'MAS MUITA GENTE PERDEU TUDO' }]] },
    L09: { s: ['row', 'city', 'row'], sky: ['fire', 'dusk', 0, 1], v: { ...VALL('vis', 0), church: { vis: 1, burnt: 0.4 }, n1: { vis: 1 }, n2: { vis: 1 }, n3: { vis: 1 }, n4: { vis: 1 }, n5: { vis: 1 }, n6: { vis: 1 } }, st: { embers: 0 }, hud: [[0, 'tag', 'TIJOLO E PEDRA', { dot: 'green', sub: 'no lugar de madeira' }], [1, 'mark', 'ok', 800, 640, 64]] },
    L10: { s: ['mon', 'mon', 'tito'], sky: 'dusk', v: { ...VALL('vis', 0), church: { vis: 0 }, n1: { vis: 1 }, n2: { vis: 1 }, n3: { vis: 1 }, n4: { vis: 1 }, n5: { vis: 1 }, mon: { vis: 1 } }, hud: [[0, 'tag', 'MONUMENTO AO INCÊNDIO', { dot: 'gold', size: 40 }]] },
    L11: { s: ['tito', 'bakery', 'tito'], sky: 'night', v: { ...VALL('vis', 0), church: { vis: 0 }, n1: { vis: 1 }, n2: { vis: 1 }, n3: { vis: 1, fire: 0.0 }, n4: { vis: 1 }, n5: { vis: 1 }, mon: { vis: 1 } }, hud: [[0, 'thought', '!', 800, 520], [1, 'tag', 'PEQUENO DESCUIDO', { dot: 'red', sub: 'grande desastre' }]] },
    L12: { s: ['tito', 'row'], v: { ...VALL('vis', 0), church: { vis: 0 }, n1: { vis: 1 }, n2: { vis: 1 }, n3: { vis: 1 }, n4: { vis: 1 }, n5: { vis: 1 }, mon: { vis: 1 } } },
    L13: { s: ['tito', 'mon'], v: { ...VALL('vis', 0), church: { vis: 0 }, n1: { vis: 1 }, n2: { vis: 1 }, n3: { vis: 1 }, n4: { vis: 1 }, n5: { vis: 1 }, mon: { vis: 1 } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'city', sky: 'night', v: { ...VALL('fire', 0.8) } },
  music: [['L01', 'mystery', 0.5], ['L03', 'tension', 0.75], ['L05', 'action', 0.9], ['L08', 'tension', 0.6], ['L09', 'wonder', 0.65]],
});
