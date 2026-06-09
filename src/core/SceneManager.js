import * as THREE from 'three';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scenes = new Map();
        this.currentScene = null;
        this.transitioning = false;
        this._initRenderer();
        this._initClock();
    }

    _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        window.addEventListener('resize', () => this._onResize());
    }

    _initClock() {
        this.clock = new THREE.Clock();
    }

    _onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        if (this.currentScene && this.currentScene.camera) {
            this.currentScene.camera.aspect = width / height;
            this.currentScene.camera.updateProjectionMatrix();
        }
    }

    registerScene(name, scene) {
        this.scenes.set(name, scene);
        scene.manager = this;
    }

    async switchTo(name, data = {}) {
        if (this.transitioning) return;
        this.transitioning = true;

        if (this.currentScene) {
            await this.currentScene.onExit();
        }

        const nextScene = this.scenes.get(name);
        if (!nextScene) {
            console.error(`Scene "${name}" not found`);
            this.transitioning = false;
            return;
        }

        if (!nextScene.initialized) {
            await nextScene.init(data);
            nextScene.initialized = true;
        }

        await nextScene.onEnter(data);
        this.currentScene = nextScene;
        this.currentName = name;
        this.transitioning = false;
    }

    update() {
        const dt = this.clock.getDelta();
        if (this.currentScene) {
            this.currentScene.update(dt);
            if (this.currentScene.threeScene && this.currentScene.camera) {
                this.renderer.render(this.currentScene.threeScene, this.currentScene.camera);
            }
        }
    }

    getCurrentScene() {
        return this.currentScene;
    }
}

export class BaseScene {
    constructor() {
        this.manager = null;
        this.initialized = false;
        this.threeScene = new THREE.Scene();
        this.camera = null;
        this.objects = [];
        this.updateables = [];
    }

    async init(data = {}) {}
    async onEnter(data = {}) {}
    async onExit() {}

    update(dt) {
        for (const obj of this.updateables) {
            if (obj.update) obj.update(dt);
        }
    }

    addObject(obj) {
        this.objects.push(obj);
        this.threeScene.add(obj);
    }

    removeObject(obj) {
        const idx = this.objects.indexOf(obj);
        if (idx >= 0) {
            this.objects.splice(idx, 1);
            this.threeScene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        }
    }

    clearAll() {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            this.removeObject(this.objects[i]);
        }
        this.updateables = [];
    }
}
