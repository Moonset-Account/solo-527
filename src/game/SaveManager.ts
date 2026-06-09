import type {
  AdjustmentRecord,
  FailureSource,
  FailureStepRecord,
  LevelRecord,
  MetricsSnapshot,
  PhaseConfig,
  PlayerStatistics,
  ReplayData,
  SaveData,
} from '@/types';
import { eventBus } from './EventBus';

const STORAGE_KEY = 'traffic_sim_save_v1';
const CURRENT_VERSION = 2;

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
        this.save();
        return this.data;
      }

      const parsed = JSON.parse(raw) as SaveData;
      this.data = this.migrate(parsed);
      this.save();
      eventBus.emit('save:loaded', this.data);
      return this.data;
    } catch (e) {
      console.error('Failed to load save:', e);
      this.data = this.createDefault();
      this.save();
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

  private createEmptyLevelRecord(): LevelRecord {
    return {
      completed: false,
      bestScore: 0,
      bestMetrics: null,
      attempts: 0,
      failures: 0,
      lastPlayedAt: 0,
      firstAttemptedAt: null,
      lastAttemptedAt: null,
      failureReasons: [],
      failureSteps: [],
      adjustmentHistory: [],
      tutorialSkippedAt: null,
      tutorialCompletedAt: null,
      attemptStartTimes: [],
    };
  }

  private ensureLevelRecord(levelId: string): LevelRecord {
    if (!this.data) this.load();
    if (!this.data!.statistics.levels[levelId]) {
      this.data!.statistics.levels[levelId] = this.createEmptyLevelRecord();
    }
    const rec = this.data!.statistics.levels[levelId] as any;
    const defaults: LevelRecord = this.createEmptyLevelRecord();
    let changed = false;
    for (const k of Object.keys(defaults) as (keyof LevelRecord)[]) {
      if (rec[k] === undefined || rec[k] === null) {
        if (Array.isArray((defaults as any)[k])) {
          (rec as any)[k] = [];
        } else {
          (rec as any)[k] = (defaults as any)[k];
        }
        changed = true;
      }
    }
    if (!Array.isArray(rec.adjustmentHistory)) {
      rec.adjustmentHistory = [];
      changed = true;
    }
    if (!Array.isArray(rec.failureReasons)) {
      rec.failureReasons = [];
      changed = true;
    }
    if (!Array.isArray(rec.failureSteps)) {
      rec.failureSteps = [];
      changed = true;
    }
    if (!Array.isArray(rec.attemptStartTimes)) {
      rec.attemptStartTimes = [];
      changed = true;
    }
    if (changed) this.save();
    return rec as LevelRecord;
  }

  private createDefault(): SaveData {
    return {
      version: CURRENT_VERSION,
      playerId: `player_${Date.now()}`,
      statistics: {
        tutorialCompleted: false,
        tutorialSkipped: false,
        tutorialCompletedAt: null,
        tutorialSkippedAt: null,
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
    try {
      const migrated: any = { ...data };

      if (!migrated.version) migrated.version = 0;
      if (!migrated.statistics) {
        migrated.statistics = {
          tutorialCompleted: false,
          tutorialSkipped: false,
          tutorialCompletedAt: null,
          tutorialSkippedAt: null,
          totalPlayTime: 0,
          levels: {},
        };
      }
      if (!migrated.replays) migrated.replays = [];
      if (!migrated.sandboxSettings) migrated.sandboxSettings = {};

      const stats = migrated.statistics as any;
      if (stats.tutorialCompletedAt === undefined) stats.tutorialCompletedAt = null;
      if (stats.tutorialSkippedAt === undefined) stats.tutorialSkippedAt = null;
      if (stats.tutorialSkipped === undefined) stats.tutorialSkipped = false;
      if (stats.tutorialCompleted === undefined) stats.tutorialCompleted = false;
      if (!stats.levels) stats.levels = {};

      for (const [levelId, lvl] of Object.entries<any>(stats.levels)) {
        const empty = this.createEmptyLevelRecord() as any;
        for (const k of Object.keys(empty)) {
          if ((lvl as any)[k] === undefined || (lvl as any)[k] === null) {
            if (Array.isArray(empty[k])) {
              (lvl as any)[k] = [];
            } else {
              (lvl as any)[k] = empty[k];
            }
          }
        }
        if (!Array.isArray((lvl as any).adjustmentHistory)) (lvl as any).adjustmentHistory = [];
        if (!Array.isArray((lvl as any).failureReasons)) (lvl as any).failureReasons = [];
        if (!Array.isArray((lvl as any).failureSteps)) (lvl as any).failureSteps = [];
        if (!Array.isArray((lvl as any).attemptStartTimes)) (lvl as any).attemptStartTimes = [];
        stats.levels[levelId] = lvl;
      }

      migrated.version = CURRENT_VERSION;
      return migrated as SaveData;
    } catch (e) {
      console.error('migrate failed, fallback to default', e);
      return this.createDefault();
    }
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
    const now = Date.now();
    this.data!.statistics.tutorialCompleted = true;
    this.data!.statistics.tutorialSkipped = skipped;
    if (skipped) {
      this.data!.statistics.tutorialSkippedAt = now;
    } else {
      this.data!.statistics.tutorialCompletedAt = now;
    }

    const curLvl = this.data!.currentLevel;
    if (curLvl) {
      const rec = this.ensureLevelRecord(curLvl);
      if (skipped) {
        rec.tutorialSkippedAt = now;
      } else {
        rec.tutorialCompletedAt = now;
      }
      this.data!.statistics.levels[curLvl] = rec;
    }
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

  recordAttemptStart(levelId: string): LevelRecord {
    if (!this.data) this.load();
    const now = Date.now();
    const existing = this.ensureLevelRecord(levelId);
    existing.attempts += 1;
    existing.lastAttemptedAt = now;
    if (!existing.firstAttemptedAt) existing.firstAttemptedAt = now;
    existing.attemptStartTimes.push(now);
    if (existing.attemptStartTimes.length > 100) {
      existing.attemptStartTimes = existing.attemptStartTimes.slice(-100);
    }
    if (this.data!.statistics.tutorialSkipped) {
      existing.tutorialSkippedAt = this.data!.statistics.tutorialSkippedAt;
    }
    if (this.data!.statistics.tutorialCompleted) {
      existing.tutorialCompletedAt = this.data!.statistics.tutorialCompletedAt;
    }
    this.data!.statistics.levels[levelId] = existing;
    this.save();
    eventBus.emit('level:attempt', { levelId, attempt: existing.attempts });
    return existing;
  }

  appendFailureStep(
    levelId: string,
    step: Omit<FailureStepRecord, 'id' | 'timestamp'>
  ): FailureStepRecord | null {
    if (!this.data) this.load();
    if (!levelId) return null;

    const existing = this.ensureLevelRecord(levelId);
    const fullStep: FailureStepRecord = {
      ...step,
      id: `fail_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    existing.failureSteps.push(fullStep);
    if (existing.failureSteps.length > 100) {
      existing.failureSteps = existing.failureSteps.slice(-100);
    }
    const simpleReason = `[${fullStep.source}] ${fullStep.reason}`;
    if (
      existing.failureReasons[existing.failureReasons.length - 1] !== simpleReason
    ) {
      existing.failureReasons.push(simpleReason);
      if (existing.failureReasons.length > 20) {
        existing.failureReasons = existing.failureReasons.slice(-20);
      }
    }
    this.data!.statistics.levels[levelId] = existing;
    this.save();
    eventBus.emit('level:failure_step', { levelId, step: fullStep });
    return fullStep;
  }

  recordLevelAttempt(
    levelId: string,
    success: boolean,
    score: number,
    metrics: MetricsSnapshot,
    reason?: string,
    timingAtEnd?: PhaseConfig
  ): LevelRecord {
    if (!this.data) this.load();

    const existing = this.ensureLevelRecord(levelId);
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
        const finalReason = `[结算] ${reason}`;
        existing.failureReasons.push(finalReason);
        if (existing.failureReasons.length > 20) {
          existing.failureReasons = existing.failureReasons.slice(-20);
        }
        existing.failureSteps.push({
          id: `fail_end_${Date.now()}`,
          timestamp: Date.now(),
          simulationTime: 0,
          source: 'timeout',
          reason,
          metricsSnapshot: {
            congestionIndex: metrics.congestionIndex,
            avgWaitingTime: metrics.avgWaitingTime,
            throughput: metrics.throughput,
            busOnTimeRate: metrics.busOnTimeRate,
            vehicleCount: metrics.vehicleCount,
          },
          timingAtFailure: timingAtEnd,
        });
        if (existing.failureSteps.length > 100) {
          existing.failureSteps = existing.failureSteps.slice(-100);
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
    return this.ensureLevelRecord(levelId);
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
    this.save();
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
      tutorialCompletedAt: stats.tutorialCompletedAt,
      tutorialSkippedAt: stats.tutorialSkippedAt,
      completedLevels: levelRecords.filter((r) => r.completed).length,
      totalAttempts: levelRecords.reduce((s, r) => s + r.attempts, 0),
      totalFailures: levelRecords.reduce((s, r) => s + r.failures, 0),
      avgAttemptsPerLevel:
        levelRecords.length > 0
          ? levelRecords.reduce((s, r) => s + r.attempts, 0) / levelRecords.length
          : 0,
      bestScore: Math.max(0, ...levelRecords.map((r) => r.bestScore)),
    };
  }

  recordAdjustment(levelId: string, adjustment: AdjustmentRecord): void {
    if (!levelId) return;
    try {
      if (!this.data) this.load();
      const existing = this.ensureLevelRecord(levelId);
      existing.adjustmentHistory.push(adjustment);
      if (existing.adjustmentHistory.length > 100) {
        existing.adjustmentHistory = existing.adjustmentHistory.slice(-100);
      }
      this.data!.statistics.levels[levelId] = existing;
      this.save();
      eventBus.emit('timing:recorded', { levelId, adjustment });
    } catch (e) {
      console.error('[recordAdjustment] failed for level:', levelId, e);
    }
  }

  getLatestReplayIdByLevel(levelId: string): string | null {
    const replays = this.getReplays(levelId);
    return replays.length > 0 ? replays[0].id : null;
  }

  getAdjustmentHistory(levelId: string): AdjustmentRecord[] {
    return this.getLevelRecord(levelId).adjustmentHistory || [];
  }

  getFailureSteps(levelId: string): FailureStepRecord[] {
    return this.getLevelRecord(levelId).failureSteps || [];
  }

  enableAutoSave(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
  }
}

export const saveManager = new SaveManager();
