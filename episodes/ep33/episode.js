// EP33 — O mel que nunca estraga
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep33', titulo: 'O mel que nunca estraga', lines: LINES, defaultSubject: 'jar', ctaLine: 'L10',
  title: { kicker: 'CURIOSIDADE', title: ['O MEL', 'NÃO ESTRAGA'], sub: 'PRATICAMENTE NUNCA' },
  fato: {
    sky: 'day', ground: 'wood', seed: 3, center: [0, 0, 0],
    props: [
      { id: 'jar', type: 'bottle', pos: [0, 0, 0], s: 1.6, o: { color: '#e89a14', text: 'MEL', sub: '100% NATURAL' }, v: { squirt: 0 } },
      { id: 'cup', type: 'cup', pos: [3.2, 0, 1.2], s: 2.2, o: { color: '#ffe9b0' }, v: { steam: 0 } },
      { id: 'pyr1', type: 'pyramid', pos: [-34, 0, -75], s: 3 }, { id: 'pyr2', type: 'pyramid', pos: [-6, 0, -95], s: 4 },
      { id: 'g1', type: 'germ', pos: [-2.8, 0.9, 2.2], o: { r: 0.6 }, hide: true }, { id: 'g2', type: 'germ', pos: [2.6, 0.9, 2.8], o: { r: 0.55, color: '#c75ad8' }, hide: true }, { id: 'g3', type: 'germ', pos: [0, 0.9, 3.6], o: { r: 0.5, color: '#d6d65a' }, hide: true },
      { id: 'sD', type: 'sign', pos: [-5.5, 0, -2], o: { text: 'MEL CRISTALIZADO', bg: '#7a4a14', fg: '#fff', w: 5, h: 1.2, pole: 1.4 }, hide: true },
      { id: 'tito', type: 'char', pos: [4.2, 0, 5], ry: -0.4, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
      { id: 'baby', type: 'char', pos: [-3.4, 0, 5], ry: 0.4, hide: true, o: { shirt: '#ffd0e0', pants: '#ffd0e0', scale: 0.5 } },
      { id: 'steamPot', type: 'flames', pos: [0, 0, 0], hide: true, o: { w: 0.2, d: 0.2, n: 20, s: 0.6 } },
    ],
  },
  subjects: {
    jar: { at: [0, 1.5, 0], r: 2.4, az: 8, styles: ['mid', 'close', 'low', 'side'] },
    jarWide: { at: [0, 1.4, 0], r: 4.5, az: 20, styles: ['wide', 'mid', 'high'] },
    tomb: { at: [-16, 6, -80], r: 24, az: 12, styles: ['wide', 'mid', 'low'] },
    germs: { at: [0, 1.2, 2.6], r: 4.2, az: 0, styles: ['mid', 'close', 'wide'] },
    cup: { at: [3.2, 0.4, 1.2], r: 1.6, az: 0, styles: ['mid', 'close', 'macro'] },
    sign: { at: [-5.5, 1.6, -2], r: 3, styles: ['mid', 'close'] },
    baby: { at: [-3.4, 0.5, 5], r: 1.3, az: 10, styles: ['mid', 'close'], v: { baby: { vis: 1, pose: { sleep: 1, smile: 0 } } } },
    tito: { at: [4.2, 1.25, 5], r: 0.75, az: -20, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8 } } } },
    titoNo: { at: [4.2, 1.25, 5], r: 0.75, az: -20, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 0.7, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['jar', 'jarWide', 'jar'], hud: [[1, 'tag', 'O ALIMENTO ETERNO?', { dot: 'gold', size: 40 }]] },
    L02: { s: ['tomb', 'tomb', 'jar', 'tomb'], sky: 'dusk', hud: [[0, 'stat', { text: '~3.000 ANOS', label: 'POTES DE MEL EM TUMBAS DO EGITO', unit: 'RELATOS DE ARQUEÓLOGOS', scale: 0.78, color: '#ffd45a' }]] },
    L03: { s: ['jar', 'jarWide', 'jar'], sky: 'day', hud: [[0, 'tag', 'POUCA ÁGUA', { dot: 'blue', sub: 'em torno de 17%', size: 44 }]] },
    L04: { s: ['germs', 'jar', 'germs'], v: { g1: { vis: 1 }, g2: { vis: 1 }, g3: { vis: 1 } }, la: { 'g1.s': [1, 0.05], 'g2.s': [1, 0.05], 'g3.s': [1, 0.05] }, hud: [[0, 'mark', 'no', 540, 700, 70], [0, 'tag', 'SEM ÁGUA, SEM MICRÓBIOS', { dot: 'red', size: 38, y: 360 }]] },
    L05: { s: ['jar', 'jar', 'jarWide'], v: { g1: { vis: 0 }, g2: { vis: 0 }, g3: { vis: 0 } }, hud: [[0, 'tag', 'ÁCIDO', { dot: 'orange', sub: 'pH baixo' }], [1, 'tag', 'ENZIMA DAS ABELHAS', { dot: 'gold', sub: 'gera peróxido de hidrogênio', size: 40 }]] },
    L06: { s: ['sign', 'jar', 'sign'], v: { sD: { vis: 1 } }, hud: [[0, 'mark', 'ok', 800, 560, 66], [0, 'tag', 'NÃO ESTRAGOU', { dot: 'green', y: 740, size: 40 }]] },
    L07: { s: ['cup', 'jar', 'cup'], v: { cup: { steam: 1 } }, hud: [[0, 'tag', 'BANHO-MARIA', { dot: 'orange', sub: 'sem ferver', size: 40 }]] },
    L08: { s: ['jarWide', 'jar'], v: { cup: { steam: 0 }, sD: { vis: 0 } }, hud: [[0, 'mark', 'ok', 800, 560, 66], [0, 'tag', 'BEM FECHADO', { dot: 'green', y: 740, size: 40 }]] },
    L09: { s: ['baby', 'titoNo', 'baby', 'titoNo'], hud: [[0, 'mark', 'no', 540, 700, 80], [0, 'banner', 'BEBÊ < 1 ANO: NÃO', { color: '#e8453c', size: 48 }], [2, 'tag', 'RISCO DE BOTULISMO', { dot: 'red', size: 40, y: 360 }]] },
    L10: { s: ['tito', 'jar'], v: { baby: { vis: 0 } } },
    L11: { s: ['tito', 'jarWide'], hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'jarWide' },
  music: [['L01', 'mystery', 0.5], ['L02', 'wonder', 0.7], ['L04', 'calm', 0.6], ['L09', 'tension', 0.65], ['L10', 'calm', 0.6]],
});
