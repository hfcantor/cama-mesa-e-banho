// ============================================================================
//  E SE...? — Episódio 01: "E se a Lua caísse na Terra?"
//  HISTÓRIAS DO TABOCAL
// ----------------------------------------------------------------------------
//  ROTEIRO: as falas abaixo (lines) são o texto da narração. A legenda usa
//  EXATAMENTE este texto. Se o roteiro aprovado for diferente, altere apenas
//  o campo "text" de cada fala (mantendo os ids L01, L02...). As cenas e
//  efeitos estão ancorados nas falas/palavras, então se reajustam sozinhos.
//
//  NARRAÇÃO: audio/ep01/narracao/L01.mp3 ... L14.mp3 + timings.json
//  (gerados por tools/gerar_narracao.py com edge-tts, voz pt-BR-AntonioNeural).
// ============================================================================
import * as THREE from 'three';
import { cameraPath, shake, smooth, clamp01 } from '../../js/render/stage.js';
import { drawOpeningTitle, drawMidCTA, drawCounter, drawChip, drawLetterLabel, drawAlertBanner, drawEndCard, heartIcon, COLORS } from '../../js/render/overlays.js';

const lerp = (a, b, k) => a + (b - a) * k;

// Impactos de meteoros: âncoras usadas AO MESMO TEMPO pelo visual e pelo som
const IMPACTS = [
  { at: { line: 'L10', word: 'cobriram', offset: 0.15 }, x: -9, z: -22, size: 2.2, from: [-0.55, 1, -0.5] },
  { at: { line: 'L10', word: 'ceu', offset: 0.2 }, x: 12, z: -30, size: 2.6, from: [0.4, 1, -0.6] },
  { at: { line: 'L10', word: 'chuva', offset: 0.0 }, x: -16, z: -12, size: 2.0, from: [-0.7, 1, -0.2] },
  { at: { line: 'L10', word: 'meteoros', offset: 0.25 }, x: 7, z: -14, size: 3.0, from: [0.3, 1, -0.5] },
  { at: { line: 'L10', word: 'caiu', offset: 0.1 }, x: -4, z: -34, size: 3.4, from: [-0.2, 1, -0.6] },
  { at: { line: 'L10', word: 'planeta', offset: 0.0 }, x: 16, z: -9, size: 2.4, from: [0.6, 1, -0.3] },
  { at: { line: 'L10', end: true, offset: 0.35 }, x: -2, z: -18, size: 4.2, from: [0, 1, -0.45] },
];
const BREAK = { line: 'L09', word: 'pedacos', offset: 0.05 };
const MOON_ROCHE = [3, 22, 18]; // ~29 unidades do centro da Terra (raio 10) ≈ limite de Roche

export default {
  id: 'ep01',
  titulo: 'E se a Lua caísse na Terra?',
  roteiroStatus: 'aprovado', // troque para 'aprovado' quando o texto final estiver validado
  intro: 1.25, // segundos antes da primeira fala (abertura com o logo)
  narration: {
    dir: 'audio/ep01/narracao/',
    formats: ['mp3', 'wav', 'ogg', 'm4a'],
    timings: 'audio/ep01/narracao/timings.json',
  },

  // ---------------------------- ROTEIRO ----------------------------------
  // emph: palavras destacadas na legenda (chave sem acento/pontuação → cor)
  lines: [
    { id: 'L01', text: 'E se... a Lua começasse a cair em direção à Terra?', emph: { lua: 'gold', terra: 'blue', cair: 'red' }, pause: 0.7 },
    { id: 'L02', text: 'Numa noite comum, aqui no Tabocal, o Tito percebeu algo estranho.', emph: { tabocal: 'gold', estranho: 'red' }, pause: 0.35 },
    { id: 'L03', text: 'A Lua estava maior. Muito maior.', emph: { maior: 'gold', muito: 'red' }, pause: 0.8 },
    { id: 'L04', text: 'Em poucas horas, as marés subiram como nunca. O mar engoliu praias inteiras.', emph: { mares: 'blue', engoliu: 'red' }, pause: 0.5 },
    { id: 'L05', text: 'A gravidade da Lua puxava a própria crosta da Terra… e os terremotos começaram.', emph: { gravidade: 'gold', terremotos: 'red' }, pause: 0.6 },
    { id: 'L06', text: 'Nos observatórios, os cientistas não acreditavam no que viam.', emph: { cientistas: 'blue', acreditavam: 'gold' }, pause: 0.5 },
    { id: 'L07', text: 'Se tá curtindo, já deixa o like e segue o perfil… porque o pior ainda vai acontecer.', emph: { like: 'red', segue: 'gold', pior: 'red' }, pause: 0.55 },
    { id: 'L08', text: 'A dezoito mil quilômetros, a Lua cruzou o limite de Roche.', emph: { dezoito: 'gold', mil: 'gold', roche: 'orange' }, pause: 0.35 },
    { id: 'L09', text: 'E a gravidade da Terra começou a rasgá-la em pedaços.', emph: { rasgala: 'red', pedacos: 'red' }, pause: 0.8 },
    { id: 'L10', text: 'Bilhões de rochas cobriram o céu… e uma chuva de meteoros caiu sobre o planeta.', emph: { bilhoes: 'gold', meteoros: 'orange', planeta: 'red' }, pause: 1.3 },
    { id: 'L11', text: 'Quando a poeira baixou, a Terra tinha ganhado algo novo: anéis. Como Saturno.', emph: { aneis: 'gold', saturno: 'gold' }, pause: 1.0 },
    { id: 'L12', text: 'Mas calma. Na vida real, a Lua está se afastando: quase quatro centímetros por ano.', emph: { calma: 'green', afastando: 'green', quatro: 'gold', centimetros: 'gold' }, pause: 0.5 },
    { id: 'L13', text: 'Ou seja… o Tito pode dormir tranquilo.', emph: { tranquilo: 'green' }, pause: 0.8 },
    { id: 'L14', text: 'E você? Acha que a humanidade sobreviveria? Comenta aí!', emph: { sobreviveria: 'gold', comenta: 'blue' }, pause: 0.6 },
  ],

  // ------------------------- EFEITOS GLOBAIS -----------------------------
  cues: [
    ...IMPACTS.flatMap((im, i) => [
      { sfx: 'meteor', at: { ...im.at, offset: (im.at.offset || 0) - 1.4 }, p: { dur: 1.4, level: 0.2, from: im.from[0] < 0 ? -0.8 : 0.8, to: 0, seed: i } },
      { sfx: 'explosion', at: im.at, p: { level: 0.3 + im.size * 0.05, pan: im.x / 25, seed: i } },
    ]),
  ],

  // ------------------------------ CENAS ----------------------------------
  scenes: [
    // 1. ABERTURA — pergunta "E SE...?"
    {
      id: 'abertura', world: 'space', start: { at: 0 }, transition: 'fade',
      music: { mood: 'mystery', intensity: 0.4 },
      cues: [
        { sfx: 'logo', at: { local: 0.35 }, p: { level: 0.45 } },
        { sfx: 'whoosh', at: { local: 0.2 }, p: { dur: 0.8, level: 0.3 } },
        { sfx: 'riser', at: { line: 'L01', word: 'cair', offset: -0.4 }, until: { after: 'L01', offset: 0.5 }, p: { level: 0.2 } },
      ],
      setup(w) { Object.assign(w.state, { moonPos: [14, 19, 6], moonDist: 42, moonAngle: 0.85, moonY: 16, stretch: 0, crack: 0, ring: 0, broken: -1, roche: 0 }); },
      update(w, c) {
        const k = c.k({ line: 'L01', word: 'cair' }, { after: 'L01', offset: 0.6 });
        w.state.moonPos = [lerp(14, 10, k * k), lerp(19, 15, k * k), lerp(6, 9, k * k)];
        cameraPath(c.cam, [
          { u: 0, pos: [-6, 10, 120], look: [2, 22, 0], fov: 40 },
          { u: 1, pos: [12, 3, 58], look: [6, 13, 0], fov: 48 },
        ], c.u);
      },
      draw2D(g, c) { drawOpeningTitle(g, c.lt, c.dur, c.t); },
    },

    // 2. GANCHO — noite no Tabocal, a Lua está maior
    {
      id: 'vila', world: 'village', start: { line: 'L02', offset: -0.35 }, transition: 'whip',
      music: { mood: 'mystery', intensity: 0.6 },
      cues: [
        { sfx: 'crickets', span: 'scene', p: { level: 0.05 } },
        { sfx: 'wind', span: 'scene', p: { level: 0.12 } },
        { sfx: 'steps', at: { local: 0.5 }, p: { count: 5, step: 0.36 } },
        { sfx: 'heartbeat', at: { line: 'L03' }, until: { after: 'L03', offset: 0.6 }, p: { bpm: 70, bpmEnd: 100, level: 0.7 } },
        { sfx: 'braam', at: { line: 'L03', word: 'muito' }, p: { dur: 3, level: 0.4 } },
        { sfx: 'whoosh', at: { line: 'L03', word: 'muito', offset: -0.3 }, p: { dur: 0.5, level: 0.25 } },
      ],
      setup(w) {
        w.reset();
        Object.assign(w.state, { moonScale: 9, moonY: 62, fire: 0, dawn: 0, ring: 0, quake: 0, crack: 0, windowsOn: 1 });
        w.setMeteors([]);
        w.tito.root.position.set(1.5, 0, 2);
        w.tito.root.rotation.y = Math.PI - 0.15;
      },
      update(w, c) {
        const tito = w.tito;
        // Tito caminha pelo quintal e para
        const walkK = c.k({ local: 0.3 }, { line: 'L02', word: 'percebeu' });
        tito.root.position.z = lerp(4, 0.8, walkK);
        tito.pose.walk = walkK > 0 && walkK < 1 ? 1 : 0;
        const notice = c.k({ line: 'L02', word: 'percebeu' }, { line: 'L02', word: 'estranho' });
        tito.pose.lookPitch = notice * 0.55;
        tito.pose.surprise = c.k({ line: 'L03', word: 'maior' }, { line: 'L03', word: 'maior', offset: 0.4 });
        tito.pose.scared = c.k({ line: 'L03', word: 'muito' }, { after: 'L03' }) * 0.7;
        tito.pose.point = c.k({ line: 'L03' }, { line: 'L03', word: 'maior' }) * (1 - c.k({ line: 'L03', word: 'muito' }, { after: 'L03' }));
        // Lua cresce em duas etapas ("maior" / "Muito maior")
        const g1 = c.k({ line: 'L03', word: 'maior' }, { line: 'L03', word: 'maior', offset: 0.7 });
        const g2 = c.k({ line: 'L03', word: 'muito' }, { after: 'L03', offset: 0.3 });
        w.state.moonScale = 9 + g1 * 9 + g2 * 16;
        w.state.moonY = 62 - g2 * 10;
        const zoom = c.k({ line: 'L03', word: 'muito', offset: -0.2 }, { after: 'L03', offset: 0.3 });
        cameraPath(c.cam, [
          { u: 0, pos: [10, 16, 26], look: [0, 5, -30], fov: 50 },
          { u: 0.55, pos: [3.2, 1.6, 5.6], look: [-2, 6, -40], fov: 50 },
          { u: 1, pos: [2.6, 1.2, 4.4], look: [-6, 14, -80], fov: 46 },
        ], c.k({ local: 0 }, { line: 'L03', word: 'muito', offset: -0.2 }));
        if (zoom > 0) { c.cam.fov = lerp(46, 30, zoom); c.cam.updateProjectionMatrix(); }
        shake(c.cam, zoom * 0.04, c.t);
      },
    },

    // 3. DESENVOLVIMENTO — marés gigantes
    {
      id: 'mares', world: 'ocean', start: { line: 'L04', offset: -0.3 }, transition: 'flash',
      music: { mood: 'tension', intensity: 0.5 },
      cues: [
        { sfx: 'ocean', span: 'scene', p: { level: 0.55, rising: true } },
        { sfx: 'wind', span: 'scene', p: { level: 0.3, storm: true } },
        { sfx: 'thunder', at: { line: 'L04', word: 'subiram' }, p: { level: 0.45 } },
        { sfx: 'splash', at: { line: 'L04', word: 'engoliu' }, p: { level: 0.6 } },
      ],
      setup(w) { w.reset(); Object.assign(w.state, { level: -1, waveAmp: 0.6, moonScale: 34, flash: 0, rain: 0 }); },
      update(w, c) {
        const rise = c.k({ line: 'L04', word: 'subiram' }, { line: 'L04', word: 'inteiras' });
        w.state.level = lerp(-1.2, 4.2, rise);
        w.state.waveAmp = lerp(0.6, 2.6, c.k({ local: 0 }, { line: 'L04', word: 'engoliu' }));
        w.state.rain = c.k({ line: 'L04', word: 'horas' }, { line: 'L04', word: 'nunca' });
        const th = c.since({ line: 'L04', word: 'subiram' });
        w.state.flash = th > 0 && th < 0.5 ? (Math.sin(th * 40) > 0 ? 1 - th * 2 : 0.2) : 0;
        cameraPath(c.cam, [
          { u: 0, pos: [-3, 2.4, 4], look: [8, 14, -200], fov: 52 },
          { u: 0.5, pos: [-1, 4.5, 16], look: [6, 9, -150], fov: 52 },
          { u: 1, pos: [2, 10, 34], look: [4, 3, -60], fov: 56 },
        ], c.u);
        shake(c.cam, 0.05 * w.state.waveAmp / 2.6, c.t);
      },
    },

    // 4. ESCALADA — terremotos no Tabocal
    {
      id: 'terremoto', world: 'village', start: { line: 'L05', offset: -0.3 }, transition: 'whip',
      music: { mood: 'tension', intensity: 0.85 },
      cues: [
        { sfx: 'rumble', at: { line: 'L05', word: 'puxava' }, span: 'scene', p: { level: 0.5 } },
        { sfx: 'crack', at: { line: 'L05', word: 'terremotos' }, p: { level: 0.7 } },
        { sfx: 'impact', at: { line: 'L05', word: 'terremotos' }, p: { level: 0.8 } },
        { sfx: 'steps', at: { line: 'L05', word: 'terremotos', offset: 0.3 }, p: { count: 6, step: 0.2, level: 0.3 } },
      ],
      setup(w) {
        w.reset();
        Object.assign(w.state, { moonScale: 30, moonY: 46, fire: 0, dawn: 0, ring: 0, quake: 0, crack: 0, windowsOn: 1 });
        w.setMeteors([]);
        w.tito.root.position.set(0, 0, -3); w.tito.root.rotation.y = 0.1;
      },
      update(w, c) {
        const q = c.k({ line: 'L05', word: 'puxava' }, { line: 'L05', word: 'terremotos' });
        const big = c.k({ line: 'L05', word: 'terremotos' }, { line: 'L05', word: 'terremotos', offset: 0.6 });
        w.state.quake = q * 0.45 + big * 0.55;
        w.state.crack = c.k({ line: 'L05', word: 'terremotos' }, { after: 'L05', offset: 0.5 });
        const run = c.k({ line: 'L05', word: 'terremotos', offset: 0.2 }, { line: 'L05', word: 'terremotos', offset: 0.5 });
        w.tito.pose.scared = Math.max(q, big);
        w.tito.pose.run = run;
        w.tito.pose.armsUp = run * 0.6;
        w.tito.pose.surprise = big;
        w.tito.root.position.z = -3 + Math.max(0, c.since({ line: 'L05', word: 'terremotos', offset: 0.3 })) * 3.4;
        cameraPath(c.cam, [
          { u: 0, pos: [0, 1.4, 6], look: [0, 5, -40], fov: 52 },
          { u: 1, pos: [1.2, 2.2, 9], look: [0, 3, -30], fov: 56 },
        ], c.u);
        c.cam.position.z = Math.max(c.cam.position.z, w.tito.root.position.z + 5);
        shake(c.cam, w.state.quake * 0.14, c.t);
      },
      draw2D(g, c) {
        const a = c.k({ line: 'L05', word: 'terremotos' }, { line: 'L05', word: 'terremotos', offset: 0.3 }) * (1 - c.k({ fromEnd: 0.5 }, { fromEnd: 0.1 }));
        drawAlertBanner(g, 'ALERTA SÍSMICO', c.since({ line: 'L05', word: 'terremotos' }), c.t, a);
      },
    },

    // 5. Observatório — cientistas em choque
    {
      id: 'observatorio', world: 'lab', start: { line: 'L06', offset: -0.3 }, transition: 'glitch',
      music: { mood: 'tension', intensity: 0.7 },
      cues: [
        { sfx: 'tech', at: { local: 0.1 }, p: { count: 10, step: 0.08 } },
        { sfx: 'alarm', at: { line: 'L06', word: 'cientistas' }, span: 'scene', p: { level: 0.09 } },
        { sfx: 'siren', at: { line: 'L06', word: 'acreditavam' }, span: 'scene', p: { level: 0.1 } },
        { sfx: 'tech', at: { line: 'L06', word: 'viam' }, p: { count: 14, step: 0.06, seed: 3 } },
      ],
      setup(w) { Object.assign(w.state, { alarm: 0, dist: 150000, moonScale: 9, alert: 0, chart: 0 }); },
      update(w, c) {
        w.state.chart = c.u * 1.4;
        w.state.dist = lerp(150000, 61000, c.u);
        w.state.alarm = c.k({ line: 'L06', word: 'cientistas' }, { line: 'L06', word: 'cientistas', offset: 0.4 });
        w.state.alert = w.state.alarm;
        w.state.moonScale = lerp(9, 13, c.u);
        const turn = c.k({ line: 'L06', word: 'acreditavam' }, { line: 'L06', word: 'viam' });
        w.sci1.pose.typing = 1 - turn; w.sci2.pose.typing = 1 - turn;
        w.sci1.pose.cover = turn; w.sci1.pose.scared = turn;
        w.sci2.pose.surprise = turn; w.sci2.pose.lookPitch = turn * 0.4; w.sci2.pose.point = turn;
        w.sci1.root.rotation.y = lerp(Math.PI, 0.35, turn);
        w.sci2.root.rotation.y = lerp(Math.PI, -0.35, turn);
        cameraPath(c.cam, [
          { u: 0, pos: [0.4, 2.6, 1.6], look: [0, 1.9, -6], fov: 50 },
          { u: 0.6, pos: [0, 1.9, -1.2], look: [0, 1.6, -4.6], fov: 46 },
          { u: 1, pos: [0.6, 1.7, -1.8], look: [0, 30, 30], fov: 62 },
        ], c.u);
      },
    },

    // 6. Meio do vídeo: chamada para curtir/seguir sem interromper — Lua se aproximando
    {
      id: 'aproximacao', world: 'space', start: { line: 'L07', offset: -0.3 }, transition: 'zoom',
      music: { mood: 'tension', intensity: 0.9 },
      cues: [
        { sfx: 'pop', at: { line: 'L07', offset: 0.1 }, p: { level: 0.25 } },
        { sfx: 'ding', at: { line: 'L07', word: 'like' }, p: { level: 0.14 } },
        { sfx: 'pop', at: { line: 'L07', word: 'segue' }, p: { level: 0.2, freq: 700 } },
        { sfx: 'heartbeat', at: { line: 'L07', word: 'pior' }, until: { line: 'L08', word: 'roche' }, p: { bpm: 80, bpmEnd: 130, level: 0.75 } },
        { sfx: 'riser', at: { line: 'L08' }, until: { line: 'L08', word: 'roche' }, p: { level: 0.25 } },
        { sfx: 'braam', at: { line: 'L08', word: 'roche' }, p: { dur: 3.5, level: 0.5 } },
        { sfx: 'alarm', at: { line: 'L08', word: 'roche' }, span: 'scene', p: { level: 0.06 } },
      ],
      setup(w) { w.reset(); Object.assign(w.state, { moonPos: [8, 64, 18], stretch: 0, crack: 0, ring: 0, broken: -1, roche: 0 }); },
      update(w, c) {
        const roche = { line: 'L08', word: 'roche' };
        const appr = Math.pow(c.k({ local: 0 }, roche), 1.3);
        w.state.moonPos = [lerp(8, MOON_ROCHE[0], appr), lerp(64, MOON_ROCHE[1], appr), MOON_ROCHE[2]];
        w.state.roche = c.k({ line: 'L08', word: 'limite' }, roche);
        w.state.stretch = c.k(roche, { fromEnd: 0 }) * 0.25;
        cameraPath(c.cam, [
          { u: 0, pos: [-6, 22, 112], look: [0, 22, 0], fov: 48 },
          { u: 1, pos: [-14, 12, 70], look: [1, 14, 6], fov: 50 },
        ], c.u);
        shake(c.cam, c.k(roche, { fromEnd: 0 }) * 0.12, c.t);
      },
      draw2D(g, c) {
        const L7 = c.tl.byId.L07;
        drawMidCTA(g, c.t - L7.start + 0.1, L7.end - L7.start + 0.5, c.t);
        const dist = lerp(384400, 18000, Math.pow(c.k({ local: 0 }, { line: 'L08', word: 'roche' }), 1.6));
        const showD = c.k({ line: 'L07', word: 'pior' }, { line: 'L07', word: 'pior', offset: 0.4 });
        drawCounter(g, 'DISTÂNCIA DA LUA', Math.round(dist / 100) * 100 > 0 ? Math.round(dist).toLocaleString('pt-BR') + ' km' : '', 540, 640, { alpha: showD, danger: c.k({ line: 'L08' }, { line: 'L08', word: 'roche' }) });
        const lab = c.since({ line: 'L08', word: 'roche' });
        if (lab > 0) drawLetterLabel(g, 'LIMITE DE ROCHE', 'a gravidade da Terra vence a da Lua', lab, 1, 860);
      },
    },

    // 7. A Lua se despedaça
    {
      id: 'ruptura', world: 'space', start: { line: 'L09', offset: -0.25 }, transition: 'flash',
      music: { mood: 'action', intensity: 0.8 },
      cues: [
        { sfx: 'rumble', at: { line: 'L09' }, until: BREAK, p: { level: 0.4 } },
        { sfx: 'crack', at: { line: 'L09', word: 'rasgala' }, p: { level: 0.5 } },
        { sfx: 'crack', at: { line: 'L09', word: 'rasgala', offset: 0.35 }, p: { level: 0.6 } },
        { sfx: 'explosion', at: BREAK, p: { level: 0.6 } },
        { sfx: 'braam', at: BREAK, p: { dur: 3.5, level: 0.35, freqs: [29.1, 58.3, 87.3, 116.5] } },
      ],
      setup(w) { w.reset(); Object.assign(w.state, { moonPos: MOON_ROCHE, stretch: 0.25, crack: 0, ring: 0, broken: -1, roche: 0.6 }); },
      update(w, c) {
        w.state.stretch = 0.25 + c.k({ line: 'L09' }, BREAK) * 0.75;
        w.state.crack = c.k({ line: 'L09', word: 'comecou' }, BREAK);
        w.state.roche = 0.6 * (1 - c.k(BREAK, { fromEnd: 0 }));
        const b = c.since(BREAK);
        w.state.broken = b >= 0 ? b : -1;
        const mp = MOON_ROCHE;
        cameraPath(c.cam, [
          { u: 0, pos: [mp[0] - 4, mp[1] + 1, mp[2] + 13], look: [mp[0], mp[1] - 2, mp[2]], fov: 44 },
          { u: 1, pos: [mp[0] - 12, mp[1] + 4, mp[2] + 34], look: [mp[0] * 0.5, mp[1] * 0.55, mp[2] * 0.5], fov: 56 },
        ], c.u);
        shake(c.cam, w.state.crack * 0.15 + (b > 0 ? Math.max(0, 1 - b) * 0.8 : 0), c.t);
      },
      draw2D(g, c) {
        const b = c.since(BREAK);
        if (b > 0 && b < 0.6) { g.fillStyle = `rgba(255,220,180,${(1 - b / 0.6) * 0.9})`; g.fillRect(0, 0, 1080, 1920); }
      },
    },

    // 8. CLÍMAX — chuva de meteoros sobre o Tabocal
    {
      id: 'meteoros', world: 'village', start: { line: 'L10', offset: -0.3 }, transition: 'fade',
      music: { mood: 'action', intensity: 1 },
      cues: [
        { sfx: 'wind', span: 'scene', p: { level: 0.2, storm: true } },
        { sfx: 'siren', at: { line: 'L10', offset: 0.4 }, span: 'scene', p: { level: 0.08, pan: -0.5, rate: 0.35 } },
      ],
      setup(w, c) {
        w.reset();
        Object.assign(w.state, { moonScale: 0, fire: 0, dawn: 0, ring: 0, quake: 0, crack: 0, windowsOn: 1 });
        w.setMeteors(IMPACTS.map(im => ({ ...im, time: c.T(im.at) })));
        w.tito.root.position.set(0, 0, -6); w.tito.root.rotation.y = 0;
      },
      update(w, c) {
        w.state.fire = c.k({ line: 'L10' }, { line: 'L10', word: 'meteoros' });
        w.state.windowsOn = 1 - c.k({ line: 'L10', word: 'caiu' }, { line: 'L10', word: 'caiu', offset: 0.3 });
        const tito = w.tito;
        const runK = c.k({ line: 'L10', word: 'cobriram' }, { line: 'L10', word: 'caiu' });
        tito.pose.run = runK > 0 && runK < 1 ? 1 : 0;
        tito.pose.scared = 1;
        tito.pose.cover = runK >= 1 ? 1 : 0;
        tito.pose.lookPitch = runK >= 1 ? -0.2 : 0.25;
        tito.root.position.z = lerp(-6, 2.2, runK);
        let sh = 0;
        for (const im of w.impacts) { const k = c.t - im.time; if (k >= 0 && k < 1.5) sh += (1 - k / 1.5) * im.size * 0.07; }
        w.state.quake = Math.min(1, sh * 2);
        cameraPath(c.cam, [
          { u: 0, pos: [-2, 1, 8], look: [0, 10, -30], fov: 58 },
          { u: 0.6, pos: [2, 1.4, 6.5], look: [0, 5, -24], fov: 54 },
          { u: 1, pos: [6, 7, 16], look: [0, 4, -22], fov: 52 },
        ], c.u);
        shake(c.cam, sh, c.t);
      },
      draw2D(g, c) {
        const w = c.world;
        const f = w.flash();
        if (f > 0) { g.fillStyle = `rgba(255,200,140,${Math.min(0.3, f * 0.25)})`; g.fillRect(0, 0, 1080, 1920); }
      },
    },

    // 9. FINAL (parte 1) — a Terra com anéis
    {
      id: 'aneis', world: 'space', start: { line: 'L11', offset: -0.6 }, transition: 'fade',
      music: { mood: 'wonder', intensity: 0.7 },
      cues: [
        { sfx: 'shimmer', at: { line: 'L11', word: 'aneis' }, p: { level: 0.14 } },
        { sfx: 'shimmer', at: { line: 'L11', word: 'saturno' }, p: { level: 0.1, notes: [1568, 1975.5, 2349, 3136] } },
        { sfx: 'whoosh', at: { local: 0.2 }, p: { dur: 1.4, level: 0.2 } },
      ],
      setup(w) { w.reset(); Object.assign(w.state, { moonPos: MOON_ROCHE, stretch: 1, crack: 1, ring: 0, roche: 0 }); },
      update(w, c) {
        w.state.broken = Math.max(9, c.since(BREAK));
        w.state.ring = c.k({ line: 'L11', word: 'novo' }, { line: 'L11', word: 'saturno' });
        cameraPath(c.cam, [
          { u: 0, pos: [-20, 30, 80], look: [0, 0, 0], fov: 40 },
          { u: 1, pos: [48, 9, 46], look: [0, -1, 0], fov: 50 },
        ], c.u);
      },
      draw2D(g, c) {
        const a = c.k({ line: 'L11', word: 'saturno' }, { line: 'L11', word: 'saturno', offset: 0.4 }) * (1 - c.k({ fromEnd: 0.6 }, { fromEnd: 0.1 }));
        drawChip(g, 'TERRA COM ANÉIS', 540, 520, { size: 46, alpha: a, scale: 0.9 + 0.1 * a });
      },
    },

    // 10. FINAL SURPREENDENTE — na vida real, a Lua se afasta
    {
      id: 'realidade', world: 'village', start: { line: 'L12', offset: -0.35 }, transition: 'glitch',
      music: { mood: 'calm', intensity: 0.5 },
      cues: [
        { sfx: 'whoosh', at: { local: 0 }, p: { dur: 0.5, level: 0.35, reverse: true } },
        { sfx: 'crickets', span: 'scene', p: { level: 0.06 } },
        { sfx: 'pop', at: { line: 'L12', word: 'quatro' }, p: { level: 0.2 } },
      ],
      setup(w) {
        w.reset();
        Object.assign(w.state, { moonScale: 6, moonY: 70, fire: 0, dawn: 0, ring: 0, quake: 0, crack: 0, windowsOn: 1 });
        w.setMeteors([]);
        w.hammock.visible = true;
        // Tito deitado na rede: pés numa ponta, cabeça na outra
        const h = w.hammock;
        h.updateMatrixWorld(true);
        const feet = new THREE.Vector3(-1.05, 1.08, 0).applyMatrix4(h.matrixWorld);
        w.tito.root.position.copy(feet);
        w.tito.root.rotation.set(-Math.PI / 2 + 0.25, h.rotation.y - Math.PI / 2, 0, 'YXZ');
        Object.assign(w.tito.pose, { sleep: 1, smile: 0.6 });
        Object.assign(w.tito.cur, { sleep: 1, smile: 0.6 });
      },
      update(w, c) {
        // a Lua encolhe (se afastando)
        w.state.moonScale = lerp(7.5, 5.2, c.k({ line: 'L12', word: 'afastando' }, { line: 'L12', word: 'ano' }));
        const down = c.k({ line: 'L13', offset: -0.4 }, { line: 'L13', word: 'dormir' });
        cameraPath(c.cam, [
          { u: 0, pos: [2, 1.5, 6], look: [-14, 40, -200], fov: 34 },
          { u: 1, pos: [-0.6, 2.6, 2.2], look: [-3.6, 0.9, -1.6], fov: 42 },
        ], down);
      },
      draw2D(g, c) {
        const a = c.k({ line: 'L12', word: 'quatro' }, { line: 'L12', word: 'quatro', offset: 0.3 }) * (1 - c.k({ line: 'L13', offset: -0.5 }, { line: 'L13' }));
        drawChip(g, '+3,8 cm por ano', 540, 560, { size: 52, alpha: a, scale: 0.8 + 0.2 * a, border: COLORS.green, color: '#c8ffd0' });
        const zz = c.since({ line: 'L13', word: 'dormir' });
        if (zz > 0) {
          g.save(); g.font = '900 64px Montserrat, sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center';
          for (let i = 0; i < 3; i++) { const k = ((zz * 0.6 + i / 3) % 1); g.globalAlpha = Math.sin(k * Math.PI) * clamp01(zz); g.fillText('z', 620 + k * 120 + i * 10, 760 - k * 260); }
          g.restore();
        }
      },
    },

    // 11. CHAMADA PARA AÇÃO — pergunta ao público
    {
      id: 'pergunta', world: 'village', start: { line: 'L14', offset: -0.3 }, transition: 'whip',
      music: { mood: 'calm', intensity: 0.7 },
      cues: [
        { sfx: 'crickets', span: 'scene', p: { level: 0.05 } },
        { sfx: 'pop', at: { line: 'L14', word: 'comenta' }, p: { level: 0.28, freq: 620 } },
      ],
      setup(w) {
        w.reset();
        Object.assign(w.state, { moonScale: 6, moonY: 70, fire: 0, dawn: 0, ring: 0, quake: 0, crack: 0, windowsOn: 1 });
        w.tito.root.position.set(0.3, 0, 1.5); w.tito.root.rotation.set(0, 0.25, 0);
      },
      update(w, c) {
        w.tito.pose.wave = c.k({ line: 'L14', word: 'comenta', offset: -0.2 }, { line: 'L14', word: 'comenta', offset: 0.2 });
        w.tito.pose.smile = 0.8;
        w.tito.pose.lookPitch = 0.05;
        w.tito.pose.surprise = c.k({ line: 'L14', word: 'acha' }, { line: 'L14', word: 'sobreviveria' }) * (1 - w.tito.pose.wave) * 0.5;
        cameraPath(c.cam, [
          { u: 0, pos: [1.2, 1.6, 6.5], look: [0.3, 1.3, 1.5], fov: 40 },
          { u: 1, pos: [0.9, 1.4, 4.8], look: [0.3, 1.35, 1.5], fov: 38 },
        ], c.u);
      },
      draw2D(g, c) {
        const a = c.k({ line: 'L14', word: 'comenta' }, { line: 'L14', word: 'comenta', offset: 0.3 });
        drawChip(g, 'COMENTA AÍ 💬', 540, 330, { size: 54, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.blue });
        void heartIcon;
      },
    },

    // 12. TELA FINAL OBRIGATÓRIA — HISTÓRIAS DO TABOCAL
    {
      id: 'final', world: 'village', start: { after: 'L14', offset: 0.5 }, transition: 'flash', duration: 6.8,
      music: { mood: 'outro', intensity: 0.9 },
      cues: [
        { sfx: 'logo', at: { local: 0.15 }, p: { level: 0.55 } },
        { sfx: 'whoosh', at: { local: 1.3 }, p: { dur: 0.5, level: 0.2 } },
        { sfx: 'pop', at: { local: 2.1 }, p: { level: 0.3, freq: 500 } },
        { sfx: 'ding', at: { local: 2.15 }, p: { level: 0.12 } },
        { sfx: 'pop', at: { local: 2.45 }, p: { level: 0.3, freq: 620 } },
        { sfx: 'pop', at: { local: 2.8 }, p: { level: 0.3, freq: 760 } },
        { sfx: 'shimmer', at: { local: 3.1 }, p: { level: 0.1 } },
      ],
      setup(w) {
        w.reset();
        Object.assign(w.state, { moonScale: 0, fire: 0, dawn: 1, ring: 0.9, quake: 0, crack: 0, windowsOn: 0.3 });
        w.tito.root.position.set(-1, 0, 0); w.tito.root.rotation.set(0, Math.PI - 0.3, 0);
        w.tito.pose.lookPitch = 0.5;
      },
      update(w, c) {
        cameraPath(c.cam, [
          { u: 0, pos: [3, 1.5, 7], look: [0, 8, -40], fov: 52 },
          { u: 1, pos: [4, 6, 14], look: [0, 30, -120], fov: 56 },
        ], c.u);
      },
      draw2D(g, c) { drawEndCard(g, c.lt, c.dur, c.t); },
      noSubtitles: true, noBug: true,
    },
  ],
};

// utilitário exportado para outros episódios
export { smooth };
