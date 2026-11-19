/**
 * <hf-player src="/preview/index.html" controls loop autoplay></hf-player>
 *
 * Loads a composition page (served with the runtime injected) in an iframe,
 * scales it to fit, and drives it through the runtime's postMessage protocol:
 *   → hf:play | hf:pause | hf:seek {time} | hf:describe
 *   ← hf:ready {config} | hf:state {time, duration, playing, fps} | hf:description {data}
 * Events: "ready", "timeupdate", "play", "pause", "ended".
 */

interface State { time: number; duration: number; playing: boolean; fps: number }

const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
};

const TEMPLATE = `
<style>
  :host{display:block;position:relative;background:#000;color:#fff;font:13px/1.2 system-ui,sans-serif;user-select:none;--accent:#22d3ee}
  .stage{position:relative;width:100%;aspect-ratio:var(--ratio,16/9);overflow:hidden;background:#000}
  iframe{position:absolute;left:0;top:0;border:0;transform-origin:0 0;background:#000}
  .bar{display:flex;align-items:center;gap:10px;padding:8px 10px;background:#0b0f19}
  :host(:not([controls])) .bar{display:none}
  button{background:none;border:0;color:inherit;cursor:pointer;padding:4px 6px;border-radius:6px;font:inherit}
  button:hover{background:rgba(255,255,255,.1)}
  input[type=range]{flex:1;accent-color:var(--accent)}
  .time{font-variant-numeric:tabular-nums;min-width:120px;text-align:right;opacity:.85}
  .status{position:absolute;inset:0;display:grid;place-items:center;font-size:14px;opacity:.7;pointer-events:none}
</style>
<div class="stage"><iframe allow="autoplay; fullscreen" title="composition"></iframe><div class="status">loading…</div></div>
<div class="bar">
  <button class="prev" title="Previous frame (←)">⏮</button>
  <button class="play" title="Play/pause (space)">▶</button>
  <button class="next" title="Next frame (→)">⏭</button>
  <input class="seek" type="range" min="0" max="1" step="0.001" value="0">
  <span class="time">0:00.00 / 0:00.00</span>
  <button class="fs" title="Fullscreen">⛶</button>
</div>`;

export class HfPlayer extends HTMLElement {
  static observedAttributes = ['src'];
  private iframe!: HTMLIFrameElement;
  private state: State = { time: 0, duration: 0, playing: false, fps: 30 };
  private config: { width: number; height: number; fps: number; duration: number } | null = null;
  private resizeObserver?: ResizeObserver;
  private scrubbing = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = TEMPLATE;
  }

  connectedCallback() {
    const root = this.shadowRoot!;
    this.iframe = root.querySelector('iframe')!;
    root.querySelector<HTMLButtonElement>('.play')!.onclick = () => (this.state.playing ? this.pause() : this.play());
    root.querySelector<HTMLButtonElement>('.prev')!.onclick = () => this.step(-1);
    root.querySelector<HTMLButtonElement>('.next')!.onclick = () => this.step(1);
    root.querySelector<HTMLButtonElement>('.fs')!.onclick = () => void this.requestFullscreen?.();
    const seek = root.querySelector<HTMLInputElement>('.seek')!;
    seek.oninput = () => { this.scrubbing = true; this.seek(Number(seek.value)); };
    seek.onchange = () => { this.scrubbing = false; };
    this.tabIndex = 0;
    this.addEventListener('keydown', (e) => {
      if (e.key === ' ') { e.preventDefault(); this.state.playing ? this.pause() : this.play(); }
      if (e.key === 'ArrowLeft') this.step(-1);
      if (e.key === 'ArrowRight') this.step(1);
    });
    window.addEventListener('message', this.onMessage);
    this.resizeObserver = new ResizeObserver(() => this.layout());
    this.resizeObserver.observe(this);
    if (this.getAttribute('src')) this.load(this.getAttribute('src')!);
  }

  disconnectedCallback() {
    window.removeEventListener('message', this.onMessage);
    this.resizeObserver?.disconnect();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === 'src' && value && this.iframe) this.load(value);
  }

  get currentTime() { return this.state.time; }
  get duration() { return this.state.duration; }
  get paused() { return !this.state.playing; }
  get compositionConfig() { return this.config; }

  load(src: string) {
    this.config = null;
    this.status('loading…');
    this.iframe.src = src;
  }

  /** Reloads the composition keeping the playhead. */
  reload() {
    const t = this.state.time;
    const once = (e: Event) => { this.removeEventListener('ready', once); this.seek(t); };
    this.addEventListener('ready', once);
    this.iframe.contentWindow?.location.reload();
  }

  play() { this.post({ type: 'hf:play' }); }
  pause() { this.post({ type: 'hf:pause' }); }
  seek(time: number) { this.post({ type: 'hf:seek', time: Math.max(0, Math.min(time, this.state.duration || time)) }); }
  step(frames: number) { this.seek(this.state.time + frames / (this.config?.fps ?? 30)); }

  /** Asks the runtime for its resolved timeline (clips, adapters, errors). */
  describe(): Promise<unknown> {
    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.source === this.iframe.contentWindow && e.data?.type === 'hf:description') {
          window.removeEventListener('message', handler);
          resolve(e.data.data);
        }
      };
      window.addEventListener('message', handler);
      this.post({ type: 'hf:describe' });
    });
  }

  private post(msg: unknown) { this.iframe?.contentWindow?.postMessage(msg, '*'); }

  private status(text: string | null) {
    const el = this.shadowRoot!.querySelector<HTMLElement>('.status')!;
    el.textContent = text ?? '';
    el.style.display = text ? '' : 'none';
  }

  private onMessage = (e: MessageEvent) => {
    if (e.source !== this.iframe?.contentWindow) return;
    const m = e.data as { type?: string; config?: HfPlayer['config']; time?: number; duration?: number; playing?: boolean; fps?: number };
    if (m?.type === 'hf:ready' && m.config) {
      this.config = m.config;
      this.state.duration = m.config.duration;
      this.style.setProperty('--ratio', `${m.config.width}/${m.config.height}`);
      this.layout();
      this.status(null);
      this.dispatchEvent(new CustomEvent('ready', { detail: m.config }));
      if (this.hasAttribute('autoplay')) this.play();
    } else if (m?.type === 'hf:state') {
      const wasPlaying = this.state.playing;
      this.state = { time: m.time ?? 0, duration: m.duration ?? 0, playing: !!m.playing, fps: m.fps ?? 30 };
      this.render();
      this.dispatchEvent(new CustomEvent('timeupdate', { detail: this.state }));
      if (wasPlaying !== this.state.playing) this.dispatchEvent(new Event(this.state.playing ? 'play' : 'pause'));
      if (wasPlaying && !this.state.playing && this.state.time >= this.state.duration - 1e-3) {
        this.dispatchEvent(new Event('ended'));
        if (this.hasAttribute('loop')) { this.seek(0); this.play(); }
      }
    }
  };

  private layout() {
    if (!this.config || !this.iframe) return;
    const stage = this.shadowRoot!.querySelector<HTMLElement>('.stage')!;
    const scale = stage.clientWidth / this.config.width;
    this.iframe.style.width = `${this.config.width}px`;
    this.iframe.style.height = `${this.config.height}px`;
    this.iframe.style.transform = `scale(${scale})`;
  }

  private render() {
    const root = this.shadowRoot!;
    root.querySelector('.play')!.textContent = this.state.playing ? '⏸' : '▶';
    const seek = root.querySelector<HTMLInputElement>('.seek')!;
    seek.max = String(this.state.duration || 1);
    if (!this.scrubbing) seek.value = String(this.state.time);
    root.querySelector('.time')!.textContent = `${fmt(this.state.time)} / ${fmt(this.state.duration)}  ·  f${Math.round(this.state.time * this.state.fps)}`;
  }
}

if (!customElements.get('hf-player')) customElements.define('hf-player', HfPlayer);

declare global {
  interface HTMLElementTagNameMap { 'hf-player': HfPlayer }
}
