import '../styles/global.css';

export interface LevelInfo {
  id: string;
  title: string;
  subtitle?: string;
  chapterId: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  stars: 0 | 1 | 2 | 3;
  unlocked: boolean;
  completed: boolean;
  bestScore?: number;
}

export interface ChapterInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface LevelSelectCallbacks {
  onSelect: (levelId: string) => void;
  onBack: () => void;
}

const CHAPTERS: ChapterInfo[] = [
  { id: 'ch1', name: '基础电路', icon: '🔋', color: '#06B6D4' },
  { id: 'ch2', name: '电阻网络', icon: '⚡', color: '#F59E0B' },
  { id: 'ch3', name: '电容电感', icon: '📡', color: '#A855F7' },
  { id: 'ch4', name: '复杂电路', icon: '🧠', color: '#10B981' },
  { id: 'ch5', name: '创新挑战', icon: '🚀', color: '#EC4899' },
];

export class LevelSelectUI {
  readonly element: HTMLElement;
  private callbacks: LevelSelectCallbacks;
  private chapters: ChapterInfo[];
  private levels: LevelInfo[];
  private activeChapterId: string;

  constructor(
    container: HTMLElement,
    callbacks: LevelSelectCallbacks,
    levels: LevelInfo[] = [],
    chapters: ChapterInfo[] = CHAPTERS
  ) {
    this.callbacks = callbacks;
    this.chapters = chapters;
    this.levels = levels.length > 0 ? levels : this.generateSampleLevels();
    this.activeChapterId = this.chapters[0]?.id ?? 'ch1';

    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: absolute;
      inset: 0;
      z-index: 50;
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(ellipse 60% 40% at 20% 0%, rgba(6, 182, 212, 0.1), transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 100%, rgba(168, 85, 247, 0.08), transparent 60%),
        #0F172A;
    `;

    this.build();
    if (container !== this.element.parentElement) {
      container.appendChild(this.element);
    }
  }

  private generateSampleLevels(): LevelInfo[] {
    const levels: LevelInfo[] = [];
    const chapterLevels = [6, 6, 6, 6, 6];
    const titles = [
      ['点亮第一个灯泡', '认识电池', '串联电路', '并联初探', '开关的作用', '欧姆定律'],
      ['电阻串联', '电阻并联', '分压电路', '电桥平衡', '复杂网络', '最大功率'],
      ['电容充电', 'RC时间常数', '滤波电路', '谐振初探', 'LC振荡', '耦合电路'],
      ['基尔霍夫', '节点电压', '戴维南', '诺顿等效', '叠加定理', '互易定理'],
      ['创意灯阵', '定时电路', '报警装置', '传感器', '无线传输', '终极挑战'],
    ];

    for (let ci = 0; ci < chapterLevels.length; ci++) {
      const chId = `ch${ci + 1}`;
      for (let li = 0; li < chapterLevels[ci]; li++) {
        const globalIdx = ci * 6 + li;
        const unlocked = globalIdx < 14;
        const completed = unlocked && globalIdx < 11;
        const stars = completed ? (globalIdx < 8 ? 3 : globalIdx < 10 ? 2 : 1) : 0;
        levels.push({
          id: `L${ci + 1}-${li + 1}`,
          title: titles[ci][li],
          chapterId: chId,
          difficulty: (Math.min(5, ci + 1) as 1 | 2 | 3 | 4 | 5),
          stars: stars as 0 | 1 | 2 | 3,
          unlocked,
          completed,
          bestScore: completed ? 1000 - globalIdx * 50 + Math.floor(Math.random() * 100) : undefined,
        });
      }
    }
    return levels;
  }

  private build(): void {
    const header = document.createElement('div');
    header.style.cssText = `
      flex-shrink: 0;
      padding: 28px 32px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    header.innerHTML = `
      <button class="btn btn-secondary btn-icon" data-back title="返回主菜单">
        <span style="font-size:18px;">←</span>
      </button>
      <div style="text-align:center;">
        <h2 style="
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--text-primary);
          margin-bottom: 4px;
        ">关卡选择</h2>
        <p style="font-size:13px;color:#64748B;">选择章节，开启你的电路之旅</p>
      </div>
      <div style="width:44px;"></div>
    `;
    header.querySelector('[data-back]')!.addEventListener('click', () => this.callbacks.onBack());
    this.element.appendChild(header);

    const tabsWrap = document.createElement('div');
    tabsWrap.style.cssText = `
      flex-shrink: 0;
      padding: 24px 32px 16px;
      overflow-x: auto;
    `;
    const tabs = document.createElement('div');
    tabs.style.cssText = `
      display: inline-flex;
      gap: 8px;
      padding: 6px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--border-light);
      border-radius: 14px;
      backdrop-filter: blur(8px);
    `;
    this.chapters.forEach((ch) => {
      const tab = document.createElement('button');
      tab.dataset.chapter = ch.id;
      tab.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        color: #94A3B8;
        transition: all 200ms ease;
        white-space: nowrap;
        ${ch.id === this.activeChapterId ? `background: ${ch.color}22; color: ${ch.color}; box-shadow: inset 0 0 0 1px ${ch.color}55;` : ''}
      `;
      tab.innerHTML = `<span style="font-size:16px;">${ch.icon}</span><span>${ch.name}</span>`;
      tab.addEventListener('click', () => {
        this.activeChapterId = ch.id;
        tabs.querySelectorAll('button').forEach((b: any) => {
          const cid = b.dataset.chapter;
          const c = this.chapters.find((x) => x.id === cid)!;
          if (cid === ch.id) {
            b.style.background = `${c.color}22`;
            b.style.color = c.color;
            b.style.boxShadow = `inset 0 0 0 1px ${c.color}55`;
          } else {
            b.style.background = 'transparent';
            b.style.color = '#94A3B8';
            b.style.boxShadow = 'none';
          }
        });
        this.renderGrid();
      });
      tabs.appendChild(tab);
    });
    tabsWrap.appendChild(tabs);
    this.element.appendChild(tabsWrap);

    const gridContainer = document.createElement('div');
    gridContainer.style.cssText = `
      flex: 1;
      min-height: 0;
      padding: 8px 32px 32px;
      overflow-y: auto;
    `;
    this.gridContainer = gridContainer;
    this.element.appendChild(gridContainer);

    const footer = document.createElement('div');
    footer.style.cssText = `
      flex-shrink: 0;
      padding: 0 32px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    const totalCompleted = this.levels.filter((l) => l.completed).length;
    const totalStars = this.levels.reduce((s, l) => s + l.stars, 0);
    const maxStars = this.levels.length * 3;
    footer.innerHTML = `
      <div class="badge badge-info" style="font-size:12px;padding:6px 14px;">
        <span>📊</span>
        <span>进度 ${totalCompleted}/${this.levels.length}</span>
      </div>
      <div class="badge badge-warning" style="font-size:12px;padding:6px 14px;">
        <span>⭐</span>
        <span>星星 ${totalStars}/${maxStars}</span>
      </div>
      <button class="btn btn-secondary" data-back-bottom>
        <span>←</span><span>返回主菜单</span>
      </button>
    `;
    footer.querySelector('[data-back-bottom]')!.addEventListener('click', () => this.callbacks.onBack());
    this.element.appendChild(footer);

    this.renderGrid();
  }

  private gridContainer!: HTMLElement;

  private renderGrid(): void {
    this.gridContainer.innerHTML = '';
    const chapterLevels = this.levels.filter((l) => l.chapterId === this.activeChapterId);
    const ch = this.chapters.find((c) => c.id === this.activeChapterId);
    const color = ch?.color ?? '#06B6D4';

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      max-width: 1200px;
      margin: 0 auto;
    `;

    chapterLevels.forEach((level, idx) => {
      grid.appendChild(this.createLevelCard(level, idx, color));
    });

    this.gridContainer.appendChild(grid);
  }

  private createLevelCard(level: LevelInfo, index: number, accent: string): HTMLElement {
    const el = document.createElement('div');
    el.className = level.unlocked ? '' : 'card-locked';
    el.style.cssText = `
      position: relative;
      padding: 22px 20px 18px;
      border-radius: 16px;
      cursor: ${level.unlocked ? 'pointer' : 'not-allowed'};
      background: ${level.unlocked
        ? `linear-gradient(160deg, rgba(51, 65, 85, 0.55), rgba(30, 41, 59, 0.5))`
        : 'rgba(30, 41, 59, 0.4)'};
      border: 1px solid ${level.unlocked ? `var(--border-medium)` : 'var(--border-light)'};
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
      opacity: 0;
      transform: translateY(12px);
      animation: lv-in 400ms ${index * 50}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      ${level.completed ? `box-shadow: inset 0 0 0 1px ${accent}44;` : ''}
    `;

    const top = document.createElement('div');
    top.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;';
    top.innerHTML = `
      <div style="
        width: 44px; height: 44px; border-radius: 12px;
        display:flex;align-items:center;justify-content:center;
        font-family: var(--font-display); font-weight: 800; font-size: 18px;
        background: ${level.unlocked ? `${accent}22` : 'rgba(100, 116, 139, 0.2)'};
        color: ${level.unlocked ? accent : '#475569'};
        border: 1px solid ${level.unlocked ? `${accent}55` : 'var(--border-light)'};
      ">${level.id.split('-')[1]}</div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <div style="display:flex;gap:2px;">
          ${Array.from({ length: level.difficulty }, () => `<span style="font-size:10px;color:${accent};">◆</span>`).join('')}
          ${Array.from({ length: 5 - level.difficulty }, () => `<span style="font-size:10px;color:#334155;">◆</span>`).join('')}
        </div>
        ${level.completed ? `<span class="badge badge-success" style="font-size:10px;padding:2px 8px;">已通关</span>` : ''}
      </div>
    `;
    el.appendChild(top);

    const title = document.createElement('div');
    title.style.cssText = `
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: 700;
      color: ${level.unlocked ? 'var(--text-primary)' : '#475569'};
      margin-bottom: 6px;
      letter-spacing: 0.02em;
    `;
    title.textContent = level.title;
    el.appendChild(title);

    if (level.subtitle) {
      const sub = document.createElement('div');
      sub.style.cssText = 'font-size:12px;color:#64748B;margin-bottom:12px;line-height:1.5;';
      sub.textContent = level.subtitle;
      el.appendChild(sub);
    } else {
      const spacer = document.createElement('div');
      spacer.style.height = '2px';
      el.appendChild(spacer);
    }

    const starsWrap = document.createElement('div');
    starsWrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:14px;border-top:1px solid var(--border-light);';

    const stars = document.createElement('div');
    stars.style.cssText = 'display:inline-flex;gap:3px;';
    for (let i = 0; i < 3; i++) {
      const filled = i < level.stars;
      stars.innerHTML += `<span style="font-size:18px;${filled ? '' : 'filter:grayscale(1);opacity:0.35;'}">★</span>`;
    }
    starsWrap.appendChild(stars);

    const rightInfo = document.createElement('div');
    rightInfo.style.cssText = 'text-align:right;';
    if (level.unlocked) {
      if (level.bestScore) {
        rightInfo.innerHTML = `
          <div style="font-size:10px;color:#64748B;">最高分</div>
          <div style="font-family:var(--font-body);font-size:13px;font-weight:700;color:${accent};">${level.bestScore}</div>
        `;
      } else {
        rightInfo.innerHTML = `
          <div style="font-size:11px;font-weight:600;color:${accent};">▶ 开始挑战</div>
        `;
      }
    } else {
      rightInfo.innerHTML = `<span style="font-size:18px;">🔒</span>`;
    }
    starsWrap.appendChild(rightInfo);
    el.appendChild(starsWrap);

    if (level.unlocked) {
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'translateY(-3px) scale(1.01)';
        el.style.borderColor = accent;
        el.style.boxShadow = `0 12px 32px ${accent}28`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.borderColor = 'var(--border-medium)';
        el.style.boxShadow = level.completed ? `inset 0 0 0 1px ${accent}44` : 'none';
      });
      el.addEventListener('click', () => this.callbacks.onSelect(level.id));
    }

    return el;
  }

  setLevels(levels: LevelInfo[]): void {
    this.levels = levels;
    this.renderGrid();
  }

  destroy(): void {
    this.element.remove();
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes lv-in {
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
