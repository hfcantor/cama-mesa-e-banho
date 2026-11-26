// EP35 — Vênus: o dia é maior que o ano
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep35', titulo: 'Em Vênus o dia dura mais que o ano', lines: LINES, defaultSubject: 'all', ctaLine: 'L10',
  title: { kicker: 'CURIOSIDADE', title: ['VÊNUS', 'É ESTRANHO'], sub: 'O DIA É MAIOR QUE O ANO' },
  fato: {
    sky: 'space', center: [0, 0, -22],
    props: [
      { id: 'sun', type: 'sun', pos: [-26, 6, -34], o: { r: 5, color: '#ffc83a' }, v: { pulse: 1 } },
      { id: 'venus', type: 'planet', pos: [0, 0, -22], o: { kind: 'venus', r: 5, atmo: '#f2d79a' }, v: { spin: 0.4 } },
      { id: 'earth', type: 'planet', pos: [14, -1, -30], o: { kind: 'earth', r: 3.6, atmo: '#5fb0ff' } },
      { id: 'merc', type: 'planet', pos: [-13, 2, -14], o: { kind: 'rock', color: '#9a8a7a', r: 1.3 }, hide: true },
      { id: 'tito', type: 'char', pos: [3, -2, -11], ry: -0.3, hide: true, o: { shirt: '#f2f2ee', pants: '#f2f2ee', skin: '#c68a5c', gear: 'helmet' } },
    ],
  },
  subjects: {
    all: { at: [0, 0, -22], r: 16, az: 0, minY: -50, styles: ['wide', 'mid', 'high'] },
    venus: { at: [0, 0, -22], r: 9, az: 10, minY: -50, styles: ['mid', 'close', 'wide'] },
    venusClose: { at: [0, 0, -22], r: 7.5, az: -8, minY: -50, styles: ['mid', 'close'] },
    sun: { at: [-26, 6, -34], r: 16, az: 0, minY: -50, styles: ['mid', 'wide'] },
    earth: { at: [14, -1, -30], r: 5, az: 6, minY: -50, styles: ['mid', 'close'] },
    merc: { at: [-13, 2, -14], r: 2.6, az: 10, minY: -50, styles: ['mid', 'close'] },
    tito: { at: [3, -1.4, -11], r: 0.8, az: 0, minY: -50, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8, armsUp: 0.3 } } } },
    titoAwe: { at: [3, -1.4, -11], r: 0.8, az: 0, minY: -50, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { surprise: 1, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['venus', 'all', 'tito'], la: { 'venus.spin': [0.4, 0.4] }, hud: [[1, 'tag', 'VÊNUS', { dot: 'gold', sub: '2º planeta a partir do Sol', size: 44 }]] },
    L02: { s: ['all', 'sun', 'all'], hud: [[0, 'stat', { from: 0, to: 225, label: 'O ANO DE VÊNUS', unit: 'DIAS TERRESTRES', t: 1.5, color: '#ffd45a' }]] },
    L03: { s: ['venus', 'venusClose', 'venus'], hud: [[0, 'stat', { from: 0, to: 243, label: 'UMA ROTAÇÃO COMPLETA', unit: 'DIAS TERRESTRES', t: 1.5, color: '#ffb04a' }]] },
    L04: { s: ['venus', 'titoAwe', 'all'], hud: [[0, 'banner', 'DIA > ANO', { color: '#e8453c', size: 70 }]] },
    L05: { s: ['venus', 'venusClose', 'all'], la: { 'venus.spin': [0.4, -0.5] }, hud: [[0, 'banner', 'GIRA AO CONTRÁRIO', { color: '#7a2a8a', size: 48 }]] },
    L06: { s: ['sun', 'venus', 'sun'], v: { venus: { spin: -0.5 } }, hud: [[0, 'tag', 'SOL NASCE NO OESTE', { dot: 'orange', size: 40 }], [2, 'tag', 'SE PÕE NO LESTE', { dot: 'blue', size: 40 }]] },
    L07: { s: ['venusClose', 'venus', 'venusClose'], v: { venus: { spin: -0.5 } }, la: { 'venus.heat': [0, 1] }, hud: [[0, 'stat', { from: 0, to: 460, label: 'TEMPERATURA NA SUPERFÍCIE', unit: '°C (APROX.)', t: 1.8, color: '#ff9a8a', danger: 1 }]] },
    L08: { s: ['merc', 'sun', 'venus'], v: { merc: { vis: 1 }, venus: { spin: -0.5, heat: 1 } }, hud: [[0, 'tag', 'MERCÚRIO: MAIS PERTO, MAS MENOS QUENTE', { dot: 'gold', size: 32 }], [2, 'tag', 'VÊNUS: MAIS QUENTE', { dot: 'red', size: 40 }]] },
    L09: { s: ['venus', 'earth', 'venus'], v: { merc: { vis: 0 }, venus: { spin: -0.5, heat: 0.4 } }, hud: [[0, 'stat', { from: 0, to: 90, label: 'PRESSÃO NA SUPERFÍCIE', unit: '× A DA TERRA (APROX.)', t: 1.5, color: '#ffb04a', danger: 0.5 }]] },
    L10: { s: ['tito', 'all'], v: { merc: { vis: 0 }, venus: { spin: 0.1, heat: 0 } } },
    L11: { s: ['tito', 'earth'], v: { merc: { vis: 0 }, venus: { spin: 0.1, heat: 0 } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'all', v: { venus: { spin: 0.1, heat: 0 } } },
  music: [['L01', 'mystery', 0.5], ['L03', 'wonder', 0.7], ['L05', 'wonder', 0.8], ['L07', 'tension', 0.8], ['L10', 'calm', 0.6]],
});
