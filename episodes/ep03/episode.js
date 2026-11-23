// ============================================================================
//  E SE...? — Episódio 03: "E se a gravidade desligasse por 10 segundos?"
//  HISTÓRIAS DO TABOCAL
// ----------------------------------------------------------------------------
//  Ciência em tom de aventura. Tudo que é número no texto é verificável:
//   - A Terra gira a cerca de 1.670 km/h no equador.
//   - Sem gravidade, em 10 s você se afastaria do chão menos de 2 m no equador
//     (aceleração centrípeta ≈ 0,034 m/s²  →  ½·0,034·10² ≈ 1,7 m).
//  Os objetos subindo rápido são exagero visual para a história; o final avisa.
//
//  NARRAÇÃO: audio/ep03/narracao/L01 ... L12 (ver tools/).
// ============================================================================
import { drawOpeningTitle, drawMidCTA, drawCounter, drawChip, drawEndCard, COLORS } from '../../js/render/overlays.js';
import { drawProp, drawStickman, drawFloaters, drawBamboo, drawSky, drawLand, vignette, groundShadow, speedLines, drawDust, drawRuler, jit, clamp01, lerp, INK } from '../../js/render/toon.js';

// Estilo 2D de bonequinho (js/render/toon.js). Altitude A em pixels: a câmera sobe junto com o Tito.
const GROUND = 1500; // pés do Tito no chão: a cabeça fica acima da faixa das legendas
const camAlt = (A) => Math.max(0, A - 500);
const S_TITO = 0.85;

function cam(g, { zoom = 1, px = 0, py = 0, shake = 0, t = 0 } = {}) {
  g.save();
  g.translate(540 + px + jit(t, 1, shake), 960 + py + jit(t, 2, shake));
  g.scale(zoom, zoom); g.translate(-540, -960);
}
function idle(t, extra = {}) { return { bob: Math.sin(t * 2.2) * 3, blink: (t % 3.7) < 0.12 ? 1 : 0, ...extra }; }
function tito(g, t, x, y, pose, o = {}) { return drawStickman(g, t, { x, y, s: S_TITO, tunic: '#e0563a', hat: true, pose: idle(t, pose), ...o }); }

// um quadro do mundo na altitude A (px). f = quanto as coisas já flutuam (0..1)
function world(g, t, { A = 0, f = 0, props = true, bambooX = null, bambooLift = 0, dusk = 0, island = 0 }) {
  const alt = camAlt(A);
  drawSky(g, t, alt, dusk);
  if (island > 0) { g.save(); g.globalAlpha = island; drawLand(g, 0, { island: 1, t }); g.restore(); }
  g.save(); g.translate(0, alt); drawLand(g, 0);
  if (bambooX != null) drawBamboo(g, t, bambooX, GROUND, bambooLift, 1);
  if (props) drawFloaters(g, t, f);
  g.restore();
}

export default {
  id: 'ep03',
  titulo: 'E se a gravidade desligasse por 10 segundos?',
  roteiroStatus: 'aprovado',
  intro: 1.25,
  narration: {
    dir: 'audio/ep03/narracao/',
    formats: ['wav', 'mp3'],
    timings: 'audio/ep03/narracao/timings.json',
  },

  // ---------------------------- ROTEIRO ----------------------------------
  lines: [
    { id: 'L01', text: 'E se... a gravidade desligasse por dez segundos?', emph: { gravidade: 'gold', desligasse: 'red', dez: 'gold' }, pause: 0.7 },
    { id: 'L02', text: 'Numa manhã comum, aqui no Tabocal, o Tito regava as plantas do quintal.', emph: { tabocal: 'gold', tito: 'gold', plantas: 'green' }, pause: 0.45 },
    { id: 'L03', text: 'De repente... tudo começou a flutuar.', emph: { repente: 'red', flutuar: 'blue' }, pause: 0.7 },
    { id: 'L04', text: 'Primeiro, o balde, a bola e o chapéu do Tito. Depois, as cadeiras e os caixotes.', emph: { balde: 'blue', bola: 'gold', chapeu: 'gold', cadeiras: 'orange', caixotes: 'orange' }, pause: 0.5 },
    { id: 'L05', text: 'O Tito se agarrou no bambuzal… e o bambuzal inteiro saiu do chão.', emph: { agarrou: 'gold', bambuzal: 'green', saiu: 'red' }, pause: 0.55 },
    { id: 'L06', text: 'Se tá curtindo, já deixa o like e segue o perfil… porque o Tito ainda está subindo.', emph: { like: 'red', segue: 'gold', subindo: 'blue' }, pause: 0.55 },
    { id: 'L07', text: 'Lá do alto, o Tabocal parecia um brinquedo.', emph: { alto: 'blue', tabocal: 'gold', brinquedo: 'gold' }, pause: 0.7 },
    { id: 'L08', text: 'E então... os dez segundos acabaram.', emph: { dez: 'gold', acabaram: 'red' }, pause: 0.35 },
    { id: 'L09', text: 'Tudo caiu de uma vez. Inclusive o Tito.', emph: { caiu: 'red', tito: 'gold' }, pause: 0.9 },
    { id: 'L10', text: 'Mas calma. Na vida real, em dez segundos, você subiria menos de dois metros.', emph: { calma: 'green', dez: 'gold', menos: 'gold', dois: 'gold', metros: 'gold' }, pause: 0.55 },
    { id: 'L11', text: 'Ou seja… o Tito pode regar as plantas tranquilo.', emph: { tranquilo: 'green' }, pause: 0.8 },
    { id: 'L12', text: 'E você? O que você faria sem gravidade? Comenta aí!', emph: { voce: 'gold', gravidade: 'blue', comenta: 'blue' }, pause: 0.6 },
  ],

  cues: [],


  // ------------------------------ CENAS ----------------------------------
  // Todas as cenas usam o mundo 'blank' e desenham o quadro inteiro em 2D (draw2D).
  scenes: [
    // 1. ABERTURA
    {
      id: 'abertura', world: 'blank', start: { at: 0 }, transition: 'fade',
      music: { mood: 'wonder', intensity: 0.45 },
      cues: [
        { sfx: 'logo', at: { local: 0.35 }, p: { level: 0.45 } },
        { sfx: 'whoosh', at: { local: 0.2 }, p: { dur: 0.8, level: 0.3 } },
      ],
      draw2D(g, c) {
        cam(g, { zoom: lerp(1, 1.1, c.u), py: lerp(0, 30, c.u), t: c.t });
        world(g, c.t, {});
        groundShadow(g, 760, GROUND + 14, 120);
        tito(g, c.t, 760, GROUND, { smile: 0.9, armL: 0.5, armR: 0.5 }, { s: 0.55 });
        g.restore(); vignette(g);
        drawOpeningTitle(g, c.lt, c.dur, c.t);
      },
    },

    // 2. GANCHO — Tito regando as plantas
    {
      id: 'quintal', world: 'blank', start: { line: 'L02', offset: -0.35 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.5 },
      cues: [
        { sfx: 'crickets', span: 'scene', p: { level: 0.03 } },
        { sfx: 'wind', span: 'scene', p: { level: 0.05 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        cam(g, { zoom: lerp(1.05, 1.22, c.u), px: lerp(0, -60, c.u), py: lerp(0, -40, c.u), t });
        world(g, t, { props: false });
        // canteiro com vasos
        [[760, 1.0], [880, 0.9], [980, 1.05]].forEach(([x, s]) => { g.save(); g.translate(x, GROUND - 6); g.scale(s * 1.5, s * 1.5); drawProp(g, 'vaso', 70, t); g.restore(); });
        groundShadow(g, 400, GROUND + 14, 150);
        tito(g, t, 400, GROUND, { smile: 0.9, armL: 0.35, armR: 1.75, eyeX: 1, lean: -0.03 }, {
          s: 0.95,
          holdR: (gg, hx, hy) => {
            gg.save(); gg.translate(hx + 6, hy);
            gg.beginPath(); gg.moveTo(-46, -34); gg.lineTo(70, -34); gg.lineTo(80, 50); gg.lineTo(-56, 50); gg.closePath(); gg.fillStyle = '#3d8fd0'; gg.fill(); gg.lineWidth = 8; gg.strokeStyle = INK; gg.stroke();
            gg.beginPath(); gg.moveTo(78, 28); gg.lineTo(170, -22); gg.lineWidth = 12; gg.stroke(); gg.lineWidth = 6; gg.strokeStyle = '#3d8fd0'; gg.stroke();
            gg.restore();
          },
        });
        // gotas do regador até as plantas
        const x0 = 400 + 120, y0 = GROUND - 640;
        for (let i = 0; i < 16; i++) {
          const k = ((t * 1.6 + i / 16) % 1), x = x0 + 210 + k * 220, y = y0 + 30 + k * k * 560;
          g.fillStyle = '#7fd0ff'; g.beginPath(); g.ellipse(x, y, 7, 11, 0, 0, Math.PI * 2); g.fill();
        }
        g.restore(); vignette(g);
      },
    },

    // 3. TUDO COMEÇA A FLUTUAR
    {
      id: 'flutua', world: 'blank', start: { line: 'L03', offset: -0.35 }, transition: 'flash',
      music: { mood: 'mystery', intensity: 0.6 },
      cues: [
        { sfx: 'braam', at: { line: 'L03', word: 'flutuar' }, p: { dur: 2.6, level: 0.3 } },
        { sfx: 'riser', at: { line: 'L03', word: 'flutuar' }, until: { line: 'L04', word: 'caixotes', offset: 0.8 }, p: { level: 0.18 } },
        { sfx: 'whoosh', at: { line: 'L04', word: 'balde', offset: -0.1 }, p: { dur: 0.7, level: 0.3 } },
        { sfx: 'pop', at: { line: 'L04', word: 'balde' }, p: { level: 0.2, freq: 560 } },
        { sfx: 'pop', at: { line: 'L04', word: 'bola' }, p: { level: 0.2, freq: 660 } },
        { sfx: 'pop', at: { line: 'L04', word: 'chapeu' }, p: { level: 0.2, freq: 760 } },
        { sfx: 'pop', at: { line: 'L04', word: 'cadeiras' }, p: { level: 0.2, freq: 520 } },
        { sfx: 'pop', at: { line: 'L04', word: 'caixotes' }, p: { level: 0.2, freq: 620 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const f = c.k({ line: 'L03', word: 'flutuar', offset: -0.1 }, { line: 'L04', word: 'caixotes', offset: 1.2 }) * 0.55;
        const look = c.k({ line: 'L03', word: 'flutuar' }, { line: 'L04', word: 'balde' });
        cam(g, { zoom: 1, t, shake: look * 3 });
        world(g, t, { f });
        groundShadow(g, 540, GROUND + 14, 140);
        tito(g, t, 540, GROUND - f * 40, { smile: 0, mouth: look * 0.8, surprise: look, eyeY: -look, armL: lerp(0.4, 2.2, look), armR: lerp(0.4, 2.2, look), sweat: look }, { s: 0.9 });
        g.restore(); vignette(g);
      },
    },

    // 4. O BAMBUZAL SAI DO CHÃO
    {
      id: 'bambuzal', world: 'blank', start: { line: 'L05', offset: -0.35 }, transition: 'cut',
      music: { mood: 'tension', intensity: 0.7 },
      cues: [
        { sfx: 'rumble', at: { line: 'L05', word: 'saiu' }, until: { after: 'L05', offset: 0.3 }, p: { level: 0.3 } },
        { sfx: 'crack', at: { line: 'L05', word: 'saiu' }, p: { level: 0.5 } },
        { sfx: 'whoosh', at: { line: 'L05', word: 'inteiro' }, p: { dur: 0.8, level: 0.3 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const grab = c.k({ line: 'L05', word: 'agarrou' }, { line: 'L05', word: 'agarrou', offset: 0.4 });
        const lift = c.k({ line: 'L05', word: 'saiu' }, { after: 'L05', offset: 0.2 });
        const A = lift * 500, f = 0.55 + lift * 0.1;
        cam(g, { zoom: 1, shake: lift * 6 * (1 - lift) + grab * 1.5, t });
        world(g, t, { A, f, bambooX: 540, bambooLift: A });
        if (lift < 0.05) groundShadow(g, 540, GROUND + 14, 150);
        tito(g, t, 540, GROUND - A + camAlt(A), { smile: 0, surprise: grab, mouth: lift * 0.9, armL: lerp(0.4, 2.85, grab), armR: lerp(0.4, 2.85, grab), legL: lift * 0.5, legR: -lift * 0.5, sweat: grab });
        g.restore(); vignette(g);
      },
    },

    // 5. CHAMADA PARA CURTIR/SEGUIR — Tito subindo
    {
      id: 'subindo', world: 'blank', start: { line: 'L06', offset: -0.3 }, transition: 'cut',
      music: { mood: 'tension', intensity: 0.8 },
      cues: [
        { sfx: 'pop', at: { line: 'L06', offset: 0.1 }, p: { level: 0.25 } },
        { sfx: 'ding', at: { line: 'L06', word: 'like' }, p: { level: 0.14 } },
        { sfx: 'pop', at: { line: 'L06', word: 'segue' }, p: { level: 0.2, freq: 700 } },
        { sfx: 'riser', at: { line: 'L06', word: 'subindo', offset: -0.8 }, until: { after: 'L06' }, p: { level: 0.2 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const up = c.k({ local: 0 }, { fromEnd: 0 });
        const A = lerp(500, 2900, up), alt = camAlt(A), f = lerp(0.65, 1, up);
        cam(g, { zoom: 1, shake: 2, t });
        world(g, t, { A, f, bambooX: 540, bambooLift: A, island: clamp01((alt - 1900) / 500) });
        tito(g, t, 540, GROUND - A + alt, { smile: 0, mouth: 0.6, surprise: 0.6, armL: 2.85, armR: 2.85, legL: 0.5 + Math.sin(t * 5) * 0.1, legR: -0.5 - Math.sin(t * 5) * 0.1, sweat: 1 });
        g.restore(); vignette(g);
        const L = c.tl.byId.L06;
        drawMidCTA(g, c.t - L.start + 0.1, L.end - L.start + 0.5, c.t);
        const show = c.k({ line: 'L06', word: 'subindo', offset: -0.5 }, { line: 'L06', word: 'subindo', offset: 0.1 });
        drawCounter(g, 'ALTITUDE DO TITO', Math.round(A / 25) + ' m', 540, 640, { alpha: show });
      },
    },

    // 6. LÁ DO ALTO
    {
      id: 'alto', world: 'blank', start: { line: 'L07', offset: -0.3 }, transition: 'fade',
      music: { mood: 'wonder', intensity: 0.75 },
      cues: [
        { sfx: 'shimmer', at: { line: 'L07', word: 'brinquedo', offset: -0.3 }, p: { level: 0.12 } },
        { sfx: 'wind', span: 'scene', p: { level: 0.12 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const A = 2900 + Math.sin(t * 1.2) * 30, alt = camAlt(A);
        cam(g, { zoom: lerp(1, 1.08, c.u), t });
        world(g, t, { A, f: 1, bambooX: 540, bambooLift: A, island: 1 });
        const sway = Math.sin(t * 0.9) * 0.05;
        g.save(); g.translate(540, 1000); g.rotate(sway); g.translate(-540, -1000);
        tito(g, t, 540, GROUND - A + alt, { smile: 0.8, surprise: 0.3, armL: 2.85, armR: 2.85, legL: 0.3, legR: -0.3 });
        g.restore();
        g.restore(); vignette(g);
        const a = c.k({ line: 'L07', word: 'brinquedo', offset: -0.4 }, { line: 'L07', word: 'brinquedo', offset: 0.1 }) * (1 - c.k({ fromEnd: 0.5 }, { fromEnd: 0.1 }));
        drawChip(g, 'TABOCAL VISTO DE CIMA', 540, 560, { size: 46, alpha: a, scale: 0.9 + 0.1 * a, border: COLORS.blue });
      },
    },

    // 7. OS DEZ SEGUNDOS ACABAM — queda
    {
      id: 'queda', world: 'blank', start: { line: 'L08', offset: -0.3 }, transition: 'flash',
      music: { mood: 'action', intensity: 0.9 },
      cues: [
        { sfx: 'braam', at: { line: 'L08', word: 'acabaram' }, p: { dur: 2.2, level: 0.35 } },
        { sfx: 'whoosh', at: { line: 'L09', word: 'caiu', offset: -0.2 }, p: { dur: 1.2, level: 0.4, reverse: true } },
        { sfx: 'impact', at: { line: 'L09', word: 'caiu', offset: 1.0 }, p: { level: 0.7 } },
        { sfx: 'crack', at: { line: 'L09', word: 'caiu', offset: 1.0 }, p: { level: 0.4 } },
        { sfx: 'impact', at: { line: 'L09', word: 'tito', offset: 0.25 }, p: { level: 0.5, size: 0.6 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const d = c.k({ line: 'L08', word: 'acabaram', offset: 0.35 }, { line: 'L09', word: 'caiu', offset: 1.1 });
        const fall = d * d;
        const A = 2900 * (1 - fall), alt = camAlt(A);
        const hit = c.since({ line: 'L09', word: 'caiu', offset: 1.1 });
        cam(g, { zoom: 1, shake: hit > 0 ? Math.max(0, 1 - hit * 2.5) * 26 : 2, t });
        world(g, t, { A, f: 1 - fall, bambooX: 540, bambooLift: A, island: clamp01((alt - 1900) / 500) });
        const feet = GROUND - A + alt;
        if (hit <= 0) {
          if (fall > 0.05) speedLines(g, t, 540, 960, 14, 800, 0.55 * clamp01(fall * 3) * (1 - clamp01((feet - 1100) / 400)));
          tito(g, c.t, 540, feet, { smile: 0, mouth: 1, surprise: 1, armL: 2.5, armR: 2.5, legL: 0.5, legR: -0.5, sweat: 1, eyeY: -1 }, { s: S_TITO });
        } else {
          drawDust(g, t, 540, GROUND, clamp01(hit / 0.9));
          tito(g, c.t, 540, GROUND, { smile: -0.3, mouth: 0.25, surprise: 0.2, armL: 0.9, armR: 0.9, tilt: Math.sin(t * 9) * 0.12 * Math.max(0, 1 - hit), sweat: 1 }, { s: S_TITO });
        }
        g.restore(); vignette(g);
      },
    },

    // 8. "Mas calma" — na vida real
    {
      id: 'realidade', world: 'blank', start: { line: 'L10', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.5 },
      cues: [
        { sfx: 'pop', at: { line: 'L10', word: 'menos' }, p: { level: 0.2 } },
        { sfx: 'ding', at: { line: 'L10', word: 'metros' }, p: { level: 0.12 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        // exatamente o que a física diz: ~1,7 m em 10 s no equador (1 m = 300 px)
        const rise = c.k({ line: 'L10', word: 'dez' }, { line: 'L10', word: 'dois', offset: 0.2 });
        cam(g, { zoom: 1, t });
        world(g, t, { f: 0 });
        drawRuler(g, 860, GROUND, 300, 2, rise > 0.98 ? 1.7 : null);
        groundShadow(g, 440, GROUND + 14, 130 * (1 - rise * 0.15));
        tito(g, t, 440, GROUND - rise * 1.7 * 300, { smile: 0.7, surprise: 0.5 * rise, armL: 0.5 + rise * 0.6, armR: 0.5 + rise * 0.6 }, { s: 0.75 });
        g.restore(); vignette(g);
        const a = c.k({ line: 'L10', word: 'menos' }, { line: 'L10', word: 'menos', offset: 0.3 });
        drawChip(g, 'NO EQUADOR: ~1,7 m EM 10 s', 540, 480, { size: 44, alpha: a, scale: 0.8 + 0.2 * a, border: COLORS.green, color: '#c8ffd0' });
        const b = c.k({ line: 'L10', word: 'calma' }, { line: 'L10', word: 'calma', offset: 0.3 });
        drawChip(g, 'NA VIDA REAL', 540, 380, { size: 52, alpha: b, scale: 0.8 + 0.2 * b, border: COLORS.gold });
      },
    },

    // 9. FINAL — Tito tranquilo
    {
      id: 'tranquilo', world: 'blank', start: { line: 'L11', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.6 },
      cues: [{ sfx: 'shimmer', at: { line: 'L11', word: 'tranquilo' }, p: { level: 0.1 } }],
      draw2D(g, c) {
        const t = c.t;
        cam(g, { zoom: lerp(1.05, 1.22, c.u), px: lerp(0, -60, c.u), py: lerp(0, -40, c.u), t });
        world(g, t, { props: false });
        [[760, 1.0], [880, 0.9], [980, 1.05]].forEach(([x, s]) => { g.save(); g.translate(x, GROUND - 6); g.scale(s * 1.5, s * 1.5); drawProp(g, 'vaso', 70, t); g.restore(); });
        groundShadow(g, 400, GROUND + 14, 150);
        tito(g, t, 400, GROUND, { smile: 1, armL: 0.35, armR: 1.75, eyeX: 1 }, {
          s: 0.95,
          holdR: (gg, hx, hy) => {
            gg.save(); gg.translate(hx + 6, hy);
            gg.beginPath(); gg.moveTo(-46, -34); gg.lineTo(70, -34); gg.lineTo(80, 50); gg.lineTo(-56, 50); gg.closePath(); gg.fillStyle = '#3d8fd0'; gg.fill(); gg.lineWidth = 8; gg.strokeStyle = INK; gg.stroke();
            gg.beginPath(); gg.moveTo(78, 28); gg.lineTo(170, -22); gg.lineWidth = 12; gg.stroke(); gg.lineWidth = 6; gg.strokeStyle = '#3d8fd0'; gg.stroke();
            gg.restore();
          },
        });
        const x0 = 400 + 120, y0 = GROUND - 640;
        for (let i = 0; i < 16; i++) { const k = ((t * 1.6 + i / 16) % 1), x = x0 + 210 + k * 220, y = y0 + 30 + k * k * 560; g.fillStyle = '#7fd0ff'; g.beginPath(); g.ellipse(x, y, 7, 11, 0, 0, Math.PI * 2); g.fill(); }
        g.restore(); vignette(g);
      },
    },

    // 10. CHAMADA PARA AÇÃO
    {
      id: 'pergunta', world: 'blank', start: { line: 'L12', offset: -0.3 }, transition: 'cut',
      music: { mood: 'calm', intensity: 0.7 },
      cues: [
        { sfx: 'crickets', span: 'scene', p: { level: 0.03 } },
        { sfx: 'pop', at: { line: 'L12', word: 'comenta' }, p: { level: 0.28, freq: 620 } },
      ],
      draw2D(g, c) {
        const t = c.t;
        const wave = c.k({ line: 'L12', word: 'comenta', offset: -0.2 }, { line: 'L12', word: 'comenta', offset: 0.2 });
        const think = c.k({ line: 'L12', word: 'faria' }, { line: 'L12', word: 'gravidade' }) * (1 - wave);
        cam(g, { zoom: lerp(1.1, 1.25, c.u), py: -50, t });
        world(g, t, { props: false });
        groundShadow(g, 540, GROUND + 14, 150);
        tito(g, t, 540, GROUND, { smile: 0.9, surprise: think * 0.5, armL: 0.45, armR: lerp(0.45, 2.6 + Math.sin(t * 9) * 0.35, wave), eyeY: -think * 0.6 }, { s: 0.95 });
        g.restore(); vignette(g);
        const a = c.k({ line: 'L12', word: 'comenta' }, { line: 'L12', word: 'comenta', offset: 0.3 });
        drawChip(g, 'COMENTA AÍ 💬', 540, 330, { size: 54, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS.blue });
      },
    },

    // 11. TELA FINAL OBRIGATÓRIA — HISTÓRIAS DO TABOCAL
    {
      id: 'final', world: 'blank', start: { after: 'L12', offset: 0.5 }, transition: 'flash', duration: 6.8,
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
        cam(g, { zoom: 1.05, t });
        world(g, t, { props: false, dusk: 0.8 });
        groundShadow(g, 300, GROUND + 14, 120);
        tito(g, t, 300, GROUND, { smile: 1, armL: 0.5, armR: 0.5 }, { s: 0.6 });
        g.restore(); vignette(g, 0.6);
        drawEndCard(g, c.lt, c.dur, c.t);
      },
      noSubtitles: true, noBug: true,
    },
  ],
};
