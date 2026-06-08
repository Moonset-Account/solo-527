import type { PlayStats, AdjustmentSnapshot, ScoreSnapshot } from '@/types';

const DEFAULT_STATS: PlayStats = {
  levelId: '',
  playTimeSeconds: 0,
  failureCount: 0,
  adjustments: [],
  scoreHistory: [],
};

let stats: PlayStats = { ...DEFAULT_STATS };

export function startLevel(levelId: string): void {
  stats = { ...DEFAULT_STATS, levelId };
}

export function recordAdjustment(snapshot: AdjustmentSnapshot): void {
  stats.adjustments = [...stats.adjustments, snapshot];
}

export function recordScore(snapshot: ScoreSnapshot): void {
  stats.scoreHistory = [...stats.scoreHistory, snapshot];
}

export function incrementFailure(): void {
  stats = { ...stats, failureCount: stats.failureCount + 1 };
}

export function getStats(): PlayStats {
  return { ...stats };
}

export function updatePlayTime(dt: number): void {
  stats = { ...stats, playTimeSeconds: stats.playTimeSeconds + dt };
}

export function reset(): void {
  stats = { ...DEFAULT_STATS };
}
