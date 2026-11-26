// EP46 — Receita caseira #10: banho de aveia
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const T = (word) => ({ line: 'L12', word, offset: 0 });
export default buildFato({
  id: 'ep46', titulo: 'Banho de aveia', lines: LINES, defaultSubject: 'kit',
  fato: {
    sky: 'bath', ground: 'wood', seed: 16, center: [0, 0, 0],
    props: [
      { id: 'wall', type: 'wall', pos: [0, 0, -10], o: { tile: '#bfe2e6', grout: '#8fb8c0', windowX: 0, shelfX: -9 } },
      { id: 'jarO', type: 'jar', pos: [-7.6, 0, 0.8], s: 1.2, o: { text: 'AVEIA', sub: 'EM FLOCOS', fill: '#e3cc98', lid: '#8a5a38', labelBg: '#fff6e4', labelFg: '#7a4a14' } },
      { id: 'blend', type: 'blender', pos: [-4.0, 0, 0], s: 1.4 },
      { id: 'glass', type: 'vessel', pos: [-0.4, 0, 1.6], s: 1.4, o: { kind: 'glass', c0: '#bfe3ee', c1: '#f3eee2' }, v: { fill: 0.8 }, hide: true },
      { id: 'tub', type: 'tub', pos: [5.6, 0, -1.4], s: 1.0, v: { level: 0.1, milk: 0, steam: 0 } },
      { id: 'spO', type: 'spoon', pos: [5.6, 4.6, 0.2], s: 2.3, o: { kind: 'sopa', powder: '#f3e9d2' }, hide: true },
      { id: 'tito', type: 'char', pos: [5.6, 0.95, -1.4], ry: 0, hide: true, o: { shirt: '#f2c230', pants: '#3a4a8a' } },
      { id: 'titoS', type: 'char', pos: [8.0, 0, 3.6], ry: -0.5, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    kit: { at: [0.2, 2.4, 0], r: 9.0, az: 6, ly: 0.6, styles: ['wide', 'mid', 'high'] },
    jarL: { at: [-7.6, 1.8, 0.8], r: 3.6, ly: 1.2, styles: ['mid', 'close'] },
    blendL: { at: [-4.0, 2.4, 0], r: 5.0, ly: 1.2, styles: ['mid', 'close', 'low'] },
    blendFill: { at: [-4.0, 2.4, 0], r: 5.0, ly: 1.0, styles: ['mid', 'close', 'low'], v: { jarO: { open: 1 }, blend: { fill: 0.5 } } },
    blendSpin: { at: [-4.0, 2.6, 0], r: 4.6, ly: 1.0, styles: ['mid', 'close', 'macro'], v: { blend: { fill: 0.5, spin: 1 } }, },
    glassL: { at: [-0.4, 1.2, 1.6], r: 3.6, ly: 1.1, styles: ['mid', 'close'], v: { glass: { vis: 1 } } },
    tubL: { at: [5.6, 1.6, -1.4], r: 7.0, ly: 1.0, styles: ['high', 'wide', 'mid'] },
    tubFill: { at: [5.6, 1.6, -1.4], r: 6.4, ly: 1.0, styles: ['high', 'top', 'mid'], v: { tub: { steam: 0.6 } } },
    tubPour: { at: [5.6, 2.8, -0.2], r: 6.2, ly: 1.0, styles: ['high', 'top', 'mid'], v: { spO: { vis: 1, load: 1, dump: 1 }, tub: { steam: 0.5 } } },
    tubSoak: { at: [5.6, 2.0, -1.4], r: 3.6, ly: 0.8, styles: ['high', 'top', 'mid'], v: { tub: { level: 0.75, milk: 1, steam: 0.6, foam: 0.4 }, tito: { vis: 1, pose: { smile: 1 } } } },
    tito: { at: [8.0, 1.25, 3.6], r: 1.3, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { titoS: { vis: 1, pose: { smile: 0.6 } } } },
    titoItch: { at: [8.0, 1.25, 3.6], r: 1.3, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { titoS: { vis: 1, pose: { scared: 0.5, smile: 0, shake: 0.4 } } } },
  },
  plan: {
    L01: { n: 4, s: ['kit', 'titoItch', 'jarL', 'tubL'], hud: [[0, 'kicker', { n: 10, name: 'BANHO DE AVEIA', uses: ['COCEIRA NA PELE', 'PELE RESSECADA', 'BROTOEJA E IRRITAÇÃO LEVE'], color: 'gold' }], [1, 'pop', 'COÇA!', 540, 520, { size: 160, color: '#FF8A3D', dur: 1.1 }]] },
    L02: { n: 3, s: ['jarL', 'blendL', 'tubL'], v: { titoS: { vis: 0 } }, hud: [['*', 'ingr', [
      { amt: '1 XÍCARA', name: 'Aveia em flocos', sub: 'a de chá, seca', line: 'L02', word: 4 },
      { amt: '1', name: 'Liquidificador', sub: 'para virar pó fino', line: 'L02', word: 10 },
      { amt: '1 BANHEIRA', name: 'Água morna', sub: 'nunca quente', line: 'L02', word: 13 }], { y: 450, color: 'gold' }]] },
    L03: { n: 3, s: ['blendFill', 'blendSpin', 'blendSpin'], la: { 'blend.grind': [0, 1] }, hud: [[0, 'step', { n: 1, total: 4, title: 'BATA A AVEIA', color: 'gold' }], [2, 'tag', 'PÓ BEM FINO', { dot: 'gold', size: 46, y: 480 }]] },
    L04: { n: 2, s: ['glassL', 'glassL'], v: { blend: { spin: 0, grind: 1, fill: 0.5 }, jarO: { open: 0 } }, la: { 'glass.mix': [0, 1] }, hud: [[0, 'tag', 'TESTE', { dot: 'gold', sub: '1 colher do pó em 1 copo de água', size: 42, y: 460 }], [1, 'tag', 'ÁGUA LEITOSA = PRONTO', { dot: 'green', size: 44, y: 520 }]] },
    L05: { n: 3, s: ['tubFill', 'tubFill', 'tubL'], v: { glass: { vis: 0 } }, la: { 'tub.level': [0.1, 0.7] }, hud: [[0, 'step', { n: 2, total: 4, title: 'ÁGUA MORNA', color: 'orange' }], [1, 'mark', 'no', 800, 600, 60], [1, 'tag', 'NÃO QUENTE: PIORA A COCEIRA', { dot: 'red', size: 38, y: 700 }]] },
    L06: { n: 3, s: ['tubPour', 'tubPour', 'tubL'], la: { 'tub.milk': [0, 1] }, v: { tub: { level: 0.7 } }, hud: [[0, 'step', { n: 3, total: 4, title: 'PÓ NA ÁGUA', color: 'gold' }], [1, 'tag', 'AOS POUCOS, MEXENDO', { dot: 'gold', size: 44, y: 480 }]] },
    L07: { n: 3, s: ['tubSoak', 'tubSoak', 'tubSoak'], v: { spO: { vis: 0 }, tub: { milk: 1 } }, hud: [[0, 'step', { n: 4, total: 4, title: 'DE MOLHO', color: 'blue' }], [0, 'timer', { label: 'DE MOLHO', secs: 900, p0: 0, p1: 1, y: 600, color: 'blue' }], [2, 'qty', { amount: '10 A 15 MINUTOS', note: 'água morna', y: 470, color: 'blue' }]] },
    L08: { n: 2, s: ['tubSoak', 'tito'], hud: [[0, 'tag', 'SEQUE SEM ESFREGAR', { dot: 'gold', sub: 'batidinhas de toalha', size: 42, y: 460 }], [1, 'tag', 'HIDRATANTE NEUTRO', { dot: 'green', size: 46, y: 520 }]] },
    L09: { n: 3, s: ['titoItch', 'tubL', 'titoItch'], v: { titoS: { vis: 1 } }, hud: [[0, 'caution', { title: 'CUIDADO', items: ['O fundo da banheira fica escorregadio', 'Criança sempre com um adulto'], y: 380 }]] },
    L10: { n: 2, s: ['titoItch', 'tito'], hud: [[0, 'caution', { title: 'PROCURE UM MÉDICO', items: ['Coceira intensa que não passa', 'Feridas, pus ou febre'], y: 400 }], [1, 'disc', { y: 1500 }]] },
    L11: { n: 1, s: ['kit'], hud: [[0, 'quiz', { q: 'Qual a temperatura da água do banho de aveia?', opts: ['Quente', 'Morna', 'Gelada'], ans: 1, reveal: 10.1, y: 300, color: 'gold' }]], sfx: [[0, 'ding', 10.2, { level: 0.2 }]] },
    L12: { n: 1, s: ['kit'], noSubs: true, hud: [[0, 'card', { name: 'BANHO DE AVEIA', para: 'coceira, pele ressecada e brotoeja', color: 'gold',
      ingredients: ['1 xícara de aveia em flocos (seca)', 'Liquidificador e banheira com água morna'],
      steps: ['Bata a aveia até virar pó bem fino', 'Água morna (nunca quente) na banheira', 'Despeje o pó aos poucos, mexendo', 'Fique 10 a 15 min. Seque sem esfregar'], note: 'Coceira forte, feridas ou febre: procure um médico',
      at: [T(1), T(7), T(10), T(12), T(14), T(16)], y: 270 }]] },
    L13: { n: 2, s: ['tito', 'kit'], hud: [[0, 'thought', 'q', 780, 520], [-1, 'chip', 'COMENTA AÍ', { delay: 0.5 }]] },
  },
  final: { s: 'kit', v: { tub: { level: 0.7, milk: 1 } } },
  music: [['L01', 'wonder', 0.55], ['L03', 'calm', 0.55], ['L09', 'tension', 0.45], ['L11', 'wonder', 0.6], ['L12', 'calm', 0.6]],
});
