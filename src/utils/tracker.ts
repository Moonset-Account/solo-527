import { PlayTracker, KeyChoice } from '@/types/game';
import { saveToStorage, loadFromStorage } from './storage';

const TRACKER_KEY = 'chem_lab_tracker_log';

export function createTracker(levelId: string): PlayTracker {
  return {
    levelId,
    startTime: Date.now(),
    endTime: 0,
    duration: 0,
    failureCount: 0,
    keyChoices: [],
    score: 100,
    hintsUsed: 0,
  };
}

export function recordChoice(tracker: PlayTracker, stepId: string, choice: string, correct: boolean): PlayTracker {
  const keyChoice: KeyChoice = {
    stepId,
    timestamp: Date.now(),
    choice,
    correct,
  };
  return {
    ...tracker,
    keyChoices: [...tracker.keyChoices, keyChoice],
    score: correct ? tracker.score : Math.max(0, tracker.score - 10),
  };
}

export function recordFailure(tracker: PlayTracker): PlayTracker {
  return {
    ...tracker,
    failureCount: tracker.failureCount + 1,
    score: Math.max(0, tracker.score - 10),
  };
}

export function recordHint(tracker: PlayTracker): PlayTracker {
  return {
    ...tracker,
    hintsUsed: tracker.hintsUsed + 1,
    score: Math.max(0, tracker.score - 5),
  };
}

export function finalizeTracker(tracker: PlayTracker): PlayTracker {
  return {
    ...tracker,
    endTime: Date.now(),
    duration: Date.now() - tracker.startTime,
  };
}

export function saveTrackerLog(tracker: PlayTracker): void {
  const logs = loadFromStorage<PlayTracker[]>(TRACKER_KEY, []);
  logs.push(tracker);
  saveToStorage(TRACKER_KEY, logs);
}

export function getTrackerLogs(): PlayTracker[] {
  return loadFromStorage<PlayTracker[]>(TRACKER_KEY, []);
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
