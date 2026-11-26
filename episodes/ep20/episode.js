// EP20 — Hindenburg (1937)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep20', titulo: 'Hindenburg, 1937', lines: LINES, defaultSubject: 'zep', ctaLine: 'L12',
  title: { kicker: 'FATO REAL', title: ['HINDENBURG'], sub: '6 DE MAIO DE 1937' },
  fato: {
    sky: 'dusk', ground: 'grass', center: [0, 8, -8], seed: 3,
    props: [
      { id: 'zeppelin', type: 'zeppelin', pos: [-4, 12, -12] },
      { id: 'mast', type: 'mast', pos: [22, 0, -10], o: { h: 15 } },
      { id: 'hangar', type: 'box', pos: [-30, 0, -40], o: { w: 34, h: 16, d: 24, color: '#8a8f98' } },
      { id: 'flames', type: 'flames', pos: [10, 0, -10], o: { w: 3, d: 2, s: 2.4, n: 140 }, v: { amt: 0 }, hide: true },
      { id: 'tito', type: 'char', pos: [-6, 0, 6], ry: 0.4, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    zep: { at: [-4, 12, -12], r: 10, az: 25, minY: 1.5, styles: ['wide', 'mid', 'low', 'side'] },
    tail: { at: [-12, 12, -12], r: 4.5, az: 35, minY: 2, styles: ['mid', 'close', 'low'] },
    nose: { at: [5, 12, -12], r: 4.5, az: -30, minY: 2, styles: ['mid', 'close', 'low'] },
    mast: { at: [22, 8, -10], r: 8, az: -20, minY: 1, styles: ['mid', 'low', 'wide'] },
    ground: { at: [8, 3, -10], r: 8, az: 10, minY: 1, styles: ['wide', 'mid', 'low'], v: { flames: { vis: 1 } } },
    tito: { at: [-6, 1.25, 6], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.4 } } } },
    titoScared: { at: [-6, 1.25, 6], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 1, surprise: 0.7, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['zep', 'nose', 'zep'] },
    L02: { s: ['zep', 'nose', 'tito', 'zep'], hud: [[0, 'tag', 'HINDENBURG', { dot: 'gold', sub: 'dirigível alemão' }], [2, 'stat', { text: '+200 M', label: 'COMPRIMENTO', unit: 'MAIS QUE DOIS CAMPOS DE FUTEBOL', scale: 0.8 }]] },
    L03: { s: ['zep', 'tail', 'zep'], hud: [[0, 'tag', 'EUROPA ↔ AMÉRICA', { dot: 'blue', sub: 'viagens de luxo' }]] },
    L04: { s: ['zep', 'tito', 'tail'], hud: [[0, 'tag', 'HIDROGÊNIO', { dot: 'orange', sub: 'pega fogo com facilidade' }], [1, 'thought', '!', 800, 520]] },
    L05: { s: ['mast', 'zep', 'ground'], la: { 'zeppelin.x': [-30, 0] }, hud: [[0, 'tag', 'LAKEHURST · EUA', { dot: 'gold' }]] },
    L06: { s: ['tail', 'zep', 'tail'], v: { zeppelin: { x: 0 } }, la: { 'zeppelin.fire': [0.05, 0.6] }, hud: [[0, 'pop', 'FOGO!', 540, 520, { size: 190, color: '#FF7A3D' }]], sfx: [[0, 'impact', 0.15, { level: 0.7 }]] },
    L07: { s: ['zep', 'tail', 'ground', 'zep'], v: { zeppelin: { x: 0 } }, la: { 'zeppelin.fire': [0.6, 1], 'zeppelin.tilt': [0, 0.45], 'zeppelin.y': [0, -9] }, st: { embers: 0.8 }, shake: 0.04, hud: [[0, 'badge', 'MENOS DE 1 MINUTO', 'slow'], [2, 'flashc', 0.4, '#ffb060']], sfx: [[0, 'impact', 0.1, { level: 0.9, size: 1.3 }]] },
    L08: { s: ['ground', 'titoScared', 'ground'], sky: ['dusk', 'fire', 0, 1], v: { zeppelin: { x: 0, fire: 1, tilt: 0.45, y: -9 }, flames: { amt: 1 } }, st: { embers: 0.6 }, hud: [[0, 'stat', { from: 0, to: 36, label: 'MORTES (AO TODO)', unit: 'PESSOAS', danger: 1, t: 1.2 }]] },
    L09: { s: ['tito', 'ground', 'tito'], sky: 'fire', v: { zeppelin: { x: 0, fire: 1, tilt: 0.5, y: -10 }, flames: { amt: 0.8 } }, hud: [[0, 'stat', { text: '62', label: 'SOBREVIVENTES', unit: 'DOS 97 A BORDO' }], [1, 'mark', 'ok', 800, 640, 64]] },
    L10: { s: ['tito', 'ground', 'tito'], sky: ['fire', 'gray', 0, 1], v: { zeppelin: { x: 0, fire: 0.6, tilt: 0.5, y: -10 }, flames: { amt: 0.5 } }, hud: [[0, 'tag', 'IMAGENS E RÁDIO', { dot: 'blue', sub: 'chocaram o mundo' }]] },
    L11: { s: ['mast', 'tito', 'mast'], sky: 'gray', v: { zeppelin: { vis: 0 }, flames: { vis: 0 } }, hud: [[0, 'banner', 'FIM DOS DIRIGÍVEIS DE PASSAGEIROS', { color: '#4a5a7a', size: 36 }]] },
    L12: { s: ['tito', 'mast'], sky: 'dusk', v: { zeppelin: { vis: 0 } } },
    L13: { s: ['tito', 'mast'], sky: 'dusk', v: { zeppelin: { vis: 0 } }, hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'mast', sky: 'dusk', v: { zeppelin: { vis: 0 } } },
  music: [['L01', 'mystery', 0.5], ['L04', 'tension', 0.75], ['L06', 'action', 0.95], ['L09', 'calm', 0.6], ['L11', 'wonder', 0.55]],
});
