// EP16 — Krakatoa (1883)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep16', titulo: 'Krakatoa, 1883', lines: LINES, defaultSubject: 'volcano', ctaLine: 'L12',
  title: { kicker: 'FATO REAL', title: ['KRAKATOA'], sub: '27 DE AGOSTO DE 1883' },
  fato: {
    sky: 'dusk', water: { color: '#0f5a78', amp: 0.45 }, center: [0, 0, -10],
    props: [
      { id: 'volcano', type: 'volcano', pos: [0, 0, -12], s: 1.2 },
      { id: 'island', type: 'disc', pos: [0, 0.05, -12], o: { r: 15, color: '#5b6f3f' } },
      { id: 'wave', type: 'wave', pos: [26, 0, -10], ry: Math.PI / 2, o: { len: 50, r: 9 }, hide: true },
      { id: 'rock', type: 'rock', pos: [-6, -0.3, 5], o: { r: 2.2, color: '#6a645c' } },
      { id: 'tito', type: 'char', pos: [-6, 0.7, 5], ry: 0.3, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' }, s: 0.7 },
      { id: 'sun', type: 'sun', pos: [-40, 14, -90], o: { r: 8, color: '#ffb35a', glow: 'rgba(255,120,60,1)' }, v: { vis: 1 } },
      { id: 'globe', type: 'planet', pos: [30, 28, -70], o: { kind: 'earth', r: 9, atmo: '#5fb0ff' }, hide: true },
    ],
  },
  subjects: {
    volcano: { at: [0, 6, -12], r: 8, az: 20, styles: ['wide', 'mid', 'low', 'side'] },
    crater: { at: [0, 14, -12], r: 4, az: 10, minY: 6, styles: ['mid', 'close', 'low'] },
    island: { at: [0, 2, -12], r: 10, az: 40, styles: ['wide', 'high', 'side'] },
    wave: { at: [16, 4, -8], r: 9, az: -30, styles: ['mid', 'low', 'wide', 'close'] },
    tito: { at: [-6, 2.0, 5], r: 0.8, minY: 1, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.4, surprise: 0.5 } } } },
    horizon: { at: [-40, 10, -90], r: 20, az: 0, minY: 3, styles: ['wide', 'mid', 'close'] },
    globe: { at: [30, 28, -70], r: 10, az: 0, minY: 20, styles: ['mid', 'wide'], v: { globe: { vis: 1 } } },
  },
  plan: {
    L01: { s: ['volcano', 'crater', 'volcano'], v: { volcano: { glow: 0.3 } } },
    L02: { s: ['island', 'volcano', 'tito', 'crater'], hud: [[0, 'tag', 'KRAKATOA', { dot: 'orange', sub: 'Indonésia' }]], la: { 'volcano.erupt': [0.1, 0.8], 'volcano.glow': [0.3, 1] } },
    L03: { s: ['crater', 'volcano', 'horizon'], v: { volcano: { glow: 1 } }, la: { 'volcano.erupt': [0.8, 1] }, sta: { embers: [0, 0.6] }, shake: 'hit', hud: [[0, 'pop', 'BOOOM!', 540, 520, { size: 200, color: '#FF5A4D' }], [1, 'stat', { from: 0, to: 4800, label: 'OUVIDO A MAIS DE', unit: 'KM DE DISTÂNCIA', suffix: '', t: 1.3 }]], sfx: [[0, 'impact', 0.05, { level: 1, size: 1.4 }]] },
    L04: { s: ['island', 'volcano', 'island'], v: { volcano: { erupt: 1, glow: 1 } }, la: { 'volcano.y': [0, -14], 'island.y': [0, -3] }, sky: ['dusk', 'ash', 0, 1], st: { embers: 0.6 }, hud: [[0, 'tag', 'ILHA DESABOU NO MAR', { dot: 'red' }]] },
    L05: { s: ['wave', 'wave', 'tito'], v: { volcano: { erupt: 0.6, y: -14 }, island: { y: -3 }, wave: { vis: 1 } }, sky: 'ash', la: { 'wave.x': [26, -6] }, st: { waves: 2.2 }, shake: 0.04, hud: [[0, 'pop', 'TSUNAMI!', 540, 520, { size: 170, color: '#9fd8ff' }], [2, 'mark', 'no', 800, 640, 64]] },
    L06: { s: ['island', 'tito', 'island'], v: { volcano: { erupt: 0.4, y: -14 }, island: { y: -3 } }, sky: 'ash', st: { waves: 1.6 }, hud: [[0, 'stat', { from: 0, to: 36000, label: 'MORTES (CONTAGEM OFICIAL)', unit: 'PESSOAS', suffix: '', danger: 1, t: 1.5 }]] },
    L07: { s: ['crater', 'globe', 'horizon'], v: { volcano: { erupt: 1, y: 0 } }, sky: 'ash', sta: { ash: [0.5, 1] }, hud: [[0, 'tag', 'CINZAS NA ATMOSFERA', { dot: 'orange' }]] },
    L08: { s: ['horizon', 'horizon', 'globe'], v: { volcano: { erupt: 0.3 } }, sky: ['ash', 'redsky', 0, 1], st: { ash: 0.3 }, hud: [[0, 'tag', 'PÔR DO SOL VERMELHO', { dot: 'red', sub: 'por meses, em vários países' }], [-1, 'badge', 'MESES DEPOIS', 'slow']] },
    L09: { s: ['globe', 'globe', 'volcano'], v: { volcano: { erupt: 0.2 } }, sky: 'space', st: { ground: 0 }, hud: [[0, 'tag', 'ONDA DE PRESSÃO', { dot: 'blue', sub: 'deu a volta ao planeta' }]] },
    L10: { s: ['island', 'volcano', 'crater'], v: { volcano: { erupt: 0.35, y: 0, glow: 0.6, s: 0.5 } }, sky: ['redsky', 'day', 0, 1], st: { ground: 1, ash: 0 }, hud: [[0, 'banner', '1927 · ANAK KRAKATAU', { color: '#2a9d5c', size: 44 }], [1, 'tag', 'FILHO DO KRAKATOA', { dot: 'green' }]] },
    L11: { s: ['tito', 'volcano', 'tito'], v: { volcano: { erupt: 0.15, s: 0.5 } }, sky: 'day', hud: [[0, 'thought', 'heart', 800, 520]] },
    L12: { s: ['tito', 'volcano'], v: { volcano: { erupt: 0.15, s: 0.5 } } },
    L13: { s: ['tito', 'island'], v: { volcano: { erupt: 0.15, s: 0.5 } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'volcano', sky: 'dusk' },
  music: [['L01', 'mystery', 0.5], ['L02', 'tension', 0.75], ['L03', 'action', 0.95], ['L07', 'tension', 0.65], ['L10', 'wonder', 0.65]],
});
