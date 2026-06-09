import { GameEngine } from '@/core/GameEngine';
import { EventBus } from '@/core/EventBus';
import { EntityManager } from '@/core/EntityManager';
import { PathSystem } from '@/systems/PathSystem';
import { ResourceSystem } from '@/systems/ResourceSystem';
import { WaveSystem } from '@/systems/WaveSystem';
import { WeatherSystem } from '@/systems/WeatherSystem';
import { ProfileSystem } from '@/systems/ProfileSystem';
import { AchievementSystem } from '@/systems/AchievementSystem';
import { PlayRecorder } from '@/systems/PlayRecorder';
import { DailyChallengeSystem } from '@/systems/DailyChallengeSystem';
import { UIManager } from '@/ui/UIManager';
import { Tower } from '@/entities/Tower';
import { Enemy } from '@/entities/Enemy';
import { Projectile, createProjectileBehavior, renderProjectile } from '@/entities/Projectile';
import type { TowerType, Vec2, LevelConfig, PlayRecord, DamageType, EffectType, DailyChallenge } from '@/types';
import { TOWER_CONFIGS } from '@/config/TowerConfig';
import { getLevelConfig, LEVEL_CONFIGS } from '@/config/LevelConfig';
import { ACHIEVEMENTS } from '@/config/AchievementConfig';
import { getWeatherConfig } from '@/config/WeatherConfig';
import { distanceV } from '@/utils/math';

type Screen = 'menu' | 'playing' | 'achv' | 'profile' | 'challenge';

export class Game {
  private engine: GameEngine;
  private eventBus: EventBus;
  private entities: EntityManager;

  private pathSystem: PathSystem;
  private resourceSystem: ResourceSystem;
  private waveSystem: WaveSystem;
  private weatherSystem: WeatherSystem;

  private profileSystem: ProfileSystem;
  private achievementSystem!: AchievementSystem;
  private dailyChallenge: DailyChallengeSystem;
  private playRecorder!: PlayRecorder;

  private ui: UIManager;

  private towers: Tower[] = [];
  private projectiles: Projectile[] = [];
  private enemies: Enemy[] = [];

  private selectedTowerType: TowerType | null = null;
  private selectedPlacedTower: Tower | null = null;
  private hoverScreenPos: Vec2 | null = null;
  private hoverWorldPos: Vec2 | null = null;
  private canPlaceAtHover: boolean = false;

  private currentLevel: LevelConfig | null = null;
  private currentChallenge: DailyChallenge | null = null;
  private challengeModifiers: string[] = [];

  private screen: Screen = 'menu';
  private showDebugPanel: boolean = false;
  private gameEnded: boolean = false;
  private uiUpdateTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = GameEngine.create(canvas);
    this.eventBus = EventBus.getInstance();
    this.entities = new EntityManager();

    this.pathSystem = new PathSystem();
    this.resourceSystem = new ResourceSystem();
    this.waveSystem = new WaveSystem();
    this.weatherSystem = new WeatherSystem();

    this.profileSystem = new ProfileSystem();
    this.dailyChallenge = new DailyChallengeSystem();

    this.ui = new UIManager();

    this.setupEngine();
    this.setupWaveCallbacks();
    this.setupEventListeners();
    this.setupUIEvents();

    this.showMainMenu();
  }

  private setupEngine(): void {
    this.engine.setUpdateHandler((dt) => this.update(dt));
    this.engine.setRenderHandler((ctx) => this.render(ctx));
  }

  private setupWaveCallbacks(): void {
    this.waveSystem.onSpawnRequest = (type, hpMult) => {
      const speedMult = this.weatherSystem.getEnemySpeedMultiplier();
      const enemy = new Enemy(type, this.pathSystem, hpMult, speedMult);
      this.entities.add(enemy);
      this.enemies.push(enemy);
      this.waveSystem.registerEnemySpawned();
    };

    this.eventBus.on('wave:start', (wave) => {
      const wth = this.waveSystem.getCurrentWeather();
      if (wth) {
        this.weatherSystem.setWeather(wth as any);
        this.achievementSystem?.registerWeatherPlayed(wth);
      }
      this.ui.showWaveBanner(wave.id, this.waveSystem.totalWaves, wth ?? 'sunny');
    });

    this.eventBus.on('wave:complete', (wave) => {
      this.resourceSystem.addGold(wave.reward);
      this.playRecorder?.addChoice(`完成第${wave.id}波，获得${wave.reward}金币奖励`);
    });
  }

  private setupEventListeners(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.hoverScreenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.hoverWorldPos = this.engine.screenToWorld(this.hoverScreenPos);
      if (this.hoverWorldPos && this.selectedTowerType) {
        const positions = this.towers.map((t) => t.position);
        this.canPlaceAtHover = this.pathSystem.canBuildAt(this.hoverWorldPos, 48, positions);
      } else {
        this.canPlaceAtHover = false;
      }
    });

    canvas.addEventListener('mouseleave', () => {
      this.hoverScreenPos = null;
      this.hoverWorldPos = null;
    });

    canvas.addEventListener('click', (e) => {
      if (this.screen !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const sp = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const wp = this.engine.screenToWorld(sp);

      if (this.selectedTowerType) {
        this.tryPlaceTower(wp);
        return;
      }

      let clicked: Tower | null = null;
      for (const t of this.towers) {
        if (distanceV(wp, t.position) < 28) {
          clicked = t;
          break;
        }
      }
      this.selectedPlacedTower = clicked;
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.selectedTowerType = null;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key >= '1' && e.key <= '6') {
        const idx = parseInt(e.key) - 1;
        const types = Object.keys(TOWER_CONFIGS) as TowerType[];
        if (idx < types.length) {
          this.selectedTowerType = this.selectedTowerType === types[idx] ? null : types[idx];
          this.selectedPlacedTower = null;
        }
      }
      if (e.key === 'Escape') {
        this.selectedTowerType = null;
        this.selectedPlacedTower = null;
      }
      if (e.key === ' ' && this.screen === 'playing') {
        e.preventDefault();
        if (this.waveSystem.isBreakPhase) {
          this.waveSystem.forceStart();
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        if (this.engine.state === 'playing') this.engine.setState('paused');
        else if (this.engine.state === 'paused') this.engine.setState('playing');
      }
    });
  }

  private setupUIEvents(): void {
    const hudEl = document.getElementById('hud')!;
    const debugEl = document.getElementById('debug-panel')!;
    const modalEl = document.getElementById('modal-container')!;

    hudEl.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const towerCard = target.closest('.tower-card') as HTMLElement | null;
      if (towerCard && towerCard.dataset.tower) {
        const type = towerCard.dataset.tower as TowerType;
        const cfg = TOWER_CONFIGS[type].levels[0];
        const profileLvl = this.profileSystem.getProfileLevel().level;
        const locked = profileLvl < 2 && (type === 'tesla' || type === 'barrier');
        if (!this.resourceSystem.canAfford(cfg.stats.cost) || locked) return;
        this.selectedTowerType = this.selectedTowerType === type ? null : type;
        this.selectedPlacedTower = null;
        return;
      }

      const speedBtn = target.closest('#speed-controls .speed-btn') as HTMLElement | null;
      if (speedBtn && speedBtn.dataset.speed) {
        this.engine.setSpeed(parseFloat(speedBtn.dataset.speed));
      }

      const btnStart = target.closest('#btn-start-wave');
      if (btnStart) this.waveSystem.forceStart();

      const btnDebug = target.closest('#btn-debug');
      if (btnDebug) {
        this.showDebugPanel = !this.showDebugPanel;
        this.ui.toggleDebug(this.showDebugPanel);
      }

      const btnQuit = target.closest('#btn-quit');
      if (btnQuit) this.confirmQuit();

      const btnUpgrade = target.closest('#btn-upgrade');
      if (btnUpgrade && this.selectedPlacedTower) {
        this.tryUpgradeTower();
      }

      const btnCycle = target.closest('#btn-cycle-target');
      if (btnCycle && this.selectedPlacedTower) {
        this.selectedPlacedTower.cycleTargetingMode();
      }

      const btnSell = target.closest('#btn-sell-tower');
      if (btnSell && this.selectedPlacedTower) {
        this.sellTower();
      }
    });

    debugEl.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const checkbox = target as HTMLInputElement;
      if (checkbox.type === 'checkbox' && checkbox.id?.startsWith('dbg-')) {
        const key = checkbox.id.replace('dbg-', '');
        this.engine.toggleDebug(key);
        return;
      }
      if (target.closest('#dbg-add-gold')) this.resourceSystem.addGold(500);
      if (target.closest('#dbg-heal')) this.resourceSystem.healLives(5);
      if (target.closest('#dbg-kill-enemies')) {
        for (const e of this.enemies) {
          e.takeDamage(99999);
        }
      }
      if (target.closest('#dbg-skip-wave')) {
        this.waveSystem.forceStart();
      }
      if (target.closest('#dbg-sunny')) this.weatherSystem.setWeather('sunny');
      if (target.closest('#dbg-typhoon')) this.weatherSystem.setWeather('typhoon');
    });

    modalEl.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const levelCard = target.closest('.level-card') as HTMLElement | null;
      if (levelCard && levelCard.dataset.level) {
        const level = getLevelConfig(levelCard.dataset.level);
        if (level && this.profileSystem.isLevelUnlocked(level.id)) {
          this.startLevel(level.id);
        }
        return;
      }
      if (target.closest('#btn-replay') && this.currentLevel) {
        this.startLevel(this.currentLevel.id, this.currentChallenge ?? undefined);
      }
      if (target.closest('#btn-back-menu')) {
        this.showMainMenu();
      }
      if (target.closest('#btn-profile')) {
        this.showProfile();
      }
      if (target.closest('#btn-achv')) {
        this.showAchievements();
      }
      if (target.closest('#btn-challenge')) {
        this.showDailyChallenge();
      }
      if (target.closest('#btn-start-challenge')) {
        const ch = this.dailyChallenge.getTodayChallenge();
        const level = getLevelConfig(ch.levelId);
        if (level) this.startLevel(level.id, ch);
      }
    });
  }

  private showMainMenu(): void {
    this.screen = 'menu';
    this.engine.setState('menu');
    this.engine.stop();
    this.ui.hideModal();
    this.showDebugPanel = false;
    this.ui.toggleDebug(false);

    const list = LEVEL_CONFIGS.map((l) => {
      const prog = this.profileSystem.getLevelProgress(l.id);
      return {
        id: l.id,
        name: l.name,
        difficulty: l.difficulty,
        unlocked: this.profileSystem.isLevelUnlocked(l.id),
        bestStars: prog?.stars ?? 0,
        bestTime: prog?.bestTime ?? 0,
      };
    });
    this.ui.showMainMenu(list);
  }

  private showAchievements(): void {
    this.screen = 'achv';
    const profile = this.profileSystem.getProfile();
    const achs = ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: !!profile.achievements[a.id],
    }));
    this.ui.showAchievements(achs);
  }

  private showProfile(): void {
    this.screen = 'profile';
    const lvl = this.profileSystem.getProfileLevel();
    const p = this.profileSystem.getProfile();
    const rank = this.profileSystem.getPlayerRank();
    this.ui.showProfile(
      {
        name: p.name,
        level: lvl.level,
        exp: lvl.exp,
        nextExp: lvl.nextExp,
        gold: p.gold,
        totalPlayTime: p.totalPlayTime,
        totalWins: p.totalWins,
        totalLosses: p.totalLosses,
        totalKills: p.totalKills,
        highestWave: p.highestWave,
        challengeStreak: p.challengeStreak,
      },
      rank
    );
  }

  private showDailyChallenge(): void {
    this.screen = 'challenge';
    const ch = this.dailyChallenge.getTodayChallenge();
    const level = getLevelConfig(ch.levelId);
    const profile = this.profileSystem.getProfile();
    const completed = this.dailyChallenge.isChallengeCompletedToday(profile.lastDailyDate);
    const modifiers = ch.modifiers.map((m) => ({ mod: m, desc: this.dailyChallenge.getModifierDescription(m) }));
    const rank = this.profileSystem.getPlayerRank(ch.levelId);
    this.ui.showDailyChallenge(
      {
        id: ch.id,
        date: ch.date,
        levelId: ch.levelId,
        levelName: level?.name ?? '未知关卡',
        modifiers,
        reward: ch.reward,
      },
      completed,
      rank,
      profile.challengeStreak
    );
  }

  private confirmQuit(): void {
    if (confirm('确定要退出当前对局吗？进度将不会保存。')) {
      this.endGame('quit');
    }
  }

  private startLevel(levelId: string, challenge?: DailyChallenge): void {
    const level = getLevelConfig(levelId);
    if (!level) return;

    this.currentLevel = level;
    this.currentChallenge = challenge ?? null;
    this.challengeModifiers = challenge?.modifiers ?? [];

    this.screen = 'playing';
    this.gameEnded = false;

    this.entities.clear();
    this.towers = [];
    this.projectiles = [];
    this.enemies = [];
    this.selectedTowerType = null;
    this.selectedPlacedTower = null;

    this.engine.elapsed = 0;
    this.engine.speed = 1;

    let startGold = level.startGold;
    if (this.challengeModifiers.includes('limited_gold')) {
      startGold = Math.floor(startGold * 0.7);
    }

    this.pathSystem.setPath(level.path);
    this.pathSystem.setBuildableAreas(level.buildableAreas);
    this.pathSystem.setPathWidth(level.path[0]?.width ?? 50);
    this.resourceSystem.init(startGold, level.startLives);
    this.waveSystem.init(level.waves, level.weather);
    this.waveSystem.setPreparationTime(12);
    this.weatherSystem.init(this.engine.worldSize.width, this.engine.worldSize.height);
    this.weatherSystem.setWeather((level.weather?.[0] ?? 'sunny') as any);

    this.achievementSystem = new AchievementSystem(this.profileSystem.getProfile());
    this.playRecorder = new PlayRecorder(levelId, performance.now() / 1000, this.weatherSystem.current);

    this.engine.camera = { x: this.engine.worldSize.width / 2, y: this.engine.worldSize.height / 2 };

    this.ui.hideModal();
    this.engine.setState('playing');
    this.engine.start();
  }

  private tryPlaceTower(wp: Vec2): void {
    if (!this.selectedTowerType) return;
    const type = this.selectedTowerType;
    const cfg = TOWER_CONFIGS[type].levels[0];
    const positions = this.towers.map((t) => t.position);
    if (!this.pathSystem.canBuildAt(wp, 48, positions)) return;
    if (!this.resourceSystem.spendGold(cfg.stats.cost)) return;

    const tower = new Tower(type, wp);
    tower.onFire = (p) => {
      const copy: Projectile = { ...p };
      createProjectileBehavior(
        copy,
        this.enemies,
        (enemy, damage, dmgType, effects) => this.applyHit(enemy, damage, dmgType, effects, copy),
        (pos, radius, damage, dmgType, effects) => this.applySplash(pos, radius, damage, dmgType, effects, copy),
        (owner, dmg) => owner?.addDamage(dmg)
      );
      copy.render = (ctx) => renderProjectile(copy, ctx);
      this.projectiles.push(copy);
    };
    tower.onUpgrade = (nl, _cost) => {
      if (nl === tower.maxLevel) this.achievementSystem.registerMaxTower();
      this.playRecorder?.registerTowerUpgraded(type, nl - 1, nl, Math.max(1, this.waveSystem.currentWaveIndex + 1));
    };
    this.towers.push(tower);

    this.playRecorder.registerTowerBuilt(type, wp, Math.max(1, this.waveSystem.currentWaveIndex + 1));
    this.eventBus.emit('tower:place', { tower: type, position: wp, cost: cfg.stats.cost });
  }

  private tryUpgradeTower(): void {
    const t = this.selectedPlacedTower;
    if (!t) return;
    const cost = t.upgradeCost;
    if (!t.canUpgrade || !this.resourceSystem.spendGold(cost)) return;
    t.upgrade();
    this.eventBus.emit('tower:upgrade', { towerId: t.id, level: t.level, cost });
  }

  private sellTower(): void {
    const t = this.selectedPlacedTower;
    if (!t) return;
    const refund = t.sellValue;
    this.resourceSystem.addGold(refund);
    const idx = this.towers.findIndex((x) => x.id === t.id);
    if (idx >= 0) this.towers.splice(idx, 1);
    this.selectedPlacedTower = null;
    this.playRecorder?.registerTowerSold(t.type, Math.max(1, this.waveSystem.currentWaveIndex + 1));
    this.eventBus.emit('tower:sell', { towerId: t.id, refund });
  }

  private applyHit(enemy: Enemy, damage: number, type: DamageType, effects: EffectType[], proj: Projectile): void {
    if (!enemy.alive) return;
    enemy.takeDamage(damage, type);
    for (const eff of effects) enemy.applyEffect(eff);
    if (enemy.hp <= 0) {
      proj.owner?.registerKill();
    }
  }

  private applySplash(pos: Vec2, radius: number, damage: number, type: DamageType, effects: EffectType[], proj: Projectile): void {
    for (const e of this.enemies) {
      if (!e.alive || e.status !== 'alive') continue;
      if (distanceV(pos, e.position) <= radius + e.size) {
        const dmg = damage * 0.8;
        e.takeDamage(dmg, type);
        for (const eff of effects) e.applyEffect(eff);
        if (e.hp <= 0) proj.owner?.registerKill();
      }
    }
  }

  private update(dt: number): void {
    if (this.screen !== 'playing' || this.gameEnded) return;

    this.waveSystem.update(dt);
    this.weatherSystem.update(dt);

    const rangeMult = this.weatherSystem.getTowerRangeMultiplier() * (this.challengeModifiers.includes('reduced_range') ? 0.85 : 1);
    const fireMult = this.weatherSystem.getTowerFireRateMultiplier();
    const enemySpeedMult = this.weatherSystem.getEnemySpeedMultiplier() * (this.challengeModifiers.includes('double_speed') ? 1.25 : 1);

    for (const t of this.towers) {
      t.update(dt, this.enemies, rangeMult, fireMult);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (!p.alive) this.projectiles.splice(i, 1);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.setWeatherSpeedMult(enemySpeedMult);
      e.update(dt);

      if (!e.alive) {
        if (e.status === 'dying' || e.status === 'dead') {
          this.resourceSystem.addGold(e.reward);
          this.waveSystem.registerEnemyKilled();
          this.playRecorder?.registerEnemyKilled();
          if (e.type === 'boss') this.achievementSystem.registerBossKill();
          this.eventBus.emit('enemy:death', { enemyType: e.type, reward: e.reward });
        } else if (e.status === 'reached') {
          const died = this.resourceSystem.loseLives(e.damage);
          this.waveSystem.registerEnemyReached();
          this.eventBus.emit('enemy:reach', { enemyType: e.type, damage: e.damage });
          if (died) {
            this.endGame('lose');
          }
        }
        this.enemies.splice(i, 1);
      }
    }

    this.playRecorder?.setWaveReached(Math.max(1, this.waveSystem.currentWaveIndex + 1));
    this.playRecorder?.setLivesRemaining(this.resourceSystem.lives);
    this.playRecorder?.setGoldRemaining(this.resourceSystem.gold);
    this.playRecorder?.setGoldSpent(this.resourceSystem.getGoldStats().spent);

    const totalTowersBuilt = this.towers.length;
    this.achievementSystem.registerTowersBuilt(totalTowersBuilt);

    if (this.waveSystem.allWavesCleared() && !this.gameEnded) {
      this.endGame('win');
    }

    this.uiUpdateTimer += dt;
    if (this.uiUpdateTimer >= 1 / 20) {
      this.uiUpdateTimer = 0;
      this.renderUIHUD();
    }
  }

  private renderUIHUD(): void {
    if (this.screen !== 'playing') return;
    const profile = this.profileSystem.getProfile();
    const profileLvl = this.profileSystem.getProfileLevel();
    this.ui.renderHUD({
      engine: this.engine,
      resources: this.resourceSystem,
      waves: this.waveSystem,
      weather: this.weatherSystem,
      selectedTowerType: this.selectedTowerType,
      selectedPlacedTower: this.selectedPlacedTower,
      hoverWorldPos: this.hoverWorldPos,
      canPlaceAtHover: this.canPlaceAtHover,
      profileName: profile.name,
      profileLevel: profileLvl.level,
      currentLevelName: this.currentLevel?.name ?? '',
    });
    if (this.showDebugPanel) {
      this.ui.renderDebugPanel({
        engine: this.engine,
        resources: this.resourceSystem,
        waves: this.waveSystem,
        weather: this.weatherSystem,
        selectedTowerType: this.selectedTowerType,
        selectedPlacedTower: this.selectedPlacedTower,
        hoverWorldPos: this.hoverWorldPos,
        canPlaceAtHover: this.canPlaceAtHover,
        profileName: profile.name,
        profileLevel: profileLvl.level,
        currentLevelName: this.currentLevel?.name ?? '',
        enemies: this.enemies.length,
        towers: this.towers.length,
        projectiles: this.projectiles.length,
      });
    }
  }

  private render(ctx: CanvasRenderingContext2D): void {
    this.renderBackground(ctx);
    this.pathSystem.renderBuildableAreas(ctx);
    if (this.engine.debug.showPath) this.pathSystem.render(ctx, this.engine.debug.showHitbox);

    for (const p of this.projectiles) p.render(ctx);

    for (const t of this.towers) {
      t.render(ctx, this.engine.debug.showRange || this.selectedPlacedTower?.id === t.id);
    }

    for (const e of this.enemies) e.render(ctx);

    if (this.engine.debug.showHitbox) this.renderHitboxes(ctx);

    this.weatherSystem.render(ctx);

    if (this.hoverWorldPos && this.selectedTowerType) {
      this.renderPlacementPreview(ctx);
    }

    this.renderFloatingTexts(ctx);
  }

  private renderBackground(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine.worldSize;
    const theme = this.currentLevel?.theme ?? 'tea-hills';

    let baseColor = '#3a5f3e';
    let accent = '#4e7a52';
    if (theme === 'mountain') {
      baseColor = '#4a5a6e';
      accent = '#3a4a5e';
    } else if (theme === 'cloudy') {
      baseColor = '#3e5a6e';
      accent = '#4e6a7e';
    }

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = accent;
    for (let i = 0; i < 40; i++) {
      const x = ((i * 173) % width) + ((i * 7) % 50);
      const y = ((i * 241) % height) + ((i * 13) % 30);
      const r = 20 + ((i * 31) % 40);
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const bushCount = 50;
    for (let i = 0; i < bushCount; i++) {
      const x = (i * 137) % width;
      const y = (i * 199) % height;
      const testPos = { x, y };
      if (this.pathSystem.isOnPath(testPos, 20)) continue;
      this.drawBush(ctx, x, y, 10 + ((i * 17) % 14), theme);
    }

    const treePositions: Vec2[] = [
      { x: 120, y: 100 }, { x: 300, y: 780 }, { x: 900, y: 90 }, { x: 1400, y: 820 },
      { x: 50, y: 600 }, { x: 1350, y: 150 }, { x: 1500, y: 900 }, { x: 80, y: 850 },
      { x: 700, y: 880 }, { x: 1200, y: 70 }, { x: 550, y: 90 }, { x: 1550, y: 400 },
      { x: 420, y: 880 }, { x: 200, y: 880 }, { x: 800, y: 920 }, { x: 1050, y: 920 },
    ];
    for (const pos of treePositions) {
      if (this.pathSystem.isOnPath(pos, 60)) continue;
      this.drawTeaTree(ctx, pos.x, pos.y);
    }
  }

  private drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, theme: string): void {
    let c1 = '#6ba368';
    let c2 = '#558b52';
    if (theme === 'mountain') {
      c1 = '#788a6b';
      c2 = '#5a7050';
    } else if (theme === 'cloudy') {
      c1 = '#5a8080';
      c2 = '#456a6a';
    }
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.arc(x + r * 0.2, y + r * 0.2, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTeaTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - 3, y, 6, 18);

    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(x, y - 5, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#388e3c';
    ctx.beginPath();
    ctx.arc(x - 8, y - 2, 16, 0, Math.PI * 2);
    ctx.arc(x + 9, y - 1, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.arc(x - 3, y - 14, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a8e063';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x - 5 + i * 5, y - 8 + ((i % 2) * -6), 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderPlacementPreview(ctx: CanvasRenderingContext2D): void {
    if (!this.hoverWorldPos || !this.selectedTowerType) return;
    const type = this.selectedTowerType;
    const def = TOWER_CONFIGS[type];
    const stats = def.levels[0].stats;

    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = this.canPlaceAtHover ? 'rgba(139,195,74,0.3)' : 'rgba(255,107,107,0.3)';
    ctx.strokeStyle = this.canPlaceAtHover ? '#8bc34a' : '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(this.hoverWorldPos.x, this.hoverWorldPos.y, stats.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.globalAlpha = 0.85;
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(this.hoverWorldPos.x, this.hoverWorldPos.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, this.hoverWorldPos.x, this.hoverWorldPos.y);
    ctx.restore();
  }

  private renderHitboxes(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
    ctx.lineWidth = 1;
    for (const e of this.enemies) {
      ctx.beginPath();
      ctx.arc(e.position.x, e.position.y, e.size + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const t of this.towers) {
      ctx.strokeStyle = 'rgba(78, 205, 196, 0.6)';
      ctx.beginPath();
      ctx.arc(t.position.x, t.position.y, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private _floatTexts: { x: number; y: number; text: string; color: string; life: number; vy: number }[] = [];

  private renderFloatingTexts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    for (let i = this._floatTexts.length - 1; i >= 0; i--) {
      const f = this._floatTexts[i];
      f.life -= 1 / 60;
      f.y += f.vy;
      if (f.life <= 0) {
        this._floatTexts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
      ctx.fillStyle = '#000';
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private endGame(result: 'win' | 'lose' | 'quit'): void {
    if (this.gameEnded) return;
    this.gameEnded = true;

    const record = this.playRecorder.finalize(result, performance.now() / 1000);

    if (result === 'win') {
      this.handleVictory(record);
    } else if (result === 'lose') {
      this.handleDefeat(record);
    } else {
      this.profileSystem.recordPlay(record);
      this.showMainMenu();
    }
  }

  private handleVictory(record: PlayRecord): void {
    this.engine.setState('victory');

    const level = this.currentLevel!;
    const lifePct = this.resourceSystem.getLifePercent();
    const stars = lifePct >= 90 ? 3 : lifePct >= 60 ? 2 : 1;
    const timeSec = record.duration ?? 0;

    const baseGold = 50 + level.difficulty * 80 + stars * 50;
    const timeBonus = Math.max(0, Math.floor(500 / Math.max(60, timeSec)) * 20);
    const goldReward = baseGold + timeBonus;
    const expReward = 100 + level.difficulty * 50 + stars * 30;

    if (lifePct >= 90) this.achievementSystem.registerPerfectClear();

    const levelResult = this.profileSystem.setCompletedLevel(level.id, stars, timeSec, this.waveSystem.totalWaves);

    let totalGold = goldReward;
    let leveled = 0;
    if (levelResult.isFirst) totalGold += 100 * level.difficulty;
    if (this.currentChallenge) {
      const profile = this.profileSystem.getProfile();
      if (!this.dailyChallenge.isChallengeCompletedToday(profile.lastDailyDate)) {
        totalGold += this.currentChallenge.reward;
        const prof = this.profileSystem.getProfile();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (prof.lastDailyDate === yesterday) {
          prof.challengeStreak++;
        } else {
          prof.challengeStreak = 1;
        }
        prof.lastDailyDate = today;
      }
    }

    leveled = this.profileSystem.addExperience(expReward);
    this.profileSystem.addGold(totalGold);

    const profile = this.profileSystem.getProfile();
    const newlyUnlocked = this.achievementSystem.checkAll(profile);
    if (newlyUnlocked.length > 0) {
      const achObj: Record<string, boolean> = { ...profile.achievements };
      newlyUnlocked.forEach((a) => (achObj[a.id] = true));
      (this.profileSystem as any).profile.achievements = achObj;
    }
    this.profileSystem.save();

    this.profileSystem.recordPlay(record);
    this.profileSystem.submitLeaderboard({
      levelId: level.id,
      score: stars * 1000 + Math.floor(5000 / Math.max(30, timeSec)) + this.resourceSystem.lives * 50,
      time: timeSec,
      wave: this.waveSystem.totalWaves,
    });

    this.eventBus.emit('game:victory', {
      levelId: level.id,
      stats: record,
      rewards: { gold: totalGold, exp: expReward, stars },
    });

    this.ui.showVictory(
      { ...record, livesRemaining: this.resourceSystem.lives, goldRemaining: this.resourceSystem.gold },
      { gold: totalGold, exp: expReward, stars },
      { levelUp: leveled }
    );
  }

  private handleDefeat(_record: PlayRecord): void {
    this.engine.setState('defeat');

    const { reason, suggestions } = this.analyzeDefeat();
    this.playRecorder.setFailureReason(reason);

    const finalRec = this.playRecorder.finalize('lose', performance.now() / 1000);
    this.profileSystem.recordPlay(finalRec);

    this.eventBus.emit('game:defeat', {
      levelId: this.currentLevel!.id,
      stats: finalRec,
      reason,
      suggestions,
    });

    this.ui.showDefeat(finalRec, reason, suggestions);
  }

  private analyzeDefeat(): { reason: string; suggestions: string[] } {
    const lives = this.resourceSystem.lives;
    const gold = this.resourceSystem.gold;
    const startLives = this.resourceSystem.startLivesCount;
    const wave = this.waveSystem.currentWaveIndex + 1;
    const totalWaves = this.waveSystem.totalWaves;
    const towerCount = this.towers.length;
    const avgLv = this.towers.length
      ? this.towers.reduce((s, t) => s + t.level, 0) / this.towers.length
      : 0;
    const goldSpent = this.resourceSystem.getGoldStats().spent;
    const totalKills = this.playRecorder.getStats().enemiesKilled;
    const recentDamage = startLives - lives;

    const weather = getWeatherConfig(this.weatherSystem.current);
    const suggestions: string[] = [];
    let reason = '';

    if (towerCount <= 2 && wave <= 3) {
      reason = '防御塔数量不足，敌群轻易突破了防线';
      suggestions.push('在波次开始前更积极地建造防御塔，不要过早存钱');
      suggestions.push('在路径转角等关键位置优先布置高伤害塔');
    } else if (gold > 250 && avgLv < 1.5 && towerCount >= 3) {
      reason = `剩余 ${gold} 金币未使用，防御塔缺乏升级强化`;
      suggestions.push('及时将金币用于升级现有防御塔，不要积攒过多');
      suggestions.push('炮台和闪电塔升级收益最大，优先考虑');
    } else if (avgLv < 1.5 && towerCount >= 4 && gold < 100) {
      reason = '防御布置过于分散，单塔伤害不足';
      suggestions.push('集中资源升级 2-3 座关键位置的防御塔');
      suggestions.push('在路径拐角处布置多塔形成集火区域');
    } else if (recentDamage > startLives * 0.5 && wave > 3) {
      const swarm = this.towers.filter((t) => t.type === 'frost' || t.type === 'tesla').length;
      if (swarm === 0) {
        reason = '缺乏减速或范围伤害能力，导致大量小型敌人漏过';
        suggestions.push('尝试建造冰霜塔进行减速，延缓敌群推进');
        suggestions.push('闪电塔的链式攻击对密集敌群非常有效');
      } else {
        reason = '高血量敌人（坦克/BOSS）未被及时清理';
        suggestions.push('狙击塔对单体高血量目标效果最佳');
        suggestions.push('毒雾塔的持续伤害能有效削弱装甲敌人');
      }
    } else if (weather.type !== 'sunny' && wave > 1) {
      reason = `${weather.name}天气严重影响了防御效率`;
      if (weather.effects.enemySpeedMult && weather.effects.enemySpeedMult < 1) {
        suggestions.push('好消息：当前天气同样减慢了敌人，合理利用这一点');
      }
      if (weather.effects.towerRangeMult) {
        suggestions.push('浓雾降低了塔的射程，请把塔布置得更靠近路径');
      }
      if (weather.effects.towerFireRateMult) {
        suggestions.push('恶劣天气减少了塔的射速，多建路障塔可以争取时间');
      }
    } else if (wave / totalWaves < 0.5) {
      reason = `在第 ${wave} / ${totalWaves} 波就已失败，前期防御存在明显漏洞`;
      suggestions.push('新手建议先从狙击塔 + 冰霜塔的组合开始');
      suggestions.push('开局先建造 2-3 座塔再考虑存钱升级');
    } else {
      reason = `在第 ${wave} / ${totalWaves} 波被击溃，后期强度不足`;
      suggestions.push('把所有塔升级到 2 级以上，至少一座达到 3 级');
      suggestions.push('在路径后半段加建减速塔，拉长敌人暴露时间');
      suggestions.push(`目前共击杀 ${totalKills} 个敌人，尝试更高效的布置`);
    }

    if (goldSpent < 200 && towerCount <= 2) {
      suggestions.unshift('本局使用的金币明显偏少，更大胆地投入防御吧！');
    }

    const uniqueSet = new Set(suggestions);
    return { reason, suggestions: Array.from(uniqueSet).slice(0, 4) };
  }

  start(): void {
    this.engine.start();
  }

  destroy(): void {
    this.engine.dispose();
  }
}
