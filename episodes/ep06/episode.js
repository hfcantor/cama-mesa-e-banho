// EP06 — E se você nunca lavasse o pano de prato? (cozinha)
import { buildEpisode } from '../../js/core/levelEpisode.js';
import { std, focusCams, heroCams, faceCams } from '../../js/core/templates.js';
import { CAMS, STAND } from '../../js/three/worlds/cozinha.js';
import { LINES } from './lines.js';

const SPOT = [1.35, 0.0, -0.5], SIGN = [1.5, 1.65, -1.65];
export default buildEpisode({
  id: 'ep06', titulo: "E se você nunca lavasse o pano de prato?", world: 'cozinha', focus: 'pano',
  ledLabel: 'SEM LAVAR HÁ:', ledUnit: ["DIA", "DIAS"], sign: ["RESTAURANTE DE", "BACTÉRIAS"], set: { stove: [0.95, 0.0, -0.3], sign: SIGN },
  stand: STAND, lines: LINES, miteScale: 0.4,
  cams: { ...CAMS, ...faceCams([-1.2, 1.5, 0.6], 2.0), ...focusCams([1.5, 0.45, -0.97], 0.4, { h: 0.15 }), ...heroCams([1.35, 0.0, -0.5], SIGN) },
  plan: std({
    spot: SPOT, wet: false, tito: 'stand', heroScale: 0.6, goodCam: 'sunny', door: {"x": 2.15, "z": 2.1}, icons: ["q", "fork"], goodIcon: 'heart',
    lv: {"s1": "1 SEMANA", "s2": "1 MÊS", "s3": "1 ANO", "n1": 7, "n2": 30, "n3": 365},
    tags: {"use": ["MÃOS, LOUÇA E BANCADA", "tudo no mesmo pano"], "a": ["ÚMIDO", "nunca seca direito"], "b": ["GORDURA", "e restos de comida"], "germ": "BACTÉRIAS", "s": ["CHEIRO AZEDO", "pano guardado úmido", "GORDURA", "CONTAMINAÇÃO"], "bad": ["GORDURA", "MOFO", "MILHÕES DE BACTÉRIAS", "CHEIRO"], "good": "PANO LIMPO"},
    steps: [{"text": "TROCAR", "sub": "a cada 2 dias", "word": 7}, {"text": "LAVAR", "sub": "com água quente", "word": 14}],
  }),
});
