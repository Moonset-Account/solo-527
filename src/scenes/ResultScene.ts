import { BaseScene } from './BaseScene';
import { EventBus } from '../core/EventBus';
import { SceneManager } from '../core/SceneManager';
import { SaveSystem } from '../core/SaveSystem';
import { Telemetry } from '../core/Telemetry';
import { createLogger } from '../utils/logger';

export interface ResultPayload {
  mode: 'level' | 'sandbox' | 'daily';
  levelId?: string;
  levelName?: string;
  stars: number;
  maxStars?: number;
  timeMs: number;
  goalsCompleted: number;
  totalGoals: number;
  mistakes: number;
  componentsUsed: number;
  wiresUsed: number;
  score?: number;
  newUnlocks?: string[];
  newAchievements?: string[];
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
}

export class ResultScene extends BaseScene {
  private sceneManager: SceneManager;
  private saveSystem: SaveSystem;
  private telemetry: Telemetry;
  private uiRoot: HTMLElement | null = null;
  private uiContainer: HTMLDivElement | null = null;
  private payload: ResultPayload | null = null;

  private confetti: ConfettiParticle[] = [];
  private enterTime: number = 0;
  private starsPulse: number = 0;

  private static readonly CONFETTI_COLORS = [
    '#22d3ee', '#a855f7', '#f472b6', '#fbbf24',
    '#4ade80', '#f87171', '#60a5fa', '#fb923c',
  ];

  protected override logger = createLogger('ResultScene');

  constructor(
    eventBus: EventBus,
    sceneManager: SceneManager,
    saveSystem: SaveSystem,
    telemetry: Telemetry,
    uiRoot?: HTMLElement
  ) {
    super('result', eventBus);
    this.sceneManager = sceneManager;
    this.saveSystem = saveSystem;
    this.telemetry = telemetry;
    if (uiRoot) this.uiRoot = uiRoot;
  }

  enter(payload?: ResultPayload): void {
    this.payload = payload ?? null;
    this.enterTime = 0;
    this.confetti = [];
    this.starsPulse = 0;
    this.spawnConfetti((payload?.stars ?? 0) >= 2 ? 120 : 60);
    this.buildUI();
    this.updateProgress();
  }

  exit(): void {
    this.removeUI();
  }

  update(dt: number): void {
    this.enterTime += dt;
    this.starsPulse += dt * 3;

    const alive: ConfettiParticle[] = [];
    for (const p of this.confetti) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 380 * dt;
      p.rotation += p.rotSpeed * dt;
      p.vx *= 0.995;
      alive.push(p);
    }
    this.confetti = alive;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    const bgGrad = ctx.createRadialGradient(w / 2, h / 3, 50, w / 2, h / 2, Math.max(w, h));
    bgGrad.addColorStop(0, '#1a1a3e');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    this.drawConfetti(ctx);
  }

  private spawnConfetti(count: number): void {
    for (let i = 0; i < count; i++) {
      const cx = this.width / 2 + (Math.random() - 0.5) * 200;
      const cy = this.height / 3;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.7;
      const speed = 200 + Math.random() * 350;
      this.confetti.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: ResultScene.CONFETTI_COLORS[Math.floor(Math.random() * ResultScene.CONFETTI_COLORS.length)],
        size: 4 + Math.random() * 8,
        life: 2.5 + Math.random() * 2,
        maxLife: 4.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }
  }

  private drawConfetti(ctx: CanvasRenderingContext2D): void {
    for (const p of this.confetti) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
  }

  private formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  private calcScore(): number {
    if (!this.payload) return 0;
    const { stars, timeMs, mistakes, goalsCompleted, totalGoals } = this.payload;
    const starScore = stars * 500;
    const timeBonus = Math.max(0, 300000 - timeMs) / 100;
    const goalRatio = totalGoals > 0 ? goalsCompleted / totalGoals : 0;
    const goalScore = goalRatio * 800;
    const mistakePenalty = mistakes * 50;
    return Math.max(0, Math.floor(starScore + goalScore + timeBonus - mistakePenalty));
  }

  private updateProgress(): void {
    if (!this.payload || this.payload.mode !== 'level' || !this.payload.levelId) return;
    try {
      const key = 'levelProgress';
      const existing = this.saveSystem.get<any>(key) ?? { completed: [], stars: {}, bestTime: {}, leastMistakes: {}, attempts: {} };
      const levelId = this.payload.levelId;

      if (!existing.completed.includes(levelId)) {
        existing.completed.push(levelId);
      }
      existing.stars[levelId] = Math.max(existing.stars[levelId] ?? 0, this.payload.stars);
      existing.bestTime[levelId] = Math.min(existing.bestTime[levelId] ?? Infinity, this.payload.timeMs);
      existing.leastMistakes[levelId] = Math.min(existing.leastMistakes[levelId] ?? Infinity, this.payload.mistakes);
      existing.attempts[levelId] = (existing.attempts[levelId] ?? 0) + 1;

      this.saveSystem.set(key, existing);
    } catch (e) {
      this.logger.error('Failed to save progress:', e);
    }
  }

  private buildUI(): void {
    if (!this.uiRoot || !this.payload) return;

    this.uiContainer = document.createElement('div');
    this.uiContainer.style.cssText = `
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      pointer-events: none; z-index: 10;
      font-family: 'JetBrains Mono', monospace;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      pointer-events: auto;
      width: min(560px, 92vw);
      padding: 40px 36px 32px;
      border-radius: 24px;
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.95));
      backdrop-filter: blur(16px);
      border: 1px solid rgba(34, 211, 238, 0.2);
      box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(34, 211, 238, 0.08);
      position: relative;
      overflow: hidden;
    `;

    const shine = document.createElement('div');
    shine.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, #22d3ee, #a855f7, transparent);
      opacity: 0.7;
    `;
    card.appendChild(shine);

    const modeLabel = document.createElement('div');
    const modeMap: Record<string, { emoji: string; text: string }> = {
      level: { emoji: '🎮', text: '关卡结算' },
      sandbox: { emoji: '🛠', text: '沙盒总结' },
      daily: { emoji: '📅', text: '每日挑战结算' },
    };
    const mode = modeMap[this.payload.mode] ?? modeMap.level;
    modeLabel.style.cssText = `
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px; border-radius: 999px;
      background: rgba(34, 211, 238, 0.12);
      border: 1px solid rgba(34, 211, 238, 0.25);
      color: #22d3ee; font-size: 13px; font-weight: 600;
      margin-bottom: 16px;
    `;
    modeLabel.textContent = `${mode.emoji} ${mode.text}`;
    card.appendChild(modeLabel);

    const title = document.createElement('h1');
    title.textContent = this.payload.levelName ?? '任务完成！';
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 28px; font-weight: 800;
      background: linear-gradient(135deg, #e2e8f0, #94a3b8);
      -webkit-background-clip: text; background-clip: text; color: transparent;
      letter-spacing: 0.5px;
    `;
    card.appendChild(title);

    if (this.payload.levelId) {
      const sub = document.createElement('div');
      sub.textContent = `关卡 ID: ${this.payload.levelId.toUpperCase()}`;
      sub.style.cssText = 'font-size: 12px; color: #64748b; margin-bottom: 24px;';
      card.appendChild(sub);
    } else {
      card.appendChild(document.createElement('div')).style.cssText = 'height: 24px;';
    }

    const starsWrap = document.createElement('div');
    starsWrap.style.cssText = 'display: flex; justify-content: center; gap: 18px; margin-bottom: 28px;';
    const maxStars = this.payload.maxStars ?? 3;
    for (let i = 0; i < maxStars; i++) {
      const starEl = document.createElement('div');
      const filled = i < this.payload.stars;
      const size = 56;
      const delay = 0.3 + i * 0.15;
      starEl.style.cssText = `
        width: ${size}px; height: ${size}px;
        display: flex; align-items: center; justify-content: center;
        font-size: ${size}px;
        opacity: 0; transform: scale(0.4) rotate(-30deg);
        animation: starPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards;
        filter: ${filled ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'grayscale(1) opacity(0.3)'};
      `;
      starEl.textContent = filled ? '⭐' : '☆';
      starsWrap.appendChild(starEl);
    }
    card.appendChild(starsWrap);

    const score = this.calcScore();
    const scoreRow = document.createElement('div');
    scoreRow.style.cssText = `
      text-align: center; margin-bottom: 24px;
      padding: 16px; border-radius: 12px;
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(168, 85, 247, 0.08));
      border: 1px solid rgba(34, 211, 238, 0.15);
    `;
    scoreRow.innerHTML = `
      <div style="font-size:11px;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">总分 Score</div>
      <div style="font-size:40px;font-weight:900;background:linear-gradient(135deg,#22d3ee,#a855f7);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1.1;">
        ${score.toLocaleString()}
      </div>
    `;
    card.appendChild(scoreRow);

    const stats = document.createElement('div');
    stats.style.cssText = `
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 12px; margin-bottom: 24px;
    `;
    const statItems = [
      { label: '用时', value: this.formatTime(this.payload.timeMs), icon: '⏱', color: '#38bdf8' },
      { label: '失误', value: String(this.payload.mistakes), icon: '⚠️', color: this.payload.mistakes === 0 ? '#4ade80' : '#fbbf24' },
      { label: '目标', value: `${this.payload.goalsCompleted}/${this.payload.totalGoals}`, icon: '🎯', color: '#a855f7' },
      { label: '元件', value: String(this.payload.componentsUsed), icon: '🧩', color: '#f472b6' },
      { label: '连线', value: String(this.payload.wiresUsed), icon: '🔗', color: '#22d3ee' },
      { label: '星级', value: `${this.payload.stars}/${maxStars}`, icon: '⭐', color: '#fbbf24' },
    ];
    for (const s of statItems) {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 12px 10px; border-radius: 10px;
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(100, 116, 139, 0.15);
        text-align: center;
      `;
      item.innerHTML = `
        <div style="font-size:18px;margin-bottom:4px;">${s.icon}</div>
        <div style="font-size:18px;font-weight:700;color:${s.color};line-height:1.1;">${s.value}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px;letter-spacing:0.5px;">${s.label}</div>
      `;
      stats.appendChild(item);
    }
    card.appendChild(stats);

    if (this.payload.newUnlocks?.length || this.payload.newAchievements?.length) {
      const unlocks = document.createElement('div');
      unlocks.style.cssText = `
        padding: 12px 16px; border-radius: 10px; margin-bottom: 24px;
        background: rgba(74, 222, 128, 0.08);
        border: 1px solid rgba(74, 222, 128, 0.25);
        color: #86efac; font-size: 13px; line-height: 1.6;
      `;
      let txt = '🎉 解锁内容：';
      const parts: string[] = [];
      if (this.payload.newUnlocks?.length) parts.push(`新元件/关卡 × ${this.payload.newUnlocks.length}`);
      if (this.payload.newAchievements?.length) parts.push(`成就 × ${this.payload.newAchievements.length}`);
      unlocks.textContent = txt + parts.join('，');
      card.appendChild(unlocks);
    }

    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex; gap: 12px;
    `;

    const nextBtn = this.createButton(
      this.payload.mode === 'level' ? '下一关 →' : '再来一次 ↻',
      'linear-gradient(135deg, #06b6d4, #0891b2)',
      'rgba(6, 182, 212, 0.5)',
      true
    );
    nextBtn.addEventListener('click', () => {
      if (this.payload?.mode === 'level') {
        this.sceneManager.replace('level_select');
      } else {
        const p = this.payload;
        this.sceneManager.replace('game', { mode: p?.mode, levelId: p?.levelId, date: new Date().toISOString().slice(0, 10) });
      }
    });

    const retryBtn = this.createButton('重玩本关', 'rgba(15, 23, 42, 0.8)', 'rgba(148, 163, 184, 0.3)');
    retryBtn.addEventListener('click', () => {
      const p = this.payload;
      this.sceneManager.replace('game', { mode: p?.mode ?? 'level', levelId: p?.levelId });
    });

    const backBtn = this.createButton('返回菜单', 'rgba(15, 23, 42, 0.8)', 'rgba(100, 116, 139, 0.3)');
    backBtn.addEventListener('click', () => {
      this.sceneManager.replace('main_menu');
    });

    actions.appendChild(backBtn);
    actions.appendChild(retryBtn);
    actions.appendChild(nextBtn);
    card.appendChild(actions);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes starPop {
        0% { opacity: 0; transform: scale(0.3) rotate(-60deg) translateY(20px); }
        60% { transform: scale(1.2) rotate(8deg); }
        100% { opacity: 1; transform: scale(1) rotate(0) translateY(0); }
      }
    `;

    this.uiContainer.appendChild(style);
    this.uiContainer.appendChild(card);
    this.uiRoot.appendChild(this.uiContainer);
  }

  private createButton(text: string, bg: string, border: string, primary: boolean = false): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      flex: 1;
      padding: 14px 16px;
      border: 1px solid ${border};
      border-radius: 12px;
      background: ${bg};
      color: ${primary ? '#f8fafc' : '#e2e8f0'};
      font-size: 14px; font-weight: ${primary ? '700' : '600'};
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 0.5px;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.filter = 'brightness(1.15)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.filter = 'brightness(1)';
    });
    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'translateY(0) scale(0.98)';
    });
    return btn;
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
}
