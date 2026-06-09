import type {
  LevelRecord,
  MetricsSnapshot,
  PlayerStatistics,
  ReplayData,
  SaveData,
} from '@/types';
import { eventBus } from './EventBus';

const STORAGE_KEY = 'traffic_sim_save_v1';
const CURRENT_VERSION = 1;

export class SaveManager {
  private data: SaveData | null = null;
  private autoSaveEnabled: boolean = true;

  constructor() {
    this.load();
  }

  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.data = this.createDefault();
        return this.data;
      }

      const parsed = JSON.parse(raw) as SaveData;
      this.data = this.migrate(parsed);
      eventBus.emit('save:loaded', this.data);
      return this.data;
    } catch (e) {
      console.error('Failed to load save:', e);
      this.data = this.createDefault();
      return this.data;
    }
  }

  save(): void {
    if (!this.data) return;

    this.data.updatedAt = Date.now();

    try {
      const serialized = JSON.stringify(this.data);
      localStorage.setItem(STORAGE_KEY, serialized);
      eventBus.emit('save:update', this.data);
    } catch (e) {
      console.error('Failed to save:', e);
      eventBus.emit('ui:toast', {
        message: '存档保存失败，可能是存储空间不足',
        type: 'error',
      });
    }
  }

  private createDefault(): SaveData {
    return {
      version: CURRENT_VERSION,
      playerId: `player_${Date.now()}`,
      statistics: {
        tutorialCompleted: false,
        tutorialSkipped: false,
        totalPlayTime: 0,
        levels: {},
      },
      currentLevel: 'level_1',
      replays: [],
      sandboxSettings: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  private migrate(data: SaveData): SaveData {
    if (data.version === CURRENT_VERSION) return data;

    const migrated = { ...data };
    if (!migrated.statistics.levels) migrated.statistics.levels = {};
    if (!migrated.replays) migrated.replays = [];
    if (!migrated.sandboxSettings) migrated.sandboxSettings = {};
    migrated.version = CURRENT_VERSION;
    return migrated;
  }

  getData(): SaveData | null {
    return this.data;
  }

  getStatistics(): PlayerStatistics {
    if (!this.data) this.load();
    return this.data!.statistics;
  }

  setCurrentLevel(levelId: string): void {
    if (!this.data) this.load();
    this.data!.currentLevel = levelId;
    this.save();
  }

  getCurrentLevel(): string {
    if (!this.data) this.load();
    return this.data!.currentLevel;
  }

  recordTutorial(skipped: boolean): void {
    if (!this.data) this.load();
    this.data!.statistics.tutorialCompleted = true;
    this.data!.statistics.tutorialSkipped = skipped;
    this.save();
    eventBus.emit('tutorial:complete', { skipped });
  }

  isTutorialCompleted(): boolean {
    if (!this.data) this.load();
    return this.data!.statistics.tutorialCompleted;
  }

  isTutorialSkipped(): boolean {
    if (!this.data) this.load();
    return this.data!.statistics.tutorialSkipped;
  }

  recordLevelAttempt(
    levelId: string,
    success: boolean,
    score: number,
    metrics: MetricsSnapshot,
    reason?: string
  ): LevelRecord {
    if (!this.data) this.load();

    const existing = this.data!.statistics.levels[levelId] || {
      completed: false,
      bestScore: 0,
      bestMetrics: null,
      attempts: 0,
      failures: 0,
      lastPlayedAt: 0,
      failureReasons: [],
    };

    existing.attempts += 1;
    existing.lastPlayedAt = Date.now();

    if (success) {
      existing.completed = true;
      if (score > existing.bestScore) {
        existing.bestScore = score;
        existing.bestMetrics = { ...metrics };
      }
      eventBus.emit('level:complete', { levelId, score, metrics });
    } else {
      existing.failures += 1;
      if (reason) {
        existing.failureReasons.push(reason);
        if (existing.failureReasons.length > 20) {
          existing.failureReasons = existing.failureReasons.slice(-20);
        }
      }
      eventBus.emit('level:fail', {
        levelId,
        reason: reason || '未知原因',
        attempt: existing.attempts,
      });
    }

    this.data!.statistics.levels[levelId] = existing;
    this.save();

    return existing;
  }

  getLevelRecord(levelId: string): LevelRecord {
    if (!this.data) this.load();
    return (
      this.data!.statistics.levels[levelId] || {
        completed: false,
        bestScore: 0,
        bestMetrics: null,
        attempts: 0,
        failures: 0,
        lastPlayedAt: 0,
        failureReasons: [],
      }
    );
  }

  isLevelUnlocked(levelId: string, unlockRequirement: string | null): boolean {
    if (!unlockRequirement) return true;
    if (!this.data) this.load();
    const reqRecord = this.data!.statistics.levels[unlockRequirement];
    return reqRecord?.completed || false;
  }

  addPlayTime(seconds: number): void {
    if (!this.data) this.load();
    this.data!.statistics.totalPlayTime += seconds;
    if (this.autoSaveEnabled && Math.random() < 0.1) {
      this.save();
    }
  }

  saveReplay(replay: Omit<ReplayData, 'id' | 'timestamp'>): ReplayData {
    if (!this.data) this.load();

    const fullReplay: ReplayData = {
      ...replay,
      id: `replay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    this.data!.replays.push(fullReplay);
    if (this.data!.replays.length > 20) {
      this.data!.replays = this.data!.replays.slice(-20);
    }
    this.save();
    return fullReplay;
  }

  getReplays(levelId?: string): ReplayData[] {
    if (!this.data) this.load();
    let replays = this.data!.replays;
    if (levelId) {
      replays = replays.filter((r) => r.levelId === levelId);
    }
    return replays.sort((a, b) => b.timestamp - a.timestamp);
  }

  getReplayById(replayId: string): ReplayData | null {
    if (!this.data) this.load();
    return this.data!.replays.find((r) => r.id === replayId) || null;
  }

  deleteReplay(replayId: string): void {
    if (!this.data) this.load();
    this.data!.replays = this.data!.replays.filter((r) => r.id !== replayId);
    this.save();
  }

  setSandboxSetting(key: string, value: unknown): void {
    if (!this.data) this.load();
    this.data!.sandboxSettings[key] = value;
    this.save();
  }

  getSandboxSetting<T>(key: string, defaultValue: T): T {
    if (!this.data) this.load();
    return (this.data!.sandboxSettings[key] as T) ?? defaultValue;
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.createDefault();
    eventBus.emit('save:update', this.data);
  }

  export(): string {
    if (!this.data) this.load();
    return JSON.stringify(this.data, null, 2);
  }

  import(json: string): boolean {
    try {
      const parsed = JSON.parse(json) as SaveData;
      if (!parsed.statistics || !parsed.version) throw new Error('Invalid');
      this.data = this.migrate(parsed);
      this.save();
      return true;
    } catch {
      return false;
    }
  }

  getCompletedLevels(): string[] {
    if (!this.data) this.load();
    return Object.entries(this.data!.statistics.levels)
      .filter(([, v]) => v.completed)
      .map(([k]) => k);
  }

  getTotalStats() {
    if (!this.data) this.load();
    const stats = this.data!.statistics;
    const levelRecords = Object.values(stats.levels);

    return {
      totalPlayTime: stats.totalPlayTime,
      tutorialCompleted: stats.tutorialCompleted,
      tutorialSkipped: stats.tutorialSkipped,
      completedLevels: levelRecords.filter((r) => r.completed).length,
      totalAttempts: levelRecords.reduce((s, r) => s + r.attempts, 0),
      totalFailures: levelRecords.reduce((s, r) => s + r.failures, 0),
      avgAttemptsPerLevel:
        levelRecords.length > 0
          ? levelRecords.reduce((s, r) => s + r.attempts, 0) /
            levelRecords.length
          : 0,
      bestScore: Math.max(0, ...levelRecords.map((r) => r.bestScore)),
    };
  }

  enableAutoSave(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
  }
}

export const saveManager = new SaveManager();
