import { globalEventBus, EVENTS } from './EventBus.js';

export class ToastManager {
  constructor(container) {
    this.container = container;
    this.defaultDuration = 2500;
    globalEventBus.on(EVENTS.UI_TOAST, (data) => this.show(data));
  }

  show(data) {
    const msg = typeof data === 'string' ? { message: data } : data;
    const toast = document.createElement('div');
    toast.className = `toast ${msg.type || 'info'}`;
    toast.textContent = msg.message;
    const duration = msg.duration || this.defaultDuration;
    if (msg.position === 'top' || !msg.position) {
      this.container.appendChild(toast);
    }
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 320);
    }, duration);
  }
}

export class DebugPanel {
  constructor(panelEl) {
    this.panel = panelEl;
    this.closeBtn = panelEl?.querySelector('#debug-close');
    this.content = panelEl?.querySelector('.debug-content');
    this.visible = false;
    this.sections = {};
    this._updates = [];
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.toggle(false));
    }
    globalEventBus.on(EVENTS.UI_DEBUG_TOGGLE, (v) => this.toggle(v));
  }

  toggle(v) {
    this.visible = v === undefined ? !this.visible : !!v;
    this.panel?.classList.toggle('hidden', !this.visible);
  }

  registerSection(id, title) {
    const wrap = document.createElement('div');
    wrap.className = 'debug-section';
    const titleEl = document.createElement('div');
    titleEl.className = 'debug-section-title';
    titleEl.textContent = title;
    wrap.appendChild(titleEl);
    const body = document.createElement('div');
    wrap.appendChild(body);
    this.sections[id] = { wrap, body };
    this.content?.appendChild(wrap);
    return body;
  }

  addRow(section, label, getValue) {
    const sec = this.sections[section];
    if (!sec) return;
    const row = document.createElement('div');
    row.className = 'debug-row';
    const l = document.createElement('span');
    l.textContent = label;
    const v = document.createElement('span');
    row.appendChild(l); row.appendChild(v);
    sec.body.appendChild(row);
    this._updates.push(() => {
      const val = getValue();
      if (v.textContent !== val) v.textContent = val;
    });
  }

  tick() {
    if (!this.visible) return;
    for (const u of this._updates) u();
  }
}
