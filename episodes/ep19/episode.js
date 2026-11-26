// EP19 — Peste Negra (1347)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const RS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
const rat = (id, x, z, ry) => ({ id, type: 'rat', pos: [x, 0, z], ry, s: 0.7, o: { color: id < 'r4' ? '#6e5a4c' : '#5a4c44' }, v: { run: 1 } });
const hs = (id, x, z) => ({ id, type: 'house', pos: [x, 0, z], ry: x < 0 ? 0.12 : -0.12, o: { style: 'medieval', w: 4, h: 3.2, d: 4.5, seed: z } });
export default buildFato({
  id: 'ep19', titulo: 'A Peste Negra, 1347', lines: LINES, defaultSubject: 'street', ctaLine: 'L12',
  title: { kicker: 'FATO REAL', title: ['PESTE NEGRA'], sub: 'EUROPA · 1347' },
  fato: {
    sky: 'gray', ground: 'dirt', center: [0, 0, -8], seed: 7,
    props: [
      hs('h1', -6.5, -5), hs('h2', 6.5, -5), hs('h3', -6.5, -13), hs('h4', 6.5, -13), hs('h5', -6.5, -21), hs('h6', 6.5, -21),
      rat('r1', -1.5, -1, 0.3), rat('r2', 1.2, -3, 0.1), rat('r3', -0.5, -6, -0.2), rat('r4', 2, -9, 0.2), rat('r5', -2, -11, 0), rat('r6', 0.6, -14, 0.15),
      { id: 'germ', type: 'germ', pos: [2.2, 1.4, 0.5], s: 1.6, o: { r: 0.7, color: '#c45ad3' }, hide: true },
      { id: 'folk', type: 'people', pos: [0, 0, -4], o: { cols: 10, rows: 10, gap: 0.6, color: '#4a9bf0', dead: '#6b6f77' }, hide: true },
      { id: 'tito', type: 'char', pos: [0, 0, 4], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    street: { at: [0, 2.6, -8], r: 8, az: 10, styles: ['wide', 'mid', 'low', 'high'] },
    rats: { at: [0, 0.6, -4], r: 2.4, az: 15, minY: 0.4, styles: ['mid', 'close', 'low', 'side'] },
    germ: { at: [2.2, 1.4, 0.5], r: 1.4, az: 0, minY: 0.8, styles: ['close', 'mid', 'macro'], v: { germ: { vis: 1 }, ...Object.fromEntries(RS.map(id => [id, { vis: 0 }])) } },
    folk: { at: [0, 4.2, -4], r: 3.6, az: 0, styles: ['wide', 'mid', 'close'], v: { folk: { vis: 1 } } },
    tito: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.4 } } } },
    titoSad: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 0.6, surprise: 0.2, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['street', 'rats', 'street'], hud: [[0, 'tag', 'ITÁLIA · 1347', { dot: 'gold' }]] },
    L02: { s: ['germ', 'germ', 'tito'], hud: [[0, 'tag', 'YERSINIA PESTIS', { dot: 'green', sub: 'a bactéria da peste' }]] },
    L03: { s: ['rats', 'rats', 'street'], hud: [[0, 'tag', 'PULGAS EM RATOS', { dot: 'orange' }], [1, 'badge', 'TRANSMISSÃO', 'slow']] },
    L04: { s: ['street', 'rats', 'street', 'rats'], hud: [[0, 'tag', 'CIDADES CHEIAS', { dot: 'gold', sub: 'sem saneamento · muitos ratos' }]] },
    L05: { s: ['street', 'street', 'tito'], sky: ['gray', 'dusk', 0, 0.5], hud: [[0, 'banner', '1347 → 1351', { color: '#6b4a8a' }], [1, 'tag', 'EUROPA INTEIRA', { dot: 'red' }]] },
    L06: { s: ['folk', 'folk', 'tito'], la: { 'folk.alive': [1, 0.55] }, hud: [[0, 'stat', { text: '⅓ A ½', label: 'DA POPULAÇÃO EUROPEIA', unit: 'ESTIMATIVA DOS HISTORIADORES', danger: 1 }]], sky: 'gray' },
    L07: { s: ['folk', 'titoSad', 'street'], v: { folk: { alive: 0.55 } }, hud: [[0, 'tag', 'UMA DAS MAIORES TRAGÉDIAS', { dot: 'red', size: 38 }]] },
    L08: { s: ['street', 'titoSad', 'street'], sky: 'gray', hud: [[0, 'tag', 'ALDEIAS VAZIAS', { dot: 'gold' }], [2, 'tag', 'FALTA DE TRABALHADORES', { dot: 'orange', size: 40 }]] },
    L09: { s: ['street', 'tito', 'street'], sky: ['gray', 'day', 0, 1], hud: [[0, 'tag', 'SALÁRIOS SUBIRAM', { dot: 'green' }], [1, 'mark', 'ok', 800, 640, 64]] },
    L10: { s: ['tito', 'street', 'tito'], sky: 'day', hud: [[0, 'tag', 'HOJE: ANTIBIÓTICOS', { dot: 'green', sub: 'a peste tem tratamento' }], [0, 'mark', 'ok', 800, 640, 64]] },
    L11: { s: ['tito', 'street', 'tito'], sky: 'day', hud: [[0, 'thought', 'heart', 800, 520], [1, 'tag', 'CIÊNCIA · HIGIENE · REMÉDIOS', { dot: 'green', size: 36 }]] },
    L12: { s: ['tito', 'street'], sky: 'day' },
    L13: { s: ['tito', 'rats'], sky: 'day', hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'street', sky: 'dusk' },
  music: [['L01', 'mystery', 0.55], ['L03', 'tension', 0.7], ['L06', 'tension', 0.85], ['L09', 'calm', 0.6], ['L10', 'wonder', 0.65]],
});
