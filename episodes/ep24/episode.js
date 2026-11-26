// EP24 — Protetor solar (dica)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep24', titulo: 'Protetor solar: do jeito certo', lines: LINES, defaultSubject: 'bottle', ctaLine: 'L11',
  title: { kicker: 'DICA', title: ['PROTETOR', 'SOLAR'], sub: 'USE DO JEITO CERTO' },
  fato: {
    sky: 'day', ground: 'sand', center: [0, 0, -4], seed: 3,
    props: [
      { id: 'sun', type: 'sun', pos: [16, 30, -34], o: { r: 5, aim: [-14, -25, 33] }, v: { beams: 0 } },
      { id: 'bottle', type: 'bottle', pos: [3.4, 0, 1.2], s: 1.2, o: { text: 'FPS 30' } },
      { id: 'p1', type: 'tree', pos: [-9, 0, -8], o: { kind: 'palm', h: 5 } }, { id: 'p2', type: 'tree', pos: [11, 0, -12], o: { kind: 'palm', h: 5.5 } }, { id: 'p3', type: 'tree', pos: [-15, 0, -20], o: { kind: 'palm', h: 5 } },
      { id: 'c1', type: 'cloud', pos: [-14, 20, -50], o: { r: 3 } }, { id: 'c2', type: 'cloud', pos: [10, 24, -60], o: { r: 3.5 } },
      { id: 'shade', type: 'disc', pos: [-5, 0, -2], o: { r: 3, color: '#b79a62' }, hide: true },
      { id: 'tito', type: 'char', pos: [0, 0, 3], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    bottle: { at: [3.4, 1.4, 1.2], r: 1.9, az: -10, styles: ['mid', 'close', 'low', 'side'] },
    sun: { at: [16, 30, -34], r: 8, az: 0, minY: 5, cam: (style) => [{ u: 0, pos: [8, 1.6, 12], look: [16, 30, -34], fov: 40 }, { u: 1, pos: [9, 1.6, 10], look: [16, 29, -34], fov: 37 }] },
    beach: { at: [0, 3, -6], r: 8, az: 15, styles: ['wide', 'mid', 'side', 'high'] },
    tito: { at: [0, 1.25, 3], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8 } } } },
    titoHot: { at: [0, 1.25, 3], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { smile: 0, scared: 0.5, shake: 0.4, surprise: 0.3 } } } },
    titoHat: { at: [0, 1.25, 3], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 1 } } } },
  },
  plan: {
    L01: { s: ['bottle', 'tito', 'beach'], hud: [[0, 'thought', 'q', 780, 480]] },
    L02: { s: ['sun', 'titoHot', 'beach', 'titoHot'], v: { sun: { beams: 1 } }, hud: [[0, 'tag', 'RAIOS ULTRAVIOLETA', { dot: 'orange' }], [1, 'tintc', 'rgba(255,60,30,1)', 0.15], [2, 'tag', 'RISCO DE CÂNCER DE PELE', { dot: 'red', size: 40 }]] },
    L03: { s: ['bottle', 'bottle', 'tito'], v: { sun: { beams: 0.6 } }, hud: [[0, 'tag', 'FPS', { dot: 'gold', sub: 'fator de proteção solar' }], [1, 'tag', 'PROTEGE DOS RAIOS UVB', { dot: 'orange', size: 40 }]] },
    L04: { s: ['bottle', 'sun', 'bottle'], v: { sun: { beams: 0.6 } }, hud: [[0, 'stat', { from: 0, to: 97, label: 'FPS 30 BLOQUEIA', unit: 'DOS RAIOS UVB', suffix: '%', color: '#ffd45a', t: 1.4 }]] },
    L05: { s: ['bottle', 'titoHot', 'bottle'], v: { sun: { beams: 0.8 } }, hud: [[0, 'tag', 'NENHUM BLOQUEIA 100%', { dot: 'red', size: 44 }], [0, 'mark', 'no', 800, 700, 64]] },
    L06: { s: ['bottle', 'tito', 'bottle'], v: { sun: { beams: 0.5 } }, hud: [[0, 'tag', 'AMPLO ESPECTRO', { dot: 'green', sub: 'protege também contra UVA' }], [1, 'mark', 'ok', 800, 640, 64]] },
    L07: { s: ['tito', 'bottle', 'beach'], v: { sun: { beams: 0.4 }, bottle: { squirt: 1 } }, hud: [[0, 'tag', 'ANTES DE SAIR', { dot: 'gold' }], [2, 'stat', { text: '2 H', label: 'REAPLIQUE A CADA', unit: 'HORAS (EM CASA OU NA PRAIA)', color: '#ffd45a' }]] },
    L08: { s: ['titoHot', 'bottle', 'tito'], v: { sun: { beams: 0.4 } }, hud: [[0, 'tag', 'DEPOIS DE NADAR OU SUAR', { dot: 'blue', size: 40 }]] },
    L09: { s: ['beach', 'tito', 'beach'], v: { sun: { beams: 0.4 } }, hud: [[0, 'stat', { text: '1/3', label: 'DIZ REAPLICAR A CADA 2 H', unit: 'PESQUISA NOS EUA', color: '#ff9a8a', danger: 1 }]] },
    L10: { s: ['titoHat', 'beach', 'titoHat'], v: { shade: { vis: 1 }, sun: { beams: 0.15 } }, hud: [[0, 'tag', 'CHAPÉU · ÓCULOS · SOMBRA', { dot: 'green', size: 38 }], [0, 'mark', 'ok', 800, 640, 64]] },
    L11: { s: ['tito', 'bottle'], v: { sun: { beams: 0.1 } } },
    L12: { s: ['tito', 'beach'], hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'beach', sky: 'dusk' },
  music: [['L01', 'calm', 0.6], ['L02', 'tension', 0.6], ['L04', 'wonder', 0.7], ['L07', 'calm', 0.65], ['L10', 'wonder', 0.65]],
});
