// Carregamento da narração real. Nada é simulado: se o arquivo não existe,
// a fala fica marcada como ausente e a interface informa isso.

const LINE_RE = /^(L\d{2,3})\.(mp3|wav|ogg|m4a|aac|webm|opus|flac)$/i;

// Detecta início e fim da fala no buffer (RMS em janelas de 10 ms).
export function detectSpeech(buffer, threshDb = -42) {
  const ch = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const win = Math.round(sr * 0.01);
  const n = Math.floor(ch.length / win);
  const thr = Math.pow(10, threshDb / 20);
  let first = -1, last = -1;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = i * win, e = j + win; j < e; j++) s += ch[j] * ch[j];
    const rms = Math.sqrt(s / win);
    if (rms > thr) { if (first < 0) first = i; last = i; }
  }
  if (first < 0) return { onset: 0, offset: buffer.duration };
  return {
    onset: Math.max(0, first * 0.01 - 0.03),
    offset: Math.min(buffer.duration, (last + 1) * 0.01 + 0.05),
  };
}

async function tryFetch(url) {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.arrayBuffer();
  } catch { return null; }
}

export async function loadNarration(ctx, episode, onProgress = () => {}) {
  const cfg = episode.narration;
  const result = new Map();
  let timings = null;
  const tj = await tryFetch(cfg.timings);
  if (tj) { try { timings = JSON.parse(new TextDecoder().decode(tj)); } catch (e) { console.warn('timings.json inválido', e); } }
  let i = 0;
  for (const line of episode.lines) {
    onProgress(i++ / episode.lines.length, `Narração ${line.id}`);
    for (const ext of cfg.formats) {
      const data = await tryFetch(`${cfg.dir}${line.id}.${ext}`);
      if (!data) continue;
      try {
        const buffer = await ctx.decodeAudioData(data);
        result.set(line.id, makeEntry(buffer, timings?.[line.id], `${line.id}.${ext}`));
        break;
      } catch (e) { console.warn('Falha ao decodificar', line.id, ext, e); }
    }
  }
  return { map: result, timings };
}

// Ganho para igualar o volume de fala entre os trechos (alvo -18 dBFS RMS, limitado)
function speechGain(buffer, a, b) {
  const ch = buffer.getChannelData(0), sr = buffer.sampleRate;
  let s = 0, n = 0;
  for (let i = Math.floor(a * sr), e = Math.min(ch.length, Math.floor(b * sr)); i < e; i++) { s += ch[i] * ch[i]; n++; }
  const rms = Math.sqrt(s / Math.max(1, n));
  if (rms < 1e-5) return 1;
  return Math.max(0.6, Math.min(2.0, Math.pow(10, -18 / 20) / rms));
}

function makeEntry(buffer, words, name) {
  const e = makeEntryRaw(buffer, words, name);
  e.gain = speechGain(buffer, e.onset, e.offset);
  return e;
}

function makeEntryRaw(buffer, words, name) {
  const { onset, offset } = detectSpeech(buffer);
  // Se houver timestamps de alinhamento, eles mandam no início/fim da fala.
  if (words && words.length) {
    return { buffer, name, words, onset: Math.max(0, words[0][1] - 0.02), offset: Math.min(buffer.duration, words[words.length - 1][2] + 0.04) };
  }
  return { buffer, name, onset, offset };
}

// Arquivos arrastados para a página (L01.mp3, L02.wav, ..., timings.json)
export async function loadDroppedFiles(ctx, files, current, timings) {
  const list = [...files];
  const tf = list.find(f => /timings\.json$/i.test(f.name));
  if (tf) { try { timings = JSON.parse(await tf.text()); } catch (e) { console.warn(e); } }
  const added = [];
  for (const f of list) {
    const m = f.name.match(LINE_RE);
    if (!m) continue;
    const id = m[1].toUpperCase();
    try {
      const buffer = await ctx.decodeAudioData(await f.arrayBuffer());
      current.set(id, makeEntry(buffer, timings?.[id], f.name));
      added.push(id);
    } catch (e) { console.warn('Falha ao decodificar', f.name, e); }
  }
  // reaplica timings a entradas já existentes
  if (tf && timings) for (const [id, e] of current) if (timings[id]) current.set(id, makeEntry(e.buffer, timings[id], e.name));
  return { added, timings };
}
