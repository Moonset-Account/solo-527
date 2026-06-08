import { eventBus } from './EventBus.js';

export const SCENES = {
  BOOT: 'boot',
  LOADING: 'loading',
  MENU: 'menu',
  LEVEL_SELECT: 'level_select',
  TUTORIAL: 'tutorial',
  GAME: 'game',
  RESULT: 'result',
  SANDBOX: 'sandbox'
};

export class SceneManager {
  constructor() {
    this.currentScene = null;
    this.scenes = new Map();
    this.history = [];
  }

  register(name, scene) {
    this.scenes.set(name, scene);
  }

  async changeTo(name, params = {}) {
    if (this.currentScene) {
      const current = this.scenes.get(this.currentScene);
      if (current && current.onExit) {
        try { await current.onExit(); } catch (e) { console.error(e); }
      }
    }
    this.history.push({ scene: this.currentScene, params });
    if (this.history.length > 20) this.history.shift();
    const next = this.scenes.get(name);
    if (!next) {
      console.error(`[SceneManager] 场景不存在: ${name}`);
      return;
    }
    this.currentScene = name;
    eventBus.emit('scene:changing', { from: this.history[this.history.length - 1]?.scene, to: name });
    if (next.onEnter) {
      try { await next.onEnter(params); } catch (e) { console.error(e); }
    }
    eventBus.emit('scene:changed', { scene: name, params });
  }

  goBack(params = {}) {
    if (this.history.length < 2) return;
    const prev = this.history[this.history.length - 2];
    this.history.pop();
    this.changeTo(prev.scene, { ...prev.params, ...params });
  }

  getCurrent() {
    return this.currentScene;
  }

  getScene(name) {
    return this.scenes.get(name);
  }
}

export const sceneManager = new SceneManager();
