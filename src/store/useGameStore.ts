import { create } from 'zustand';
import type { SaveData, GameSettings, PlayerProgress, PlayerAnalytics, SavedCircuit } from '@/game/types';
import SaveSystem from '@/core/SaveSystem';
import { DEFAULT_GAME_SETTINGS } from '@/data/defaults';

export type SceneId = 'menu' | 'level-select' | 'sandbox' | 'settings' | 'result';

export interface ResultPayload {
  timeSpent: number;
  stars: 0 | 1 | 2 | 3;
  usedComponents: number;
  wiresCount: number;
  failures: number;
  retries: number;
  errorDistribution?: Record<string, number>;
}

interface GameState {
  currentScene: SceneId;
  currentLevelId: string | null;
  saveData: SaveData;
  resultPayload: ResultPayload | null;
  hasSave: boolean;

  setScene: (scene: SceneId) => void;
  setCurrentLevel: (levelId: string | null) => void;
  setResultPayload: (payload: ResultPayload | null) => void;
  loadSave: () => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  updateProgress: (mutator: (p: PlayerProgress) => void) => void;
  updateAnalytics: (mutator: (a: PlayerAnalytics) => void) => void;
  saveCircuit: (circuit: SavedCircuit) => void;
  resetAll: () => void;
  resetTutorial: () => void;
  setSaveData: (data: SaveData) => void;
}

const saveSystem = SaveSystem.getInstance();

const createInitialState = () => {
  const initialData = saveSystem.load();
  const hasSave = Object.keys(initialData.progress.levelStars).length > 0 ||
    initialData.progress.unlockedLevelIds.length > 1;
  return {
    currentScene: 'menu' as SceneId,
    currentLevelId: null,
    saveData: initialData,
    resultPayload: null,
    hasSave,
  };
};

const useGameStore = create<GameState>((set, get) => ({
  ...createInitialState(),

  setScene: (scene) => {
    set({ currentScene: scene });
  },

  setCurrentLevel: (levelId) => {
    set({ currentLevelId: levelId });
  },

  setResultPayload: (payload) => {
    set({ resultPayload: payload });
  },

  loadSave: () => {
    const data = saveSystem.load();
    const hasSave = Object.keys(data.progress.levelStars).length > 0 ||
      data.progress.unlockedLevelIds.length > 1;
    set({ saveData: data, hasSave });
  },

  updateSettings: (partial) => {
    const updated = saveSystem.updateSettings(partial);
    set({ saveData: updated });
  },

  updateProgress: (mutator) => {
    const updated = saveSystem.updateProgress(mutator);
    const hasSave = Object.keys(updated.progress.levelStars).length > 0 ||
      updated.progress.unlockedLevelIds.length > 1;
    set({ saveData: updated, hasSave });
  },

  updateAnalytics: (mutator) => {
    const updated = saveSystem.updateAnalytics(mutator);
    set({ saveData: updated });
  },

  saveCircuit: (circuit) => {
    const updated = saveSystem.saveCircuit(circuit);
    set({ saveData: updated });
  },

  resetAll: () => {
    const fresh = saveSystem.reset();
    set({
      saveData: fresh,
      resultPayload: null,
      currentLevelId: null,
      currentScene: 'menu',
      hasSave: false,
    });
  },

  resetTutorial: () => {
    const updated = saveSystem.updateProgress((p) => {
      p.tutorialCompleted = false;
      p.tutorialSkipped = false;
    });
    set({ saveData: updated });
  },

  setSaveData: (data) => {
    saveSystem.save(data);
    const hasSave = Object.keys(data.progress.levelStars).length > 0 ||
      data.progress.unlockedLevelIds.length > 1;
    set({ saveData: data, hasSave });
  },
}));

export { DEFAULT_GAME_SETTINGS };
export default useGameStore;
