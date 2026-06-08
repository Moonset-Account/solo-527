import { BaseScene } from './BaseScene.js';
import { SCENES } from '../core/SceneManager.js';

export class MenuScene extends BaseScene {
  _setupUI() {
    const container = this._createElement('div', 'start-menu');

    const title = this._createElement('h1', 'game-title', '城市路口信号灯模拟');
    const subtitle = this._createElement('div', 'game-subtitle', 'TRAFFIC SIGNAL STRATEGY');

    const btnGroup = this._createElement('div', 'menu-buttons');

    const btnStart = this._h('button', {
      className: 'btn btn-large',
      textContent: '▶ 开始游戏',
      onclick: () => {
        this.audioManager.playClick();
        this.audioManager.resume();
        this.sceneManager.changeTo(SCENES.LEVEL_SELECT);
      }
    });

    const btnTutorial = this._h('button', {
      className: 'btn btn-secondary',
      textContent: '📖 操作教程',
      onclick: () => {
        this.audioManager.playClick();
        this.sceneManager.changeTo(SCENES.TUTORIAL);
      }
    });

    const btnSandbox = this._h('button', {
      className: 'btn btn-secondary',
      textContent: '🧪 沙盒模式',
      onclick: () => {
        this.audioManager.playClick();
        this.sceneManager.changeTo(SCENES.SANDBOX);
      }
    });

    btnGroup.appendChild(btnStart);
    btnGroup.appendChild(btnTutorial);
    btnGroup.appendChild(btnSandbox);

    const footer = this._createElement('div', 'menu-footer',
      '版本 1.0.0  ·  WebGL + Three.js  ·  调整信号灯 ·  让城市更顺畅'
    );

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(btnGroup);
    container.appendChild(footer);

    this._mountUI(container);

    this._showIntroScene();
  }

  _showIntroScene() {
    if (!this.renderEngine) return;
    this.renderEngine.clear();
    this._addMenuDecor();
  }

  _addMenuDecor() {
    const THREE = window.THREE;
    if (!THREE) return;
    const scene = this.renderEngine.scene;

    const planeGeom = new THREE.PlaneGeometry(600, 600);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x1e2a3c, roughness: 1.0
    });
    const ground = new THREE.Mesh(planeGeom, planeMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    scene.add(ground);

    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2e333e, roughness: 0.9 });
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xd0d0d0 });

    for (let i = -2; i <= 2; i++) {
      const hRoad = new THREE.Mesh(new THREE.PlaneGeometry(8, 200), roadMat);
      hRoad.rotation.x = -Math.PI / 2;
      hRoad.position.set(i * 40, 0.01, 0);
      hRoad.receiveShadow = true;
      scene.add(hRoad);

      const vRoad = new THREE.Mesh(new THREE.PlaneGeometry(200, 8), roadMat);
      vRoad.rotation.x = -Math.PI / 2;
      vRoad.position.set(0, 0.01, i * 40);
      vRoad.receiveShadow = true;
      scene.add(vRoad);

      for (let d = -90; d < 90; d += 10) {
        const hd = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 2), dashMat);
        hd.rotation.x = -Math.PI / 2;
        hd.position.set(i * 40, 0.015, d);
        scene.add(hd);

        const vd = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.2), dashMat);
        vd.rotation.x = -Math.PI / 2;
        vd.position.set(d, 0.015, i * 40);
        scene.add(vd);
      }
    }

    const colors = [0xff4444, 0x4488ff, 0x44cc66, 0xffcc00, 0xff88cc, 0xffffff];
    for (let i = 0; i < 12; i++) {
      const type = Math.random() < 0.3 ? 'bus' : 'car';
      const len = type === 'bus' ? 10 : 4;
      const w = type === 'bus' ? 2.5 : 1.8;
      const h = type === 'bus' ? 3 : 1.4;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h * 0.6, len),
        new THREE.MeshStandardMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          roughness: 0.5, metalness: 0.2
        })
      );
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.9, h * 0.4, len * 0.7),
        new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.3, metalness: 0.5, transparent: true, opacity: 0.7 })
      );
      top.position.y = h * 0.5;

      const car = new THREE.Group();
      car.add(body);
      car.add(top);
      body.position.y = h * 0.3;
      car.castShadow = true;

      const axis = Math.random() < 0.5 ? 'x' : 'z';
      const lane = (Math.floor(Math.random() * 5) - 2) * 40;
      const startOffset = (Math.random() - 0.5) * 80;
      car.position.set(axis === 'x' ? startOffset : lane, 0, axis === 'x' ? lane : startOffset);
      car.rotation.y = axis === 'x' ? 0 : Math.PI / 2;
      car.userData = { axis, basePos: axis === 'x' ? startOffset : lane, speed: 2 + Math.random() * 4 };
      car.userData.lane = lane;
      car.userData.baseOffset = startOffset;
      scene.add(car);

      this._decorCars = this._decorCars || [];
      this._decorCars.push(car);
    }
  }

  _bindEvents() {
    this._updateH = (data) => this._updateDecorCars(data.dt);
    this.eventBus.on('engine:update', this._updateH);
  }

  _unbindEvents() {
    super._unbindEvents();
    if (this._updateH) {
      this.eventBus.off('engine:update', this._updateH);
    }
  }

  _updateDecorCars(dt) {
    if (!this._decorCars) return;
    const limit = 90;
    this._decorCars.forEach((car) => {
      const { axis, lane, baseOffset, speed } = car.userData;
      car.userData.baseOffset += speed * dt;
      if (car.userData.baseOffset > limit) car.userData.baseOffset = -limit;
      if (axis === 'x') {
        car.position.x = car.userData.baseOffset;
        car.position.z = lane;
      } else {
        car.position.z = car.userData.baseOffset;
        car.position.x = lane;
      }
    });
  }

  async onExit() {
    super.onExit();
    if (this.renderEngine) {
      this.renderEngine.clear();
    }
    this._decorCars = null;
  }
}
