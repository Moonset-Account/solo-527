import { getNextLevelId } from '../data/levelData';
import type {
  SaveSystem,
  ErrorType,
  FailureRecord,
  PlayerProgress,
  PlayerAnalytics,
} from './types';

export interface LevelReport {
  failures: number;
  failureBreakdown: Record<string, number>;
  timeSpent: number;
  retries: number;
}

const MAX_RECENT_FAILURES = 20;

function generateSnapshotId(): string {
  return `snap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class DataRecorder {
  private saveSystem: SaveSystem;
  currentLevelId?: string;
  levelStartTime?: number;
  failCountThisLevel: number;
  recentFailures: FailureRecord[];

  constructor(saveSystem: SaveSystem) {
    this.saveSystem = saveSystem;
    this.failCountThisLevel = 0;
    this.recentFailures = [];
  }

  startLevel(levelId: string): void {
    this.currentLevelId = levelId;
    this.levelStartTime = Date.now();
    this.failCountThisLevel = 0;
    this.recentFailures = [];

    this.saveSystem.updateAnalytics((analytics) => {
      analytics.levelsAttempted[levelId] = (analytics.levelsAttempted[levelId] ?? 0) + 1;
    });
  }

  recordFailure(errorType: ErrorType, step: string = ''): FailureRecord {
    const record: FailureRecord = {
      step,
      timestamp: Date.now(),
      errorType,
    };

    this.failCountThisLevel++;
    this.recentFailures.push(record);
    if (this.recentFailures.length > MAX_RECENT_FAILURES) {
      this.recentFailures.shift();
    }

    if (this.currentLevelId) {
      const levelId = this.currentLevelId;
      this.saveSystem.updateAnalytics((analytics) => {
        if (!analytics.levelFailures[levelId]) {
          analytics.levelFailures[levelId] = [];
        }
        analytics.levelFailures[levelId].push(record);
      });
    }

    return record;
  }

  recordRetry(): void {
    if (!this.currentLevelId) return;

    const levelId = this.currentLevelId;
    this.saveSystem.updateAnalytics((analytics) => {
      analytics.levelRetries[levelId] = (analytics.levelRetries[levelId] ?? 0) + 1;
    });
  }

  recordComponentPlaced(): void {
    this.saveSystem.updateAnalytics((analytics) => {
      analytics.componentsPlaced++;
    });
  }

  recordWireDrawn(): void {
    this.saveSystem.updateAnalytics((analytics) => {
      analytics.wiresDrawn++;
    });
  }

  recordTutorialSkip(stepId: string): void {
    this.saveSystem.updateAnalytics((analytics) => {
      analytics.tutorialStepsSkipped.push(stepId);
    });
    this.saveSystem.updateProgress((progress) => {
      progress.tutorialSkipped = true;
    });
  }

  recordTutorialComplete(): void {
    this.saveSystem.updateProgress((progress) => {
      progress.tutorialCompleted = true;
    });
  }

  completeLevel(levelId: string, stars: 0 | 1 | 2 | 3, timeSpent: number): void {
    this.saveSystem.updateProgress((progress) => {
      const currentStars = progress.levelStars[levelId] ?? 0;
      if (stars > currentStars) {
        progress.levelStars[levelId] = stars;
      }

      const currentBestTime = progress.levelBestTimes[levelId];
      if (currentBestTime === undefined || timeSpent < currentBestTime) {
        progress.levelBestTimes[levelId] = timeSpent;
      }

      const nextLevelId = getNextLevelId(levelId);
      if (nextLevelId && !progress.unlockedLevelIds.includes(nextLevelId)) {
        progress.unlockedLevelIds.push(nextLevelId);
      }
    });
  }

  generateLevelReport(levelId: string): LevelReport {
    const data = this.saveSystem.getData();
    const analytics: PlayerAnalytics = data.analytics;
    const progress: PlayerProgress = data.progress;

    const failures = analytics.levelFailures[levelId] ?? [];
    const failureBreakdown: Record<string, number> = {};

    for (const f of failures) {
      failureBreakdown[f.errorType] = (failureBreakdown[f.errorType] ?? 0) + 1;
    }

    return {
      failures: failures.length,
      failureBreakdown,
      timeSpent: progress.levelBestTimes[levelId] ?? 0,
      retries: analytics.levelRetries[levelId] ?? 0,
    };
  }

  getElapsedTime(): number {
    if (!this.levelStartTime) return 0;
    return Date.now() - this.levelStartTime;
  }

  clearRecentFailures(): void {
    this.recentFailures = [];
  }
}
