import { eventBus } from './EventBus.js';
import { sceneManager, SCENES } from './SceneManager.js';
import { inputManager } from './InputManager.js';
import { saveSystem } from './SaveSystem.js';
import { resourceLoader } from './ResourceLoader.js';
import { audioManager } from './AudioManager.js';
import { RenderEngine } from './RenderEngine.js';

import { BootScene } from '../scenes/BootScene.js';
import { LoadingScene } from '../scenes/LoadingScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { LevelSelectScene } from '../scenes/LevelSelectScene.js';
import { TutorialScene } from '../scenes/TutorialScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { ResultScene } from '../scenes/ResultScene.js';
import { SandboxScene } from '../scenes/SandboxScene.js';

export class Game {
  constructor() {
    this.renderEngine = null;
    this.container = null;
    this.uiRoot = null;
    this.gameState = {
      isPaused: false,
      speed: 1,
      timeScale: 1,
      selectedIntersection: null
    };
  }

  async init() {
    this.container = document.getElementById('game-container');
    this.uiRoot = document.getElementById('ui-root');

    this.renderEngine = new RenderEngine(this.container);
    this.renderEngine.init();

    inputManager.init(document);
    audioManager.init();

    this._registerScenes();
    this._bindEvents();

    await sceneManager.changeTo(SCENES.BOOT);
  }

  _registerScenes() {
    const ctx = {
      renderEngine: this.renderEngine,
      uiRoot: this.uiRoot,
      gameState: this.gameState,
      audioManager,
      saveSystem,
      resourceLoader,
      sceneManager,
      eventBus
    };

    sceneManager.register(SCENES.BOOT, new BootScene(ctx));
    sceneManager.register(SCENES.LOADING, new LoadingScene(ctx));
    sceneManager.register(SCENES.MENU, new MenuScene(ctx));
    sceneManager.register(SCENES.LEVEL_SELECT, new LevelSelectScene(ctx));
    sceneManager.register(SCENES.TUTORIAL, new TutorialScene(ctx));
    sceneManager.register(SCENES.GAME, new GameScene(ctx));
    sceneManager.register(SCENES.RESULT, new ResultScene(ctx));
    sceneManager.register(SCENES.SANDBOX, new SandboxScene(ctx));
  }

  _bindEvents() {
    eventBus.on('input:action:pause', () => this.togglePause());
    eventBus.on('input:action:escape', () => this._onEscape());
    eventBus.on('input:speed', (s) => this.setSpeed(s));

    eventBus.on('game:pause', () => { this.gameState.isPaused = true; });
    eventBus.on('game:resume', () => { this.gameState.isPaused = false; });
    eventBus.on('game:speed', (s) => this.setSpeed(s));

    eventBus.on('game:requestQuit', () => this._quitToMenu());
    eventBus.on('audio:resume', () => audioManager.resume());
  }

  togglePause() {
    this.gameState.isPaused = !this.gameState.isPaused;
    eventBus.emit('game:pauseToggled', this.gameState.isPaused);
  }

  setSpeed(speed) {
    const validSpeeds = [1, 2, 3, 4, 5];
    if (validSpeeds.includes(speed)) {
      this.gameState.speed = speed;
      this.gameState.timeScale = speed;
      eventBus.emit('game:speedChanged', speed);
    }
  }

  _onEscape() {
    const current = sceneManager.getCurrent();
    if (current === SCENES.GAME || current === SCENES.SANDBOX) {
      eventBus.emit('game:escapePressed');
    } else if (current === SCENES.TUTORIAL || current === SCENES.LEVEL_SELECT) {
      sceneManager.changeTo(SCENES.MENU);
    }
  }

  _quitToMenu() {
    this.gameState.isPaused = false;
    this.gameState.speed = 1;
    this.gameState.timeScale = 1;
    sceneManager.changeTo(SCENES.MENU);
  }

  destroy() {
    inputManager.destroy();
    this.renderEngine.destroy();
  }
}
