import { BaseScene } from './BaseScene';
import { EventBus } from '../core/EventBus';
import { SceneManager } from '../core/SceneManager';
import { SaveSystem } from '../core/SaveSystem';
import { ACHIEVEMENTS, checkAllAchievements, type Achievement, type SaveDataLite } from '../game/data/achievements';
import { createLogger } from '../utils/logger';

export class AchievementScene extends BaseScene {
  private sceneManager: SceneManager;
  private saveSystem: SaveSystem;
  private uiRoot: HTMLElement | null = null;
  private uiContainer: HTMLDivElement | null = null;

  private unlockedIds: Set<string> = new Set();
  private leaderboard: Array<{ name: string; score: number; time: number; date: string; stars: number }> = [];
  private activeTab: 'achievements' | 'leaderboard' = 'achievements';

  protected override logger = createLogger('AchievementScene');

  constructor(
    eventBus: EventBus,
    sceneManager: SceneManager,
    saveSystem: SaveSystem,
    uiRoot?: HTMLElement
  ) {
    super('achievement', eventBus);
    this.sceneManager = sceneManager;
    this.saveSystem = saveSystem;
    if (uiRoot) this.uiRoot = uiRoot;
  }

  enter(): void {
    this.loadData();
    this.buildUI();
  }

  exit(): void {
    this.removeUI();
  }

  update(_dt: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a1628');
    bgGrad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 44;
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
  }

  private loadData(): void {
    try {
      const saveData = this.buildSaveDataLite();
      this.unlockedIds = new Set(checkAllAchievements(saveData));

      const saved = this.saveSystem.get<any[]>('leaderboard');
      if (Array.isArray(saved) && saved.length > 0) {
        this.leaderboard = saved.slice(0, 10);
      } else {
        this.leaderboard = this.generateMockLeaderboard();
      }
    } catch (e) {
      this.logger.error('Failed to load achievement data:', e);
    }
  }

  private buildSaveDataLite(): SaveDataLite {
    const lp = this.saveSystem.get<any>('levelProgress') ?? {};
    const telemetry = this.saveSystem.get<any>('telemetry-sessions') ?? [];
    const levelRecords: Record<string, any> = {};

    const completed: string[] = lp.completed ?? [];
    const starsMap: Record<string, number> = lp.stars ?? {};
    const bestTimeMap: Record<string, number> = lp.bestTime ?? {};
    const leastMistakesMap: Record<string, number> = lp.leastMistakes ?? {};

    for (const id of completed) {
      levelRecords[id] = {
        levelId: id,
        completed: true,
        stars: starsMap[id] ?? 0,
        mistakes: leastMistakesMap[id] ?? 999,
        time: (bestTimeMap[id] ?? 0) / 1000,
        completedAt: Date.now(),
      };
    }

    let totalBulbsLit = 0;
    let totalShortCircuits = 0;
    let resistorsUsed = 0;
    let capacitorsUsed = 0;
    let sandboxComponents = 0;

    for (const session of telemetry) {
      const stats = session?.stats ?? {};
      totalShortCircuits += stats.mistakes ?? 0;
      if (session?.mode === 'sandbox') {
        sandboxComponents += stats.componentsAdded ?? 0;
      }
    }

    totalBulbsLit = completed.length;
    resistorsUsed = completed.length * 2;
    capacitorsUsed = Math.floor(completed.length / 2);

    const perfectLevels = Object.values(levelRecords).filter((r: any) => r.mistakes === 0).length;
    const threeStarLevels = Object.values(levelRecords).filter((r: any) => r.stars >= 3).length;

    return {
      achievements: Array.from(this.unlockedIds),
      levelRecords,
      totalBulbsLit,
      totalShortCircuits,
      resistorsUsed,
      capacitorsUsed,
      perfectLevels,
      levelsCompleted: completed.length,
      threeStarLevels,
      sandboxComponents,
      dailyPlayStreak: 1,
      lastPlayDate: new Date().toISOString().slice(0, 10),
    };
  }

  private generateMockLeaderboard(): Array<{ name: string; score: number; time: number; date: string; stars: number }> {
    const names = ['电路大师', '闪电侠', '电阻王', '欧姆学徒', '伏特加', '安培君', '电容器', '接线员'];
    const arr = [];
    for (let i = 0; i < 8; i++) {
      arr.push({
        name: names[i],
        score: 10000 - i * 900 + Math.floor(Math.random() * 400),
        time: 45 + i * 20 + Math.floor(Math.random() * 30),
        date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
        stars: 3 - Math.min(2, Math.floor(i / 3)),
      });
    }
    return arr;
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
      padding: 24px 32px 16px;
      pointer-events: auto;
    `;

    const backBtn = document.createElement('button');
    backBtn.textContent = '← 返回';
    backBtn.style.cssText = `
      padding: 10px 20px;
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.8);
      color: #fcd34d; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
      backdrop-filter: blur(8px);
    `;
    backBtn.addEventListener('mouseenter', () => {
      backBtn.style.background = 'rgba(251, 191, 36, 0.15)';
      backBtn.style.transform = 'translateX(-2px)';
    });
    backBtn.addEventListener('mouseleave', () => {
      backBtn.style.background = 'rgba(15, 23, 42, 0.8)';
      backBtn.style.transform = 'translateX(0)';
    });
    backBtn.addEventListener('click', () => this.sceneManager.pop());

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      font-size: 28px; font-weight: 700;
      background: linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 1px;
    `;
    titleEl.textContent = '🏆 成就 & 排行榜';

    const statsBadge = document.createElement('div');
    statsBadge.style.cssText = `
      padding: 8px 16px; border-radius: 8px;
      background: rgba(34, 211, 238, 0.1);
      border: 1px solid rgba(34, 211, 238, 0.3);
      color: #22d3ee; font-size: 13px; font-weight: 600;
    `;
    statsBadge.textContent = `已解锁 ${this.unlockedIds.size}/${ACHIEVEMENTS.length}`;

    header.appendChild(backBtn);
    header.appendChild(titleEl);
    header.appendChild(statsBadge);

    const tabs = document.createElement('div');
    tabs.style.cssText = `
      display: flex; gap: 4px; justify-content: center;
      padding: 0 32px 16px; pointer-events: auto;
    `;

    const achTab = document.createElement('button');
    achTab.textContent = '🎖 成就';
    const lbTab = document.createElement('button');
    lbTab.textContent = '📊 排行榜';

    const tabBaseStyle = `
      padding: 10px 28px; font-size: 14px; font-weight: 600;
      border-radius: 10px 10px 0 0; cursor: pointer; transition: all 0.2s;
      font-family: inherit; border: none;
    `;

    const updateTabs = () => {
      if (this.activeTab === 'achievements') {
        achTab.style.cssText = tabBaseStyle + `
          background: rgba(34, 211, 238, 0.15);
          color: #22d3ee;
          border: 1px solid rgba(34, 211, 238, 0.4);
          border-bottom: 2px solid #22d3ee;
        `;
        lbTab.style.cssText = tabBaseStyle + `
          background: rgba(30, 41, 59, 0.5);
          color: #64748b;
          border: 1px solid rgba(100, 116, 139, 0.15);
          border-bottom: none;
        `;
      } else {
        lbTab.style.cssText = tabBaseStyle + `
          background: rgba(168, 85, 247, 0.15);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-bottom: 2px solid #a855f7;
        `;
        achTab.style.cssText = tabBaseStyle + `
          background: rgba(30, 41, 59, 0.5);
          color: #64748b;
          border: 1px solid rgba(100, 116, 139, 0.15);
          border-bottom: none;
        `;
      }
      this.renderContent();
    };

    achTab.addEventListener('click', () => {
      this.activeTab = 'achievements';
      updateTabs();
    });
    lbTab.addEventListener('click', () => {
      this.activeTab = 'leaderboard';
      updateTabs();
    });

    tabs.appendChild(achTab);
    tabs.appendChild(lbTab);

    this.contentContainer = document.createElement('div');
    this.contentContainer.style.cssText = `
      flex: 1; overflow-y: auto; padding: 0 32px 32px;
      pointer-events: auto; margin: 0 32px 32px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(100, 116, 139, 0.15);
      border-radius: 0 16px 16px 16px;
      backdrop-filter: blur(10px);
    `;

    this.uiContainer.appendChild(header);
    this.uiContainer.appendChild(tabs);
    this.uiContainer.appendChild(this.contentContainer);

    this.uiRoot.appendChild(this.uiContainer);
    updateTabs();
  }

  private contentContainer: HTMLDivElement | null = null;

  private renderContent(): void {
    if (!this.contentContainer) return;
    this.contentContainer.innerHTML = '';

    if (this.activeTab === 'achievements') {
      this.renderAchievements();
    } else {
      this.renderLeaderboard();
    }
  }

  private renderAchievements(): void {
    if (!this.contentContainer) return;

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px; padding: 20px 0;
    `;

    for (const ach of ACHIEVEMENTS) {
      const unlocked = this.unlockedIds.has(ach.id);
      const card = document.createElement('div');
      card.style.cssText = `
        padding: 20px; border-radius: 14px;
        background: ${unlocked ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(245, 158, 11, 0.04))' : 'rgba(30, 41, 59, 0.4)'};
        border: 1px solid ${unlocked ? 'rgba(251, 191, 36, 0.35)' : 'rgba(100, 116, 139, 0.15)'};
        transition: all 0.25s; cursor: pointer;
        position: relative; overflow: hidden;
      `;
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = unlocked ? '0 8px 24px rgba(251, 191, 36, 0.15)' : '0 8px 24px rgba(0, 0, 0, 0.3)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      });

      const icon = document.createElement('div');
      icon.style.cssText = `
        font-size: 36px; margin-bottom: 12px;
        filter: ${unlocked ? 'none' : 'grayscale(1) opacity(0.4)'};
      `;
      icon.textContent = unlocked ? ach.icon : '🔒';

      const name = document.createElement('div');
      name.style.cssText = `
        font-size: 15px; font-weight: 700;
        color: ${unlocked ? '#fef3c7' : '#64748b'};
        margin-bottom: 6px;
      `;
      name.textContent = ach.name;

      const desc = document.createElement('div');
      desc.style.cssText = `
        font-size: 12px; line-height: 1.5;
        color: ${unlocked ? '#94a3b8' : '#475569'};
        margin-bottom: 12px;
      `;
      desc.textContent = ach.desc;

      const progWrap = document.createElement('div');
      progWrap.style.cssText = `
        height: 6px; border-radius: 3px;
        background: rgba(100, 116, 139, 0.2);
        overflow: hidden;
      `;
      const prog = this.getProgress(ach);
      const progBar = document.createElement('div');
      progBar.style.cssText = `
        height: 100%; width: ${prog.pct}%;
        background: ${unlocked ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : 'linear-gradient(90deg, #38bdf8, #0ea5e9)'};
        border-radius: 3px; transition: width 0.5s;
      `;
      progWrap.appendChild(progBar);

      const progText = document.createElement('div');
      progText.style.cssText = `
        font-size: 11px; color: #64748b; margin-top: 6px;
        text-align: right;
      `;
      progText.textContent = unlocked ? '✓ 已完成' : `${prog.current}/${prog.target}`;

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(progWrap);
      card.appendChild(progText);
      grid.appendChild(card);
    }

    this.contentContainer.appendChild(grid);
  }

  private getProgress(ach: Achievement): { current: number; target: number; pct: number } {
    const sd = this.buildSaveDataLite();
    let current = 0;
    let target = 1;
    switch (ach.id) {
      case 'first_bulb':
        current = Math.min(sd.totalBulbsLit ?? 0, 1); target = 1; break;
      case 'three_bulbs':
        current = Math.min(sd.totalBulbsLit ?? 0, 3); target = 3; break;
      case 'flawless': {
        const records = Object.values(sd.levelRecords ?? {});
        current = Math.min(records.filter((r: any) => r.completed && r.mistakes === 0).length, 1);
        target = 1; break;
      }
      case 'resistor_artist':
        current = Math.min(sd.resistorsUsed ?? 0, 20); target = 20; break;
      case 'capacitor_pioneer':
        current = Math.min(sd.capacitorsUsed ?? 0, 1); target = 1; break;
      case 'zero_mistake_master':
        current = Math.min(sd.perfectLevels ?? 0, 5); target = 5; break;
      case 'speed_runner': {
        const records = Object.values(sd.levelRecords ?? {});
        current = records.some((r: any) => r.completed && r.time > 0 && r.time < 30) ? 1 : 0;
        target = 1; break;
      }
      case 'sandbox_architect':
        current = Math.min(sd.sandboxComponents ?? 0, 50); target = 50; break;
      case 'three_day_streak':
        current = Math.min(sd.dailyPlayStreak ?? 0, 3); target = 3; break;
      case 'perfectionist':
        current = Math.min(sd.threeStarLevels ?? 0, 5); target = 5; break;
      case 'explorer':
        current = Math.min(sd.levelsCompleted ?? 0, 10); target = 10; break;
      case 'short_circuit_researcher':
        current = Math.min(sd.totalShortCircuits ?? 0, 10); target = 10; break;
    }
    const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    return { current, target, pct };
  }

  private renderLeaderboard(): void {
    if (!this.contentContainer) return;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding: 20px 0;';

    const table = document.createElement('div');
    table.style.cssText = `
      border-radius: 12px; overflow: hidden;
      border: 1px solid rgba(100, 116, 139, 0.15);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: grid;
      grid-template-columns: 60px 1fr 100px 100px 80px 120px;
      padding: 14px 20px;
      background: rgba(168, 85, 247, 0.1);
      font-size: 12px; font-weight: 600; color: #a855f7;
      letter-spacing: 0.5px;
    `;
    header.innerHTML = `<div>排名</div><div>玩家</div><div style="text-align:right;">分数</div><div style="text-align:right;">用时</div><div style="text-align:center;">星级</div><div style="text-align:right;">日期</div>`;
    table.appendChild(header);

    this.leaderboard.forEach((entry, idx) => {
      const row = document.createElement('div');
      const isTop3 = idx < 3;
      row.style.cssText = `
        display: grid;
        grid-template-columns: 60px 1fr 100px 100px 80px 120px;
        padding: 16px 20px;
        background: ${isTop3 ? (idx === 0 ? 'rgba(251, 191, 36, 0.06)' : idx === 1 ? 'rgba(148, 163, 184, 0.06)' : 'rgba(180, 83, 9, 0.06)') : 'transparent'};
        border-top: 1px solid rgba(100, 116, 139, 0.1);
        font-size: 13px; color: #e2e8f0;
        transition: background 0.15s;
        align-items: center;
      `;
      row.addEventListener('mouseenter', () => {
        row.style.background = 'rgba(34, 211, 238, 0.06)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = isTop3 ? (idx === 0 ? 'rgba(251, 191, 36, 0.06)' : idx === 1 ? 'rgba(148, 163, 184, 0.06)' : 'rgba(180, 83, 9, 0.06)') : 'transparent';
      });

      const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
      const mins = Math.floor(entry.time / 60);
      const secs = Math.floor(entry.time % 60);
      const starStr = '⭐'.repeat(entry.stars) + '☆'.repeat(Math.max(0, 3 - entry.stars));

      row.innerHTML = `
        <div style="font-size:${isTop3 ? '20px' : '14px'};font-weight:${isTop3 ? '700' : '400'};color:${isTop3 ? 'inherit' : '#64748b'};">${rankEmoji}</div>
        <div style="font-weight:600;">${entry.name}</div>
        <div style="text-align:right;font-weight:700;color:#a855f7;">${entry.score.toLocaleString()}</div>
        <div style="text-align:right;color:#94a3b8;">${mins}:${String(secs).padStart(2, '0')}</div>
        <div style="text-align:center;font-size:12px;">${starStr}</div>
        <div style="text-align:right;color:#64748b;font-size:12px;">${entry.date}</div>
      `;
      table.appendChild(row);
    });

    wrap.appendChild(table);

    const tip = document.createElement('div');
    tip.style.cssText = `
      margin-top: 20px; padding: 14px 18px;
      border-radius: 10px;
      background: rgba(34, 211, 238, 0.06);
      border: 1px solid rgba(34, 211, 238, 0.2);
      font-size: 12px; color: #67e8f9; line-height: 1.6;
    `;
    tip.innerHTML = `
      💡 <strong>提示</strong>：排行榜数据存储在本地浏览器中。通关关卡后会自动记录你的最佳成绩，分数 = 星星×1000 + 时间奖励 - 失误惩罚。
    `;
    wrap.appendChild(tip);

    this.contentContainer.appendChild(wrap);
  }

  private removeUI(): void {
    if (this.uiContainer && this.uiRoot) {
      this.uiRoot.removeChild(this.uiContainer);
      this.uiContainer = null;
      this.contentContainer = null;
    }
  }
}
