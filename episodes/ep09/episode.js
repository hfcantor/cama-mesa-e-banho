// EP09 — E se você nunca lavasse a toalha de mesa? (cozinha)
import { buildEpisode } from '../../js/core/levelEpisode.js';
import { std, focusCams, heroCams, faceCams } from '../../js/core/templates.js';
import { CAMS, STAND } from '../../js/three/worlds/cozinha.js';
import { LINES } from './lines.js';

const SPOT = [0.0, 0.8, -0.2], SIGN = [0.4, 1.8, -1.65];
export default buildEpisode({
  id: 'ep09', titulo: "E se você nunca lavasse a toalha de mesa?", world: 'cozinha', focus: 'table',
  ledLabel: 'SEM LAVAR HÁ:', ledUnit: ["DIA", "DIAS"], sign: ["BUFÊ", "LIBERADO"], set: { stove: [0.45, 0.8, -0.35], sign: SIGN },
  stand: STAND, lines: LINES, miteScale: 0.6,
  cams: { ...CAMS, ...faceCams([-1.2, 1.5, 0.6], 2.0), ...focusCams([0.0, 0.8, -0.5], 0.85, { h: 0.75 }), ...heroCams([0.0, 0.8, -0.2], SIGN) },
  plan: std({
    spot: SPOT, wet: false, tito: 'stand', heroScale: 0.9, goodCam: 'sunny', door: {"x": 2.15, "z": 2.1}, icons: ["q", "fork"], goodIcon: 'heart',
    lv: {"s1": "1 SEMANA", "s2": "1 MÊS", "s3": "1 ANO", "n1": 7, "n2": 30, "n3": 365},
    tags: {"use": ["TODAS AS REFEIÇÕES", "café, almoço e jantar"], "a": ["MIGALHAS", "por todo lado"], "b": ["GORDURA", "e molho derramado"], "germ": "GERMES", "s": ["CHEIRO AZEDO", "comida velha no tecido", "MANCHAS", "SUJEIRA GRUDADA"], "bad": ["GORDURA", "MOFO", "MILHÕES DE GERMES", "MOSCAS"], "good": "MESA LIMPA"},
    steps: [{"text": "LAVAR", "sub": "toda semana", "word": 6}, {"text": "SACUDIR", "sub": "migalhas todo dia", "word": 8}],
  }),
});
