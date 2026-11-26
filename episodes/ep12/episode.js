// EP12 — E se você nunca lavasse o guardanapo de pano? (cozinha)
import { buildEpisode } from '../../js/core/levelEpisode.js';
import { std, focusCams, heroCams, faceCams } from '../../js/core/templates.js';
import { CAMS, STAND } from '../../js/three/worlds/cozinha.js';
import { LINES } from './lines.js';

const SPOT = [-0.2, 0.8, -0.2], SIGN = [0.4, 1.8, -1.65];
export default buildEpisode({
  id: 'ep12', titulo: "E se você nunca lavasse o guardanapo de pano?", world: 'cozinha', focus: 'napkin',
  ledLabel: 'SEM LAVAR HÁ:', ledUnit: ["DIA", "DIAS"], sign: ["PRATO DO DIA:", "GERMES"], set: { stove: [0.45, 0.8, -0.35], sign: SIGN },
  stand: STAND, lines: LINES, miteScale: 0.35,
  cams: { ...CAMS, ...faceCams([-1.2, 1.5, 0.6], 2.0), ...focusCams([-0.35, 0.8, -0.3], 0.35, { h: 0.9 }), ...heroCams([-0.2, 0.8, -0.2], SIGN) },
  plan: std({
    spot: SPOT, wet: false, tito: 'stand', heroScale: 0.5, goodCam: 'sunny', door: {"x": 2.15, "z": 2.1}, icons: ["q", "fork"], goodIcon: 'heart',
    lv: {"s1": "1 SEMANA", "s2": "1 MÊS", "s3": "1 ANO", "n1": 7, "n2": 30, "n3": 365},
    tags: {"use": ["EM TODA REFEIÇÃO", "boca e mãos"], "a": ["MOLHO", "e gordura"], "b": ["RESTOS DE COMIDA", "grudados no pano"], "germ": "GERMES", "s": ["CHEIRO AZEDO", "pano esquecido", "MANCHAS", "VERGONHA NA MESA"], "bad": ["MANCHAS", "MOFO", "MILHÕES DE GERMES", "CHEIRO"], "good": "GUARDANAPO LIMPO"},
    steps: [{"text": "TROCAR", "sub": "um limpo a cada refeição", "word": 6}, {"text": "LAVAR", "sub": "depois de usar", "word": 8}],
  }),
});
