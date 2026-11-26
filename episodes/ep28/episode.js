// EP28 — Eclipse solar total de 2027 (futuro)
import { buildFato, upCam } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const SUN = [-14, 34, -100];
export default buildFato({
  id: 'ep28', titulo: 'O eclipse de 2 de agosto de 2027', lines: LINES, defaultSubject: 'sun', ctaLine: 'L11',
  title: { kicker: 'O QUE VAI ACONTECER', title: ['ECLIPSE', 'DE 2027'], sub: '2 DE AGOSTO DE 2027' },
  fato: {
    sky: 'day', ground: 'sand', center: [0, 0, -10], seed: 4,
    props: [
      { id: 'sun', type: 'sun', pos: SUN, o: { r: 10 }, v: { cover: 0 } },
      { id: 'pyr1', type: 'pyramid', pos: [-16, 0, -46], s: 3.2 }, { id: 'pyr2', type: 'pyramid', pos: [10, 0, -62], s: 4.4 }, { id: 'pyr3', type: 'pyramid', pos: [28, 0, -48], s: 2.4 },
      { id: 'p1', type: 'tree', pos: [-8, 0, -8], o: { kind: 'palm', h: 5 } }, { id: 'p2', type: 'tree', pos: [9, 0, -14], o: { kind: 'palm', h: 5.5 } }, { id: 'p3', type: 'tree', pos: [-14, 0, -22], o: { kind: 'palm', h: 5 } },
      { id: 'tito', type: 'char', pos: [0, 0, 4], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a', gear: 'eclipse' } },
    ],
  },
  subjects: {
    sun: { at: SUN, r: 12, cam: upCam([0, 1.6, 8], SUN, { fov: 34 }) },
    desert: { at: [4, 3, -40], r: 20, az: 10, styles: ['wide', 'mid', 'side', 'high'] },
    pyr: { at: [10, 4, -62], r: 12, az: 15, styles: ['mid', 'wide', 'low'] },
    tito: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8 } } } },
    titoLook: { at: [0, 1.25, 4], r: 0.75, styles: ['side', 'mid', 'close'], az: 55, v: { tito: { vis: 1, pose: { smile: 1, lookPitch: -0.5 } } } },
  },
  plan: {
    L01: { s: ['sun', 'desert', 'sun'], v: { sun: { cover: 0.15 } }, },
    L02: { s: ['sun', 'sun', 'titoLook', 'sun'], sky: ['day', 'eclipse', 0, 0.8], la: { 'sun.cover': [0.15, 0.98] }, hud: [[0, 'stat', { text: '6 MIN 23 S', label: 'ESCURIDÃO TOTAL DE ATÉ', unit: 'DURAÇÃO MÁXIMA', color: '#ffd45a' }]] },
    L03: { s: ['sun', 'pyr', 'sun'], sky: ['eclipse', 'eclipse', 1, 1], v: { sun: { cover: 1 } }, hud: [[0, 'stat', { text: 'ATÉ 2114', label: 'A MAIOR DURAÇÃO', unit: 'SÓ SE REPETE NESSE PATAMAR EM 2114', scale: 0.85, color: '#ffd45a' }]] },
    L04: { s: ['sun', 'sun', 'sun'], sky: ['day', 'eclipse', 0, 1], la: { 'sun.cover': [0.05, 1] }, hud: [[0, 'tag', 'A LUA NA FRENTE DO SOL', { dot: 'blue', size: 40 }]] },
    L05: { s: ['desert', 'pyr', 'desert'], sky: ['eclipse', 'eclipse', 0.9, 0.9], v: { sun: { cover: 1 } }, hud: [[0, 'tag', 'ESPANHA · NORTE DA ÁFRICA', { dot: 'gold', sub: 'e Oriente Médio', size: 40 }]] },
    L06: { s: ['pyr', 'desert', 'pyr'], sky: 'eclipse', v: { sun: { cover: 1 } }, hud: [[0, 'tag', 'PERTO DE LUXOR · EGITO', { dot: 'red', sub: 'ponto de maior duração', size: 40 }]] },
    L07: { s: ['desert', 'sun', 'titoLook'], sky: 'eclipse', v: { sun: { cover: 1 } }, hud: [[0, 'tag', 'O CÉU ESCURECE', { dot: 'blue' }], [1, 'tag', 'APARECEM ESTRELAS', { dot: 'gold' }], [2, 'tag', 'A TEMPERATURA CAI', { dot: 'blue' }]] },
    L08: { s: ['sun', 'sun', 'titoLook'], sky: 'eclipse', v: { sun: { cover: 1 } }, hud: [[0, 'tag', 'A COROA DO SOL', { dot: 'gold', sub: 'camada mais externa' }]] },
    L09: { s: ['desert', 'sun', 'desert'], sky: ['eclipse', 'day', 0.4, 1], la: { 'sun.cover': [0.6, 0.45] }, hud: [[0, 'tag', 'FORA DA FAIXA: PARCIAL', { dot: 'orange', size: 40 }]] },
    L10: { s: ['tito', 'sun', 'tito'], sky: 'day', v: { sun: { cover: 0.4 } }, hud: [[0, 'mark', 'ok', 800, 560, 70], [0, 'tag', 'ÓCULOS PRÓPRIOS PARA ECLIPSE', { dot: 'green', y: 740, size: 36 }], [1, 'mark', 'no', 540, 700, 64]] },
    L11: { s: ['tito', 'desert'], sky: 'day', v: { sun: { cover: 0.3 } } },
    L12: { s: ['tito', 'pyr'], sky: 'day', v: { sun: { cover: 0.3 } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'desert', sky: 'eclipse', v: { sun: { cover: 1 } } },
  music: [['L01', 'mystery', 0.5], ['L02', 'wonder', 0.75], ['L05', 'calm', 0.6], ['L07', 'wonder', 0.85], ['L10', 'calm', 0.6]],
});
