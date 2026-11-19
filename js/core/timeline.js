// Linha do tempo: resolve o roteiro (falas, cenas, cues) em tempos absolutos.
// Quando existe áudio de narração, a duração real de cada trecho (detectada
// na forma de onda) define o tempo. Sem áudio, usa uma estimativa
// determinística baseada em sílabas — e a interface avisa que é pré-visualização.

const PUNCT_PAUSE = { ',': 0.22, ';': 0.3, ':': 0.3, '.': 0.42, '!': 0.42, '?': 0.45, '…': 0.55 };
const SYL_PER_SEC = 4.6; // ritmo dramático de narração em pt-BR

export function normWord(w) {
  return w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

export function syllables(word) {
  const w = normWord(word);
  if (!w) return 0;
  if (/^\d+$/.test(w)) return w.length * 1.5; // números são falados por extenso
  const groups = w.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

function trailingPause(word) {
  if (/\.\.\.$|…$/.test(word)) return PUNCT_PAUSE['…'];
  const c = word.slice(-1);
  return PUNCT_PAUSE[c] || 0;
}

export function tokenize(text) {
  return text.split(/\s+/).filter(Boolean);
}

// Distribui palavras dentro de [0, dur] de forma proporcional às sílabas
// e às pausas de pontuação (sem aleatoriedade).
export function proportionalWords(words, dur) {
  const weights = words.map(w => syllables(w) || 0.5);
  const gaps = words.map((w, i) => (i < words.length - 1 ? trailingPause(w) * SYL_PER_SEC : 0));
  const total = weights.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  const k = dur / total;
  let t = 0;
  return words.map((w, i) => {
    const s = t;
    const e = s + weights[i] * k;
    t = e + gaps[i] * k;
    return { w, start: s, end: e };
  });
}

export function estimateDuration(words) {
  let syl = 0, pause = 0;
  words.forEach((w, i) => {
    syl += syllables(w) || 0.5;
    if (i < words.length - 1) pause += trailingPause(w);
  });
  return syl / SYL_PER_SEC + pause;
}

// Agrupa palavras em blocos de legenda curtos (estilo vídeos verticais).
function chunkWords(words, maxChars = 17, maxWords = 4) {
  const chunks = [];
  let cur = [];
  let len = 0;
  words.forEach((wd, i) => {
    const l = wd.w.length;
    if (cur.length && (len + l + 1 > maxChars || cur.length >= maxWords)) {
      chunks.push(cur); cur = []; len = 0;
    }
    cur.push(wd); len += l + 1;
    if (i < words.length - 1 && (/[.!?…]$/.test(wd.w) || (/[,;:]$/.test(wd.w) && cur.length >= 2))) {
      chunks.push(cur); cur = []; len = 0;
    }
  });
  if (cur.length) chunks.push(cur);
  return chunks;
}

/**
 * @param episode   definição do episódio
 * @param narration Map(lineId -> { buffer, onset, offset, words? }) — áudio real carregado
 */
export function buildTimeline(episode, narration = new Map()) {
  const lines = [];
  const byId = {};
  let cursor = episode.intro ?? 1.0;
  for (const def of episode.lines) {
    const words = tokenize(def.text);
    const real = narration.get(def.id);
    cursor += def.delay || 0;
    let speechDur, audioStart = null, wordTimes;
    if (real) {
      speechDur = real.offset - real.onset;
      audioStart = cursor - real.onset;
      if (real.words && real.words.length === words.length) {
        // Timestamps de palavra vindos de alinhamento (timings.json) — relativos ao arquivo
        wordTimes = real.words.map((r, i) => ({ w: words[i], start: r[1] - real.onset, end: r[2] - real.onset }));
      } else {
        wordTimes = proportionalWords(words, speechDur);
      }
    } else {
      speechDur = def.est ?? estimateDuration(words);
      wordTimes = proportionalWords(words, speechDur);
    }
    const start = cursor;
    const end = start + speechDur;
    const absWords = wordTimes.map(x => ({ ...x, start: start + x.start, end: start + x.end, key: normWord(x.w) }));
    const emph = def.emph || {};
    absWords.forEach(x => { x.color = emph[x.key] || null; });
    const line = {
      id: def.id, text: def.text, start, end, words: absWords,
      audio: real ? { buffer: real.buffer, at: audioStart, gain: real.gain ?? 1 } : null,
      chunks: null,
    };
    line.chunks = chunkWords(absWords).map((ws, i, arr) => ({
      words: ws,
      start: ws[0].start - 0.06,
      end: i < arr.length - 1 ? arr[i + 1][0].start - 0.06 : end + 0.28,
    }));
    lines.push(line);
    byId[def.id] = line;
    cursor = end + (def.pause ?? 0.45);
  }

  const T = (a) => resolveAnchor(a, byId, scenesById);
  const scenesById = {};
  const scenes = episode.scenes.map(s => ({ def: s, id: s.id }));
  scenes.forEach(s => { scenesById[s.id] = s; });
  // início das cenas em ordem (podem depender apenas de falas)
  scenes.forEach(s => { s.start = resolveAnchor(s.def.start, byId, {}); });
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    s.end = i < scenes.length - 1 ? scenes[i + 1].start : s.start + (s.def.duration ?? 7);
    s.dur = s.end - s.start;
  }
  const duration = scenes[scenes.length - 1].end;

  const cues = [];
  const addCue = (c, scene) => {
    const at = c.at ? resolveAnchor(c.at, byId, scenesById, scene) : scene ? scene.start : 0;
    let dur = c.dur;
    if (c.until) dur = resolveAnchor(c.until, byId, scenesById, scene) - at;
    if (c.span === 'scene' && scene) dur = scene.end - at;
    cues.push({ ...c, time: at, dur: dur ?? 0 });
  };
  (episode.cues || []).forEach(c => addCue(c, null));
  // efeitos automáticos das transições
  const TR_SFX = { whip: { sfx: 'whoosh', off: -0.3, p: { dur: 0.45, level: 0.32 } }, zoom: { sfx: 'whoosh', off: -0.35, p: { dur: 0.5, level: 0.3 } }, glitch: { sfx: 'tech', off: -0.2, p: { count: 8, step: 0.04, level: 0.07 } }, flash: { sfx: 'impact', off: 0, p: { level: 0.35, size: 0.8 } } };
  scenes.forEach((s, i) => {
    const tr = i > 0 && TR_SFX[s.def.transition];
    if (tr) cues.push({ sfx: tr.sfx, time: s.start + tr.off, dur: 0, p: tr.p });
  });
  scenes.forEach(s => (s.def.cues || []).forEach(c => addCue(c, s)));
  cues.sort((a, b) => a.time - b.time);

  return { lines, byId, scenes, scenesById, cues, duration, T, hasNarration: narration.size > 0 };
}

export function resolveAnchor(a, byId, scenesById = {}, scene = null) {
  if (a == null) return 0;
  if (typeof a === 'number') return a;
  const off = a.offset || 0;
  if (a.at != null && !a.line && !a.scene && !a.after) return a.at + off;
  if (a.scene || a.local != null || a.u != null || a.fromEnd != null) {
    const s = a.scene ? scenesById[a.scene] : scene;
    if (!s) throw new Error('Cena não encontrada: ' + a.scene);
    if (a.u != null) return s.start + s.dur * a.u + off;
    if (a.fromEnd != null) return s.end - a.fromEnd + off;
    return s.start + (a.local || 0) + off;
  }
  const id = a.line || a.after;
  const L = byId[id];
  if (!L) throw new Error('Fala não encontrada: ' + id);
  if (a.after || a.end) return L.end + off;
  if (a.word != null) {
    let wd;
    if (typeof a.word === 'number') wd = L.words[a.word];
    else {
      const k = normWord(a.word);
      const matches = L.words.filter(x => x.key === k);
      wd = matches[a.nth || 0];
    }
    if (!wd) throw new Error(`Palavra "${a.word}" não encontrada em ${id}`);
    return (a.wordEnd ? wd.end : wd.start) + off;
  }
  return L.start + off;
}
