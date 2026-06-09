import '../styles/global.css';

export interface MainMenuCallbacks {
  onNavigate: (sceneId: string) => void;
}

interface MenuCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: 'cyan' | 'amber' | 'green' | 'red' | 'indigo' | 'purple';
  badge?: string;
}

const MENU_CARDS: MenuCard[] = [
  { id: 'levels', title: '关卡模式', subtitle: '循序渐进学电路', icon: '🎯', accent: 'cyan', badge: '30 关' },
  { id: 'sandbox', title: '自由实验室', subtitle: '无限制电路搭建', icon: '⚡', accent: 'amber', badge: '沙盒' },
  { id: 'daily', title: '每日挑战', subtitle: '今日特殊谜题', icon: '📅', accent: 'green', badge: 'NEW' },
  { id: 'achievements', title: '成就系统', subtitle: '收集你的徽章', icon: '🏆', accent: 'indigo' },
  { id: 'leaderboard', title: '排行榜', subtitle: '与全球玩家竞技', icon: '📊', accent: 'purple' },
  { id: 'settings', title: '游戏设置', subtitle: '个性化你的体验', icon: '⚙', accent: 'red' },
];

const ACCENT_MAP: Record<MenuCard['accent'], { border: string; bg: string; text: string; shadow: string }> = {
  cyan: {
    border: 'rgba(6, 182, 212, 0.5)',
    bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(8, 145, 178, 0.06))',
    text: '#22D3EE',
    shadow: '0 8px 32px rgba(6, 182, 212, 0.2)',
  },
  amber: {
    border: 'rgba(245, 158, 11, 0.5)',
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.06))',
    text: '#FBBF24',
    shadow: '0 8px 32px rgba(245, 158, 11, 0.2)',
  },
  green: {
    border: 'rgba(16, 185, 129, 0.5)',
    bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.06))',
    text: '#34D399',
    shadow: '0 8px 32px rgba(16, 185, 129, 0.2)',
  },
  red: {
    border: 'rgba(239, 68, 68, 0.5)',
    bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.06))',
    text: '#F87171',
    shadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
  },
  indigo: {
    border: 'rgba(99, 102, 241, 0.5)',
    bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(79, 70, 229, 0.06))',
    text: '#818CF8',
    shadow: '0 8px 32px rgba(99, 102, 241, 0.2)',
  },
  purple: {
    border: 'rgba(168, 85, 247, 0.5)',
    bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(147, 51, 234, 0.06))',
    text: '#C084FC',
    shadow: '0 8px 32px rgba(168, 85, 247, 0.2)',
  },
};

export class MainMenuUI {
  readonly element: HTMLElement;
  private callbacks: MainMenuCallbacks;

  constructor(container: HTMLElement, callbacks: MainMenuCallbacks) {
    this.callbacks = callbacks;
    this.element = document.createElement('div');
    this.element.className = 'w-full h-full';
    this.element.style.cssText = `
      position: absolute;
      inset: 0;
      overflow-y: auto;
      z-index: 50;
      background:
        radial-gradient(ellipse 80% 60% at 50% 0%, rgba(6, 182, 212, 0.12), transparent 60%),
        radial-gradient(ellipse 60% 50% at 20% 80%, rgba(99, 102, 241, 0.1), transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 70%, rgba(245, 158, 11, 0.08), transparent 60%),
        #0F172A;
    `;

    this.build();

    if (container !== this.element.parentElement) {
      container.appendChild(this.element);
    }
  }

  private build(): void {
    const disclaimer = document.createElement('div');
    disclaimer.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 10;
    `;
    disclaimer.innerHTML = `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        background: rgba(30, 41, 59, 0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(245, 158, 11, 0.35);
        border-radius: 999px;
        font-size: 11px;
        color: #FCD34D;
        font-weight: 600;
        letter-spacing: 0.02em;
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.1);
      ">
        <span>⚠</span>
        <span>教学近似声明 · 仅供学习</span>
      </div>
    `;
    this.element.appendChild(disclaimer);

    const wrapper = document.createElement('div');
    wrapper.className = 'container';
    wrapper.style.cssText = `
      min-height: 100%;
      display: flex;
      flex-direction: column;
      padding: 80px 24px 60px;
    `;

    const hero = document.createElement('div');
    hero.style.cssText = `
      text-align: center;
      margin-bottom: 64px;
    `;
    hero.innerHTML = `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        background: rgba(6, 182, 212, 0.12);
        border: 1px solid rgba(6, 182, 212, 0.3);
        border-radius: 999px;
        font-size: 12px;
        color: #67E8F9;
        font-weight: 600;
        margin-bottom: 24px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      ">
        <span>✦</span>
        <span>v0.1.0 · 教育测试版</span>
        <span>✦</span>
      </div>
      <h1 style="
        font-family: var(--font-display);
        font-size: clamp(44px, 7vw, 84px);
        font-weight: 900;
        line-height: 1.05;
        letter-spacing: 0.04em;
        margin-bottom: 16px;
        background: linear-gradient(135deg, #F1F5F9 0%, #67E8F9 40%, #A78BFA 70%, #F472B6 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        filter: drop-shadow(0 4px 30px rgba(6, 182, 212, 0.3));
      ">
        CIRCUIT SANDBOX
      </h1>
      <p style="
        font-size: clamp(15px, 2vw, 19px);
        color: #94A3B8;
        max-width: 560px;
        margin: 0 auto;
        line-height: 1.7;
      ">
        在沉浸式沙盒世界中学习电路原理 · 从欧姆定律到复杂网络
        <br/>
        <span style="color: #67E8F9; font-weight: 600;">动手搭，亲眼见，真正懂</span>
      </p>
    `;
    wrapper.appendChild(hero);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      max-width: 1080px;
      width: 100%;
      margin: 0 auto;
    `;

    for (let i = 0; i < MENU_CARDS.length; i++) {
      const card = this.createCard(MENU_CARDS[i], i);
      grid.appendChild(card);
    }
    wrapper.appendChild(grid);

    const footer = document.createElement('div');
    footer.style.cssText = `
      margin-top: 64px;
      text-align: center;
      color: #475569;
      font-size: 12px;
    `;
    footer.innerHTML = `
      <p style="margin-bottom: 6px;">© 2026 Circuit Sandbox · 为下一代工程师打造</p>
      <p>电路模拟基于教学简化模型，实际工程请参考专业资料</p>
    `;
    wrapper.appendChild(footer);

    this.element.appendChild(wrapper);
  }

  private createCard(card: MenuCard, index: number): HTMLElement {
    const accent = ACCENT_MAP[card.accent];
    const el = document.createElement('div');
    el.style.cssText = `
      position: relative;
      padding: 28px 24px 24px;
      border-radius: 18px;
      cursor: pointer;
      background: ${accent.bg};
      border: 1px solid ${accent.border};
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
      opacity: 0;
      transform: translateY(16px);
      animation: card-in 500ms ${index * 60}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    `;

    const deco = document.createElement('div');
    deco.style.cssText = `
      position: absolute;
      top: -40px;
      right: -40px;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: radial-gradient(circle, ${accent.text}22, transparent 70%);
      pointer-events: none;
      transition: transform 400ms ease;
    `;
    el.appendChild(deco);

    if (card.badge) {
      const badgeColor = card.badge === 'NEW' ? '#34D399' : accent.text;
      const badge = document.createElement('div');
      badge.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        padding: 3px 10px;
        background: ${badgeColor}22;
        border: 1px solid ${badgeColor}55;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 700;
        color: ${badgeColor};
        letter-spacing: 0.06em;
        text-transform: uppercase;
      `;
      badge.textContent = card.badge;
      el.appendChild(badge);
    }

    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = `
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, ${accent.text}33, ${accent.text}11);
      border: 1px solid ${accent.text}44;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin-bottom: 18px;
      transition: all 260ms ease;
    `;
    iconWrap.textContent = card.icon;
    el.appendChild(iconWrap);

    const title = document.createElement('div');
    title.style.cssText = `
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: 0.03em;
      margin-bottom: 6px;
      transition: color 200ms ease;
    `;
    title.textContent = card.title;
    el.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.style.cssText = `
      font-size: 13px;
      color: #94A3B8;
      line-height: 1.5;
      margin-bottom: 18px;
    `;
    subtitle.textContent = card.subtitle;
    el.appendChild(subtitle);

    const cta = document.createElement('div');
    cta.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: ${accent.text};
      transition: gap 200ms ease;
    `;
    cta.innerHTML = `<span>进入</span><span style="transition:transform 200ms;">→</span>`;
    el.appendChild(cta);

    const arrow = cta.querySelector('span:last-child') as HTMLElement;

    el.addEventListener('mouseenter', () => {
      el.style.transform = 'translateY(-4px) scale(1.015)';
      el.style.boxShadow = accent.shadow;
      el.style.borderColor = accent.text;
      iconWrap.style.transform = 'scale(1.08) rotate(-4deg)';
      iconWrap.style.boxShadow = `0 8px 24px ${accent.text}44`;
      title.style.color = accent.text;
      if (arrow) arrow.style.transform = 'translateX(4px)';
      deco.style.transform = 'scale(1.2)';
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translateY(0) scale(1)';
      el.style.boxShadow = 'none';
      el.style.borderColor = accent.border;
      iconWrap.style.transform = 'scale(1) rotate(0)';
      iconWrap.style.boxShadow = 'none';
      title.style.color = 'var(--text-primary)';
      if (arrow) arrow.style.transform = 'translateX(0)';
      deco.style.transform = 'scale(1)';
    });

    el.addEventListener('click', () => {
      this.callbacks.onNavigate(card.id);
    });

    return el;
  }

  destroy(): void {
    this.element.remove();
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes card-in {
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
