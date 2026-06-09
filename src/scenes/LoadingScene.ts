import { BaseScene } from './BaseScene';
import { EventBus } from '../core/EventBus';
import { SceneManager } from '../core/SceneManager';
import { AssetLoader, LoadProgress } from '../core/AssetLoader';

const LOAD_TASKS = [
  { key: 'levels', url: '/data/levels.json' },
  { key: 'components', url: '/data/components.json' },
  { key: 'achievements', url: '/data/achievements.json' },
];

const COMPONENT_PREVIEWS: Record<string, string> = {
  battery: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><rect x="0" y="5" width="50" height="20" fill="#f4a261" stroke="#e76f51" stroke-width="2"/><rect x="50" y="10" width="6" height="10" fill="#e76f51"/><text x="25" y="20" text-anchor="middle" font-size="10" fill="#264653">+ -</text></svg>`,
  resistor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><rect x="0" y="12" width="8" height="6" fill="#6c757d"/><rect x="52" y="12" width="8" height="6" fill="#6c757d"/><path d="M 8 15 L 14 8 L 20 22 L 26 8 L 32 22 L 38 8 L 44 22 L 52 15" fill="none" stroke="#d4a373" stroke-width="3"/></svg>`,
  capacitor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><rect x="0" y="14" width="20" height="2" fill="#6c757d"/><rect x="40" y="14" width="20" height="2" fill="#6c757d"/><rect x="20" y="5" width="4" height="20" fill="#219ebc"/><rect x="36" y="5" width="4" height="20" fill="#219ebc"/></svg>`,
  switch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><rect x="0" y="14" width="15" height="2" fill="#6c757d"/><rect x="45" y="14" width="15" height="2" fill="#6c757d"/><circle cx="15" cy="15" r="3" fill="#e63946"/><circle cx="45" cy="15" r="3" fill="#e63946"/><line x1="18" y1="15" x2="42" y2="6" stroke="#f1c40f" stroke-width="2"/></svg>`,
  bulb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 60"><circle cx="20" cy="22" r="18" fill="#fff9c4" stroke="#f9a825" stroke-width="2"/><rect x="14" y="40" width="12" height="6" fill="#6c757d"/><rect x="16" y="46" width="8" height="4" fill="#6c757d"/><rect x="18" y="50" width="4" height="4" fill="#6c757d"/><line x1="15" y1="20" x2="25" y2="20" stroke="#f57c00" stroke-width="1"/><line x1="20" y1="15" x2="20" y2="25" stroke="#f57c00" stroke-width="1"/></svg>`,
  wire_joint: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6" fill="#2196f3" stroke="#1565c0" stroke-width="2"/></svg>`,
};

export class LoadingScene extends BaseScene {
  private sceneManager: SceneManager;
  private assetLoader: AssetLoader;
  private progress: number = 0;
  private loadCompleted: boolean = false;
  private fadeAlpha: number = 0;
  private elapsed: number = 0;
  private logoPulse: number = 0;

  constructor(eventBus: EventBus, sceneManager: SceneManager, assetLoader: AssetLoader) {
    super('loading', eventBus);
    this.sceneManager = sceneManager;
    this.assetLoader = assetLoader;
  }

  enter(): void {
    this.progress = 0;
    this.loadCompleted = false;
    this.fadeAlpha = 0;
    this.elapsed = 0;
    this.startLoading();
  }

  private async startLoading(): Promise<void> {
    try {
      const manifest: any = { json: LOAD_TASKS };
      await this.assetLoader.load(manifest, (p: LoadProgress) => {
        this.progress = p.percent;
        this.logger.info(`加载进度: ${p.percent.toFixed(0)}% - ${p.currentKey ?? ''}`);
      });

      this.generateComponentPreviews();
      this.progress = 100;
      this.loadCompleted = true;
      this.logger.info('资源加载完成');
    } catch (error) {
      this.logger.warn('部分资源加载失败，使用默认配置', error);
      this.progress = 100;
      this.loadCompleted = true;
    }
  }

  private generateComponentPreviews(): void {
    for (const [type, svg] of Object.entries(COMPONENT_PREVIEWS)) {
      const base64 = btoa(unescape(encodeURIComponent(svg)));
      const dataUrl = `data:image/svg+xml;base64,${base64}`;
      (this.assetLoader as any).cache?.set(`preview_${type}`, dataUrl);
    }
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.logoPulse += dt * 2;

    if (this.loadCompleted) {
      this.fadeAlpha += dt * 2;
      if (this.fadeAlpha >= 1) {
        this.sceneManager.replace('main_menu');
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    this.drawGridBackground(ctx);

    const logoSize = 120 + Math.sin(this.logoPulse) * 8;
    this.drawLogo(ctx, w / 2, h / 2 - 80, logoSize);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('电路沙盒', w / 2, h / 2 + 10);

    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const tips = [
      '正在加载游戏资源...',
      '正在生成元件预览...',
      '正在初始化引擎...',
    ];
    const tipIndex = Math.min(tips.length - 1, Math.floor(this.progress / 34));
    ctx.fillText(tips[tipIndex], w / 2, h / 2 + 40);

    this.drawProgressBar(ctx, w / 2 - 200, h / 2 + 70, 400, 16);

    if (this.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(15, 23, 42, ${this.fadeAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private drawGridBackground(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.lineWidth = 1;
    const gridSize = 40;
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

  private drawLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, 0, size / 2 + 12, 0, Math.PI * 2);
    const glowGradient = ctx.createRadialGradient(0, 0, size / 2, 0, 0, size / 2 + 12);
    glowGradient.addColorStop(0, 'rgba(34, 211, 238, 0.3)');
    glowGradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(-size / 6, -size / 6, 0, 0, 0, size / 2);
    gradient.addColorStop(0, '#22d3ee');
    gradient.addColorStop(1, '#0891b2');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-size / 4, -size / 5);
    ctx.lineTo(size / 8, -size / 5);
    ctx.lineTo(-size / 10, size / 10);
    ctx.lineTo(size / 4, size / 10);
    ctx.stroke();

    ctx.restore();
  }

  private drawProgressBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();

    const fillW = (w - 4) * (this.progress / 100);
    const progressGradient = ctx.createLinearGradient(x, y, x + w, y);
    progressGradient.addColorStop(0, '#22d3ee');
    progressGradient.addColorStop(1, '#a855f7');
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, fillW, h - 4, 6);
    ctx.fill();

    ctx.fillStyle = this.progress > 50 ? '#0f172a' : '#e2e8f0';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(this.progress)}%`, x + w / 2, y + h / 2);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.stroke();
  }
}
