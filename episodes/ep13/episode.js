// EP13 — Titanic (1912): fato real. Cenário: palco de fatos (mar à noite, navio, iceberg).
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const TITO = { shirt: '#4a86d6', pants: '#3a4a8a', scale: 0.3 };
export default buildFato({
  id: 'ep13', titulo: 'Titanic: o navio que não podia afundar', lines: LINES, defaultSubject: 'ship', ctaLine: 'L13',
  title: { kicker: 'FATO REAL', title: ['TITANIC'], sub: 'ABRIL DE 1912' },
  fato: {
    sky: 'night', water: { color: '#0b3a55', amp: 0.35 }, center: [8, 0, 0],
    props: [
      { id: 'ship', type: 'ship', pos: [0, 0, 0] },
      { id: 'berg', type: 'iceberg', pos: [30, 0, 4], s: 1.2 },
      { id: 'berg2', type: 'iceberg', pos: [-40, 0, -30], s: 1.6 },
      { id: 'crowd', type: 'people', pos: [-6, 5, 0], o: { cols: 10, rows: 10, gap: 1.0, color: '#3b82d6' }, s: 0.35, hide: true },
      { id: 'tito', type: 'char', pos: [3.3, 2.3, 1.0], o: TITO, hide: true },
    ],
  },
  subjects: {
    ship: { at: [0, 3.5, 0], r: 6, az: 38, styles: ['wide', 'mid', 'side', 'low'] },
    shipBow: { at: [8, 3, 0], r: 5, az: 60, styles: ['mid', 'close', 'low'] },
    both: { at: [14, 3, 2], r: 12, az: 20, styles: ['wide', 'side', 'mid'] },
    berg: { at: [30, 3, 4], r: 4.5, az: -20, styles: ['mid', 'low', 'wide'] },
    under: { at: [30, -3, 4], r: 6, az: -10, minY: -6, styles: ['mid', 'side'] },
    tito: { at: [3.3, 2.75, 1.0], r: 0.7, minY: 2.2, ly: 0, v: { tito: { vis: 1, ry: 0.3, pose: { smile: 0.8 } } }, styles: ['close', 'mid'] },
    people: { at: [-6, 7.2, 0], r: 3.4, styles: ['wide', 'mid'], v: { crowd: { vis: 1 } } },
  },
  plan: {
    L01: { s: ['ship', 'shipBow', 'ship'], la: { 'ship.y': [0, 0] } },
    L02: { s: ['ship', 'shipBow', 'tito', 'ship'], hud: [[0, 'tag', 'RMS TITANIC', { dot: 'gold', sub: 'Inglaterra → Nova York' }]] },
    L03: { s: ['people', 'ship', 'tito'], hud: [[0, 'stat', { from: 0, to: 2200, label: 'PESSOAS A BORDO', unit: 'PESSOAS', suffix: '', t: 1.2 }]], v: { crowd: { alive: 1, show: 1 } }, la: { 'crowd.show': [0.2, 1] } },
    L04: { s: ['ship', 'tito', 'ship'], sky: 'night', hud: [[1, 'tag', 'AVISOS DE GELO', { dot: 'orange', sub: 'por rádio, durante o dia' }]] },
    L05: { s: ['ship', 'shipBow', 'both'], la: { 'ship.x': [-14, -6] }, st: { waves: 1.2 }, hud: [[0, 'badge', 'ALTA VELOCIDADE', 'slow']] },
    L06: { s: ['both', 'berg', 'shipBow'], la: { 'ship.x': [-6, 0] }, hud: [[1, 'pop', 'ICEBERG!', 540, 520, { size: 170, color: '#9fd8ff' }], [1, 'mark', 'no', 800, 720, 64]], sfx: [[1, 'impact', 0.1, { level: 0.5 }]] },
    L07: { s: ['both', 'shipBow', 'both'], la: { 'ship.x': [0, 8], 'ship.roll': [0, 0.05] }, shake: 'hit', hud: [[1, 'pop', 'CRASH!', 540, 520, { size: 190, color: '#FF5A4D' }]], sfx: [[1, 'impact', 0.05, { level: 0.9, size: 1.2 }]] },
    L08: { s: ['berg', 'under', 'berg', 'under'], v: { ship: { x: 8 } }, hud: [[1, 'tag', '90% DO GELO', { dot: 'blue', sub: 'fica escondido na água' }], [-1, 'mark', 'no', 800, 700, 64]] },
    L09: { s: ['ship', 'both', 'ship', 'shipBow'], v: { ship: { x: 8 } }, la: { 'ship.tilt': [0, 0.5], 'ship.sink': [0, -4] }, hud: [[0, 'stat', { from: 0, to: 160, label: 'TEMPO ATÉ AFUNDAR', unit: 'MINUTOS (2H40)', t: 1.6 }]] },
    L10: { s: ['ship', 'people', 'ship'], v: { ship: { x: 8, tilt: 0.5, sink: -4 } }, hud: [[1, 'tag', 'BOTES: 1.178 LUGARES', { dot: 'orange', sub: 'para mais de 2 mil pessoas', size: 42 }]] },
    L11: { s: ['people', 'people'], v: { ship: { x: 8, tilt: 0.55, sink: -5 }, crowd: { vis: 1, show: 1, alive: 0.33 } }, la: { 'crowd.alive': [1, 0.33] }, hud: [[0, 'stat', { from: 0, to: 1400, label: 'MORRERAM', unit: 'PESSOAS OU MAIS', suffix: '+', danger: 1, t: 1.4 }]] },
    L12: { s: ['ship', 'tito', 'both'], sky: ['night', 'dusk', 0, 1], v: { ship: { x: 8, tilt: 0.6, sink: -8 } }, hud: [[1, 'mark', 'ok', 540, 600, 74], [1, 'tag', 'BOTES PARA TODOS', { dot: 'green', y: 760 }]] },
    L13: { s: ['tito', 'ship'], v: { ship: { x: 8, tilt: 0.6, sink: -8 } } },
    L14: { s: ['tito', 'berg'], v: { ship: { x: 8, tilt: 0.6, sink: -8 } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'ship', sky: 'night', v: { ship: { x: 0 } } },
  music: [['L01', 'mystery', 0.5], ['L04', 'tension', 0.7], ['L06', 'action', 0.85], ['L10', 'tension', 0.6], ['L12', 'wonder', 0.65]],
});
