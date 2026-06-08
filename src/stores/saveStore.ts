import { create } from 'zustand';
import { SaveData, PlayTracker } from '@/types/game';

const STORAGE_KEY = 'chem_lab_save';

const defaultSave: SaveData = {
  currentLevel: 0,
  completedLevels: [],
  trackers: [],
  totalPlayTime: 0,
  totalFailures: 0,
};

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...defaultSave };
}

function persistSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

interface SaveState {
  save: SaveData;
  loadSave: () => void;
  completeLevel: (levelId: string, tracker: PlayTracker) => void;
  setCurrentLevel: (index: number) => void;
  resetSave: () => void;
  addPlayTime: (ms: number) => void;
}

export const useSaveStore = create<SaveState>((set, get) => ({
  save: loadSave(),
  loadSave: () => set({ save: loadSave() }),
  completeLevel: (levelId, tracker) => {
    const save = { ...get().save };
    if (!save.completedLevels.includes(levelId)) {
      save.completedLevels = [...save.completedLevels, levelId];
    }
    save.trackers = [...save.trackers, tracker];
    save.totalPlayTime += tracker.duration;
    save.totalFailures += tracker.failureCount;
    persistSave(save);
    set({ save });
  },
  setCurrentLevel: (index) => {
    const save = { ...get().save, currentLevel: index };
    persistSave(save);
    set({ save });
  },
  resetSave: () => {
    persistSave(defaultSave);
    set({ save: { ...defaultSave } });
  },
  addPlayTime: (ms) => {
    const save = { ...get().save, totalPlayTime: get().save.totalPlayTime + ms };
    persistSave(save);
    set({ save });
  },
}));
