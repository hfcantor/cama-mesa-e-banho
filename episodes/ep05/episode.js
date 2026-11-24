// ============================================================================
//  E SE...? — Episódio 05: "E se o mundo fosse acabar daqui a uma semana?"
//  HISTÓRIAS DO TABOCAL  ·  estilo bonequinho 2D
// ----------------------------------------------------------------------------
//  Base: o livro de Apocalipse (última parte da Bíblia). Cada cena cita o
//  capítulo/versículo. A divisão em 7 "dias" é só organização do vídeo: o texto
//  bíblico NÃO marca datas (Mt 24:36) e há várias linhas de interpretação.
//
//   Ap 1:9      João, na ilha de Patmos          Ap 13:1, 13:16-18  besta, marca, 666 (alguns mss.: 616)
//   Ap 6:1-8    quatro cavaleiros                Ap 16:2-21         sete taças, Armagedom (16:16)
//   Ap 6:12-14  sexto selo                       Ap 19:11-16        cavaleiro do cavalo branco
//   Ap 8:1      silêncio de ~meia hora           Ap 20:1-3, 20:11   dragão preso 1.000 anos; grande trono branco
//   Ap 8:7-12   trombetas 1 a 4                  Ap 21:1-4          novo céu e nova terra; sem morte, luto, pranto, dor
//   Ap 9:16     exército de 200 milhões          Mt 24:36           ninguém sabe o dia nem a hora
//   Ap 11:15    sétima trombeta
//
//  NARRAÇÃO: audio/ep05/narracao/L01 ... L22 (tools/gerar_narracao.py ep05).
// ============================================================================
import { drawOpeningTitle, drawMidCTA, drawChip, drawEndCard, COLORS } from '../../js/render/overlays.js';
import { drawStickman, drawSky, vignette, groundShadow, jit, clamp01, lerp, INK, W, H, circ, ell, poly, seg } from '../../js/render/toon.js';
import { drawHorse, drawAngel, drawBeast, drawBowl, drawCity, drawTree } from '../../js/render/bible.js';

const TAU = Math.PI * 2;
const FLOORY = 1350; // ilustração acima; o chão com o Tito (leitor) abaixo, longe das legendas
const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };

function stage(g, t, top, bottom, ground = '#3b2f45') {
  const gr = g.createLinearGradient(0, 0, 0, FLOORY); gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, W, FLOORY);
}
function floor(g, color = '#3b2f45') {
  g.fillStyle = color; g.fillRect(0, FLOORY, W, H - FLOORY);
  g.beginPath(); g.moveTo(0, FLOORY); g.lineTo(W, FLOORY); g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 12; i++) g.fillRect(40 + i * 90, FLOORY + 30 + (i % 3) * 90, 60, 8);
}
const book = (g, hx, hy) => {
  g.save(); g.translate(hx + 10, hy - 10); g.rotate(-0.15);
  g.beginPath(); g.rect(-50, -36, 100, 72); g.fillStyle = '#7a3a22'; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
  g.fillStyle = '#f2c14e'; g.fillRect(-4, -36, 8, 72); g.restore();
};
// o Tito de leitor, embaixo, reagindo ao que acontece em cima
function viewer(g, t, pose = {}, x = 300) {
  groundShadow(g, x, 1862, 120);
  drawStickman(g, t, { x, y: 1850, s: 0.75, tunic: '#e0563a', hat: true, pose: { bob: Math.sin(t * 2.2) * 2, blink: (t % 3.7) < 0.12 ? 1 : 0, smile: 0.2, armL: 0.4, armR: 1.5, ...pose }, holdR: book });
}
function dayChips(g, c, anchor, big, small, color = COLORS.gold, y = 250) {
  const a = c.k(anchor, { ...anchor, offset: (anchor.offset || 0) + 0.3 });
  drawChip(g, big, 540, y, { size: 56, alpha: a, scale: 0.7 + 0.3 * a, border: color });
  if (small) drawChip(g, small, 540, y + 90, { size: 36, alpha: a, scale: 0.8 + 0.2 * a, border: COLORS.blue, color: '#cfe9ff' });
}
function shout(g, c, anchor, text, y, border = COLORS.gold, size = 40) {
  const a = c.k(anchor, { ...anchor, offset: (anchor.offset || 0) + 0.3 });
  drawChip(g, text, 540, y, { size, alpha: a, scale: 0.75 + 0.25 * a, border });
}
const starfield = (g, t, n = 70, h = 1100, a = 1) => { for (let i = 0; i < n; i++) { const x = (i * 193) % W, y = (i * 311) % h, tw = 0.5 + 0.5 * Math.sin(t * 2 + i); g.fillStyle = `rgba(255,255,230,${a * (0.3 + 0.5 * tw)})`; g.beginPath(); g.arc(x, y, 2 + (i % 3), 0, TAU); g.fill(); } };
function hillsStrip(g, y0, col, ph = 0, amp = 40) { g.beginPath(); g.moveTo(0, FLOORY); for (let x = 0; x <= W; x += 20) g.lineTo(x, y0 + Math.sin(x * 0.006 + ph) * amp); g.lineTo(W, FLOORY); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); }
function sun(g, x, y, r, col = '#ffd23f', rays = true, t = 0) {
  if (rays) for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + t * 0.1; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2); g.lineTo(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6); g.lineWidth = 9; g.lineCap = 'round'; g.strokeStyle = col; g.stroke(); }
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = col; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
}
function calendar(g, c, doneUpTo = 0, q = 0, y = 760, alpha = 1) {
  g.save(); g.globalAlpha = alpha;
  for (let i = 0; i < 7; i++) {
    const x = 130 + i * 136, done = i < doneUpTo;
    g.beginPath(); g.roundRect(x - 56, y - 70, 112, 140, 16); g.fillStyle = done ? '#7a3a3a' : '#fffaf0'; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.fillStyle = done ? '#fff' : INK; g.font = '900 64px Montserrat, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(q ? '?' : String(i + 1), x, y + 4);
    if (done) { g.strokeStyle = '#e5202a'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 44, y - 54); g.lineTo(x + 44, y + 54); g.moveTo(x + 44, y - 54); g.lineTo(x - 44, y + 54); g.stroke(); }
  }
  g.restore();
}

export default {
  id: 'ep05',
  titulo: 'E se o mundo fosse acabar daqui a uma semana?',
  roteiroStatus: 'aprovado',
  intro: 1.25,
  narration: { dir: 'audio/ep05/narracao/', formats: ['wav', 'mp3'], timings: 'audio/ep05/narracao/timings.json' },

  // ---------------------------- ROTEIRO ----------------------------------
  lines: [
    { id: 'L01', text: 'E se o mundo fosse acabar daqui a uma semana?', emph: { mundo: 'gold', acabar: 'red', semana: 'gold' }, pause: 0.7 },
    { id: 'L02', text: 'Segundo o livro de Apocalipse, o último da Bíblia, o fim vem em etapas. Mas atenção: a Bíblia não marca datas. Dividir em dias é só um jeito de organizar o vídeo.', emph: { apocalipse: 'gold', etapas: 'blue', datas: 'red', dias: 'gold' }, pause: 0.6 },
    { id: 'L03', text: 'A palavra Apocalipse, em grego, significa revelação. E o livro diz que quem escreveu foi João, na ilha de Patmos.', emph: { apocalipse: 'gold', revelacao: 'blue', joao: 'gold', patmos: 'green' }, pause: 0.7 },
    { id: 'L04', text: 'Dia um: os sete selos. No capítulo seis, quatro cavaleiros saem montados em cavalos: branco, vermelho, preto e pálido. O último se chama Morte.', emph: { selos: 'gold', branco: 'white', vermelho: 'red', preto: 'gold', palido: 'green', morte: 'red' }, pause: 0.5 },
    { id: 'L05', text: 'O vermelho tira a paz da terra, o preto leva uma balança: é a fome, e a Morte recebe autoridade sobre a quarta parte da terra.', emph: { vermelho: 'red', paz: 'gold', balanca: 'gold', fome: 'red', morte: 'red', quarta: 'gold' }, pause: 0.7 },
    { id: 'L06', text: 'Dia dois: o sexto selo. Um grande terremoto, o sol fica negro como um saco de crina, a lua fica vermelha como sangue e as estrelas caem.', emph: { dois: 'gold', terremoto: 'orange', negro: 'gold', vermelha: 'red', sangue: 'red', caem: 'blue' }, pause: 0.5 },
    { id: 'L07', text: 'O céu se enrola como um pergaminho. E, no sétimo selo, o céu fica em silêncio por cerca de meia hora.', emph: { enrola: 'gold', pergaminho: 'gold', silencio: 'blue', meia: 'gold', hora: 'gold' }, pause: 0.7 },
    { id: 'L08', text: 'Se tá curtindo, já deixa o like e segue o perfil… porque ainda faltam cinco dias.', emph: { like: 'red', segue: 'gold', cinco: 'gold' }, pause: 0.6 },
    { id: 'L09', text: 'Dia três: as sete trombetas. A primeira traz granizo e fogo misturados com sangue, e queima um terço da terra. A segunda joga uma montanha em chamas no mar, e um terço do mar vira sangue.', emph: { trombetas: 'gold', granizo: 'blue', fogo: 'orange', terco: 'red', montanha: 'orange', sangue: 'red' }, pause: 0.5 },
    { id: 'L10', text: 'A terceira faz uma estrela chamada Absinto amargar um terço das águas. A quarta escurece um terço do sol, da lua e das estrelas.', emph: { absinto: 'green', aguas: 'blue', escurece: 'gold' }, pause: 0.5 },
    { id: 'L11', text: 'A sexta fala de um exército de duzentos milhões. E a sétima anuncia: os reinos do mundo agora são do Senhor e do seu Cristo.', emph: { exercito: 'red', duzentos: 'gold', milhoes: 'gold', reinos: 'gold', senhor: 'gold', cristo: 'gold' }, pause: 0.7 },
    { id: 'L12', text: 'Dia quatro: a besta. No capítulo treze, surge uma besta com sete cabeças e dez chifres, e o texto diz que o número dela é seiscentos e sessenta e seis.', emph: { besta: 'red', treze: 'gold', cabecas: 'gold', chifres: 'gold', seiscentos: 'red', seis: 'red' }, pause: 0.5 },
    { id: 'L13', text: 'Quem recebe a marca da besta não pode comprar nem vender. Alguns manuscritos antigos trazem seiscentos e dezesseis, mas o seiscentos e sessenta e seis é o mais conhecido.', emph: { marca: 'red', comprar: 'gold', vender: 'gold', manuscritos: 'blue', dezesseis: 'gold' }, pause: 0.7 },
    { id: 'L14', text: 'Dia cinco: as sete taças. Úlceras, mar e rios virando sangue, o sol queimando, trevas e o rio Eufrates secando.', emph: { tacas: 'gold', ulceras: 'red', sangue: 'red', queimando: 'orange', trevas: 'blue', eufrates: 'blue', secando: 'gold' }, pause: 0.5 },
    { id: 'L15', text: 'Então os reis se reúnem num lugar chamado, em hebraico, Armagedom. E a sétima taça traz um terremoto e granizo enorme, com pedras de dezenas de quilos.', emph: { armagedom: 'red', terremoto: 'orange', granizo: 'blue', quilos: 'gold' }, pause: 0.7 },
    { id: 'L16', text: 'Dia seis: a volta de Cristo. O céu se abre, e aparece um cavaleiro num cavalo branco, chamado Fiel e Verdadeiro, com o título Rei dos reis e Senhor dos senhores.', emph: { cristo: 'gold', abre: 'gold', branco: 'white', fiel: 'gold', verdadeiro: 'gold', reis: 'gold', senhores: 'gold' }, pause: 0.5 },
    { id: 'L17', text: 'A besta é derrotada. O dragão, que é Satanás, fica preso por mil anos. No fim, vem o juízo diante do grande trono branco.', emph: { derrotada: 'green', dragao: 'red', satanas: 'red', mil: 'gold', juizo: 'gold', trono: 'white' }, pause: 0.7 },
    { id: 'L18', text: 'Dia sete: o novo começo. João vê um novo céu e uma nova terra, e a Nova Jerusalém descendo do céu, com doze portas.', emph: { sete: 'gold', comeco: 'green', joao: 'gold', jerusalem: 'gold', doze: 'gold', portas: 'gold' }, pause: 0.5 },
    { id: 'L19', text: 'E a promessa final: Deus enxugará dos olhos toda lágrima, e a morte já não existirá, nem luto, nem pranto, nem dor.', emph: { promessa: 'gold', enxugara: 'blue', lagrima: 'blue', luto: 'green', pranto: 'green', dor: 'green' }, pause: 0.8 },
    { id: 'L20', text: 'Mas e a data? Jesus disse, em Mateus vinte e quatro, versículo trinta e seis, que ninguém sabe o dia nem a hora.', emph: { data: 'red', jesus: 'gold', mateus: 'gold', ninguem: 'red', dia: 'gold', hora: 'gold' }, pause: 0.6 },
    { id: 'L21', text: 'Ou seja… ninguém pode marcar no calendário. E existem várias formas de interpretar o Apocalipse: muitos cristãos leem tudo isso como símbolos.', emph: { ninguem: 'red', calendario: 'gold', interpretar: 'blue', simbolos: 'gold' }, pause: 0.8 },
    { id: 'L22', text: 'E você? O que faria na sua última semana? Comenta aí!', emph: { voce: 'gold', faria: 'gold', semana: 'gold', comenta: 'blue' }, pause: 0.6 },
  ],

  cues: [],

  // ------------------------------ CENAS ----------------------------------
  scenes: [
    // 1. ABERTURA
    {
      id: 'abertura', world: 'blank', start: { at: 0 }, transition: 'fade',
      music: { mood: 'mystery', intensity: 0.45 },
      cues: [{ sfx: 'logo', at: { local: 0.35 }, p: { level: 0.45 } }, { sfx: 'whoosh', at: { local: 0.2 }, p: { dur: 0.8, level: 0.3 } }],
      draw2D(g, c) {
        const t = c.t;
        stage(g, t, '#150f35', '#4a2a6a'); starfield(g, t);
        // livro aberto brilhando
        g.save(); g.translate(540, 900);
        const gl = g.createRadialGradient(0, 0, 20, 0, 0, 420); gl.addColorStop(0, 'rgba(255,230,150,0.8)'); gl.addColorStop(1, 'rgba(255,230,150,0)'); g.fillStyle = gl; g.fillRect(-500, -450, 1000, 900);
        [[-1, 0], [1, 0]].forEach(([sd]) => { g.beginPath(); g.moveTo(0, -150); g.quadraticCurveTo(sd * 180, -190, sd * 330, -150); g.lineTo(sd * 330, 150); g.quadraticCurveTo(sd * 180, 110, 0, 150); g.closePath(); g.fillStyle = '#fff6df'; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke(); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(sd * 40, -90 + i * 38); g.lineTo(sd * 290, -100 + i * 38); g.lineWidth = 5; g.stroke(); } });
        g.restore();
        calendar(g, c, 0, 0, 1180, c.k({ local: 0.8 }, { local: 1.6 }));
        floor(g); viewer(g, t, { smile: 0.4 });
        vignette(g, 0.55); drawOpeningTitle(g, c.lt, c.dur, c.t);
      },
    },
    // 2. ETAPAS — a Bíblia não marca datas
    {
      id: 'etapas', world: 'blank', start: { line: 'L02', offset: -0.3 }, transition: 'cut',
      music: { mood: 'mystery', intensity: 0.5 },
      draw2D(g, c) {
        const t = c.t;
        stage(g, t, '#1d1545', '#4a2a6a'); starfield(g, t);
        const done = Math.round(c.k({ line: 'L02', word: 'etapas' }, { line: 'L02', word: 'dias', offset: 0.6 }) * 7);
        calendar(g, c, 0, c.k({ line: 'L02', word: 'datas', offset: -0.2 }, { line: 'L02', word: 'datas', offset: 0.2 }) > 0.5 ? 1 : 0, 800);
        void done;
        shout(g, c, { line: 'L02', word: 'apocalipse' }, 'LIVRO DE APOCALIPSE', 330, COLORS.gold, 52);
        shout(g, c, { line: 'L02', word: 'datas' }, 'A BÍBLIA NÃO MARCA DATAS', 1040, COLORS.red, 44);
        shout(g, c, { line: 'L02', word: 'dias' }, '7 DIAS = SÓ ORGANIZAÇÃO DO VÍDEO', 1140, COLORS.blue, 34);
        floor(g); viewer(g, t, { surprise: 0.3 }); vignette(g, 0.55);
      },
    },
    // 3. PATMOS — o que significa Apocalipse
    {
      id: 'patmos', world: 'blank', start: { line: 'L03', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.5 },
      cues: [{ sfx: 'wind', span: 'scene', p: { level: 0.08 } }],
      draw2D(g, c) {
        const t = c.t;
        drawSky(g, t, 0, 0.5, 0);
        g.save(); g.beginPath(); g.rect(0, 0, W, FLOORY); g.clip(); drawSky(g, t, 0, 0.35, 0);
        g.fillStyle = '#3d8fd0'; g.fillRect(0, 900, W, 450); g.lineWidth = 8; g.strokeStyle = INK; g.beginPath(); g.moveTo(0, 900); g.lineTo(W, 900); g.stroke();
        for (let i = 0; i < 9; i++) { g.beginPath(); const wx = (i * 140 + t * 20) % (W + 200) - 100; g.moveTo(wx, 980 + (i % 3) * 110); g.quadraticCurveTo(wx + 30, 960 + (i % 3) * 110, wx + 60, 980 + (i % 3) * 110); g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.stroke(); }
        // ilha com palmeira e João escrevendo
        g.beginPath(); g.moveTo(190, 960); g.quadraticCurveTo(540, 700, 890, 960); g.closePath(); g.fillStyle = '#c9b06a'; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
        g.beginPath(); g.moveTo(760, 830); g.quadraticCurveTo(780, 700, 740, 600); g.lineWidth = 16; g.stroke(); [[-90, -30], [-40, -80], [20, -90], [80, -40]].forEach(([dx, dy]) => { g.beginPath(); g.moveTo(740, 600); g.quadraticCurveTo(740 + dx, 600 + dy, 740 + dx * 1.6, 600 + dy * 0.2 + 40); g.lineWidth = 14; g.strokeStyle = '#3f8f3a'; g.stroke(); });
        drawStickman(g, t, { x: 470, y: 900, s: 0.5, tunic: '#d9d2c3', hat: false, pose: { smile: 0.5, armL: 0.4, armR: 1.4, bob: Math.sin(t * 2) * 2 } });
        g.restore();
        shout(g, c, { line: 'L03', word: 'grego' }, 'APOCALIPSE = REVELAÇÃO', 280, COLORS.gold, 50);
        shout(g, c, { line: 'L03', word: 'patmos', offset: -0.3 }, 'ILHA DE PATMOS · Ap 1:9', 380, COLORS.green, 42);
        floor(g); viewer(g, t, { smile: 0.5 }); vignette(g, 0.5);
      },
    },
    // 4. DIA 1 — os quatro cavaleiros
    {
      id: 'selos', world: 'blank', start: { line: 'L04', offset: -0.3 }, transition: 'cut',
      music: { mood: 'tension', intensity: 0.7 },
      cues: [
        { sfx: 'braam', at: { line: 'L04', word: 'selos' }, p: { dur: 2.4, level: 0.3 } },
        { sfx: 'steps', at: { line: 'L04', word: 'branco' }, until: { after: 'L05' }, p: { count: 40, step: 0.14, level: 0.18 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        stage(g, t, '#3a1330', '#c0603a');
        sun(g, 840, 360, 90, '#ffb347', false);
        hillsStrip(g, 1180, '#6b3a3a', 0.4, 50); hillsStrip(g, 1270, '#4a2530', 2, 30);
        const SEQ = [[{ line: 'L04', word: 'branco' }, 'bow', '#f7f7f2', 'CAVALO BRANCO · ARCO E COROA'], [{ line: 'L04', word: 'vermelho' }, 'sword', '#c8372d', 'CAVALO VERMELHO · GRANDE ESPADA'], [{ line: 'L04', word: 'preto' }, 'scales', '#2b2b30', 'CAVALO PRETO · BALANÇA'], [{ line: 'L04', word: 'palido' }, 'death', '#b9c79a', 'CAVALO PÁLIDO · MORTE'],
          [{ line: 'L05', word: 'vermelho' }, 'sword', '#c8372d', 'TIRA A PAZ DA TERRA'], [{ line: 'L05', word: 'balanca' }, 'scales', '#2b2b30', 'A FOME'], [{ line: 'L05', word: 'morte' }, 'death', '#b9c79a', 'MORTE · 1/4 DA TERRA']];
        let cur = -1; SEQ.forEach(([a], i) => { if (c.since(a) >= 0) cur = i; });
        if (cur >= 0) {
          const [a, rider, col, label] = SEQ[cur], s = c.since(a), x = lerp(1400, 600, ease(s / 0.45));
          drawHorse(g, t, { x, y: 1180, s: 1.2, color: col, rider, speed: 1.1 });
          drawChip(g, label, 540, 420, { size: 40, alpha: ease(s / 0.3), scale: 0.8 + 0.2 * ease(s / 0.3), border: rider === 'death' ? COLORS.green : COLORS.red });
        }
        drawChip(g, 'DIA 1 · OS SETE SELOS · Ap 6:1-8', 540, 250, { size: 40, alpha: c.k({ line: 'L04', word: 'selos', offset: -0.2 }, { line: 'L04', word: 'selos', offset: 0.2 }), border: COLORS.gold });
        floor(g); viewer(g, t, { surprise: 0.5, sweat: 0.4 }); vignette(g, 0.55);
      },
    },
    // 5. DIA 2 — sexto e sétimo selo
    {
      id: 'sexto', world: 'blank', start: { line: 'L06', offset: -0.3 }, transition: 'flash',
      music: { mood: 'tension', intensity: 0.85 },
      cues: [
        { sfx: 'rumble', at: { line: 'L06', word: 'terremoto' }, until: { line: 'L06', word: 'caem', offset: 0.8 }, p: { level: 0.4 } },
        { sfx: 'crack', at: { line: 'L06', word: 'terremoto', offset: 0.3 }, p: { level: 0.5 } },
        { sfx: 'braam', at: { line: 'L06', word: 'negro' }, p: { dur: 2.4, level: 0.3 } },
        { sfx: 'whoosh', at: { line: 'L07', word: 'enrola' }, p: { dur: 1.4, level: 0.35 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const quake = c.k({ line: 'L06', word: 'terremoto' }, { line: 'L06', word: 'terremoto', offset: 0.4 }) * (1 - c.k({ line: 'L07', word: 'enrola', offset: -0.3 }, { line: 'L07', word: 'enrola' }));
        const roll = c.k({ line: 'L07', word: 'enrola' }, { line: 'L07', word: 'pergaminho', offset: 0.7 });
        const hush = c.k({ line: 'L07', word: 'silencio', offset: -0.3 }, { line: 'L07', word: 'silencio', offset: 0.4 });
        g.save(); g.translate(jit(t, 1, 10 * quake), jit(t, 2, 10 * quake));
        g.fillStyle = '#05050c'; g.fillRect(-20, -20, W + 40, FLOORY + 40);
        starfield(g, t, 60, 900, roll);
        // céu que se enrola como pergaminho (de cima para baixo)
        const sh = FLOORY * (1 - roll);
        g.save(); g.beginPath(); g.rect(0, 0, W, sh); g.clip();
        const sk = g.createLinearGradient(0, 0, 0, FLOORY); sk.addColorStop(0, '#26204f'); sk.addColorStop(1, '#6a4a7a'); g.fillStyle = sk; g.fillRect(0, 0, W, FLOORY);
        const dk = c.k({ line: 'L06', word: 'negro' }, { line: 'L06', word: 'negro', offset: 0.6 });
        const sunC = `rgb(${Math.round(lerp(255, 18, dk))},${Math.round(lerp(210, 14, dk))},${Math.round(lerp(63, 20, dk))})`;
        sun(g, 300, 520, 120, sunC, dk < 0.5, t);
        if (dk > 0.5) { g.beginPath(); g.arc(300, 520, 170, 0, TAU); g.strokeStyle = 'rgba(255,230,160,0.6)'; g.lineWidth = 10; g.stroke(); }
        const rd = c.k({ line: 'L06', word: 'vermelha' }, { line: 'L06', word: 'vermelha', offset: 0.6 });
        g.beginPath(); g.arc(790, 430, 95, 0, TAU); g.fillStyle = `rgb(${Math.round(lerp(250, 200, rd))},${Math.round(lerp(246, 30, rd))},${Math.round(lerp(220, 30, rd))})`; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
        const fall = c.k({ line: 'L06', word: 'estrelas' }, { line: 'L07', word: 'enrola' });
        for (let i = 0; i < 14; i++) { const u = ((t * 0.7 + i / 14) % 1) * fall, x = (i * 173) % W, y = -60 + u * 1300; g.strokeStyle = 'rgba(255,255,220,0.9)'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 30, y - 110); g.stroke(); circ(g, x, y, 11, '#fff6b0'); }
        g.restore();
        if (roll > 0.01) { // cilindro do pergaminho
          const cy = sh; g.fillStyle = '#e8d9b0'; g.fillRect(0, cy - 20, W, 56); g.lineWidth = 8; g.strokeStyle = INK; g.strokeRect(0, cy - 20, W, 56); ell(g, 0, cy + 8, 28, 28, '#c9b27a', 8); ell(g, W, cy + 8, 28, 28, '#c9b27a', 8);
        }
        hillsStrip(g, 1220, '#2a2330', 1, 40);
        g.restore();
        dayChips(g, c, { line: 'L06', word: 'dois', offset: -0.1 }, 'DIA 2 · O SEXTO SELO', 'Ap 6:12-14');
        shout(g, c, { line: 'L06', word: 'terremoto' }, 'GRANDE TERREMOTO', 480, COLORS.orange, 44);
        shout(g, c, { line: 'L06', word: 'sol' }, 'SOL NEGRO COMO SACO DE CRINA', 1010, COLORS.gold, 34);
        shout(g, c, { line: 'L06', word: 'sangue' }, 'LUA COMO SANGUE', 1100, COLORS.red, 40);
        if (hush > 0) { g.fillStyle = `rgba(0,0,0,${0.5 * hush})`; g.fillRect(0, 0, W, FLOORY); drawChip(g, 'SÉTIMO SELO · SILÊNCIO ~ MEIA HORA · Ap 8:1', 540, 640, { size: 38, alpha: hush, scale: 0.8 + 0.2 * hush, border: COLORS.blue }); }
        floor(g); viewer(g, t, { surprise: 0.7, mouth: 0.5, sweat: 1 }); vignette(g, 0.6);
      },
    },
    // 6. CHAMADA PARA CURTIR/SEGUIR
    {
      id: 'cta', world: 'blank', start: { line: 'L08', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.6 },
      cues: [
        { sfx: 'pop', at: { line: 'L08', offset: 0.1 }, p: { level: 0.25 } },
        { sfx: 'ding', at: { line: 'L08', word: 'like' }, p: { level: 0.14 } },
        { sfx: 'pop', at: { line: 'L08', word: 'segue' }, p: { level: 0.2, freq: 700 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        stage(g, t, '#150f35', '#4a2a6a'); starfield(g, t);
        calendar(g, c, c.since({ line: 'L08', word: 'cinco', offset: -1.2 }) > 0 ? 2 : 1, 0, 900);
        floor(g); viewer(g, t, { smile: 0.5 }); vignette(g, 0.55);
        const L = c.tl.byId.L08;
        drawMidCTA(g, c.t - L.start + 0.1, L.end - L.start + 0.5, c.t);
      },
    },
    // 7. DIA 3 — as sete trombetas
    {
      id: 'trombetas', world: 'blank', start: { line: 'L09', offset: -0.3 }, transition: 'flash',
      music: { mood: 'tension', intensity: 0.8 },
      cues: [
        { sfx: 'braam', at: { line: 'L09', word: 'trombetas' }, p: { dur: 2.6, level: 0.35 } },
        { sfx: 'riser', at: { line: 'L09', word: 'primeira', offset: -0.3 }, until: { line: 'L09', word: 'primeira', offset: 0.6 }, p: { level: 0.2 } },
        { sfx: 'explosion', at: { line: 'L09', word: 'montanha', offset: 0.9 }, p: { level: 0.4 } },
        { sfx: 'splash', at: { line: 'L09', word: 'mar', offset: 0.4 }, p: { level: 0.4 } },
        { sfx: 'shimmer', at: { line: 'L11', word: 'setima' }, p: { level: 0.14 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const SEQ = [[{ line: 'L09', word: 'primeira' }, 1], [{ line: 'L09', word: 'segunda' }, 2], [{ line: 'L10', word: 'terceira' }, 3], [{ line: 'L10', word: 'quarta' }, 4], [{ line: 'L11', word: 'sexta' }, 6], [{ line: 'L11', word: 'setima' }, 7]];
        let tr = 0, ts = 0; SEQ.forEach(([a, n]) => { if (c.since(a) >= 0) { tr = n; ts = c.since(a); } });
        const night = tr === 4 || tr === 6;
        stage(g, t, night ? '#0e0c2a' : '#3b2c63', tr === 7 ? '#f6d46a' : '#8a5a7a');
        if (tr === 7) { for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + t * 0.2; g.beginPath(); g.moveTo(540, 700); g.lineTo(540 + Math.cos(a) * 900, 700 + Math.sin(a) * 900); g.strokeStyle = 'rgba(255,245,190,0.35)'; g.lineWidth = 40; g.stroke(); } }
        if (night) starfield(g, t, 50, 900);
        drawAngel(g, t, 230, 830, 0.72, tr > 0 ? 1 : 0);
        const z = ease(ts / 0.5), y0 = 1330;
        if (tr === 1) { hillsStrip(g, 1180, '#4a8a3a', 0.3, 40); const burn = ease(ts / 2.2) * 0.34; g.fillStyle = '#1a1210'; g.fillRect(0, 1100, W * burn, 250);
          for (let i = 0; i < 26; i++) { const u = ((t * 1.3 + i * 0.37) % 1), x = (i * 97) % W, y = u * 1250; g.strokeStyle = i % 3 ? '#fff' : '#ff6a3a'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 20, y - 70); g.stroke(); circ(g, x, y, i % 3 ? 7 : 11, i % 3 ? '#e8f4ff' : '#ff8a3a', 4); } }
        if (tr === 2) { const k = ease(ts / 1.6); g.fillStyle = `rgb(${Math.round(lerp(61, 150, k))},${Math.round(lerp(143, 30, k))},${Math.round(lerp(208, 40, k))})`; g.fillRect(0, 900, W, 450);
          g.beginPath(); g.moveTo(560 + k * 60, 300 + k * 600); g.lineTo(760 + k * 60, 760 + k * 140); g.lineTo(360 + k * 60, 760 + k * 140); g.closePath(); g.fillStyle = '#7a3a1a'; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
          for (let i = 0; i < 8; i++) { const u = (t * 1.5 + i / 8) % 1; circ(g, 560 + k * 60 + Math.sin(i * 3) * 70, 420 + k * 600 - u * 150, 26 + (i % 3) * 8, i % 2 ? '#ff8a3a' : '#ffd23f', 0); } }
        if (tr === 3) { const k = ease(ts / 1.8); g.fillStyle = `rgb(${Math.round(lerp(61, 70, k))},${Math.round(lerp(143, 80, k))},${Math.round(lerp(208, 60, k))})`; g.fillRect(0, 1000, W, 350);
          const sx = 760 - k * 160, sy = 260 + k * 700; g.strokeStyle = 'rgba(190,255,140,0.8)'; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx + 160, sy - 190); g.lineTo(sx, sy); g.stroke(); circ(g, sx, sy, 46, '#d9ff9a', 8);
          g.fillStyle = INK; g.font = '900 34px Montserrat, Arial Black, sans-serif'; g.textAlign = 'center'; g.fillText('ABSINTO', sx, sy - 70); }
        if (tr === 4) { const k = ease(ts / 1.6); const dim = (x, y, r, col) => { circ(g, x, y, r, col, 7); g.save(); g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU / 3 * k); g.closePath(); g.fillStyle = 'rgba(8,6,20,0.88)'; g.fill(); g.restore(); };
          dim(330, 640, 120, '#ffd23f'); dim(760, 540, 80, '#fff6cf'); [[560, 330], [820, 800], [440, 880], [660, 900]].forEach(([x, y], i) => dim(x, y, 30, '#fff6b0')); }
        if (tr === 6) { g.fillStyle = '#1a1020'; g.fillRect(0, 1060, W, 290); for (let r = 0; r < 6; r++) for (let i = 0; i < 28; i++) { const x = (i * 38 + r * 11 + t * 40) % (W + 40), yy = 1090 + r * 40; g.fillStyle = '#c8372d'; g.fillRect(x, yy, 16, 26); circ(g, x + 8, yy - 8, 9, '#fdfaf3', 4); }
          drawChip(g, '200.000.000 · Ap 9:16', 540, 620, { size: 56, alpha: z, scale: 0.7 + 0.3 * z, border: COLORS.red }); }
        if (tr === 7) { drawChip(g, 'OS REINOS DO MUNDO SÃO DO SENHOR E DO SEU CRISTO', 540, 640, { size: 34, alpha: z, scale: 0.8 + 0.2 * z, border: COLORS.gold }); drawChip(g, 'Ap 11:15', 540, 720, { size: 36, alpha: z, border: COLORS.blue, color: '#cfe9ff' }); }
        drawChip(g, 'DIA 3 · AS SETE TROMBETAS', 540, 230, { size: 44, alpha: c.k({ line: 'L09', word: 'trombetas', offset: -0.2 }, { line: 'L09', word: 'trombetas', offset: 0.2 }), border: COLORS.gold });
        if (tr) drawChip(g, ['', 'TROMBETA 1 · 1/3 DA TERRA QUEIMADA', 'TROMBETA 2 · 1/3 DO MAR VIRA SANGUE', 'TROMBETA 3 · 1/3 DAS ÁGUAS AMARGAS', 'TROMBETA 4 · 1/3 ESCURECIDO', '', 'TROMBETA 6 · EXÉRCITO', 'TROMBETA 7 · O REINO'][tr] || '', 540, 330, { size: 34, alpha: z, scale: 0.85 + 0.15 * z, border: COLORS.orange });
        floor(g); viewer(g, t, { surprise: 0.6, sweat: 0.6 }); vignette(g, 0.55);
      },
    },
    // 8. DIA 4 — a besta e o 666
    {
      id: 'besta', world: 'blank', start: { line: 'L12', offset: -0.3 }, transition: 'cut',
      music: { mood: 'tension', intensity: 0.9 },
      cues: [
        { sfx: 'braam', at: { line: 'L12', word: 'besta' }, p: { dur: 3, level: 0.4 } },
        { sfx: 'heartbeat', at: { line: 'L12', word: 'cabecas' }, until: { after: 'L13' }, p: { bpm: 70, bpmEnd: 110, level: 0.5 } },
        { sfx: 'pop', at: { line: 'L13', word: 'manuscritos' }, p: { level: 0.22, freq: 600 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        stage(g, t, '#1a0a1a', '#5a1a2a');
        g.fillStyle = '#1d3a5a'; g.fillRect(0, 1000, W, 350); g.lineWidth = 8; g.strokeStyle = INK; g.beginPath(); g.moveTo(0, 1000); g.lineTo(W, 1000); g.stroke();
        for (let i = 0; i < 8; i++) { const wx = (i * 150 + t * 25) % (W + 200) - 100; g.beginPath(); g.moveTo(wx, 1060 + (i % 3) * 80); g.quadraticCurveTo(wx + 30, 1040 + (i % 3) * 80, wx + 60, 1060 + (i % 3) * 80); g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.stroke(); }
        drawBeast(g, t, 540, 1130, 1.3, ease(c.k({ line: 'L12', word: 'besta', offset: -0.3 }, { line: 'L12', word: 'besta', offset: 1.0 })));
        const n = c.k({ line: 'L12', word: 'seiscentos' }, { line: 'L12', word: 'seiscentos', offset: 0.5 });
        if (n > 0) { g.save(); g.translate(540, 640); g.scale(0.7 + 0.3 * n, 0.7 + 0.3 * n); g.globalAlpha = n; g.font = '900 230px Montserrat, Arial Black, sans-serif'; g.textAlign = 'center'; g.lineWidth = 16; g.lineJoin = 'round'; g.strokeStyle = INK; g.strokeText('666', 0, 0); g.fillStyle = '#e5202a'; g.fillText('666', 0, 0); g.restore(); }
        dayChips(g, c, { line: 'L12', word: 'quatro', offset: -0.1 }, 'DIA 4 · A BESTA', 'Ap 13:1 e 13:18');
        shout(g, c, { line: 'L12', word: 'cabecas' }, '7 CABEÇAS · 10 CHIFRES', 1110, COLORS.gold, 40);
        shout(g, c, { line: 'L13', word: 'comprar' }, 'SEM A MARCA: NEM COMPRAR NEM VENDER · Ap 13:17', 410, COLORS.red, 30);
        shout(g, c, { line: 'L13', word: 'dezesseis' }, 'ALGUNS MANUSCRITOS ANTIGOS: 616', 1110, COLORS.blue, 34);
        floor(g); viewer(g, t, { surprise: 0.6, sweat: 1, mouth: 0.3 }); vignette(g, 0.65);
      },
    },
    // 9. DIA 5 — as sete taças e o Armagedom
    {
      id: 'tacas', world: 'blank', start: { line: 'L14', offset: -0.3 }, transition: 'flash',
      music: { mood: 'action', intensity: 0.9 },
      cues: [
        { sfx: 'braam', at: { line: 'L14', word: 'tacas' }, p: { dur: 2.4, level: 0.3 } },
        { sfx: 'crack', at: { line: 'L15', word: 'terremoto' }, p: { level: 0.55 } },
        { sfx: 'rumble', at: { line: 'L15', word: 'terremoto' }, until: { after: 'L15' }, p: { level: 0.4 } },
        { sfx: 'impact', at: { line: 'L15', word: 'granizo', offset: 0.2 }, p: { level: 0.5 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const lates = c.since({ line: 'L15', word: 'armagedom' }) >= 0;
        const sea = c.k({ line: 'L14', word: 'mar' }, { line: 'L14', word: 'mar', offset: 0.8 });
        const sunB = c.k({ line: 'L14', word: 'queimando' }, { line: 'L14', word: 'queimando', offset: 0.6 });
        const dark = c.k({ line: 'L14', word: 'trevas' }, { line: 'L14', word: 'trevas', offset: 0.7 });
        const dry = c.k({ line: 'L14', word: 'eufrates' }, { line: 'L14', word: 'secando', offset: 0.6 });
        const quake = c.k({ line: 'L15', word: 'terremoto' }, { line: 'L15', word: 'terremoto', offset: 0.4 });
        g.save(); g.translate(jit(t, 1, 10 * quake), jit(t, 2, 10 * quake));
        stage(g, t, lerp(0x3b, 0x10, dark) | 0 ? `rgb(${lerp(70, 14, dark) | 0},${lerp(50, 10, dark) | 0},${lerp(110, 28, dark) | 0})` : '#222', `rgb(${lerp(200, 40, dark) | 0},${lerp(120, 24, dark) | 0},${lerp(90, 40, dark) | 0})`);
        sun(g, 820, 520, 100, sunB > 0.3 ? '#ff5a1a' : '#ffd23f', true, t);
        hillsStrip(g, 1130, lates ? '#6a4a3a' : '#4a8a3a', 0.8, 40);
        // rio Eufrates: mar/rios viram sangue, depois secam
        const rw = 330 * (1 - dry * 0.92);
        g.fillStyle = `rgb(${lerp(61, 170, sea) | 0},${lerp(143, 30, sea) | 0},${lerp(208, 40, sea) | 0})`; g.fillRect(0, 1190 + (330 - rw) / 2, W, rw);
        if (lates) { for (let i = 0; i < 9; i++) { const x = 90 + i * 110, off = Math.sin(t * 3 + i) * 6; g.fillStyle = i % 2 ? '#2b2b30' : '#c8372d'; g.fillRect(x + off, 1060, 30, 90); circ(g, x + 15 + off, 1044, 18, '#fdfaf3', 5); poly(g, [[x + 15 + off, 1060], [x + 15 + off, 960], [x + 40 + off, 980], [x + 15 + off, 1000]], '#e5202a', 4); } }
        g.restore();
        // sete taças em arco
        const names = ['ulceras', 'mar', 'rios', 'sol', 'trevas', 'eufrates'];
        for (let i = 0; i < 7; i++) {
          const a = i < 6 ? c.k({ line: 'L14', word: names[i], offset: -0.5 }, { line: 'L14', word: names[i], offset: 0.1 }) : c.k({ line: 'L15', word: 'setima', offset: -0.2 }, { line: 'L15', word: 'setima', offset: 0.3 });
          drawBowl(g, 130 + i * 136, 700 - Math.sin((i / 6) * Math.PI) * 130, 0.85, a * 0.9, ['#b83a2a', '#c8372d', '#c8372d', '#ff8a3a', '#222', '#4aa0e0', '#e8f4ff'][i], t);
        }
        if (c.since({ line: 'L15', word: 'granizo' }) > 0) for (let i = 0; i < 20; i++) { const u = ((t * 1.1 + i * 0.31) % 1), x = (i * 131) % W, y = u * 1250; circ(g, x, y, 24, '#e8f4ff', 6); }
        dayChips(g, c, { line: 'L14', word: 'tacas', offset: -0.1 }, 'DIA 5 · AS SETE TAÇAS', 'Ap 16');
        shout(g, c, { line: 'L14', word: 'ulceras' }, 'ÚLCERAS · MAR E RIOS DE SANGUE', 1060, COLORS.red, 34);
        shout(g, c, { line: 'L14', word: 'eufrates' }, 'O RIO EUFRATES SECA · Ap 16:12', 1150, COLORS.blue, 34);
        shout(g, c, { line: 'L15', word: 'armagedom' }, 'ARMAGEDOM · Ap 16:16', 420, COLORS.red, 50);
        shout(g, c, { line: 'L15', word: 'quilos' }, 'GRANIZO DE DEZENAS DE QUILOS · Ap 16:21', 1150, COLORS.gold, 32);
        floor(g); viewer(g, t, { surprise: 0.7, mouth: 0.6, sweat: 1 }); vignette(g, 0.6);
      },
    },
    // 10. DIA 6 — a volta de Cristo, a derrota da besta e o juízo
    {
      id: 'volta', world: 'blank', start: { line: 'L16', offset: -0.3 }, transition: 'flash',
      music: { mood: 'wonder', intensity: 0.85 },
      cues: [
        { sfx: 'shimmer', at: { line: 'L16', word: 'abre' }, p: { level: 0.16 } },
        { sfx: 'riser', at: { line: 'L16', word: 'ceu' }, until: { line: 'L16', word: 'cavaleiro', offset: 0.4 }, p: { level: 0.22 } },
        { sfx: 'impact', at: { line: 'L17', word: 'derrotada' }, p: { level: 0.4 } },
        { sfx: 'crack', at: { line: 'L17', word: 'preso' }, p: { level: 0.3 } },
        { sfx: 'shimmer', at: { line: 'L17', word: 'trono' }, p: { level: 0.14 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const open = c.k({ line: 'L16', word: 'ceu', offset: -0.3 }, { line: 'L16', word: 'abre', offset: 0.7 });
        const phase17 = c.since({ line: 'L17', word: 'besta' }) >= 0;
        const jail = c.k({ line: 'L17', word: 'dragao' }, { line: 'L17', word: 'preso', offset: 0.5 });
        const throne = c.k({ line: 'L17', word: 'trono', offset: -0.3 }, { line: 'L17', word: 'trono', offset: 0.5 });
        stage(g, t, '#1d1545', '#6a4a7a'); starfield(g, t, 50, 900, 1 - open);
        // fenda de luz no céu
        if (open > 0) { const gr = g.createRadialGradient(540, 500, 20, 540, 500, 120 + 700 * open); gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, FLOORY); }
        hillsStrip(g, 1190, '#4a3a5a', 1.4, 40);
        if (!phase17) { const x = lerp(1300, 560, ease(c.k({ line: 'L16', word: 'cavaleiro', offset: -0.2 }, { line: 'L16', word: 'cavalo', offset: 0.6 }))); if (open > 0.5) drawHorse(g, t, { x, y: 1000, s: 1.2, color: '#ffffff', rider: 'light', speed: 0.9, glow: 1 }); }
          else { // besta derrotada → dragão preso → trono
          const bf = 1 - c.k({ line: 'L17', word: 'derrotada' }, { line: 'L17', word: 'derrotada', offset: 1 });
          if (bf > 0.02) { g.globalAlpha = bf; drawBeast(g, t, 540, 1050, 0.9 * bf, 1); g.globalAlpha = 1; }
          if (jail > 0 && throne < 0.5) { g.save(); g.globalAlpha = jail; g.translate(540, 760); g.beginPath(); g.ellipse(0, 20, 150, 90, 0, 0, TAU); g.fillStyle = '#3a1a3a'; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke(); circ(g, -60, -30, 24, '#ffe14a', 0); circ(g, 60, -30, 24, '#ffe14a', 0); for (let i = -4; i <= 4; i++) seg(g, i * 52, -170, i * 52, 190, 14); seg(g, -250, -170, 250, -170, 16); seg(g, -250, 190, 250, 190, 16); g.restore(); }
          if (throne > 0) { g.save(); g.globalAlpha = throne; g.translate(540, 940); const gl = g.createRadialGradient(0, -240, 30, 0, -240, 600); gl.addColorStop(0, 'rgba(255,255,230,1)'); gl.addColorStop(1, 'rgba(255,255,230,0)'); g.fillStyle = gl; g.fillRect(-700, -900, 1400, 1300);
            poly(g, [[-130, 0], [130, 0], [130, -120], [-130, -120]], '#ffffff', 9); poly(g, [[-110, -120], [110, -120], [110, -380], [60, -440], [-60, -440], [-110, -380]], '#ffffff', 9); ell(g, 0, 8, 200, 30, '#ffffff', 8); g.restore(); }
        }
        dayChips(g, c, { line: 'L16', word: 'seis', offset: -0.1 }, 'DIA 6 · A VOLTA DE CRISTO', 'Ap 19:11-16');
        shout(g, c, { line: 'L16', word: 'fiel' }, 'FIEL E VERDADEIRO', 440, COLORS.gold, 46);
        shout(g, c, { line: 'L16', word: 'senhores', offset: -0.9 }, 'REI DOS REIS E SENHOR DOS SENHORES', 1120, COLORS.gold, 32);
        shout(g, c, { line: 'L17', word: 'derrotada' }, 'A BESTA É DERROTADA · Ap 19:20', 440, COLORS.green, 36);
        shout(g, c, { line: 'L17', word: 'preso' }, 'DRAGÃO PRESO POR 1.000 ANOS · Ap 20:1-3', 540, COLORS.red, 30);
        shout(g, c, { line: 'L17', word: 'trono' }, 'GRANDE TRONO BRANCO · Ap 20:11', 440, COLORS.blue, 38);
        floor(g); viewer(g, t, { smile: 0.1, surprise: 0.8, mouth: 0.4 }); vignette(g, 0.5);
      },
    },
    // 11. DIA 7 — novo céu e nova terra
    {
      id: 'novo', world: 'blank', start: { line: 'L18', offset: -0.3 }, transition: 'flash',
      music: { mood: 'wonder', intensity: 0.8 },
      cues: [
        { sfx: 'shimmer', at: { line: 'L18', word: 'comeco' }, p: { level: 0.16 } },
        { sfx: 'shimmer', at: { line: 'L18', word: 'jerusalem' }, p: { level: 0.14, notes: [1568, 1975.5, 2349, 3136] } },
        { sfx: 'ding', at: { line: 'L19', word: 'lagrima' }, p: { level: 0.14 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawSky(g, t, 0, 0.2, 0);
        g.save(); g.beginPath(); g.rect(0, 0, W, FLOORY); g.clip();
        drawSky(g, t, 0, 0.15, 0);
        const desc = ease(c.k({ line: 'L18', word: 'jerusalem', offset: -0.3 }, { line: 'L18', word: 'portas', offset: 0.6 }));
        hillsStrip(g, 1210, '#7ccf5a', 0.5, 36); hillsStrip(g, 1290, '#58b24a', 2, 24);
        // rio da água da vida
        g.beginPath(); g.moveTo(480, 1160); g.quadraticCurveTo(300, 1260, 160, FLOORY); g.lineTo(520, FLOORY); g.quadraticCurveTo(620, 1250, 600, 1160); g.closePath(); g.fillStyle = '#7ec4f0'; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
        drawCity(g, t, 540, 1160 - (1 - desc) * 700, 0.95, desc);
        drawTree(g, t, 850, 1290, 0.75); drawTree(g, t, 170, 1260, 0.6);
        g.restore();
        dayChips(g, c, { line: 'L18', word: 'sete', offset: -0.1 }, 'DIA 7 · O NOVO COMEÇO', 'Ap 21 e 22');
        shout(g, c, { line: 'L18', word: 'ceu', offset: 0.2 }, 'NOVO CÉU E NOVA TERRA · Ap 21:1', 440, COLORS.gold, 36);
        shout(g, c, { line: 'L18', word: 'doze' }, 'NOVA JERUSALÉM · 12 PORTAS', 1050, COLORS.gold, 40);
        const pr = c.k({ line: 'L19', word: 'promessa' }, { line: 'L19', word: 'promessa', offset: 0.4 });
        if (pr > 0) { g.fillStyle = `rgba(20,10,50,${0.55 * pr})`; g.fillRect(0, 0, W, FLOORY); drawChip(g, 'ENXUGARÁ TODA LÁGRIMA', 540, 560, { size: 52, alpha: pr, scale: 0.8 + 0.2 * pr, border: COLORS.blue });
          shout(g, c, { line: 'L19', word: 'morte' }, 'SEM MORTE · LUTO · PRANTO · DOR', 680, COLORS.green, 40); drawChip(g, 'Ap 21:4', 540, 770, { size: 38, alpha: pr, border: COLORS.gold }); }
        floor(g); viewer(g, t, { smile: 1, surprise: 0.2 }); vignette(g, 0.45);
      },
    },
    // 12. NINGUÉM SABE O DIA NEM A HORA
    {
      id: 'ninguem', world: 'blank', start: { line: 'L20', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.6 },
      draw2D(g, c) {
        const t = c.t;
        stage(g, t, '#151a40', '#3a4a7a'); starfield(g, t);
        calendar(g, c, 0, 1, 780);
        shout(g, c, { line: 'L20', word: 'mateus' }, 'MATEUS 24:36', 360, COLORS.gold, 56);
        shout(g, c, { line: 'L20', word: 'ninguem' }, 'NINGUÉM SABE O DIA NEM A HORA', 1020, COLORS.red, 42);
        shout(g, c, { line: 'L21', word: 'calendario' }, 'NÃO DÁ PARA MARCAR NO CALENDÁRIO', 1130, COLORS.gold, 34);
        shout(g, c, { line: 'L21', word: 'interpretar' }, 'VÁRIAS FORMAS DE INTERPRETAR', 1230, COLORS.blue, 38);
        shout(g, c, { line: 'L21', word: 'simbolos' }, 'MUITOS CRISTÃOS LEEM COMO SÍMBOLOS', 470, COLORS.green, 34);
        floor(g); viewer(g, t, { smile: 0.4 }); vignette(g, 0.5);
      },
    },
    // 13. CHAMADA PARA AÇÃO
    {
      id: 'pergunta', world: 'blank', start: { line: 'L22', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.7 },
      cues: [{ sfx: 'pop', at: { line: 'L22', word: 'comenta' }, p: { level: 0.28, freq: 620 } }],
      draw2D(g, c) {
        const t = c.t;
        stage(g, t, '#2b2260', '#c98a7a'); sun(g, 540, 800, 120, '#ffd23f', true, t);
        hillsStrip(g, 1180, '#58b24a', 0.5, 40);
        const wave = c.k({ line: 'L22', word: 'comenta', offset: -0.2 }, { line: 'L22', word: 'comenta', offset: 0.2 });
        groundShadow(g, 540, 1300, 120);
        drawStickman(g, t, { x: 540, y: 1330, s: 0.8, tunic: '#e0563a', hat: true, pose: { bob: Math.sin(t * 2.2) * 3, blink: (t % 3.7) < 0.12 ? 1 : 0, smile: 0.9, armL: 0.45, armR: lerp(0.45, 2.6 + Math.sin(t * 9) * 0.35, wave) } });
        const a = c.k({ line: 'L22', word: 'comenta' }, { line: 'L22', word: 'comenta', offset: 0.3 });
        drawChip(g, 'COMENTA AÍ 💬', 540, 330, { size: 54, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.blue });
        drawChip(g, 'O QUE VOCÊ FARIA NA ÚLTIMA SEMANA?', 540, 440, { size: 34, alpha: c.k({ line: 'L22', word: 'faria' }, { line: 'L22', word: 'faria', offset: 0.3 }), border: COLORS.gold });
        floor(g); vignette(g, 0.5);
      },
    },
    // 14. TELA FINAL OBRIGATÓRIA — HISTÓRIAS DO TABOCAL
    {
      id: 'final', world: 'blank', start: { after: 'L22', offset: 0.5 }, transition: 'flash', duration: 6.8,
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
      draw2D(g, c) {
        const t = c.t;
        stage(g, t, '#150f35', '#4a2a6a'); starfield(g, t);
        floor(g); vignette(g, 0.6);
        drawEndCard(g, c.lt, c.dur, c.t);
      },
      noSubtitles: true, noBug: true,
    },
  ],
};
