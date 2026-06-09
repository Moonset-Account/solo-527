import type { TowerType, PlayRecord } from '@/types';
import { getTowerSellValue } from '@/config/TowerConfig';
import { getWeatherConfig } from '@/config/WeatherConfig';
import { TOWER_CONFIGS } from '@/config/TowerConfig';
import { formatTime } from '@/utils/math';
import type { Tower } from '@/entities/Tower';
import type { GameEngine } from '@/core/GameEngine';
import type { ResourceSystem } from '@/systems/ResourceSystem';
import type { WaveSystem } from '@/systems/WaveSystem';
import type { WeatherSystem } from '@/systems/WeatherSystem';

type RenderState = {
  engine: GameEngine;
  resources: ResourceSystem;
  waves: WaveSystem;
  weather: WeatherSystem;
  selectedTowerType: TowerType | null;
  selectedPlacedTower: Tower | null;
  hoverWorldPos: { x: number; y: number } | null;
  canPlaceAtHover: boolean;
  profileName: string;
  profileLevel: number;
  currentLevelName: string;
  forbiddenTowers: TowerType[];
  towerLimit: number | null;
  builtTowerCount: number;
  challengeModifiers: string[];
};

const MODIFIER_INFO: Record<string, { icon: string; label: string; desc: string; color: string }> = {
  limited_gold: { icon: '💰', label: '资金紧张', desc: '起始金币 × 0.7', color: '#ffb74d' },
  reduced_range: { icon: '📏', label: '视野受限', desc: '塔射程 × 0.85', color: '#90caf9' },
  double_speed: { icon: '💨', label: '疾风迅行', desc: '敌人速度 × 1.25', color: '#ce93d8' },
  hp_boost: { icon: '🛡️', label: '钢铁军团', desc: '敌人 HP × 1.3', color: '#ef9a9a' },
  no_tesla: { icon: '⚡', label: '闪电禁令', desc: '禁止闪电塔', color: '#fff176' },
  no_frost: { icon: '❄️', label: '冰霜禁令', desc: '禁止冰霜塔', color: '#b3e5fc' },
  limited_towers: { icon: '🏗️', label: '精简编制', desc: '塔上限 8 座', color: '#a5d6a7' },
  weather_rain: { icon: '🌧️', label: '连续降雨', desc: '全天雨天', color: '#64b5f6' },
  weather_snow: { icon: '❄️', label: '飘雪天气', desc: '全天雪天', color: '#e1f5fe' },
  weather_fog: { icon: '🌫️', label: '浓雾弥漫', desc: '全天雾天', color: '#bdbdbd' },
  weather_typhoon: { icon: '🌀', label: '台风袭击', desc: '全天台风', color: '#ff8a65' },
  weather_sunny: { icon: '☀️', label: '晴朗锁定', desc: '全天天晴', color: '#fff59d' },
};

export class UIManager {
  private hudEl: HTMLElement;
  private debugEl: HTMLElement;
  private modalEl: HTMLElement;

  constructor() {
    this.hudEl = document.getElementById('hud')!;
    this.debugEl = document.getElementById('debug-panel')!;
    this.modalEl = document.getElementById('modal-container')!;
  }

  renderHUD(state: RenderState): void {
    const { engine, resources, waves, weather, currentLevelName, challengeModifiers } = state;

    const weatherDef = getWeatherConfig(weather.current);
    const waveIdx = Math.max(0, waves.currentWaveIndex + 1);
    const prepR = waves.preparationRemaining;
    const waveText = waves.isInProgress
      ? `第 ${waveIdx} / ${waves.totalWaves} 波`
      : waves.isBreakPhase
        ? `准备期 (${Math.ceil(prepR)}s)`
        : `准备开始`;

    const modifierBanner = challengeModifiers.length > 0
      ? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px;padding:6px 10px;background:rgba(255,152,0,0.12);border:1px solid rgba(255,152,0,0.3);border-radius:10px;">
           <span style="font-size:12px;color:#ffb74d;font-weight:700;align-self:center;">🔥 每日挑战：</span>
           ${challengeModifiers.map((m) => {
             const info = MODIFIER_INFO[m] ?? { icon: '❓', label: m, desc: '', color: '#999' };
             return `<div title="${info.desc}" style="padding:3px 8px;background:${info.color}22;border:1px solid ${info.color}66;border-radius:6px;font-size:11px;color:${info.color};font-weight:600;">${info.icon} ${info.label}</div>`;
           }).join('')}
         </div>`
      : '';

    this.hudEl.innerHTML = `
      <div class="hud-top">
        <div class="hud-stats">
          <div class="hud-stat stat-gold"><span class="icon">🪙</span><span>${resources.gold}</span></div>
          <div class="hud-stat stat-lives"><span class="icon">❤️</span><span>${resources.lives} / ${resources.startLivesCount}</span></div>
          <div class="hud-stat stat-wave"><span class="icon">🌊</span><span>${waveText}</span></div>
          <div class="hud-stat stat-time"><span class="icon">⏱️</span><span>${formatTime(engine.elapsed)}</span></div>
          <div class="hud-stat stat-weather"><span class="icon">${weatherDef.icon}</span><span>${weatherDef.name}</span></div>
        </div>
        <div class="hud-actions">
          <div class="speed-controls" id="speed-controls">
            <button class="speed-btn ${engine.speed === 0.5 ? 'active' : ''}" data-speed="0.5">0.5x</button>
            <button class="speed-btn ${engine.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
            <button class="speed-btn ${engine.speed === 2 ? 'active' : ''}" data-speed="2">2x</button>
            <button class="speed-btn ${engine.speed === 4 ? 'active' : ''}" data-speed="4">4x</button>
          </div>
          <button class="btn btn-warning" id="btn-start-wave" ${waves.isInProgress || waves.currentWaveIndex >= waves.totalWaves - 1 ? 'disabled style="opacity:0.5;pointer-events:none"' : ''}>
            ${waves.isBreakPhase ? '▶ 立即开始' : waves.isInProgress ? '进行中...' : '▶ 开始波次'}
          </button>
          <button class="btn btn-secondary" id="btn-debug">🔧 调试</button>
          <button class="btn btn-danger" id="btn-quit">✖ 退出</button>
        </div>
      </div>
      ${modifierBanner}
      <div style="text-align:center;margin-top:${challengeModifiers.length > 0 ? '4px' : '8px'};font-size:13px;color:rgba(255,255,255,0.6);pointer-events:none;">
        关卡：<b style="color:#8bc34a">${currentLevelName}</b> · 玩家：<b style="color:#ffd700">${state.profileName}</b> Lv.${state.profileLevel}
        ${state.towerLimit !== null ? ` · 塔数：<b style="color:${state.builtTowerCount >= state.towerLimit ? '#ef5350' : '#8bc34a'}">${state.builtTowerCount}/${state.towerLimit}</b>` : ''}
      </div>
    `;

    this.renderTowerBar(state);
    this.renderTowerInfo(state);
  }

  private renderTowerBar(state: RenderState): void {
    const { resources, selectedTowerType, profileLevel, forbiddenTowers, towerLimit, builtTowerCount } = state;

    const isLimitReached = towerLimit !== null && builtTowerCount >= towerLimit;
    const towers = Object.values(TOWER_CONFIGS);
    const cards = towers
      .map((t) => {
        const cfg = t.levels[0];
        const cost = cfg.stats.cost;
        const levelLocked = profileLevel < 2 && (t.type === 'tesla' || t.type === 'barrier');
        const forbidden = forbiddenTowers.includes(t.type);
        const limitBlocked = isLimitReached;
        const locked = levelLocked || forbidden || limitBlocked;
        const canAfford = resources.canAfford(cost) && !locked;
        const selected = selectedTowerType === t.type;
        let lockIcon = '';
        if (forbidden) lockIcon = ' 🔒';
        else if (levelLocked) lockIcon = ' 🔒';
        else if (limitBlocked) lockIcon = ' ⛔';
        return `
          <div class="tower-card ${selected ? 'selected' : ''} ${canAfford ? '' : 'disabled'}" data-tower="${t.type}" title="${t.description}${forbidden ? '（每日挑战禁止使用）' : ''}${limitBlocked ? '（已达塔数量上限）' : ''}">
            <div class="tower-icon" style="background:${t.color}33;border:2px solid ${t.color}66">${t.icon}</div>
            <div class="tower-name">${t.name}${lockIcon}</div>
            <div class="tower-cost">🪙 ${cost}</div>
          </div>
        `;
      })
      .join('');

    const existing = document.getElementById('tower-bar-root');
    if (existing) existing.remove();
    const bar = document.createElement('div');
    bar.id = 'tower-bar-root';
    bar.className = 'tower-bar';
    bar.innerHTML = cards;
    this.hudEl.appendChild(bar);
  }

  private renderTowerInfo(state: RenderState): void {
    const { selectedPlacedTower, resources, weather } = state;
    const existing = document.querySelector('.tower-info-panel');
    if (existing) existing.remove();

    if (!selectedPlacedTower) return;

    const def = selectedPlacedTower.definition;
    const lv = selectedPlacedTower.level;
    const stats = selectedPlacedTower.getEffectiveStats(weather.getTowerRangeMultiplier(), weather.getTowerFireRateMultiplier());
    const upCost = selectedPlacedTower.upgradeCost;
    const sellVal = getTowerSellValue(selectedPlacedTower.type, selectedPlacedTower.level);
    const targetMode = selectedPlacedTower.getCurrentTargetingMode();
    const canUpgrade = selectedPlacedTower.canUpgrade && resources.canAfford(upCost);

    const modeNames: Record<string, string> = {
      first: '路径最前',
      furthest: '路径最后',
      strongest: '血量最高',
      closest: '距离最近',
    };

    const panel = document.createElement('div');
    panel.className = 'tower-info-panel';
    panel.innerHTML = `
      <div class="tower-info-header">
        <div class="tower-info-icon" style="background:${def.color}33;border:2px solid ${def.color}">${def.icon}</div>
        <div>
          <div class="tower-info-title">${def.name}</div>
          <div class="tower-info-level">等级 ${lv} / ${selectedPlacedTower.maxLevel} · 目标模式：${modeNames[targetMode] ?? targetMode}</div>
        </div>
      </div>
      <div class="tower-info-stats">
        <div class="info-stat"><div class="info-stat-label">伤害</div><div class="info-stat-value">${stats.damage.toFixed(0)}</div></div>
        <div class="info-stat"><div class="info-stat-label">射程</div><div class="info-stat-value">${stats.range.toFixed(0)}</div></div>
        <div class="info-stat"><div class="info-stat-label">射速</div><div class="info-stat-value">${stats.fireRate.toFixed(1)}/s</div></div>
        <div class="info-stat"><div class="info-stat-label">击杀</div><div class="info-stat-value" style="color:#ff6b6b">${selectedPlacedTower.totalKills}</div></div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-bottom:10px;line-height:1.5">${def.description}</div>
      <div class="tower-info-actions">
        <button class="btn btn-primary" id="btn-upgrade" ${canUpgrade ? '' : 'disabled style="opacity:0.5;pointer-events:none"'}>
          ${selectedPlacedTower.canUpgrade ? `升级 🪙${upCost}` : '已满级'}
        </button>
        <button class="btn btn-secondary" id="btn-cycle-target" ${def.targeting!.length < 2 ? 'disabled style="opacity:0.5;pointer-events:none"' : ''}>🎯 切换</button>
        <button class="btn btn-danger" id="btn-sell-tower">出售 🪙${sellVal}</button>
      </div>
    `;
    this.hudEl.appendChild(panel);
  }

  renderDebugPanel(state: RenderState & { enemies: number; towers: number; projectiles: number }): void {
    const { engine, resources, waves, weather, enemies, towers, projectiles } = state;
    const prog = waves.waveProgress;

    this.debugEl.innerHTML = `
      <h3>🔧 调试面板</h3>

      <div class="debug-section">
        <h4>性能</h4>
        <div class="debug-row"><span class="label">FPS</span><span class="value">${engine.fps.toFixed(0)}</span></div>
        <div class="debug-row"><span class="label">实体数</span><span class="value">塔:${towers} · 敌:${enemies} · 弹:${projectiles}</span></div>
        <div class="debug-row"><span class="label">总用时</span><span class="value">${formatTime(engine.elapsed)}</span></div>
        <div class="debug-row"><span class="label">游戏速度</span><span class="value">${engine.speed}x</span></div>
      </div>

      <div class="debug-section">
        <h4>资源</h4>
        <div class="debug-row"><span class="label">金币</span><span class="value">${resources.gold}</span></div>
        <div class="debug-row"><span class="label">生命</span><span class="value">${resources.lives} / ${resources.startLivesCount}</span></div>
        <div class="debug-row"><span class="label">用时</span><span class="value">${formatTime(engine.elapsed)}</span></div>
      </div>

      <div class="debug-section">
        <h4>波次进度</h4>
        <div class="debug-row"><span class="label">当前波</span><span class="value">${Math.max(0, waves.currentWaveIndex + 1)} / ${waves.totalWaves}</span></div>
        <div class="debug-row"><span class="label">已生成</span><span class="value">${prog.spawned} / ${prog.total}</span></div>
        <div class="debug-row"><span class="label">场上敌人</span><span class="value">${prog.alive}</span></div>
        <div class="debug-row"><span class="label">准备时间</span><span class="value">${waves.preparationRemaining.toFixed(1)}s</span></div>
      </div>

      <div class="debug-section">
        <h4>天气系统</h4>
        <div class="debug-row"><span class="label">当前</span><span class="value">${getWeatherConfig(weather.current).icon} ${getWeatherConfig(weather.current).name}</span></div>
        <div class="debug-row"><span class="label">敌人速度</span><span class="value">x${weather.getEnemySpeedMultiplier()}</span></div>
        <div class="debug-row"><span class="label">塔射速</span><span class="value">x${weather.getTowerFireRateMultiplier()}</span></div>
        <div class="debug-row"><span class="label">塔射程</span><span class="value">x${weather.getTowerRangeMultiplier()}</span></div>
      </div>

      <div class="debug-section">
        <h4>显示选项</h4>
        <label class="debug-toggle"><input type="checkbox" id="dbg-grid" ${engine.debug.showGrid ? 'checked' : ''}> 显示网格</label>
        <label class="debug-toggle"><input type="checkbox" id="dbg-path" ${engine.debug.showPath ? 'checked' : ''}> 显示路径</label>
        <label class="debug-toggle"><input type="checkbox" id="dbg-range" ${engine.debug.showRange ? 'checked' : ''}> 显示塔射程</label>
        <label class="debug-toggle"><input type="checkbox" id="dbg-hitbox" ${engine.debug.showHitbox ? 'checked' : ''}> 显示碰撞体</label>
      </div>

      <div class="debug-section">
        <h4>调试操作</h4>
        <div class="debug-btns">
          <button class="btn btn-warning" id="dbg-add-gold">+500 金</button>
          <button class="btn btn-primary" id="dbg-heal">+5 生命</button>
          <button class="btn btn-danger" id="dbg-kill-enemies">清场</button>
          <button class="btn btn-secondary" id="dbg-skip-wave">跳波</button>
          <button class="btn btn-secondary" id="dbg-sunny">☀️ 晴天</button>
          <button class="btn btn-secondary" id="dbg-typhoon">🌀 台风</button>
        </div>
      </div>
    `;
  }

  showVictory(record: PlayRecord, rewards: { gold: number; exp: number; stars: number }, stats: { levelUp: number }): void {
    const totalTowers = Object.values(record.towersBuilt).reduce((a, b) => a + b, 0);
    const rewardsList: string[] = [];
    if (rewards.gold > 0) rewardsList.push(`获得金币 +${rewards.gold} 🪙`);
    if (rewards.exp > 0) rewardsList.push(`获得经验 +${rewards.exp} ⭐`);
    if (rewards.stars > 0) rewardsList.push(`获得 ${'★'.repeat(rewards.stars)}${'☆'.repeat(3 - rewards.stars)} 星评价`);
    if (stats.levelUp > 0) rewardsList.push(`🎉 升级！等级提升 ${stats.levelUp} 级`);

    this.modalEl.classList.remove('hidden');
    this.modalEl.innerHTML = `
      <div class="modal">
        <div class="modal-title victory">🏆 通关胜利！</div>
        <div class="modal-subtitle">恭喜，采摘车队成功抵达仓库！</div>
        <div class="modal-stats">
          <div class="modal-stat"><div class="modal-stat-label">用时</div><div class="modal-stat-value" style="color:#a29bfe">${formatTime(record.duration ?? 0)}</div></div>
          <div class="modal-stat"><div class="modal-stat-label">剩余生命</div><div class="modal-stat-value" style="color:#ff6b6b">${record.livesRemaining}</div></div>
          <div class="modal-stat"><div class="modal-stat-label">击杀数</div><div class="modal-stat-value" style="color:#ff6b6b">${record.enemiesKilled}</div></div>
          <div class="modal-stat"><div class="modal-stat-label">建造塔数</div><div class="modal-stat-value" style="color:#8bc34a">${totalTowers}</div></div>
        </div>
        <div class="rewards-box">
          <h4>🎁 通关奖励</h4>
          <ul>${rewardsList.map((r) => `<li>${r}</li>`).join('')}</ul>
        </div>
        <div class="tips-box">
          <h4>📝 关键选择记录</h4>
          <ul>
            ${record.criticalChoices.length > 0 ? record.criticalChoices.slice(0, 5).map((c) => `<li>${c}</li>`).join('') : '<li>本局操作较少，下次尝试更主动地布置防御！</li>'}
          </ul>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="btn-replay">🔁 重玩本关</button>
          <button class="btn btn-primary" id="btn-back-menu">🏠 返回主菜单</button>
        </div>
      </div>
    `;
  }

  showDefeat(record: PlayRecord, reason: string, suggestions: string[]): void {
    const totalTowers = Object.values(record.towersBuilt).reduce((a, b) => a + b, 0);
    this.modalEl.classList.remove('hidden');
    this.modalEl.innerHTML = `
      <div class="modal">
        <div class="modal-title defeat">💥 防御失败</div>
        <div class="modal-subtitle">采摘车队未能及时抵达仓库...</div>
        <div class="modal-stats">
          <div class="modal-stat"><div class="modal-stat-label">抵达波次</div><div class="modal-stat-value" style="color:#4ecdc4">第 ${record.waveReached} 波</div></div>
          <div class="modal-stat"><div class="modal-stat-label">用时</div><div class="modal-stat-value" style="color:#a29bfe">${formatTime(record.duration ?? 0)}</div></div>
          <div class="modal-stat"><div class="modal-stat-label">击杀数</div><div class="modal-stat-value" style="color:#ff6b6b">${record.enemiesKilled}</div></div>
          <div class="modal-stat"><div class="modal-stat-label">建造塔数</div><div class="modal-stat-value" style="color:#8bc34a">${totalTowers}</div></div>
        </div>
        <div class="reason-box">
          <h4>❌ 失败原因</h4>
          <p>${reason}</p>
        </div>
        <div class="tips-box">
          <h4>💡 重玩建议</h4>
          <ul>${suggestions.map((s) => `<li>${s}</li>`).join('')}</ul>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" id="btn-replay">🔁 重玩本关</button>
          <button class="btn btn-secondary" id="btn-back-menu">🏠 返回主菜单</button>
        </div>
      </div>
    `;
  }

  showWaveBanner(waveNum: number, totalWaves: number, weather: string): void {
    const weatherDef = getWeatherConfig(weather);
    const banner = document.createElement('div');
    banner.className = 'wave-banner';
    banner.innerHTML = `
      <div class="wave-banner-title">第 ${waveNum} / ${totalWaves} 波</div>
      <div class="wave-banner-sub">${weatherDef.icon} ${weatherDef.name} · 准备迎敌！</div>
    `;
    this.hudEl.appendChild(banner);
    setTimeout(() => banner.remove(), 2200);
  }

  showMainMenu(levelConfigs: { id: string; name: string; difficulty: number; unlocked: boolean; bestStars: number; bestTime: number }[]): void {
    this.modalEl.classList.remove('hidden');
    this.modalEl.innerHTML = `
      <div class="modal" style="max-width:680px;">
        <div style="text-align:center;margin-bottom:18px;">
          <div style="font-size:44px;margin-bottom:6px;">🍵</div>
          <div class="modal-title" style="color:#8bc34a">茶园塔防</div>
          <div class="modal-subtitle">布置防御塔，保护采摘车安全抵达仓库！</div>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:10px;font-weight:600;">选择关卡：</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
          ${levelConfigs
            .map(
              (l) => `
            <div class="level-card" data-level="${l.id}" style="
              background:${l.unlocked ? 'rgba(139,195,74,0.1)' : 'rgba(0,0,0,0.3)'};
              border:2px solid ${l.unlocked ? 'rgba(139,195,74,0.4)' : 'rgba(255,255,255,0.1)'};
              border-radius:12px;padding:14px;cursor:${l.unlocked ? 'pointer' : 'not-allowed'};
              transition:all 0.15s;opacity:${l.unlocked ? '1' : '0.5'};text-align:center;
              " onmouseover="this.style.transform='${l.unlocked ? 'translateY(-2px)' : 'none'}'" onmouseout="this.style.transform='none'">
              <div style="font-size:28px;margin-bottom:6px;">${l.difficulty === 1 ? '🌱' : l.difficulty === 2 ? '⛰️' : '🏔️'}</div>
              <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${l.unlocked ? '' : '🔒 '}${l.name}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:6px;">难度 ${'⭐'.repeat(l.difficulty)}</div>
              <div style="font-size:12px;color:#ffd700;">${'★'.repeat(l.bestStars)}${'☆'.repeat(3 - l.bestStars)}</div>
              ${l.bestTime > 0 ? `<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:3px;">最佳：${Math.floor(l.bestTime / 60)}分${Math.floor(l.bestTime % 60)}秒</div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="btn-profile">👤 玩家档案</button>
          <button class="btn btn-secondary" id="btn-achv">🏆 成就</button>
          <button class="btn btn-warning" id="btn-challenge">🔥 每日挑战</button>
        </div>
      </div>
    `;
  }

  showAchievements(allAchs: { id: string; name: string; description: string; icon: string; points: number; unlocked: boolean }[]): void {
    this.modalEl.classList.remove('hidden');
    const total = allAchs.filter((a) => a.unlocked).length;
    const totalPts = allAchs.filter((a) => a.unlocked).reduce((s, a) => s + a.points, 0);
    this.modalEl.innerHTML = `
      <div class="modal" style="max-width:560px;max-height:85vh;overflow-y:auto;">
        <div class="modal-title" style="color:#ffd700">🏆 成就殿堂</div>
        <div class="modal-subtitle">已解锁 ${total} / ${allAchs.length} · 积分 ${totalPts}</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:18px;">
          ${allAchs
            .map(
              (a) => `
            <div style="background:${a.unlocked ? 'rgba(255,215,0,0.08)' : 'rgba(0,0,0,0.3)'};border:1px solid ${a.unlocked ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'};border-radius:10px;padding:10px;opacity:${a.unlocked ? '1' : '0.5'}">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <div style="font-size:22px;">${a.icon}</div>
                <div style="font-weight:700;font-size:13px;">${a.name}</div>
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.4;">${a.description}</div>
              <div style="font-size:10px;color:#ffd700;margin-top:4px;">+${a.points} 积分</div>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="modal-actions"><button class="btn btn-primary" id="btn-back-menu">返回</button></div>
      </div>
    `;
  }

  showProfile(
    profile: { name: string; level: number; exp: number; nextExp: number; gold: number; totalPlayTime: number; totalWins: number; totalLosses: number; totalKills: number; highestWave: number; challengeStreak: number },
    rank: number
  ): void {
    this.modalEl.classList.remove('hidden');
    const t = profile.totalPlayTime;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    this.modalEl.innerHTML = `
      <div class="modal" style="max-width:480px;">
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:52px;margin-bottom:6px;">👤</div>
          <div class="modal-title" style="color:#4ecdc4">${profile.name}</div>
          <div class="modal-subtitle">等级 ${profile.level} · ${profile.exp} / ${profile.nextExp} EXP</div>
          <div style="width:80%;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;margin:10px auto 0;overflow:hidden;">
            <div style="height:100%;width:${(profile.exp / profile.nextExp) * 100}%;background:linear-gradient(90deg,#4ecdc4,#8bc34a);"></div>
          </div>
        </div>
        <div class="modal-stats">
          <div class="modal-stat"><div class="modal-stat-label">金币</div><div class="modal-stat-value" style="color:#ffd700">${profile.gold} 🪙</div></div>
          <div class="modal-stat"><div class="modal-stat-label">排行榜</div><div class="modal-stat-value" style="color:#ffd700">#${rank < 0 ? '未上榜' : rank}</div></div>
          <div class="modal-stat"><div class="modal-stat-label">胜利 / 失败</div><div class="modal-stat-value" style="color:#8bc34a">${profile.totalWins} / ${profile.totalLosses}</div></div>
          <div class="modal-stat"><div class="modal-stat-label">最高波次</div><div class="modal-stat-value" style="color:#4ecdc4">第 ${profile.highestWave} 波</div></div>
          <div class="modal-stat"><div class="modal-stat-label">累计击杀</div><div class="modal-stat-value" style="color:#ff6b6b">${profile.totalKills}</div></div>
          <div class="modal-stat"><div class="modal-stat-label">游戏时长</div><div class="modal-stat-value" style="color:#a29bfe">${h}h ${m}m</div></div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6);text-align:center;margin:14px 0;">每日挑战连胜：<b style="color:#ff6b6b">${profile.challengeStreak} 天 🔥</b></div>
        <div class="modal-actions"><button class="btn btn-primary" id="btn-back-menu">返回</button></div>
      </div>
    `;
  }

  showDailyChallenge(
    challenge: { id: string; date: string; levelId: string; levelName: string; modifiers: { mod: string; desc: string }[]; reward: number },
    completed: boolean,
    rank: number,
    streak: number
  ): void {
    this.modalEl.classList.remove('hidden');
    this.modalEl.innerHTML = `
      <div class="modal" style="max-width:500px;">
        <div style="text-align:center;margin-bottom:14px;">
          <div style="font-size:48px;margin-bottom:4px;">🔥</div>
          <div class="modal-title" style="color:#ff6b6b">每日挑战</div>
          <div class="modal-subtitle">${challenge.date} · 当前连胜 ${streak} 天</div>
        </div>
        <div style="background:rgba(139,195,74,0.1);border:1px solid rgba(139,195,74,0.3);border-radius:12px;padding:14px;margin-bottom:14px;">
          <div style="font-weight:700;font-size:16px;margin-bottom:4px;color:#8bc34a">${challenge.levelName}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:10px;">挑战奖励：<b style="color:#ffd700">${challenge.reward} 🪙</b> ${completed ? '· <span style="color:#8bc34a">已完成 ✔</span>' : ''}</div>
          <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);margin-bottom:6px;">特殊规则：</div>
          <ul style="padding-left:20px;font-size:12px;line-height:1.8;color:rgba(255,255,255,0.75)">
            ${challenge.modifiers.map((m) => `<li><b>${m.desc}</b></li>`).join('')}
          </ul>
        </div>
        ${rank > 0 ? `<div style="text-align:center;font-size:13px;color:#ffd700;margin-bottom:14px;">🏅 目前排行榜名次：第 ${rank} 名</div>` : ''}
        <div class="modal-actions">
          <button class="btn btn-secondary" id="btn-back-menu">返回</button>
          <button class="btn btn-warning" id="btn-start-challenge" ${completed ? 'disabled style="opacity:0.5;pointer-events:none"' : ''}>⚔ 开始挑战</button>
        </div>
      </div>
    `;
  }

  hideModal(): void {
    this.modalEl.classList.add('hidden');
    this.modalEl.innerHTML = '';
  }

  toggleDebug(show: boolean): void {
    if (show) this.debugEl.classList.remove('hidden');
    else this.debugEl.classList.add('hidden');
  }

  isDebugVisible(): boolean {
    return !this.debugEl.classList.contains('hidden');
  }
}
