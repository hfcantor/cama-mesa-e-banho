// EP25 — Escovar os dentes (dica)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const GS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'];
const GP = [[-3.2, 1.4, -1.5], [3.0, 1.0, -1.0], [-2.4, 4.4, -2.2], [2.8, 3.8, -1.8], [-3.6, 2.8, 0.3], [3.6, 2.4, 0.5], [0.2, 5.2, -1.5]];
const VG = (k, val) => Object.fromEntries(GS.map(id => [id, { [k]: val }]));
export default buildFato({
  id: 'ep25', titulo: 'Escovar os dentes do jeito certo', lines: LINES, defaultSubject: 'tooth', ctaLine: 'L11',
  title: { kicker: 'DICA', title: ['ESCOVAR', 'OS DENTES'], sub: 'DO JEITO CERTO' },
  fato: {
    sky: 'lab', ground: 'floor', center: [0, 0, -3], seed: 6,
    props: [
      { id: 'tooth', type: 'tooth', pos: [0, 2.6, -3], s: 1.7 },
      ...GS.map((id, i) => ({ id, type: 'germ', pos: [GP[i][0], GP[i][1] + 2.4, GP[i][2] - 3], s: 1.3, o: { r: 0.6, color: i % 2 ? '#7bd35a' : '#c45ad3' } })),
      { id: 'brush', type: 'brush', pos: [6, 2.2, -1], ry: -0.4, s: 1.4, hide: true },
      { id: 'tito', type: 'char', pos: [0, 0, 4], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    tooth: { at: [0, 4.4, -3], r: 3.2, az: 12, styles: ['mid', 'close', 'wide', 'low', 'side'] },
    toothClose: { at: [0.2, 4.6, -3], r: 3.6, az: 8, styles: ['mid', 'close'] },
    germs: { at: [0, 5.2, -4], r: 5.5, az: 10, styles: ['wide', 'mid', 'high'] },
    brush: { at: [6, 2.2, -1], r: 2.6, az: -15, styles: ['mid', 'close', 'side', 'low'], v: { brush: { vis: 1 } } },
    tito: { at: [0, 1.25, 4], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 1 } } } },
  },
  plan: {
    L01: { s: ['tooth', 'tito', 'brush'], v: { tooth: { shine: 0.5 }, ...VG('vis', 0) } },
    L02: { s: ['germs', 'tooth', 'germs'], v: { ...VG('vis', 1) }, hud: [[0, 'tag', 'MUITAS BACTÉRIAS', { dot: 'green', sub: 'vivem na boca' }]] },
    L03: { s: ['tooth', 'toothClose', 'germs'], v: { ...VG('vis', 1) }, la: { 'tooth.decay': [0, 0.35] }, hud: [[0, 'tag', 'PLACA BACTERIANA', { dot: 'orange' }]] },
    L04: { s: ['toothClose', 'tooth', 'germs', 'toothClose'], v: { ...VG('vis', 1) }, la: { 'tooth.decay': [0.35, 1] }, hud: [[0, 'tag', 'AÇÚCAR VIRA ÁCIDO', { dot: 'red' }], [2, 'tag', 'CÁRIE', { dot: 'red', size: 56 }], [2, 'mark', 'no', 800, 700, 64]] },
    L05: { s: ['brush', 'tooth', 'brush', 'tito'], v: { ...VG('vis', 0), tooth: { decay: 0.2 } }, la: { 'brush.x': [0, -5.8], 'tooth.shine': [0, 1] }, hud: [[0, 'stat', { text: '2 × 2', label: 'ESCOVE 2 VEZES AO DIA', unit: 'POR 2 MINUTOS', color: '#7fd1ff' }]] },
    L06: { s: ['brush', 'tooth', 'brush'], v: { ...VG('vis', 0), brush: { x: -5.8 }, tooth: { decay: 0, shine: 1 } }, hud: [[0, 'tag', 'CREME DENTAL COM FLÚOR', { dot: 'green', size: 40 }], [1, 'mark', 'ok', 800, 640, 64]] },
    L07: { s: ['tooth', 'toothClose', 'tooth'], v: { ...VG('vis', 0), tooth: { decay: 0, shine: 1 } }, hud: [[0, 'tag', 'FIO DENTAL', { dot: 'green', sub: '1 vez por dia' }]] },
    L08: { s: ['brush', 'brush', 'tito'], v: { ...VG('vis', 0), brush: { x: 0 }, tooth: { decay: 0, shine: 1 } }, hud: [[0, 'stat', { text: '3-4 MESES', label: 'TROQUE A ESCOVA A CADA', unit: 'OU ANTES, SE ESTIVER GASTA', color: '#7fd1ff' }]] },
    L09: { s: ['tito', 'toothClose', 'tito'], v: { ...VG('vis', 0), tooth: { decay: 0, shine: 0.6 } }, hud: [[0, 'tag', 'FORÇA DEMAIS', { dot: 'red', sub: 'só machuca a gengiva' }], [0, 'mark', 'no', 800, 660, 64]] },
    L10: { s: ['tito', 'tooth', 'tito'], v: { ...VG('vis', 0), tooth: { decay: 0, shine: 1 } }, hud: [[0, 'tag', 'VISITAS AO DENTISTA', { dot: 'green', sub: 'achar problemas cedo' }], [0, 'mark', 'ok', 800, 640, 64]] },
    L11: { s: ['tito', 'tooth'], v: { ...VG('vis', 0), tooth: { decay: 0, shine: 1 } } },
    L12: { s: ['tito', 'tooth'], v: { ...VG('vis', 0), tooth: { decay: 0, shine: 1 } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'tooth', sky: 'lab', v: { tooth: { shine: 1 } } },
  music: [['L01', 'calm', 0.6], ['L02', 'mystery', 0.6], ['L04', 'tension', 0.65], ['L05', 'wonder', 0.7], ['L09', 'calm', 0.6]],
});
