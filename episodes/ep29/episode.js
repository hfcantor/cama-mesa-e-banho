// EP29 — Cometa Halley, 2061 (futuro)
import { buildFato, upCam } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const SKYC = [26, 28, -62];
const SP = 300; // região "espaço" (acima do chão, que fica oculto nessas falas)
export default buildFato({
  id: 'ep29', titulo: 'O cometa Halley volta em 2061', lines: LINES, defaultSubject: 'sky', ctaLine: 'L11',
  title: { kicker: 'O QUE VAI ACONTECER', title: ['HALLEY', 'EM 2061'], sub: '28 DE JULHO DE 2061' },
  fato: {
    sky: 'night', ground: 'grass', center: [0, 0, -20], seed: 5,
    props: [
      { id: 'cometSky', type: 'comet', pos: SKYC, s: 1.8, o: { r: 0.7 } },
      { id: 'h1', type: 'mountain', pos: [-24, 0, -55], o: { r: 14, h: 8, color: '#35523f' } }, { id: 'h2', type: 'mountain', pos: [16, 0, -70], o: { r: 18, h: 9, color: '#2f4a3a' } },
      { id: 'tr1', type: 'tree', pos: [-10, 0, -10], o: { h: 4, leaf: '#2e6a3a' } }, { id: 'tr2', type: 'tree', pos: [12, 0, -14], o: { h: 4.5, leaf: '#2e6a3a' } },
      { id: 'sunS', type: 'sun', pos: [-36, SP, -45], o: { r: 7 } },
      { id: 'earthS', type: 'planet', pos: [-6, SP - 4, -38], o: { kind: 'earth', r: 3.6, atmo: '#5fb0ff' } },
      { id: 'cometS', type: 'comet', pos: [8, SP + 4, -38], ry: Math.PI, s: 1.5, o: { r: 0.7 } },
      { id: 'tito', type: 'char', pos: [0, 0, 5], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a', gear: 'beard', glasses: true, hair: '#d8d8d8' } },
      { id: 'kid', type: 'char', pos: [-2.5, 0, 5.5], ry: 0.3, hide: true, s: 0.7, o: { shirt: '#e8453c', pants: '#3a4a8a', scale: 0.7 } },
    ],
  },
  subjects: {
    sky: { at: SKYC, r: 12, cam: upCam([0, 1.6, 8], SKYC, { fov: 36 }) },
    hills: { at: [0, 5, -50], r: 22, az: 0, styles: ['wide', 'mid'] },
    tito: { at: [0, 1.3, 5], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.8 } } } },
    titoLook: { at: [0, 1.3, 5], r: 0.75, az: 55, styles: ['side', 'mid', 'close'], v: { tito: { vis: 1, pose: { smile: 1, lookPitch: -0.5 } } } },
    duo: { at: [-1, 1.3, 5], r: 2.2, az: 40, styles: ['mid', 'wide', 'side'], v: { tito: { vis: 1, pose: { smile: 1, lookPitch: -0.5 } }, kid: { vis: 1, pose: { smile: 1, lookPitch: -0.5 } } } },
    orbit: { at: [-12, SP, -42], r: 16, az: 0, minY: SP - 2, styles: ['wide', 'mid', 'high'] },
    sunS: { at: [-36, SP, -45], r: 13, az: 0, minY: SP - 3, styles: ['mid', 'wide'] },
    cometS: { at: [8, SP + 4, -38], r: 3.0, az: 20, minY: SP, styles: ['mid', 'close', 'side', 'macro'] },
    earthS: { at: [-6, SP - 4, -38], r: 4.5, az: 0, minY: SP - 8, styles: ['mid', 'close'] },
  },
  plan: {
    L01: { s: ['sky', 'hills', 'sky', 'titoLook'], hud: [[0, 'tag', 'COMETA HALLEY', { dot: 'gold', sub: 'volta em 2061' }]] },
    L02: { s: ['orbit', 'cometS', 'orbit'], sky: 'space', st: { ground: 0 }, la: { 'cometS.x': [-8, 16] }, hud: [[0, 'stat', { text: '~76 ANOS', label: 'PASSA PERTO DO SOL A CADA', unit: 'MAIS OU MENOS', color: '#9fd8ff' }]] },
    L03: { s: ['orbit', 'sunS', 'cometS'], sky: 'space', st: { ground: 0 }, la: { 'cometS.x': [16, 4] }, hud: [[0, 'stat', { text: '1986', label: 'A ÚLTIMA VEZ', unit: 'PERTO DO SOL', color: '#9fd8ff' }]] },
    L04: { s: ['cometS', 'sunS', 'orbit'], sky: 'space', st: { ground: 0 }, la: { 'cometS.x': [4, -22] }, hud: [[0, 'stat', { text: '28/07/2061', label: 'PRÓXIMA PASSAGEM PREVISTA', unit: 'MAIS PERTO DO SOL', scale: 0.85, color: '#9fd8ff' }]] },
    L05: { s: ['tito', 'orbit', 'tito'], sky: 'night', st: { ground: 1 }, v: { tito: { vis: 1 } }, hud: [[0, 'tag', 'EDMOND HALLEY', { dot: 'gold', sub: 'astrônomo' }], [1, 'tag', 'ERA O MESMO COMETA', { dot: 'green' }]] },
    L06: { s: ['tito', 'sky', 'tito'], sky: 'night', hud: [[0, 'tag', 'PREVISÃO: 1758', { dot: 'gold' }], [1, 'banner', 'MORREU ANTES DE VER', { color: '#6b4a8a', size: 40 }]] },
    L07: { s: ['cometS', 'cometS', 'earthS'], sky: 'space', st: { ground: 0 }, v: { cometS: { x: -4 } }, hud: [[0, 'stat', { text: '15 KM', label: 'NÚCLEO DE GELO E POEIRA', unit: 'DE COMPRIMENTO (APROX.)', color: '#9fd8ff' }]] },
    L08: { s: ['sunS', 'cometS', 'orbit'], sky: 'space', st: { ground: 0 }, v: { cometS: { x: -18 } }, hud: [[0, 'tag', 'O GELO ESQUENTA', { dot: 'orange' }], [1, 'tag', 'CAUDA BRILHANTE', { dot: 'gold' }]] },
    L09: { s: ['sky', 'duo', 'sky'], sky: 'night', st: { ground: 1 }, hud: [[0, 'tag', '2061 > 1986', { dot: 'green', sub: 'condições melhores' }], [1, 'mark', 'ok', 800, 640, 64]] },
    L10: { s: ['duo', 'tito', 'duo'], sky: 'night', hud: [[0, 'thought', 'q', 780, 480], [1, 'stat', { text: '2061', label: 'QUANTOS ANOS VOCÊ VAI TER EM', unit: '?', color: '#9fd8ff', y: 400 }]] },
    L11: { s: ['tito', 'sky'], sky: 'night' },
    L12: { s: ['tito', 'sky'], sky: 'night', hud: [[0, 'thought', 'heart', 800, 520], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'hills', sky: 'night' },
  music: [['L01', 'mystery', 0.5], ['L02', 'wonder', 0.7], ['L05', 'calm', 0.6], ['L07', 'wonder', 0.8], ['L10', 'calm', 0.65]],
});
