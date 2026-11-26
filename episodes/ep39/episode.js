// EP39 — Receita caseira #3: gargarejo com sal
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const T = (word) => ({ line: 'L11', word, offset: 0 });
export default buildFato({
  id: 'ep39', titulo: 'Gargarejo com sal', lines: LINES, defaultSubject: 'kit',
  fato: {
    sky: 'kitchen', ground: 'wood', seed: 9, center: [0, 0, 0],
    props: [
      { id: 'wall', type: 'wall', pos: [0, 0, -10], o: { tile: '#eef3f0', grout: '#bcc8c2', windowX: -8, shelfX: 8 } },
      { id: 'glass', type: 'vessel', pos: [0, 0, 0], s: 1.9, o: { kind: 'glass', c0: '#8fd3f2', c1: '#bfe3ee' }, v: { fill: 0 } },
      { id: 'kettle', type: 'vessel', pos: [1.15, 1.2, 0], s: 1.4, o: { kind: 'kettle', c0: '#8fd3f2' }, v: { fill: 0.7, steam: 1, drop: 2.0 }, hide: true },
      { id: 'jarSal', type: 'jar', pos: [-4.8, 0, 0.8], s: 1.2, o: { text: 'SAL', fill: '#f6f6f6', lid: '#3b82d6', labelBg: '#ffffff', labelFg: '#2f6fbf' } },
      { id: 'spC', type: 'spoon', pos: [-4.8, 3.2, 1.2], s: 2.6, o: { kind: 'cha', powder: '#f4f4f4' }, v: { load: 0.5 }, hide: true },
      { id: 'faucet', type: 'faucet', pos: [8.2, 0, -2.5], s: 1.3, hide: true },
      { id: 'tito', type: 'char', pos: [6.6, 0, 3.4], ry: -0.5, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    kit: { at: [-0.8, 2.2, 0], r: 7.0, az: 6, ly: 0.6, styles: ['wide', 'mid', 'high'] },
    glass: { at: [0, 1.4, 0], r: 4.2, az: 8, ly: 0.8, styles: ['mid', 'close', 'low'] },
    glassLow: { at: [0, 1.4, 0], r: 4.4, az: 8, ly: 1.6, styles: ['mid', 'close'] },
    jarL: { at: [-4.8, 1.8, 0.8], r: 3.3, ly: 1.3, styles: ['mid', 'close'] },
    pourK: { at: [0.5, 2.5, 0], r: 5.2, ly: 1.0, styles: ['mid', 'low', 'close'], v: { kettle: { vis: 1, stream: 1 } } },
    saltDump: { at: [0.3, 3.5, 0.4], r: 4.6, ly: 1.0, styles: ['mid', 'close', 'low'], v: { spC: { vis: 1, load: 0.5, dump: 1, x: 5.4, y: 0.8 }, jarSal: { open: 1 } } },
    saltDumpW: { at: [0.3, 3.5, 0.4], r: 6.0, ly: 1.1, styles: ['mid', 'wide'], v: { spC: { vis: 1, load: 0.5, dump: 1, x: 5.4, y: 0.8 }, jarSal: { open: 1 } } },
    saltSpoon: { at: [-4.8, 3.3, 1.2], r: 2.6, ly: 0.9, styles: ['mid', 'close', 'macro'], v: { spC: { vis: 1, load: 0.5, sweep: 0 }, jarSal: { open: 1 } } },
    stir: { at: [0, 1.4, 0], r: 4.2, ly: 1.0, styles: ['mid', 'close', 'high'], v: { glass: { stir: 1 }, spC: { vis: 0 }, jarSal: { open: 0 } } },
    tito: { at: [6.6, 1.25, 3.4], r: 1.2, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { smile: 0.6 } } } },
    titoSore: { at: [6.6, 1.25, 3.4], r: 1.2, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 0.5, smile: 0, cover: 0 } } } },
    gargle: { at: [6.6, 1.35, 3.4], r: 1.2, az: -14, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { lookPitch: 0.6, surprise: 0.5, smile: 0 } } } },
    spit: { at: [7.4, 1.3, 1.0], r: 3.0, ly: 0.5, styles: ['mid', 'close'], v: { faucet: { vis: 1, flow: 0.5 }, tito: { vis: 1, pose: { lookPitch: -0.4, smile: 0 }, rx: 0.5 } } },
  },
  plan: {
    L01: { n: 4, s: ['kit', 'titoSore', 'glass', 'tito'], v: { tito: { vis: 1 } }, hud: [[0, 'kicker', { n: 3, name: 'GARGAREJO COM SAL', uses: ['DOR DE GARGANTA', 'GARGANTA ARRANHANDO', 'ALÍVIO RÁPIDO'], color: 'blue' }], [2, 'disc', { y: 1500 }]] },
    L02: { n: 3, s: ['glassLow', 'jarL', 'glassLow'], v: { tito: { vis: 0 } }, hud: [['*', 'ingr', [
      { amt: '1 COPO', name: 'Água morna', sub: 'cerca de 250 ml', line: 'L02', word: 4 },
      { amt: '½ COLHER', name: 'Sal', sub: 'de chá, rasa', line: 'L02', word: 10 }], { y: 450, color: 'blue' }]] },
    L03: { n: 3, s: ['pourK', 'pourK', 'glassLow'], la: { 'kettle.tilt': [0.62, 1.0], 'glass.fill': [0, 0.85], 'kettle.fill': [0.7, 0.4] }, hud: [[0, 'step', { n: 1, total: 4, title: 'ÁGUA MORNA', color: 'blue' }], [1, 'mark', 'no', 800, 600, 62], [1, 'tag', 'NUNCA QUENTE', { dot: 'red', size: 44, y: 700 }], [2, 'tag', 'TESTE NO PULSO', { dot: 'blue', sub: 'uma gota, sem arder', size: 44, y: 520 }]] },
    L04: { n: 3, s: ['saltSpoon', 'saltDump', 'saltDumpW'], v: { kettle: { vis: 0, stream: 0, tilt: 0 } }, hud: [[0, 'step', { n: 2, total: 4, title: 'SAL', color: 'gold' }], [0, 'qty', { amount: '½ COLHER DE CHÁ', note: 'rasa (≈ 2,5 g) — é pouco mesmo', y: 560, color: 'gold' }], [2, 'banner', 'SAL DEMAIS IRRITA', { color: '#e8453c', size: 46, y: 380 }]] },
    L05: { n: 2, s: ['stir', 'glass'], hud: [[0, 'step', { n: 3, total: 4, title: 'MEXA', color: 'green' }], [1, 'tag', 'ATÉ O SAL SUMIR', { dot: 'blue', size: 46, y: 520 }]] },
    L06: { n: 3, s: ['gargle', 'gargle', 'tito'], v: { glass: { stir: 0 }, tito: { vis: 1 } }, hud: [[0, 'step', { n: 4, total: 4, title: 'GARGAREJE', color: 'blue' }], [0, 'timer', { label: 'GARGAREJO', secs: 30, p0: 0, p1: 1, y: 600, color: 'blue' }], [1, 'pop', 'ÁÁÁ!', 540, 480, { size: 150, color: '#5EC8FF', dur: 1.2 }]] },
    L07: { n: 3, s: ['spit', 'spit', 'tito'], hud: [[0, 'pop', 'PTUI!', 540, 460, { size: 150, color: '#6BE37A', dur: 1.1 }], [1, 'mark', 'no', 800, 560, 62], [1, 'tag', 'NÃO ENGULA', { dot: 'red', size: 46, y: 680 }], [2, 'qty', { amount: '3 A 4 VEZES AO DIA', note: 'quando incomodar', y: 460, color: 'blue', size: 56 }]] },
    L08: { n: 2, s: ['titoSore', 'glass'], v: { faucet: { vis: 0 } }, hud: [[0, 'tag', 'ALIVIA O INCÔMODO', { dot: 'green', size: 44, y: 460 }], [1, 'tag', 'NÃO TRATA A CAUSA', { dot: 'orange', size: 44, y: 520 }]] },
    L09: { n: 3, s: ['titoSore', 'glass', 'titoSore'], hud: [[0, 'caution', { title: 'CUIDADO', items: ['Criança pequena que não sabe cuspir: não faça', 'Febre alta, pus na garganta ou falta de ar: médico'], y: 380 }], [2, 'disc', { y: 1500 }]] },
    L10: { n: 1, s: ['kit'], hud: [[0, 'quiz', { q: 'Depois de gargarejar, o que fazer com a água?', opts: ['Engolir', 'Cuspir', 'Beber um copo inteiro'], ans: 1, reveal: 12.1, y: 300, color: 'blue' }]], sfx: [[0, 'ding', 12.2, { level: 0.2 }]] },
    L11: { n: 1, s: ['kit'], noSubs: true, hud: [[0, 'card', { name: 'GARGAREJO COM SAL', para: 'dor e arranhado na garganta', color: 'blue',
      ingredients: ['1 copo (250 ml) de água morna', '½ colher de chá de sal'],
      steps: ['Água morna no copo, sem arder', 'Junte o sal e mexa até sumir', 'Gargareje 30 segundos', 'Cuspa! 3 a 4 vezes ao dia'], note: 'Febre alta, pus ou falta de ar: procure um médico',
      at: [T(2), T(6), T(17), T(18), T(19), T(21)], y: 270 }]] },
    L12: { n: 2, s: ['tito', 'kit'], hud: [[0, 'thought', 'q', 780, 520], [-1, 'chip', 'COMENTA AÍ', { delay: 0.5 }]] },
  },
  final: { s: 'kit', v: { glass: { fill: 0.85, mix: 1 } } },
  music: [['L01', 'wonder', 0.55], ['L03', 'calm', 0.55], ['L09', 'tension', 0.45], ['L10', 'wonder', 0.6], ['L11', 'calm', 0.6]],
});
