import * as THREE from 'three';
import { eventBus } from './EventBus.js';

export class RenderEngine {
  constructor(container) {
    this.container = container;
    this.width = 0;
    this.height = 0;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    this.isRunning = false;
    this.cameraAngle = 0;
    this.cameraHeight = 60;
    this.cameraDistance = 80;
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this._onResize = this._onResize.bind(this);
  }

  init() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2238);
    this.scene.fog = new THREE.Fog(0x1a2238, 150, 300);

    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 1000);
    this._updateCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this._setupLights();
    this._setupEvents();
    eventBus.on('input:wheel', (e) => this._onWheel(e));
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e6, 1.0);
    sun.position.set(50, 80, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 250;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x7eb8ff, 0.3);
    fill.position.set(-40, 30, -30);
    this.scene.add(fill);

    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3d5443, 0.3);
    this.scene.add(hemi);
  }

  _setupEvents() {
    window.addEventListener('resize', this._onResize);
    eventBus.on('input:resize', () => this._onResize());
  }

  _onResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  _onWheel({ delta }) {
    this.cameraDistance = Math.max(40, Math.min(140, this.cameraDistance + delta * 0.08));
    this._updateCamera();
  }

  _updateCamera() {
    if (!this.camera) return;
    const rad = this.cameraAngle * Math.PI / 180;
    this.camera.position.x = this.cameraTarget.x + Math.sin(rad) * this.cameraDistance;
    this.camera.position.z = this.cameraTarget.z + Math.cos(rad) * this.cameraDistance;
    this.camera.position.y = this.cameraHeight;
    this.camera.lookAt(this.cameraTarget);
  }

  rotateCamera(deltaAngle) {
    this.cameraAngle = (this.cameraAngle + deltaAngle) % 360;
    this._updateCamera();
  }

  setCameraTarget(x, z) {
    this.cameraTarget.set(x, 0, z);
    this._updateCamera();
  }

  start() {
    this.isRunning = true;
    this.renderer.setAnimationLoop(() => this._loop());
  }

  stop() {
    this.isRunning = false;
    this.renderer.setAnimationLoop(null);
  }

  _loop() {
    if (!this.isRunning) return;
    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    eventBus.emit('engine:update', { dt, elapsed });
    this.renderer.render(this.scene, this.camera);
    eventBus.emit('engine:render', { dt, elapsed });
  }

  getAspect() {
    return this.width / this.height;
  }

  clear() {
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0];
      this.scene.remove(obj);
      this._disposeObject(obj);
    }
    this._setupLights();
  }

  _disposeObject(obj) {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    if (obj.children) {
      obj.children.forEach((c) => this._disposeObject(c));
    }
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    this.stop();
    this.clear();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
