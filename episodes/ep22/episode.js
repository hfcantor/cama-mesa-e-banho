// EP22 — Randy Gardner (1964): 11 dias sem dormir
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep22', titulo: 'Randy Gardner: 11 dias sem dormir', lines: LINES, defaultSubject: 'clock', ctaLine: 'L12',
  title: { kicker: 'FATO REAL', title: ['11 DIAS', 'SEM DORMIR'], sub: 'SAN DIEGO · 1964' },
  fato: {
    sky: 'lab', ground: 'wood', center: [0, 0, -4], seed: 4,
    props: [
      { id: 'wall', type: 'box', pos: [0, 0, -11], o: { w: 30, h: 12, d: 0.4, color: '#6f86a8' } },
      { id: 'side', type: 'box', pos: [-14, 0, -3], o: { w: 0.4, h: 12, d: 18, color: '#7d94b6' } },
      { id: 'clock', type: 'clock', pos: [0, 6, -10.6], o: { r: 3.0 }, v: { speed: 0 } },
      { id: 'bed', type: 'bed', pos: [-7, 0, -5], ry: 0.5, s: 1.3, o: { color: '#e8453c' } },
      { id: 'cup1', type: 'cup', pos: [3.5, 0, -1], s: 1.4 }, { id: 'cup2', type: 'cup', pos: [4.7, 0, -2], s: 1.4, o: { color: '#ffd45a' } }, { id: 'cup3', type: 'cup', pos: [2.6, 0, -2.6], s: 1.4, o: { color: '#7fd1ff' } },
      { id: 'tito', type: 'char', pos: [0, 0, 3], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
      { id: 'dr', type: 'char', pos: [4.5, 0, 3.5], ry: -0.5, hide: true, o: { shirt: '#f2f2f2', pants: '#4a4a5a', skin: '#d9a07a', glasses: true, coat: true } },
    ],
  },
  subjects: {
    clock: { at: [0, 6, -10.6], r: 3.2, az: 0, minY: 1.5, styles: ['mid', 'close', 'wide', 'low'] },
    room: { at: [-1, 3, -5], r: 9, az: 15, styles: ['wide', 'mid', 'high', 'side'] },
    bed: { at: [-7, 1.1, -5], r: 3.6, az: 25, styles: ['mid', 'close', 'low', 'side'] },
    cups: { at: [3.5, 0.6, -1.5], r: 1.8, az: -10, styles: ['close', 'mid', 'low'] },
    tito: { at: [0, 1.25, 3], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8 } } } },
    titoTired: { at: [0, 1.25, 3], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { smile: 0, sleep: 0.55, shake: 0.4 } } } },
    titoZombie: { at: [0, 1.25, 3], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { smile: 0, scared: 0.5, surprise: 0.6, shake: 1 } } } },
    titoSleep: { at: [0, 1.25, 3], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { sleep: 1, smile: 0.7 } } } },
    doc: { at: [4.5, 1.3, 3.5], r: 0.9, az: 20, styles: ['close', 'mid'], v: { dr: { vis: 1 } } },
  },
  plan: {
    L01: { s: ['room', 'tito', 'clock'], v: { clock: { speed: 0 } } },
    L02: { s: ['clock', 'room', 'clock', 'titoTired'], la: { 'clock.speed': [60, 300] }, hud: [[0, 'stat', { from: 0, to: 264, label: 'SEM DORMIR', unit: 'HORAS (11 DIAS)', t: 2.2 }]] },
    L03: { s: ['room', 'tito', 'room'], hud: [[0, 'tag', 'FEIRA DE CIÊNCIAS', { dot: 'gold', sub: 'San Diego · Califórnia' }]] },
    L04: { s: ['cups', 'tito', 'cups', 'room'], hud: [[0, 'tag', 'MÚSICA ALTA', { dot: 'orange' }], [2, 'tag', 'BANHO FRIO', { dot: 'blue' }]] },
    L05: { s: ['doc', 'tito', 'doc'], hud: [[0, 'tag', 'DR. WILLIAM DEMENT', { dot: 'gold', sub: 'pesquisador do sono', size: 40 }]] },
    L06: { s: ['titoTired', 'clock', 'titoTired'], hud: [[0, 'tag', 'IRRITADO', { dot: 'red' }], [2, 'tag', 'DIFÍCIL SE CONCENTRAR', { dot: 'orange', size: 40 }]] },
    L07: { s: ['titoZombie', 'titoZombie', 'room'], sky: ['lab', 'night', 0, 0.6], hud: [[0, 'tag', 'FALHAS DE MEMÓRIA', { dot: 'red' }], [1, 'thought', '?', 780, 480]] },
    L08: { s: ['bed', 'titoSleep', 'bed'], sky: 'night', v: { tito: { x: 0 } }, hud: [[0, 'stat', { text: '≈ 15 H', label: 'DORMIU', unit: 'SEGUIDAS' }], [2, 'zzz', 560, 1060]] },
    L09: { s: ['doc', 'clock', 'tito'], sky: 'lab', hud: [[0, 'mark', 'no', 800, 600, 70], [0, 'tag', 'NÃO REPITA ISSO', { dot: 'red', y: 760 }]] },
    L10: { s: ['clock', 'tito', 'clock'], sky: 'lab', la: { 'clock.speed': [0, 0] }, hud: [[0, 'stat', { text: '7 H+', label: 'ADULTOS PRECISAM DE', unit: 'DE SONO POR NOITE', color: '#6fe08a' }]] },
    L11: { s: ['titoSleep', 'bed', 'titoSleep'], sky: 'night', hud: [[0, 'mark', 'ok', 800, 560, 70], [0, 'tag', 'CUIDADO COM O CORPO', { dot: 'green', y: 740 }], [0, 'zzz', 560, 1060]] },
    L12: { s: ['tito', 'room'], sky: 'lab' },
    L13: { s: ['tito', 'bed'], sky: 'lab', hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'room', sky: 'night' },
  music: [['L01', 'mystery', 0.5], ['L04', 'action', 0.7], ['L07', 'tension', 0.8], ['L08', 'calm', 0.6], ['L10', 'wonder', 0.65]],
});
