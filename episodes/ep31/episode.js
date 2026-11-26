// EP31 — O bug de 2038 (futuro)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep31', titulo: 'O bug de 2038', lines: LINES, defaultSubject: 'sign', ctaLine: 'L11',
  title: { kicker: 'O QUE VAI ACONTECER', title: ['O BUG', 'DE 2038'], sub: '19 DE JANEIRO DE 2038' },
  fato: {
    sky: 'lab', ground: 'floor', center: [0, 0, -4], seed: 7,
    props: [
      { id: 'wall', type: 'box', pos: [0, 0, -12], o: { w: 34, h: 14, d: 0.4, color: '#2a3a5a' } },
      { id: 'sign', type: 'sign', pos: [0, 3.2, -11.6], o: { kind: 'text', w: 13, h: 3.4, text: '19/01/2038', bg: '#0b1a2e', fg: '#7dffb0', font: 'Anton' } },
      { id: 'm1', type: 'monitor', pos: [-5.5, 0, -5], o: { w: 3, h: 1.9, text: 'SISTEMA|32 BITS', fg: '#7dffb0', bg: '#0b1a2e', glow: 'rgba(80,255,140,1)' }, v: { glow: 0.5 } },
      { id: 'm2', type: 'monitor', pos: [5.5, 0, -5], o: { w: 3, h: 1.9, text: '03:14:07', fg: '#7dffb0', bg: '#0b1a2e', glow: 'rgba(80,255,140,1)' }, v: { glow: 0.5 } },
      { id: 'rack', type: 'rack', pos: [11, 0, -8] },
      { id: 'tito', type: 'char', pos: [0, 0, 4], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a', glasses: true } },
    ],
  },
  subjects: {
    sign: { at: [0, 6, -11.6], r: 9, az: 0, minY: 1.5, styles: ['mid', 'wide', 'low'] },
    m1: { at: [-5.5, 2.0, -5], r: 2.8, az: 14, styles: ['mid', 'close', 'low', 'side'] },
    m2: { at: [5.5, 2.0, -5], r: 2.8, az: -14, styles: ['mid', 'close', 'low', 'side'] },
    rack: { at: [11, 1.6, -8], r: 2.6, az: -20, styles: ['mid', 'close', 'side'] },
    all: { at: [0, 3, -6], r: 10, az: 10, styles: ['wide', 'mid', 'high', 'side'] },
    tito: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.7 } } } },
    titoShock: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { surprise: 1, scared: 0.6, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['sign', 'all', 'titoShock', 'sign'], hud: [[0, 'tag', '19/01/2038', { dot: 'gold' }]] },
    L02: { s: ['sign', 'm1', 'all'], v: { sign: { text: '01/01/1970' } }, hud: [[0, 'tag', 'TEMPO EM SEGUNDOS', { dot: 'blue', sub: 'desde 1º de janeiro de 1970' }]] },
    L03: { s: ['m1', 'rack', 'm1'], v: { sign: { text: '32 BITS' }, m1: { text: 'NÚMERO|32 BITS' } }, hud: [[0, 'tag', 'SISTEMAS ANTIGOS', { dot: 'orange' }], [1, 'stat', { text: '32 BITS', label: 'O NÚMERO CABE EM', unit: '', color: '#7dffb0', y: 430 }]] },
    L04: { s: ['sign', 'm2', 'sign'], v: { sign: { text: '03:14:07' }, m2: { text: '03:14:07|UTC' } }, hud: [[0, 'tag', 'O MAIOR NÚMERO POSSÍVEL', { dot: 'gold', size: 40 }]] },
    L05: { s: ['sign', 'm2', 'titoShock', 'sign'], v: { sign: { text: '03:14:08' }, m2: { text: 'ERRO!|NEGATIVO', fg: '#ff8a7a', bg: '#1a0f12', glow: 'rgba(255,80,60,1)' }, rack: { alarm: 1 } }, hud: [[0, 'pop', 'ESTOUROU!', 540, 520, { size: 150, color: '#FF5A4D' }], [1, 'mark', 'no', 800, 700, 64]], sfx: [[0, 'alarm', 0.1, { level: 0.08, dur: 1 }]] },
    L06: { s: ['sign', 'all', 'sign'], v: { sign: { text: '13/12/1901' }, m2: { text: 'DATA:|1901', fg: '#ff8a7a', bg: '#1a0f12', glow: 'rgba(255,80,60,1)' }, rack: { alarm: 1 } }, hud: [[0, 'tag', 'VOLTOU PARA 1901?', { dot: 'red' }]] },
    L07: { s: ['tito', 'sign', 'tito'], v: { sign: { text: 'ANO 2000' }, m2: { text: 'Y2K|≠ 2038' } }, hud: [[0, 'tag', 'PARECIDO COM O BUG DO ANO 2000', { dot: 'gold', size: 34 }]] },
    L08: { s: ['m1', 'tito', 'm1'], v: { sign: { text: 'CORRIGIDO ✓' }, m1: { text: 'SISTEMA|64 BITS ✓' }, m2: { text: 'OK ✓' } }, hud: [[0, 'mark', 'ok', 800, 640, 70], [0, 'tag', 'MUITOS JÁ CORRIGIDOS', { dot: 'green' }]] },
    L09: { s: ['rack', 'all', 'rack'], v: { sign: { text: 'EMBARCADOS' }, m2: { text: 'OK ✓' } }, hud: [[0, 'tag', 'EQUIPAMENTOS ANTIGOS', { dot: 'orange', sub: 'quase nunca atualizados', size: 40 }]] },
    L10: { s: ['tito', 'm1', 'tito'], v: { sign: { text: 'CORRIGINDO...' }, m1: { text: 'ATUALIZAÇÃO|OK ✓' } }, hud: [[0, 'tag', 'PROGRAMADORES NO MUNDO TODO', { dot: 'green', size: 36 }]] },
    L11: { s: ['tito', 'sign'], v: { sign: { text: 'OBRIGADO!' } } },
    L12: { s: ['tito', 'm1'], v: { sign: { text: '19/01/2038' } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'all', v: { sign: { text: '19/01/2038' } } },
  music: [['L01', 'mystery', 0.55], ['L04', 'tension', 0.75], ['L05', 'action', 0.9], ['L08', 'wonder', 0.65]],
});
