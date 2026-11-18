// Trilha sonora original procedural. Cada cena declara um "clima" e uma
// intensidade; o motor compõe a música em tempo real, sempre alinhada ao
// relógio do áudio. Tonalidade-base: Ré menor.

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Acordes (notas MIDI) por clima
const PROG = {
  mystery: [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]],
  tension: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]],
  action:  [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]],
  wonder:  [[50, 54, 57], [45, 49, 52], [47, 50, 54], [43, 47, 50]],
  calm:    [[41, 45, 48], [48, 52, 55], [50, 53, 57], [46, 50, 53]],
  outro:   [[50, 54, 57], [43, 47, 50], [47, 50, 54], [45, 49, 52]],
};
const BPM = { mystery: 76, tension: 88, action: 96, wonder: 76, calm: 72, outro: 104 };

function env(g, t, a, peak, hold, rel) {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  return t + a + hold + rel + 0.05;
}

const I = {
  pad(ac, out, t, notes, dur, lvl, bright = 0.4) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400 + bright * 2400; f.Q.value = 0.7;
    const g = ac.createGain(); f.connect(g); g.connect(out);
    const end = env(g, t, Math.min(0.9, dur * 0.3), lvl, Math.max(0, dur - 0.9), 1.4);
    notes.forEach((n, i) => [-7, 7].forEach(d => {
      const o = ac.createOscillator(); o.type = i === 0 ? 'triangle' : 'sawtooth';
      o.frequency.value = midi(n + 12); o.detune.value = d;
      const og = ac.createGain(); og.gain.value = 0.18 / notes.length;
      o.connect(og); og.connect(f); o.start(t); o.stop(end);
    }));
  },
  piano(ac, out, t, n, lvl) {
    const g = ac.createGain(); g.connect(out);
    const end = env(g, t, 0.005, lvl, 0.02, 2.2);
    [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([m, type, a]) => {
      const o = ac.createOscillator(); o.type = type; o.frequency.value = midi(n) * m;
      const og = ac.createGain(); og.gain.value = a; o.connect(og); og.connect(g);
      o.start(t); o.stop(end);
    });
  },
  pluck(ac, out, t, n, lvl, dur = 0.25) {
    const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = midi(n);
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(3500, t); f.frequency.exponentialRampToValueAtTime(400, t + dur);
    const g = ac.createGain(); o.connect(f); f.connect(g); g.connect(out);
    o.start(t); o.stop(env(g, t, 0.004, lvl, 0, dur));
  },
  string(ac, out, t, n, lvl, bright) {
    const g = ac.createGain();
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500 + 2500 * bright; f.Q.value = 1.5;
    f.connect(g); g.connect(out);
    const end = env(g, t, 0.01, lvl, 0.06, 0.12);
    [-5, 5].forEach(d => {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = d;
      o.connect(f); o.start(t); o.stop(end);
    });
  },
  bass(ac, out, t, n, lvl, dur) {
    const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = midi(n);
    const s = ac.createOscillator(); s.type = 'sine'; s.frequency.value = midi(n - 12);
    const g = ac.createGain(); o.connect(g); s.connect(g); g.connect(out);
    const end = env(g, t, 0.02, lvl, dur * 0.6, dur * 0.5);
    o.start(t); o.stop(end); s.start(t); s.stop(end);
  },
  kick(ac, out, t, lvl) {
    const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const g = ac.createGain(); o.connect(g); g.connect(out);
    o.start(t); o.stop(env(g, t, 0.003, lvl, 0.02, 0.3));
  },
  taiko(ac, out, t, lvl, low = 1) {
    const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110 * low, t); o.frequency.exponentialRampToValueAtTime(45 * low, t + 0.25);
    const g = ac.createGain(); o.connect(g); g.connect(out);
    o.start(t); o.stop(env(g, t, 0.003, lvl, 0.03, 0.55));
    const n = ac.createBufferSource(); n.buffer = I._noise(ac);
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.8;
    const ng = ac.createGain(); n.connect(f); f.connect(ng); ng.connect(out);
    n.start(t); n.stop(env(ng, t, 0.002, lvl * 0.4, 0, 0.12));
  },
  hat(ac, out, t, lvl) {
    const n = ac.createBufferSource(); n.buffer = I._noise(ac);
    const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = ac.createGain(); n.connect(f); f.connect(g); g.connect(out);
    n.start(t, (t * 7.13) % 0.8); n.stop(env(g, t, 0.001, lvl, 0, 0.045));
  },
  snare(ac, out, t, lvl) {
    const n = ac.createBufferSource(); n.buffer = I._noise(ac);
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.6;
    const g = ac.createGain(); n.connect(f); f.connect(g); g.connect(out);
    n.start(t); n.stop(env(g, t, 0.002, lvl, 0, 0.18));
    I.kick(ac, out, t, lvl * 0.3);
  },
  _nb: new WeakMap(),
  _noise(ac) {
    let b = I._nb.get(ac);
    if (!b) {
      b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = b.getChannelData(0); let s = 7;
      for (let i = 0; i < d.length; i++) d[i] = ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
      I._nb.set(ac, b);
    }
    return b;
  },
};

// Padrões determinísticos (hash do passo) — nada de aleatório.
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = (h ^ (h >>> 13)) * 1274126177 >>> 0; return (h & 0xffff) / 0xffff; };

function playStep(ac, out, t, mood, step, inten, stepDur, segEnd) {
  const prog = PROG[mood];
  const bar = Math.floor(step / 16);
  const s = step % 16;
  const chord = prog[Math.floor(bar / (mood === 'outro' ? 1 : 2)) % 4];
  const barDur = stepDur * 16;
  const padDur = Math.min(barDur, segEnd - t);
  const k = inten;
  switch (mood) {
    case 'mystery':
      if (s === 0) { I.pad(ac, out, t, chord, padDur, 0.11 + 0.05 * k, 0.2 + 0.2 * k); I.bass(ac, out, t, chord[0] - 12, 0.12, padDur * 0.8); }
      if ((s === 6 || s === 10 || s === 14) && hash(step, 1) < 0.55 + 0.3 * k) I.piano(ac, out, t, chord[Math.floor(hash(step, 2) * 3)] + 24, 0.06);
      break;
    case 'tension':
      if (s === 0) { I.pad(ac, out, t, chord, padDur, 0.08 + 0.05 * k, 0.3 + 0.3 * k); }
      if (s % 2 === 0 || k > 0.6) I.string(ac, out, t, chord[0] + (s % 4 === 2 ? 7 : 0), 0.045 + 0.05 * k, 0.2 + 0.6 * k);
      if (s === 0 || s === 8) I.kick(ac, out, t, 0.25 + 0.25 * k);
      if (s % 4 === 2 && k > 0.3) I.hat(ac, out, t, 0.03 + 0.03 * k);
      if (s === 0) I.bass(ac, out, t, chord[0] - 12, 0.14 + 0.06 * k, barDur * 0.7);
      break;
    case 'action':
      if (s === 0) { I.pad(ac, out, t, chord, padDur, 0.09 + 0.05 * k, 0.6); I.bass(ac, out, t, chord[0] - 12, 0.2, barDur * 0.5); }
      I.string(ac, out, t, chord[s % 3] + (s % 8 < 4 ? 0 : 12), 0.05 + 0.04 * k, 0.5 + 0.5 * k);
      if ([0, 6, 8, 11, 14].includes(s)) I.taiko(ac, out, t, (s === 0 ? 0.55 : 0.35) * (0.6 + 0.4 * k), s === 0 ? 0.8 : 1);
      if (s % 2 === 1) I.hat(ac, out, t, 0.04 * k + 0.02);
      if (s === 4 || s === 12) I.snare(ac, out, t, 0.12 * k + 0.06);
      break;
    case 'wonder':
      if (s === 0) { I.pad(ac, out, t, chord, padDur, 0.12, 0.7); I.bass(ac, out, t, chord[0] - 12, 0.12, barDur * 0.9); }
      if (s % 2 === 0) I.pluck(ac, out, t, chord[(s / 2) % 3] + 24 + (s >= 8 ? 12 : 0), 0.035 + 0.02 * k, 0.4);
      if (s === 0 && bar % 2 === 0) I.piano(ac, out, t, chord[2] + 24, 0.07);
      break;
    case 'calm':
      if (s === 0) { I.pad(ac, out, t, chord, padDur, 0.08, 0.25); I.bass(ac, out, t, chord[0] - 12, 0.1, barDur); }
      if (s % 4 === 0) I.piano(ac, out, t, chord[(s / 4) % 3] + 12 + (s === 12 ? 12 : 0), 0.07);
      if (s === 10 && bar % 2) I.piano(ac, out, t, chord[1] + 24, 0.045);
      break;
    case 'outro':
      if (s === 0) { I.pad(ac, out, t, chord, padDur, 0.1, 0.8); I.bass(ac, out, t, chord[0] - 12, 0.2, barDur * 0.45); }
      if (s === 8) I.bass(ac, out, t, chord[0] - 12, 0.16, barDur * 0.4);
      I.pluck(ac, out, t, chord[[0, 1, 2, 1][s % 4]] + 24 + (s >= 8 ? 12 : 0), 0.04, 0.2);
      if (s % 4 === 0) I.kick(ac, out, t, 0.4);
      if (s === 4 || s === 12) I.snare(ac, out, t, 0.14);
      if (s % 2 === 1) I.hat(ac, out, t, 0.035);
      break;
  }
}

export class MusicEngine {
  constructor() { this.segments = []; }

  // segments: [{start, end, mood, intensity}] em tempo de episódio
  setPlan(segments) { this.segments = segments.filter(s => s.mood && s.mood !== 'silence'); }

  // Agenda os passos com início em [e0, e1) (tempo de episódio).
  // toCtx(e) converte tempo do episódio em tempo do AudioContext.
  schedule(ac, out, e0, e1, toCtx, fresh = false) {
    for (const seg of this.segments) {
      if (seg.end <= e0 || seg.start >= e1) continue;
      const stepDur = 60 / BPM[seg.mood] / 4;
      const first = Math.max(0, Math.ceil((e0 - seg.start) / stepDur - 1e-6));
      for (let k = first; ; k++) {
        const te = seg.start + k * stepDur;
        if (te >= e1 || te >= seg.end - 0.05) break;
        const fade = Math.min(1, (seg.end - te) / 1.5);
        playStep(ac, out, toCtx(te), seg.mood, k, seg.intensity * (0.7 + 0.3 * fade), stepDur, toCtx(seg.end));
      }
      // Ao iniciar no meio de um compasso, retoma o pad imediatamente
      if (fresh && e0 > seg.start && e0 < seg.end) {
        const barDur = stepDur * 16;
        const into = (e0 - seg.start) % barDur;
        if (into > 0.05) {
          const bar = Math.floor((e0 - seg.start) / barDur);
          const chord = PROG[seg.mood][Math.floor(bar / (seg.mood === 'outro' ? 1 : 2)) % 4];
          I.pad(ac, out, toCtx(e0), chord, Math.min(barDur - into, seg.end - e0), 0.09, 0.4);
        }
      }
    }
  }
}
