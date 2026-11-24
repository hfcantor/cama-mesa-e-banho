// ============================================================================
//  E SE...? — Episódio 07: "E se ninguém pudesse mentir por 24 horas?"
//  HISTÓRIAS DO TABOCAL  ·  PERSONAGENS 3D + ELENCO DE FIGURANTES (NPCs)
// ----------------------------------------------------------------------------
//  A partir deste episódio: personagens em 3D, cada fala com a voz do seu
//  personagem, e figurantes reagindo o tempo todo (riem, se assustam, aplaudem).
//
//  Ferramentas de RETENÇÃO usadas:
//   - gancho nos primeiros 3 s (pergunta + todo mundo reage);
//   - reações em cadeia do elenco depois de cada "verdade";
//   - chamada de like/segue no meio, ligada a um suspense ("o jantar vai ser um desastre");
//   - ENQUETE interativa com contagem regressiva (comente o número da cena);
//   - promessa de recompensa ("fica até o final, a verdade mais forte ainda não apareceu");
//   - final emocional que transforma o tema (a verdade também aproxima);
//   - pergunta final para comentar.
//
//  NARRAÇÃO: audio/ep07/narracao/L01 ... L24 — uma voz por personagem
//  (voice/rate/pitch em cada fala; gerado por tools/gerar_narracao.py ep07).
// ============================================================================
import * as THREE from 'three';
import { cameraPath, shake, clamp01 } from '../../js/render/stage.js';
import { drawOpeningTitle, drawMidCTA, drawChip, drawEndCard, COLORS, FONT_TITLE } from '../../js/render/overlays.js';
import { TSETS } from '../../js/three/worlds/town.js';

const lerp = (a, b, k) => a + (b - a) * k;
const TAU = Math.PI * 2;
const X = TSETS;
const NARR = { voice: 'pt-BR-AntonioNeural', rate: '-2%', pitch: '-2Hz' };
void NARR;

// ----- projeção 3D → tela, para etiquetas e efeitos 2D sobre os personagens -----
const _v = new THREE.Vector3();
function scr(cam, x, y, z) { _v.set(x, y, z).project(cam); return [(_v.x * 0.5 + 0.5) * 1080, (-_v.y * 0.5 + 0.5) * 1920]; }
const headOf = (cam, ch, up = 2.25) => scr(cam, ch.root.position.x, ch.root.position.y + up * ch.root.scale.y, ch.root.position.z);

// ----- atuação -----
const face = (ch, px, pz) => { ch.root.rotation.y = Math.atan2(px - ch.root.position.x, pz - ch.root.position.z); };
const speaking = (c, id) => (c.since({ line: id }) >= 0 && c.since({ after: id }) < 0.12 ? 1 : 0);
const since = (c, a) => c.since(a);
function nameTag(g, cam, ch, text, alpha = 1, color = COLORS.gold) {
  if (alpha <= 0.01) return;
  const [x, y] = headOf(cam, ch);
  drawChip(g, text, x, y - 40, { size: 34, alpha, scale: 0.8 + 0.2 * alpha, border: color });
}
// reação em cadeia do elenco: cada figurante reage com um pequeno atraso
function chain(c, list, trigger, kind, hold = 2.4, stagger = 0.07) {
  list.forEach((ch, i) => {
    const s = c.since({ ...trigger, offset: (trigger.offset || 0) + i * stagger });
    const on = s >= 0 && s < hold ? 1 : 0, k = clamp01(s / 0.2) * on;
    const p = ch.pose;
    if (kind === 'gasp') { p.surprise = k; p.cover = k * (i % 3 === 0 ? 0.8 : 0); p.armsUp = k * (i % 3 === 1 ? 0.5 : 0); p.lookPitch = 0; }
    if (kind === 'laugh') { p.laugh = k; p.smile = 1; p.point = k * (i % 2 ? 0 : 0.8); }
    if (kind === 'cheer') { p.smile = 1; p.armsUp = k * (0.7 + 0.3 * Math.sin(c.t * 14 + i)); p.laugh = k * 0.4; }
    if (kind === 'scared') { p.scared = k; p.cover = k * (i % 2 ? 0.7 : 0); }
  });
}
const idleAll = (list, t) => list.forEach((ch, i) => { ch.pose.lookYaw = Math.sin(t * 0.7 + i * 1.7) * 0.35; ch.pose.smile = 0.3; });

export default {
  id: 'ep07',
  titulo: 'E se ninguém pudesse mentir por 24 horas?',
  roteiroStatus: 'aprovado',
  intro: 1.25,
  narration: { dir: 'audio/ep07/narracao/', formats: ['wav', 'mp3'], timings: 'audio/ep07/narracao/timings.json' },

  // ---------------------------- ROTEIRO ----------------------------------
  lines: [
    { id: 'L01', text: 'E se ninguém pudesse mentir por vinte e quatro horas?', emph: { ninguem: 'gold', mentir: 'red', vinte: 'gold', horas: 'gold' }, pause: 0.6, voice: 'pt-BR-AntonioNeural', rate: '-4%', pitch: '-2Hz' },
    { id: 'L02', text: 'Hoje, no Tabocal, a mentira foi proibida. E o primeiro teste foi na padaria.', emph: { mentira: 'red', proibida: 'red', padaria: 'gold' }, pause: 0.4, voice: 'pt-BR-AntonioNeural', rate: '-2%', pitch: '-2Hz' },
    { id: 'L03', text: 'Dona Maria, gostou do meu corte de cabelo?', emph: { corte: 'gold', cabelo: 'gold' }, pause: 0.45, voice: 'pt-BR-ThalitaMultilingualNeural', rate: '+6%', pitch: '+8Hz' },
    { id: 'L04', text: 'Horrível.', emph: { horrivel: 'red' }, pause: 0.9, voice: 'pt-BR-FranciscaNeural', rate: '-14%', pitch: '-4Hz' },
    { id: 'L05', text: 'O Tito congelou. A padaria inteira também.', emph: { tito: 'gold', congelou: 'blue' }, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '-4%', pitch: '-2Hz' },
    { id: 'L06', text: 'E o pão de ontem eu vendi como se fosse de hoje.', emph: { pao: 'gold', ontem: 'red', hoje: 'green' }, pause: 0.9, voice: 'pt-BR-AntonioNeural', rate: '+4%', pitch: '+3Hz' },
    { id: 'L07', text: 'Na rua, o entregador chegou com a pizza fria.', emph: { entregador: 'gold', pizza: 'orange', fria: 'blue' }, pause: 0.4, voice: 'pt-BR-AntonioNeural', rate: '-2%', pitch: '-2Hz' },
    { id: 'L08', text: 'Por que demorou tanto?', emph: { demorou: 'red' }, pause: 0.35, voice: 'pt-BR-FranciscaNeural', rate: '+8%', pitch: '+4Hz' },
    { id: 'L09', text: 'Eu parei pra tomar sorvete.', emph: { sorvete: 'gold' }, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '+12%', pitch: '+6Hz' },
    { id: 'L10', text: 'Você fez o quê?!', emph: { voce: 'red', fez: 'red' }, pause: 0.7, voice: 'pt-BR-FranciscaNeural', rate: '+10%', pitch: '+6Hz' },
    { id: 'L11', text: 'Se tá curtindo, já deixa o like e segue o perfil… porque o jantar vai ser um desastre.', emph: { like: 'red', segue: 'gold', jantar: 'orange', desastre: 'red' }, pause: 0.55, voice: 'pt-BR-AntonioNeural', rate: '-2%', pitch: '-2Hz' },
    { id: 'L12', text: 'Na casa do seu Zé, a dona Rosa serviu o jantar e perguntou: está bom?', emph: { jantar: 'orange', perguntou: 'gold' }, pause: 0.4, voice: 'pt-BR-AntonioNeural', rate: '-2%', pitch: '-2Hz' },
    { id: 'L13', text: 'Está sem sal. E o feijão queimou.', emph: { sal: 'red', feijao: 'orange', queimou: 'red' }, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '-12%', pitch: '-9Hz' },
    { id: 'L14', text: 'Eu sei. Eu odeio cozinhar.', emph: { odeio: 'red', cozinhar: 'gold' }, pause: 0.8, voice: 'pt-BR-FranciscaNeural', rate: '-4%', pitch: '+0Hz' },
    { id: 'L15', text: 'Na entrevista de emprego, o candidato também foi sincero.', emph: { entrevista: 'gold', candidato: 'gold', sincero: 'green' }, pause: 0.4, voice: 'pt-BR-AntonioNeural', rate: '-2%', pitch: '-2Hz' },
    { id: 'L16', text: 'Eu escrevi Excel avançado no currículo, mas só sei somar.', emph: { excel: 'green', avancado: 'gold', somar: 'red' }, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '+6%', pitch: '+3Hz' },
    { id: 'L17', text: 'Contratado. Pela honestidade.', emph: { contratado: 'green', honestidade: 'gold' }, pause: 0.8, voice: 'pt-BR-AntonioNeural', rate: '-6%', pitch: '-4Hz' },
    { id: 'L18', text: 'Agora é com você. Qual dessas cenas você não aguentaria? Comenta o número!', emph: { voce: 'gold', aguentaria: 'red', numero: 'blue', comenta: 'blue' }, pause: 1.2, voice: 'pt-BR-AntonioNeural', rate: '+2%', pitch: '-1Hz' },
    { id: 'L19', text: 'Mas fica até o final, porque a verdade mais forte ainda não apareceu.', emph: { final: 'gold', verdade: 'gold', forte: 'red' }, pause: 0.6, voice: 'pt-BR-AntonioNeural', rate: '-4%', pitch: '-3Hz' },
    { id: 'L20', text: 'No fim da tarde, na praça, o seu Zé olhou nos olhos da dona Rosa.', emph: { praca: 'gold', ze: 'gold', rosa: 'gold' }, pause: 0.5, voice: 'pt-BR-AntonioNeural', rate: '-4%', pitch: '-2Hz' },
    { id: 'L21', text: 'Rosa, eu te amo. E nunca tive coragem de dizer.', emph: { amo: 'red', coragem: 'gold' }, pause: 0.7, voice: 'pt-BR-AntonioNeural', rate: '-12%', pitch: '-9Hz' },
    { id: 'L22', text: 'Eu também te amo, Zé. Há quarenta anos.', emph: { amo: 'red', quarenta: 'gold' }, pause: 0.7, voice: 'pt-BR-FranciscaNeural', rate: '-8%', pitch: '+0Hz' },
    { id: 'L23', text: 'A praça inteira aplaudiu. A verdade machuca, mas também aproxima.', emph: { aplaudiu: 'gold', verdade: 'gold', machuca: 'red', aproxima: 'green' }, pause: 0.8, voice: 'pt-BR-AntonioNeural', rate: '-4%', pitch: '-3Hz' },
    { id: 'L24', text: 'E você? O que você diria se não pudesse mentir? Comenta aí!', emph: { voce: 'gold', diria: 'gold', mentir: 'red', comenta: 'blue' }, pause: 0.6, voice: 'pt-BR-AntonioNeural', rate: '+0%', pitch: '-1Hz' },
  ],

  cues: [],

  // ------------------------------ CENAS ----------------------------------
  scenes: [
    // 1. ABERTURA / GANCHO — a praça inteira reage
    {
      id: 'abertura', world: 'town', start: { at: 0 }, transition: 'fade',
      music: { mood: 'wonder', intensity: 0.5 },
      cues: [
        { sfx: 'logo', at: { local: 0.35 }, p: { level: 0.45 } },
        { sfx: 'pop', at: { line: 'L01', word: 'mentir' }, p: { level: 0.3, freq: 600 } },
      ],
      setup(w) {
        w.reset();
        w.putTito(X.plaza, 2.4, 0);
        [[-2.2, 0.4, 1], [2.2, 0.4, 4], [-3.1, -1.4, 8], [-1.0, -1.4, 9], [1.0, -1.4, 10], [3.1, -1.4, 11], [-3.4, -3.2, 12], [-1.7, -3.2, 13], [0, -3.2, 14], [1.7, -3.2, 15], [3.4, -3.2, 16]].forEach(([dx, dz, id]) => { const ch = w.put(id, X.plaza + dx, dz, 0); face(ch, X.plaza, 9); });
      },
      update(w, c) {
        const all = w.npcs.filter((n) => n.root.visible);
        idleAll(all, c.t);
        w.tito.pose.smile = 0.9; w.tito.pose.wave = c.k({ local: 0.5 }, { local: 0.9 });
        chain(c, all, { line: 'L01', word: 'mentir' }, 'gasp', 3);
        cameraPath(c.cam, [
          { u: 0, pos: [X.plaza + 0.4, 3.2, 12.5], look: [X.plaza, 1.5, -1], fov: 50 },
          { u: 1, pos: [X.plaza, 2.8, 10.0], look: [X.plaza, 1.5, -1], fov: 48 },
        ], c.u);
      },
      draw2D(g, c) { drawOpeningTitle(g, c.lt, c.dur, c.t); },
    },

    // 2. PADARIA — "Horrível."
    {
      id: 'padaria', world: 'town', start: { line: 'L02', offset: -0.3 }, transition: 'whip',
      music: { mood: 'action', intensity: 0.55 },
      cues: [
        { sfx: 'braam', at: { line: 'L02', word: 'proibida' }, p: { dur: 2, level: 0.3 } },
        { sfx: 'impact', at: { line: 'L04', offset: 0.1 }, p: { level: 0.5, size: 0.7 } },
        { sfx: 'pop', at: { after: 'L04', offset: 0.15 }, p: { level: 0.3, freq: 460 } },
        { sfx: 'whoosh', at: { line: 'L06', offset: -0.2 }, p: { dur: 0.5, level: 0.25 } },
        { sfx: 'pop', at: { after: 'L06', offset: 0.1 }, p: { level: 0.3, freq: 560 } },
      ],
      setup(w) {
        w.reset();
        w.put(0, X.bakery + 0.2, -4.7, 0);                         // Beto, atrás do balcão
        w.put(1, X.bakery - 1.5, -1.0, 0.35);                      // Dona Maria
        w.putTito(X.bakery + 1.6, -0.4, -0.35);
        [[-3.0, 0.6, 8], [-2.6, 2.2, 9], [3.0, 0.6, 10], [2.6, 2.2, 11], [-0.2, -1.9, 12], [0.9, -2.0, 13], [-3.3, 3.8, 14]].forEach(([dx, dz, id]) => { const ch = w.put(id, X.bakery + dx, dz, 0); face(ch, X.bakery, -1); });
      },
      update(w, c) {
        const extras = w.npcs.filter((n, i) => n.root.visible && i >= 8);
        idleAll(extras, c.t);
        const [beto, maria] = [w.npcs[0], w.npcs[1]];
        w.tito.pose.talk = speaking(c, 'L03'); w.tito.pose.smile = 0.9;
        w.tito.pose.surprise = c.k({ after: 'L04' }, { after: 'L04', offset: 0.3 });
        w.tito.pose.scared = w.tito.pose.surprise * 0.6;
        maria.pose.talk = speaking(c, 'L04'); maria.pose.smile = 0; face(maria, w.tito.root.position.x, w.tito.root.position.z);
        beto.pose.talk = speaking(c, 'L06'); beto.pose.cover = 0; beto.pose.smile = 0.2; beto.pose.scared = c.k({ line: 'L06' }, { line: 'L06', offset: 0.6 }) * 0.5;
        chain(c, extras, { after: 'L04', offset: 0.05 }, 'gasp', 2.6);
        chain(c, extras.slice(0, 4), { after: 'L06', offset: 0.1 }, 'laugh', 3);
        chain(c, extras.slice(4), { after: 'L06', offset: 0.15 }, 'gasp', 3);
        const toMaria = c.k({ line: 'L03', offset: 0.2 }, { line: 'L04', offset: 0 });
        const wide = c.k({ after: 'L04', offset: 0.3 }, { line: 'L06', offset: -0.3 });
        cameraPath(c.cam, [
          { u: 0, pos: [X.bakery + 0.4, 3.1, 11.8], look: [X.bakery, 1.5, -2], fov: 50 },
          { u: 1, pos: [X.bakery - 0.9, 2.2, 6.6], look: [X.bakery - 1.5, 1.7, -1.0], fov: 38 },
        ], clamp01(toMaria * (1 - wide)));
        if (wide > 0) { const pa = lerp(0, 1, wide); c.cam.position.lerp(new THREE.Vector3(X.bakery + 0.4, 3.1, 11.8), pa * 0.95); c.cam.lookAt(X.bakery, 1.5, -2); c.cam.fov = lerp(c.cam.fov, 50, pa); c.cam.updateProjectionMatrix(); }
        shake(c.cam, speaking(c, 'L04') * 0.02, c.t);
      },
      draw2D(g, c) {
        const w = c.world;
        nameTag(g, c.cam, w.tito, 'TITO', speaking(c, 'L03'), COLORS.blue);
        nameTag(g, c.cam, w.npcs[1], 'DONA MARIA', speaking(c, 'L04'), COLORS.red);
        nameTag(g, c.cam, w.npcs[0], 'BETO · PADEIRO', speaking(c, 'L06'), COLORS.orange);
        const a = c.k({ after: 'L04', offset: 0.05 }, { after: 'L04', offset: 0.35 }) * (1 - c.k({ line: 'L06', offset: -0.2 }, { line: 'L06' }));
        drawChip(g, 'MENTIRA PROIBIDA 🚫', 540, 300, { size: 44, alpha: Math.max(a, c.k({ local: 0.3 }, { local: 0.7 }) * (1 - c.k({ line: 'L03', offset: -0.4 }, { line: 'L03' }))), border: COLORS.red });
      },
    },

    // 3. RUA — pizza fria
    {
      id: 'rua', world: 'town', start: { line: 'L07', offset: -0.3 }, transition: 'whip',
      music: { mood: 'action', intensity: 0.6 },
      cues: [
        { sfx: 'whoosh', at: { line: 'L07', offset: -0.1 }, p: { dur: 0.5, level: 0.25 } },
        { sfx: 'ding', at: { line: 'L09', word: 'sorvete' }, p: { level: 0.2 } },
        { sfx: 'impact', at: { line: 'L10', offset: 0.05 }, p: { level: 0.5, size: 0.7 } },
      ],
      setup(w) {
        w.reset();
        w.put(2, X.street - 1.3, -0.3, 0.5);                       // Davi
        w.put(3, X.street + 1.3, -1.8, -0.5);                      // Lúcia
        w.putTito(X.street + 2.4, 1.2, -0.4);
        w.pizza.visible = true;
        [[-3, -7.0, 8], [-1.8, -7.3, 9], [-0.6, -7.0, 10], [0.6, -7.3, 11], [1.8, -7.0, 12], [3, -7.3, 13]].forEach(([dx, dz, id]) => { const ch = w.put(id, X.street + dx, dz, 0); face(ch, X.street, 0); });
      },
      update(w, c) {
        const [davi, lucia] = [w.npcs[2], w.npcs[3]];
        const extras = w.npcs.filter((n, i) => n.root.visible && i >= 8);
        idleAll(extras, c.t);
        face(davi, w.npcs[3].root.position.x, w.npcs[3].root.position.z); face(lucia, davi.root.position.x, davi.root.position.z);
        davi.pose.talk = speaking(c, 'L09'); davi.pose.smile = 0.8; davi.pose.armsUp = 0;
        const rage = c.k({ line: 'L10' }, { line: 'L10', offset: 0.3 });
        lucia.pose.talk = Math.max(speaking(c, 'L08'), speaking(c, 'L10')); lucia.pose.scared = rage * 0.8; lucia.pose.point = c.k({ line: 'L08' }, { line: 'L08', offset: 0.3 }) * 0.9; lucia.pose.surprise = rage;
        w.tito.pose.surprise = c.k({ line: 'L09', word: 'sorvete' }, { line: 'L09', word: 'sorvete', offset: 0.3 }); w.tito.pose.smile = 0.4;
        const holder = davi.root.position;
        w.pizza.position.set(holder.x + 0.55, 1.15, holder.z + 0.4); w.pizza.rotation.set(0.2, t0(c) * 0, 0.05);
        chain(c, extras, { line: 'L09', word: 'sorvete', offset: 0.2 }, 'laugh', 2.5);
        chain(c, extras.slice(0, 3), { line: 'L10', offset: 0.2 }, 'gasp', 3);
        cameraPath(c.cam, [
          { u: 0, pos: [X.street + 0.6, 3.0, 11.5], look: [X.street, 1.4, -1.5], fov: 50 },
          { u: 1, pos: [X.street, 2.3, 7.8], look: [X.street, 1.5, -1.2], fov: 42 },
        ], c.u);
        shake(c.cam, rage * 0.04, c.t);
      },
      draw2D(g, c) {
        const w = c.world;
        nameTag(g, c.cam, w.npcs[3], 'LÚCIA', Math.max(speaking(c, 'L08'), speaking(c, 'L10')), COLORS.red);
        nameTag(g, c.cam, w.npcs[2], 'DAVI · ENTREGADOR', speaking(c, 'L09'), COLORS.blue);
        const a = c.k({ line: 'L10' }, { line: 'L10', offset: 0.3 });
        drawChip(g, '🍦 PAROU PRA TOMAR SORVETE', 540, 320, { size: 40, alpha: c.k({ line: 'L09', word: 'sorvete', offset: -0.1 }, { line: 'L09', word: 'sorvete', offset: 0.3 }) * (1 - a), border: COLORS.gold });
      },
    },

    // 4. CHAMADA PARA CURTIR/SEGUIR — com suspense
    {
      id: 'cta', world: 'town', start: { line: 'L11', offset: -0.3 }, transition: 'zoom',
      music: { mood: 'tension', intensity: 0.7 },
      cues: [
        { sfx: 'pop', at: { line: 'L11', offset: 0.1 }, p: { level: 0.25 } },
        { sfx: 'ding', at: { line: 'L11', word: 'like' }, p: { level: 0.14 } },
        { sfx: 'pop', at: { line: 'L11', word: 'segue' }, p: { level: 0.2, freq: 700 } },
        { sfx: 'braam', at: { line: 'L11', word: 'desastre' }, p: { dur: 2.4, level: 0.35 } },
      ],
      setup(w) {
        w.reset();
        w.putTito(X.plaza, 1.6, 0);
        [[-2.4, 0.2, 1], [2.4, 0.2, 4], [-3.2, -1.6, 8], [3.2, -1.6, 10], [-1.2, -2.8, 12], [1.2, -2.8, 13]].forEach(([dx, dz, id]) => { const ch = w.put(id, X.plaza + dx, dz, 0); face(ch, X.plaza, 5); });
      },
      update(w, c) {
        const all = w.npcs.filter((n) => n.root.visible);
        idleAll(all, c.t);
        w.tito.pose.smile = 0.6; w.tito.pose.point = c.k({ line: 'L11', word: 'like' }, { line: 'L11', word: 'segue' }) * 0.9;
        const dread = c.k({ line: 'L11', word: 'desastre', offset: -0.4 }, { line: 'L11', word: 'desastre', offset: 0.2 });
        chain(c, all, { line: 'L11', word: 'desastre', offset: -0.2 }, 'scared', 3);
        w.tito.pose.scared = dread * 0.8;
        cameraPath(c.cam, [
          { u: 0, pos: [X.plaza, 2.8, 10.5], look: [X.plaza, 1.5, -0.5], fov: 48 },
          { u: 1, pos: [X.plaza, 2.2, 8.0], look: [X.plaza, 1.5, -0.5], fov: 42 },
        ], c.u);
      },
      draw2D(g, c) {
        const L = c.tl.byId.L11;
        drawMidCTA(g, c.t - L.start + 0.1, L.end - L.start + 0.5, c.t);
      },
    },

    // 5. JANTAR — "Eu odeio cozinhar."
    {
      id: 'jantar', world: 'town', start: { line: 'L12', offset: -0.3 }, transition: 'whip',
      music: { mood: 'mystery', intensity: 0.55 },
      cues: [
        { sfx: 'pop', at: { line: 'L12', word: 'perguntou' }, p: { level: 0.2, freq: 520 } },
        { sfx: 'impact', at: { line: 'L13', offset: 0.5 }, p: { level: 0.5, size: 0.7 } },
        { sfx: 'braam', at: { line: 'L14', word: 'odeio' }, p: { dur: 1.6, level: 0.35 } },
        { sfx: 'pop', at: { after: 'L14', offset: 0.1 }, p: { level: 0.3, freq: 600 } },
      ],
      setup(w) {
        w.reset();
        const zeSeat = w.put(4, X.dinner - 2.55, -3.5, Math.PI / 2); w.seat(zeSeat, 0.9);
        const rosa = w.put(5, X.dinner + 2.55, -3.5, -Math.PI / 2); w.seat(rosa, 0.9);
        [[-1.2, -1.7, 8], [0, -1.7, 9], [1.2, -1.7, 14]].forEach(([dx, dz, id]) => { const ch = w.put(id, X.dinner + dx, dz, Math.PI); w.seat(ch, 0.9); });
        [[-1.2, -5.3, 11], [0, -5.3, 12], [1.2, -5.3, 15]].forEach(([dx, dz, id]) => { const ch = w.put(id, X.dinner + dx, dz, 0); w.seat(ch, 0.9); });
        w.putTito(X.dinner + 2.6, 0.2, -0.5);
      },
      update(w, c) {
        const [ze, rosa] = [w.npcs[4], w.npcs[5]];
        const extras = w.npcs.filter((n, i) => n.root.visible && i >= 8);
        idleAll(extras, c.t);
        ze.pose.talk = speaking(c, 'L13'); ze.pose.smile = 0; rosa.pose.talk = speaking(c, 'L14'); rosa.pose.smile = 0.1;
        rosa.pose.scared = c.k({ line: 'L13', offset: 0.6 }, { line: 'L13', offset: 1.0 }) * 0.4;
        chain(c, extras, { after: 'L13', offset: 0.05 }, 'gasp', 1.8, 0.09);
        chain(c, extras, { after: 'L14', offset: 0.1 }, 'laugh', 3.2, 0.08);
        w.tito.pose.surprise = c.k({ after: 'L13' }, { after: 'L13', offset: 0.3 }) * (1 - c.k({ after: 'L14' }, { after: 'L14', offset: 0.3 }));
        const l14 = c.k({ line: 'L14', offset: -0.2 }, { line: 'L14', offset: 0.2 });
        cameraPath(c.cam, [
          { u: 0, pos: [X.dinner + 0.3, 5.0, 11.0], look: [X.dinner, 1.5, -3.5], fov: 50 },
          { u: 1, pos: [X.dinner + 0.2, 3.4, 7.4], look: [X.dinner, 1.6, -3.5], fov: 46 },
        ], clamp01(c.k({ line: 'L13', offset: -0.5 }, { line: 'L14', offset: 0.5 })) * 0.9 + 0 * l14);
      },
      draw2D(g, c) {
        const w = c.world;
        nameTag(g, c.cam, w.npcs[4], 'SEU ZÉ', speaking(c, 'L13'), COLORS.gold);
        nameTag(g, c.cam, w.npcs[5], 'DONA ROSA', speaking(c, 'L14'), COLORS.red);
        const a = c.k({ line: 'L12', word: 'perguntou' }, { line: 'L12', word: 'perguntou', offset: 0.3 });
        drawChip(g, 'ESTÁ BOM? 🍲', 540, 300, { size: 48, alpha: a * (1 - c.k({ line: 'L13' }, { line: 'L13', offset: 0.2 })), border: COLORS.orange });
      },
    },

    // 6. ENTREVISTA — "Contratado. Pela honestidade."
    {
      id: 'entrevista', world: 'town', start: { line: 'L15', offset: -0.3 }, transition: 'whip',
      music: { mood: 'action', intensity: 0.6 },
      cues: [
        { sfx: 'pop', at: { line: 'L16', word: 'somar' }, p: { level: 0.25, freq: 480 } },
        { sfx: 'impact', at: { line: 'L16', word: 'somar', offset: 0.3 }, p: { level: 0.5, size: 0.7 } },
        { sfx: 'ding', at: { line: 'L17', word: 'contratado' }, p: { level: 0.2 } },
        { sfx: 'shimmer', at: { line: 'L17', word: 'honestidade' }, p: { level: 0.14 } },
      ],
      setup(w) {
        w.reset();
        const paulo = w.put(6, X.office + 0.4, -6.0, Math.PI); void paulo;
        w.put(7, X.office - 0.2, -3.3, Math.PI);                    // Rafa (candidato) em frente à mesa
        w.putTito(X.office + 3.0, -1.8, -0.4);
        [[-2.1, 8], [-0.7, 9], [0.7, 10], [2.1, 12]].forEach(([dx, id]) => { const ch = w.put(id, X.office + dx, 0.9, Math.PI); w.seat(ch, 0.9); });
        [[-3.1, -2.0, 13], [-3.3, -4.0, 14]].forEach(([dx, dz, id]) => { const ch = w.put(id, X.office + dx, dz, 0); face(ch, X.office, -3.5); });
      },
      update(w, c) {
        const [paulo, rafa] = [w.npcs[6], w.npcs[7]];
        const extras = w.npcs.filter((n, i) => n.root.visible && i >= 8);
        idleAll(extras, c.t);
        rafa.root.rotation.y = Math.PI;
        rafa.pose.talk = speaking(c, 'L16'); rafa.pose.smile = 0.2;
        rafa.pose.sweat = 0;
        paulo.pose.surprise = c.k({ after: 'L16' }, { after: 'L16', offset: 0.3 }) * (1 - c.k({ line: 'L17' }, { line: 'L17', offset: 0.2 }));
        paulo.pose.talk = speaking(c, 'L17'); paulo.pose.smile = c.k({ line: 'L17', word: 'honestidade' }, { line: 'L17', word: 'honestidade', offset: 0.3 });
        chain(c, extras, { after: 'L16', offset: 0.05 }, 'gasp', 1.8, 0.08);
        chain(c, extras, { line: 'L17', word: 'honestidade', offset: 0.1 }, 'cheer', 3, 0.06);
        rafa.pose.armsUp = c.k({ line: 'L17', word: 'honestidade' }, { line: 'L17', word: 'honestidade', offset: 0.3 });
        rafa.pose.laugh = rafa.pose.armsUp * 0.7;
        cameraPath(c.cam, [
          { u: 0, pos: [X.office + 0.2, 3.8, 11.0], look: [X.office, 1.5, -3.5], fov: 50 },
          { u: 1, pos: [X.office + 0.3, 3.0, 7.6], look: [X.office + 0.3, 1.7, -3.6], fov: 44 },
        ], c.u);
      },
      draw2D(g, c) {
        const w = c.world;
        nameTag(g, c.cam, w.npcs[7], 'RAFA · CANDIDATO', speaking(c, 'L16'), COLORS.blue);
        nameTag(g, c.cam, w.npcs[6], 'DR. PAULO · CHEFE', speaking(c, 'L17'), COLORS.gold);
        const a = c.k({ line: 'L17', word: 'contratado' }, { line: 'L17', word: 'contratado', offset: 0.25 });
        drawChip(g, 'CONTRATADO! ✅', 540, 330, { size: 60, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.green });
      },
    },

    // 7. ENQUETE INTERATIVA — comente o número
    {
      id: 'enquete', world: 'town', start: { line: 'L18', offset: -0.3 }, transition: 'flash',
      music: { mood: 'wonder', intensity: 0.7 },
      cues: [
        { sfx: 'pop', at: { line: 'L18', word: 'cenas' }, p: { level: 0.25, freq: 520 } },
        { sfx: 'tech', at: { after: 'L18', offset: 0.0 }, until: { after: 'L18', offset: 1.1 }, p: { count: 10, step: 0.1, level: 0.08 } },
        { sfx: 'ding', at: { after: 'L18', offset: 1.1 }, p: { level: 0.2 } },
        { sfx: 'braam', at: { line: 'L19', word: 'forte' }, p: { dur: 2, level: 0.3 } },
      ],
      setup(w) {
        w.reset();
        w.putTito(X.plaza, 2.6, 0);
        [[-2.8, -0.2], [-1.4, -1.8], [1.4, -1.8], [2.8, -0.2], [-3.2, 1.6], [3.2, 1.6], [-0.7, -3.4], [0.7, -3.4]].forEach(([dx, dz], i) => { const ch = w.put([0, 1, 2, 3, 4, 5, 6, 7][i], X.plaza + dx, dz, 0); face(ch, X.plaza, 8); });
      },
      update(w, c) {
        const all = w.npcs.filter((n) => n.root.visible);
        idleAll(all, c.t);
        w.tito.pose.point = c.k({ line: 'L18', word: 'cenas' }, { line: 'L18', word: 'cenas', offset: 0.4 }) * 0.9; w.tito.pose.smile = 0.9;
        w.tito.pose.talk = speaking(c, 'L18') || speaking(c, 'L19');
        // o elenco "pensa na resposta" (olha de lado, mão no queixo = cover leve)
        all.forEach((n, i) => { const k = c.k({ line: 'L18', word: 'aguentaria' }, { after: 'L18', offset: 1.0 }); n.pose.surprise = k * (i % 2 ? 0.5 : 0); n.pose.lookPitch = k * 0.3; });
        chain(c, all, { line: 'L19', word: 'forte', offset: 0 }, 'gasp', 2, 0.05);
        cameraPath(c.cam, [
          { u: 0, pos: [X.plaza, 2.6, 11.5], look: [X.plaza, 2.2, 0], fov: 50 },
          { u: 1, pos: [X.plaza, 2.4, 9.5], look: [X.plaza, 2.2, 0], fov: 48 },
        ], c.u);
      },
      draw2D(g, c) {
        const st = c.since({ line: 'L18', word: 'cenas', offset: -0.3 });
        const a = clamp01(st / 0.4) * (1 - c.k({ line: 'L19', offset: 0.2 }, { line: 'L19', offset: 0.7 }));
        if (a > 0.01) {
          g.save(); g.globalAlpha = a;
          g.fillStyle = 'rgba(8,10,30,0.55)'; g.fillRect(0, 150, 1080, 930);
          g.fillStyle = '#fff'; g.font = `88px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.lineWidth = 12; g.strokeStyle = '#1a0d02'; g.strokeText('QUAL VOCÊ NÃO AGUENTARIA?', 540, 240); g.fillText('QUAL VOCÊ NÃO AGUENTARIA?', 540, 240);
          const cards = [['1', 'PADARIA', 'pão', '#d9a04a'], ['2', 'PIZZA FRIA', 'pizza', '#e0432a'], ['3', 'JANTAR', 'prato', '#58b24a'], ['4', 'ENTREVISTA', 'pasta', '#2b7fd9']];
          cards.forEach(([n, label, icon, col], i) => {
            const x = 135 + i * 270, y = 560, pop = clamp01((st - 0.15 * i) / 0.35), sc = 0.6 + 0.4 * pop;
            g.save(); g.translate(x + 0, y); g.scale(sc, sc); g.globalAlpha = a * pop;
            g.beginPath(); g.roundRect(-120, -260, 240, 520, 30); g.fillStyle = '#fffaf0'; g.fill(); g.lineWidth = 9; g.strokeStyle = '#1a0d02'; g.stroke();
            g.fillStyle = col; g.beginPath(); g.arc(0, -150, 74, 0, TAU); g.fill(); g.lineWidth = 7; g.stroke();
            g.fillStyle = '#fff'; g.font = `100px ${FONT_TITLE}`; g.fillText(n, 0, -142);
            // ícone simples de cada cena
            g.fillStyle = col; g.strokeStyle = '#1a0d02'; g.lineWidth = 7;
            if (icon === 'pão') { g.beginPath(); g.ellipse(0, 20, 78, 44, 0, 0, TAU); g.fill(); g.stroke(); for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(k * 26 - 8, 0); g.lineTo(k * 26 + 8, 36); g.stroke(); } }
            if (icon === 'pizza') { g.beginPath(); g.moveTo(-70, -20); g.lineTo(70, -20); g.lineTo(0, 90); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ffd24a'; [[-24, 4], [20, 6], [0, 40]].forEach(([px, py]) => { g.beginPath(); g.arc(px, py, 11, 0, TAU); g.fill(); }); }
            if (icon === 'prato') { g.beginPath(); g.ellipse(0, 28, 80, 24, 0, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.fillStyle = '#6a3a1a'; g.beginPath(); g.ellipse(0, 20, 52, 14, 0, 0, TAU); g.fill(); }
            if (icon === 'pasta') { g.beginPath(); g.roundRect(-70, -10, 140, 100, 12); g.fill(); g.stroke(); g.beginPath(); g.roundRect(-22, -30, 44, 24, 8); g.stroke(); }
            g.fillStyle = '#1a0d02'; g.font = '800 34px Montserrat, Arial Black, sans-serif'; g.fillText(label, 0, 190);
            g.restore();
          });
          // contagem regressiva em anel
          const cd = c.since({ after: 'L18' }), total = 1.1;
          if (cd > -0.2) { const k = clamp01(cd / total); g.save(); g.translate(540, 950); g.globalAlpha = a; g.lineWidth = 16; g.strokeStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(0, 0, 70, 0, TAU); g.stroke(); g.strokeStyle = '#ffd24a'; g.beginPath(); g.arc(0, 0, 70, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - k)); g.stroke(); g.fillStyle = '#fff'; g.font = `80px ${FONT_TITLE}`; g.fillText(String(Math.max(1, Math.ceil((1 - k) * 3))), 0, 4); g.restore(); }
          g.restore();
        }
        const b = c.k({ line: 'L18', word: 'numero' }, { line: 'L18', word: 'numero', offset: 0.3 });
        drawChip(g, 'COMENTA O NÚMERO 💬', 540, 1100, { size: 48, alpha: b * (1 - c.k({ line: 'L19', offset: 0.2 }, { line: 'L19', offset: 0.6 })), scale: 0.8 + 0.2 * b, border: COLORS.blue });
        const f = c.k({ line: 'L19', word: 'final' }, { line: 'L19', word: 'final', offset: 0.3 });
        drawChip(g, 'FICA ATÉ O FINAL 👀', 540, 340, { size: 56, alpha: f, scale: 0.7 + 0.3 * f, border: COLORS.gold });
      },
    },

    // 8. PRAÇA — a verdade que aproxima
    {
      id: 'praca', world: 'town', start: { line: 'L20', offset: -0.3 }, transition: 'fade',
      music: { mood: 'calm', intensity: 0.7 },
      cues: [
        { sfx: 'shimmer', at: { line: 'L21', word: 'amo' }, p: { level: 0.14 } },
        { sfx: 'ding', at: { line: 'L22', word: 'amo' }, p: { level: 0.16 } },
        { sfx: 'pop', at: { line: 'L23', word: 'aplaudiu' }, p: { level: 0.25, freq: 640 } },
        { sfx: 'shimmer', at: { line: 'L23', word: 'aproxima' }, p: { level: 0.14, notes: [1568, 1975.5, 2349, 3136] } },
      ],
      setup(w) {
        w.reset();
        const ze = w.put(4, X.plaza - 1.1, 0, Math.PI / 2 - 0.2), rosa = w.put(5, X.plaza + 1.1, 0, -Math.PI / 2 + 0.2); void ze; void rosa;
        w.putTito(X.plaza + 3.0, 2.8, -0.5);
        [[-3.0, -1.8, 0], [-1.5, -2.6, 1], [0, -3.0, 2], [1.5, -2.6, 3], [3.0, -1.8, 6], [-3.2, 1.4, 7], [-2.4, -4.2, 8], [0, -4.8, 9], [2.4, -4.2, 10], [-1.4, 2.5, 11], [1.4, 3.0, 12], [3.3, 0.2, 13]].forEach(([dx, dz, id]) => { const ch = w.put(id, X.plaza + dx, dz, 0); face(ch, X.plaza, 0.5); });
      },
      update(w, c) {
        const [ze, rosa] = [w.npcs[4], w.npcs[5]];
        const rest = w.npcs.filter((n) => n.root.visible && n !== ze && n !== rosa);
        idleAll(rest, c.t);
        ze.pose.talk = speaking(c, 'L21'); ze.pose.smile = 0.4; rosa.pose.talk = speaking(c, 'L22'); rosa.pose.smile = 0.5;
        const love = c.k({ line: 'L22', word: 'amo' }, { line: 'L23', word: 'aplaudiu' });
        ze.pose.cover = love * 0.5; rosa.pose.laugh = love * 0.6;
        chain(c, rest, { line: 'L21', word: 'amo', offset: 0.3 }, 'gasp', 2.4, 0.04);
        chain(c, rest, { line: 'L23', word: 'aplaudiu', offset: -0.2 }, 'cheer', 5, 0.03);
        w.tito.pose.smile = 1; w.tito.pose.armsUp = c.k({ line: 'L23', word: 'aplaudiu' }, { line: 'L23', word: 'aplaudiu', offset: 0.3 }) * (0.7 + 0.3 * Math.sin(c.t * 14));
        const m = c.k({ line: 'L20' }, { line: 'L21', word: 'amo' });
        cameraPath(c.cam, [
          { u: 0, pos: [X.plaza, 3.0, 11.5], look: [X.plaza, 1.6, -0.5], fov: 50 },
          { u: 1, pos: [X.plaza, 2.0, 6.6], look: [X.plaza, 1.7, 0], fov: 40 },
        ], m);
        if (c.since({ line: 'L23', word: 'aplaudiu' }) > 0) { const o = c.k({ line: 'L23', word: 'aplaudiu' }, { line: 'L23', word: 'aproxima', offset: 0.4 }); c.cam.position.set(lerp(X.plaza, X.plaza - 1, o), lerp(2.0, 4.6, o), lerp(6.6, 13, o)); c.cam.lookAt(X.plaza, 1.6, -0.5); c.cam.fov = lerp(40, 52, o); c.cam.updateProjectionMatrix(); }
      },
      draw2D(g, c) {
        const w = c.world;
        nameTag(g, c.cam, w.npcs[4], 'SEU ZÉ', speaking(c, 'L21'), COLORS.gold);
        nameTag(g, c.cam, w.npcs[5], 'DONA ROSA', speaking(c, 'L22'), COLORS.red);
        // corações e confete
        const hs = c.since({ line: 'L21', word: 'amo' });
        if (hs > 0 && hs < 9) { for (let i = 0; i < 16; i++) { const u = ((c.t * 0.45 + i * 0.13) % 1), [hx, hy] = scr(c.cam, X.plaza + Math.sin(i * 2.4) * 2.2, 2.4 + u * 4.2, 0), a = Math.sin(u * Math.PI) * clamp01(hs / 0.6); g.save(); g.globalAlpha = a; g.translate(hx, hy); g.scale(0.6 + (i % 3) * 0.25, 0.6 + (i % 3) * 0.25); g.fillStyle = i % 2 ? '#ff4d6d' : '#ff8fa3'; g.beginPath(); g.moveTo(0, 14); g.bezierCurveTo(-34, -10, -16, -34, 0, -14); g.bezierCurveTo(16, -34, 34, -10, 0, 14); g.fill(); g.restore(); } }
        const ap = c.since({ line: 'L23', word: 'aplaudiu' });
        if (ap > 0) { for (let i = 0; i < 46; i++) { const u = ((ap * 0.6 + i * 0.071) % 1), x = (i * 97.3) % 1080, y = -40 + u * 1700; g.save(); g.translate(x, y); g.rotate(u * 9 + i); g.fillStyle = ['#ffd24a', '#ff4d6d', '#5ab0ff', '#6be37a', '#ff8a3d'][i % 5]; g.globalAlpha = clamp01(ap / 0.4); g.fillRect(-9, -5, 18, 10); g.restore(); } }
        const a = c.k({ line: 'L23', word: 'verdade' }, { line: 'L23', word: 'verdade', offset: 0.3 });
        drawChip(g, 'A VERDADE APROXIMA ❤️', 540, 330, { size: 52, alpha: a * c.k({ line: 'L23', word: 'aproxima', offset: -0.5 }, { line: 'L23', word: 'aproxima', offset: 0 }), border: COLORS.red });
      },
    },

    // 9. CHAMADA PARA AÇÃO
    {
      id: 'pergunta', world: 'town', start: { line: 'L24', offset: -0.3 }, transition: 'whip',
      music: { mood: 'calm', intensity: 0.75 },
      cues: [{ sfx: 'pop', at: { line: 'L24', word: 'comenta' }, p: { level: 0.28, freq: 620 } }],
      setup(w) {
        w.reset();
        w.putTito(X.plaza, 1.8, 0);
        [[-2.3, 0.4, 1], [2.3, 0.4, 4], [-3.2, -1.2, 0], [3.2, -1.2, 2], [-1.5, -2.4, 3], [1.5, -2.4, 5], [-3.0, 1.6, 8], [3.0, 1.6, 9]].forEach(([dx, dz, id]) => { const ch = w.put(id, X.plaza + dx, dz, 0); face(ch, X.plaza, 8); });
      },
      update(w, c) {
        const all = w.npcs.filter((n) => n.root.visible);
        idleAll(all, c.t);
        const wave = c.k({ line: 'L24', word: 'comenta', offset: -0.2 }, { line: 'L24', word: 'comenta', offset: 0.2 });
        w.tito.pose.wave = wave; w.tito.pose.smile = 0.9; w.tito.pose.talk = speaking(c, 'L24');
        all.forEach((n, i) => { n.pose.wave = wave * (i % 2); n.pose.armsUp = wave * (i % 2 ? 0 : 0.5); n.pose.smile = 0.9; });
        cameraPath(c.cam, [
          { u: 0, pos: [X.plaza, 2.8, 11.0], look: [X.plaza, 1.5, -0.5], fov: 48 },
          { u: 1, pos: [X.plaza, 2.3, 8.4], look: [X.plaza, 1.5, -0.5], fov: 44 },
        ], c.u);
      },
      draw2D(g, c) {
        const a = c.k({ line: 'L24', word: 'comenta' }, { line: 'L24', word: 'comenta', offset: 0.3 });
        drawChip(g, 'COMENTA AÍ 💬', 540, 330, { size: 54, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.blue });
        const b = c.k({ line: 'L24', word: 'diria' }, { line: 'L24', word: 'diria', offset: 0.3 });
        drawChip(g, 'O QUE VOCÊ DIRIA?', 540, 430, { size: 40, alpha: b, border: COLORS.gold });
      },
    },

    // 10. TELA FINAL OBRIGATÓRIA — HISTÓRIAS DO TABOCAL
    {
      id: 'final', world: 'town', start: { after: 'L24', offset: 0.5 }, transition: 'flash', duration: 6.8,
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
        w.putTito(X.plaza - 1.6, 1.8, 0.3);
        [[0.6, 1.4, 1], [2.3, 0.6, 4], [-3.0, 0.2, 0], [3.2, 1.8, 5], [-1.0, -1.4, 2], [1.2, -1.8, 3]].forEach(([dx, dz, id]) => { const ch = w.put(id, X.plaza + dx, dz, 0); face(ch, X.plaza, 8); });
      },
      update(w, c) {
        w.npcs.filter((n) => n.root.visible).forEach((n, i) => { n.pose.smile = 1; n.pose.wave = i % 2; });
        w.tito.pose.smile = 1; w.tito.pose.wave = 1;
        cameraPath(c.cam, [
          { u: 0, pos: [X.plaza, 1.8, 8], look: [X.plaza, 3.2, -6], fov: 52 },
          { u: 1, pos: [X.plaza + 1, 4.5, 14], look: [X.plaza, 5, -10], fov: 56 },
        ], c.u);
      },
      draw2D(g, c) { drawEndCard(g, c.lt, c.dur, c.t); },
      noSubtitles: true, noBug: true,
    },
  ],
};

function t0(c) { return c.t; }
