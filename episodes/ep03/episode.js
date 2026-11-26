// EP03 — E se você nunca lavasse a toalha de banho? (banheiro)
import { buildEpisode } from '../../js/core/levelEpisode.js';
import { std, focusCams, heroCams, faceCams } from '../../js/core/templates.js';
import { CAMS, STAND } from '../../js/three/worlds/banheiro.js';
import { LINES } from './lines.js';

const SPOT = [0.45, 0.05, -0.7], SIGN = [0.5, 1.85, -1.45];
export default buildEpisode({
  id: 'ep03', titulo: "E se você nunca lavasse a toalha de banho?", world: 'banheiro', focus: 'towel',
  ledLabel: 'SEM LAVAR HÁ:', ledUnit: ["DIA", "DIAS"], sign: ["PISCINA DE", "BACTÉRIAS"], set: { stove: [0.1, 0.05, -0.2], sign: SIGN },
  stand: STAND, lines: LINES, miteScale: 0.45,
  cams: { ...CAMS, ...faceCams([0.2, 1.5, 0.5], 2.0), ...focusCams([0.5, 0.95, -1.35], 0.55, { h: 0.15 }), ...heroCams([0.45, 0.05, -0.7], SIGN) },
  plan: std({
    spot: SPOT, wet: true, tito: 'stand', heroScale: 0.7, goodCam: 'wide', door: {"x": 1.75, "z": 0.45}, icons: ["q", "fork"], goodIcon: 'heart',
    lv: {"s1": "1 SEMANA", "s2": "1 MÊS", "s3": "1 ANO", "n1": 7, "n2": 30, "n3": 365},
    tags: {"use": ["DEPOIS DE CADA BANHO", "a toalha é sempre a mesma"], "a": ["ÚMIDA", "a umidade não sai"], "b": ["PELE MORTA", "e sujeirinha"], "germ": "GERMES", "s": ["CHEIRO DE MOFO", "toalha guardada úmida", "COCEIRA", "PELE IRRITADA"], "bad": ["MOFO", "MANCHAS", "MILHÕES DE GERMES", "CHEIRO"], "good": "TOALHA LIMPA"},
    steps: [{"text": "LAVAR", "sub": "a cada 3 usos", "word": 5}, {"text": "SECAR ABERTA", "sub": "bem esticada", "word": 11}],
  }),
});
