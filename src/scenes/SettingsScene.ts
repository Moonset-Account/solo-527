import { BaseScene } from './BaseScene';
import { EventBus } from '../core/EventBus';
import { SceneManager } from '../core/SceneManager';
import { SaveSystem } from '../core/SaveSystem';
import { createLogger } from '../utils/logger';

export interface SettingsData {
  volume: number;
  sfxVolume: number;
  particleQuality: 'low' | 'medium' | 'high';
  showGrid: boolean;
  showMinimap: boolean;
  snapToGrid: boolean;
  language: 'zh-CN' | 'en-US';
  controlScheme: 'mouse' | 'touch' | 'gamepad' | 'auto';
  theme: 'dark' | 'cyber';
  showTutorial: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
  volume: 0.7,
  sfxVolume: 0.8,
  particleQuality: 'medium',
  showGrid: true,
  showMinimap: true,
  snapToGrid: true,
  language: 'zh-CN',
  controlScheme: 'auto',
  theme: 'cyber',
  showTutorial: true,
};

const SETTINGS_KEY = 'circuit-sandbox-settings-v1';

export class SettingsScene extends BaseScene {
  private sceneManager: SceneManager;
  private saveSystem: SaveSystem;
  private uiRoot: HTMLElement | null = null;
  private uiContainer: HTMLDivElement | null = null;
  private contentContainer: HTMLDivElement | null = null;

  private settings: SettingsData;

  protected override logger = createLogger('SettingsScene');

  constructor(
    eventBus: EventBus,
    sceneManager: SceneManager,
    saveSystem: SaveSystem,
    uiRoot?: HTMLElement
  ) {
    super('settings', eventBus);
    this.sceneManager = sceneManager;
    this.saveSystem = saveSystem;
    if (uiRoot) this.uiRoot = uiRoot;
    this.settings = this.loadSettings();
  }

  enter(): void {
    this.settings = this.loadSettings();
    this.buildUI();
  }

  exit(): void {
    this.removeUI();
  }

  update(_dt: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0c1222');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#1a1030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const time = performance.now() / 1000;
    ctx.fillStyle = 'rgba(34, 211, 238, 0.04)';
    for (let i = 0; i < 5; i++) {
      const cx = ((time * 20 + i * 200) % (w + 200)) - 100;
      const cy = h / 2 + Math.sin(time * 0.5 + i) * 150;
      ctx.beginPath();
      ctx.arc(cx, cy, 60 + i * 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private loadSettings(): SettingsData {
    try {
      const saved = this.saveSystem.get<Partial<SettingsData>>(SETTINGS_KEY);
      if (saved && typeof saved === 'object') {
        return { ...DEFAULT_SETTINGS, ...saved };
      }
    } catch (e) {
      this.logger.warn('使用默认设置', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      this.saveSystem.set(SETTINGS_KEY, this.settings);
      this.eventBus.emit('settings_changed', this.settings);
    } catch (e) {
      this.logger.error('保存设置失败', e);
    }
  }

  private buildUI(): void {
    if (!this.uiRoot) return;

    this.uiContainer = document.createElement('div');
    this.uiContainer.style.cssText = `
      position: absolute; inset: 0;
      pointer-events: none; z-index: 10;
      font-family: 'JetBrains Mono', monospace;
      display: flex; flex-direction: column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 32px 16px; pointer-events: auto;
    `;

    const leftWrap = document.createElement('div');
    leftWrap.style.cssText = 'display: flex; align-items: center; gap: 16px;';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← 返回';
    backBtn.style.cssText = `
      padding: 10px 20px; border-radius: 8px;
      border: 1px solid rgba(34, 211, 238, 0.3);
      background: rgba(15, 23, 42, 0.8);
      color: #22d3ee; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; backdrop-filter: blur(8px);
    `;
    backBtn.addEventListener('mouseenter', () => {
      backBtn.style.background = 'rgba(34, 211, 238, 0.15)';
      backBtn.style.transform = 'translateX(-2px)';
    });
    backBtn.addEventListener('mouseleave', () => {
      backBtn.style.background = 'rgba(15, 23, 42, 0.8)';
      backBtn.style.transform = 'translateX(0)';
    });
    backBtn.addEventListener('click', () => {
      this.saveSettings();
      this.sceneManager.pop();
    });

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      font-size: 28px; font-weight: 700;
      background: linear-gradient(135deg, #38bdf8, #818cf8, #a855f7);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 1px;
    `;
    titleEl.textContent = '⚙️ 游戏设置';

    leftWrap.appendChild(backBtn);
    leftWrap.appendChild(titleEl);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '🔄 恢复默认';
    resetBtn.style.cssText = `
      padding: 10px 18px; border-radius: 8px;
      border: 1px solid rgba(239, 68, 68, 0.3);
      background: rgba(15, 23, 42, 0.8);
      color: #fca5a5; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; backdrop-filter: blur(8px);
    `;
    resetBtn.addEventListener('mouseenter', () => {
      resetBtn.style.background = 'rgba(239, 68, 68, 0.15)';
    });
    resetBtn.addEventListener('mouseleave', () => {
      resetBtn.style.background = 'rgba(15, 23, 42, 0.8)';
    });
    resetBtn.addEventListener('click', () => this.resetToDefaults());

    header.appendChild(leftWrap);
    header.appendChild(resetBtn);

    this.contentContainer = document.createElement('div');
    this.contentContainer.style.cssText = `
      flex: 1; overflow-y: auto;
      pointer-events: auto;
      margin: 0 32px 32px;
      padding: 24px;
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(100, 116, 139, 0.15);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    `;

    this.uiContainer.appendChild(header);
    this.uiContainer.appendChild(this.contentContainer);
    this.uiRoot.appendChild(this.uiContainer);

    this.renderContent();
  }

  private renderContent(): void {
    if (!this.contentContainer) return;
    this.contentContainer.innerHTML = '';

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    `;

    grid.appendChild(this.createAudioSection());
    grid.appendChild(this.createGraphicsSection());
    grid.appendChild(this.createGameplaySection());
    grid.appendChild(this.createControlSection());
    grid.appendChild(this.createDataSection());
    grid.appendChild(this.createAboutSection());

    this.contentContainer.appendChild(grid);
  }

  private createSection(title: string, icon: string, color: string): { wrap: HTMLDivElement; body: HTMLDivElement } {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      border-radius: 14px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(100, 116, 139, 0.15);
      overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 14px 18px;
      background: ${color};
      border-bottom: 1px solid rgba(100, 116, 139, 0.15);
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 700; color: #e2e8f0;
    `;
    header.innerHTML = `<span style="font-size:18px;">${icon}</span>${title}`;

    const body = document.createElement('div');
    body.style.cssText = 'padding: 16px 18px; display: flex; flex-direction: column; gap: 14px;';

    wrap.appendChild(header);
    wrap.appendChild(body);
    return { wrap, body };
  }

  private createSlider(label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (v: number) => void): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    const labelRow = document.createElement('div');
    labelRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size: 12px; color: #94a3b8;';
    labelEl.textContent = label;
    const valEl = document.createElement('div');
    valEl.style.cssText = 'font-size: 12px; font-weight: 600; color: #22d3ee;';
    valEl.textContent = `${Math.round(value * 100)}${unit}`;
    labelRow.appendChild(labelEl);
    labelRow.appendChild(valEl);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.style.cssText = `
      width: 100%; height: 6px; border-radius: 3px;
      background: rgba(100, 116, 139, 0.2);
      -webkit-appearance: none; appearance: none; cursor: pointer;
    `;
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      valEl.textContent = `${Math.round(v * 100)}${unit}`;
      onChange(v);
    });

    row.appendChild(labelRow);
    row.appendChild(input);
    return row;
  }

  private createToggle(label: string, desc: string, value: boolean, onChange: (v: boolean) => void): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; border-radius: 8px;
      background: rgba(15, 23, 42, 0.4);
      cursor: pointer; transition: background 0.15s;
    `;
    row.addEventListener('mouseenter', () => {
      row.style.background = 'rgba(15, 23, 42, 0.6)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.background = 'rgba(15, 23, 42, 0.4)';
    });

    const labelWrap = document.createElement('div');
    labelWrap.style.cssText = 'flex: 1; padding-right: 12px;';
    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size: 13px; font-weight: 600; color: #e2e8f0;';
    labelEl.textContent = label;
    const descEl = document.createElement('div');
    descEl.style.cssText = 'font-size: 11px; color: #64748b; margin-top: 2px;';
    descEl.textContent = desc;
    labelWrap.appendChild(labelEl);
    labelWrap.appendChild(descEl);

    const toggle = document.createElement('div');
    const updateToggle = (v: boolean) => {
      toggle.style.cssText = `
        width: 42px; height: 22px; border-radius: 11px;
        background: ${v ? 'linear-gradient(90deg, #22d3ee, #0ea5e9)' : 'rgba(100, 116, 139, 0.3)'};
        position: relative; transition: all 0.2s; cursor: pointer;
        flex-shrink: 0;
      `;
      const knob = document.createElement('div');
      knob.style.cssText = `
        position: absolute; top: 2px; ${v ? 'right: 2px' : 'left: 2px'};
        width: 18px; height: 18px; border-radius: 50%;
        background: ${v ? '#0f172a' : '#cbd5e1'};
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      `;
      toggle.innerHTML = '';
      toggle.appendChild(knob);
    };
    updateToggle(value);

    row.addEventListener('click', () => {
      const nv = !value;
      value = nv;
      updateToggle(nv);
      onChange(nv);
    });
    toggle.addEventListener('click', (e) => e.stopPropagation());

    row.appendChild(labelWrap);
    row.appendChild(toggle);
    return row;
  }

  private createSelect(label: string, options: Array<{ value: string; label: string }>, value: string, onChange: (v: string) => void): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size: 12px; color: #94a3b8;';
    labelEl.textContent = label;

    const select = document.createElement('select');
    select.style.cssText = `
      width: 100%; padding: 9px 12px;
      border-radius: 8px; cursor: pointer;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(100, 116, 139, 0.25);
      color: #e2e8f0; font-size: 13px; font-family: inherit;
      outline: none; transition: border-color 0.15s;
    `;
    select.addEventListener('focus', () => {
      select.style.borderColor = 'rgba(34, 211, 238, 0.5)';
    });
    select.addEventListener('blur', () => {
      select.style.borderColor = 'rgba(100, 116, 139, 0.25)';
    });

    for (const opt of options) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      o.style.cssText = 'background: #0f172a;';
      if (opt.value === value) o.selected = true;
      select.appendChild(o);
    }

    select.addEventListener('change', () => onChange(select.value));

    row.appendChild(labelEl);
    row.appendChild(select);
    return row;
  }

  private createAudioSection(): HTMLDivElement {
    const { wrap, body } = this.createSection('音频', '🔊', 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), transparent)');
    body.appendChild(this.createSlider('背景音乐音量', this.settings.volume, 0, 1, 0.05, '%', (v) => {
      this.settings.volume = v;
      this.saveSettings();
    }));
    body.appendChild(this.createSlider('音效音量', this.settings.sfxVolume, 0, 1, 0.05, '%', (v) => {
      this.settings.sfxVolume = v;
      this.saveSettings();
    }));
    return wrap;
  }

  private createGraphicsSection(): HTMLDivElement {
    const { wrap, body } = this.createSection('画面', '🎨', 'linear-gradient(135deg, rgba(34, 211, 238, 0.12), transparent)');
    body.appendChild(this.createSelect('粒子质量', [
      { value: 'low', label: '低（省电）' },
      { value: 'medium', label: '中（推荐）' },
      { value: 'high', label: '高（极致）' },
    ], this.settings.particleQuality, (v) => {
      this.settings.particleQuality = v as any;
      this.saveSettings();
    }));
    body.appendChild(this.createSelect('主题风格', [
      { value: 'cyber', label: '赛博霓虹' },
      { value: 'dark', label: '经典深色' },
    ], this.settings.theme, (v) => {
      this.settings.theme = v as any;
      this.saveSettings();
    }));
    body.appendChild(this.createToggle('显示网格', '画布中显示网格线便于对齐', this.settings.showGrid, (v) => {
      this.settings.showGrid = v;
      this.saveSettings();
    }));
    body.appendChild(this.createToggle('显示小地图', '右下角显示全局缩略图', this.settings.showMinimap, (v) => {
      this.settings.showMinimap = v;
      this.saveSettings();
    }));
    return wrap;
  }

  private createGameplaySection(): HTMLDivElement {
    const { wrap, body } = this.createSection('游戏玩法', '🎮', 'linear-gradient(135deg, rgba(74, 222, 128, 0.12), transparent)');
    body.appendChild(this.createToggle('吸附网格', '放置和移动元件时自动对齐', this.settings.snapToGrid, (v) => {
      this.settings.snapToGrid = v;
      this.saveSettings();
    }));
    body.appendChild(this.createToggle('新手引导', '首次进入显示操作提示', this.settings.showTutorial, (v) => {
      this.settings.showTutorial = v;
      this.saveSettings();
    }));
    body.appendChild(this.createSelect('语言', [
      { value: 'zh-CN', label: '简体中文' },
      { value: 'en-US', label: 'English' },
    ], this.settings.language, (v) => {
      this.settings.language = v as any;
      this.saveSettings();
    }));
    return wrap;
  }

  private createControlSection(): HTMLDivElement {
    const { wrap, body } = this.createSection('操作方式', '🎯', 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), transparent)');
    body.appendChild(this.createSelect('操作方案', [
      { value: 'auto', label: '自动检测' },
      { value: 'mouse', label: '键盘 + 鼠标' },
      { value: 'touch', label: '触摸屏幕' },
      { value: 'gamepad', label: '游戏手柄' },
    ], this.settings.controlScheme, (v) => {
      this.settings.controlScheme = v as any;
      this.saveSettings();
    }));
    const help = document.createElement('div');
    help.style.cssText = `
      padding: 10px 12px; border-radius: 8px;
      background: rgba(15, 23, 42, 0.4);
      font-size: 11px; color: #64748b; line-height: 1.7;
    `;
    help.innerHTML = `
      <div style="color:#94a3b8;font-weight:600;margin-bottom:4px;">⌨️ 快捷键</div>
      <div><span style="color:#22d3ee;">1-6</span> 选择元件　<span style="color:#22d3ee;">W/E</span> 连线模式</div>
      <div><span style="color:#22d3ee;">R</span> 旋转　<span style="color:#22d3ee;">F</span> 切换开关</div>
      <div><span style="color:#22d3ee;">Ctrl+Z</span> 撤销　<span style="color:#22d3ee;">Delete</span> 删除</div>
    `;
    body.appendChild(help);
    return wrap;
  }

  private createDataSection(): HTMLDivElement {
    const { wrap, body } = this.createSection('数据管理', '💾', 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), transparent)');

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📤 导出存档数据';
    exportBtn.style.cssText = `
      padding: 10px 14px; border-radius: 8px;
      background: rgba(34, 211, 238, 0.1);
      border: 1px solid rgba(34, 211, 238, 0.3);
      color: #67e8f9; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all 0.15s; font-family: inherit;
      text-align: left;
    `;
    exportBtn.addEventListener('mouseenter', () => {
      exportBtn.style.background = 'rgba(34, 211, 238, 0.2)';
    });
    exportBtn.addEventListener('click', () => this.exportData());

    const importBtn = document.createElement('button');
    importBtn.textContent = '📥 导入存档数据';
    importBtn.style.cssText = `
      padding: 10px 14px; border-radius: 8px;
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.3);
      color: #c4b5fd; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all 0.15s; font-family: inherit;
      text-align: left;
    `;
    importBtn.addEventListener('mouseenter', () => {
      importBtn.style.background = 'rgba(168, 85, 247, 0.2)';
    });
    importBtn.addEventListener('click', () => this.importData());

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑 清除所有存档';
    clearBtn.style.cssText = `
      padding: 10px 14px; border-radius: 8px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all 0.15s; font-family: inherit;
      text-align: left;
    `;
    clearBtn.addEventListener('mouseenter', () => {
      clearBtn.style.background = 'rgba(239, 68, 68, 0.2)';
    });
    clearBtn.addEventListener('click', () => this.clearAllData());

    body.appendChild(exportBtn);
    body.appendChild(importBtn);
    body.appendChild(clearBtn);
    return wrap;
  }

  private createAboutSection(): HTMLDivElement {
    const { wrap, body } = this.createSection('关于', 'ℹ️', 'linear-gradient(135deg, rgba(148, 163, 184, 0.12), transparent)');

    const info = document.createElement('div');
    info.style.cssText = `
      padding: 12px 14px; border-radius: 8px;
      background: rgba(15, 23, 42, 0.4);
      font-size: 12px; color: #94a3b8; line-height: 1.8;
    `;
    info.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span>版本</span><span style="color:#22d3ee;">0.1.0-beta</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span>引擎</span><span style="color:#22d3ee;">TypeScript + Canvas</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>类型</span><span style="color:#fbbf24;">教育沙盒 / 测试版</span>
      </div>
    `;

    const disclaimer = document.createElement('div');
    disclaimer.style.cssText = `
      padding: 10px 12px; border-radius: 8px;
      background: rgba(251, 191, 36, 0.08);
      border: 1px solid rgba(251, 191, 36, 0.2);
      font-size: 11px; color: #fcd34d; line-height: 1.6;
    `;
    disclaimer.innerHTML = `
      <strong style="color:#fbbf24;">⚠️ 教学近似声明</strong><br/>
      本软件为教育演示用途，电路仿真采用简化教学模型，结果仅供学习参考，不作为专业工程依据。
    `;

    body.appendChild(info);
    body.appendChild(disclaimer);
    return wrap;
  }

  private resetToDefaults(): void {
    if (confirm('确定要恢复所有设置为默认值吗？')) {
      this.settings = { ...DEFAULT_SETTINGS };
      this.saveSettings();
      this.renderContent();
    }
  }

  private exportData(): void {
    try {
      const allData: Record<string, any> = {};
      const keys = [SETTINGS_KEY, 'levelProgress', 'telemetry-sessions', 'leaderboard', 'achievements-unlocked'];
      for (const k of keys) {
        const v = (this.saveSystem as any).getAll ? (this.saveSystem as any).getAll() : null;
        allData[k] = this.saveSystem.get<any>(k);
      }
      allData._exportedAt = new Date().toISOString();
      allData._version = '0.1.0-beta';

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `circuit-sandbox-save-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出失败：' + (e as Error).message);
    }
  }

  private importData(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!confirm('导入将覆盖当前所有存档数据，确定继续？')) return;

        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('_')) continue;
          try { this.saveSystem.set(k, v); } catch {}
        }
        this.settings = this.loadSettings();
        alert('导入成功！即将刷新页面');
        location.reload();
      } catch (e) {
        alert('导入失败：文件格式错误');
      }
    });
    input.click();
  }

  private clearAllData(): void {
    if (!confirm('⚠️ 确定清除 ALL 存档？此操作无法恢复！\n\n将删除：关卡进度、成就、排行榜、设置、试玩记录')) return;
    if (!confirm('再次确认：真的要清除所有数据吗？')) return;

    try {
      this.saveSystem.reset();
      try { localStorage.clear(); } catch {}
      alert('已清除所有数据，即将刷新');
      location.reload();
    } catch (e) {
      alert('清除失败：' + (e as Error).message);
    }
  }

  private removeUI(): void {
    if (this.uiContainer && this.uiRoot) {
      this.uiRoot.removeChild(this.uiContainer);
      this.uiContainer = null;
      this.contentContainer = null;
    }
  }
}
