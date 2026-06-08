import {
  Settings,
  DEFAULT_SETTINGS,
  KeyBindings,
  DEFAULT_KEY_BINDINGS,
  ComponentType,
  COMPONENT_CONFIGS,
} from './config';
import { CircuitComponent } from './components';

export class UIManager {
  private overlayTutorial: HTMLElement;
  private overlayPause: HTMLElement;
  private overlaySettings: HTMLElement;
  private overlaySettlement: HTMLElement;
  private tutorialBox: HTMLElement;
  private settlementBox: HTMLElement;
  private settingsContent: HTMLElement;
  private propsPanel: HTMLElement;
  private propsContent: HTMLElement;
  private levelBadge: HTMLElement;
  private perfStatsEl: HTMLElement;
  private simDot: HTMLElement;
  private simStatus: HTMLElement;
  private fpsDisplay: HTMLElement;
  private componentCountDisplay: HTMLElement;
  private levelDisplay: HTMLElement;
  private palette: HTMLElement;
  private hintBubble: HTMLDivElement | null = null;

  constructor() {
    this.overlayTutorial = document.getElementById('overlay-tutorial')!;
    this.overlayPause = document.getElementById('overlay-pause')!;
    this.overlaySettings = document.getElementById('overlay-settings')!;
    this.overlaySettlement = document.getElementById('overlay-settlement')!;
    this.tutorialBox = document.getElementById('tutorial-box')!;
    this.settlementBox = document.getElementById('settlement-box')!;
    this.settingsContent = document.getElementById('settings-content')!;
    this.propsPanel = document.getElementById('props-panel')!;
    this.propsContent = document.getElementById('props-content')!;
    this.levelBadge = document.getElementById('level-badge')!;
    this.perfStatsEl = document.getElementById('perf-stats')!;
    this.simDot = document.getElementById('sim-dot')!;
    this.simStatus = document.getElementById('sim-status')!;
    this.fpsDisplay = document.getElementById('fps-display')!;
    this.componentCountDisplay = document.getElementById('component-count')!;
    this.levelDisplay = document.getElementById('level-display')!;
    this.palette = document.getElementById('palette')!;
  }

  showTutorial(title: string, content: string, buttons: { text: string; action: () => void }[]): void {
    this.tutorialBox.innerHTML = '';
    const h2 = document.createElement('h2');
    h2.textContent = title;
    const p = document.createElement('p');
    p.textContent = content;
    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';
    for (const btn of buttons) {
      const el = document.createElement('button');
      el.textContent = btn.text;
      el.className = 'btn-primary';
      el.addEventListener('click', btn.action);
      btnRow.appendChild(el);
    }
    this.tutorialBox.appendChild(h2);
    this.tutorialBox.appendChild(p);
    this.tutorialBox.appendChild(btnRow);
    this.overlayTutorial.classList.add('visible');
  }

  hideTutorial(): void {
    this.overlayTutorial.classList.remove('visible');
  }

  showPause(): void {
    this.overlayPause.classList.add('visible');
  }

  hidePause(): void {
    this.overlayPause.classList.remove('visible');
  }

  showSettings(settings: Settings, onChange: (newSettings: Settings) => void): void {
    this.settingsContent.innerHTML = '';

    const fields: { key: keyof Settings; label: string; type: string; attrs?: Record<string, string>; options?: string[] }[] = [
      { key: 'showGrid', label: '显示网格', type: 'checkbox' },
      { key: 'snapToGrid', label: '吸附网格', type: 'checkbox' },
      { key: 'gridSize', label: '网格大小', type: 'number', attrs: { min: '10', max: '50' } },
      { key: 'simSpeed', label: '仿真速度', type: 'range', attrs: { min: '0.1', max: '5', step: '0.1' } },
      { key: 'volume', label: '音量', type: 'range', attrs: { min: '0', max: '1', step: '0.1' } },
      { key: 'language', label: '语言', type: 'select', options: ['zh-CN', 'en'] },
      { key: 'showPerfStats', label: '性能统计', type: 'checkbox' },
      { key: 'autoSave', label: '自动保存', type: 'checkbox' },
      { key: 'theme', label: '主题', type: 'select', options: ['dark', 'light'] },
    ];

    for (const field of fields) {
      const row = document.createElement('div');
      row.className = 'prop-row';
      const label = document.createElement('label');
      label.textContent = field.label;

      if (field.type === 'checkbox') {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = settings[field.key] as boolean;
        input.addEventListener('change', () => {
          onChange({ ...settings, [field.key]: input.checked });
        });
        row.appendChild(label);
        row.appendChild(input);
      } else if (field.type === 'number') {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = String(settings[field.key]);
        if (field.attrs) {
          for (const [k, v] of Object.entries(field.attrs)) {
            input.setAttribute(k, v);
          }
        }
        input.addEventListener('change', () => {
          const val = Number(input.value);
          if (!isNaN(val)) {
            onChange({ ...settings, [field.key]: val });
          }
        });
        row.appendChild(label);
        row.appendChild(input);
      } else if (field.type === 'range') {
        const input = document.createElement('input');
        input.type = 'range';
        input.value = String(settings[field.key]);
        if (field.attrs) {
          for (const [k, v] of Object.entries(field.attrs)) {
            input.setAttribute(k, v);
          }
        }
        const valSpan = document.createElement('span');
        valSpan.textContent = String(settings[field.key]);
        valSpan.style.minWidth = '32px';
        valSpan.style.textAlign = 'right';
        valSpan.style.color = '#e94560';
        input.addEventListener('input', () => {
          valSpan.textContent = input.value;
          onChange({ ...settings, [field.key]: Number(input.value) });
        });
        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(valSpan);
      } else if (field.type === 'select') {
        const select = document.createElement('select');
        if (field.options) {
          for (const opt of field.options) {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            if (settings[field.key] === opt) {
              option.selected = true;
            }
            select.appendChild(option);
          }
        }
        select.addEventListener('change', () => {
          onChange({ ...settings, [field.key]: select.value });
        });
        row.appendChild(label);
        row.appendChild(select);
      }

      this.settingsContent.appendChild(row);
    }

    const keySection = document.createElement('div');
    keySection.style.cssText = 'margin-top: 16px; padding-top: 12px; border-top: 1px solid #3a3a5a;';
    const keyTitle = document.createElement('h3');
    keyTitle.textContent = '快捷键';
    keyTitle.style.cssText = 'color: #e94560; margin: 0 0 8px 0; font-size: 14px;';
    keySection.appendChild(keyTitle);

    const keyLabels: Record<keyof import('./config').KeyBindings, string> = {
      delete: '删除',
      rotate: '旋转',
      undo: '撤销',
      redo: '重做',
      save: '保存',
      load: '加载',
      pause: '暂停',
      hint: '提示',
      pan: '平移',
      zoomIn: '放大',
      zoomOut: '缩小',
    };

    const keyOrder: (keyof import('./config').KeyBindings)[] = [
      'delete', 'rotate', 'undo', 'redo', 'save', 'load', 'pause', 'hint',
    ];

    for (const action of keyOrder) {
      const row = document.createElement('div');
      row.className = 'prop-row';
      const label = document.createElement('label');
      label.textContent = keyLabels[action];
      label.style.cssText = 'min-width: 60px;';
      const btn = document.createElement('button');
      btn.textContent = settings.keyBindings[action].join(', ');
      btn.style.cssText = 'flex: 1; padding: 4px 8px; background: #2a2a4a; border: 1px solid #5a6a8a; border-radius: 4px; color: #ccc; cursor: pointer; font-size: 12px; text-align: center;';
      let listening = false;
      const newKeys: string[] = [];
      btn.addEventListener('click', () => {
        if (listening) return;
        listening = true;
        newKeys.length = 0;
        btn.textContent = '按下新快捷键...';
        btn.style.borderColor = '#e94560';

        const onKeyDown = (e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.key === 'Escape') {
            cleanup();
            btn.textContent = settings.keyBindings[action].join(', ');
            return;
          }
          const key = e.key;
          if (!newKeys.includes(key)) {
            newKeys.push(key);
            btn.textContent = newKeys.join(', ');
          }
          if (newKeys.length >= 2 || ['Enter', 'Space', 'Tab'].includes(key)) {
            cleanup();
            const updatedBindings = { ...settings.keyBindings, [action]: [...newKeys] };
            onChange({ ...settings, keyBindings: updatedBindings });
          }
        };

        const cleanup = () => {
          listening = false;
          btn.style.borderColor = '#5a6a8a';
          window.removeEventListener('keydown', onKeyDown);
        };

        window.addEventListener('keydown', onKeyDown);
      });
      row.appendChild(label);
      row.appendChild(btn);
      keySection.appendChild(row);
    }

    this.settingsContent.appendChild(keySection);

    this.overlaySettings.classList.add('visible');
  }

  hideSettings(): void {
    this.overlaySettings.classList.remove('visible');
  }

  showSettlement(levelName: string, timeSeconds: number, retries: number, hintsUsed: number, rating: number, onContinue: () => void): void {
    this.settlementBox.innerHTML = '';
    const h2 = document.createElement('h2');
    h2.textContent = levelName;

    const stats = document.createElement('p');
    const mins = Math.floor(timeSeconds / 60);
    const secs = Math.floor(timeSeconds % 60);
    stats.innerHTML = `用时: ${mins}分${secs}秒<br>重试: ${retries}次<br>提示: ${hintsUsed}次`;

    const stars = document.createElement('div');
    stars.style.cssText = 'font-size: 32px; margin: 16px 0; text-align: center;';
    const starCount = rating >= 0.8 ? 3 : rating >= 0.5 ? 2 : 1;
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.textContent = i < starCount ? '★' : '☆';
      span.style.color = i < starCount ? '#f9ed69' : '#5a6a8a';
      stars.appendChild(span);
    }

    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';
    const continueBtn = document.createElement('button');
    continueBtn.textContent = '继续';
    continueBtn.className = 'btn-primary';
    continueBtn.addEventListener('click', onContinue);
    btnRow.appendChild(continueBtn);

    this.settlementBox.appendChild(h2);
    this.settlementBox.appendChild(stats);
    this.settlementBox.appendChild(stars);
    this.settlementBox.appendChild(btnRow);
    this.overlaySettlement.classList.add('visible');
  }

  hideSettlement(): void {
    this.overlaySettlement.classList.remove('visible');
  }

  showPropsPanel(component: CircuitComponent, onChange: (value: number) => void): void {
    this.propsContent.innerHTML = '';
    const cfg = COMPONENT_CONFIGS[component.type];

    const typeLabel = document.createElement('div');
    typeLabel.className = 'prop-row';
    typeLabel.innerHTML = `<label>类型</label><span style="color:#e94560">${component.type}</span>`;

    const valueRow = document.createElement('div');
    valueRow.className = 'prop-row';
    const valueLabel = document.createElement('label');
    valueLabel.textContent = `值 (${cfg.unit})`;
    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.value = String(component.value);
    valueInput.min = String(cfg.min);
    valueInput.max = String(cfg.max);
    valueInput.addEventListener('change', () => {
      const val = Number(valueInput.value);
      if (!isNaN(val) && val >= cfg.min && val <= cfg.max) {
        onChange(val);
      }
    });

    valueRow.appendChild(valueLabel);
    valueRow.appendChild(valueInput);
    this.propsContent.appendChild(typeLabel);
    this.propsContent.appendChild(valueRow);
    this.propsPanel.classList.add('visible');
  }

  hidePropsPanel(): void {
    this.propsPanel.classList.remove('visible');
  }

  updateStatusBar(fps: number, componentCount: number, levelName: string, simRunning: boolean): void {
    this.fpsDisplay.textContent = `FPS: ${fps}`;
    this.componentCountDisplay.textContent = `元件: ${componentCount}`;
    this.levelDisplay.textContent = `关卡: ${levelName}`;
    this.simDot.className = `dot ${simRunning ? 'green' : 'yellow'}`;
    this.simStatus.textContent = simRunning ? '仿真运行中' : '仿真已暂停';
  }

  updateLevelBadge(name: string): void {
    this.levelBadge.textContent = name;
  }

  updatePerfStats(report: string): void {
    this.perfStatsEl.textContent = report;
    if (report) {
      this.perfStatsEl.classList.add('visible');
    } else {
      this.perfStatsEl.classList.remove('visible');
    }
  }

  showHint(text: string): void {
    const wrap = document.getElementById('canvas-wrap')!;
    if (!this.hintBubble) {
      this.hintBubble = document.createElement('div');
      this.hintBubble.className = 'hint-bubble';
      wrap.appendChild(this.hintBubble);
    }
    this.hintBubble.textContent = text;
    this.hintBubble.style.display = '';
  }

  hideHint(): void {
    if (this.hintBubble) {
      this.hintBubble.style.display = 'none';
    }
  }

  buildPalette(types: ComponentType[], onDragStart: (type: ComponentType) => void): void {
    this.palette.innerHTML = '';
    for (const type of types) {
      const item = document.createElement('div');
      item.className = 'pal-item';
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 24;
      this.drawPaletteItem(canvas, type);
      const label = document.createElement('span');
      label.textContent = type;
      item.appendChild(canvas);
      item.appendChild(label);
      item.addEventListener('mousedown', () => onDragStart(type));
      item.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onDragStart(type);
      });
      this.palette.appendChild(item);
    }
  }

  drawPaletteItem(canvas: HTMLCanvasElement, type: ComponentType): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 32, 24);
    ctx.save();
    ctx.translate(16, 12);
    const cfg = COMPONENT_CONFIGS[type];
    const scaleX = 28 / cfg.width;
    const scaleY = 20 / cfg.height;
    const scale = Math.min(scaleX, scaleY);
    ctx.scale(scale, scale);

    const tempComp = new CircuitComponent(type, 0, 0);
    tempComp.draw(ctx);

    ctx.restore();
  }

  showTutorialHighlight(rect: DOMRect): void {
    let el = document.querySelector('.tutorial-highlight') as HTMLElement | null;
    if (!el) {
      el = document.createElement('div');
      el.className = 'tutorial-highlight';
      document.getElementById('canvas-wrap')!.appendChild(el);
    }
    el.style.left = rect.left + 'px';
    el.style.top = rect.top + 'px';
    el.style.width = rect.width + 'px';
    el.style.height = rect.height + 'px';
    el.style.display = '';
  }

  showTutorialTooltip(text: string, rect: DOMRect): void {
    let el = document.querySelector('.tutorial-tooltip') as HTMLElement | null;
    if (!el) {
      el = document.createElement('div');
      el.className = 'tutorial-tooltip';
      document.getElementById('canvas-wrap')!.appendChild(el);
    }
    el.textContent = text;
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = (rect.top - 8) + 'px';
    el.style.transform = 'translate(-50%, -100%)';
    el.style.display = '';
  }
}
