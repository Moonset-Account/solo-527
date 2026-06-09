import { BaseScene } from './BaseScene';
import { EventBus } from '../core/EventBus';
import { SceneManager } from '../core/SceneManager';
import { SaveSystem } from '../core/SaveSystem';

interface WireParticle {
  x: number;
  y: number;
  speed: number;
  wireIndex: number;
  progress: number;
  size: number;
  color: string;
}

interface BackgroundWire {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  particles: WireParticle[];
}

export interface LevelProgressData {
  completed: string[];
  stars: Record<string, number>;
  bestTime: Record<string, number>;
}

import { Telemetry } from '../core/Telemetry';

export class MainMenuScene extends BaseScene {
  private sceneManager: SceneManager;
  private saveSystem: SaveSystem;
  private telemetry: Telemetry | null = null;
  private uiRoot: HTMLElement | null = null;
  private backgroundWires: BackgroundWire[] = [];
  private particles: WireParticle[] = [];
  private uiContainer: HTMLDivElement | null = null;
  private enterTime: number = 0;

  constructor(
    eventBus: EventBus,
    sceneManager: SceneManager,
    saveSystem: SaveSystem,
    telemetry?: Telemetry,
    uiRoot?: HTMLElement
  ) {
    super('main_menu', eventBus);
    this.sceneManager = sceneManager;
    this.saveSystem = saveSystem;
    if (telemetry) this.telemetry = telemetry;
    if (uiRoot) this.uiRoot = uiRoot;
  }

  enter(): void {
    this.enterTime = 0;
    this.generateBackgroundWires();
    this.buildUI();
  }

  exit(): void {
    this.removeUI();
  }

  onResize(width: number, height: number): void {
    super.onResize(width, height);
    if (this.backgroundWires.length > 0) {
      this.generateBackgroundWires();
    }
  }

  update(dt: number): void {
    this.enterTime += dt;

    for (const wire of this.backgroundWires) {
      for (const particle of wire.particles) {
        particle.progress += particle.speed * dt;
        if (particle.progress >= 1) {
          particle.progress = 0;
          particle.wireIndex = Math.floor(Math.random() * this.backgroundWires.length);
        }

        const w = this.backgroundWires[particle.wireIndex] ?? wire;
        const pos = this.getPositionOnPath(w.points, particle.progress);
        particle.x = pos.x;
        particle.y = pos.y;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    const bgGradient = ctx.createLinearGradient(0, 0, w, h);
    bgGradient.addColorStop(0, '#0c1220');
    bgGradient.addColorStop(0.5, '#0f172a');
    bgGradient.addColorStop(1, '#1a1b3a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    this.drawGrid(ctx);
    this.drawWires(ctx);
    this.drawParticles(ctx);
    this.drawVignette(ctx);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  private drawWires(ctx: CanvasRenderingContext2D): void {
    for (const wire of this.backgroundWires) {
      ctx.strokeStyle = wire.color;
      ctx.lineWidth = wire.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (wire.points.length > 0) {
        ctx.moveTo(wire.points[0].x, wire.points[0].y);
        for (let i = 1; i < wire.points.length; i++) {
          ctx.lineTo(wire.points[i].x, wire.points[i].y);
        }
      }
      ctx.stroke();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const wire of this.backgroundWires) {
      for (const p of wire.particles) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        glow.addColorStop(0, p.color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawVignette(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.height / 4,
      this.width / 2, this.height / 2, this.width / 1.2
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private generateBackgroundWires(): void {
    this.backgroundWires = [];
    const wireColors = [
      'rgba(34, 211, 238, 0.3)',
      'rgba(168, 85, 247, 0.25)',
      'rgba(250, 204, 21, 0.2)',
      'rgba(74, 222, 128, 0.25)',
      'rgba(244, 114, 182, 0.2)',
    ];
    const particleColors = ['#22d3ee', '#a855f7', '#facc15', '#4ade80', '#f472b6'];
    const wireCount = 8;

    for (let i = 0; i < wireCount; i++) {
      const points = this.generateWirePath();
      const color = wireColors[i % wireColors.length];
      const wire: BackgroundWire = {
        points,
        color,
        width: 2 + Math.random() * 2,
        particles: [],
      };

      const particleCount = 3 + Math.floor(Math.random() * 4);
      for (let j = 0; j < particleCount; j++) {
        wire.particles.push({
          x: 0,
          y: 0,
          speed: 0.08 + Math.random() * 0.15,
          wireIndex: i,
          progress: Math.random(),
          size: 2 + Math.random() * 3,
          color: particleColors[i % particleColors.length],
        });
      }

      this.backgroundWires.push(wire);
    }
  }

  private generateWirePath(): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const startSide = Math.floor(Math.random() * 4);
    let x = 0, y = 0;

    switch (startSide) {
      case 0: x = Math.random() * this.width; y = -50; break;
      case 1: x = this.width + 50; y = Math.random() * this.height; break;
      case 2: x = Math.random() * this.width; y = this.height + 50; break;
      case 3: x = -50; y = Math.random() * this.height; break;
    }
    points.push({ x, y });

    const segments = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < segments; i++) {
      x = this.width * 0.15 + Math.random() * this.width * 0.7;
      y = this.height * 0.15 + Math.random() * this.height * 0.7;
      points.push({ x, y });
    }

    const endSide = (startSide + 2) % 4;
    switch (endSide) {
      case 0: x = Math.random() * this.width; y = -50; break;
      case 1: x = this.width + 50; y = Math.random() * this.height; break;
      case 2: x = Math.random() * this.width; y = this.height + 50; break;
      case 3: x = -50; y = Math.random() * this.height; break;
    }
    points.push({ x, y });

    return points;
  }

  private getPositionOnPath(points: { x: number; y: number }[], t: number): { x: number; y: number } {
    if (points.length < 2) return points[0] || { x: 0, y: 0 };
    const totalLength = this.getPathLength(points);
    const targetLength = totalLength * t;
    let acc = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const segLen = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
      if (acc + segLen >= targetLength) {
        const ratio = (targetLength - acc) / segLen;
        return {
          x: points[i].x + (points[i + 1].x - points[i].x) * ratio,
          y: points[i].y + (points[i + 1].y - points[i].y) * ratio,
        };
      }
      acc += segLen;
    }

    return points[points.length - 1];
  }

  private getPathLength(points: { x: number; y: number }[]): number {
    let len = 0;
    for (let i = 0; i < points.length - 1; i++) {
      len += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    }
    return len;
  }

  private buildUI(): void {
    if (!this.uiRoot) return;

    this.uiContainer = document.createElement('div');
    this.uiContainer.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 10;
    `;

    const titleWrap = document.createElement('div');
    titleWrap.style.cssText = 'text-align: center; margin-bottom: 48px; pointer-events: auto;';

    const title = document.createElement('h1');
    title.textContent = '电路沙盒';
    title.style.cssText = `
      font-size: 64px;
      font-weight: 900;
      margin: 0 0 8px 0;
      background: linear-gradient(135deg, #22d3ee 0%, #a855f7 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      text-shadow: 0 0 40px rgba(34, 211, 238, 0.3);
      letter-spacing: 4px;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Circuit Sandbox · 探索电学的奇妙世界';
    subtitle.style.cssText = `
      font-size: 18px;
      color: #94a3b8;
      margin: 0;
      letter-spacing: 2px;
    `;

    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);

    const menuContainer = document.createElement('div');
    menuContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 320px;
      pointer-events: auto;
    `;

    const menuItems = [
      { id: 'level_select', label: '🎮 关卡选择', sub: '开始冒险之旅', payload: { progress: this.getLevelProgress() } },
      { id: 'game', label: '🛠 自由模式', sub: '无限创造空间', payload: { mode: 'sandbox' } },
      { id: 'game', label: '📅 每日挑战', sub: this.getDailyLabel(), payload: { mode: 'daily', date: this.getTodayDate() } },
      { id: 'achievement', label: '🏆 成就排行', sub: '荣誉殿堂', payload: undefined },
      { id: 'settings', label: '⚙ 设置选项', sub: '个性化配置', payload: undefined },
    ];

    menuItems.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        padding: 16px 24px;
        border: 1px solid rgba(56, 189, 248, 0.2);
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(10px);
        color: #e2e8f0;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s ease;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 4px;
        opacity: 0;
        transform: translateY(20px);
        animation: slideIn 0.5s ease ${index * 0.08}s forwards;
      `;

      const main = document.createElement('span');
      main.style.cssText = 'display: flex; align-items: center; gap: 12px;';
      main.textContent = item.label;

      const sub = document.createElement('span');
      sub.style.cssText = 'font-size: 12px; color: #64748b; font-weight: 400; margin-left: 36px;';
      sub.textContent = item.sub;

      btn.appendChild(main);
      btn.appendChild(sub);

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(34, 211, 238, 0.15)';
        btn.style.borderColor = 'rgba(34, 211, 238, 0.5)';
        btn.style.transform = 'translateX(4px)';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(15, 23, 42, 0.7)';
        btn.style.borderColor = 'rgba(56, 189, 248, 0.2)';
        btn.style.transform = 'translateX(0)';
      });

      btn.addEventListener('click', () => {
        if (item.id === 'game') {
          this.sceneManager.push(item.id, item.payload);
        } else {
          this.sceneManager.replace(item.id, item.payload);
        }
      });

      menuContainer.appendChild(btn);
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        to { opacity: 1; transform: translateY(0); }
      }
    `;

    const version = document.createElement('div');
    version.textContent = 'v0.1.0-beta · Made with ❤';
    version.style.cssText = `
      margin-top: 48px;
      font-size: 12px;
      color: #475569;
      pointer-events: auto;
    `;

    this.uiContainer.appendChild(style);
    this.uiContainer.appendChild(titleWrap);
    this.uiContainer.appendChild(menuContainer);
    this.uiContainer.appendChild(version);
    this.uiRoot.appendChild(this.uiContainer);
  }

  private removeUI(): void {
    if (this.uiContainer && this.uiRoot) {
      this.uiRoot.removeChild(this.uiContainer);
      this.uiContainer = null;
    }
  }

  private getLevelProgress(): LevelProgressData {
    const saved = this.saveSystem.get<LevelProgressData>('levelProgress');
    if (saved) return saved;
    return { completed: [], stars: {}, bestTime: {} };
  }

  private getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private getDailyLabel(): string {
    const today = this.getTodayDate();
    const saved = this.saveSystem.get<string[]>('dailyCompleted');
    if (saved?.includes(today)) return '✅ 今日已完成';
    return `今日挑战 · ${today}`;
  }

  setUIRoot(root: HTMLElement): void {
    this.uiRoot = root;
  }
}
