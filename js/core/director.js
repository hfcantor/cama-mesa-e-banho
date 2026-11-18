// Diretor: decide qual cena está no ar, aplica transições e compõe o quadro.
import { W, H, clamp01, ease } from '../render/stage.js';
import { drawSubtitles, drawBug } from '../render/overlays.js';
import { resolveAnchor } from './timeline.js';

const TR = 0.32; // meia-duração das transições (s)

export class Director {
  constructor(stage, worlds) {
    this.stage = stage;
    this.worlds = worlds;
    this.timeline = null;
    this.cur = -1;
    this.pointMats = new Map();
  }

  setTimeline(tl) { this.timeline = tl; this.cur = -1; }
  invalidate() { this.cur = -1; }

  sceneIndexAt(t) {
    const sc = this.timeline.scenes;
    for (let i = sc.length - 1; i >= 0; i--) if (t >= sc[i].start) return i;
    return 0;
  }

  ctx(scene, t, dt) {
    const tl = this.timeline;
    const T = (a) => resolveAnchor(a, tl.byId, tl.scenesById, scene);
    return {
      t, dt, tl, scene,
      lt: t - scene.start, dur: scene.dur, u: clamp01((t - scene.start) / scene.dur),
      cam: this.stage.camera, world: this.worlds[scene.def.world],
      T,
      since: (a) => t - T(a),
      k: (a, b) => { const ta = T(a), tb = T(b); return tb <= ta ? (t >= ta ? 1 : 0) : ease.inOut(clamp01((t - ta) / (tb - ta))); },
    };
  }

  frame(t, dt) {
    const tl = this.timeline, stage = this.stage, g = stage.g;
    const idx = this.sceneIndexAt(t);
    const scene = tl.scenes[idx];
    const world = this.worlds[scene.def.world];
    if (idx !== this.cur) {
      this.cur = idx;
      scene.def.setup && scene.def.setup(world, this.ctx(scene, t, 0));
    }
    const c = this.ctx(scene, t, dt);
    scene.def.update && scene.def.update(world, c);
    world.update(t, dt, t, this.stage.camera);
    this._pointScale(world);
    stage.render(world);

    // transição
    const tr = this._transition(t, idx);
    stage.blit(tr.blit);
    stage.post({ vignette: 0.5, grain: 0.05, t });
    if (tr.glitch > 0) this._glitch(g, tr.glitch, t);
    scene.def.draw2D && scene.def.draw2D(g, c);
    if (tr.color) { g.fillStyle = tr.color; g.fillRect(0, 0, W, H); }
    if (!scene.def.noBug && !(scene.id === 'abertura')) drawBug(g, t, 0.85 * clamp01(c.lt / 0.5));
    if (!scene.def.noSubtitles) drawSubtitles(g, tl, t);
  }

  _pointScale(world) {
    let list = this.pointMats.get(world);
    if (!list) {
      list = [];
      world.scene.traverse(o => { if (o.isPoints && o.material.uniforms && o.material.uniforms.scale) list.push(o.material); });
      this.pointMats.set(world, list);
    }
    const cam = this.stage.camera;
    const s = this.stage.rh / (2 * Math.tan((cam.fov * Math.PI) / 360));
    list.forEach(m => (m.uniforms.scale.value = s));
  }

  _transition(t, idx) {
    const sc = this.timeline.scenes;
    const res = { blit: {}, color: null, glitch: 0 };
    let B = null, type = null;
    if (idx > 0 && t - sc[idx].start < TR) { B = sc[idx].start; type = sc[idx].def.transition; }
    else if (idx < sc.length - 1 && sc[idx + 1].start - t < TR) { B = sc[idx + 1].start; type = sc[idx + 1].def.transition; }
    if (idx === 0 && t < 0.6) { res.color = `rgba(0,0,0,${1 - ease.out(t / 0.6)})`; }
    if (B == null) return res;
    const k = (t - B) / TR; // -1..1
    const m = 1 - Math.abs(k);
    switch (type) {
      case 'fade': res.color = `rgba(0,0,0,${ease.inOut(m)})`; break;
      case 'flash': res.color = `rgba(255,245,230,${Math.pow(m, k < 0 ? 3 : 1.5) * 0.95})`; break;
      case 'whip': res.blit = { whip: m * 1.6, ox: (k < 0 ? -1 : 1) * Math.pow(m, 2) * 260 * (k < 0 ? 1 : -1) }; break;
      case 'zoom': res.blit = { zoom: 1 + Math.pow(m, 2) * (k < 0 ? 0.6 : 0.35) }; res.color = `rgba(255,255,255,${Math.pow(m, 4) * 0.6})`; break;
      case 'glitch': res.glitch = m; break;
      default: break;
    }
    return res;
  }

  _glitch(g, m, t) {
    const c = this.stage.out;
    const f = Math.floor(t * 30);
    const hash = (a) => { const x = Math.sin(a * 127.1 + f * 311.7) * 43758.5453; return x - Math.floor(x); };
    const n = Math.floor(6 + m * 10);
    for (let i = 0; i < n; i++) {
      const y = hash(i) * H, h = 10 + hash(i + 50) * 120 * m;
      const dx = (hash(i + 99) - 0.5) * 160 * m;
      g.drawImage(c, 0, y, W, h, dx, y, W, h);
    }
    g.save();
    g.globalCompositeOperation = 'screen';
    g.globalAlpha = 0.35 * m;
    g.drawImage(c, 12 * m, 0, W, H); // separação cromática simples
    g.fillStyle = `rgba(255,0,80,${0.12 * m})`; g.fillRect(0, 0, W, H);
    g.restore();
    g.fillStyle = `rgba(255,255,255,${0.08 * m})`;
    for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
  }
}
