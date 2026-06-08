export class BaseScene {
  constructor(ctx) {
    this.ctx = ctx;
    this.renderEngine = ctx.renderEngine;
    this.uiRoot = ctx.uiRoot;
    this.audioManager = ctx.audioManager;
    this.saveSystem = ctx.saveSystem;
    this.resourceLoader = ctx.resourceLoader;
    this.sceneManager = ctx.sceneManager;
    this.eventBus = ctx.eventBus;
    this.gameState = ctx.gameState;
    this.uiElements = [];
    this.updateHandlers = [];
    this.eventUnsubs = [];
  }

  async onEnter(params = {}) {
    this.params = params;
    this._clearUI();
    this._setupUI(params);
    this._bindEvents();
    this._bindEngineUpdate();
  }

  async onExit() {
    this._unbindEvents();
    this._unbindEngineUpdate();
    this._clearUI();
  }

  _setupUI() {}

  _bindEvents() {}

  _unbindEvents() {
    this.eventUnsubs.forEach((fn) => fn());
    this.eventUnsubs = [];
  }

  _bindEngineUpdate() {
    if (this._updateHandler) return;
    this._updateHandler = (data) => this._onUpdate(data);
    this.eventBus.on('engine:update', this._updateHandler);
  }

  _unbindEngineUpdate() {
    if (this._updateHandler) {
      this.eventBus.off('engine:update', this._updateHandler);
      this._updateHandler = null;
    }
  }

  _onUpdate({ dt }) {}

  _mountUI(container) {
    if (this.uiRoot && container) {
      this.uiRoot.appendChild(container);
      this.uiElements.push(container);
    }
  }

  _clearUI() {
    this.uiElements.forEach((el) => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    this.uiElements = [];
  }

  _createElement(tag, className = '', innerHTML = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  }

  _h(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') el.className = v;
      else if (k === 'textContent') el.textContent = v;
      else if (k === 'innerHTML') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === 'dataset') {
        Object.entries(v).forEach(([dk, dv]) => { el.dataset[dk] = dv; });
      } else if (k === 'style' && typeof v === 'object') {
        Object.entries(v).forEach(([sk, sv]) => { el.style[sk] = sv; });
      } else {
        el.setAttribute(k, v);
      }
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      if (typeof c === 'string' || typeof c === 'number') {
        el.appendChild(document.createTextNode(c));
      } else if (c instanceof Node) {
        el.appendChild(c);
      }
    });
    return el;
  }

  _showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || (() => {
      const c = this._createElement('div', 'toast-container');
      c.id = 'toast-container';
      this._mountUI(c);
      return c;
    })();

    const toast = this._createElement('div', `toast ${type}`, message);
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }
}
