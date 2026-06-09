import * as THREE from 'three';
import { SceneManager, BaseScene } from './core/SceneManager.js';
import { InputManager } from './core/InputManager.js';
import { ResourceLoader } from './core/ResourceLoader.js';
import { AudioManager } from './core/AudioManager.js';
import { SaveManager } from './core/SaveManager.js';
import { EventBus } from './core/EventBus.js';
import { GameScene } from './game/GameScene.js';
import { UIManager } from './ui/UIManager.js';
import { LEVELS } from './data/levels.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { GAME_CONFIG } from './data/config.js';

class MenuScene extends BaseScene {
    constructor(game) {
        super();
        this.game = game;
        this.time = 0;
    }
    async init() {
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);
        this.threeScene.background = new THREE.Color(0x1a2332);
        this._buildDecorations();
    }
    _buildDecorations() {
        const ambient = new THREE.AmbientLight(0x404040, 0.8);
        this.threeScene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 1.2);
        dir.position.set(10, 20, 10);
        this.threeScene.add(dir);
        const colors = [0x3498db, 0xe74c3c, 0xf39c12, 0x2ecc71, 0x9b59b6, 0x1abc9c];
        this.buildings = [];
        for (let i = 0; i < 40; i++) {
            const w = 0.6 + Math.random() * 1.2;
            const d = 0.6 + Math.random() * 1.2;
            const h = 1 + Math.random() * 5;
            const geo = new THREE.BoxGeometry(w, h, d);
            const mat = new THREE.MeshStandardMaterial({
                color: colors[i % colors.length],
                emissive: colors[i % colors.length],
                emissiveIntensity: 0.15
            });
            const m = new THREE.Mesh(geo, mat);
            m.position.set(
                (Math.random() - 0.5) * 28,
                h / 2,
                (Math.random() - 0.5) * 10 - 5
            );
            m.userData = { baseY: h / 2, phase: Math.random() * 6.28, float: 0.05 + Math.random() * 0.1 };
            this.threeScene.add(m);
            this.buildings.push(m);
        }
        const groundGeo = new THREE.PlaneGeometry(40, 20);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.z = -3;
        this.threeScene.add(ground);
        const starsGeo = new THREE.BufferGeometry();
        const starPts = [];
        for (let i = 0; i < 200; i++) {
            starPts.push(
                (Math.random() - 0.5) * 80,
                Math.random() * 30 + 5,
                (Math.random() - 0.5) * 40 - 10
            );
        }
        starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPts, 3));
        const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
        this.stars = new THREE.Points(starsGeo, starsMat);
        this.threeScene.add(this.stars);
    }
    update(dt) {
        this.time += dt;
        for (const b of this.buildings) {
            b.position.y = b.userData.baseY + Math.sin(this.time * 1.5 + b.userData.phase) * b.userData.float;
            b.rotation.y = Math.sin(this.time * 0.3 + b.userData.phase) * 0.1;
        }
        if (this.stars) this.stars.rotation.y += dt * 0.005;
        this.camera.position.x = Math.sin(this.time * 0.1) * 2;
        this.camera.lookAt(0, 1, -5);
    }
    async onEnter() {
        this.game.ui.showMainMenu();
    }
    async onExit() {
        this.game.ui.hideAll();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.eventBus = new EventBus();
        this.save = new SaveManager();
        this.save.load();
        this.resources = new ResourceLoader();
        this.audio = new AudioManager();
        this.input = new InputManager(this.canvas);
        this.scenes = new SceneManager(this.canvas);
        this.LEVELS = LEVELS;
        this.ACHIEVEMENTS = ACHIEVEMENTS;
        this.eventConfig = GAME_CONFIG.EVENT_TYPES;
        this.eventIcons = {};
        for (const [k, v] of Object.entries(GAME_CONFIG.EVENT_TYPES)) {
            this.eventIcons[k] = v.icon;
        }
        const settings = this.save.getSettings();
        this.audio.setEnabled(settings.audioEnabled);
        this.audio.setMusicVolume(settings.musicVolume);
        this.audio.setSfxVolume(settings.sfxVolume);
        this.ui = new UIManager(this);
        this._registerScenes();
        this._startLoop();
        this._showInitial();
    }

    _registerScenes() {
        this.scenes.registerScene('menu', new MenuScene(this));
        this.scenes.registerScene('game', new GameScene(this));
    }

    async _showInitial() {
        await this.scenes.switchTo('menu');
    }

    _startLoop() {
        const loop = () => {
            this.scenes.update();
            this.input.endFrame();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.__GAME__ = new Game();
});
