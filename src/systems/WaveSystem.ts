import { EventBus } from '@/core/EventBus';
import type { WaveConfig, EnemyType, GameEvents } from '@/types';

type SpawnItem = { enemyType: EnemyType; time: number; hpMult: number };

export class WaveSystem {
  private eventBus: EventBus;
  private waves: WaveConfig[] = [];
  private currentWaveIdx: number = -1;
  private inProgress: boolean = false;
  private waveTimer: number = 0;
  private queue: SpawnItem[] = [];
  private spawnedCount: number = 0;
  private totalInWave: number = 0;
  private totalEnemiesAlive: number = 0;
  private preparationTime: number = 15;
  private preparationTimer: number = 0;
  private inBreak: boolean = false;
  private weatherCycle: string[] = [];

  onSpawnRequest?: (type: EnemyType, hpMult: number) => void;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  init(waves: WaveConfig[], weather?: string[]): void {
    this.waves = waves.slice();
    this.weatherCycle = weather?.slice() ?? [];
    this.currentWaveIdx = -1;
    this.inProgress = false;
    this.inBreak = true;
    this.queue = [];
    this.spawnedCount = 0;
    this.totalInWave = 0;
    this.totalEnemiesAlive = 0;
    this.preparationTimer = this.preparationTime;
  }

  get currentWaveIndex(): number {
    return this.currentWaveIdx;
  }

  get totalWaves(): number {
    return this.waves.length;
  }

  get isInProgress(): boolean {
    return this.inProgress;
  }

  get isBreakPhase(): boolean {
    return this.inBreak;
  }

  get preparationRemaining(): number {
    return this.preparationTimer;
  }

  get waveProgress(): { spawned: number; total: number; alive: number } {
    return { spawned: this.spawnedCount, total: this.totalInWave, alive: this.totalEnemiesAlive };
  }

  getCurrentWeather(): string | null {
    if (this.weatherCycle.length === 0) return null;
    const idx = Math.max(0, this.currentWaveIdx);
    return this.weatherCycle[Math.min(idx, this.weatherCycle.length - 1)] ?? null;
  }

  startNextWave(): boolean {
    if (this.currentWaveIdx >= this.waves.length - 1) return false;
    this.currentWaveIdx++;
    this.startWave();
    return true;
  }

  forceStart(): void {
    if ((this.inBreak || this.currentWaveIdx === -1) && this.currentWaveIdx < this.waves.length - 1) {
      this.preparationTimer = 0;
      this.startNextWave();
    }
  }

  private startWave(): void {
    const wave = this.waves[this.currentWaveIdx];
    if (!wave) return;

    this.inProgress = true;
    this.inBreak = false;
    this.queue = [];
    this.spawnedCount = 0;
    this.totalInWave = 0;
    this.waveTimer = 0;

    for (const spawn of wave.spawns) {
      const delay = spawn.delay ?? 0;
      const hpMult = spawn.hpMultiplier ?? 1;
      for (let i = 0; i < spawn.count; i++) {
        this.queue.push({
          enemyType: spawn.enemyType,
          time: delay + i * spawn.interval,
          hpMult,
        });
        this.totalInWave++;
      }
    }
    this.queue.sort((a, b) => a.time - b.time);
    this.eventBus.emit('wave:start', wave);
  }

  setPreparationTime(t: number): void {
    this.preparationTime = t;
  }

  enterBreakPhase(): void {
    const wave = this.waves[this.currentWaveIdx];
    if (wave) {
      this.eventBus.emit('wave:complete', wave);
    }
    if (this.currentWaveIdx >= this.waves.length - 1) {
      this.inProgress = false;
      return;
    }
    this.inProgress = false;
    this.inBreak = true;
    this.preparationTimer = this.preparationTime;
  }

  registerEnemySpawned(): void {
    this.totalEnemiesAlive++;
  }

  registerEnemyKilled(): void {
    this.totalEnemiesAlive = Math.max(0, this.totalEnemiesAlive - 1);
  }

  registerEnemyReached(): void {
    this.totalEnemiesAlive = Math.max(0, this.totalEnemiesAlive - 1);
  }

  allWavesCleared(): boolean {
    return (
      this.currentWaveIdx >= this.waves.length - 1 &&
      !this.inProgress &&
      this.queue.length === 0 &&
      this.totalEnemiesAlive === 0
    );
  }

  update(dt: number): void {
    if (this.inBreak) {
      this.preparationTimer -= dt;
      if (this.preparationTimer <= 0) {
        this.startNextWave();
      }
      return;
    }

    if (!this.inProgress) return;

    this.waveTimer += dt;

    while (this.queue.length > 0 && this.queue[0].time <= this.waveTimer) {
      const item = this.queue.shift()!;
      this.onSpawnRequest?.(item.enemyType, item.hpMult);
      this.spawnedCount++;
    }

    if (this.queue.length === 0 && this.totalEnemiesAlive === 0) {
      this.enterBreakPhase();
    }
  }
}

export type _WaveEventType = GameEvents['wave:start'] | GameEvents['wave:complete'];
