// EP34 — Tsar Bomba (1961)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep34', titulo: 'Tsar Bomba, 1961', lines: LINES, defaultSubject: 'wide', ctaLine: 'L10',
  title: { kicker: 'FATO REAL', title: ['TSAR', 'BOMBA'], sub: '30 DE OUTUBRO DE 1961' },
  fato: {
    sky: 'gray', ground: 'snow', seed: 11, center: [0, 0, -34],
    props: [
      { id: 'big', type: 'blast', pos: [-6, 0, -40], o: { h: 24 } },
      { id: 'small', type: 'blast', pos: [13, 0, -34], o: { h: 1.6 }, v: { grow: 1 }, hide: true },
      { id: 'm1', type: 'mountain', pos: [-24, 0, -58], o: { r: 16, h: 12, color: '#8a93a0' } }, { id: 'm2', type: 'mountain', pos: [26, 0, -64], o: { r: 18, h: 14, color: '#8a93a0' } },
      { id: 'sg', type: 'sign', pos: [-3, 0, -8], o: { text: 'NOVA ZEMBLA', bg: '#1b2a4a', fg: '#fff', w: 4.2, h: 1, pole: 1.4 } },
      { id: 'tito', type: 'char', pos: [0, 0, 4], hide: true, o: { shirt: '#e8453c', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    wide: { at: [-2, 8, -40], r: 22, az: 0, minY: 1, styles: ['wide', 'mid', 'low', 'side'] },
    cloud: { at: [-6, 20, -40], r: 14, az: 8, minY: 1, styles: ['mid', 'wide', 'low'] },
    base: { at: [-6, 3, -40], r: 9, az: 14, minY: 0.6, styles: ['mid', 'low', 'wide'] },
    land: { at: [-2, 3, -40], r: 26, az: 25, styles: ['wide', 'side', 'high'] },
    sign: { at: [-3, 1.6, -8], r: 4.5, styles: ['mid', 'wide'] },
    compare: { at: [4, 4, -37], r: 18, az: 8, minY: 0.8, styles: ['wide', 'mid', 'low'] },
    tito: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.2 } } } },
    titoWow: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { surprise: 1, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['land', 'wide', 'tito'], hud: [[1, 'tag', '30 / 10 / 1961', { dot: 'red', sub: 'o maior teste nuclear da história', size: 42 }]] },
    L02: { s: ['sign', 'land', 'sign'], hud: [[0, 'tag', 'NOVA ZEMBLA · ÁRTICO', { dot: 'blue', sub: 'União Soviética', size: 42 }]] },
    L03: { s: ['wide', 'cloud', 'base'], la: { 'big.grow': [0, 1], 'big.ring': [0, 0.5] }, shake: 'hit', hud: [[0, 'flashc', 0.7], [0, 'stat', { text: '50 MEGATONS', label: 'FORÇA DA EXPLOSÃO', unit: '≈ 50 MILHÕES DE TONELADAS DE TNT', scale: 0.85, color: '#ff9a3a', danger: 1 }]] },
    L04: { s: ['compare', 'compare', 'wide'], v: { small: { vis: 1 }, big: { grow: 1, ring: 0.5 } }, hud: [[0, 'tag', 'HIROSHIMA', { dot: 'blue', sub: '≈ 15 kt', size: 40 }], [1, 'stat', { text: '+3.000 ×', label: 'MAIS ENERGIA QUE HIROSHIMA', unit: 'ORDEM DE GRANDEZA', scale: 0.8, color: '#ff9a3a', danger: 1 }]] },
    L05: { s: ['land', 'wide', 'land'], v: { small: { vis: 0 }, big: { grow: 1, ring: 0.5 } }, la: { 'big.ring': [0.5, 1] }, hud: [[0, 'stat', { from: 0, to: 1000, label: 'CLARÃO VISTO A', unit: 'KM DE DISTÂNCIA', t: 1.6, color: '#fff2a0' }]] },
    L06: { s: ['cloud', 'base', 'cloud'], v: { big: { grow: 1, ring: 1 } }, hud: [[0, 'stat', { from: 0, to: 64, label: 'ALTURA DA NUVEM', unit: 'QUILÔMETROS (APROX.)', t: 1.6, color: '#ffb04a', danger: 0.5 }]] },
    L07: { s: ['land', 'titoWow', 'land'], v: { big: { grow: 1, ring: 1 } }, la: { 'big.ring': [0, 1] }, hud: [[0, 'tag', 'ONDA DE CHOQUE', { dot: 'gold', sub: 'registrada ao redor da Terra', size: 40 }]] },
    L08: { s: ['wide', 'tito', 'wide'], v: { big: { grow: 1, ring: 1 } }, hud: [[0, 'stat', { text: '100 → 50', label: 'MEGATONS: PROJETO → TESTE', unit: 'REDUZIDA PARA DIMINUIR A RADIOATIVIDADE', scale: 0.8, color: '#ffd45a' }]] },
    L09: { s: ['land', 'tito', 'land'], v: { big: { grow: 0, ring: 0 } }, sky: 'day', hud: [[0, 'stamp', 'TRATADO', '1963', { color: '#2aa65a' }], [0, 'tag', 'FIM DOS TESTES NA ATMOSFERA', { dot: 'green', size: 38, y: 360 }]] },
    L10: { s: ['tito', 'land'], v: { big: { grow: 0, ring: 0 } }, sky: 'day' },
    L11: { s: ['tito', 'land'], v: { big: { grow: 0, ring: 0 } }, sky: 'day', hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'land', sky: 'day', v: { big: { grow: 0, ring: 0 } } },
  music: [['L01', 'tension', 0.6], ['L03', 'action', 0.9], ['L06', 'tension', 0.8], ['L08', 'calm', 0.55], ['L09', 'calm', 0.6]],
});
