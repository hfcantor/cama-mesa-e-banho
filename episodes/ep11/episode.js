// EP11 — E se você nunca trocasse a esponja de cozinha? (cozinha)
import { buildEpisode } from '../../js/core/levelEpisode.js';
import { std, focusCams, heroCams, faceCams } from '../../js/core/templates.js';
import { CAMS, STAND } from '../../js/three/worlds/cozinha.js';
import { LINES } from './lines.js';

const SPOT = [-1.0, 0.915, -1.25], SIGN = [-1.2, 1.9, -1.66];
export default buildEpisode({
  id: 'ep11', titulo: "E se você nunca trocasse a esponja de cozinha?", world: 'cozinha', focus: 'sponge',
  ledLabel: 'SEM TROCAR HÁ:', ledUnit: ["DIA", "DIAS"], sign: ["CONDOMÍNIO DE", "BACTÉRIAS"], set: { stove: [-0.7, 0.915, -1.3], sign: SIGN },
  stand: STAND, lines: LINES, miteScale: 0.2,
  cams: { ...CAMS, ...faceCams([-1.2, 1.5, 0.6], 2.0), ...focusCams([-1.2, 0.96, -1.35], 0.22, { h: 0.6 }), ...heroCams([-1.0, 0.915, -1.25], SIGN) },
  plan: std({
    spot: SPOT, wet: false, tito: 'stand', heroScale: 0.3, goodCam: 'sunny', door: {"x": 2.15, "z": 2.1}, icons: ["q", "fork"], goodIcon: 'heart',
    lv: {"s1": "1 SEMANA", "s2": "1 MÊS", "s3": "6 MESES", "n1": 7, "n2": 30, "n3": 180},
    tags: {"use": ["A LOUÇA DA CASA INTEIRA", "todos os dias"], "a": ["ÚMIDA", "guarda água nos buraquinhos"], "b": ["RESTOS DE COMIDA", "e gordura"], "germ": "BACTÉRIAS", "s": ["CHEIRO AZEDO", "esponja fica molhada", "GORDURA", "CONTAMINAÇÃO"], "bad": ["GORDURA", "MOFO", "MILHÕES DE BACTÉRIAS", "CHEIRO"], "good": "ESPONJA NOVA"},
    steps: [{"text": "TROCAR", "sub": "a cada 1 ou 2 semanas", "word": 8}, {"text": "SECAR", "sub": "depois de usar", "word": 12}],
  }),
});
