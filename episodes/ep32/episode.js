// EP32 — Cleópatra, a Grande Pirâmide e a Lua
import { buildFato, upCam } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const MOON = [12, 26, -60];
const SG = (text, bg, x) => ({ type: 'sign', pos: [x, 0, -24], o: { text, bg, fg: '#fff', w: 6.4, h: 1.7, pole: 2.2 } });
export default buildFato({
  id: 'ep32', titulo: 'Cleópatra, a Pirâmide e a Lua', lines: LINES, defaultSubject: 'line', ctaLine: 'L09',
  title: { kicker: 'VOCÊ SABIA?', title: ['CLEÓPATRA', 'E A LUA'], sub: 'A CONTA QUE ASSUSTA' },
  fato: {
    sky: 'day', ground: 'sand', seed: 9, center: [0, 0, -30],
    props: [
      { id: 'pyr1', type: 'pyramid', pos: [-14, 0, -40], s: 2.2 }, { id: 'pyr2', type: 'pyramid', pos: [-30, 0, -56], s: 1.7 }, { id: 'pyr3', type: 'pyramid', pos: [8, 0, -70], s: 2 },
      { id: 'moon', type: 'planet', pos: MOON, o: { kind: 'moon', r: 9 }, v: { spin: 0.02 } },
      { id: 'sP', ...SG('PIRÂMIDE · 2560 a.C.', '#a8741e', -8), hide: true },
      { id: 'sC', ...SG('CLEÓPATRA · 30 a.C.', '#7a2a8a', 0), hide: true },
      { id: 'sM', ...SG('LUA · 1969', '#2a5fa8', 8), hide: true },
      { id: 'p1', type: 'tree', pos: [-8, 0, -8], o: { kind: 'palm', h: 5 } }, { id: 'p2', type: 'tree', pos: [11, 0, -12], o: { kind: 'palm', h: 5.5 } },
      { id: 'tito', type: 'char', pos: [0, 0, 5], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    line: { at: [0, 4, -24], r: 8.5, az: 0, styles: ['wide', 'mid', 'wide'] },
    desert: { at: [-8, 5, -40], r: 24, az: 12, styles: ['wide', 'mid', 'side'] },
    pyr: { at: [-14, 4, -40], r: 17, az: 14, styles: ['wide', 'mid', 'low'] },
    sP: { at: [-8, 3, -24], r: 7.5, styles: ['mid', 'wide'] },
    sC: { at: [0, 3, -24], r: 7.5, styles: ['mid', 'wide'] },
    sM: { at: [8, 3, -24], r: 7.5, styles: ['mid', 'wide'] },
    moon: { at: MOON, r: 10, cam: upCam([0, 1.6, 8], MOON, { fov: 40 }) },
    tito: { at: [0, 1.25, 5], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8 } } } },
    titoWow: { at: [0, 1.25, 5], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { surprise: 1, smile: 0 } } } },
  },
  plan: {
    L01: { s: ['pyr', 'moon', 'line'], hud: [[1, 'tag', 'QUEM ESTÁ MAIS PERTO?', { dot: 'gold', size: 40 }]] },
    L02: { s: ['titoWow', 'line'], hud: [[0, 'thought', 'q', 780, 480]] },
    L03: { s: ['pyr', 'sP', 'pyr'], v: { sP: { vis: 1 } }, hud: [[0, 'stat', { text: '2560 a.C.', label: 'GRANDE PIRÂMIDE DE GIZÉ', unit: 'HÁ MAIS DE 4.500 ANOS', scale: 0.9, color: '#ffd45a' }]] },
    L04: { s: ['sC', 'line', 'sC'], v: { sC: { vis: 1 } }, hud: [[0, 'stat', { text: '≈ 2.500 ANOS', label: 'PIRÂMIDE → CLEÓPATRA', unit: 'ELA MORREU EM 30 a.C.', scale: 0.8, color: '#e9a6ff' }]] },
    L05: { s: ['moon', 'sM', 'moon'], v: { sM: { vis: 1 } }, hud: [[0, 'stat', { text: '1969', label: 'PRIMEIRO POUSO NA LUA', unit: 'APOLO 11', color: '#9ad0ff' }]] },
    L06: { s: ['line', 'sC', 'sM'], hud: [[0, 'stat', { text: '≈ 2.000 ANOS', label: 'CLEÓPATRA → LUA', unit: 'MAIS PERTO!', scale: 0.8, color: '#9ad0ff' }]] },
    L07: { s: ['pyr', 'line', 'sC', 'tito'], hud: [[0, 'banner', 'JÁ ERA ANTIGA ATÉ PARA ELA', { color: '#7a2a8a', size: 42 }]] },
    L08: { s: ['desert', 'titoWow', 'line'], sky: ['day', 'dusk', 0, 0.9] },
    L09: { s: ['tito', 'desert'], sky: 'dusk' },
    L10: { s: ['tito', 'moon'], sky: 'dusk', hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'line', sky: 'dusk', v: { sP: { vis: 1 }, sC: { vis: 1 }, sM: { vis: 1 } } },
  music: [['L01', 'mystery', 0.55], ['L03', 'wonder', 0.7], ['L06', 'wonder', 0.85], ['L08', 'calm', 0.6]],
});
