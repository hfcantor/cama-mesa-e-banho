// EP04 — E se você nunca trocasse o travesseiro? (dormitorio)
import { buildEpisode } from '../../js/core/levelEpisode.js';
import { std, focusCams, heroCams, faceCams } from '../../js/core/templates.js';
import { CAMS, STAND } from '../../js/three/worlds/dormitorio.js';
import { LINES } from './lines.js';

const SPOT = [0.4, 0.76, -2.0], SIGN = [0.4, 1.3, -2.38];
export default buildEpisode({
  id: 'ep04', titulo: "E se você nunca trocasse o travesseiro?", world: 'dormitorio', focus: 'pillow',
  ledLabel: 'SEM TROCAR HÁ:', ledUnit: ["DIA", "DIAS"], sign: ["HOTEL DE", "ÁCAROS"], set: { stove: [0.55, 0.82, -2.05], sign: SIGN },
  stand: STAND, lines: LINES, miteScale: 1.0,
  cams: { ...CAMS, ...focusCams([0.4, 0.72, -2.1], 0.5, { h: 0.7 }), ...heroCams([0.4, 0.76, -2.0], SIGN) },
  plan: std({
    spot: SPOT, wet: false, tito: 'lie', heroScale: 1.0, goodCam: 'side', door: {"x": 2.15, "z": 1.55}, icons: ["bed", "fork"], goodIcon: 'moon',
    lv: {"s1": "1 SEMANA", "s2": "1 MÊS", "s3": "1 ANO", "n1": 7, "n2": 30, "n3": 365},
    tags: {"use": ["TODAS AS NOITES", "a cabeça fica aqui"], "a": ["SUOR", "absorvido pela fronha"], "b": ["OLEOSIDADE", "do cabelo"], "germ": "ÁCAROS", "s": ["NARIZ ENTUPIDO", "respirar fica difícil", "ESPIRROS", "ALERGIA"], "bad": ["MANCHAS AMARELAS", "MOFO", "MILHÕES DE ÁCAROS", "CHEIRO"], "good": "TRAVESSEIRO NOVO"},
    steps: [{"text": "LAVAR", "sub": "a cada poucos meses", "word": 6}, {"text": "TROCAR", "sub": "quando ficar amassado", "word": 8}],
  }),
});
