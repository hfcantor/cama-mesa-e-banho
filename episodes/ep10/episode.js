// EP10 — E se você nunca limpasse o colchão? (dormitorio)
import { buildEpisode } from '../../js/core/levelEpisode.js';
import { std, focusCams, heroCams, faceCams } from '../../js/core/templates.js';
import { CAMS, STAND } from '../../js/three/worlds/dormitorio.js';
import { LINES } from './lines.js';

const SPOT = [0.3, 0.61, -1.2], SIGN = [0.4, 1.3, -2.38];
export default buildEpisode({
  id: 'ep10', titulo: "E se você nunca limpasse o colchão?", world: 'dormitorio', focus: 'mattress',
  ledLabel: 'SEM LIMPAR HÁ:', ledUnit: ["ANO", "ANOS"], sign: ["CONDOMÍNIO DE", "ÁCAROS"], set: { stove: [0.4, 0.61, -1.6], sign: SIGN },
  stand: STAND, lines: LINES, miteScale: 1.0, p: {"bare": 1},
  cams: { ...CAMS, ...faceCams([-1.15, 1.5, -1.3], 2.0), ...focusCams([0.0, 0.6, -1.4], 1.0, { h: 0.9 }), ...heroCams([0.3, 0.61, -1.2], SIGN) },
  plan: std({
    spot: SPOT, wet: false, tito: 'stand', heroScale: 1.0, goodCam: 'sunny', door: {"x": 2.15, "z": 1.55}, icons: ["bed", "fork"], goodIcon: 'moon',
    lv: {"s1": "1 ANO", "s2": "5 ANOS", "s3": "10 ANOS", "n1": 1, "n2": 5, "n3": 10},
    tags: {"use": ["ANOS E ANOS", "o mesmo colchão"], "a": ["SUOR", "e pele morta"], "b": ["POEIRA", "acumulada"], "germ": "ÁCAROS", "s": ["NARIZ ENTUPIDO", "piora à noite", "COCEIRA", "ALERGIA"], "bad": ["MANCHAS", "MOFO", "MILHÕES DE ÁCAROS", "CHEIRO"], "good": "COLCHÃO LIMPO"},
    steps: [{"text": "ASPIRAR", "sub": "a cada poucos meses", "word": 6}, {"text": "PROTETOR", "sub": "lavável", "word": 11}],
  }),
});
