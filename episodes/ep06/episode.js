// ============================================================================
//  E SE...? — Episódio 06: "E se uma inteligência artificial governasse o Brasil?"
//  HISTÓRIAS DO TABOCAL  ·  estilo bonequinho 2D
// ----------------------------------------------------------------------------
//  Sátira SEM pessoas reais: a "IA" é um robô fictício. Os dias 1 a 6 são piada;
//  a virada ("Mas calma") só traz fatos conferidos:
//   - CF/88, art. 1º, parágrafo único: todo poder emana do povo.
//   - Presidente: cargo privativo de brasileiro nato (art. 12, §3º, I) e idade
//     mínima de 35 anos (art. 14, §3º, VI, "a").
//   - Alice: ferramenta de IA criada pela CGU (2014) e usada pelo TCU; varre
//     editais de licitação e alerta os auditores.
//   - Victor: IA do STF desenvolvida com a UnB (em funcionamento desde 2018) que
//     ajuda a separar recursos por tema; o STF diz que é apoio, com supervisão humana.
//  "Mais de cinco mil municípios" (IBGE: 5.568/5.570 conforme a contagem).
//  26 estados + Distrito Federal = 27 unidades da federação.
//
//  NARRAÇÃO: audio/ep06/narracao/L01 ... L14 (tools/gerar_narracao.py ep06).
// ============================================================================
import { drawOpeningTitle, drawMidCTA, drawChip, drawEndCard, COLORS } from '../../js/render/overlays.js';
import { drawStickman, vignette, groundShadow, jit, clamp01, lerp, INK, W, H, circ, ell, poly, seg } from '../../js/render/toon.js';
import { drawOffice, drawRobot, drawBubble, drawPaper, drawBookCF, drawCard } from '../../js/render/gov.js';

const TAU = Math.PI * 2;
const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const FEET = 1850; // pés dos personagens: a cabeça fica logo abaixo da faixa das legendas
const SC = 0.85;
const TUNICS = ['#e0563a', '#2b7fd9', '#e0b43a', '#a43ad9', '#3ad9a4', '#d93a6f', '#7ad93a', '#f08a2b'];

const idle = (t, i = 0, extra = {}) => ({ bob: Math.sin(t * 2.2 + i) * 3, blink: ((t + i) % 3.7) < 0.12 ? 1 : 0, ...extra });
function tito(g, t, x = 280, pose = {}, o = {}) { groundShadow(g, x, FEET + 12, 110); return drawStickman(g, t, { x, y: FEET, s: SC, tunic: '#e0563a', hat: true, pose: idle(t, 0, pose), ...o }); }
function person(g, t, x, y, i, pose = {}, s = 0.62) { groundShadow(g, x, y + 10, 70); drawStickman(g, t, { x, y, s, tunic: TUNICS[i % TUNICS.length], hat: false, pose: idle(t, i, pose) }); }
function robot(g, t, o) { groundShadow(g, o.x, (o.y ?? FEET) + 12, 120 * (o.s ?? 0.85)); drawRobot(g, t, { y: FEET, s: 0.85, ...o }); }
function chip(g, c, anchor, text, y, border = COLORS.gold, size = 42) {
  const a = c.k(anchor, { ...anchor, offset: (anchor.offset || 0) + 0.3 });
  drawChip(g, text, 540, y, { size, alpha: a, scale: 0.75 + 0.25 * a, border });
}
function dia(g, c, anchor, label, y = 250) { chip(g, c, anchor, label, y, COLORS.gold, 52); }

export default {
  id: 'ep06',
  titulo: 'E se uma inteligência artificial governasse o Brasil?',
  roteiroStatus: 'aprovado',
  intro: 1.25,
  narration: { dir: 'audio/ep06/narracao/', formats: ['wav', 'mp3'], timings: 'audio/ep06/narracao/timings.json' },

  // ---------------------------- ROTEIRO ----------------------------------
  lines: [
    { id: 'L01', text: 'E se uma inteligência artificial governasse o Brasil?', emph: { inteligencia: 'gold', artificial: 'gold', governasse: 'red', brasil: 'green' }, pause: 0.7 },
    { id: 'L02', text: 'Numa manhã comum, aqui no Tabocal, o Tito acordou com um aviso no celular: o governo agora é uma inteligência artificial.', emph: { tito: 'gold', aviso: 'red', governo: 'gold', inteligencia: 'blue', artificial: 'blue' }, pause: 0.5 },
    { id: 'L03', text: 'Dia um: ela zera a fila do INSS em três segundos. O Tito quase chorou de emoção. Só que, na hora de confirmar, ela pediu: prove que você não é um robô.', emph: { zera: 'green', inss: 'gold', tres: 'gold', chorou: 'blue', prove: 'red', robo: 'red' }, pause: 0.5 },
    { id: 'L04', text: 'Dia dois: ela responde, ao mesmo tempo, a todos os mais de cinco mil municípios.', emph: { dois: 'gold', mesmo: 'gold', cinco: 'gold', mil: 'gold', municipios: 'green' }, pause: 0.5 },
    { id: 'L05', text: 'Dia três: ela corta a burocracia. Os vinte e seis estados e o Distrito Federal recebem um formulário só.', emph: { tres: 'gold', corta: 'red', burocracia: 'red', vinte: 'gold', seis: 'gold', distrito: 'gold', formulario: 'blue' }, pause: 0.7 },
    { id: 'L06', text: 'Se tá curtindo, já deixa o like e segue o perfil… porque o problema só começa agora.', emph: { like: 'red', segue: 'gold', problema: 'red' }, pause: 0.55 },
    { id: 'L07', text: 'Dia quatro: o povo pergunta quem vai ser responsabilizado quando ela errar. A resposta: como modelo de linguagem, eu não tenho CPF.', emph: { quatro: 'gold', povo: 'gold', responsabilizado: 'red', errar: 'red', cpf: 'blue' }, pause: 0.6 },
    { id: 'L08', text: 'Dia cinco: ela decide com base em dados. Mas se os dados forem enviesados, o erro se repete em escala.', emph: { cinco: 'gold', dados: 'blue', enviesados: 'red', erro: 'red', escala: 'gold' }, pause: 0.6 },
    { id: 'L09', text: 'Dia seis: a oposição pede um recall. A IA responde que já está atualizando a versão. E o povo ainda não foi consultado.', emph: { seis: 'gold', recall: 'red', atualizando: 'blue', povo: 'gold', consultado: 'red' }, pause: 0.7 },
    { id: 'L10', text: 'Mas calma. Na vida real, a Constituição diz que todo poder emana do povo. E o presidente precisa ser brasileiro nato e ter pelo menos trinta e cinco anos.', emph: { calma: 'green', constituicao: 'gold', poder: 'gold', povo: 'gold', nato: 'gold', trinta: 'gold', anos: 'gold' }, pause: 0.6 },
    { id: 'L11', text: 'Isso não impede o uso de IA no governo. A Alice, criada pela CGU e usada pelo TCU, varre editais de licitação e avisa os auditores. No STF, o Victor, feito com a UnB, ajuda a separar recursos por tema.', emph: { alice: 'gold', cgu: 'blue', tcu: 'blue', editais: 'green', auditores: 'gold', stf: 'blue', victor: 'gold', unb: 'blue', recursos: 'green' }, pause: 0.6 },
    { id: 'L12', text: 'E o próprio STF diz que a IA é só apoio, sempre com supervisão humana.', emph: { stf: 'blue', apoio: 'gold', supervisao: 'green', humana: 'green' }, pause: 0.6 },
    { id: 'L13', text: 'Ou seja… a IA pode ajudar a decidir, mas quem responde por ela ainda é gente.', emph: { ajudar: 'green', decidir: 'gold', responde: 'red', gente: 'gold' }, pause: 0.8 },
    { id: 'L14', text: 'E você? Deixaria uma IA governar o Brasil? Comenta aí!', emph: { voce: 'gold', deixaria: 'gold', governar: 'red', brasil: 'green', comenta: 'blue' }, pause: 0.6 },
  ],

  cues: [],

  // ------------------------------ CENAS ----------------------------------
  scenes: [
    // 1. ABERTURA
    {
      id: 'abertura', world: 'blank', start: { at: 0 }, transition: 'fade',
      music: { mood: 'wonder', intensity: 0.45 },
      cues: [{ sfx: 'logo', at: { local: 0.35 }, p: { level: 0.45 } }, { sfx: 'whoosh', at: { local: 0.2 }, p: { dur: 0.8, level: 0.3 } }, { sfx: 'tech', at: { local: 1.0 }, p: { count: 6, step: 0.08, level: 0.08 } }],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t);
        robot(g, t, { x: 740, mood: 'happy', armL: 0.5, armR: 0.5 });
        tito(g, t, 260, { smile: 0.3, surprise: 0.3 });
        vignette(g, 0.45); drawOpeningTitle(g, c.lt, c.dur, c.t);
      },
    },
    // 2. O AVISO NO CELULAR
    {
      id: 'aviso', world: 'blank', start: { line: 'L02', offset: -0.3 }, transition: 'cut',
      music: { mood: 'mystery', intensity: 0.5 },
      cues: [{ sfx: 'ding', at: { line: 'L02', word: 'aviso' }, p: { level: 0.2 } }, { sfx: 'tech', at: { line: 'L02', word: 'governo' }, p: { count: 8, step: 0.06, level: 0.08 } }],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t, { flag: false });
        const up = ease(c.k({ line: 'L02', word: 'acordou' }, { line: 'L02', word: 'aviso', offset: 0.3 }));
        // celular grande com a notificação
        g.save(); g.translate(560, 640); g.rotate(-0.05 + Math.sin(t * 20) * 0.01 * (1 - up));
        g.beginPath(); g.roundRect(-190, -330, 380, 660, 44); g.fillStyle = '#15171c'; g.fill(); g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
        g.beginPath(); g.roundRect(-166, -300, 332, 600, 30); g.fillStyle = '#e8f2ff'; g.fill();
        const a = ease(c.k({ line: 'L02', word: 'aviso' }, { line: 'L02', word: 'aviso', offset: 0.5 }));
        g.globalAlpha = a; g.beginPath(); g.roundRect(-146, -250, 292, 200, 20); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 6; g.stroke();
        g.fillStyle = '#e5202a'; g.font = '900 30px Montserrat, sans-serif'; g.textAlign = 'center'; g.fillText('AVISO', 0, -205);
        g.fillStyle = INK; g.font = '800 30px Montserrat, sans-serif'; g.fillText('O GOVERNO', 0, -150); g.fillText('AGORA É UMA IA', 0, -112);
        g.globalAlpha = 1; g.restore();
        tito(g, t, 330, { smile: -0.3, surprise: a, mouth: a * 0.5, armL: 0.4, armR: lerp(0.4, 2.3, up), eyeY: -a, sweat: a });
        vignette(g, 0.45);
      },
    },
    // 3. DIA 1 — INSS em 3 segundos
    {
      id: 'inss', world: 'blank', start: { line: 'L03', offset: -0.3 }, transition: 'cut',
      music: { mood: 'action', intensity: 0.6 },
      cues: [
        { sfx: 'pop', at: { line: 'L03', word: 'um' }, p: { level: 0.22, freq: 520 } },
        { sfx: 'tech', at: { line: 'L03', word: 'zera' }, p: { count: 10, step: 0.05, level: 0.1 } },
        { sfx: 'ding', at: { line: 'L03', word: 'tres', offset: 0.3 }, p: { level: 0.18 } },
        { sfx: 'alarm', at: { line: 'L03', word: 'prove' }, p: { level: 0.06 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t, { flag: false });
        // balcão do INSS
        g.beginPath(); g.roundRect(520, 1180, 520, 300, 18); g.fillStyle = '#d9c9a8'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
        g.beginPath(); g.roundRect(500, 1160, 560, 44, 12); g.fillStyle = '#8a5a30'; g.fill(); g.stroke();
        g.beginPath(); g.roundRect(600, 540, 380, 110, 16); g.fillStyle = '#2a4aa0'; g.fill(); g.stroke(); g.fillStyle = '#fff'; g.font = '900 72px Montserrat, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('INSS', 790, 598);
        const clear = ease(c.k({ line: 'L03', word: 'zera' }, { line: 'L03', word: 'tres', offset: 0.9 }));
        for (let i = 0; i < 7; i++) { const x = 70 + i * 46 + clear * 900 + (i % 2) * 8; if (x < 1180) person(g, t, x, FEET - 120 - (i % 3) * 24, i, { walk: 0, smile: 0.3 }, 0.5); }
        robot(g, t, { x: 790, y: FEET - 280, s: 0.6, mood: c.since({ line: 'L03', word: 'prove' }) > 0 ? 'think' : 'happy', talk: 1 });
        tito(g, t, 720, { smile: 0.9, surprise: 0.2, mouth: 0.2, armL: 0.5, armR: 0.5 });
        const cap = c.k({ line: 'L03', word: 'prove', offset: -0.1 }, { line: 'L03', word: 'prove', offset: 0.4 });
        if (cap > 0) { g.save(); g.globalAlpha = cap; g.translate(540, 760); g.beginPath(); g.roundRect(-300, -70, 600, 140, 20); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); g.lineWidth = 7; g.strokeRect(-260, -26, 52, 52); g.fillStyle = INK; g.font = '800 40px Montserrat, sans-serif'; g.textAlign = 'left'; g.fillText('NÃO SOU UM ROBÔ', -190, 8); g.restore(); }
        dia(g, c, { line: 'L03', word: 'um', offset: -0.1 }, 'DIA 1 · A FILA DO INSS');
        const tm = c.k({ line: 'L03', word: 'tres' }, { line: 'L03', word: 'segundos', offset: 0.4 });
        chip(g, c, { line: 'L03', word: 'tres' }, '3 SEGUNDOS', 340, COLORS.green, 50);
        void tm;
        vignette(g, 0.45);
      },
    },
    // 4. DIA 2 — todos os municípios ao mesmo tempo
    {
      id: 'municipios', world: 'blank', start: { line: 'L04', offset: -0.3 }, transition: 'cut',
      music: { mood: 'action', intensity: 0.65 },
      cues: [
        { sfx: 'pop', at: { line: 'L04', word: 'dois' }, p: { level: 0.22, freq: 560 } },
        { sfx: 'tech', at: { line: 'L04', word: 'responde' }, until: { line: 'L04', word: 'municipios', offset: 0.6 }, p: { count: 30, step: 0.06, level: 0.07 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t, { flag: false });
        g.fillStyle = 'rgba(15,40,60,0.55)'; g.fillRect(0, 0, W, 1250);
        const wave = c.k({ line: 'L04', word: 'responde' }, { line: 'L04', word: 'municipios', offset: 0.8 });
        // grade de municípios acendendo
        const cols = 40, rows = 24;
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          const k = (q + r * 0.7) / (cols + rows * 0.7), on = clamp01((wave * 1.3 - k) * 6);
          g.fillStyle = on > 0.5 ? (((q * 7 + r * 3) % 5) ? '#5aff8a' : '#ffd23f') : 'rgba(255,255,255,0.18)';
          g.beginPath(); g.arc(70 + q * 24.5, 330 + r * 30, on > 0.5 ? 6.5 : 4.5, 0, TAU); g.fill();
        }
        robot(g, t, { x: 740, mood: 'happy', talk: 1, extraArms: 4, armL: 0.9, armR: 0.9 });
        tito(g, t, 240, { smile: 0.6, surprise: 0.5, armL: 0.5, armR: 0.5 });
        dia(g, c, { line: 'L04', word: 'dois', offset: -0.1 }, 'DIA 2 · RESPOSTA PARA TODOS');
        chip(g, c, { line: 'L04', word: 'cinco' }, 'MAIS DE 5 MIL MUNICÍPIOS', 340, COLORS.green, 46);
        vignette(g, 0.5);
      },
    },
    // 5. DIA 3 — formulário único
    {
      id: 'formulario', world: 'blank', start: { line: 'L05', offset: -0.3 }, transition: 'cut',
      music: { mood: 'action', intensity: 0.65 },
      cues: [
        { sfx: 'pop', at: { line: 'L05', word: 'tres' }, p: { level: 0.22, freq: 600 } },
        { sfx: 'whoosh', at: { line: 'L05', word: 'corta' }, p: { dur: 0.7, level: 0.3 } },
        { sfx: 'impact', at: { line: 'L05', word: 'formulario' }, p: { level: 0.35, size: 0.6 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t, { flag: false });
        const UF = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
        const merge = ease(c.k({ line: 'L05', word: 'recebem', offset: -0.2 }, { line: 'L05', word: 'formulario', offset: 0.3 }));
        const scatter = ease(c.k({ line: 'L05', word: 'corta' }, { line: 'L05', word: 'burocracia', offset: 0.5 }));
        UF.forEach((u, i) => {
          const col = i % 9, row = Math.floor(i / 9);
          const hx = 130 + col * 100, hy = 330 + row * 120;
          const x = lerp(hx, 540, merge), y = lerp(hy, 760, merge);
          g.save(); g.globalAlpha = 1 - merge * 0.85; g.translate(x, y); g.rotate(Math.sin(i * 2.1 + t) * 0.05 * (1 - merge));
          g.beginPath(); g.roundRect(-40, -34, 80, 68, 10); g.fillStyle = '#fffdf2'; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
          g.fillStyle = INK; g.font = '900 30px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(u, 0, 2); g.restore();
        });
        if (scatter > 0 && merge < 0.5) { g.fillStyle = `rgba(229,32,42,${0.6 * (1 - merge)})`; g.font = '900 150px Anton, Impact, sans-serif'; g.textAlign = 'center'; g.fillText('BUROCRACIA', 540, 1120); }
        if (merge > 0.3) { g.save(); g.globalAlpha = merge; drawPaper(g, 540, 780, 520, 640, 'FORMULÁRIO ÚNICO', 0); g.restore(); }
        robot(g, t, { x: 790, mood: 'happy', talk: 1, armL: 0.5, armR: 1.4 });
        tito(g, t, 240, { smile: 0.5, surprise: 0.3 });
        dia(g, c, { line: 'L05', word: 'tres', offset: -0.1 }, 'DIA 3 · CORTA A BUROCRACIA', 220);
        chip(g, c, { line: 'L05', word: 'distrito', offset: 0.2 }, '26 ESTADOS + DF = 27 UFs', 1110, COLORS.blue, 40);
        vignette(g, 0.45);
      },
    },
    // 6. CHAMADA PARA CURTIR/SEGUIR
    {
      id: 'cta', world: 'blank', start: { line: 'L06', offset: -0.3 }, transition: 'cut',
      music: { mood: 'tension', intensity: 0.7 },
      cues: [
        { sfx: 'pop', at: { line: 'L06', offset: 0.1 }, p: { level: 0.25 } },
        { sfx: 'ding', at: { line: 'L06', word: 'like' }, p: { level: 0.14 } },
        { sfx: 'pop', at: { line: 'L06', word: 'segue' }, p: { level: 0.2, freq: 700 } },
        { sfx: 'alarm', at: { line: 'L06', word: 'problema' }, p: { level: 0.05 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t);
        robot(g, t, { x: 740, mood: c.since({ line: 'L06', word: 'problema' }) > 0 ? 'error' : 'happy', talk: 1, armL: 0.5, armR: 0.5 });
        tito(g, t, 260, { smile: 0.2, surprise: 0.3, sweat: 0.5 });
        vignette(g, 0.45);
        const L = c.tl.byId.L06;
        drawMidCTA(g, c.t - L.start + 0.1, L.end - L.start + 0.5, c.t);
      },
    },
    // 7. DIA 4 — quem responde?
    {
      id: 'cpf', world: 'blank', start: { line: 'L07', offset: -0.3 }, transition: 'cut',
      music: { mood: 'mystery', intensity: 0.65 },
      cues: [
        { sfx: 'pop', at: { line: 'L07', word: 'quatro' }, p: { level: 0.22, freq: 640 } },
        { sfx: 'ding', at: { line: 'L07', word: 'pergunta' }, p: { level: 0.15 } },
        { sfx: 'crack', at: { line: 'L07', word: 'cpf' }, p: { level: 0.4 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t, { flag: false });
        const q = ease(c.k({ line: 'L07', word: 'pergunta' }, { line: 'L07', word: 'pergunta', offset: 0.4 }));
        const ans = ease(c.k({ line: 'L07', word: 'modelo' }, { line: 'L07', word: 'modelo', offset: 0.5 }));
        [[130, 1], [250, 4], [370, 6]].forEach(([x, i]) => { person(g, t, x, FEET, i, { smile: -0.2, surprise: q * 0.6, armL: 0.5, armR: 2.4 * q + 0.3 }, 0.62); });
        tito(g, t, 520, { smile: 0, surprise: q * 0.5, mouth: q * 0.4, armR: lerp(0.4, 2.4, q) });
        robot(g, t, { x: 840, mood: ans > 0.5 ? 'think' : 'normal', talk: ans, armL: 0.5, armR: 0.5 });
        if (q > 0) drawBubble(g, 300, 700, 'QUEM VAI SER RESPONSABILIZADO?', { w: 520, size: 40, tail: 'down', tx: -40, alpha: q });
        if (ans > 0) drawBubble(g, 700, 520, 'COMO MODELO DE LINGUAGEM, EU NÃO TENHO CPF.', { w: 560, size: 38, tail: 'down', tx: 100, alpha: ans, color: '#e6fbff' });
        const cp = ease(c.k({ line: 'L07', word: 'cpf' }, { line: 'L07', word: 'cpf', offset: 0.4 }));
        if (cp > 0) { g.save(); g.globalAlpha = cp; g.translate(700, 940); g.scale(0.7 + 0.3 * cp, 0.7 + 0.3 * cp); drawCard(g, 0, 0, 340, 190, 'CPF', -0.06); g.strokeStyle = '#e5202a'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(-150, -80); g.lineTo(150, 80); g.moveTo(150, -80); g.lineTo(-150, 80); g.stroke(); g.restore(); }
        dia(g, c, { line: 'L07', word: 'quatro', offset: -0.1 }, 'DIA 4 · QUEM RESPONDE?');
        vignette(g, 0.45);
      },
    },
    // 8. DIA 5 — dados enviesados, erro em escala
    {
      id: 'vies', world: 'blank', start: { line: 'L08', offset: -0.3 }, transition: 'cut',
      music: { mood: 'tension', intensity: 0.7 },
      cues: [
        { sfx: 'pop', at: { line: 'L08', word: 'cinco' }, p: { level: 0.22, freq: 680 } },
        { sfx: 'pop', at: { line: 'L08', word: 'enviesados' }, p: { level: 0.22, freq: 480 } },
        { sfx: 'tech', at: { line: 'L08', word: 'escala' }, p: { count: 14, step: 0.05, level: 0.1 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t, { flag: false });
        const skew = ease(c.k({ line: 'L08', word: 'enviesados' }, { line: 'L08', word: 'enviesados', offset: 0.8 }));
        // gráfico de barras: ficam tortos quando os dados são enviesados
        g.save(); g.translate(180, 960);
        seg(g, -20, 0, 700, 0, 8); seg(g, -20, 0, -20, -520, 8);
        [90, 140, 120, 170, 110].forEach((h0, i) => { const h = lerp(h0 * 2.2, i === 1 || i === 3 ? 480 : 90, skew); g.beginPath(); g.rect(20 + i * 130, -h, 90, h); g.fillStyle = i === 1 || i === 3 ? lerp(0, 1, skew) > 0.5 ? '#e5202a' : '#5ab0ff' : '#5ab0ff'; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke(); });
        g.restore();
        const rep = ease(c.k({ line: 'L08', word: 'repete' }, { line: 'L08', word: 'escala', offset: 0.6 }));
        // o erro se repete: cópias do robô
        const n = Math.floor(1 + rep * 5);
        for (let i = 0; i < n; i++) robot(g, t, { x: 900 - i * 120, y: FEET - i * 20, s: 0.45 - i * 0.02, mood: rep > 0.2 ? 'error' : 'normal', armL: 0.4, armR: 0.4, tint: i % 2 ? '#e9eef3' : '#f3e9e9' });
        tito(g, t, 200, { smile: -0.4, surprise: skew * 0.6 });
        dia(g, c, { line: 'L08', word: 'cinco', offset: -0.1 }, 'DIA 5 · DADOS ENVIESADOS');
        chip(g, c, { line: 'L08', word: 'erro' }, 'ERRO EM ESCALA', 340, COLORS.red, 50);
        vignette(g, 0.45);
      },
    },
    // 9. DIA 6 — recall
    {
      id: 'recall', world: 'blank', start: { line: 'L09', offset: -0.3 }, transition: 'cut',
      music: { mood: 'tension', intensity: 0.8 },
      cues: [
        { sfx: 'pop', at: { line: 'L09', word: 'seis' }, p: { level: 0.22, freq: 700 } },
        { sfx: 'siren', at: { line: 'L09', word: 'recall' }, until: { line: 'L09', word: 'versao', offset: 0.4 }, p: { level: 0.05, rate: 0.4 } },
        { sfx: 'tech', at: { line: 'L09', word: 'atualizando' }, p: { count: 16, step: 0.06, level: 0.08 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t, { flag: false });
        const pr = ease(c.k({ line: 'L09', word: 'recall', offset: -0.3 }, { line: 'L09', word: 'recall', offset: 0.3 }));
        [[120, 1], [250, 4], [380, 6]].forEach(([x, i]) => { person(g, t, x, FEET, i, { smile: -0.4, mouth: 0.4 * pr, armL: 0.4, armR: 2.5 + Math.sin(t * 6 + i) * 0.3 }, 0.62);
          g.save(); g.translate(x + 40, FEET - 600 + Math.sin(t * 6 + i) * 10); seg(g, 0, 0, 0, 180, 8); g.beginPath(); g.roundRect(-90, -90, 180, 100, 10); g.fillStyle = '#fffdf2'; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke(); g.fillStyle = '#e5202a'; g.font = '900 38px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('RECALL!', 0, -40); g.restore(); });
        const up = ease(c.k({ line: 'L09', word: 'atualizando', offset: -0.2 }, { line: 'L09', word: 'versao', offset: 0.8 }));
        robot(g, t, { x: 840, mood: 'loading', talk: 0, armL: 0.5, armR: 0.5 });
        // barra de atualização
        g.save(); g.translate(780, 560); g.beginPath(); g.roundRect(-230, -40, 460, 80, 20); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.roundRect(-218, -28, 436 * up, 56, 12); g.fillStyle = '#5aff8a'; g.fill();
        g.fillStyle = INK; g.font = '900 34px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ATUALIZANDO ' + Math.round(up * 99) + '%', 0, 100); g.restore();
        tito(g, t, 560, { smile: 0, surprise: 0.3 });
        dia(g, c, { line: 'L09', word: 'seis', offset: -0.1 }, 'DIA 6 · O RECALL');
        chip(g, c, { line: 'L09', word: 'consultado' }, 'O POVO NÃO FOI CONSULTADO', 340, COLORS.red, 42);
        vignette(g, 0.45);
      },
    },
    // 10. MAS CALMA — a Constituição
    {
      id: 'constituicao', world: 'blank', start: { line: 'L10', offset: -0.3 }, transition: 'flash',
      music: { mood: 'wonder', intensity: 0.6 },
      cues: [
        { sfx: 'shimmer', at: { local: 0.2 }, p: { level: 0.14 } },
        { sfx: 'pop', at: { line: 'L10', word: 'poder' }, p: { level: 0.22, freq: 600 } },
        { sfx: 'pop', at: { line: 'L10', word: 'nato' }, p: { level: 0.22, freq: 680 } },
        { sfx: 'ding', at: { line: 'L10', word: 'anos' }, p: { level: 0.14 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t, { flag: false });
        const b = ease(c.k({ local: 0 }, { local: 0.6 }));
        drawBookCF(g, 540, 700 + (1 - b) * 200, 0.9 * (0.7 + 0.3 * b));
        robot(g, t, { x: 850, mood: 'think', armL: 0.5, armR: 0.5, s: 0.7 });
        tito(g, t, 230, { smile: 0.9, armL: 0.5, armR: 0.5 });
        chip(g, c, { line: 'L10', word: 'calma' }, 'NA VIDA REAL', 230, COLORS.gold, 52);
        chip(g, c, { line: 'L10', word: 'poder' }, 'TODO PODER EMANA DO POVO · Art. 1º', 1090, COLORS.green, 34);
        chip(g, c, { line: 'L10', word: 'nato' }, 'PRESIDENTE: BRASILEIRO NATO · Art. 12', 1010, COLORS.blue, 32);
        chip(g, c, { line: 'L10', word: 'anos' }, 'IDADE MÍNIMA: 35 ANOS · Art. 14', 930, COLORS.gold, 34);
        vignette(g, 0.45);
      },
    },
    // 11. A IA JÁ AJUDA: Alice e Victor
    {
      id: 'apoio', world: 'blank', start: { line: 'L11', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.6 },
      cues: [
        { sfx: 'pop', at: { line: 'L11', word: 'alice' }, p: { level: 0.22, freq: 560 } },
        { sfx: 'tech', at: { line: 'L11', word: 'editais' }, p: { count: 8, step: 0.06, level: 0.08 } },
        { sfx: 'pop', at: { line: 'L11', word: 'victor' }, p: { level: 0.22, freq: 660 } },
        { sfx: 'tech', at: { line: 'L11', word: 'recursos' }, p: { count: 8, step: 0.06, level: 0.08 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t, { flag: false });
        const al = ease(c.k({ line: 'L11', word: 'alice', offset: -0.2 }, { line: 'L11', word: 'alice', offset: 0.4 }));
        const vi = ease(c.k({ line: 'L11', word: 'victor', offset: -0.2 }, { line: 'L11', word: 'victor', offset: 0.4 }));
        // esquerda: Alice (editais); direita: Victor (recursos)
        g.save(); g.globalAlpha = Math.max(al, 0.25);
        drawPaper(g, 230, 700, 260, 340, 'EDITAL', -0.06); drawPaper(g, 300, 740, 260, 340, 'EDITAL', 0.05);
        robot(g, t, { x: 240, y: FEET - 20, s: 0.6, mood: 'happy', armL: 0.5, armR: 1.6 });
        g.restore();
        g.save(); g.globalAlpha = Math.max(vi, 0.25);
        drawPaper(g, 760, 700, 260, 340, 'RECURSO', 0.06); drawPaper(g, 830, 740, 260, 340, 'RECURSO', -0.04);
        robot(g, t, { x: 840, y: FEET - 20, s: 0.6, mood: 'happy', armL: 1.6, armR: 0.5, tint: '#e9f1ee' });
        g.restore();
        person(g, t, 540, FEET, 2, { smile: 0.5, armL: 0.5, armR: 0.5 }, 0.7);
        chip(g, c, { line: 'L11', word: 'alice' }, 'ALICE · CGU + TCU', 300, COLORS.gold, 44);
        chip(g, c, { line: 'L11', word: 'editais' }, 'VARRE EDITAIS DE LICITAÇÃO', 390, COLORS.green, 34);
        chip(g, c, { line: 'L11', word: 'victor' }, 'VICTOR · STF + UnB', 480, COLORS.gold, 44);
        chip(g, c, { line: 'L11', word: 'recursos' }, 'SEPARA RECURSOS POR TEMA', 570, COLORS.green, 34);
        vignette(g, 0.45);
      },
    },
    // 12-13. SÓ APOIO, COM SUPERVISÃO HUMANA / QUEM RESPONDE É GENTE
    {
      id: 'gente', world: 'blank', start: { line: 'L12', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.65 },
      cues: [
        { sfx: 'pop', at: { line: 'L12', word: 'apoio' }, p: { level: 0.22, freq: 600 } },
        { sfx: 'shimmer', at: { line: 'L13', word: 'gente' }, p: { level: 0.12 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t);
        const shake = ease(c.k({ line: 'L13', word: 'ajudar' }, { line: 'L13', word: 'gente', offset: 0.3 }));
        robot(g, t, { x: 720, mood: 'happy', armL: lerp(0.4, 1.0, shake), armR: 0.4 });
        tito(g, t, 380, { smile: 0.9, armR: lerp(0.4, 1.2, shake), armL: 0.4 });
        chip(g, c, { line: 'L12', word: 'stf' }, 'O PRÓPRIO STF DIZ:', 250, COLORS.blue, 44);
        chip(g, c, { line: 'L12', word: 'apoio' }, 'IA É SÓ APOIO', 350, COLORS.gold, 54);
        chip(g, c, { line: 'L12', word: 'supervisao' }, 'COM SUPERVISÃO HUMANA', 450, COLORS.green, 44);
        chip(g, c, { line: 'L13', word: 'responde' }, 'A IA AJUDA · A GENTE RESPONDE', 1090, COLORS.gold, 42);
        vignette(g, 0.45);
      },
    },
    // 13. CHAMADA PARA AÇÃO
    {
      id: 'pergunta', world: 'blank', start: { line: 'L14', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.7 },
      cues: [{ sfx: 'pop', at: { line: 'L14', word: 'comenta' }, p: { level: 0.28, freq: 620 } }],
      draw2D(g, c) {
        const t = c.t;
        drawOffice(g, t);
        const wave = c.k({ line: 'L14', word: 'comenta', offset: -0.2 }, { line: 'L14', word: 'comenta', offset: 0.2 });
        const think = c.k({ line: 'L14', word: 'deixaria' }, { line: 'L14', word: 'governar' }) * (1 - wave);
        robot(g, t, { x: 760, mood: think > 0.3 ? 'think' : 'happy', armL: 0.5, armR: 0.5 });
        tito(g, t, 300, { smile: 0.9, surprise: think * 0.4, eyeY: -think * 0.6, armL: 0.45, armR: lerp(0.45, 2.6 + Math.sin(t * 9) * 0.35, wave) });
        const a = c.k({ line: 'L14', word: 'comenta' }, { line: 'L14', word: 'comenta', offset: 0.3 });
        drawChip(g, 'COMENTA AÍ 💬', 540, 330, { size: 54, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.blue });
        chip(g, c, { line: 'L14', word: 'deixaria' }, 'DEIXARIA UMA IA GOVERNAR O BRASIL?', 440, COLORS.gold, 34);
        vignette(g, 0.45);
      },
    },
    // 14. TELA FINAL OBRIGATÓRIA — HISTÓRIAS DO TABOCAL
    {
      id: 'final', world: 'blank', start: { after: 'L14', offset: 0.5 }, transition: 'flash', duration: 6.8,
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
        drawOffice(g, t); g.fillStyle = 'rgba(20,10,50,0.6)'; g.fillRect(0, 0, W, H);
        vignette(g, 0.6);
        drawEndCard(g, c.lt, c.dur, c.t);
      },
      noSubtitles: true, noBug: true,
    },
  ],
};
