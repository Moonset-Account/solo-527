import '../styles/global.css';

export interface Objective {
  id: string;
  text: string;
  completed: boolean;
}

export interface ComponentLibraryItem {
  type: string;
  name: string;
  icon: string;
  category: string;
  color: string;
}

export interface GameHUDCallbacks {
  onStartSim: () => void;
  onStopSim: () => void;
  onReset: () => void;
  onUndo: () => void;
  onSave: () => void;
  onBack: () => void;
  onSelectComponent: (type: string) => void;
  onDeleteWireMode: (enabled: boolean) => void;
}

const DEFAULT_LIBRARY: ComponentLibraryItem[] = [
  { type: 'battery', name: '电池', icon: '🔋', category: '电源', color: '#10B981' },
  { type: 'resistor', name: '电阻', icon: '〰', category: '基础', color: '#F59E0B' },
  { type: 'capacitor', name: '电容', icon: '‖', category: '基础', color: '#A855F7' },
  { type: 'switch', name: '开关', icon: '◐', category: '控制', color: '#06B6D4' },
  { type: 'bulb', name: '灯泡', icon: '💡', category: '负载', color: '#FBBF24' },
  { type: 'wire_joint', name: '接线柱', icon: '●', category: '基础', color: '#06B6D4' },
];

export class GameHUD {
  readonly element: HTMLElement;
  private callbacks: GameHUDCallbacks;
  private objectives: Objective[] = [];
  private library: ComponentLibraryItem[];
  private simRunning: boolean = false;
  private mistakes: number = 0;
  private elapsed: number = 0;
  private deleteWireMode: boolean = false;
  private drawerOpen: boolean = true;

  constructor(container: HTMLElement, callbacks: GameHUDCallbacks, library?: ComponentLibraryItem[]) {
    this.callbacks = callbacks;
    this.library = library ?? DEFAULT_LIBRARY;

    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: var(--hud-z);
    `;

    this.build();
    if (container !== this.element.parentElement) {
      container.appendChild(this.element);
    }
  }

  private build(): void {
    this.buildTopLeft();
    this.buildTopRight();
    this.buildBottomLeft();
    this.buildBottomRight();
    this.buildCenterTip();
  }

  private buildTopLeft(): void {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      pointer-events: auto;
      max-width: 320px;
    `;

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.style.cssText = 'padding:16px 18px;min-width:260px;';

    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;">🎯</span>
          <span style="font-family:var(--font-display);font-size:14px;font-weight:700;letter-spacing:0.05em;">任务目标</span>
        </div>
        <span class="badge badge-info obj-badge" style="font-size:10.5px;">0/0</span>
      </div>
      <div class="obj-list" style="display:flex;flex-direction:column;gap:6px;max-height:36vh;overflow-y:auto;"></div>
    `;

    wrap.appendChild(panel);
    this.element.appendChild(wrap);
    this.objectivesPanel = wrap;
  }

  private objectivesPanel!: HTMLElement;

  private buildTopRight(): void {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
    `;

    const timerCard = document.createElement('div');
    timerCard.className = 'panel';
    timerCard.style.cssText = 'padding:12px 18px;display:flex;align-items:center;gap:18px;';
    timerCard.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="font-size:10px;color:#64748B;font-weight:600;letter-spacing:0.08em;">用时</div>
        <div class="timer-value" style="font-family:var(--font-body);font-size:22px;font-weight:700;color:var(--accent-cyan);letter-spacing:0.05em;">00:00</div>
      </div>
      <div style="width:1px;height:36px;background:var(--border-medium);"></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="font-size:10px;color:#64748B;font-weight:600;letter-spacing:0.08em;">失误</div>
        <div class="mistake-value" style="font-family:var(--font-body);font-size:22px;font-weight:700;color:var(--text-muted);letter-spacing:0.05em;">0</div>
      </div>
    `;
    wrap.appendChild(timerCard);

    const simBadge = document.createElement('div');
    simBadge.className = 'sim-badge badge badge-dim';
    simBadge.style.cssText = 'font-size:11px;padding:4px 12px;';
    simBadge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#64748B;margin-right:6px;display:inline-block;"></span>仿真已停止`;
    wrap.appendChild(simBadge);

    this.element.appendChild(wrap);
    this.topRightWrap = wrap;
  }

  private topRightWrap!: HTMLElement;

  private buildBottomLeft(): void {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      pointer-events: auto;
      display: flex;
      align-items: flex-end;
      gap: 10px;
    `;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-secondary btn-icon drawer-toggle';
    toggleBtn.title = '折叠/展开元件库';
    toggleBtn.innerHTML = `<span style="font-size:18px;">≡</span>`;
    wrap.appendChild(toggleBtn);

    const panel = document.createElement('div');
    panel.className = 'panel library-drawer';
    panel.style.cssText = `
      padding: 14px 16px;
      width: 290px;
      max-height: 60vh;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: bottom left;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:16px;">🧰</span>
        <span style="font-family:var(--font-display);font-size:14px;font-weight:700;letter-spacing:0.05em;">元件库</span>
      </div>
    `;
    panel.appendChild(header);

    const categories = [...new Set(this.library.map((l) => l.category))];
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
    categories.forEach((cat, ci) => {
      const t = document.createElement('button');
      t.className = 'lib-cat-tab';
      t.dataset.cat = cat;
      t.style.cssText = `
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        color: ${ci === 0 ? '#67E8F9' : '#94A3B8'};
        background: ${ci === 0 ? 'rgba(6, 182, 212, 0.15)' : 'transparent'};
        border: 1px solid ${ci === 0 ? 'rgba(6, 182, 212, 0.35)' : 'transparent'};
        transition: all 150ms;
      `;
      t.textContent = cat;
      t.addEventListener('click', () => {
        (tabs.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).forEach((b) => {
          const active = b.dataset.cat === cat;
          b.style.color = active ? '#67E8F9' : '#94A3B8';
          b.style.background = active ? 'rgba(6, 182, 212, 0.15)' : 'transparent';
          b.style.borderColor = active ? 'rgba(6, 182, 212, 0.35)' : 'transparent';
        });
        this.filterLibrary(cat);
      });
      tabs.appendChild(t);
    });
    panel.appendChild(tabs);

    const grid = document.createElement('div');
    grid.className = 'lib-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      overflow-y: auto;
      max-height: 40vh;
      padding: 4px 2px 4px 0;
    `;
    this.renderLibraryGrid(grid, categories[0]);
    panel.appendChild(grid);

    const tip = document.createElement('div');
    tip.style.cssText = 'font-size:11px;color:#64748B;text-align:center;padding-top:4px;border-top:1px solid var(--border-light);';
    tip.innerHTML = '💡 点击元件 → 在画布上放置';
    panel.appendChild(tip);

    wrap.appendChild(panel);
    this.element.appendChild(wrap);

    toggleBtn.addEventListener('click', () => {
      this.drawerOpen = !this.drawerOpen;
      panel.style.display = this.drawerOpen ? 'flex' : 'none';
      if (this.drawerOpen) {
        panel.style.opacity = '0';
        panel.style.transform = 'scale(0.95) translateX(-10px)';
        requestAnimationFrame(() => {
          panel.style.opacity = '1';
          panel.style.transform = 'scale(1) translateX(0)';
        });
      }
    });

    this.drawerPanel = panel;
    this.drawerGrid = grid;
  }

  private drawerPanel!: HTMLElement;
  private drawerGrid!: HTMLElement;

  private renderLibraryGrid(grid: HTMLElement, category: string): void {
    grid.innerHTML = '';
    const items = this.library.filter((l) => l.category === category);
    items.forEach((item) => {
      const b = document.createElement('button');
      b.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 14px 8px;
        border-radius: 12px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        cursor: grab;
        transition: all 200ms;
        min-width: 0;
      `;
      b.innerHTML = `
        <div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;background:${item.color}22;border:1px solid ${item.color}44;">${item.icon}</div>
        <div style="font-size:11.5px;font-weight:600;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${item.name}</div>
      `;
      b.addEventListener('mouseenter', () => {
        b.style.transform = 'translateY(-2px)';
        b.style.borderColor = item.color;
        b.style.boxShadow = `0 6px 20px ${item.color}22`;
      });
      b.addEventListener('mouseleave', () => {
        b.style.transform = '';
        b.style.borderColor = 'var(--border-light)';
        b.style.boxShadow = 'none';
      });
      b.addEventListener('click', () => this.callbacks.onSelectComponent(item.type));
      grid.appendChild(b);
    });
  }

  private filterLibrary(category: string): void {
    this.renderLibraryGrid(this.drawerGrid, category);
  }

  private buildBottomRight(): void {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
    `;

    const actions = document.createElement('div');
    actions.className = 'panel';
    actions.style.cssText = `
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    const buttons = [
      { id: 'sim', label: '开始仿真', icon: '▶', class: 'btn-success' },
      { id: 'delwire', label: '删除导线', icon: '✂', class: 'btn-secondary' },
      { id: 'reset', label: '重置', icon: '↺', class: 'btn-secondary' },
      { id: 'undo', label: '撤销', icon: '↶', class: 'btn-secondary' },
      { id: 'save', label: '保存', icon: '💾', class: 'btn-secondary' },
      { id: 'back', label: '返回', icon: '⏻', class: 'btn-danger' },
    ];
    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.className = `btn btn-icon ${b.class}`;
      btn.dataset.action = b.id;
      btn.title = b.label;
      btn.innerHTML = `<span style="font-size:16px;">${b.icon}</span>`;
      btn.addEventListener('click', () => this.handleAction(b.id));
      actions.appendChild(btn);
    });
    wrap.appendChild(actions);

    const labels = document.createElement('div');
    labels.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      flex-wrap: wrap;
      max-width: 420px;
    `;
    buttons.forEach((b) => {
      const chip = document.createElement('div');
      chip.className = 'badge badge-dim';
      chip.style.cssText = 'font-size:10.5px;opacity:0.8;';
      chip.textContent = `${b.icon} ${b.label}`;
      labels.appendChild(chip);
    });
    wrap.appendChild(labels);

    this.element.appendChild(wrap);
    this.actionsWrap = wrap;
  }

  private actionsWrap!: HTMLElement;

  private buildCenterTip(): void {
    const el = document.createElement('div');
    el.className = 'center-toast';
    el.style.cssText = `
      position: absolute;
      left: 50%;
      bottom: 50%;
      transform: translateX(-50%) translateY(120px);
      pointer-events: none;
      opacity: 0;
      transition: all 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    this.element.appendChild(el);
    this.centerToast = el;
  }

  private centerToast!: HTMLElement;

  private handleAction(id: string): void {
    switch (id) {
      case 'sim':
        this.toggleSim();
        break;
      case 'delwire':
        this.toggleDeleteWire();
        break;
      case 'reset':
        this.callbacks.onReset();
        break;
      case 'undo':
        this.callbacks.onUndo();
        break;
      case 'save':
        this.callbacks.onSave();
        break;
      case 'back':
        this.callbacks.onBack();
        break;
    }
  }

  private toggleSim(): void {
    this.simRunning = !this.simRunning;
    const btn = this.actionsWrap.querySelector('[data-action="sim"]') as HTMLButtonElement;
    const badge = this.topRightWrap.querySelector('.sim-badge') as HTMLElement;
    if (this.simRunning) {
      btn.classList.remove('btn-success');
      btn.classList.add('btn-danger');
      btn.innerHTML = `<span style="font-size:16px;">■</span>`;
      btn.title = '停止仿真';
      badge.classList.remove('badge-dim');
      badge.classList.add('badge-success');
      badge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#34D399;margin-right:6px;display:inline-block;box-shadow:0 0 10px #34D399;animation:pulse-dot 1.2s infinite;"></span>仿真运行中`;
      this.callbacks.onStartSim();
    } else {
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-success');
      btn.innerHTML = `<span style="font-size:16px;">▶</span>`;
      btn.title = '开始仿真';
      badge.classList.remove('badge-success');
      badge.classList.add('badge-dim');
      badge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#64748B;margin-right:6px;display:inline-block;"></span>仿真已停止`;
      this.callbacks.onStopSim();
    }
  }

  private toggleDeleteWire(): void {
    this.deleteWireMode = !this.deleteWireMode;
    const btn = this.actionsWrap.querySelector('[data-action="delwire"]') as HTMLButtonElement;
    if (this.deleteWireMode) {
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-warning');
      btn.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.25)';
      this.showCenterTip('✂️ 删除导线模式：点击导线删除', 'warn');
    } else {
      btn.classList.remove('btn-warning');
      btn.classList.add('btn-secondary');
      btn.style.boxShadow = '';
      this.hideCenterTip();
    }
    this.callbacks.onDeleteWireMode(this.deleteWireMode);
  }

  setObjectives(objectives: Objective[]): void {
    this.objectives = objectives;
    const list = this.objectivesPanel.querySelector('.obj-list') as HTMLElement;
    const badge = this.objectivesPanel.querySelector('.obj-badge') as HTMLElement;
    const done = objectives.filter((o) => o.completed).length;
    if (badge) badge.textContent = `${done}/${objectives.length}`;
    list.innerHTML = '';
    objectives.forEach((o) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 7px 10px;
        border-radius: 8px;
        background: ${o.completed ? 'rgba(16, 185, 129, 0.08)' : 'transparent'};
        transition: all 250ms;
      `;
      const check = document.createElement('div');
      check.style.cssText = `
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        background: ${o.completed ? 'linear-gradient(135deg, #10B981, #059669)' : 'var(--bg-tertiary)'};
        color: ${o.completed ? '#fff' : 'transparent'};
        border: 1.5px solid ${o.completed ? 'transparent' : 'var(--border-strong)'};
        box-shadow: ${o.completed ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none'};
      `;
      check.textContent = '✓';
      row.appendChild(check);

      const text = document.createElement('div');
      text.style.cssText = `
        font-size: 12.5px;
        color: ${o.completed ? 'var(--text-muted)' : 'var(--text-secondary)'};
        line-height: 1.45;
        text-decoration: ${o.completed ? 'line-through' : 'none'};
        opacity: ${o.completed ? '0.75' : '1'};
      `;
      text.textContent = o.text;
      row.appendChild(text);
      list.appendChild(row);
    });
    if (done === objectives.length && objectives.length > 0) {
      list.style.pointerEvents = 'none';
      setTimeout(() => this.showCenterTip('🎉 所有目标完成！', 'success'), 300);
    }
  }

  setElapsed(seconds: number): void {
    this.elapsed = seconds;
    const el = this.topRightWrap.querySelector('.timer-value') as HTMLElement;
    if (!el) return;
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    el.textContent = `${m}:${s}`;
  }

  setMistakes(n: number): void {
    this.mistakes = n;
    const el = this.topRightWrap.querySelector('.mistake-value') as HTMLElement;
    if (!el) return;
    el.textContent = `${n}`;
    el.style.color = n > 0 ? 'var(--accent-red)' : 'var(--text-muted)';
    const card = this.topRightWrap.querySelector('.panel') as HTMLElement;
    if (n > 0) {
      card.classList.add('pulse-red');
    } else {
      card.classList.remove('pulse-red');
    }
    if (n > 0) {
      this.showCenterTip(`⚠️ 失误数：${n}`, 'warn');
    }
  }

  showCenterTip(msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info', duration = 2200): void {
    const colorMap = {
      info: { bg: 'rgba(6, 182, 212, 0.92)', border: '#67E8F9' },
      success: { bg: 'rgba(16, 185, 129, 0.92)', border: '#6EE7B7' },
      warn: { bg: 'rgba(245, 158, 11, 0.92)', border: '#FCD34D' },
      error: { bg: 'rgba(239, 68, 68, 0.92)', border: '#FCA5A5' },
    };
    const c = colorMap[type];
    this.centerToast.innerHTML = `
      <div style="
        padding: 12px 22px;
        border-radius: 14px;
        background: ${c.bg};
        color: ${type === 'warn' ? '#0F172A' : '#fff'};
        font-size: 14px;
        font-weight: 600;
        backdrop-filter: blur(10px);
        border: 1px solid ${c.border};
        box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        letter-spacing: 0.02em;
      ">${msg}</div>
    `;
    this.centerToast.style.opacity = '1';
    this.centerToast.style.transform = 'translateX(-50%) translateY(40px)';
    clearTimeout(this._tipTimer as unknown as number);
    this._tipTimer = setTimeout(() => this.hideCenterTip(), duration) as unknown as number;
  }

  private _tipTimer: unknown = null;

  hideCenterTip(): void {
    this.centerToast.style.opacity = '0';
    this.centerToast.style.transform = 'translateX(-50%) translateY(120px)';
  }

  destroy(): void {
    this.element.remove();
  }
}

const extraStyle = document.createElement('style');
extraStyle.textContent = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.4); }
  }
`;
document.head.appendChild(extraStyle);
