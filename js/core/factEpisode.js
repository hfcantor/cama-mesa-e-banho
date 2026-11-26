// Monta um episódio de FATOS REAIS (história, dica ou futuro) a partir de DADOS:
//   fato      → cenário (js/three/worlds/fato.js)
//   subjects  → "o que filmar": ponto (at), tamanho (r) e valores dos objetos naquele enquadramento
//   lines     → as falas (L01…Lnn)
//   plan      → para cada fala: quais subjects mostrar, valores dos objetos (v), animações (la), céu, HUD, sfx
// Os planos de uma fala são distribuídos pelas PALAVRAS dela, então os cortes caem em palavras
// faladas (1–2 s por plano). A câmera de cada plano é calculada a partir do subject + um estilo
// (wide/mid/close/low/side/high/top/macro), alternando para dar o ritmo dos vídeos de referência.
import { cameraPath, shake, clamp01 } from '../render/stage.js';
import { drawEndCard, drawMidCTA, drawCounter } from '../render/overlays.js';
import { drawLedPanel } from '../render/overlays2.js';
import { drawFactTitle, drawBigStat, drawBanner } from '../render/overlays3.js';
import { HUD as HUD1, HUD_SFX as SFX1 } from './levelEpisode.js';

const lerp = (a, b, k) => a + (b - a) * k;
const D2R = Math.PI / 180;
const clampI = (x, a, b) => Math.max(a, Math.min(b, x));
const ramp = (c, d = 0.2, t0 = 0.08) => clamp01((c.lt - t0) / d);

const HUD = {
  ...HUD1,
  title: (g, c, cfg, [o]) => drawFactTitle(g, c.lt, c.dur, c.t, o),
  stat: (g, c, cfg, [o]) => {
    const k = o.text != null ? 1 : clamp01((c.lt - 0.1) / (o.t || 1.0)), n = Math.round(lerp(o.from ?? 0, o.to ?? 0, 1 - Math.pow(1 - k, 2.2)));
    const value = o.text != null ? o.text : (o.fmt ? o.fmt(n) : n.toLocaleString('pt-BR')) + (o.suffix || '');
    drawBigStat(g, c.lt - 0.05, { value, label: o.label, unit: o.unit, y: o.y || 560, color: o.color, danger: o.danger || 0, scale: o.scale || 1 });
  },
  banner: (g, c, cfg, [text, o = {}]) => drawBanner(g, c.lt - 0.05, text, o),
  led2: (g, c, cfg, [label, text, o = {}]) => drawLedPanel(g, label, text, 540, o.y || 1560, { alpha: clamp01(c.lt / 0.25), scale: o.scale || 0.82, danger: o.danger || 0 }),
  tintc: (g, c, cfg, [css, a]) => { g.save(); g.fillStyle = css; g.globalAlpha = typeof a === 'function' ? a(c) : a; g.fillRect(0, 0, 1080, 1920); g.restore(); },
  flashc: (g, c, cfg, [dur = 0.5, css = '#ffffff']) => { const k = 1 - clamp01(c.lt / dur); if (k > 0) { g.save(); g.fillStyle = css; g.globalAlpha = k * k * 0.9; g.fillRect(0, 0, 1080, 1920); g.restore(); } },
};
const HUD_SFX = {
  ...SFX1,
  stat: [['impact', 0.08, { level: 0.55, size: 0.8 }]],
  banner: [['whoosh', 0.0, { dur: 0.4, level: 0.2 }]],
  title: [['impact', 0.5, { level: 0.5, size: 1 }]],
  led2: [['pop', 0.1, { level: 0.2, freq: 540 }]],
};

// ----------------------------- câmera por estilo -----------------------------
// d = distância em múltiplos de r; h = altura em múltiplos de r; a = azimute (graus, 0 = vindo de +z)
const STYLES = {
  wide: { d: 6.4, h: 0.5, a: 0, push: 0.14, orbit: 6, fov: 40 },
  mid: { d: 4.4, h: 0.32, a: -18, push: 0.18, orbit: -8, fov: 38 },
  close: { d: 3.0, h: 0.18, a: 14, push: 0.2, orbit: 5, fov: 34 },
  low: { d: 4.6, h: -0.05, a: -8, push: 0.15, orbit: 4, fov: 44 },
  side: { d: 4.8, h: 0.28, a: 68, push: 0.12, orbit: -10, fov: 38 },
  high: { d: 4.4, h: 1.0, a: 10, push: 0.15, orbit: 6, fov: 38 },
  top: { d: 3.2, h: 2.6, a: 0, push: 0.1, orbit: 0, fov: 40 },
  macro: { d: 2.1, h: 0.08, a: -10, push: 0.2, orbit: 6, fov: 30 },
  back: { d: 4.6, h: 0.3, a: 180, push: 0.15, orbit: -8, fov: 38 },
};
const DEFAULT_STYLES = ['wide', 'mid', 'close', 'side', 'low', 'high', 'macro', 'back'];

function shotCam(sub, style, flip) {
  const S = STYLES[style] || STYLES.mid, r = sub.r || 3, at = sub.at, sg = flip ? -1 : 1;
  const az0 = (S.a * sg + (sub.az || 0)) * D2R, az1 = az0 + S.orbit * sg * D2R;
  const d0 = S.d * r * (sub.zoom || 1), d1 = d0 * (1 - S.push), h0 = S.h * r, h1 = h0 * (1 - S.push * 0.5);
  const minY = sub.minY ?? 0.45, ly = sub.ly ?? 0;
  const mk = (d, h, a, fov) => ({ pos: [at[0] + Math.sin(a) * d, Math.max(at[1] + h, minY), at[2] + Math.cos(a) * d], look: [at[0], at[1] + ly, at[2]], fov });
  return [{ u: 0, ...mk(d0, h0, az0, S.fov) }, { u: 1, ...mk(d1, h1, az1, S.fov * (1 - S.push * 0.15)) }];
}

// mescla { id: {k: v} } sem alterar os originais
function mergeV(a, b) {
  const o = {};
  for (const id in a) o[id] = { ...a[id] };
  for (const id in (b || {})) o[id] = { ...(o[id] || {}), ...b[id], ...(b[id].pose && o[id] && o[id].pose ? { pose: { ...o[id].pose, ...b[id].pose } } : {}) };
  return o;
}
const A = (line, word, offset = 0) => ({ line, word, offset });

export function buildFato(cfg) {
  const { id, titulo, lines: LINES, subjects, plan, fato } = cfg;
  const nwords = (L) => LINES.find(l => l.id === L).text.split(/\s+/).filter(Boolean).length;
  const lastId = LINES[LINES.length - 1].id;
  const FIN = { after: lastId, offset: 0.5 };
  const scenes = [], cues = [{ sfx: 'logo', at: { at: 0.35 }, p: { level: 0.45 } }];
  const carry = { v: {}, skyA: fato.sky || 'night', skyB: null, k: 0, st: {} };
  const defSub = cfg.defaultSubject || Object.keys(subjects)[0];

  LINES.forEach((line, li) => {
    const P = plan[line.id] || {};
    const N = nwords(line.id), n = P.n ?? clampI(Math.round(N / 4.2), 2, 7);
    const subs = P.s || [defSub], lineV = P.v || {}, la = P.la || {}, sta = P.sta || {};
    const startV = JSON.parse(JSON.stringify(carry.v)), startSt = { ...carry.st };
    // céu desta fala
    let skyA = carry.skyA, skyB = carry.skyB, k0 = carry.k, k1 = carry.k;
    if (P.sky) {
      if (Array.isArray(P.sky)) { skyA = P.sky[0]; skyB = P.sky[1]; k0 = P.sky[2] ?? 0; k1 = P.sky[3] ?? 1; }
      else { skyA = P.sky; skyB = null; k0 = k1 = 0; }
    }
    const styles = P.styles || null;
    const hudAll = P.hud || [];
    const sfxAll = P.sfx || [];

    for (let j = 0; j < n; j++) {
      const f0 = j / n, f1 = (j + 1) / n;
      const subName = subs[j % subs.length], sub = subjects[subName];
      if (!sub) throw new Error(`${id}: subject inexistente "${subName}" na fala ${line.id}`);
      const stylePool = styles || sub.styles || DEFAULT_STYLES;
      const style = P.style || stylePool[(li * 2 + j + (sub.off || 0)) % stylePool.length];
      const flip = ((li + j) % 2) === 1;
      const camKeys = sub.cam ? sub.cam(style, flip) : shotCam(sub, style, flip);
      const r = {
        keys: camKeys, f0, f1, v: mergeV(mergeV(startV, sub.v), lineV), la, sta, startSt,
        skyA, skyB, k0: lerp(k0, k1, f0), k1: lerp(k0, k1, f1), skyAnim: Array.isArray(P.sky),
        st: { ...startSt, ...(P.st || {}) },
        shake: P.shake, tr: j === 0 ? (P.tr || 'whip') : (j % 3 === 0 ? 'zoom' : null),
        hud: hudAll.filter(h => h[0] === '*' || h[0] === j || (typeof h[0] === 'number' && h[0] < 0 && n + h[0] === j)).map(h => h.slice(1)),
        sfx: sfxAll.filter(s => s[0] === '*' || s[0] === j || (typeof s[0] === 'number' && s[0] < 0 && n + s[0] === j)).map(s => s.slice(1)),
      };
      const first = li === 0 && j === 0;
      if (first && cfg.title) r.hud.unshift(['title', cfg.title]);
      if (cfg.ctaLine === line.id && j === Math.min(1, n - 1)) r.hud.push(['cta']);
      const wi = Math.round(j * N / n);
      const start = first ? { at: 0 } : { line: line.id, word: wi, offset: -0.03 };
      const name = first ? 'abertura' : `${line.id}-${j + 1}`;
      scenes.push({
        id: name, world: 'fato', start, transition: r.tr, cues: [],
        setup(w) {
          w.reset(); const st = w.st; st.skyA = r.skyA; st.skyB = r.skyB; st.k = r.k0;
          Object.assign(st, r.st); w.apply(r.v);
        },
        update(w, c) {
          const st = w.st;
          if (r.skyAnim) st.k = lerp(r.k0, r.k1, c.u);
          for (const key in r.la) { const [oid, k] = key.split('.'); const [a, b] = r.la[key]; w.setV(oid, k, lerp(lerp(a, b, r.f0), lerp(a, b, r.f1), c.u)); }
          for (const k in r.sta) { const [a, b] = r.sta[k]; st[k] = lerp(lerp(a, b, r.f0), lerp(a, b, r.f1), c.u); }
          cameraPath(c.cam, r.keys, c.u);
          if (r.shake) shake(c.cam, typeof r.shake === 'function' ? r.shake(c) : (r.shake === 'hit' ? Math.max(0, 1 - c.lt * 1.4) * 0.12 : r.shake), c.t);
        },
        draw2D(g, c) { r.hud.forEach(([type, ...args]) => HUD[type] && HUD[type](g, c, cfg, args)); },
        noBug: first,
      });
      const at = (o) => (first ? { at: 0.35 + o } : { ...start, offset: start.offset + o });
      r.hud.forEach(([type]) => (HUD_SFX[type] || []).forEach(([sfx, off, p]) => cues.push({ sfx, at: at(off), p })));
      r.sfx.forEach(([sfx, off, p]) => cues.push({ sfx, at: at(off), p }));
      if (r.tr === 'whip' && !first) cues.push({ sfx: 'whoosh', at: at(-0.14), p: { dur: 0.32, level: 0.1 } });
    }
    // continuidade: o que mudou nesta fala vale para as próximas
    carry.v = mergeV(carry.v, lineV);
    for (const key in la) { const [oid, k] = key.split('.'); carry.v[oid] = { ...(carry.v[oid] || {}), [k]: la[key][1] }; }
    for (const k in sta) carry.st[k] = sta[k][1];
    Object.assign(carry.st, P.st || {});
    if (P.sky) { if (Array.isArray(P.sky) && k1 >= 1) { carry.skyA = skyB; carry.skyB = null; carry.k = 0; } else { carry.skyA = skyA; carry.skyB = skyB; carry.k = k1; } }
  });

  // ---- tela final ----
  const F = cfg.final || {}, fsub = subjects[F.s || defSub];
  const fin = {
    id: 'final', world: 'fato', start: FIN, transition: 'flash', duration: 6.8, cues: [], noBug: true, noSubtitles: true,
    setup(w) { w.reset(); const st = w.st; st.skyA = F.sky || carry.skyA; st.skyB = null; st.k = 0; w.apply(mergeV(mergeV(carry.v, fsub.v), F.v || {})); },
    update(w, c) { cameraPath(c.cam, shotCam(fsub, 'wide', false), c.u); },
    draw2D(g, c) { drawEndCard(g, c.lt, c.dur, c.t); },
  };
  fin.cues = [
    { sfx: 'logo', at: { local: 0.15 }, p: { level: 0.55 } }, { sfx: 'whoosh', at: { local: 1.3 }, p: { dur: 0.5, level: 0.2 } },
    { sfx: 'pop', at: { local: 2.1 }, p: { level: 0.3, freq: 500 } }, { sfx: 'ding', at: { local: 2.15 }, p: { level: 0.12 } },
    { sfx: 'pop', at: { local: 2.45 }, p: { level: 0.3, freq: 620 } }, { sfx: 'pop', at: { local: 2.8 }, p: { level: 0.3, freq: 760 } },
    { sfx: 'shimmer', at: { local: 3.1 }, p: { level: 0.1 } },
  ];
  scenes.push(fin);

  // ---- trilha: por humor, de acordo com a fala ----
  const L = (n) => ({ line: n, offset: -0.2 });
  const M = cfg.music || [['L01', 'mystery', 0.5], [LINES[Math.floor(LINES.length * 0.3)].id, 'tension', 0.7], [LINES[Math.floor(LINES.length * 0.6)].id, 'action', 0.85], [LINES[Math.floor(LINES.length * 0.8)].id, 'wonder', 0.7]];
  const musicPlan = M.map(([ln, mood, intensity], i) => ({ from: i === 0 ? { at: 0 } : L(ln), to: i + 1 < M.length ? L(M[i + 1][0]) : FIN, mood, intensity }));
  musicPlan.push({ from: FIN, to: 'end', mood: 'outro', intensity: 0.9 });

  return {
    id, titulo, roteiroStatus: 'aprovado', intro: 1.25, fato,
    narration: { dir: `audio/${id}/narracao/`, formats: ['mp3', 'wav', 'ogg', 'm4a'], timings: `audio/${id}/narracao/timings.json` },
    lines: LINES, musicPlan, cues, scenes,
  };
}
// câmera "olhando para cima": parte de um ponto no chão e mira num ponto do céu
export const upCam = (from, to, opt = {}) => (style) => {
  const dx = { wide: 0, mid: -3, close: 3, low: -6, side: 6, high: 2, macro: -2, back: 4 }[style] || 0;
  const fov = (opt.fov || 36) * (style === 'close' || style === 'macro' ? 0.75 : 1);
  return [{ u: 0, pos: [from[0] + dx, from[1], from[2]], look: to, fov }, { u: 1, pos: [from[0] + dx * 0.5, from[1], from[2] - 1.2], look: [to[0], to[1] - 0.6, to[2]], fov: fov * 0.92 }];
};
export { shotCam, STYLES };
