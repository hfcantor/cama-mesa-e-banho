// EP36 — Roy Sullivan, o homem dos 7 raios
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const STORM = '#4a4f5c';
export default buildFato({
  id: 'ep36', titulo: 'O homem atingido por 7 raios', lines: LINES, defaultSubject: 'roy', ctaLine: 'L10',
  title: { kicker: 'FATO REAL', title: ['7 RAIOS', 'E VIVO'], sub: 'A HISTÓRIA DE ROY SULLIVAN' },
  fato: {
    sky: 'gray', ground: 'grass', seed: 5, center: [0, 0, -10],
    props: [
      { id: 'm1', type: 'mountain', pos: [-30, 0, -60], o: { r: 20, h: 15, color: '#5f7a64' } }, { id: 'm2', type: 'mountain', pos: [26, 0, -70], o: { r: 24, h: 18, color: '#5f7a64' } },
      { id: 'c1', type: 'cloud', pos: [-6, 17, -20], o: { r: 4.5, color: STORM, emis: 0.05 } }, { id: 'c2', type: 'cloud', pos: [6, 18, -26], o: { r: 5, color: STORM, emis: 0.05 } }, { id: 'c3', type: 'cloud', pos: [0, 16, -12], o: { r: 4, color: STORM, emis: 0.05 } },
      { id: 'bolt', type: 'bolt', pos: [0, 0, 0], o: { from: [0, 16, 0], to: [0, 2.8, 0], seed: 5 }, v: { on: 0, flick: 0 } },
      { id: 'roy', type: 'char', pos: [0, 0, 0], hide: true, o: { shirt: '#3a7a3a', pants: '#6a5a3a', skin: '#d9a07a', hat: true } },
      { id: 'tree1', type: 'tree', pos: [-9, 0, -6], o: { h: 7 } }, { id: 'tree2', type: 'tree', pos: [-14, 0, -16], o: { h: 6 } }, { id: 'tree3', type: 'tree', pos: [14, 0, -18], o: { h: 6.5 } }, { id: 'tree4', type: 'tree', pos: [8, 0, -34], o: { h: 6 } },
      { id: 'cabin', type: 'house', pos: [11, 0, -4], o: { style: 'timber' }, s: 1.1 },
    ],
  },
  subjects: {
    roy: { at: [0, 1.25, 0], r: 0.8, styles: ['close', 'mid', 'side', 'low'], v: { roy: { vis: 1, pose: { smile: 0.6 } } } },
    royHit: { at: [0, 1.25, 0], r: 0.9, styles: ['mid', 'low', 'close'], v: { roy: { vis: 1, pose: { scared: 1, shake: 1, smile: 0 } } } },
    royWide: { at: [0, 2, -2], r: 7, az: 8, styles: ['wide', 'mid', 'low'], v: { roy: { vis: 1, pose: { smile: 0.4 } } } },
    sky: { at: [0, 15, -18], r: 11, az: 0, minY: 1, styles: ['low', 'mid', 'wide'] },
    park: { at: [0, 5, -20], r: 24, az: 12, styles: ['wide', 'side', 'high'] },
    cabin: { at: [11, 2, -4], r: 6, az: -15, styles: ['mid', 'wide', 'low'] },
    tree: { at: [-9, 3.5, -6], r: 7, az: 10, styles: ['mid', 'wide', 'low'] },
    field: { at: [0, 1.5, 12], r: 14, az: -10, styles: ['wide', 'high', 'side'], v: { roy: { vis: 1, pose: { smile: 0.2 } } } },
  },
  plan: {
    L01: { s: ['sky', 'royHit', 'sky'], v: { bolt: { on: 1 } }, shake: 'hit', hud: [[0, 'flashc', 0.5], [1, 'stat', { from: 0, to: 7, label: 'RAIOS SOFRIDOS', unit: 'E SOBREVIVEU A TODOS', t: 1.4, color: '#ffe27a' }]] },
    L02: { s: ['royWide', 'park', 'roy'], v: { bolt: { on: 0 } }, hud: [[0, 'tag', 'ROY SULLIVAN', { dot: 'gold', sub: 'guarda-florestal · Shenandoah', size: 42 }]] },
    L03: { s: ['sky', 'park', 'royHit', 'sky'], v: { bolt: { on: 1 } }, shake: 0.01, hud: [[0, 'tag', '1942', { dot: 'blue', sub: 'primeiro raio', size: 52, y: 360 }], [2, 'tag', '1977', { dot: 'red', sub: 'sétimo e último', size: 52, y: 360 }]] },
    L04: { s: ['roy', 'royHit', 'roy'], v: { bolt: { on: 0 } }, hud: [[0, 'tag', 'PERDEU A UNHA DO DEDÃO', { dot: 'orange', size: 38 }], [1, 'tag', 'SOBRANCELHAS E CABELO QUEIMADOS', { dot: 'red', size: 34, y: 640 }]] },
    L05: { s: ['royWide', 'roy', 'royWide'], hud: [[0, 'banner', 'RECORDE GUINNESS', { color: '#2a7de1', size: 54 }]] },
    L06: { s: ['sky', 'roy', 'sky'], sky: ['gray', 'night', 0, 0.4], hud: [[0, 'tag', 'DICA DE SEGURANÇA', { dot: 'green', sub: 'trovão = perigo', size: 42 }], [0, 'tintc', 'rgba(20,24,40,1)', 0.15]] },
    L07: { s: ['cabin', 'cabin', 'roy'], hud: [[0, 'mark', 'ok', 800, 560, 70], [0, 'tag', 'CONSTRUÇÃO FECHADA OU CARRO', { dot: 'green', y: 740, size: 34 }]] },
    L08: { s: ['tree', 'field', 'tree'], hud: [[0, 'mark', 'no', 540, 700, 70], [0, 'tag', 'ÁRVORE ISOLADA · CAMPO ABERTO · ÁGUA', { dot: 'red', y: 360, size: 32 }]] },
    L09: { s: ['roy', 'park', 'roy'], hud: [[0, 'stat', { text: '30 MIN', label: 'APÓS O ÚLTIMO TROVÃO', unit: 'ESPERE PARA SAIR', color: '#9ad0ff' }]] },
    L10: { s: ['roy', 'park'], sky: 'day' },
    L11: { s: ['roy', 'royWide'], sky: 'day', hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'park', sky: 'day' },
  music: [['L01', 'action', 0.85], ['L02', 'mystery', 0.5], ['L04', 'wonder', 0.65], ['L06', 'tension', 0.7], ['L09', 'calm', 0.6]],
});
