// Biblioteca de efeitos sonoros 100% originais, sintetizados em tempo real
// com a Web Audio API (nenhuma amostra de terceiros).
// Cada função: (ac, out, t, p) — t = tempo do AudioContext; p.skip = segundos
// já decorridos (quando a reprodução começa no meio de um som longo).

const cache = new WeakMap();
function buffers(ac) {
  let b = cache.get(ac);
  if (b) return b;
  const len = ac.sampleRate * 4;
  const white = ac.createBuffer(1, len, ac.sampleRate);
  const brown = ac.createBuffer(1, len, ac.sampleRate);
  const pink = ac.createBuffer(1, len, ac.sampleRate);
  const w = white.getChannelData(0), br = brown.getChannelData(0), pk = pink.getChannelData(0);
  let seed = 1234567, last = 0, b0 = 0, b1 = 0, b2 = 0;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  for (let i = 0; i < len; i++) {
    const x = rnd();
    w[i] = x;
    last = (last + 0.02 * x) / 1.02; br[i] = last * 3.5;
    b0 = 0.99765 * b0 + x * 0.099; b1 = 0.963 * b1 + x * 0.2965; b2 = 0.57 * b2 + x * 1.0526;
    pk[i] = (b0 + b1 + b2 + x * 0.1848) * 0.16;
  }
  b = { white, brown, pink };
  cache.set(ac, b);
  return b;
}

function noise(ac, kind = 'white', loop = true) {
  const s = ac.createBufferSource();
  s.buffer = buffers(ac)[kind];
  s.loop = loop;
  s.loopStart = 0; s.loopEnd = s.buffer.duration;
  return s;
}
function gain(ac, v = 1) { const g = ac.createGain(); g.gain.value = v; return g; }
function filt(ac, type, f, q = 1) { const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; }
function osc(ac, type, f) { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; return o; }
function chain(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }
function pan(ac, v) { if (!ac.createStereoPanner) return gain(ac); const p = ac.createStereoPanner(); p.pan.value = v; return p; }

let curveCache = null;
function distortion(ac, amt = 20) {
  const ws = ac.createWaveShaper();
  if (!curveCache) {
    curveCache = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curveCache[i] = Math.tanh(x * 2.5); }
  }
  ws.curve = curveCache; ws.oversample = '2x';
  void amt;
  return ws;
}

// Envelope genérico de sons longos (com fade in/out e início parcial)
function longEnv(g, t, dur, skip, fadeIn, fadeOut, level) {
  const p = g.gain;
  const start = t;
  const remain = Math.max(0.05, dur - skip);
  p.setValueAtTime(0, start);
  const fi = Math.max(0.02, fadeIn - skip);
  p.linearRampToValueAtTime(level, start + fi);
  const fo = Math.min(fadeOut, remain * 0.5);
  p.setValueAtTime(level, start + Math.max(fi, remain - fo));
  p.linearRampToValueAtTime(0.0001, start + remain);
  return start + remain + 0.05;
}

export const SFX = {
  // Golpe de transição (ar passando)
  whoosh(ac, out, t, p = {}) {
    const d = p.dur || 0.6, lvl = p.level ?? 0.5;
    const n = noise(ac, 'pink');
    const f = filt(ac, 'bandpass', 400, 1.2);
    const g = gain(ac, 0);
    const pn = pan(ac, p.pan ?? 0);
    chain(n, f, g, pn, out);
    f.frequency.setValueAtTime(p.reverse ? 4000 : 300, t);
    f.frequency.exponentialRampToValueAtTime(p.reverse ? 300 : 3500, t + d * 0.7);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(lvl, t + d * 0.55);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    if (pn.pan) { pn.pan.setValueAtTime(-0.7, t); pn.pan.linearRampToValueAtTime(0.7, t + d); }
    n.start(t, 0.7); n.stop(t + d + 0.05);
  },

  // Impacto grave cinematográfico
  impact(ac, out, t, p = {}) {
    const lvl = p.level ?? 0.9, size = p.size ?? 1;
    const o = osc(ac, 'sine', 110 * size);
    const g = gain(ac, 0);
    chain(o, g, out);
    o.frequency.setValueAtTime(140 / size, t);
    o.frequency.exponentialRampToValueAtTime(32, t + 0.9);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(lvl, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.6 * size);
    o.start(t); o.stop(t + 1.8 * size);
    const n = noise(ac, 'white');
    const f = filt(ac, 'lowpass', 2500, 0.7);
    const g2 = gain(ac, 0);
    chain(n, f, g2, out);
    f.frequency.setValueAtTime(5000, t); f.frequency.exponentialRampToValueAtTime(200, t + 0.5);
    g2.gain.setValueAtTime(lvl * 0.6, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    n.start(t); n.stop(t + 0.7);
  },

  // Explosão: impacto + estalos + cauda de destroços
  explosion(ac, out, t, p = {}) {
    const lvl = p.level ?? 1;
    SFX.impact(ac, out, t, { level: lvl * 0.9, size: 1.3 });
    const n = noise(ac, 'brown');
    const ds = distortion(ac);
    const f = filt(ac, 'lowpass', 900, 0.8);
    const g = gain(ac, 0);
    const pn = pan(ac, p.pan ?? 0);
    chain(n, ds, f, g, pn, out);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(lvl * 0.8, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.6);
    f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(120, t + 2.4);
    n.start(t, (p.seed || 0) % 3); n.stop(t + 2.7);
    // estalos (destroços)
    for (let i = 0; i < 9; i++) {
      const tt = t + 0.15 + i * 0.11 + ((i * 37) % 7) * 0.03;
      const c = noise(ac, 'white', false);
      const hf = filt(ac, 'bandpass', 1500 + ((i * 911) % 3000), 3);
      const cg = gain(ac, 0);
      chain(c, hf, cg, pn);
      cg.gain.setValueAtTime(lvl * 0.25 * (1 - i / 10), tt);
      cg.gain.exponentialRampToValueAtTime(0.001, tt + 0.08);
      c.start(tt, i * 0.2); c.stop(tt + 0.1);
    }
  },

  // "Braaam" — metais graves de trailer
  braam(ac, out, t, p = {}) {
    const d = p.dur || 3, lvl = p.level ?? 0.45;
    const freqs = p.freqs || [36.7, 73.4, 110, 146.8];
    const lp = filt(ac, 'lowpass', 200, 4);
    const ds = distortion(ac);
    const g = gain(ac, 0);
    chain(lp, ds, g, out);
    lp.frequency.setValueAtTime(150, t);
    lp.frequency.linearRampToValueAtTime(1400, t + 0.25);
    lp.frequency.exponentialRampToValueAtTime(220, t + d);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(lvl, t + 0.08);
    g.gain.setValueAtTime(lvl, t + d * 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    freqs.forEach((fr, i) => {
      [-6, 6].forEach(dt => {
        const o = osc(ac, 'sawtooth', fr);
        o.detune.value = dt + i;
        const og = gain(ac, 0.3 / freqs.length);
        chain(o, og, lp);
        o.start(t); o.stop(t + d + 0.1);
      });
    });
  },

  // Batimentos cardíacos (sequência)
  heartbeat(ac, out, t, p = {}) {
    const d = p.dur || 4, skip = p.skip || 0;
    const bpm0 = p.bpm || 70, bpm1 = p.bpmEnd || bpm0;
    const lvl = p.level ?? 0.8;
    let x = 0;
    while (x < d) {
      const k = x / d;
      const bpm = bpm0 + (bpm1 - bpm0) * k;
      const period = 60 / bpm;
      if (x >= skip) {
        [0, 0.17].forEach((o, j) => {
          const tt = t + (x - skip) + o;
          const os = osc(ac, 'sine', 62);
          const g = gain(ac, 0);
          const lp = filt(ac, 'lowpass', 180, 1);
          chain(os, lp, g, out);
          os.frequency.setValueAtTime(j ? 58 : 66, tt);
          os.frequency.exponentialRampToValueAtTime(38, tt + 0.14);
          g.gain.setValueAtTime(0, tt);
          g.gain.linearRampToValueAtTime(lvl * (j ? 0.65 : 1) * (0.6 + 0.4 * k), tt + 0.012);
          g.gain.exponentialRampToValueAtTime(0.001, tt + 0.22);
          os.start(tt); os.stop(tt + 0.25);
        });
      }
      x += period;
    }
  },

  // Vento / tempestade (filtro com LFO)
  wind(ac, out, t, p = {}) {
    const d = p.dur || 6, skip = p.skip || 0, lvl = p.level ?? 0.35;
    const n = noise(ac, 'pink');
    const f = filt(ac, 'bandpass', 500, 0.8);
    const g = gain(ac, 0);
    const lfo = osc(ac, 'sine', 0.13);
    const lg = gain(ac, 350);
    const lfo2 = osc(ac, 'sine', 0.37);
    const lg2 = gain(ac, 160);
    lfo.connect(lg); lg.connect(f.frequency);
    lfo2.connect(lg2); lg2.connect(f.frequency);
    chain(n, f, g, out);
    const end = longEnv(g, t, d, skip, p.fadeIn ?? 1.5, p.fadeOut ?? 1.5, lvl);
    [n, lfo, lfo2].forEach(s => { s.start(t); s.stop(end); });
    if (p.storm) {
      const n2 = noise(ac, 'white');
      const hf = filt(ac, 'highpass', 2500, 0.5);
      const g2 = gain(ac, 0);
      chain(n2, hf, g2, out);
      longEnv(g2, t, d, skip, 1.2, 1.2, lvl * 0.35);
      n2.start(t, 1); n2.stop(end);
    }
  },

  // Ondas / maré subindo
  ocean(ac, out, t, p = {}) {
    const d = p.dur || 8, skip = p.skip || 0, lvl = p.level ?? 0.5;
    const n = noise(ac, 'brown');
    const f = filt(ac, 'lowpass', 600, 0.5);
    const am = gain(ac, 0.5);
    const g = gain(ac, 0);
    const lfo = osc(ac, 'sine', p.rate || 0.18);
    const lg = gain(ac, 0.45);
    lfo.connect(lg); lg.connect(am.gain);
    chain(n, f, am, g, out);
    const n2 = noise(ac, 'white');
    const f2 = filt(ac, 'bandpass', 1800, 0.6);
    const g2 = gain(ac, 0.12);
    lg.connect(g2.gain);
    chain(n2, f2, g2, g);
    const end = longEnv(g, t, d, skip, 1.5, 1.5, lvl);
    if (p.rising) { f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(1500, t + Math.max(0.1, d - skip)); }
    [n, n2, lfo].forEach(s => { s.start(t); s.stop(end); });
  },

  // Tremor de terra
  rumble(ac, out, t, p = {}) {
    const d = p.dur || 4, skip = p.skip || 0, lvl = p.level ?? 0.7;
    const n = noise(ac, 'brown');
    const f = filt(ac, 'lowpass', 110, 1.5);
    const am = gain(ac, 0.6);
    const lfo = osc(ac, 'square', 7.3);
    const lg = gain(ac, 0.35);
    lfo.connect(lg); lg.connect(am.gain);
    const g = gain(ac, 0);
    chain(n, f, am, g, out);
    const sub = osc(ac, 'sine', 31);
    const sg = gain(ac, 0.35);
    chain(sub, sg, g);
    const end = longEnv(g, t, d, skip, p.fadeIn ?? 0.6, p.fadeOut ?? 1.2, lvl);
    [n, lfo, sub].forEach(s => { s.start(t); s.stop(end); });
  },

  // Sirene de alerta (sobe e desce)
  siren(ac, out, t, p = {}) {
    const d = p.dur || 4, skip = p.skip || 0, lvl = p.level ?? 0.16;
    const o = osc(ac, 'sawtooth', 700);
    const lfo = osc(ac, 'sine', p.rate || 0.45);
    const lg = gain(ac, 260);
    lfo.connect(lg); lg.connect(o.frequency);
    const f = filt(ac, 'bandpass', 1100, 1.2);
    const g = gain(ac, 0);
    const pn = pan(ac, p.pan ?? 0.3);
    chain(o, f, g, pn, out);
    const end = longEnv(g, t, d, skip, 0.4, 0.8, lvl);
    [o, lfo].forEach(s => { s.start(t); s.stop(end); });
  },

  // Alarme eletrônico (bipes)
  alarm(ac, out, t, p = {}) {
    const d = p.dur || 3, skip = p.skip || 0, lvl = p.level ?? 0.12;
    for (let x = 0; x < d; x += 0.5) {
      if (x < skip) continue;
      const tt = t + x - skip;
      [0, 0.18].forEach((o, j) => {
        const os = osc(ac, 'square', j ? 880 : 1175);
        const g = gain(ac, 0);
        const lp = filt(ac, 'lowpass', 3000);
        chain(os, lp, g, out);
        g.gain.setValueAtTime(0, tt + o);
        g.gain.linearRampToValueAtTime(lvl, tt + o + 0.01);
        g.gain.setValueAtTime(lvl, tt + o + 0.13);
        g.gain.linearRampToValueAtTime(0, tt + o + 0.15);
        os.start(tt + o); os.stop(tt + o + 0.17);
      });
    }
  },

  // Bipes tecnológicos / dados em tela
  tech(ac, out, t, p = {}) {
    const n = p.count || 6, lvl = p.level ?? 0.08, skip = p.skip || 0;
    for (let i = 0; i < n; i++) {
      const x = i * (p.step || 0.09);
      if (x < skip) continue;
      const tt = t + x - skip;
      const fr = [1760, 2349, 1975, 2637, 1568, 3136][(i * 5 + (p.seed || 0)) % 6];
      const os = osc(ac, i % 3 ? 'sine' : 'square', fr);
      const g = gain(ac, 0);
      const pn = pan(ac, ((i % 5) - 2) * 0.25);
      chain(os, g, pn, out);
      g.gain.setValueAtTime(0, tt);
      g.gain.linearRampToValueAtTime(lvl, tt + 0.004);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 0.06);
      os.start(tt); os.stop(tt + 0.08);
    }
  },

  // Subida de tensão (riser)
  riser(ac, out, t, p = {}) {
    const d = p.dur || 3, skip = p.skip || 0, lvl = p.level ?? 0.3;
    if (skip > d - 0.2) return;
    const tt = t, rd = d - skip, k0 = skip / d;
    const n = noise(ac, 'white');
    const f = filt(ac, 'bandpass', 300 + 4000 * k0 * k0, 2);
    const g = gain(ac, 0);
    chain(n, f, g, out);
    f.frequency.setValueAtTime(300 + 4000 * k0 * k0, tt);
    f.frequency.exponentialRampToValueAtTime(5000, tt + rd);
    g.gain.setValueAtTime(lvl * 0.2 + lvl * 0.8 * k0, tt);
    g.gain.linearRampToValueAtTime(lvl, tt + rd);
    g.gain.linearRampToValueAtTime(0, tt + rd + 0.04);
    const o = osc(ac, 'sawtooth', 110);
    const og = gain(ac, 0);
    const lp = filt(ac, 'lowpass', 1500);
    chain(o, lp, og, out);
    o.frequency.setValueAtTime(110 * Math.pow(4, k0), tt);
    o.frequency.exponentialRampToValueAtTime(440, tt + rd);
    og.gain.setValueAtTime(lvl * 0.15, tt);
    og.gain.linearRampToValueAtTime(lvl * 0.3, tt + rd);
    og.gain.linearRampToValueAtTime(0, tt + rd + 0.04);
    [n, o].forEach(s => { s.start(tt); s.stop(tt + rd + 0.06); });
  },

  // Rocha rachando
  crack(ac, out, t, p = {}) {
    const lvl = p.level ?? 0.6;
    for (let i = 0; i < 5; i++) {
      const tt = t + i * 0.045 + (i % 2) * 0.02;
      const n = noise(ac, 'white', false);
      const f = filt(ac, 'highpass', 900 + i * 300, 0.8);
      const g = gain(ac, 0);
      chain(n, f, g, out);
      g.gain.setValueAtTime(lvl * (1 - i * 0.15), tt);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 0.12);
      n.start(tt, i * 0.3); n.stop(tt + 0.14);
    }
    SFX.impact(ac, out, t, { level: lvl * 0.5, size: 0.7 });
  },

  // Passos na terra
  steps(ac, out, t, p = {}) {
    const n = p.count || 4, step = p.step || 0.32, lvl = p.level ?? 0.25, skip = p.skip || 0;
    for (let i = 0; i < n; i++) {
      const x = i * step;
      if (x < skip) continue;
      const tt = t + x - skip;
      const s = noise(ac, 'brown', false);
      const f = filt(ac, 'lowpass', 700 + (i % 2) * 200, 1);
      const g = gain(ac, 0);
      const pn = pan(ac, i % 2 ? 0.15 : -0.15);
      chain(s, f, g, pn, out);
      g.gain.setValueAtTime(0, tt);
      g.gain.linearRampToValueAtTime(lvl, tt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 0.13);
      s.start(tt, i * 0.37); s.stop(tt + 0.15);
    }
  },

  // Grilos — ambiente noturno do interior
  crickets(ac, out, t, p = {}) {
    const d = p.dur || 8, skip = p.skip || 0, lvl = p.level ?? 0.05;
    const g = gain(ac, 0);
    g.connect(out);
    const end = longEnv(g, t, d, skip, 1, 1, lvl);
    [[4600, 0.6, -0.5], [5200, 0.85, 0.5]].forEach(([fr, rate, pv]) => {
      const o = osc(ac, 'sine', fr);
      const am = gain(ac, 0);
      const chirp = osc(ac, 'square', 28);
      const cg = gain(ac, 0.5);
      const env = gain(ac, 0);
      const slow = osc(ac, 'square', rate);
      const sg = gain(ac, 0.5);
      chirp.connect(cg); cg.connect(am.gain);
      slow.connect(sg); sg.connect(env.gain);
      const pn = pan(ac, pv);
      chain(o, am, env, pn, g);
      [o, chirp, slow].forEach(s => { s.start(t); s.stop(end); });
    });
  },

  // Brilho mágico (revelação)
  shimmer(ac, out, t, p = {}) {
    const lvl = p.level ?? 0.12;
    const notes = p.notes || [1318.5, 1568, 1975.5, 2637, 3136, 2637, 3951];
    notes.forEach((fr, i) => {
      const tt = t + i * (p.step || 0.07);
      const o = osc(ac, 'sine', fr);
      const o2 = osc(ac, 'triangle', fr * 2.01);
      const g = gain(ac, 0);
      const pn = pan(ac, Math.sin(i * 1.7) * 0.6);
      o.connect(g); o2.connect(g); chain(g, pn, out);
      g.gain.setValueAtTime(0, tt);
      g.gain.linearRampToValueAtTime(lvl, tt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 1.2);
      o.start(tt); o.stop(tt + 1.3); o2.start(tt); o2.stop(tt + 1.3);
    });
  },

  // Pop (interface / chamada para ação)
  pop(ac, out, t, p = {}) {
    const lvl = p.level ?? 0.3;
    const o = osc(ac, 'sine', 400);
    const g = gain(ac, 0);
    chain(o, g, out);
    o.frequency.setValueAtTime(p.freq || 520, t);
    o.frequency.exponentialRampToValueAtTime((p.freq || 520) * 2.2, t + 0.07);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(lvl, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.start(t); o.stop(t + 0.16);
  },

  // Sino/ding do "curtir"
  ding(ac, out, t, p = {}) {
    const lvl = p.level ?? 0.18;
    [1, 2.76, 5.4].forEach((m, i) => {
      const o = osc(ac, 'sine', (p.freq || 1046.5) * m);
      const g = gain(ac, 0);
      chain(o, g, out);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(lvl / (i + 1), t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.4 / (i + 1));
      o.start(t); o.stop(t + 1.5);
    });
  },

  // Fogo / meteoro rasgando o céu
  meteor(ac, out, t, p = {}) {
    const d = p.dur || 1.2, lvl = p.level ?? 0.35;
    const n = noise(ac, 'pink');
    const f = filt(ac, 'bandpass', 3000, 1.5);
    const g = gain(ac, 0);
    const pn = pan(ac, 0);
    chain(n, f, g, pn, out);
    f.frequency.setValueAtTime(4500, t);
    f.frequency.exponentialRampToValueAtTime(300, t + d);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(lvl, t + d * 0.85);
    g.gain.linearRampToValueAtTime(0, t + d);
    if (pn.pan) { pn.pan.setValueAtTime(p.from ?? -0.8, t); pn.pan.linearRampToValueAtTime(p.to ?? 0.3, t + d); }
    n.start(t, (p.seed || 0) % 3); n.stop(t + d + 0.05);
  },

  // Água espirrando / onda quebrando
  splash(ac, out, t, p = {}) {
    const lvl = p.level ?? 0.5;
    const n = noise(ac, 'white');
    const f = filt(ac, 'lowpass', 3000, 0.5);
    const g = gain(ac, 0);
    chain(n, f, g, out);
    f.frequency.setValueAtTime(6000, t); f.frequency.exponentialRampToValueAtTime(400, t + 1.8);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(lvl, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2);
    n.start(t); n.stop(t + 2.1);
    SFX.impact(ac, out, t, { level: lvl * 0.5, size: 1.2 });
  },

  // Trovão
  thunder(ac, out, t, p = {}) {
    const lvl = p.level ?? 0.6;
    SFX.crack(ac, out, t, { level: lvl * 0.5 });
    const n = noise(ac, 'brown');
    const f = filt(ac, 'lowpass', 400, 0.7);
    const g = gain(ac, 0);
    chain(n, f, g, out);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(lvl, t + 0.1);
    g.gain.linearRampToValueAtTime(lvl * 0.4, t + 0.6);
    g.gain.linearRampToValueAtTime(lvl * 0.7, t + 0.9);
    g.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
    n.start(t, 2); n.stop(t + 3.6);
  },

  // Assinatura sonora da série (logo)
  logo(ac, out, t, p = {}) {
    const lvl = p.level ?? 0.5;
    SFX.impact(ac, out, t, { level: lvl, size: 1.1 });
    SFX.braam(ac, out, t, { dur: 2.6, level: lvl * 0.5, freqs: [55, 82.4, 110, 164.8] });
    SFX.shimmer(ac, out, t + 0.12, { level: lvl * 0.22 });
  },
};

// Reverb gerado por algoritmo (resposta ao impulso sintética)
export function makeReverb(ac, seconds = 2.8, decay = 2.5) {
  const len = Math.floor(ac.sampleRate * seconds);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  let seed = 99;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = rnd() * Math.pow(1 - i / len, decay);
  }
  const conv = ac.createConvolver();
  conv.buffer = ir;
  return conv;
}
