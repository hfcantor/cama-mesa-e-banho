// EP45 — Receita caseira #9: babosa na queimadura de sol leve
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const T = (word) => ({ line: 'L12', word, offset: 0 });
export default buildFato({
  id: 'ep45', titulo: 'Babosa para queimadura de sol leve', lines: LINES, defaultSubject: 'kit',
  fato: {
    sky: 'kitchen', ground: 'wood', seed: 15, center: [0, 0, 0],
    props: [
      { id: 'wall', type: 'wall', pos: [0, 0, -10], o: { tile: '#eef4e8', grout: '#c0cdb4', windowX: 6, shelfX: -8 } },
      { id: 'plant', type: 'aloe', pos: [-6.2, 0, 0.5], s: 1.3, o: { kind: 'plant' } },
      { id: 'board', type: 'board', pos: [-1.2, 0, 0.9], s: 1.1 },
      { id: 'leaf', type: 'aloe', pos: [-1.2, 0.25, 0.9], s: 0.85, o: { kind: 'leaf' }, v: { gel: 0, blob: 0, latex: 0 } },
      { id: 'knife', type: 'knife', pos: [1.6, 0.25, 2.0], s: 1.5, ry: 0.2 },
      { id: 'arm', type: 'limb', pos: [5.2, 0, 1.2], s: 1.3, o: { kind: 'arm' }, v: { red: 0.85, gel: 0 } },
      { id: 'faucet', type: 'faucet', pos: [4.6, 0, -3.2], s: 1.5, v: { flow: 0 }, hide: true },
      { id: 'armW', type: 'limb', pos: [6.6, 0.4, -3.2], s: 1.2, o: { kind: 'arm' }, v: { red: 0.85, gel: 0 }, hide: true },
      { id: 'fr', type: 'box', pos: [10.0, 0, -5], o: { w: 4.2, h: 9, d: 3.4, color: '#f2f4f6' }, hide: true },
      { id: 'frH', type: 'box', pos: [8.2, 3.8, -3.2], o: { w: 0.18, h: 2.4, d: 0.2, color: '#9aa0a8' }, hide: true },
      { id: 'tito', type: 'char', pos: [8.0, 0, 3.4], ry: -0.5, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    kit: { at: [-0.4, 2.2, 0.4], r: 8.2, az: 6, ly: 0.6, styles: ['wide', 'mid', 'high'] },
    plantL: { at: [-6.2, 2.0, 0.5], r: 4.4, ly: 1.1, styles: ['mid', 'close'] },
    leafL: { at: [-1.2, 0.9, 0.9], r: 3.6, ly: 1.3, styles: ['mid', 'close', 'macro'] },
    chop: { at: [-0.4, 1.0, 1.4], r: 4.0, ly: 1.0, styles: ['mid', 'close', 'macro'], v: { knife: { chop: 1 }, leaf: { latex: 1 } } },
    latex: { at: [-2.4, 0.9, 1.1], r: 2.8, ly: 0.9, styles: ['close', 'macro', 'mid'], v: { leaf: { latex: 1, gel: 1 } } },
    gelL: { at: [-2.2, 0.9, 1.1], r: 3.2, ly: 1.0, styles: ['mid', 'close', 'macro'], v: { leaf: { gel: 1, blob: 1, latex: 0 } } },
    armRed: { at: [5.0, 1.0, 1.2], r: 4.6, az: 8, ly: 1.0, styles: ['mid', 'close', 'low'] },
    armGel: { at: [5.0, 1.0, 1.2], r: 4.2, az: 8, ly: 1.0, styles: ['mid', 'close', 'macro'] },
    wash: { at: [6.4, 1.7, -3.2], r: 4.6, ly: 0.9, styles: ['mid', 'close'], v: { faucet: { vis: 1, flow: 1 }, armW: { vis: 1 } } },
    washW: { at: [6.0, 1.9, -3.2], r: 6.0, ly: 0.9, styles: ['mid', 'wide'], v: { faucet: { vis: 1, flow: 1 }, armW: { vis: 1 } } },
    fridge: { at: [9.0, 4.2, -4], r: 7.2, ly: 0.6, styles: ['mid', 'wide'], v: { fr: { vis: 1 }, frH: { vis: 1 } } },
    tito: { at: [8.0, 1.25, 3.4], r: 1.3, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { smile: 0.6 } } } },
    titoHot: { at: [8.0, 1.25, 3.4], r: 1.3, az: -20, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 0.7, smile: 0 } } } },
  },
  plan: {
    L01: { n: 4, s: ['kit', 'titoHot', 'armRed', 'plantL'], hud: [[0, 'kicker', { n: 9, name: 'BABOSA NA PELE', uses: ['QUEIMADURA DE SOL LEVE', 'PELE VERMELHA E ARDENDO', 'PRIMEIROS SOCORROS'], color: 'green' }], [1, 'pop', 'ARDE!', 540, 520, { size: 160, color: '#FF4D4D', dur: 1.1 }]] },
    L02: { n: 4, s: ['wash', 'washW', 'wash', 'washW'], v: { tito: { vis: 0 } }, hud: [[0, 'banner', 'PRIMEIRO: ÁGUA FRESCA', { color: '#2b8fd6', size: 44, y: 330 }], [1, 'timer', { label: 'ÁGUA CORRENTE', secs: 1200, p0: 0, p1: 0.5, y: 600, color: 'blue' }], [2, 'banner', 'SEM GELO', { color: '#e8453c', size: 48, y: 380 }], [3, 'qty', { amount: '10 A 20 MINUTOS', note: 'água corrente fresca', y: 470, color: 'blue' }]] },
    L03: { n: 3, s: ['plantL', 'leafL', 'kit'], v: { faucet: { vis: 0, flow: 0 }, armW: { vis: 0 } }, hud: [['*', 'ingr', [
      { amt: '1 FOLHA', name: 'Babosa (aloe vera)', sub: 'folha grande e carnuda', line: 'L03', word: 4 },
      { amt: '1 FACA', name: 'Faca limpa', sub: 'e uma colher', line: 'L03', word: 8 }], { y: 450, color: 'green' }]] },
    L04: { n: 3, s: ['chop', 'latex', 'latex'], hud: [[0, 'step', { n: 1, total: 3, title: 'CORTE E ESCORRA', color: 'green' }], [1, 'tag', 'LÍQUIDO AMARELO', { dot: 'gold', sub: 'irrita a pele: deixe escorrer', size: 44, y: 480 }], [2, 'mark', 'no', 800, 600, 60]] },
    L05: { n: 2, s: ['gelL', 'gelL'], hud: [[0, 'step', { n: 2, total: 3, title: 'SÓ O GEL', color: 'green' }], [1, 'tag', 'GEL TRANSPARENTE', { dot: 'green', size: 46, y: 480 }]] },
    L06: { n: 3, s: ['armRed', 'armGel', 'armGel'], v: { leaf: { gel: 1, blob: 0 } }, la: { 'arm.gel': [0, 1], 'arm.red': [0.85, 0.5] }, hud: [[0, 'step', { n: 3, total: 3, title: 'CAMADA FINA', color: 'green' }], [1, 'mark', 'no', 800, 600, 60], [1, 'tag', 'SEM ESFREGAR', { dot: 'red', size: 44, y: 700 }]] },
    L07: { n: 3, s: ['fridge', 'armGel', 'fridge'], v: { arm: { gel: 1, red: 0.5 } }, hud: [[0, 'tag', 'GEL NA GELADEIRA', { dot: 'blue', size: 46, y: 480 }], [1, 'tag', 'REPITA AO LONGO DO DIA', { dot: 'green', size: 40, y: 480 }]] },
    L08: { n: 2, s: ['armGel', 'armRed'], v: { fr: { vis: 0 }, frH: { vis: 0 } }, hud: [[0, 'tag', 'TESTE EM UM PEDACINHO', { dot: 'gold', size: 42, y: 480 }], [1, 'mark', 'ok', 800, 600, 60]] },
    L09: { n: 3, s: ['titoHot', 'armRed', 'titoHot'], v: { tito: { vis: 1 } }, hud: [[0, 'caution', { title: 'NUNCA PASSE', items: ['Pasta de dente', 'Manteiga ou óleo', 'Segura o calor e pode piorar'], y: 380, color: 'red' }]] },
    L10: { n: 2, s: ['titoHot', 'tito'], hud: [[0, 'caution', { title: 'PROCURE UM MÉDICO', items: ['Bolhas ou pele aberta', 'Rosto, criança ou queimadura grande', 'Febre'], y: 360 }], [1, 'disc', { y: 1500 }]] },
    L11: { n: 1, s: ['kit'], hud: [[0, 'quiz', { q: 'Queimou a mão no fogão. Qual o primeiro passo?', opts: ['Pasta de dente', 'Água corrente fresca', 'Manteiga'], ans: 1, reveal: 12.5, y: 300, color: 'green' }]], sfx: [[0, 'ding', 12.6, { level: 0.2 }]] },
    L12: { n: 1, s: ['kit'], noSubs: true, hud: [[0, 'card', { name: 'BABOSA NA PELE', para: 'queimadura de sol leve', color: 'green',
      ingredients: ['1 folha de babosa grande', '1 faca limpa e 1 colher'],
      steps: ['Água corrente fresca, 10 a 20 min (sem gelo)', 'Corte a folha e escorra o líquido amarelo', 'Retire a casca e use só o gel', 'Camada fina na pele vermelha. Teste antes'], note: 'Bolhas, rosto, criança ou febre: procure um médico',
      at: [T(1), T(4), T(7), T(9), T(11), T(14)], y: 270 }]] },
    L13: { n: 2, s: ['tito', 'kit'], hud: [[0, 'thought', 'q', 780, 520], [-1, 'chip', 'COMENTA AÍ', { delay: 0.5 }]] },
  },
  final: { s: 'kit' },
  music: [['L01', 'wonder', 0.55], ['L03', 'calm', 0.55], ['L09', 'tension', 0.45], ['L11', 'wonder', 0.6], ['L12', 'calm', 0.6]],
});
