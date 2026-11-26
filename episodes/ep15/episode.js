// EP15 — Apolo 11 (1969)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const SUIT = { shirt: '#f2f2ee', pants: '#f2f2ee', skin: '#c68a5c', gear: 'helmet' };
export default buildFato({
  id: 'ep15', titulo: 'Apolo 11: a Lua, 1969', lines: LINES, defaultSubject: 'lander', ctaLine: 'L12',
  title: { kicker: 'FATO REAL', title: ['APOLO 11'], sub: '20 DE JULHO DE 1969' },
  fato: {
    sky: 'space', ground: 'moon', seed: 6, center: [0, 0, 0],
    props: [
      { id: 'pad', type: 'disc', pos: [70, 0, -50], o: { r: 40, color: '#6fae55' }, v: { vis: 1 } },
      { id: 'saturn', type: 'saturn', pos: [70, 0, -50], s: 1.1 },
      { id: 'earth', type: 'planet', pos: [-22, 20, -75], o: { kind: 'earth', r: 10, atmo: '#5fb0ff' } },
      { id: 'lander', type: 'lander', pos: [0, 0, 0], s: 1.2 },
      { id: 'flag', type: 'flag', pos: [5, 0, 2.5] },
      { id: 'tito', type: 'char', pos: [-3.2, 0, 3.4], ry: 0.5, o: SUIT, hide: true },
      { id: 'buzz', type: 'char', pos: [3.0, 0, 5.2], ry: -0.6, o: { ...SUIT, skin: '#d9a07a' }, hide: true },
      { id: 'r1', type: 'rock', pos: [-6, 0, 0], o: { r: 0.7 } }, { id: 'r2', type: 'rock', pos: [7, 0, -3], o: { r: 1.0 } }, { id: 'r3', type: 'rock', pos: [-2, 0, 8], o: { r: 0.5 } }, { id: 'r4', type: 'rock', pos: [10, 0, 6], o: { r: 0.8 } },
    ],
  },
  subjects: {
    lander: { at: [0, 2.8, 0], r: 3.6, az: 25, styles: ['wide', 'mid', 'low', 'side'] },
    earth: { at: [-22, 20, -75], r: 11, az: 0, minY: 15, styles: ['mid', 'wide', 'close'] },
    rocket: { at: [70, 13, -50], r: 12, az: 20, minY: 1, styles: ['mid', 'low', 'wide', 'close'] },
    rocketBase: { at: [70, 3, -50], r: 5, az: 15, minY: 1, styles: ['mid', 'low', 'close'] },
    flag: { at: [5, 2.4, 2.5], r: 2.2, az: -20, styles: ['mid', 'low', 'close'] },
    tito: { at: [-3.2, 1.3, 3.4], r: 0.8, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8 } } } },
    step: { at: [-3.2, 0.8, 3.4], r: 1.4, az: 50, styles: ['mid', 'low', 'side'], v: { tito: { vis: 1, pose: { walk: 1, smile: 0.8 } } } },
    duo: { at: [0, 1.4, 4.2], r: 3.4, az: 10, styles: ['wide', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8 } }, buzz: { vis: 1, pose: { smile: 0.8 } } } },
    rocks: { at: [-2, 0.5, 8], r: 1.6, az: 0, styles: ['close', 'mid', 'macro'] },
  },
  plan: {
    L01: { s: ['lander', 'duo', 'earth'] },
    L02: { s: ['rocket', 'rocketBase', 'rocket'], sky: ['space', 'day', 0, 1], hud: [[0, 'tag', 'APOLO 11', { dot: 'gold', sub: 'missão à Lua' }]], la: { 'saturn.thrust': [0, 1], 'saturn.y': [0, 4] }, sfx: [[1, 'braam', 0.0, { dur: 2.5, level: 0.4 }]] },
    L03: { s: ['rocket', 'tito', 'duo'], sky: 'day', la: { 'saturn.thrust': [1, 1], 'saturn.y': [4, 40] }, hud: [[0, 'chip', 'ARMSTRONG · ALDRIN · COLLINS', { border: 'gold', y: 330 }]] },
    L04: { s: ['earth', 'lander', 'earth'], sky: 'space', v: { saturn: { vis: 0 } }, hud: [[1, 'tag', 'MÓDULO LUNAR "EAGLE"', { dot: 'gold', sub: 'Collins ficou em órbita' }]] },
    L05: { s: ['lander', 'rocks', 'lander'], la: { 'lander.y': [14, 0] }, hud: [[0, 'tag', 'MAR DA TRANQUILIDADE', { dot: 'blue', sub: 'região da Lua' }], [2, 'mark', 'ok', 800, 640, 64]] },
    L06: { s: ['step', 'tito', 'flag', 'step'], hud: [[1, 'pop', 'UM PEQUENO PASSO', 540, 560, { size: 120, color: '#FFC83D', dur: 1.4 }], [3, 'pop', 'SALTO GIGANTE', 540, 560, { size: 130, color: '#FFC83D', dur: 1.4 }]] },
    L07: { s: ['duo', 'tito', 'duo'], hud: [[0, 'stat', { from: 0, to: 151, label: 'CAMINHADA NA LUA', unit: 'MINUTOS (≈ 2H30)', t: 1.8 }]] },
    L08: { s: ['rocks', 'flag', 'duo'], hud: [[0, 'tag', 'PEDRAS LUNARES', { dot: 'orange', sub: 'amostras para a Terra' }], [1, 'tag', 'BANDEIRA', { dot: 'red' }]] },
    L09: { s: ['lander', 'earth', 'earth'], la: { 'lander.y': [0, 0] }, hud: [[1, 'stat', { from: 0, to: 8, label: 'DURAÇÃO DA MISSÃO', unit: 'DIAS (APROX.)', t: 1.0 }]] },
    L10: { s: ['earth', 'step', 'earth'], hud: [[1, 'banner', 'PRIMEIRA VEZ EM OUTRO MUNDO', { color: '#2a7de1', size: 44 }]] },
    L11: { s: ['duo', 'flag', 'tito'], hud: [[0, 'stat', { from: 0, to: 12, label: 'PESSOAS NA LUA', unit: '1969 — 1972', t: 1.2 }]] },
    L12: { s: ['tito', 'earth'] },
    L13: { s: ['tito', 'duo'], hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'earth', sky: 'space' },
  music: [['L01', 'mystery', 0.5], ['L02', 'action', 0.8], ['L04', 'wonder', 0.7], ['L06', 'wonder', 0.85], ['L10', 'calm', 0.65]],
});
