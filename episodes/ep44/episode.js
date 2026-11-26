// EP44 — Receita caseira #8: compressa fria x quente
import { buildFato } from '../../js/core/factEpisode.js';
import { LINES } from './lines.js';

const T = (word) => ({ line: 'L12', word, offset: 0 });
export default buildFato({
  id: 'ep44', titulo: 'Compressa fria ou quente', lines: LINES, defaultSubject: 'kit',
  fato: {
    sky: 'kitchen', ground: 'wood', seed: 14, center: [0, 0, 0],
    props: [
      { id: 'wall', type: 'wall', pos: [0, 0, -10], o: { tile: '#e9f1f4', grout: '#bccdd3', windowX: -8, shelfX: 8 } },
      { id: 'foot', type: 'limb', pos: [0, 0, 0], s: 1.5, o: { kind: 'foot' }, v: { swell: 1, bruise: 0.6 } },
      { id: 'ice', type: 'compress', pos: [-5.0, 0, 0.6], s: 1.4, o: { kind: 'ice' } },
      { id: 'warm', type: 'compress', pos: [5.0, 0, 0.8], s: 1.3, o: { kind: 'warm' } },
      { id: 'bowlW', type: 'vessel', pos: [3.0, 0, -0.6], s: 1.5, o: { kind: 'bowl', clear: true, c0: '#cfe9f5' }, v: { fill: 0.6, steam: 1 }, hide: true },
      { id: 'warmB', type: 'compress', pos: [7.2, 0.85, 3.75], s: 0.4, o: { kind: 'warm', upright: true }, hide: true },
      { id: 'tito', type: 'char', pos: [7.2, 0, 3.0], ry: 0, hide: true, o: { shirt: '#4a86d6', pants: '#3a4a8a' } },
    ],
  },
  subjects: {
    kit: { at: [0.2, 2.2, 0], r: 8.2, az: 6, ly: 0.6, styles: ['wide', 'mid', 'high'] },
    foot: { at: [0, 1.8, 0], r: 4.4, az: 8, ly: 0.8, styles: ['mid', 'close', 'low'] },
    footLow: { at: [0, 1.4, 0], r: 4.4, az: 8, ly: 1.6, styles: ['mid', 'close'] },
    ankle: { at: [0, 0.9, 0.3], r: 2.4, az: 8, ly: 0.9, styles: ['close', 'mid', 'macro'] },
    iceL: { at: [-5.0, 0.9, 0.6], r: 3.8, ly: 1.3, styles: ['mid', 'close'] },
    warmL: { at: [4.2, 0.9, 0.2], r: 4.6, ly: 1.3, styles: ['mid', 'close'] },
    iceApply: { at: [2.4, 1.2, 0.6], r: 4.6, az: 8, ly: 1.0, styles: ['mid', 'close'], v: { ice: { x: 5.9, y: 0.9, z: 0.5, wrap: 1, bag: 0 } } },
    iceApplyC: { at: [2.4, 1.2, 0.6], r: 3.2, az: 8, ly: 1.0, styles: ['close', 'macro'], v: { ice: { x: 5.9, y: 0.9, z: 0.5, wrap: 1, bag: 0 } } },
    wring: { at: [4.2, 0.9, -0.2], r: 4.2, ly: 1.0, styles: ['mid', 'close'], v: { bowlW: { vis: 1 } } },
    tito: { at: [7.2, 1.25, 3.0], r: 1.3, az: -14, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { smile: 0.6 } } } },
    titoPain: { at: [7.2, 1.25, 3.0], r: 1.3, az: -14, ly: 0.2, styles: ['close', 'mid'], v: { tito: { vis: 1, pose: { scared: 0.6, smile: 0 } } } },
    belly: { at: [7.2, 1.35, 3.4], r: 1.9, az: -10, ly: 0.2, styles: ['mid', 'close'], v: { tito: { vis: 1, pose: { smile: 0.3 } }, warmB: { vis: 1 } } },
    bellyHappy: { at: [7.2, 1.35, 3.4], r: 1.9, az: -10, ly: 0.2, styles: ['mid', 'close'], v: { tito: { vis: 1, pose: { smile: 1 } }, warmB: { vis: 1 } } },
  },
  plan: {
    L01: { n: 4, s: ['kit', 'foot', 'titoPain', 'foot'], hud: [[0, 'kicker', { n: 8, name: 'COMPRESSA FRIA X QUENTE', uses: ['PANCADA E TORÇÃO', 'CÓLICA', 'DOR MUSCULAR'], color: 'teal' }], [1, 'pop', 'AI!', 540, 520, { size: 170, color: '#FF4D4D', dur: 1.1 }]] },
    L02: { n: 4, s: ['iceL', 'iceL', 'warmL', 'warmL'], v: { tito: { vis: 0 } }, hud: [['*', 'ingr', [
      { amt: 'FRIA', name: 'Gelo + saco + pano', sub: 'nunca gelo direto na pele', line: 'L02', word: 0 },
      { amt: 'QUENTE', name: 'Pano úmido morno', sub: 'ou bolsa térmica', line: 'L02', word: 14 }], { y: 450, color: 'teal' }]] },
    L03: { n: 3, s: ['foot', 'ankle', 'footLow'], hud: [[0, 'banner', 'FRIA = PANCADA E TORÇÃO', { color: '#2b8fd6', size: 44, y: 330 }], [1, 'tag', 'INCHAÇO RECENTE', { dot: 'blue', sub: 'nas primeiras horas', size: 44, y: 480 }]] },
    L04: { n: 3, s: ['iceL', 'iceL', 'iceApply'], la: { 'ice.wrap': [0, 1] }, hud: [[0, 'step', { n: 1, total: 3, title: 'GELO NO SACO + PANO', color: 'blue' }], [2, 'timer', { label: 'COMPRESSA', secs: 1200, p0: 0, p1: 1, y: 560, color: 'blue' }], [1, 'banner', 'NUNCA GELO DIRETO', { color: '#e8453c', size: 44, y: 330 }]] },
    L05: { n: 2, s: ['iceApplyC', 'foot'], v: { ice: { x: 5.9, y: 0.9, z: 0.5, wrap: 1, bag: 0 } }, hud: [[0, 'qty', { amount: '15 A 20 MINUTOS', note: 'depois, pausa e repete', y: 480, color: 'blue' }]] },
    L06: { n: 3, s: ['titoPain', 'warmL', 'belly'], v: { ice: { vis: 0 }, foot: { vis: 0 } }, hud: [[0, 'banner', 'QUENTE = CÓLICA E MÚSCULO', { color: '#e0623a', size: 44, y: 330 }], [1, 'tag', 'SEM INCHAÇO NOVO', { dot: 'orange', size: 44, y: 480 }]] },
    L07: { n: 4, s: ['wring', 'wring', 'belly', 'bellyHappy'], v: { tito: { vis: 1 } }, hud: [[0, 'step', { n: 2, total: 3, title: 'PANO EM ÁGUA MORNA', color: 'orange' }], [2, 'qty', { amount: '15 A 20 MINUTOS', note: 'confortável, nunca arder', y: 480, color: 'orange' }]] },
    L08: { n: 2, s: ['foot', 'bellyHappy'], v: { foot: { vis: 1 }, ice: { vis: 1, x: 5.9, y: 0.9, z: 0.5, wrap: 1, bag: 0 } }, hud: [[0, 'tag', 'PANCADA = FRIO', { dot: 'blue', size: 52, y: 450 }], [1, 'tag', 'CÓLICA OU MÚSCULO = CALOR', { dot: 'red', size: 44, y: 450 }]] },
    L09: { n: 3, s: ['titoPain', 'warmL', 'titoPain'], hud: [[0, 'caution', { title: 'CUIDADO', items: ['Diabetes, má circulação ou pouca sensibilidade: evite sem orientação', 'Nunca sobre ferida aberta'], y: 380 }]] },
    L10: { n: 2, s: ['titoPain', 'tito'], hud: [[0, 'caution', { title: 'PROCURE UM MÉDICO', items: ['Dor muito forte ou pé deformado', 'Não consegue apoiar o pé, ou tem febre'], y: 400 }], [1, 'disc', { y: 1500 }]] },
    L11: { n: 1, s: ['kit'], hud: [[0, 'quiz', { q: 'Torceu o pé agora há pouco. Qual compressa?', opts: ['Quente', 'Fria', 'Nenhuma'], ans: 1, reveal: 11.4, y: 300, color: 'teal' }]], sfx: [[0, 'ding', 11.5, { level: 0.2 }]] },
    L12: { n: 1, s: ['kit'], noSubs: true, hud: [[0, 'card', { name: 'COMPRESSA FRIA X QUENTE', para: 'torção, pancada, cólica e dor muscular', color: 'teal',
      ingredients: ['FRIA: gelo no saco, enrolado no pano', 'QUENTE: pano morno úmido ou bolsa térmica'],
      steps: ['Pancada ou torção: compressa FRIA', 'Cólica ou dor muscular: compressa QUENTE', 'Sempre com pano: 15 a 20 minutos', 'Nunca em ferida. Se arder, retire'], note: 'Dor forte, febre ou pé que não apoia: médico',
      at: [T(1), T(7), T(11), T(13), T(15), T(17)], y: 270 }]] },
    L13: { n: 2, s: ['tito', 'kit'], hud: [[0, 'thought', 'q', 780, 520], [-1, 'chip', 'COMENTA AÍ', { delay: 0.5 }]] },
  },
  final: { s: 'kit' },
  music: [['L01', 'wonder', 0.55], ['L03', 'calm', 0.55], ['L09', 'tension', 0.45], ['L11', 'wonder', 0.6], ['L12', 'calm', 0.6]],
});
