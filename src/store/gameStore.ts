import { create } from 'zustand';
import type { ScoreResult } from '@/engine/types';
import { LEVEL_MAP } from '@/config/levels';

interface LevelResult {
  score: ScoreResult;
  beforeScore: ScoreResult | null;
}

interface GameStoreState {
  currentLevel: string | null;
  levelResults: Record<string, ScoreResult>;
  levelComparisons: Record<string, LevelResult>;
  unlockedLevels: string[];
}

interface GameStoreActions {
  setCurrentLevel: (levelId: string) => void;
  completeLevel: (levelId: string, result: ScoreResult, beforeScore?: ScoreResult | null) => void;
  retryLevel: (levelId: string) => void;
  resetGame: () => void;
}

const INITIAL_UNLOCKED = ['tutorial', 'level-1'];

const initialState: GameStoreState = {
  currentLevel: null,
  levelResults: {},
  levelComparisons: {},
  unlockedLevels: [...INITIAL_UNLOCKED],
};

const LEVEL_ORDER = ['tutorial', 'level-1', 'level-2', 'level-3', 'level-4', 'level-5'];

function getNextLevelId(currentId: string): string | null {
  const idx = LEVEL_ORDER.indexOf(currentId);
  if (idx === -1 || idx >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
}

export type GameStore = GameStoreState & GameStoreActions;

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setCurrentLevel: (levelId: string) => {
    if (!LEVEL_MAP[levelId]) return;
    set({ currentLevel: levelId });
  },

  completeLevel: (levelId: string, result: ScoreResult, beforeScore?: ScoreResult | null) => {
    const { levelResults, levelComparisons, unlockedLevels } = get();
    const prevResult = levelResults[levelId];
    const isNewBest = !prevResult || result.starRating > prevResult.starRating;
    const updatedResults = {
      ...levelResults,
      ...(isNewBest ? { [levelId]: result } : {}),
    };

    const updatedComparisons = {
      ...levelComparisons,
      [levelId]: { score: result, beforeScore: beforeScore ?? null },
    };

    const nextLevel = getNextLevelId(levelId);
    const updatedUnlocked =
      nextLevel && !unlockedLevels.includes(nextLevel)
        ? [...unlockedLevels, nextLevel]
        : unlockedLevels;

    set({
      levelResults: updatedResults,
      levelComparisons: updatedComparisons,
      unlockedLevels: updatedUnlocked,
    });
  },

  retryLevel: (levelId: string) => {
    set({ currentLevel: levelId });
  },

  resetGame: () => {
    set(initialState);
  },
}));
