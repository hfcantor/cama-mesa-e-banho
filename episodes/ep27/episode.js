// EP27 — Lavar as mãos (dica)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep27', titulo: 'Lavar as mãos: 20 segundos', lines: LINES, defaultSubject: 'hand', ctaLine: 'L11',
  title: { kicker: 'DICA', title: ['LAVE AS', 'MÃOS'], sub: '20 SEGUNDOS QUE PROTEGEM' },
  fato: {
    sky: 'lab', ground: 'floor', center: [0, 0, -3], seed: 5,
    props: [
      { id: 'hand', type: 'hand', pos: [0, 0, -3], s: 1.8 },
      { id: 'faucet', type: 'faucet', pos: [7.5, 0, -3], s: 1.3 },
      { id: 'soap', type: 'soap', pos: [4, 0, 0], s: 1.2 },
      { id: 'tito', type: 'char', pos: [-5.5, 0, 3.5], ry: 0.5, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    hand: { at: [0, 2.6, -3], r: 3.2, az: 12, styles: ['mid', 'close', 'wide', 'low', 'side'] },
    handClose: { at: [0, 3.0, -3], r: 2.0, az: 6, styles: ['close', 'macro'] },
    faucet: { at: [7.5, 2.6, -3], r: 3.0, az: -15, styles: ['mid', 'close', 'low', 'side'] },
    soap: { at: [4, 0.6, 0], r: 1.5, az: -8, styles: ['close', 'mid', 'low'] },
    all: { at: [2, 2.5, -2], r: 8, az: 10, styles: ['wide', 'mid', 'high'] },
    tito: { at: [-5.5, 1.25, 3.5], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8 } } } },
    titoScared: { at: [-5.5, 1.25, 3.5], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 0.7, surprise: 0.6, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['hand', 'faucet', 'tito'], v: { hand: { germs: 0 } } },
    L02: { s: ['handClose', 'hand', 'handClose'], v: { hand: { germs: 0.5 } }, hud: [[0, 'tag', 'MAÇANETA · CELULAR · DINHEIRO', { dot: 'orange', size: 36 }]] },
    L03: { s: ['titoScared', 'hand', 'titoScared'], v: { hand: { germs: 0.8 } }, hud: [[0, 'tag', 'OLHOS · NARIZ · BOCA', { dot: 'red' }]] },
    L04: { s: ['hand', 'handClose', 'hand'], v: { hand: { germs: 1 } }, hud: [[0, 'tag', 'GERMES ENTRAM NO CORPO', { dot: 'green', size: 40 }], [2, 'mark', 'no', 800, 700, 64]] },
    L05: { s: ['faucet', 'soap', 'tito'], v: { hand: { germs: 1 }, faucet: { flow: 1 } }, hud: [[0, 'tag', 'ÁGUA E SABÃO', { dot: 'blue', sub: 'o jeito mais simples' }], [1, 'mark', 'ok', 800, 640, 64]] },
    L06: { s: ['faucet', 'handClose', 'soap', 'hand'], v: { hand: { germs: 1 }, faucet: { flow: 1 }, soap: { bubbles: 1 } }, la: { 'hand.foam': [0, 1], 'hand.scrub': [1, 1] }, hud: [[1, 'stat', { from: 0, to: 20, label: 'ESFREGUE POR', unit: 'SEGUNDOS', t: 1.8, color: '#7fd1ff' }]] },
    L07: { s: ['handClose', 'handClose', 'hand', 'handClose'], v: { hand: { foam: 1, scrub: 1 }, soap: { bubbles: 1 } }, la: { 'hand.germs': [1, 0.2] }, hud: [[0, 'tag', 'PALMAS · COSTAS DAS MÃOS', { dot: 'gold', size: 38 }], [2, 'tag', 'ENTRE OS DEDOS · UNHAS', { dot: 'gold', size: 38 }]] },
    L08: { s: ['faucet', 'hand', 'tito'], v: { hand: { foam: 0.3, germs: 0, scrub: 0 }, faucet: { flow: 1 } }, la: { 'hand.foam': [0.6, 0] }, hud: [[0, 'tag', 'ENXÁGUE BEM', { dot: 'blue' }], [2, 'tag', 'TOALHA LIMPA', { dot: 'green' }]] },
    L09: { s: ['tito', 'all', 'tito'], v: { hand: { germs: 0 } }, hud: [[0, 'tag', 'ANTES DE COMER', { dot: 'gold' }], [1, 'tag', 'DEPOIS DO BANHEIRO', { dot: 'gold' }], [2, 'tag', 'DEPOIS DE TOSSIR OU ESPIRRAR', { dot: 'gold', size: 36 }]] },
    L10: { s: ['soap', 'hand', 'tito'], v: { hand: { germs: 0 }, soap: { bubbles: 0 } }, hud: [[0, 'stat', { text: '60%', label: 'ÁLCOOL EM GEL COM', unit: 'DE ÁLCOOL, NO MÍNIMO', color: '#7fd1ff' }]] },
    L11: { s: ['tito', 'hand'], v: { hand: { germs: 0 } } },
    L12: { s: ['tito', 'hand'], v: { hand: { germs: 0 } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'all', sky: 'lab', v: { hand: { germs: 0 } } },
  music: [['L01', 'calm', 0.6], ['L03', 'mystery', 0.6], ['L05', 'wonder', 0.7], ['L09', 'calm', 0.65]],
});
