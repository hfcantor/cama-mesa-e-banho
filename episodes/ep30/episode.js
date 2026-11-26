// EP30 — O Sol vira gigante vermelha (futuro)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const SUNP = [-12, 0, -22];
export default buildFato({
  id: 'ep30', titulo: 'O dia em que o Sol vira gigante vermelha', lines: LINES, defaultSubject: 'all', ctaLine: 'L12',
  title: { kicker: 'O QUE VAI ACONTECER', title: ['O SOL', 'VAI MUDAR'], sub: 'DAQUI A ~5 BILHÕES DE ANOS' },
  fato: {
    sky: 'space', center: [0, 0, -22],
    props: [
      { id: 'sun', type: 'sun', pos: SUNP, o: { r: 5, color: '#ffd23a', glow: 'rgba(255,200,60,1)' }, v: { pulse: 1 } },
      { id: 'giant', type: 'sun', pos: SUNP, o: { r: 5, tex: 'granule', color: '#ff5a1a', glow: 'rgba(255,90,40,1)' }, v: { pulse: 1 }, hide: true },
      { id: 'dwarf', type: 'sun', pos: SUNP, o: { r: 1.4, color: '#e6f2ff', glow: 'rgba(170,210,255,1)' }, hide: true },
      { id: 'mercury', type: 'planet', pos: [-5, 0, -22], o: { kind: 'rock', color: '#9a8a7a', r: 0.7 } },
      { id: 'venus', type: 'planet', pos: [0, 0, -22], o: { kind: 'rock', color: '#e6c07a', r: 1.4 } },
      { id: 'earth', type: 'planet', pos: [7.5, 0, -22], o: { kind: 'earth', r: 1.7, atmo: '#5fb0ff' } },
      { id: 'tito', type: 'char', pos: [5, -3.4, -10], ry: -0.3, hide: true, o: { shirt: '#f2f2ee', pants: '#f2f2ee', skin: '#c68a5c', gear: 'helmet' } },
    ],
  },
  subjects: {
    all: { at: [0, 0, -22], r: 20, az: 0, minY: -50, styles: ['wide', 'mid', 'high'] },
    sun: { at: SUNP, r: 12, az: 0, minY: -50, styles: ['mid', 'wide', 'close'] },
    inner: { at: [-2, 0, -22], r: 11, az: 8, minY: -50, styles: ['mid', 'wide', 'close'] },
    earth: { at: [7.5, 0, -22], r: 2.4, az: 10, minY: -50, styles: ['mid', 'close', 'macro'] },
    tito: { at: [5, -3.0, -10], r: 0.8, az: 0, minY: -50, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8, armsUp: 0.3 } } } },
    titoAwe: { at: [5, -3.0, -10], r: 0.8, az: 0, minY: -50, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { surprise: 1, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['all', 'sun', 'tito'], hud: [[0, 'tag', 'DAQUI A ~5 BILHÕES DE ANOS', { dot: 'gold', size: 38 }]] },
    L02: { s: ['sun', 'all', 'sun'], hud: [[0, 'tag', 'ESTRELA ESTÁVEL', { dot: 'green', sub: 'hidrogênio → energia' }]] },
    L03: { s: ['sun', 'tito', 'sun'], hud: [[0, 'stat', { text: '+4 BILHÕES', label: 'QUEIMANDO HIDROGÊNIO HÁ', unit: 'DE ANOS', color: '#ffd45a' }]] },
    L04: { s: ['sun', 'titoAwe', 'sun'], hud: [[0, 'tag', 'COMBUSTÍVEL ACABANDO', { dot: 'red' }], [1, 'tintc', 'rgba(255,80,40,1)', 0.12]] },
    L05: { s: ['sun', 'all', 'sun'], v: { sun: { vis: 0 }, giant: { vis: 1 } }, la: { 'giant.s': [0.9, 1.8] }, hud: [[0, 'tag', 'NÚCLEO SE CONTRAI', { dot: 'gold' }], [1, 'tag', 'CAMADAS EXTERNAS SE EXPANDEM', { dot: 'red', size: 38 }]] },
    L06: { s: ['all', 'sun', 'all'], v: { sun: { vis: 0 }, giant: { vis: 1 } }, la: { 'giant.s': [1.8, 2.6] }, hud: [[0, 'banner', 'GIGANTE VERMELHA', { color: '#e8453c', size: 52 }]] },
    L07: { s: ['all', 'inner', 'all'], v: { sun: { vis: 0 }, giant: { vis: 1 } }, la: { 'giant.s': [2.6, 3.7] }, shake: 0.012, hud: [[0, 'tag', 'ENGOLE MERCÚRIO E VÊNUS', { dot: 'red', size: 38 }]] },
    L08: { s: ['earth', 'all', 'earth'], v: { sun: { vis: 0 }, giant: { vis: 1, s: 3.7 }, mercury: { s: 0.2 }, venus: { s: 0.2 } }, la: { 'earth.heat': [0, 1] }, hud: [[0, 'tag', 'TERRA: AINDA INCERTO', { dot: 'gold', sub: 'mas quente demais para a vida', size: 40 }]] },
    L09: { s: ['earth', 'all', 'earth'], v: { sun: { vis: 1 }, giant: { vis: 0 }, earth: { heat: 0 } }, la: { 'earth.heat': [0, 0.55], 'sun.pulse': [1, 1] }, hud: [[0, 'stat', { text: '~1 BILHÃO', label: 'DE ANOS: OCEANOS EVAPORAM', unit: 'ESTIMATIVA CIENTÍFICA', scale: 0.85, color: '#ff9a8a' }]] },
    L10: { s: ['sun', 'sun', 'all'], v: { sun: { vis: 0 }, giant: { vis: 0 }, dwarf: { vis: 1 }, mercury: { vis: 0 }, venus: { vis: 0 } }, hud: [[0, 'tag', 'ANÃ BRANCA', { dot: 'blue', sub: 'o fim do ciclo' }]] },
    L11: { s: ['tito', 'all', 'tito'], v: { sun: { vis: 1 }, giant: { vis: 0 } }, sky: 'space', hud: [[0, 'mark', 'ok', 800, 560, 70], [0, 'tag', 'BILHÕES DE ANOS DE DISTÂNCIA', { dot: 'green', y: 740, size: 36 }]] },
    L12: { s: ['tito', 'sun'], v: { sun: { vis: 1 }, giant: { vis: 0 } } },
    L13: { s: ['tito', 'earth'], v: { sun: { vis: 1 }, giant: { vis: 0 } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'all', v: { sun: { vis: 1 }, giant: { vis: 0 } } },
  music: [['L01', 'mystery', 0.5], ['L04', 'tension', 0.75], ['L06', 'action', 0.85], ['L10', 'wonder', 0.7], ['L11', 'calm', 0.6]],
});
