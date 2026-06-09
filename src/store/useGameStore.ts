import { create } from 'zustand';
import type {
  SaveData,
  GameSettings,
  PlayerProgress,
  PlayerAnalytics,
  SavedCircuit,
  CircuitData,
} from '@/game/types';
import SaveSystem from '@/core/SaveSystem';
import { DEFAULT_GAME_SETTINGS } from '@/data/defaults';

export type SceneId = 'menu' | 'level-select' | 'sandbox' | 'settings' | 'result' | 'saved-circuits';

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
  lastCircuitSnapshot: CircuitData | null;
  hasSave: boolean;

  setScene: (scene: SceneId) => void;
  setCurrentLevel: (levelId: string | null) => void;
  setResultPayload: (payload: ResultPayload | null) => void;
  setLastCircuitSnapshot: (circuit: CircuitData | null) => void;
  loadSave: () => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  updateProgress: (mutator: (p: PlayerProgress) => void) => void;
  updateAnalytics: (mutator: (a: PlayerAnalytics) => void) => void;
  saveCircuit: (circuit: SavedCircuit) => void;
  deleteCircuit: (id: string) => void;
  resetAll: () => void;
  resetTutorial: () => void;
  setSaveData: (data: SaveData) => void;
  openSavedCircuit: (id: string) => void;
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
    lastCircuitSnapshot: null,
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

  setLastCircuitSnapshot: (circuit) => {
    set({ lastCircuitSnapshot: circuit });
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

  deleteCircuit: (id) => {
    const updated = saveSystem.deleteCircuit(id);
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

  openSavedCircuit: (id) => {
    const saved = get().saveData.savedCircuits.find((s) => s.id === id);
    if (!saved) return;
    // 将电路数据暂存，SandboxScene 初始化时会读取 lastCircuitSnapshot
    // 注意：如果没有设置 lastCircuitSnapshot，自由模式通过 setCurrentLevel(null) 进入 sandbox
    // 可以在 SandboxScene 的 useEffect 检测 currentLevelId === null 且 lastCircuitSnapshot 有值时自动载入
    set({ lastCircuitSnapshot: saved.circuit, currentLevelId: null, currentScene: 'sandbox' });
  },
}));

export { DEFAULT_GAME_SETTINGS };
export default useGameStore;
