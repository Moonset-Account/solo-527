import { BaseScene } from './BaseScene.js';

export class LoadingScene extends BaseScene {
  _setupUI() {
    this.container = this._createElement('div', 'loading-screen');
    const spinner = this._createElement('div', 'loading-spinner');
    this.text = this._createElement('div', 'loading-text', '正在初始化系统...');
    const barWrap = this._createElement('div', 'loading-bar');
    this.bar = this._createElement('div', 'loading-bar-fill');
    barWrap.appendChild(this.bar);

    this.container.appendChild(spinner);
    this.container.appendChild(this.text);
    this.container.appendChild(barWrap);
    this._mountUI(this.container);
  }

  _bindEvents() {
    this.eventUnsubs.push(
      this.eventBus.on('loading:progress', ({ progress, current }) => {
        this.bar.style.width = `${progress}%`;
        this.bar.style.animation = 'none';
        if (current) {
          this.text.textContent = `正在加载：${current}`;
        }
      })
    );
    this.eventUnsubs.push(
      this.eventBus.on('loading:complete', () => {
        setTimeout(() => {
          const next = this.params?.nextScene || 'menu';
          this.sceneManager.changeTo(next, this.params?.nextParams || {});
        }, 400);
      })
    );
    this.resourceLoader.loadAll(this.params?.resources || []);
  }
}
