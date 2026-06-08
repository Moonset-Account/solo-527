import { eventBus } from './EventBus.js';

export class ResourceLoader {
  constructor() {
    this.progress = 0;
    this.totalResources = 0;
    this.loadedResources = 0;
    this.resources = new Map();
  }

  async loadAll(resources = []) {
    this.totalResources = resources.length;
    this.loadedResources = 0;
    this.progress = 0;

    eventBus.emit('loading:start', { total: this.totalResources });

    if (resources.length === 0) {
      await this.simulateDefaultLoading();
      eventBus.emit('loading:complete', this.resources);
      return this.resources;
    }

    const loadPromises = resources.map((res) => this.loadResource(res));
    await Promise.all(loadPromises);

    eventBus.emit('loading:complete', this.resources);
    return this.resources;
  }

  async simulateDefaultLoading() {
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      await this.wait(80);
      this.loadedResources = i + 1;
      this.totalResources = steps;
      this.progress = (this.loadedResources / this.totalResources) * 100;
      eventBus.emit('loading:progress', {
        progress: this.progress,
        loaded: this.loadedResources,
        total: this.totalResources,
        current: ['初始化引擎', '构建场景', '生成路网', '加载车辆模型', '准备信号灯', '加载公交线路', '校准物理', '生成纹理', '连接UI系统', '准备音效', '加载存档', '完成配置'][i]
      });
    }
  }

  async loadResource({ type, url, id }) {
    try {
      let result;
      switch (type) {
        case 'texture':
          result = await this.loadTexture(url);
          break;
        case 'model':
          result = await this.loadModel(url);
          break;
        case 'audio':
          result = await this.loadAudio(url);
          break;
        case 'json':
          result = await this.loadJSON(url);
          break;
        default:
          result = { url };
      }
      this.resources.set(id, result);
    } catch (err) {
      console.warn(`[ResourceLoader] 资源加载失败 (${id}):`, err);
      this.resources.set(id, { failed: true, error: err });
    }

    this.loadedResources++;
    this.progress = (this.loadedResources / this.totalResources) * 100;
    eventBus.emit('loading:progress', {
      progress: this.progress,
      loaded: this.loadedResources,
      total: this.totalResources,
      current: id
    });
  }

  get(id) {
    return this.resources.get(id);
  }

  has(id) {
    return this.resources.has(id);
  }

  async loadTexture(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async loadJSON(url) {
    const response = await fetch(url);
    return response.json();
  }

  async loadModel(url) {
    return { url, loaded: true };
  }

  async loadAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = reject;
      audio.src = url;
    });
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const resourceLoader = new ResourceLoader();
