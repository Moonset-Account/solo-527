import type { GameSettings } from './config';

export interface LevelProgress {
  levelId: string;
  unlocked: boolean;
  bestScore: number;
  stars: number;
  completed: boolean;
  attempts: number;
  bestTime: number;
  lastPlayed: number;
}

export interface GameStatistics {
  totalExperiments: number;
  totalScore: number;
  accuracyRate: number;
  safetyRate: number;
  learnTime: number;
  totalCorrectSteps: number;
  totalErrorSteps: number;
  knowledgeCardsViewed: number;
}

export interface StepRecord {
  stepId: string;
  status: 'completed' | 'failed' | 'skipped';
  score: number;
  timeTaken: number;
  errors: number;
}

export interface ExperimentRecord {
  id: string;
  levelId: string;
  levelName: string;
  timestamp: number;
  duration: number;
  score: number;
  stars: number;
  completed: boolean;
  totalErrors: number;
  safetyViolations: number;
  steps: StepRecord[];
  knowledgeViewed: string[];
}

export interface GameSave {
  version: string;
  timestamp: number;
  playerName: string;
  settings: GameSettings;
  progress: LevelProgress[];
  statistics: GameStatistics;
  records: ExperimentRecord[];
}

export interface SaveEnvelope {
  version: string;
  timestamp: number;
  checksum: string;
  payload: GameSave;
}

export type LevelResultStatus = 'success' | 'timeout' | 'failed_safety' | 'abandoned';

export interface LevelResult {
  status: LevelResultStatus;
  score: number;
  maxScore: number;
  stars: number;
  duration: number;
  accuracy: number;
  safety: number;
  efficiency: number;
  errors: number;
  safetyViolations: number;
  stepRecords: StepRecord[];
  knowledgeViewed: string[];
}
