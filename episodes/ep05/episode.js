// EP05 — E se você nunca lavasse o edredom? (dormitorio)
import { buildEpisode } from '../../js/core/levelEpisode.js';
import { std, focusCams, heroCams, faceCams } from '../../js/core/templates.js';
import { CAMS, STAND } from '../../js/three/worlds/dormitorio.js';
import { LINES } from './lines.js';

const SPOT = [0.3, 0.79, -0.9], SIGN = [0.4, 1.3, -2.38];
export default buildEpisode({
  id: 'ep05', titulo: "E se você nunca lavasse o edredom?", world: 'dormitorio', focus: 'duvet',
  ledLabel: 'SEM LAVAR HÁ:', ledUnit: ["DIA", "DIAS"], sign: ["SAUNA DE", "GERMES"], set: { stove: [0.4, 0.79, -1.4], sign: SIGN },
  stand: STAND, lines: LINES, miteScale: 1.0,
  cams: { ...CAMS, ...faceCams([-1.15, 1.5, -1.3], 2.0), ...focusCams([0.0, 0.75, -0.95], 0.9, { h: 0.6 }), ...heroCams([0.3, 0.79, -0.9], SIGN) },
  plan: std({
    spot: SPOT, wet: false, tito: 'stand', heroScale: 1.0, goodCam: 'sunny', door: {"x": 2.15, "z": 1.55}, icons: ["bed", "fork"], goodIcon: 'moon',
    lv: {"s1": "1 MÊS", "s2": "6 MESES", "s3": "1 ANO", "n1": 30, "n2": 180, "n3": 365},
    tags: {"use": ["A NOITE INTEIRA", "de cobertor sobre você"], "a": ["CALOR", "e suor"], "b": ["PELE MORTA", "dentro do recheio"], "germ": "ÁCAROS", "s": ["COCEIRA", "pele irritada", "NARIZ ENTUPIDO", "TOSSE"], "bad": ["POEIRA", "MANCHAS", "MILHÕES DE ÁCAROS", "CHEIRO"], "good": "EDREDOM LIMPO"},
    steps: [{"text": "LAVAR", "sub": "algumas vezes por ano", "word": 4}, {"text": "AREJAR", "sub": "ao sol e ao ar", "word": 11}],
  }),
});
