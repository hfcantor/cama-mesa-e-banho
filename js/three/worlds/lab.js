// Mundo: observatório (cúpula, telescópio, telas de dados, alarme)
import * as THREE from 'three';
import { moonTexture, glowTexture, dynamicScreen } from '../textures.js';
import { Character } from '../characters.js';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });

export class LabWorld {
  constructor(shared) {
    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color('#05070d');
    this.bloom = { strength: 0.6, radius: 0.4, threshold: 0.9 };
    this.exposure = 1.1;
    s.fog = new THREE.Fog('#0a0f1a', 12, 45);

    // piso
    const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), M('#1d232e', { roughness: 0.35, metalness: 0.4 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
    const grid = new THREE.PolarGridHelper(15, 16, 8, 64, '#2a3a55', '#1f2a40'); grid.position.y = 0.01; s.add(grid);
    // cúpula com fenda
    const dome = new THREE.Mesh(new THREE.SphereGeometry(15, 64, 32, 0.25, Math.PI * 2 - 0.5, 0, Math.PI / 2), M('#3a4252', { side: THREE.BackSide, roughness: 0.7, metalness: 0.5 }));
    dome.rotation.y = Math.PI / 2 - 0.0; s.add(dome);
    const ribs = new THREE.Group();
    for (let i = 0; i < 16; i++) { const rb = new THREE.Mesh(new THREE.TorusGeometry(14.9, 0.08, 6, 48, Math.PI / 2), M('#59647a', { metalness: 0.7, roughness: 0.4 })); rb.rotation.y = (i / 16) * Math.PI * 2; ribs.add(rb); }
    s.add(ribs);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 3, 64, 1, true), M('#2a303c', { side: THREE.BackSide }));
    wall.position.y = -1.4; s.add(wall);
    // céu e Lua vistos pela fenda
    const mt = shared.moon || (shared.moon = moonTexture(1024));
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ map: mt, fog: false }));
    this.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(190,210,255,0.9)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
    this.moonG = new THREE.Group(); this.moonG.add(this.moonGlow, this.moon);
    this.moonG.position.set(0, 60, 40); s.add(this.moonG);
    // telescópio
    this.scope = new THREE.Group();
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 2.2, 24), M('#7a8494', { metalness: 0.6, roughness: 0.4 }));
    pier.position.y = 1.1; this.scope.add(pier);
    this.tube = new THREE.Group(); this.tube.position.y = 2.4; this.scope.add(this.tube);
    const tubeM = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.6, 6.5, 32), M('#8e98aa', { metalness: 0.6, roughness: 0.35 }));
    tubeM.position.y = 1.8; this.tube.add(tubeM);
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.08, 8, 32), M('#283040', { metalness: 0.8 })); ringA.rotation.x = Math.PI / 2; ringA.position.y = 4.9; this.tube.add(ringA);
    this.tube.rotation.x = 0.75;
    this.scope.position.set(0, 0, 4.5);
    this.scope.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    s.add(this.scope);

    // mesas e monitores
    this.screens = [];
    const deskM = M('#2b3242', { metalness: 0.3 });
    const mkDesk = (x, z, ry, big = false) => {
      const g = new THREE.Group();
      const desk = new THREE.Mesh(new THREE.BoxGeometry(big ? 4 : 2.6, 0.12, 1.2), deskM); desk.position.y = 0.95; g.add(desk);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(big ? 3.8 : 2.4, 0.9, 0.1), deskM); leg.position.set(0, 0.45, -0.5); g.add(leg);
      const sc = dynamicScreen(big ? 768 : 512, big ? 432 : 320);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(big ? 3.4 : 2, big ? 1.9 : 1.25), new THREE.MeshBasicMaterial({ map: sc.tex, color: '#c8d4e0' }));
      scr.position.set(0, big ? 2.2 : 1.75, -0.35); scr.rotation.x = -0.1; g.add(scr);
      const frame = new THREE.Mesh(new THREE.BoxGeometry((big ? 3.4 : 2) + 0.1, (big ? 1.9 : 1.25) + 0.1, 0.06), M('#11151d')); frame.position.copy(scr.position); frame.position.z -= 0.04; frame.rotation.x = -0.1; g.add(frame);
      g.position.set(x, 0, z); g.rotation.y = ry;
      g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      s.add(g);
      this.screens.push({ ...sc, big });
      return g;
    };
    mkDesk(0, -6, 0, true);
    mkDesk(-4.2, -4.2, 0.6);
    mkDesk(4.2, -4.2, -0.6);

    // cientistas
    this.sci1 = new Character({ coat: true, glasses: true, shirt: '#3a6ea5', pants: '#2a2a35', skin: '#e0b090', hair: '#5a3a20' });
    this.sci2 = new Character({ coat: true, shirt: '#8a3b5a', pants: '#25303a', skin: '#8a5a3a', hair: '#111' });
    this.sci1.root.position.set(-0.85, 0, -4.7); this.sci1.root.rotation.y = Math.PI;
    this.sci2.root.position.set(0.85, 0, -4.6); this.sci2.root.rotation.y = Math.PI;
    s.add(this.sci1.root, this.sci2.root);

    // luzes
    s.add(new THREE.HemisphereLight('#6080b8', '#151520', 0.75));
    [[-6, 7, -2], [6, 7, -2], [0, 8, 6]].forEach(p => { const l = new THREE.PointLight('#9ab8ff', 9, 22, 1.4); l.position.set(...p); s.add(l); });
    this.key = new THREE.SpotLight('#a8c8ff', 60, 40, 0.6, 0.6, 1.2); this.key.position.set(0, 12, 4); this.key.target.position.set(0, 0, -3);
    this.key.castShadow = true; this.key.shadow.mapSize.set(1024, 1024); s.add(this.key, this.key.target);
    this.screenLight = new THREE.PointLight('#5ab0ff', 8, 12, 1.5); this.screenLight.position.set(0, 2.2, -4.5); s.add(this.screenLight);
    // alarme giratório
    this.beacon = new THREE.Group(); this.beacon.position.set(0, 6.5, -6.2);
    const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.45, 16), new THREE.MeshStandardMaterial({ color: '#400', emissive: '#ff1a1a', emissiveIntensity: 0 }));
    this.bulb = bulb; this.beacon.add(bulb);
    this.alarmLight = new THREE.SpotLight('#ff2020', 0, 30, 0.5, 0.5, 1); this.alarmLight.position.set(0, 0, 0);
    this.alarmTarget = new THREE.Object3D(); this.beacon.add(this.alarmLight, this.alarmTarget); this.alarmLight.target = this.alarmTarget;
    this.redFill = new THREE.PointLight('#ff2020', 0, 30, 1.2); this.redFill.position.set(0, 5, 0); s.add(this.redFill);
    s.add(this.beacon);
    this.state = { alarm: 0, dist: 384400, moonScale: 6, alert: 0, chart: 0 };
  }

  reset() {}

  drawScreens(t) {
    const st = this.state;
    this.screens.forEach((sc, i) => {
      const { g, canvas: c } = sc, w = c.width, h = c.height;
      g.fillStyle = '#04101e'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(90,180,255,0.15)'; g.lineWidth = 1;
      for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      const red = st.alert > 0 && Math.sin(t * 10) > 0;
      if (sc.big) {
        g.fillStyle = '#7fd0ff'; g.font = '700 30px Montserrat, sans-serif'; g.textAlign = 'left';
        g.fillText('DISTÂNCIA TERRA — LUA', 28, 52);
        g.font = '900 96px Montserrat, sans-serif';
        g.fillStyle = red ? '#ff4040' : '#ffffff';
        g.fillText(Math.round(st.dist).toLocaleString('pt-BR') + ' km', 28, 160);
        // gráfico de aproximação
        g.strokeStyle = '#ffb000'; g.lineWidth = 4; g.beginPath();
        for (let x = 0; x <= 1; x += 0.01) {
          const yy = h - 60 - (1 - Math.pow(x, 2.2)) * 170;
          const px = 28 + x * (w - 56) * Math.min(1, st.chart);
          x === 0 ? g.moveTo(px, yy) : g.lineTo(px, yy);
        }
        g.stroke();
        if (st.alert > 0) {
          g.fillStyle = red ? 'rgba(255,40,40,0.9)' : 'rgba(255,40,40,0.35)';
          g.fillRect(w - 280, 18, 252, 56);
          g.fillStyle = '#fff'; g.font = '900 34px Montserrat, sans-serif'; g.fillText('⚠ ALERTA', w - 262, 58);
        }
      } else {
        // telas laterais: espectro e varredura
        g.strokeStyle = i === 1 ? '#3dff9a' : '#ff9a3d'; g.lineWidth = 3; g.beginPath();
        for (let x = 0; x < w; x += 4) {
          const v = Math.sin(x * 0.05 + t * (4 + i)) * 30 * (1 + st.alert) + Math.sin(x * 0.13 - t * 7) * 15;
          x === 0 ? g.moveTo(x, h / 2 + v) : g.lineTo(x, h / 2 + v);
        }
        g.stroke();
        g.fillStyle = '#9fd8ff'; g.font = '700 26px Montserrat, sans-serif';
        g.fillText(i === 1 ? 'MARÉ  +' + (st.alert * 38 + 4).toFixed(1) + ' m' : 'SISMO  ' + (5 + st.alert * 3.6).toFixed(1), 20, 40);
      }
      sc.tex.needsUpdate = true;
    });
  }

  update(t, dt) {
    const st = this.state;
    this.moon.scale.setScalar(st.moonScale);
    this.moonGlow.scale.setScalar(st.moonScale * 4);
    this.beacon.rotation.y = t * 5;
    this.alarmTarget.position.set(4, -3, 0);
    this.alarmLight.intensity = st.alarm * 140;
    this.bulb.material.emissiveIntensity = st.alarm * (2 + Math.sin(t * 10) * 1);
    this.redFill.intensity = st.alarm * (6 + Math.sin(t * 10) * 5);
    this.screenLight.intensity = 6 + Math.sin(t * 13) * 0.6;
    this.drawScreens(t);
    this.sci1.update(t, dt); this.sci2.update(t, dt);
  }
}
