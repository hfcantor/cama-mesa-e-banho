// EP07 — E se você nunca lavasse a cortina do box? (banheiro)
import { buildEpisode } from '../../js/core/levelEpisode.js';
import { std, focusCams, heroCams, faceCams } from '../../js/core/templates.js';
import { CAMS, STAND } from '../../js/three/worlds/banheiro.js';
import { LINES } from './lines.js';

const SPOT = [-1.0, 0.05, 0.2], SIGN = [-1.35, 2.35, -0.3];
export default buildEpisode({
  id: 'ep07', titulo: "E se você nunca lavasse a cortina do box?", world: 'banheiro', focus: 'curtain',
  ledLabel: 'SEM LAVAR HÁ:', ledUnit: ["DIA", "DIAS"], sign: ["FLORESTA DE", "MOFO"], set: { stove: [-0.6, 0.05, 0.5], sign: SIGN },
  stand: STAND, lines: LINES, miteScale: 0.5,
  cams: { ...CAMS, ...faceCams([0.2, 1.5, 0.5], 2.0), ...focusCams([-1.35, 1.1, -0.35], 1.0, { h: 0.15 }), ...heroCams([-1.0, 0.05, 0.2], SIGN) },
  plan: std({
    spot: SPOT, wet: true, tito: 'stand', heroScale: 0.8, goodCam: 'wide', door: {"x": 1.75, "z": 0.45}, icons: ["q", "fork"], goodIcon: 'heart',
    lv: {"s1": "1 SEMANA", "s2": "1 MÊS", "s3": "1 ANO", "n1": 7, "n2": 30, "n3": 365},
    tags: {"use": ["DEPOIS DE TODO BANHO", "a cortina fica molhada"], "a": ["SABÃO", "e umidade"], "b": ["SUJEIRA", "grudada no plástico"], "germ": "FUNGOS", "s": ["CHEIRO DE MOFO", "cantos sempre úmidos", "TOSSE", "ALERGIA"], "bad": ["MOFO PRETO", "LIMO", "MILHÕES DE GERMES", "CHEIRO"], "good": "CORTINA LIMPA"},
    steps: [{"text": "LAVAR", "sub": "uma vez por mês", "word": 6}, {"text": "SECAR ABERTA", "sub": "bem esticada", "word": 11}],
  }),
});
