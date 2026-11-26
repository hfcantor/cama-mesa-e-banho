// EP26 — Senhas (dica)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep26', titulo: 'Senhas: 4 dicas de segurança', lines: LINES, defaultSubject: 'lock', ctaLine: 'L11',
  title: { kicker: 'DICA', title: ['SENHAS', 'SEGURAS'], sub: '4 DICAS RÁPIDAS' },
  fato: {
    sky: 'lab', ground: 'floor', center: [0, 0, -3], seed: 2,
    props: [
      { id: 'lock', type: 'lock', pos: [0, 0, -3], s: 1.7 },
      { id: 'hacker', type: 'char', pos: [-6.5, 0, -2], ry: 0.6, o: { shirt: '#20242c', pants: '#20242c', skin: '#9aa0a8', gear: 'hood', glasses: true }, hide: true },
      { id: 'mon', type: 'monitor', pos: [6.5, 0, -4], o: { w: 3, h: 1.9, text: 'SENHA:|123456', fg: '#ff8a7a', bg: '#1a0f12', glow: 'rgba(255,80,60,1)' }, v: { glow: 0.5 } },
      { id: 'rack', type: 'rack', pos: [11.5, 0, -6] },
      { id: 'tito', type: 'char', pos: [0, 0, 4], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    lock: { at: [0, 2.2, -3], r: 3.0, az: 12, styles: ['mid', 'close', 'wide', 'low', 'side'] },
    lockClose: { at: [0, 2.2, -3], r: 1.8, az: 8, styles: ['close', 'macro'] },
    hacker: { at: [-6.5, 1.3, -2], r: 1.0, az: 25, styles: ['close', 'mid', 'side'], v: { hacker: { vis: 1, pose: { smile: 0, typing: 1 } } } },
    mon: { at: [6.5, 2.2, -4], r: 2.6, az: -12, styles: ['mid', 'close', 'low', 'side'] },
    rack: { at: [11.5, 1.6, -6], r: 2.6, az: -20, styles: ['mid', 'close', 'side'] },
    all: { at: [2, 2.5, -3], r: 8, az: 10, styles: ['wide', 'mid', 'high'], v: { hacker: { vis: 1, pose: { typing: 1 } } } },
    tito: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8 } } } },
    titoScared: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 1, surprise: 0.7, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['lock', 'mon', 'titoScared'], hud: [[1, 'tag', '123456', { dot: 'red', size: 56 }]] },
    L02: { s: ['mon', 'lock', 'mon'], hud: [[0, 'tag', 'SENHA MAIS USADA DO MUNDO', { dot: 'red', size: 38, sub: 'listas de vazamentos' }]] },
    L03: { s: ['hacker', 'lockClose', 'mon', 'all'], la: { 'lock.open': [0, 1], 'lock.alarm': [0, 1] }, hud: [[0, 'tag', 'PROGRAMAS DE ATAQUE', { dot: 'red' }], [2, 'stat', { text: '< 1 SEGUNDO', label: 'PARA DESCOBRIR', unit: 'SENHAS ASSIM', danger: 1 }]], sfx: [[1, 'alarm', 0.1, { level: 0.08, dur: 1 }]] },
    L04: { s: ['lock', 'titoScared', 'lock'], v: { lock: { open: 1, alarm: 1 } }, hud: [[0, 'mark', 'no', 800, 640, 64], [0, 'tag', 'CURTA E PREVISÍVEL', { dot: 'red', y: 800 }]] },
    L05: { s: ['mon', 'lock', 'tito'], v: { lock: { open: 0 }, mon: { text: 'bolo-cenoura|voa-alto-2025', fg: '#9fffb0', bg: '#0e2414', glow: 'rgba(80,255,140,1)' } }, hud: [[0, 'tag', 'DICA 1 · SENHAS LONGAS', { dot: 'green', size: 40 }], [1, 'mark', 'ok', 800, 640, 64]] },
    L06: { s: ['rack', 'lock', 'tito'], v: { lock: { open: 0 }, mon: { text: 'SENHA|DIFERENTE', fg: '#9fffb0', bg: '#0e2414' } }, hud: [[0, 'tag', 'DICA 2 · UMA POR CONTA', { dot: 'green', size: 40 }]] },
    L07: { s: ['lock', 'rack', 'lockClose'], v: { lock: { open: 0 }, mon: { text: 'VAZOU 1|OUTRAS OK', fg: '#9fffb0', bg: '#0e2414' } }, hud: [[0, 'mark', 'ok', 800, 640, 64], [0, 'tag', 'AS OUTRAS CONTINUAM SEGURAS', { dot: 'green', size: 36, y: 800 }]] },
    L08: { s: ['rack', 'mon', 'rack'], v: { lock: { open: 0 }, mon: { text: 'COFRE DE|SENHAS', fg: '#9fe0ff', bg: '#10263f', glow: 'rgba(120,180,255,1)' } }, hud: [[0, 'tag', 'DICA 3 · GERENCIADOR', { dot: 'green', size: 40 }]] },
    L09: { s: ['mon', 'tito', 'mon'], v: { lock: { open: 0 }, mon: { text: 'CÓDIGO:|•••  •••', fg: '#9fe0ff', bg: '#10263f', glow: 'rgba(120,180,255,1)' } }, hud: [[0, 'tag', 'DICA 4 · VERIFICAÇÃO EM 2 ETAPAS', { dot: 'green', size: 34 }], [1, 'mark', 'ok', 800, 640, 64]] },
    L10: { s: ['hacker', 'titoScared', 'mon'], v: { lock: { open: 0 }, mon: { text: 'NÃO COMPARTILHE|CÓDIGOS', fg: '#ff8a7a', bg: '#1a0f12', glow: 'rgba(255,80,60,1)' } }, hud: [[0, 'mark', 'no', 800, 640, 64], [0, 'tag', 'NUNCA COMPARTILHE CÓDIGOS', { dot: 'red', size: 38, y: 800 }]] },
    L11: { s: ['tito', 'lock'], v: { lock: { open: 0 }, mon: { text: 'SEGURO ✓', fg: '#9fffb0', bg: '#0e2414', glow: 'rgba(80,255,140,1)' } } },
    L12: { s: ['tito', 'lock'], v: { lock: { open: 0 }, mon: { text: 'SEGURO ✓', fg: '#9fffb0', bg: '#0e2414' } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'lock', sky: 'lab', v: { lock: { open: 0 } } },
  music: [['L01', 'mystery', 0.55], ['L03', 'tension', 0.8], ['L05', 'wonder', 0.65], ['L08', 'calm', 0.6]],
});
