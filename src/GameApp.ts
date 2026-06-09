import { EventBus } from './core/EventBus';
import { SceneManager } from './core/SceneManager';
import { InputManager } from './core/InputManager';
import { SaveSystem } from './core/SaveSystem';
import { Telemetry } from './core/Telemetry';
import { AssetLoader } from './core/AssetLoader';
import { Timer } from './core/Timer';
import { createLogger } from './utils/logger';

import { LoadingScene } from './scenes/LoadingScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { AchievementScene } from './scenes/AchievementScene';
import { SettingsScene } from './scenes/SettingsScene';

export interface AppConfig {
  canvasId: string;
  uiRootId: string;
}

export class GameApp {
  readonly eventBus: EventBus;
  readonly sceneManager: SceneManager;
  readonly inputManager: InputManager;
  readonly saveSystem: SaveSystem;
  readonly telemetry: Telemetry;
  readonly assetLoader: AssetLoader;
  readonly gameTimer: Timer;

  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly uiRoot: HTMLElement;
  private readonly logger = createLogger('GameApp');

  private lastTime = 0;
  private rafId = 0;
  private running = false;

  constructor(config: AppConfig) {
    const canvas = document.getElementById(config.canvasId) as HTMLCanvasElement | null;
    const uiRoot = document.getElementById(config.uiRootId);

    if (!canvas) {
      throw new Error(`Canvas element with id "${config.canvasId}" not found`);
    }
    if (!uiRoot) {
      throw new Error(`UI root element with id "${config.uiRootId}" not found`);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.uiRoot = uiRoot;

    this.eventBus = new EventBus();
    this.sceneManager = new SceneManager();
    this.inputManager = new InputManager(canvas);
    this.saveSystem = new SaveSystem();
    this.telemetry = new Telemetry({ persistence: this.saveSystem });
    this.assetLoader = new AssetLoader();
    this.gameTimer = new Timer();

    this.resize();
    this.registerScenes();
    this.setupWindowHandlers();
  }

  private registerScenes(): void {
    const loadingScene = new LoadingScene(this.eventBus, this.sceneManager, this.assetLoader);
    const mainMenuScene = new MainMenuScene(this.eventBus, this.sceneManager, this.saveSystem, this.telemetry, this.uiRoot);
    const levelSelectScene = new LevelSelectScene(this.eventBus, this.sceneManager, this.saveSystem, this.telemetry, this.uiRoot);
    levelSelectScene.setInputManager(this.inputManager);
    const gameScene = new GameScene(this.eventBus, this.sceneManager, this.saveSystem, this.telemetry);
    gameScene.setUIRoot(this.uiRoot);
    gameScene.setInputManager(this.inputManager);
    const resultScene = new ResultScene(this.eventBus, this.sceneManager, this.saveSystem, this.telemetry, this.uiRoot);
    const achievementScene = new AchievementScene(this.eventBus, this.sceneManager, this.saveSystem, this.uiRoot);
    const settingsScene = new SettingsScene(this.eventBus, this.sceneManager, this.saveSystem, this.uiRoot);

    this.sceneManager.register(loadingScene);
    this.sceneManager.register(mainMenuScene);
    this.sceneManager.register(levelSelectScene);
    this.sceneManager.register(gameScene);
    this.sceneManager.register(resultScene);
    this.sceneManager.register(achievementScene);
    this.sceneManager.register(settingsScene);

    this.sceneManager.onSceneChanged((info) => {
      this.logger.info(`Scene changed: ${info.fromId ?? '(none)'} -> ${info.toId} [${info.action}]`);
    });
  }

  private setupWindowHandlers(): void {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const currentScene = this.sceneManager.currentScene;
      if (currentScene && typeof (currentScene as any).handleWheel === 'function') {
        (currentScene as any).handleWheel(e);
      }
    }, { passive: false });

    let lastTouchDist = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    });
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = this.canvas.getBoundingClientRect();
        const delta = lastTouchDist > 0 ? dist / lastTouchDist : 1;
        const currentScene = this.sceneManager.currentScene;
        if (currentScene && typeof (currentScene as any).handlePinch === 'function') {
          (currentScene as any).handlePinch(delta, cx - rect.left, cy - rect.top);
        }
        lastTouchDist = dist;
      }
    }, { passive: false });
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.sceneManager.resize(w, h);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();

    this.inputManager.attach();
    this.gameTimer.start();

    this.logger.info('GameApp starting...');
    this.showDisclaimer();
    this.sceneManager.push('loading');

    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.inputManager.detach();
    this.gameTimer.stop();
    this.logger.info('GameApp stopped');
  }

  private showDisclaimer(): void {
    const existing = document.getElementById('disclaimer-toast');
    if (existing) return;

    const toast = document.createElement('div');
    toast.id = 'disclaimer-toast';
    toast.style.cssText = `
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      max-width: 520px; width: calc(100% - 32px);
      padding: 12px 16px; border-radius: 10px; z-index: 9999;
      background: rgba(251, 191, 36, 0.12);
      border: 1px solid rgba(251, 191, 36, 0.35);
      color: #fde68a; font-size: 13px; line-height: 1.55;
      font-family: 'JetBrains Mono', monospace;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex; align-items: flex-start; gap: 10px;
    `;
    toast.innerHTML = `
      <span style="font-size:18px;flex-shrink:0;">⚠️</span>
      <div style="flex:1;">
        <strong style="color:#fbbf24;">教学近似声明</strong><br/>
        本软件为教育演示用途，电路仿真为简化模型，结果仅供学习参考，不代表真实电路特性。
      </div>
      <button id="disclaimer-close" style="background:none;border:none;color:#fcd34d;cursor:pointer;font-size:16px;padding:2px 6px;opacity:0.8;">✕</button>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s, transform 0.4s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => toast.remove(), 500);
    }, 8000);

    toast.querySelector('#disclaimer-close')?.addEventListener('click', () => toast.remove());
  }

  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (dt > 0.1) dt = 0.1;

    this.inputManager.update(dt);
    this.sceneManager.update(dt);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.sceneManager.render(this.ctx);

    this.rafId = requestAnimationFrame(this.loop);
  };

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getUIRoot(): HTMLElement {
    return this.uiRoot;
  }

  isRunning(): boolean {
    return this.running;
  }
}
