import { BaseScene } from './BaseScene';
import { EventBus } from '../core/EventBus';
import { SceneManager } from '../core/SceneManager';
import { SaveSystem } from '../core/SaveSystem';
import { Telemetry } from '../core/Telemetry';
import { LevelProgressData } from './MainMenuScene';
import { uuid } from '../utils/math';

export interface LevelInfo {
  id: string;
  chapterId: string;
  chapterName: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  order: number;
  unlockedByDefault?: boolean;
}

export interface ChapterInfo {
  id: string;
  name: string;
  icon: string;
  levels: LevelInfo[];
  unlockedByDefault?: boolean;
}

export const DEFAULT_CHAPTERS: ChapterInfo[] = [
  {
    id: 'ch1',
    name: '初识电路',
    icon: '💡',
    unlockedByDefault: true,
    levels: [
      { id: 'l1-1', chapterId: 'ch1', chapterName: '初识电路', name: '点亮第一颗灯', description: '用电池和导线点亮灯泡', difficulty: 1, order: 1, unlockedByDefault: true },
      { id: 'l1-2', chapterId: 'ch1', chapterName: '初识电路', name: '开关控制', description: '添加开关控制电路通断', difficulty: 1, order: 2 },
      { id: 'l1-3', chapterId: 'ch1', chapterName: '初识电路', name: '串联之路', description: '多个灯泡串联连接', difficulty: 2, order: 3 },
      { id: 'l1-4', chapterId: 'ch1', chapterName: '初识电路', name: '并联分岔', description: '学习并联电路原理', difficulty: 2, order: 4 },
    ],
  },
  {
    id: 'ch2',
    name: '电阻之道',
    icon: '📏',
    levels: [
      { id: 'l2-1', chapterId: 'ch2', chapterName: '电阻之道', name: '限流初探', description: '添加电阻保护元件', difficulty: 2, order: 1 },
      { id: 'l2-2', chapterId: 'ch2', chapterName: '电阻之道', name: '欧姆定律', description: '理解电压电流电阻关系', difficulty: 3, order: 2 },
      { id: 'l2-3', chapterId: 'ch2', chapterName: '电阻之道', name: '分压电路', description: '构建电阻分压器', difficulty: 3, order: 3 },
      { id: 'l2-4', chapterId: 'ch2', chapterName: '电阻之道', name: '电流过载', description: '认识短路与过载风险', difficulty: 3, order: 4 },
    ],
  },
  {
    id: 'ch3',
    name: '电容储能',
    icon: '⚡',
    levels: [
      { id: 'l3-1', chapterId: 'ch3', chapterName: '电容储能', name: '充电与放电', description: '观察电容充放电过程', difficulty: 3, order: 1 },
      { id: 'l3-2', chapterId: 'ch3', chapterName: '电容储能', name: 'RC时间常数', description: '理解充电速度', difficulty: 4, order: 2 },
      { id: 'l3-3', chapterId: 'ch3', chapterName: '电容储能', name: '延时电路', description: '用电容制作延时开关', difficulty: 4, order: 3 },
    ],
  },
  {
    id: 'ch4',
    name: '综合挑战',
    icon: '🏆',
    levels: [
      { id: 'l4-1', chapterId: 'ch4', chapterName: '综合挑战', name: '交通信号灯', description: '设计交替点亮的灯组', difficulty: 4, order: 1 },
      { id: 'l4-2', chapterId: 'ch4', chapterName: '综合挑战', name: '抢答器设计', description: '优先响应电路', difficulty: 5, order: 2 },
      { id: 'l4-3', chapterId: 'ch4', chapterName: '综合挑战', name: '终极挑战', description: '自由设计复杂电路', difficulty: 5, order: 3 },
    ],
  },
];

interface MapNode {
  level: LevelInfo;
  x: number;
  y: number;
  unlocked: boolean;
  completed: boolean;
  stars: number;
}

interface ChapterMap {
  chapter: ChapterInfo;
  nodes: MapNode[];
  pathPoints: { x: number; y: number }[];
}

export class LevelSelectScene extends BaseScene {
  private sceneManager: SceneManager;
  private saveSystem: SaveSystem;
  private telemetry: Telemetry | null = null;
  private uiRoot: HTMLElement | null = null;
  private uiContainer: HTMLDivElement | null = null;
  private progress: LevelProgressData = { completed: [], stars: {}, bestTime: {} };
  private chapters: ChapterInfo[] = DEFAULT_CHAPTERS;
  private chapterMaps: ChapterMap[] = [];
  private selectedChapterId: string = 'ch1';
  private hoverLevelId: string | null = null;
  private flowOffset: number = 0;
  private inputUnsubscribe: (() => void)[] = [];

  constructor(
    eventBus: EventBus,
    sceneManager: SceneManager,
    saveSystem: SaveSystem,
    telemetry?: Telemetry,
    uiRoot?: HTMLElement
  ) {
    super('level_select', eventBus);
    this.sceneManager = sceneManager;
    this.saveSystem = saveSystem;
    if (telemetry) this.telemetry = telemetry;
    if (uiRoot) this.uiRoot = uiRoot;
  }

  enter(payload?: { progress?: LevelProgressData }): void {
    if (payload?.progress) {
      this.progress = payload.progress;
    } else {
      const saved = this.saveSystem.get<LevelProgressData>('levelProgress');
      if (saved) this.progress = saved;
    }
    this.generateMaps();
    this.buildUI();
    this.subscribeInput();
  }

  exit(): void {
    this.removeUI();
    this.inputUnsubscribe.forEach(u => u());
    this.inputUnsubscribe = [];
  }

  onResize(width: number, height: number): void {
    super.onResize(width, height);
    this.generateMaps();
  }

  update(dt: number): void {
    this.flowOffset = (this.flowOffset + dt * 40) % 20;
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawChapterPath(ctx);
    this.drawLevelNodes(ctx);
  }

  private subscribeInput(): void {
    const bus = this.eventBus as any;
    this.inputUnsubscribe.push(
      bus.on?.('pointer_move', (e: any) => this.handlePointerMove(e)) || (() => {}),
      bus.on?.('pointer_up', (e: any) => this.handlePointerUp(e)) || (() => {}),
    );
  }

  private handlePointerMove(e: { pos: { x: number; y: number } }): void {
    this.hoverLevelId = this.hitTestLevel(e.pos.x, e.pos.y);
    if (this.uiRoot && this.uiContainer) {
      this.uiContainer.style.cursor = this.hoverLevelId ? 'pointer' : 'default';
    }
  }

  private handlePointerUp(e: { pos: { x: number; y: number } }): void {
    const levelId = this.hitTestLevel(e.pos.x, e.pos.y);
    if (levelId) {
      const level = this.findLevel(levelId);
      if (level && this.isLevelUnlocked(level)) {
        this.sceneManager.push('game', { mode: 'level', levelId });
      }
    }
  }

  private hitTestLevel(x: number, y: number): string | null {
    for (const cm of this.chapterMaps) {
      if (cm.chapter.id !== this.selectedChapterId) continue;
      for (const node of cm.nodes) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy <= 30 * 30) {
          return node.level.id;
        }
      }
    }
    return null;
  }

  private findLevel(id: string): LevelInfo | null {
    for (const ch of this.chapters) {
      for (const lv of ch.levels) {
        if (lv.id === id) return lv;
      }
    }
    return null;
  }

  private isLevelUnlocked(level: LevelInfo): boolean {
    if (level.unlockedByDefault) return true;
    if (level.order === 1) {
      const chapter = this.chapters.find(c => c.id === level.chapterId);
      if (chapter?.unlockedByDefault) return true;
      const chIndex = this.chapters.findIndex(c => c.id === level.chapterId);
      if (chIndex > 0) {
        const prevCh = this.chapters[chIndex - 1];
        const prevChLevels = prevCh.levels.map(l => l.id);
        return prevChLevels.every(id => this.progress.completed.includes(id));
      }
      return true;
    }
    const chapter = this.chapters.find(c => c.id === level.chapterId);
    if (!chapter) return false;
    const prevLevel = chapter.levels.find(l => l.order === level.order - 1);
    if (!prevLevel) return true;
    return this.progress.completed.includes(prevLevel.id);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0a1628');
    bgGrad.addColorStop(1, '#1a2040');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private generateMaps(): void {
    this.chapterMaps = [];
    for (const chapter of this.chapters) {
      const nodes: MapNode[] = [];
      const points: { x: number; y: number }[] = [];
      const count = chapter.levels.length;
      const margin = 120;
      const usableW = this.width - margin * 2;
      const usableH = this.height - 280;
      const startY = 200;

      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const x = margin + t * usableW;
        const waveOffset = Math.sin(i * 1.2) * (usableH * 0.25);
        const y = startY + usableH / 2 + waveOffset;
        points.push({ x, y });
        const level = chapter.levels[i];
        nodes.push({
          level,
          x, y,
          unlocked: this.isLevelUnlocked(level),
          completed: this.progress.completed.includes(level.id),
          stars: this.progress.stars[level.id] || 0,
        });
      }
      this.chapterMaps.push({ chapter, nodes, pathPoints: points });
    }
  }

  private drawChapterPath(ctx: CanvasRenderingContext2D): void {
    const current = this.chapterMaps.find(cm => cm.chapter.id === this.selectedChapterId);
    if (!current || current.pathPoints.length < 2) return;

    const pts = current.pathPoints;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -this.flowOffset;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < pts.length - 1; i++) {
      if (!current.nodes[i].completed) continue;
      const from = pts[i];
      const to = pts[i + 1];
      const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      grad.addColorStop(0, 'rgba(74, 222, 128, 0.6)');
      grad.addColorStop(1, 'rgba(74, 222, 128, 0.3)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 5;
      ctx.beginPath();
      const cpx = (from.x + to.x) / 2;
      ctx.moveTo(from.x, from.y);
      ctx.bezierCurveTo(cpx, from.y, cpx, to.y, to.x, to.y);
      ctx.stroke();
    }
  }

  private drawLevelNodes(ctx: CanvasRenderingContext2D): void {
    const current = this.chapterMaps.find(cm => cm.chapter.id === this.selectedChapterId);
    if (!current) return;

    for (const node of current.nodes) {
      const isHover = this.hoverLevelId === node.level.id;
      const r = isHover ? 34 : 28;

      ctx.save();
      ctx.translate(node.x, node.y);

      if (node.unlocked && isHover) {
        ctx.beginPath();
        ctx.arc(0, 0, r + 14, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(0, 0, r, 0, 0, r + 14);
        glow.addColorStop(0, 'rgba(34, 211, 238, 0.4)');
        glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = glow;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = node.unlocked ? '#0f172a' : '#1e293b';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = node.completed
        ? '#4ade80'
        : node.unlocked
        ? isHover
          ? '#22d3ee'
          : '#0ea5e9'
        : '#475569';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      const fillGrad = ctx.createRadialGradient(-r / 3, -r / 3, 0, 0, 0, r);
      if (node.completed) {
        fillGrad.addColorStop(0, '#4ade80');
        fillGrad.addColorStop(1, '#16a34a');
      } else if (node.unlocked) {
        fillGrad.addColorStop(0, '#38bdf8');
        fillGrad.addColorStop(1, '#0369a1');
      } else {
        fillGrad.addColorStop(0, '#475569');
        fillGrad.addColorStop(1, '#1e293b');
      }
      ctx.fillStyle = fillGrad;
      ctx.fill();

      ctx.fillStyle = node.unlocked ? '#f8fafc' : '#64748b';
      ctx.font = `bold ${Math.floor(r * 0.55)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (node.completed) {
        ctx.fillText('✓', 0, 1);
      } else {
        ctx.fillText(String(node.level.order), 0, 1);
      }

      ctx.restore();

      this.drawStars(ctx, node.x, node.y + r + 18, node.stars, node.unlocked);

      if (node.unlocked) {
        ctx.fillStyle = isHover ? '#e2e8f0' : '#94a3b8';
        ctx.font = '13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.level.name, node.x, node.y + r + 42);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('★'.repeat(node.level.difficulty), node.x, node.y + r + 56);
      } else {
        ctx.fillStyle = '#475569';
        ctx.font = '13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒 未解锁', node.x, node.y + r + 42);
      }
    }
  }

  private drawStars(ctx: CanvasRenderingContext2D, cx: number, cy: number, count: number, enabled: boolean): void {
    const size = 14;
    const gap = 4;
    const totalW = 3 * size + 2 * gap;
    let x = cx - totalW / 2 + size / 2;
    for (let i = 0; i < 3; i++) {
      const filled = i < count;
      ctx.save();
      ctx.translate(x, cy);
      this.drawStar(ctx, 0, 0, size / 2, filled ? (enabled ? '#fbbf24' : '#64748b') : 'rgba(100, 116, 139, 0.3)');
      ctx.restore();
      x += size + gap;
    }
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.45;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  private buildUI(): void {
    if (!this.uiRoot) return;

    this.uiContainer = document.createElement('div');
    this.uiContainer.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      position: absolute;
      top: 24px;
      left: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: auto;
    `;

    const backBtn = document.createElement('button');
    backBtn.textContent = '← 返回主菜单';
    backBtn.style.cssText = `
      padding: 10px 20px;
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.8);
      color: #94a3b8;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    backBtn.addEventListener('mouseenter', () => {
      backBtn.style.color = '#22d3ee';
      backBtn.style.borderColor = 'rgba(34, 211, 238, 0.6)';
    });
    backBtn.addEventListener('mouseleave', () => {
      backBtn.style.color = '#94a3b8';
      backBtn.style.borderColor = 'rgba(56, 189, 248, 0.3)';
    });
    backBtn.addEventListener('click', () => this.sceneManager.replace('main_menu'));

    const title = document.createElement('div');
    title.style.cssText = 'text-align: center;';
    title.innerHTML = `
      <h2 style="margin:0;font-size:24px;color:#e2e8f0;font-weight:700;">关卡选择</h2>
      <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Level Selection</p>
    `;

    const stats = document.createElement('div');
    const totalLevels = this.chapters.reduce((s, c) => s + c.levels.length, 0);
    const completedCount = this.progress.completed.length;
    const totalStars = Object.values(this.progress.stars).reduce((s: number, n: any) => s + n, 0);
    stats.innerHTML = `
      <div style="text-align:right;color:#94a3b8;font-size:13px;line-height:1.6;">
        <div>通关: <span style="color:#4ade80;font-weight:600;">${completedCount}</span>/${totalLevels}</div>
        <div>星星: <span style="color:#fbbf24;font-weight:600;">${totalStars}</span>/${totalLevels * 3}</div>
      </div>
    `;

    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(stats);

    const chapterTabs = document.createElement('div');
    chapterTabs.style.cssText = `
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      pointer-events: auto;
      flex-wrap: wrap;
      justify-content: center;
    `;

    for (const ch of this.chapters) {
      const chCompleted = ch.levels.every(l => this.progress.completed.includes(l.id));
      const btn = document.createElement('button');
      const isActive = ch.id === this.selectedChapterId;
      btn.textContent = `${ch.icon} ${ch.name}`;
      btn.style.cssText = `
        padding: 10px 18px;
        border: 1px solid ${isActive ? 'rgba(34, 211, 238, 0.6)' : 'rgba(100, 116, 139, 0.3)'};
        border-radius: 24px;
        background: ${isActive ? 'rgba(34, 211, 238, 0.15)' : 'rgba(15, 23, 42, 0.7)'};
        color: ${isActive ? '#22d3ee' : chCompleted ? '#4ade80' : '#94a3b8'};
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        backdrop-filter: blur(10px);
      `;
      btn.addEventListener('click', () => {
        this.selectedChapterId = ch.id;
        this.hoverLevelId = null;
        this.refreshChapterTabs();
      });
      btn.addEventListener('mouseenter', () => {
        if (!isActive) {
          btn.style.borderColor = 'rgba(34, 211, 238, 0.4)';
          btn.style.color = '#22d3ee';
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (!isActive) {
          btn.style.borderColor = 'rgba(100, 116, 139, 0.3)';
          btn.style.color = chCompleted ? '#4ade80' : '#94a3b8';
        }
      });
      chapterTabs.appendChild(btn);
    }
    (this.uiContainer as any)._tabs = chapterTabs;

    const detailPanel = document.createElement('div');
    detailPanel.id = 'level-detail-panel';
    detailPanel.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      padding: 16px 28px;
      border: 1px solid rgba(100, 116, 139, 0.2);
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(10px);
      color: #94a3b8;
      font-size: 13px;
      pointer-events: auto;
      min-width: 320px;
      text-align: center;
    `;
    detailPanel.textContent = '💡 点击地图上的节点开始关卡';

    this.uiContainer.appendChild(header);
    this.uiContainer.appendChild(chapterTabs);
    this.uiContainer.appendChild(detailPanel);
    this.uiRoot.appendChild(this.uiContainer);
  }

  private refreshChapterTabs(): void {
    if (!this.uiRoot || !this.uiContainer) return;
    const tabs = (this.uiContainer as any)._tabs as HTMLElement;
    if (tabs) {
      tabs.remove();
    }

    const chapterTabs = document.createElement('div');
    chapterTabs.style.cssText = `
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      pointer-events: auto;
      flex-wrap: wrap;
      justify-content: center;
    `;

    for (const ch of this.chapters) {
      const chCompleted = ch.levels.every(l => this.progress.completed.includes(l.id));
      const btn = document.createElement('button');
      const isActive = ch.id === this.selectedChapterId;
      btn.textContent = `${ch.icon} ${ch.name}`;
      btn.style.cssText = `
        padding: 10px 18px;
        border: 1px solid ${isActive ? 'rgba(34, 211, 238, 0.6)' : 'rgba(100, 116, 139, 0.3)'};
        border-radius: 24px;
        background: ${isActive ? 'rgba(34, 211, 238, 0.15)' : 'rgba(15, 23, 42, 0.7)'};
        color: ${isActive ? '#22d3ee' : chCompleted ? '#4ade80' : '#94a3b8'};
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        backdrop-filter: blur(10px);
      `;
      btn.addEventListener('click', () => {
        this.selectedChapterId = ch.id;
        this.hoverLevelId = null;
        this.refreshChapterTabs();
      });
      btn.addEventListener('mouseenter', () => {
        if (!isActive) {
          btn.style.borderColor = 'rgba(34, 211, 238, 0.4)';
          btn.style.color = '#22d3ee';
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (!isActive) {
          btn.style.borderColor = 'rgba(100, 116, 139, 0.3)';
          btn.style.color = chCompleted ? '#4ade80' : '#94a3b8';
        }
      });
      chapterTabs.appendChild(btn);
    }
    (this.uiContainer as any)._tabs = chapterTabs;
    this.uiContainer.appendChild(chapterTabs);
  }

  private removeUI(): void {
    if (this.uiContainer && this.uiRoot) {
      this.uiRoot.removeChild(this.uiContainer);
      this.uiContainer = null;
    }
  }

  setUIRoot(root: HTMLElement): void {
    this.uiRoot = root;
  }

  getUniqueId(): string {
    return uuid();
  }
}
