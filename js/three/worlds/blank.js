// Mundo vazio: usado por episódios desenhados em 2D (o quadro inteiro vem do draw2D da cena).
import * as THREE from 'three';

export class BlankWorld {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#000000');
    this.bloom = { strength: 0, radius: 0, threshold: 1 };
    this.exposure = 1;
    this.state = {};
  }
  reset() {}
  update() {}
}
