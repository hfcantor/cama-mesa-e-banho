// Player: relógio mestre baseado no AudioContext. Imagem, legendas, narração,
// efeitos e trilha derivam todos do mesmo relógio, então não dessincronizam.
import { SFX, makeReverb } from '../audio/synth.js';

const LOOKAHEAD = 0.35;

export class Player {
  constructor() {
    this.ac = null;
    this.state = 'idle'; // idle | playing | paused | ended
    this.pausedAt = 0;
    this.T0 = 0;
    this.session = null;
    this.timeline = null;
    this.music = null;
    this.onEnded = null;
    this.needsRestart = false;
  }

  init() {
    if (this.ac) return this.ac;
    const ac = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    this._buildGraph(ac);
    return ac;
  }

  _buildGraph(ac) {
    this.ac = ac;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master = ac.createGain(); this.master.gain.value = 0.9;
    this.master.connect(comp); comp.connect(ac.destination);
    this.recordDest = ac.createMediaStreamDestination && !(ac instanceof OfflineAudioContext) ? ac.createMediaStreamDestination() : null;
    if (this.recordDest) comp.connect(this.recordDest);
    this.narrBus = ac.createGain(); this.narrBus.gain.value = 1.0; this.narrBus.connect(this.master);
    this.musicVol = ac.createGain(); this.musicVol.gain.value = 0.5; this.musicVol.connect(this.master);
    this.duck = ac.createGain(); this.duck.connect(this.musicVol);
    this.sfxBus = ac.createGain(); this.sfxBus.gain.value = 0.75; this.sfxBus.connect(this.master);
    this.reverb = makeReverb(ac); this.revRet = ac.createGain(); this.revRet.gain.value = 0.32;
    this.reverb.connect(this.revRet); this.revRet.connect(this.master);
  }

  // Mixagem completa renderizada offline (exportar WAV / controle de qualidade)
  static async renderOffline(timeline, music, sampleRate = 44100) {
    const len = Math.ceil((timeline.duration + 1) * sampleRate);
    const off = new OfflineAudioContext(2, len, sampleRate);
    const p = new Player();
    p._buildGraph(off);
    p.timeline = timeline; p.music = music;
    p.T0 = 0; p.state = 'playing';
    p.session = p._newSession();
    p._scheduleDucking(0);
    p._schedule(true, 0, timeline.duration + 0.5);
    return off.startRendering();
  }

  setContent(timeline, music) {
    this.timeline = timeline;
    this.music = music;
  }

  latency() {
    const ac = this.ac;
    return ac ? (ac.outputLatency || 0) + (ac.baseLatency || 0) * 0.5 : 0;
  }

  time() {
    if (this.state === 'playing') {
      const t = this.ac.currentTime - this.T0 - this.latency();
      return Math.max(0, Math.min(t, this.timeline.duration));
    }
    return this.pausedAt;
  }

  toCtx = (e) => this.T0 + e;

  _newSession() {
    const ac = this.ac;
    const mk = (dest) => { const g = ac.createGain(); g.connect(dest); return g; };
    const s = { narr: mk(this.narrBus), music: mk(this.duck), sfx: mk(this.sfxBus), rev: mk(this.reverb), sources: [] };
    s.music.connect(this.reverb);
    // envio de reverb para efeitos
    const send = ac.createGain(); send.gain.value = 0.5; s.sfx.connect(send); send.connect(s.rev);
    return s;
  }

  _killSession() {
    const s = this.session;
    if (!s) return;
    const ac = this.ac, now = ac.currentTime;
    [s.narr, s.music, s.sfx, s.rev].forEach(g => {
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + 0.04);
      setTimeout(() => { try { g.disconnect(); } catch { /* */ } }, 200);
    });
    s.sources.forEach(src => { try { src.stop(now + 0.05); } catch { /* */ } });
    this.session = null;
  }

  async play() {
    this.init();
    if (this.state === 'playing') return;
    if (this.state === 'paused' && !this.needsRestart && this.session) {
      await this.ac.resume();
      this.state = 'playing';
      return;
    }
    if (this.ac.state !== 'running') await this.ac.resume();
    const from = this.state === 'ended' ? 0 : this.pausedAt;
    this._start(from);
  }

  _start(from) {
    this._killSession();
    const ac = this.ac;
    this.session = this._newSession();
    this.T0 = ac.currentTime + 0.12 - from + this.latency();
    this.scheduledUntil = from;
    this.state = 'playing';
    this.needsRestart = false;
    this._scheduleDucking(from);
    this._schedule(true, from);
    clearInterval(this._iv);
    this._iv = setInterval(() => this.tick(), 25);
  }

  async pause() {
    if (this.state !== 'playing') return;
    this.pausedAt = this.time();
    this.state = 'paused';
    await this.ac.suspend();
  }

  async restart() {
    this.init();
    if (this.ac.state !== 'running') await this.ac.resume();
    this._start(0);
  }

  async seek(t) {
    t = Math.max(0, Math.min(t, this.timeline.duration - 0.05));
    if (this.state === 'playing') { this._start(t); return; }
    this._killSession();
    this.pausedAt = t;
    this.needsRestart = true;
    if (this.state === 'ended' || this.state === 'idle') this.state = 'paused';
    if (this.ac && this.ac.state !== 'running') await this.ac.resume();
  }

  stop() {
    clearInterval(this._iv);
    this._killSession();
    this.state = 'idle';
    this.pausedAt = 0;
  }

  tick() {
    if (this.state !== 'playing') return;
    const t = this.time();
    if (t >= this.timeline.duration - 0.001) {
      this.state = 'ended';
      this.pausedAt = this.timeline.duration;
      clearInterval(this._iv);
      setTimeout(() => { if (this.state === 'ended') this._killSession(); }, 600);
      this.onEnded && this.onEnded();
      return;
    }
    this._schedule(false);
  }

  _schedule(fresh, from = 0, until = null) {
    const tl = this.timeline, s = this.session, ac = this.ac;
    if (!s) return;
    const e0 = fresh ? from : this.scheduledUntil;
    const e1 = until ?? Math.max(e0, (this.ac.currentTime - this.T0) + LOOKAHEAD);
    if (e1 <= e0 && !fresh) return;
    const now = ac.currentTime;
    // Narração (arquivos reais)
    for (const L of tl.lines) {
      if (!L.audio) continue;
      const a = L.audio.at, dur = L.audio.buffer.duration;
      const startsInWindow = a >= e0 && a < e1;
      const overlaps = fresh && a < e0 && a + dur > e0;
      if (!startsInWindow && !overlaps) continue;
      const src = ac.createBufferSource();
      src.buffer = L.audio.buffer;
      src.connect(s.narr);
      if (overlaps) src.start(Math.max(now, this.toCtx(e0)), e0 - a);
      else src.start(Math.max(now, this.toCtx(a)));
      s.sources.push(src);
    }
    // Efeitos sonoros
    for (const c of tl.cues) {
      if (!c.sfx) continue;
      const fn = SFX[c.sfx];
      if (!fn) { console.warn('SFX desconhecido', c.sfx); continue; }
      const inWin = c.time >= e0 && c.time < e1;
      const longOverlap = fresh && c.dur > 0.8 && c.time < e0 && c.time + c.dur > e0 + 0.3;
      if (!inWin && !longOverlap) continue;
      const p = { ...(c.p || {}), dur: c.dur || (c.p && c.p.dur) };
      if (!p.dur) delete p.dur;
      const out = s.sfx;
      if (longOverlap) fn(ac, out, Math.max(now, this.toCtx(e0)), { ...p, skip: e0 - c.time });
      else fn(ac, out, Math.max(now, this.toCtx(c.time)), p);
    }
    // Trilha
    if (this.music) this.music.schedule(ac, s.music, e0, e1, this.toCtx, fresh);
    this.scheduledUntil = e1;
  }

  // Ducking: a trilha abaixa automaticamente durante cada fala
  _scheduleDucking(from) {
    const g = this.duck.gain, now = this.ac.currentTime;
    g.cancelScheduledValues(0);
    const inLine = this.timeline.lines.some(L => from >= L.start - 0.2 && from <= L.end + 0.3);
    const DUCK = 0.42;
    g.setValueAtTime(inLine ? DUCK : 1, now);
    // une falas próximas em um único intervalo de ducking
    const iv = [];
    for (const L of this.timeline.lines) {
      const last = iv[iv.length - 1];
      if (last && L.start - last[1] < 1.2) last[1] = L.end; else iv.push([L.start, L.end]);
    }
    for (const [s0, s1] of iv) {
      if (s1 + 0.9 < from) continue;
      const a = this.toCtx(s0 - 0.3), b = this.toCtx(s1 + 0.35);
      if (a > now) { g.setValueAtTime(1, a); g.linearRampToValueAtTime(DUCK, a + 0.3); }
      if (b > now) { g.setValueAtTime(DUCK, b); g.linearRampToValueAtTime(1, b + 0.6); }
      else if (b + 0.6 > now) g.linearRampToValueAtTime(1, b + 0.6);
    }
  }
}
