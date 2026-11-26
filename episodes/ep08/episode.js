// EP08 — E se você nunca lavasse o tapete do banheiro? (banheiro)
import { buildEpisode } from '../../js/core/levelEpisode.js';
import { std, focusCams, heroCams, faceCams } from '../../js/core/templates.js';
import { CAMS, STAND } from '../../js/three/worlds/banheiro.js';
import { LINES } from './lines.js';

const SPOT = [-0.2, 0.04, -0.3], SIGN = [0.2, 1.4, -1.45];
export default buildEpisode({
  id: 'ep08', titulo: "E se você nunca lavasse o tapete do banheiro?", world: 'banheiro', focus: 'rug',
  ledLabel: 'SEM LAVAR HÁ:', ledUnit: ["DIA", "DIAS"], sign: ["PÂNTANO DE", "GERMES"], set: { stove: [0.35, 0.04, -0.4], sign: SIGN },
  stand: STAND, lines: LINES, miteScale: 0.5,
  cams: { ...CAMS, ...faceCams([0.2, 1.5, 0.5], 2.0), ...focusCams([-0.2, 0.03, -0.55], 0.6, { h: 1.1 }), ...heroCams([-0.2, 0.04, -0.3], SIGN) },
  plan: std({
    spot: SPOT, wet: true, tito: 'stand', heroScale: 0.7, goodCam: 'wide', door: {"x": 1.75, "z": 0.45}, icons: ["q", "fork"], goodIcon: 'heart',
    lv: {"s1": "1 SEMANA", "s2": "1 MÊS", "s3": "1 ANO", "n1": 7, "n2": 30, "n3": 365},
    tags: {"use": ["DE PÉ MOLHADO", "todo santo dia"], "a": ["ENCHARCADO", "poça constante"], "b": ["SUJEIRA", "dos pés"], "germ": "GERMES", "s": ["CHEIRO DE MOFO", "tapete nunca seca", "COCEIRA NOS PÉS", "CHULÉ"], "bad": ["MOFO", "LODO", "MILHÕES DE GERMES", "CHEIRO"], "good": "TAPETE LIMPO"},
    steps: [{"text": "LAVAR", "sub": "toda semana", "word": 4}, {"text": "SECAR", "sub": "bem seco antes de usar", "word": 7}],
  }),
});
