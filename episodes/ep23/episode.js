// EP23 — Regra 20-20-20 (dica)
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

export default buildFato({
  id: 'ep23', titulo: 'Regra 20-20-20 para os olhos', lines: LINES, defaultSubject: 'mon', ctaLine: 'L12',
  title: { kicker: 'DICA', title: ['REGRA', '20-20-20'], sub: 'CUIDE DOS SEUS OLHOS' },
  fato: {
    sky: 'day', ground: 'floor', center: [0, 0, -4], seed: 8,
    props: [
      { id: 'mon', type: 'monitor', pos: [0, 0, -4], o: { w: 3, h: 1.9, text: 'REUNIÃO|RELATÓRIO|E-MAIL', fg: '#9fe0ff', bg: '#10263f', glow: 'rgba(120,180,255,1)' }, v: { glow: 0.5 } },
      { id: 'clock', type: 'clock', pos: [-8, 4.5, -4], o: { r: 1.8 }, v: { speed: 0 } },
      { id: 'eye', type: 'eye', pos: [12, 3.6, -2], s: 1.5, hide: true },
      { id: 'far', type: 'mountain', pos: [-2, 0, -70], o: { r: 22, h: 24 } },
      { id: 'far2', type: 'mountain', pos: [30, 0, -80], o: { r: 18, h: 16, color: '#7a8f7a' } },
      { id: 'tr1', type: 'tree', pos: [-12, 0, -30], o: { h: 4 } }, { id: 'tr2', type: 'tree', pos: [14, 0, -26], o: { h: 4.4 } },
      { id: 'tito', type: 'char', pos: [0, 0, 2.5], hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a', glasses: false } },
    ],
  },
  subjects: {
    mon: { at: [0, 2.0, -4], r: 2.8, az: 12, styles: ['mid', 'close', 'low', 'side'] },
    eye: { at: [12, 3.6, -2], r: 3.0, az: -10, styles: ['mid', 'close'], v: { eye: { vis: 1 } } },
    clock: { at: [-8, 4.5, -4], r: 2.2, az: 15, minY: 1.5, styles: ['mid', 'close'] },
    far: { at: [-2, 8, -70], r: 24, az: 0, minY: 2, styles: ['wide', 'mid'] },
    tito: { at: [0, 1.25, 2.5], r: 0.75, styles: ['close', 'mid', 'side'], v: { tito: { vis: 1, pose: { smile: 0.6 } } } },
    titoTired: { at: [0, 1.25, 2.5], r: 0.75, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { smile: 0, sleep: 0.35, surprise: 0.3 } } } },
    titoFar: { at: [0, 1.25, 2.5], r: 0.75, styles: ['side', 'mid', 'close'], az: 60, v: { tito: { vis: 1, pose: { smile: 0.9, lookYaw: 0.5, lookPitch: 0.1 } } } },
    desk: { at: [0, 2, -2], r: 5, az: 20, styles: ['wide', 'mid', 'high'] },
  },
  plan: {
    L01: { s: ['mon', 'titoTired', 'desk'], hud: [[0, 'tag', 'TELAS O DIA TODO', { dot: 'blue' }]] },
    L02: { s: ['titoTired', 'eye', 'mon'], v: { eye: { tired: 0.3 } }, hud: [[1, 'tag', 'OLHOS CANSADOS', { dot: 'red' }]] },
    L03: { s: ['eye', 'eye', 'titoTired'], la: { 'eye.tired': [0.3, 1] }, hud: [[0, 'tag', 'PISCAMOS MENOS', { dot: 'gold' }], [1, 'tag', 'SECA · VERMELHA · DOLORIDA', { dot: 'red', size: 38, y: 640 }]] },
    L04: { s: ['tito', 'mon', 'clock'], hud: [[0, 'stat', { text: '20-20-20', label: 'A REGRA', unit: 'POPULAR ENTRE OFTALMOLOGISTAS', color: '#7fd1ff' }]] },
    L05: { s: ['clock', 'mon', 'tito'], la: { 'clock.speed': [0, 3] }, hud: [[0, 'stat', { text: '20 MIN', label: 'A CADA', unit: 'DE TELA', color: '#7fd1ff' }]] },
    L06: { s: ['far', 'titoFar', 'far'], hud: [[0, 'stat', { text: '6 METROS', label: 'OLHE A', unit: '(20 PÉS) DE DISTÂNCIA', color: '#7fd1ff' }]] },
    L07: { s: ['titoFar', 'far', 'titoFar'], hud: [[0, 'stat', { from: 0, to: 20, label: 'POR PELO MENOS', unit: 'SEGUNDOS', t: 1.8, color: '#7fd1ff' }]] },
    L08: { s: ['eye', 'tito', 'eye'], v: { eye: { tired: 0 } }, hud: [[0, 'tag', 'PISQUE BASTANTE', { dot: 'green' }], [0, 'mark', 'ok', 800, 640, 64]] },
    L09: { s: ['tito', 'desk', 'tito'], hud: [[0, 'tag', 'PAUSAS MAIS LONGAS', { dot: 'green', sub: 'ao longo do dia' }]] },
    L10: { s: ['mon', 'tito', 'mon'], hud: [[0, 'tag', 'EVIDÊNCIA AINDA LIMITADA', { dot: 'gold', sub: 'mas é simples e sem custo', size: 40 }]] },
    L11: { s: ['eye', 'tito', 'eye'], v: { eye: { tired: 0.6 } }, hud: [[0, 'tag', 'INCÔMODO CONTINUA?', { dot: 'orange', sub: 'procure um oftalmologista', size: 40 }]] },
    L12: { s: ['tito', 'mon'] },
    L13: { s: ['tito', 'eye'], hud: [[0, 'thought', 'q', 780, 480], [-1, 'chip', 'COMENTA AÍ 💬', { delay: 0.5 }]] },
  },
  final: { s: 'desk', sky: 'dusk' },
  music: [['L01', 'calm', 0.55], ['L04', 'wonder', 0.7], ['L08', 'calm', 0.6], ['L10', 'wonder', 0.6]],
});
