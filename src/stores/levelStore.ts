import { create } from 'zustand';
import type { Level, GameProgress } from '@/types';
import { levels as defaultLevels } from '@/data/levels';

const STORAGE_KEY = 'chem-lab-progress';

interface LevelStore {
  levels: Level[];
  progress: Record<string, GameProgress>;
  loadProgress: () => void;
  saveProgress: () => void;
  updateProgress: (levelId: string, stars: number, time: number) => void;
  isLevelUnlocked: (levelId: string) => boolean;
  getLevelById: (id: string) => Level | undefined;
  addCustomLevel: (level: Level) => void;
  removeCustomLevel: (levelId: string) => void;
}

export const useLevelStore = create<LevelStore>()((set, get) => ({
  levels: [...defaultLevels],
  progress: {},

  loadProgress: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, GameProgress>;
        set({ progress: parsed });
      }
    } catch {
      set({ progress: {} });
    }
  },

  saveProgress: () => {
    const { progress } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // storage full or unavailable
    }
  },

  updateProgress: (levelId, stars, time) => {
    set((state) => {
      const existing = state.progress[levelId];
      const updated: GameProgress = {
        stars: existing ? Math.max(existing.stars, stars) : stars,
        bestTime: existing ? Math.min(existing.bestTime, time) : time,
        completed: true,
      };
      return {
        progress: { ...state.progress, [levelId]: updated },
      };
    });
    get().saveProgress();
  },

  isLevelUnlocked: (levelId) => {
    const { levels, progress } = get();
    if (levels.length === 0) return false;
    if (levels[0].id === levelId) return true;
    const index = levels.findIndex((l) => l.id === levelId);
    if (index <= 0) return false;
    const previousLevel = levels[index - 1];
    return progress[previousLevel.id]?.completed === true;
  },

  getLevelById: (id) => {
    return get().levels.find((l) => l.id === id);
  },

  addCustomLevel: (level) => {
    set((state) => ({
      levels: [...state.levels, level],
    }));
  },

  removeCustomLevel: (levelId) => {
    set((state) => ({
      levels: state.levels.filter((l) => l.id !== levelId),
      progress: Object.fromEntries(
        Object.entries(state.progress).filter(([key]) => key !== levelId),
      ),
    }));
    get().saveProgress();
  },
}));
