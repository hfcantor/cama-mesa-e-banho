// Monta um episódio "E se você nunca lavasse…?" a partir de DADOS:
//   - as falas (L01…L16) e
//   - para cada fala, uma lista de "receitas de plano" (câmera, estado do cenário, HUD…).
// Os planos de uma fala são distribuídos igualmente pelas PALAVRAS dela, então os cortes
// caem sempre numa palavra falada (ritmo de 1–2 s por plano, como nos vídeos de referência)
// e acompanham a narração se o áudio mudar. A trilha, os efeitos sonoros automáticos e a
// tela final vêm prontos.
import { cameraPath, shake, clamp01 } from '../render/stage.js';
import { drawOpeningTitle, drawMidCTA, drawCounter, drawChip, drawEndCard, COLORS } from '../render/overlays.js';
import {
  drawLevelStamp, drawLedPanel, drawSpeedBadge, drawRewindFx, drawTag, drawMark, drawThought,
  drawPopText, drawChecklist, drawZzz, drawMoodTint, drawFlyingPage, drawLens,
} from '../render/overlays2.js';

const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => k * k * (3 - 2 * k);

// presets de estado (mesmos do EP02)
const PRESETS = {
  clean: { day: 0, lamp: 1, mood: 0, dirt: 0, mites: 0 },
  1: { day: 0, lamp: 1, mood: 0, dirt: 0.3, mites: 0.2 },
  2: { day: 0, lamp: 1, mood: 0.3, dirt: 0.6, mites: 0.7 },
  3: { day: 0, lamp: 1, mood: 1, dirt: 1, mold: 1, mites: 1, flies: 1, stink: 0.6 },
  bright: { day: 1, lamp: 0.2, mood: 0, dirt: 0, mites: 0 },
  fresh: { day: 1, lamp: 0.2, mood: 0, dirt: 0, mites: 0, fresh: 1 },
};
const LEVEL_COLOR = { 1: '#FFC83D', 2: '#FF9A3D', 3: '#FF5A4D' };

// ------------------------------- itens de HUD -------------------------------
// cada item: [tipo, ...args] → função (g, c, cfg)
const ramp = (c, d = 0.2, t0 = 0.08) => clamp01((c.lt - t0) / d);
const HUD = {
  open: (g, c) => drawOpeningTitle(g, c.lt, c.dur, c.t),
  stamp: (g, c, cfg, [level, sub, o = {}]) => drawLevelStamp(g, level, sub, c.lt - 0.1, { y: 470, color: o.color || '#FFC83D' }),
  led: (g, c, cfg, [from, to, o = {}]) => {
    const k = clamp01((c.u - 0.2) / 0.7), n = Math.round(lerp(from, to, k));
    const u = cfg.ledUnit || ['DIA', 'DIAS'];
    drawLedPanel(g, o.label || cfg.ledLabel, `${n} ${n === 1 ? u[0] : u[1]}`, 540, o.y || 1560, { alpha: clamp01(c.lt / 0.25), scale: o.scale || 0.82, danger: o.danger || 0 });
  },
  ledBig: (g, c, cfg, [from, to]) => {
    const k = clamp01(c.u / 0.8), n = Math.round(lerp(from, to, k)), blink = Math.sin(c.t * 14) > 0 ? 1 : 0.55;
    drawLedPanel(g, cfg.ledLabel, `${n} ${(cfg.ledUnit || ['DIA', 'DIAS'])[1]}`, 540, 520, { alpha: blink * 0.5 + 0.5, danger: k, scale: 1.0 });
  },
  tag: (g, c, cfg, [text, o = {}]) => { const k = ramp(c); drawTag(g, text, o.x || 540, o.y || 600, { dot: COLORS[o.dot] || o.dot || COLORS.red, sub: o.sub, alpha: k, scale: 0.85 + 0.15 * k, size: o.size || 50 }); },
  thought: (g, c, cfg, [icon, x, y, o = {}]) => drawThought(g, icon, x, y, { lt: c.lt - (o.delay ?? 0.1), tail: o.tail || 'left', scale: o.scale || 1 }),
  mark: (g, c, cfg, [kind, x, y, r = 70]) => drawMark(g, kind, x, y, r, 1, c.lt - 0.15),
  pop: (g, c, cfg, [text, x, y, o = {}]) => drawPopText(g, text, x, y, c.lt - (o.delay ?? 0.05), { color: o.color, dur: o.dur || 1.0, size: o.size || 150 }),
  badge: (g, c, cfg, [text, kind]) => drawSpeedBadge(g, text, kind, { t: c.t }),
  tint: (g, c, cfg, [rgb, s]) => drawMoodTint(g, rgb, typeof s === 'function' ? s(c) : s),
  rewind: (g, c) => drawRewindFx(g, c.t, 1),
  lens: (g, c) => drawLens(g, 540, 800, 440, c.t, clamp01(c.lt / 0.12)),
  zzz: (g, c, cfg, [x, y]) => drawZzz(g, c.t, x, y, clamp01(c.lt / 0.4)),
  fly: (g, c, cfg, [num]) => drawFlyingPage(g, num, c.lt - (c.dur - 0.85)),
  cta: (g, c) => drawMidCTA(g, c.lt + 0.1, c.dur + 0.3, c.t),
  chip: (g, c, cfg, [text, o = {}]) => { const a = ramp(c, 0.3, o.delay ?? 0.1); drawChip(g, text, 540, o.y || 330, { size: 54, alpha: a, scale: 0.7 + 0.3 * a, border: COLORS[o.border] || COLORS.blue }); },
  counter: (g, c, cfg, [label, from, to, o = {}]) => {
    const k = Math.pow(clamp01(c.u * 1.1), o.pow || 1.5), n = Math.round(lerp(from, to, k) / (o.step || 1)) * (o.step || 1);
    drawCounter(g, label, n.toLocaleString('pt-BR'), 540, o.y || 520, { alpha: clamp01(c.lt / 0.2), danger: o.danger ?? c.u * 0.7 });
  },
  checklist: (g, c, cfg, [items]) => drawChecklist(g, items.map(it => ({ text: it.text, sub: it.sub, at: c.T({ line: it.line, word: it.word, offset: 0.1 }) })), 0, c.t, { y: 460 }),
};

// efeitos sonoros automáticos por tipo de HUD (em segundos após o início do plano)
const HUD_SFX = {
  tag: [['pop', 0.1, { level: 0.22, freq: 560 }]], thought: [['pop', 0.12, { level: 0.2, freq: 620 }]],
  mark: [['ding', 0.15, { level: 0.14 }]], pop: [['impact', 0.05, { level: 0.55, size: 0.8 }], ['crack', 0.05, { level: 0.25 }]],
  stamp: [['impact', 0.12, { level: 0.75, size: 1 }]], ledBig: [['alarm', 0.0, { level: 0.05, dur: 1.2 }]],
  badge: [['shimmer', 0.0, { level: 0.08 }]], chip: [['pop', 0.2, { level: 0.28, freq: 620 }]], cta: [['pop', 0.1, { level: 0.26, freq: 640 }], ['ding', 0.12, { level: 0.12 }]],
};

const A = (line, word, offset = 0) => ({ line, word, offset });

export function buildEpisode(cfg) {
  const { id, titulo, lines: LINES, cams, world, stand = [0, 0, 0] } = cfg;
  const nwords = (L) => LINES.find(l => l.id === L).text.split(/\s+/).filter(Boolean).length;
  const FIN = { after: 'L16', offset: 0.5 };
  const scenes = [], cues = [{ sfx: 'logo', at: { at: 0.35 }, p: { level: 0.45 } }];
  const done = new Set();

  const camKeys = (c) => (typeof c === 'string' ? cams[c] : c);
  const mkSpec = (r, name, start, isFinal = false) => ({
    id: name, world, start, transition: r.tr, duration: r.dur, cues: [],
    noBug: isFinal, noSubtitles: isFinal,
    setup(w, c) {
      w.reset();
      Object.assign(w.state, PRESETS[r.lvl ?? 'clean'], { calLabel: cfg.calLabel || 'DIA' });
      w.focus = cfg.focus;
      if (cfg.sign) w.setSign(...cfg.sign);
      if (cfg.set) w.setSet(cfg.set.stove, cfg.set.sign);
      w.state.miteScale = cfg.miteScale ?? 1;
      if (cfg.p) Object.assign(w.state, cfg.p);
      if (r.p) Object.assign(w.state, r.p);
      // Tito: 'lie' (na cama), 'stand', [x,z,ry] ou ausente
      if (r.tito === 'lie') w.setTitoLying(r.titoX ?? -0.4);
      else if (r.tito === 'stand') { w.setTitoStanding(...stand); w.state.titoInBed = 0; }
      else if (Array.isArray(r.tito)) { w.setTitoStanding(...r.tito); w.state.titoInBed = 0; }
      else w.state.titoInBed = 0;
      if (r.pose) Object.keys(r.pose).forEach(k => { w.tito.pose[k] = r.pose[k]; w.tito.cur[k] = r.pose[k]; });
      (r.h || []).forEach(([i, o]) => w.hero(i, o));
      w._f = {};
      r.setup && r.setup(w, c);
    },
    update(w, c) {
      if (r.a) for (const k in r.a) w.state[k] = lerp(r.a[k][0], r.a[k][1], ease(c.u));
      if (r.pa) for (const k in r.pa) w.tito.pose[k] = lerp(r.pa[k][0], r.pa[k][1], ease(c.u));
      if (r.cal) { w.state.calNum = r.cal[0]; w.state.calNext = r.cal[1]; if (r.cal[2]) w.state.calLabel = r.cal[2]; }
      if (r.flip) w.state.calFlip = lerp(r.flip[0], r.flip[1], c.u);
      if (r.calRun) { const n = c.lt * r.calRun[1], i = Math.floor(n); Object.assign(w.state, { calNum: r.calRun[0] + (r.calRun[2] ? (i % 2) : i), calNext: r.calRun[0] + (r.calRun[2] ? ((i + 1) % 2) : i + 1), calFlip: n - i }); }
      r.fn && r.fn(w, c);
      const keys = camKeys(r.cam);
      if (keys) cameraPath(c.cam, keys, c.u);
      if (r.shake) shake(c.cam, typeof r.shake === 'function' ? r.shake(c) : r.shake, c.t);
    },
    draw2D(g, c) { (r.hud || []).forEach(([type, ...args]) => HUD[type] && HUD[type](g, c, cfg, args)); },
  });

  // ---- planos de cada fala, distribuídos pelas palavras ----
  for (const line of LINES) {
    const recs = cfg.plan[line.id] || [];
    const N = nwords(line.id);
    recs.forEach((r, j) => {
      const first = line.id === 'L01' && j === 0;
      const wi = r.w ?? Math.round(j * N / recs.length);
      const start = first ? { at: 0 } : { line: line.id, word: wi, offset: -0.03 + (r.off || 0) };
      const name = r.id || `${line.id}-${j + 1}`;
      if (r.open) r.id = name;
      const sp = mkSpec(r, first ? 'abertura' : name, start);
      scenes.push(sp);
      // efeitos automáticos
      const at = (o) => (first ? { at: 0.35 + o } : { ...start, offset: start.offset + o });
      (r.hud || []).forEach(([type]) => (HUD_SFX[type] || []).forEach(([sfx, off, p]) => cues.push({ sfx, at: at(off), p })));
      (r.sfx || []).forEach(([sfx, off, p]) => cues.push({ sfx, at: at(off), p }));
      if ((r.hud || []).some(h => h[0] === 'stamp') && String(r.hud.find(h => h[0] === 'stamp')[1]).includes('TRÊS')) cues.push({ sfx: 'braam', at: at(0.1), p: { dur: 3.2, level: 0.45 } });
    });
  }

  // ---- tela final ----
  const fin = mkSpec({ lvl: 'fresh', tito: 'stand', cam: cfg.finalCam || 'wide', tr: 'flash', dur: 6.8, hud: [['end']] }, 'final', FIN, true);
  fin.draw2D = (g, c) => drawEndCard(g, c.lt, c.dur, c.t);
  fin.cues = [
    { sfx: 'logo', at: { local: 0.15 }, p: { level: 0.55 } }, { sfx: 'whoosh', at: { local: 1.3 }, p: { dur: 0.5, level: 0.2 } },
    { sfx: 'pop', at: { local: 2.1 }, p: { level: 0.3, freq: 500 } }, { sfx: 'ding', at: { local: 2.15 }, p: { level: 0.12 } },
    { sfx: 'pop', at: { local: 2.45 }, p: { level: 0.3, freq: 620 } }, { sfx: 'pop', at: { local: 2.8 }, p: { level: 0.3, freq: 760 } },
    { sfx: 'shimmer', at: { local: 3.1 }, p: { level: 0.1 } },
  ];
  scenes.push(fin);

  const L = (n) => ({ line: n, offset: -0.2 });
  return {
    id, titulo, roteiroStatus: 'aprovado', intro: 1.25,
    narration: { dir: `audio/${id}/narracao/`, formats: ['mp3', 'wav', 'ogg', 'm4a'], timings: `audio/${id}/narracao/timings.json` },
    lines: LINES,
    musicPlan: [
      { from: { at: 0 }, to: L('L03'), mood: 'mystery', intensity: 0.5 },
      { from: L('L03'), to: L('L06'), mood: 'calm', intensity: 0.65 },
      { from: L('L06'), to: L('L10'), mood: 'tension', intensity: 0.75 },
      { from: L('L10'), to: L('L13'), mood: 'action', intensity: 0.9 },
      { from: L('L13'), to: L('L16'), mood: 'wonder', intensity: 0.7 },
      { from: L('L16'), to: FIN, mood: 'calm', intensity: 0.6 },
      { from: FIN, to: 'end', mood: 'outro', intensity: 0.9 },
    ],
    cues,
    scenes,
  };
}
