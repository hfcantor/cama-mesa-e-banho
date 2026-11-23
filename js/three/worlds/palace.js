// Mundo: o palácio e os cenários dos decretos (EP02 — "E se o presidente virasse ditador?").
// Sátira absurda com um personagem GENÉRICO (sem rosto nem nome de pessoa real).
// Cada decreto é um "set" em uma posição X diferente; as cenas só movem a câmera entre eles.
import * as THREE from 'three';
import { glowTexture } from '../textures.js';
import { Character } from '../characters.js';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const SETS = { throne: 0, cal: 60, bank: 120, bed: 180, sofa: 240, phone: 300, pot: 360 };

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

function sign(text, w, h, { bg = '#fff', fg = '#111', size = 120, border = null, lines = null } = {}) {
  const px = 512, py = Math.max(64, Math.round(512 * h / w));
  const tex = canvasTex(px, py, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, px, py);
    if (border) { g.strokeStyle = border; g.lineWidth = 18; g.strokeRect(9, 9, px - 18, py - 18); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const L = lines || [text];
    // cada linha cabe na largura (90%) e a pilha cabe na altura (80%)
    let fs = Math.min(size, (py * 0.8) / (L.length * 1.1));
    const fit = (f) => { g.font = `900 ${f}px Montserrat, Arial Black, sans-serif`; return Math.max(...L.map(t => g.measureText(t).width)); };
    while (fs > 10 && fit(fs) > px * 0.88) fs *= 0.92;
    g.font = `900 ${fs}px Montserrat, Arial Black, sans-serif`;
    L.forEach((t, i) => g.fillText(t, px / 2, py / 2 + (i - (L.length - 1) / 2) * fs * 1.1));
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
}

function checkerTexture() {
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = '#e9dfcf'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#b9a98f'; g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(24, 20);
  return t;
}

export class PalaceWorld {
  constructor(shared) {
    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color('#150a18');
    this.bloom = { strength: 0.35, radius: 0.5, threshold: 0.92 };
    this.exposure = 1.15;
    this.state = {
      calRip: 0, chaos: 0, pull: 0, bars: 0, muted: 0, ban: 0, mob: 0, crownFall: 0, sit: 1, bubbles: 1, rage: 0,
    };

    // luzes (sem sombras: o palácio tem vários sets e isso mantém o render leve)
    s.add(new THREE.HemisphereLight('#fff0dd', '#4a3a60', 1.0));
    const sun = new THREE.DirectionalLight('#fff2d6', 1.5); sun.position.set(30, 40, 40); s.add(sun);
    this.lights = {};
    for (const [name, x] of Object.entries(SETS)) {
      const l = new THREE.PointLight('#ffd9a0', 70, 40, 1.3); l.position.set(x, 9, 4); s.add(l);
      this.lights[name] = l;
    }

    // chão
    const floorTex = checkerTexture();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(520, 90), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.4 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(180, 0, -10); s.add(floor);

    // fundos coloridos por set
    const back = (name, color, trim = '#ffd24a') => {
      const x = SETS[name];
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(56, 34), M(color, { roughness: 0.9 }));
      wall.position.set(x, 15, -14); s.add(wall);
      const band = new THREE.Mesh(new THREE.BoxGeometry(56, 0.5, 0.3), M(trim, { metalness: 0.4, roughness: 0.3 }));
      band.position.set(x, 4.2, -13.8); s.add(band);
      const base = new THREE.Mesh(new THREE.BoxGeometry(56, 1.2, 0.4), M(trim, { metalness: 0.4, roughness: 0.3 }));
      base.position.set(x, 0.6, -13.8); s.add(base);
    };
    back('throne', '#5b1226'); back('cal', '#1f5b8f', '#fff3b0'); back('bank', '#2c5f4a', '#e6e6e6');
    back('bed', '#262b66', '#9fb0ff'); back('sofa', '#7a4724', '#ffcf8a'); back('phone', '#0f4d3a', '#7dffb0'); back('pot', '#7a2e14', '#ffcf8a');

    this.buildThrone(s);
    this.buildCalendar(s);
    this.buildBank(s);
    this.buildBed(s);
    this.buildSofa(s);
    this.buildPhone(s);
    this.buildPot(s);

    // personagens
    this.pres = new Character({ shirt: '#1d6b3a', pants: '#20263a', skin: '#d9a066', hair: '#201510', scale: 1.05 });
    {
      const head = this.pres.head, r = this.pres.headR;
      const gold = M('#ffd24a', { metalness: 0.7, roughness: 0.25, emissive: '#6a4a00', emissiveIntensity: 0.4 });
      this.crown = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.7, r * 0.34, 20), gold);
      this.crown.add(ring);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.ConeGeometry(r * 0.13, r * 0.38, 8), gold);
        p.position.set(Math.cos(a) * r * 0.58, r * 0.34, Math.sin(a) * r * 0.58); this.crown.add(p);
      }
      this.crown.position.set(0, r * 2.02, 0); head.add(this.crown);
      const stache = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.07, r * 0.6, 4, 10), M('#1a1210'));
      stache.rotation.z = Math.PI / 2; stache.position.set(0, r * 0.68, r * 0.93); head.add(stache);
      const sash = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.95, 0.04), M('#ffd24a', { roughness: 0.4 }));
      sash.position.set(0, 0.33, 0.215); sash.rotation.z = 0.62; this.pres.torso.add(sash);
      const star = new THREE.Mesh(new THREE.CircleGeometry(0.06, 5), M('#c81e1e'));
      star.position.set(-0.2, 0.52, 0.245); this.pres.torso.add(star);
    }
    s.add(this.pres.root);

    const looks = [
      ['#d94f2b', '#2f4a7a', '#c98a5e'], ['#2b7fd9', '#3a3a3a', '#8a5a3a'], ['#e0b43a', '#2a5a3a', '#e0b090'],
      ['#a43ad9', '#2a2a40', '#a8754a'], ['#3ad9a4', '#4a3a2a', '#f0c8a0'], ['#d93a6f', '#25304a', '#7a4a2a'],
      ['#7ad93a', '#3a2a4a', '#c98a5e'], ['#f08a2b', '#2a3a5a', '#e0b090'],
    ];
    this.crowd = looks.map(([shirt, pants, skin], i) => {
      const c = new Character({ shirt, pants, skin, hair: i % 2 ? '#201510' : '#4a2a14', kid: i % 3 === 2 });
      c.root.visible = false; s.add(c.root); return c;
    });
    this.sleeper = new Character({ shirt: '#6a8fd9', pants: '#6a8fd9', skin: '#d9a066' });
    this.sleeper.pose.sleep = 1; this.sleeper.cur.sleep = 1;
    s.add(this.sleeper.root);
    this.prisoner = new Character({ shirt: '#e8e8e8', pants: '#e8e8e8', skin: '#c98a5e' });
    s.add(this.prisoner.root);

    this.reset();
  }

  // ------------------------------------------------------------------ sets
  buildThrone(s) {
    const x = SETS.throne;
    const gold = M('#ffd24a', { metalness: 0.7, roughness: 0.28 });
    const red = M('#a3162e', { roughness: 0.8 });
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(6, 60), red); carpet.rotation.x = -Math.PI / 2; carpet.position.set(x, 0.02, 10); s.add(carpet);
    [0, 1, 2].forEach((i) => {
      const st = new THREE.Mesh(new THREE.BoxGeometry(9 - i * 1.4, 0.35, 4 - i * 0.6), M('#6a4a2a'));
      st.position.set(x, 0.18 + i * 0.35, -6 - i * 0.2); s.add(st);
    });
    const dais = 1.05;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 1.8), gold); seat.position.set(x, dais + 0.35, -7); s.add(seat);
    const cush = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 1.5), red); cush.position.set(x, dais + 0.8, -6.95); s.add(cush);
    const backr = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.2, 0.4), gold); backr.position.set(x, dais + 2.5, -7.9); s.add(backr);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.1, 4), gold); top.position.set(x, dais + 5.1, -7.9); top.rotation.y = Math.PI / 4; s.add(top);
    [-1, 1].forEach((k) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 1.6), gold); arm.position.set(x + k * 1.2, dais + 1.1, -7); s.add(arm);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 14, 24), M('#f2e6c8', { roughness: 0.5 })); col.position.set(x + k * 9, 7, -11); s.add(col);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), gold); cap.position.set(x + k * 9, 14.1, -11); s.add(cap);
      const banner = sign('', 2.4, 6, { bg: '#c81e1e', border: '#ffd24a', lines: ['E SE', '...?'], fg: '#ffd24a', size: 130 });
      banner.position.set(x + k * 5.4, 9, -13.6); s.add(banner);
    });
    this.throneSeatY = dais + 0.95;
  }

  buildCalendar(s) {
    const x = SETS.cal;
    const mk = (ripped) => canvasTex(512, 640, (g) => {
      g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 512, 640);
      g.fillStyle = '#c81e1e'; g.fillRect(0, 0, 512, 110);
      g.fillStyle = '#fff'; g.font = '900 64px Montserrat, Arial Black, sans-serif'; g.textAlign = 'center'; g.fillText('NOVEMBRO', 256, 78);
      const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
      days.forEach((d, i) => {
        const cx = 36 + i * 73;
        if (i === 0 && ripped) return;
        g.fillStyle = i === 0 ? '#c81e1e' : '#222'; g.font = '800 26px Montserrat, sans-serif'; g.fillText(d, cx, 160);
        for (let r = 0; r < 5; r++) {
          g.fillStyle = i === 0 ? 'rgba(200,30,30,0.18)' : 'rgba(0,0,0,0.05)'; g.fillRect(cx - 30, 185 + r * 88, 62, 74);
          g.fillStyle = i === 0 ? '#c81e1e' : '#444'; g.font = '800 30px Montserrat, sans-serif'; g.fillText(String(r * 7 + i + 1), cx, 233 + r * 88);
        }
      });
    });
    this.calTexOn = mk(false); this.calTexOff = mk(true);
    this.calendar = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 9), new THREE.MeshBasicMaterial({ map: this.calTexOn, toneMapped: false }));
    this.calendar.position.set(x, 8.4, -13.5); s.add(this.calendar);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(7.5, 9.3, 0.2), M('#3a2a1a')); frame.position.set(x, 8.4, -13.65); s.add(frame);
    // coluna da segunda-feira, que sai voando
    this.monday = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 7.3), new THREE.MeshBasicMaterial({ color: '#ff5a5a', transparent: true, opacity: 0.95, toneMapped: false }));
    this.monday.position.set(x - 3.1, 8.0, -13.3); s.add(this.monday);
    const lbl = sign('SEG', 1.0, 0.7, { bg: '#c81e1e', fg: '#fff', size: 150 }); lbl.position.set(0, 3.2, 0.01); this.monday.add(lbl);
  }

  buildBank(s) {
    const x = SETS.bank;
    const counter = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 1.6), M('#e8d9b0', { roughness: 0.5 }));
    counter.position.set(x, 1.1, -9); s.add(counter);
    const topc = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.3, 2), M('#6a4a2a')); topc.position.set(x, 2.3, -9); s.add(topc);
    [-5, 0, 5].forEach((dx) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 0.2), M('#8ec9ff', { transparent: true, opacity: 0.5, roughness: 0.1 }));
      win.position.set(x + dx, 4.3, -9); s.add(win);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.5, 0.15), M('#444')); frame.position.set(x + dx, 4.3, -9.1); s.add(frame);
    });
    const banner = sign('BANCO', 6.4, 1.8, { bg: '#0b3d91', fg: '#ffd24a', border: '#ffd24a', size: 150 });
    banner.position.set(x, 9.2, -13.6); s.add(banner);
    const line = sign('', 3.6, 1.2, { bg: '#c81e1e', fg: '#fff', lines: ['FILA PROIBIDA'], size: 100 });
    line.position.set(x, 7.0, -8.9); s.add(line); this.filaSign = line;
  }

  buildBed(s) {
    const x = SETS.bed;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.7, 3.2), M('#5a3a22')); frame.position.set(x, 0.55, -7); s.add(frame);
    const mat = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 2.9), M('#f4f0ff', { roughness: 0.9 })); mat.position.set(x, 1.1, -7); s.add(mat);
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 1.8), M('#ffffff', { roughness: 1 })); pillow.position.set(x - 1.9, 1.55, -7); s.add(pillow);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3, 3.2), M('#5a3a22')); head.position.set(x - 2.75, 1.5, -7); s.add(head);
    this.blanket = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 3.0), M('#3a8fe0', { roughness: 1 }));
    this.blanket.position.set(x + 1.0, 1.65, -7); s.add(this.blanket);
    // despertador gigante
    const g = this.alarm = new THREE.Group(); g.position.set(x + 4.9, 2.0, -6); g.scale.setScalar(0.78);
    const body = new THREE.Mesh(new THREE.SphereGeometry(2.2, 40, 28), M('#e8412c', { roughness: 0.35 })); body.scale.set(1, 1.05, 0.85); g.add(body);
    const faceTex = canvasTex(512, 512, (c) => {
      c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(256, 256, 236, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#222'; c.lineWidth = 10; c.stroke();
      c.fillStyle = '#222'; c.font = '900 64px Montserrat, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      [12, 3, 6, 9].forEach((n, i) => { const a = i * Math.PI / 2 - Math.PI / 2; c.fillText(String(n), 256 + Math.cos(a) * 180, 256 + Math.sin(a) * 180); });
      c.lineWidth = 14; c.lineCap = 'round';
      c.beginPath(); c.moveTo(256, 256); c.lineTo(256, 120); c.stroke(); c.beginPath(); c.moveTo(256, 256); c.lineTo(340, 290); c.stroke();
    });
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.75, 40), new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false }));
    face.position.z = 1.9; g.add(face);
    // olhos bravos
    [-0.6, 0.6].forEach((dx) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), M('#ffffff')); eye.position.set(dx, 0.5, 2.05); eye.scale.z = 0.5; g.add(eye);
      const pu = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), M('#111')); pu.position.set(dx, 0.5, 2.25); g.add(pu);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.1), M('#111')); brow.position.set(dx, 0.95, 2.2); brow.rotation.z = -dx * 0.9; g.add(brow);
    });
    [-1, 1].forEach((k) => {
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M('#ffd24a', { metalness: 0.7, roughness: 0.3 }));
      bell.position.set(k * 1.5, 2.1, 0); bell.rotation.z = -k * 0.5; g.add(bell);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.1, 10), M('#333')); leg.position.set(k * 1.2, -2.2, 0.2); leg.rotation.z = k * 0.4; g.add(leg);
    });
    this.alarmArms = [-1, 1].map((k) => {
      const sh = new THREE.Group(); sh.position.set(k * 2.1, 0, 0.2);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 2.6, 6, 12), M('#e8412c', { roughness: 0.4 })); arm.position.y = -1.4; sh.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), M('#ffffff')); hand.position.y = -2.9; sh.add(hand);
      g.add(sh); return { sh, k };
    });
    s.add(g);
    const zz = sign('', 4.4, 1.3, { bg: '#1c2250', fg: '#9fb0ff', lines: ['"só mais 5 minutinhos"'], size: 90 });
    zz.position.set(x + 0.8, 6.2, -8.5); s.add(zz); this.minSign = zz;
  }

  buildSofa(s) {
    const x = SETS.sofa;
    const fab = M('#b4452a', { roughness: 0.95 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 2.2), fab); base.position.set(x, 0.65, -7); s.add(base);
    const back = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.6, 0.6), fab); back.position.set(x, 1.7, -7.9); s.add(back);
    [-1, 1].forEach((k) => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.3, 2.2), fab); a.position.set(x + k * 2.8, 1.1, -7); s.add(a); });
    const cush = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 1.8), M('#d9633f', { roughness: 1 })); cush.position.set(x, 1.3, -6.9); s.add(cush);
    // grades da "prisão do sofá" (descem do alto)
    this.bars = new THREE.Group(); this.bars.position.set(x, 0, -5.4);
    const steel = M('#2c2f36', { metalness: 0.8, roughness: 0.35 });
    for (let i = -8; i <= 8; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 6.2, 8), steel); b.position.set(i * 0.4, 3.1, 0); this.bars.add(b);
    }
    [0.2, 6.2].forEach((y) => { const r = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.2, 0.2), steel); r.position.set(0, y, 0); this.bars.add(r); });
    const tag = sign('', 5, 1.1, { bg: '#ffd24a', fg: '#111', lines: ['PRISÃO DO SOFÁ'], size: 110 }); tag.position.set(0, 7, 0.05); this.bars.add(tag);
    s.add(this.bars);
    // placa de spoiler
    const sp = sign('', 2.2, 0.9, { bg: '#c81e1e', fg: '#fff', lines: ['SPOILER'], size: 110, border: '#fff' });
    sp.position.set(x - 2.6, 5.4, -5.4); sp.rotation.z = 0.12; s.add(sp);
    this.spoiler = sp;
    // TV
    const tv = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.3, 0.3), M('#111')); tv.position.set(x, 6.4, -13.2); s.add(tv);
    const scr = sign('', 3.4, 1.9, { bg: '#0b1d3a', fg: '#ffd24a', lines: ['FINAL DA SÉRIE'], size: 100 }); scr.position.set(x, 6.4, -13.0); s.add(scr);
  }

  buildPhone(s) {
    const x = SETS.phone;
    this.phone = new THREE.Group(); this.phone.position.set(x, 5.5, -7);
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 8, 0.4), M('#15171c', { roughness: 0.3 })); this.phone.add(body);
    const mk = (muted) => canvasTex(420, 800, (g) => {
      g.fillStyle = '#e7f5e0'; g.fillRect(0, 0, 420, 800);
      g.fillStyle = '#128c7e'; g.fillRect(0, 0, 420, 110);
      g.fillStyle = '#fff'; g.font = '900 34px Montserrat, sans-serif'; g.textAlign = 'left'; g.fillText('GRUPO DA FAMÍLIA', 28, 68);
      if (!muted) {
        const msgs = ['BOM DIA!!!', 'Corrente de oração', 'Bom dia, família!', 'Vídeo engraçado', 'Quem vem domingo?', 'BOM DIA!!!'];
        msgs.forEach((m, i) => {
          g.fillStyle = i % 2 ? '#fff' : '#dcf8c6'; g.fillRect(i % 2 ? 24 : 120, 140 + i * 105, 276, 80);
          g.fillStyle = '#222'; g.font = '700 26px Montserrat, sans-serif'; g.fillText(m, (i % 2 ? 24 : 120) + 14, 190 + i * 105);
        });
        g.fillStyle = '#e53935'; g.beginPath(); g.arc(360, 55, 34, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.font = '900 34px Montserrat, sans-serif'; g.textAlign = 'center'; g.fillText('99+', 360, 67);
      } else {
        g.fillStyle = '#9a9a9a'; g.font = '900 64px Montserrat, sans-serif'; g.textAlign = 'center';
        g.fillText('SILÊNCIO', 210, 420);
        g.font = '700 30px Montserrat, sans-serif'; g.fillText('0 mensagens', 210, 480);
      }
    });
    this.phoneTexLoud = mk(false); this.phoneTexMuted = mk(true);
    this.phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 7.25), new THREE.MeshBasicMaterial({ map: this.phoneTexLoud, toneMapped: false }));
    this.phoneScreen.position.z = 0.22; this.phone.add(this.phoneScreen);
    s.add(this.phone);
    this.notifs = [];
    for (let i = 0; i < 7; i++) {
      const b = sign('', 1.5, 0.7, { bg: '#25d366', fg: '#fff', lines: ['bom dia'], size: 100 });
      b.userData.ph = i * 0.9; s.add(b); this.notifs.push(b);
    }
    this.phoneX = x;
  }

  buildPot(s) {
    const x = SETS.pot;
    const table = new THREE.Mesh(new THREE.BoxGeometry(9, 0.4, 5), M('#7a4a28')); table.position.set(x, 2.6, -7); s.add(table);
    [[-4, -2], [4, -2], [-4, 2], [4, 2]].forEach(([dx, dz]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.6, 10), M('#5a3a1a')); l.position.set(x + dx, 1.3, -7 + dz); s.add(l); });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.0, 2.4, 40, 1, true), M('#1c1c1f', { metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }));
    pot.position.set(x, 4.0, -7); s.add(pot);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(2.0, 32), M('#111')); bottom.rotation.x = -Math.PI / 2; bottom.position.set(x, 2.85, -7); s.add(bottom);
    const beans = new THREE.Mesh(new THREE.CircleGeometry(2.3, 40), M('#4a2210', { roughness: 0.8 })); beans.rotation.x = -Math.PI / 2; beans.position.set(x, 4.6, -7); s.add(beans);
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 2.1;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), M(i % 4 ? '#5a2c14' : '#2a1208')); b.scale.set(1, 0.7, 0.8);
      b.position.set(x + Math.cos(a) * r, 4.65, -7 + Math.sin(a) * r); s.add(b);
    }
    [-1, 1].forEach((k) => { const h = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.09, 8, 16), M('#1c1c1f', { metalness: 0.6 })); h.position.set(x + k * 2.45, 4.6, -7); h.rotation.y = Math.PI / 2; s.add(h); });
    // vapor
    const steamTex = glowTexture('rgba(255,255,255,0.7)');
    this.steam = [];
    for (let i = 0; i < 10; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0.4, depthWrite: false }));
      sp.userData.ph = i / 10; s.add(sp); this.steam.push(sp);
    }
    // X vermelho de PROIBIDO
    this.ban = new THREE.Group(); this.ban.position.set(x, 6.2, -4.5);
    const redM = new THREE.MeshBasicMaterial({ color: '#e5202a', toneMapped: false });
    [Math.PI / 4, -Math.PI / 4].forEach((r) => { const b = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.9, 0.3), redM); b.rotation.z = r; this.ban.add(b); });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.45, 12, 48), redM); this.ban.add(ring);
    s.add(this.ban);
    this.potX = x;
  }

  // ------------------------------------------------------------- controle
  reset() {
    Object.assign(this.state, { calRip: 0, chaos: 0, pull: 0, bars: 0, muted: 0, ban: 0, mob: 0, crownFall: 0, sit: 1, bubbles: 1, rage: 0 });
    this.crowd.forEach((c) => { c.root.visible = false; Object.keys(c.pose).forEach((k) => { if (k !== 'smile') c.pose[k] = 0; c.cur[k] = c.pose[k]; }); c.root.rotation.set(0, 0, 0); });
    Object.keys(this.pres.pose).forEach((k) => { if (k !== 'smile') this.pres.pose[k] = 0; });
    this.pres.root.rotation.set(0, 0, 0);
    this.sleeper.root.visible = false; this.prisoner.root.visible = false;
  }

  // posiciona o presidente sentado no trono (pernas dobradas por cima da pose procedural)
  seatPresident() {
    const p = this.pres;
    p.root.position.set(SETS.throne, this.throneSeatY - 0.55, -7.1);
    p.root.rotation.set(0, 0, 0);
  }

  update(t, dt) {
    const st = this.state;

    // calendário: a segunda-feira é arrancada e sai voando
    const rip = st.calRip;
    this.calendar.material.map = rip > 0.35 ? this.calTexOff : this.calTexOn;
    this.monday.visible = rip < 0.999;
    const x0 = SETS.cal;
    this.monday.position.set(x0 - 3.1 - rip * 1.5, 8.0 + rip * 9 - rip * rip * 4, -13.3 + rip * 14);
    this.monday.rotation.set(rip * 2.2, 0, rip * 3.4);
    this.monday.scale.setScalar(1 + rip * 1.4);

    // despertador gigante puxando o cobertor
    const pull = st.pull, ax = SETS.bed;
    this.alarm.position.y = 2.0 + Math.abs(Math.sin(t * 6)) * 0.12 * pull;
    this.alarm.rotation.z = Math.sin(t * 22) * 0.04 * (0.3 + pull);
    this.alarmArms.forEach(({ sh, k }) => {
      sh.rotation.z = k * (0.4 + pull * 0.9) + Math.sin(t * 8 + k) * 0.08 * pull;
      sh.rotation.x = -0.3 - pull * 0.3;
    });
    this.blanket.position.x = ax + 1.0 + pull * 1.8;
    this.blanket.rotation.z = pull * 0.15;
    this.minSign.visible = pull < 0.55;

    // prisão do sofá
    this.bars.position.y = (1 - st.bars) * 9;
    this.spoiler.rotation.z = 0.12 + Math.sin(t * 5) * 0.03;

    // celular: silêncio
    this.phoneScreen.material.map = st.muted > 0.5 ? this.phoneTexMuted : this.phoneTexLoud;
    this.phone.rotation.y = Math.sin(t * 0.8) * 0.25;
    this.phone.rotation.z = Math.sin(t * 30) * 0.03 * (1 - st.muted);
    this.notifs.forEach((n, i) => {
      const k = (t * 0.7 + n.userData.ph) % 1;
      const a = (i % 2 ? 1 : -1);
      n.position.set(this.phoneX + a * (3.2 + k * 3), 3 + k * 6.5, -5.5);
      n.visible = st.bubbles * (1 - st.muted) > 0.01;
      n.scale.setScalar(Math.sin(k * Math.PI) * (1 - st.muted) + 0.001);
    });

    // vapor da feijoada
    this.steam.forEach((sp) => {
      const k = (t * 0.35 + sp.userData.ph) % 1;
      sp.position.set(this.potX + Math.sin(k * 6 + sp.userData.ph * 9) * 0.8, 5 + k * 4.5, -7);
      sp.scale.setScalar(1.2 + k * 2.4); sp.material.opacity = Math.sin(k * Math.PI) * 0.35;
    });
    // X vermelho de proibido
    const b = clamp01(st.ban);
    this.ban.visible = b > 0.01;
    this.ban.scale.setScalar(0.5 * (b < 1 ? b * (1 + (1 - b) * 0.4) : 1 + Math.sin(t * 6) * 0.015));
    this.ban.rotation.z = (1 - b) * 0.6;

    // personagens
    const sit = st.sit;
    this.pres.update(t, dt);
    if (sit > 0.5) {
      // sentado: pernas para frente
      this.pres.legs.forEach(({ hip }) => { hip.rotation.x = -1.45; });
      this.pres.arms.forEach(({ sh, elbow, s }) => { if (this.pres.cur.armsUp < 0.2) { sh.rotation.x = -0.9 - this.pres.cur.point * 1.2; sh.rotation.z = s * 0.28; elbow.rotation.x = -1.0; } });
    }
    this.crown.rotation.set(0, 0, 0);
    if (st.crownFall > 0) {
      const k = st.crownFall;
      this.crown.position.set(k * 1.8, this.pres.headR * 2.02 - k * k * 2.2, k * 1.2);
      this.crown.rotation.set(k * 5, 0, k * 3);
    } else {
      this.crown.position.set(0, this.pres.headR * 2.02, 0);
    }
    this.crowd.forEach((c) => { if (c.root.visible) c.update(t, dt); });
    this.sleeper.update(t, dt);
    this.prisoner.update(t, dt);
    // prisioneiro sempre sentado no sofá
    this.prisoner.legs.forEach(({ hip }) => { hip.rotation.x = -1.45; });
  }
}
