import { create } from 'zustand';
import type { GameSave, LevelProgress, GameStatistics, ExperimentRecord } from '../types/save';
import { createNewSave, loadSave, writeSave, clearSave, addExperimentRecord, exportSaveToFile, importSaveFromFile } from '../utils/save';
import { useSettingsStore } from './useSettingsStore';

interface SaveState {
  save: GameSave;
  loading: boolean;
  load: () => void;
  saveNow: () => boolean;
  clearAll: () => void;
  addRecord: (record: ExperimentRecord) => void;
  updateProgress: (levelId: string, updates: Partial<LevelProgress>) => void;
  updateStatistics: (updates: Partial<GameStatistics>) => void;
  exportData: () => void;
  importData: (file: File) => Promise<boolean>;
  getProgress: (levelId: string) => LevelProgress | undefined;
}

export const useSaveStore = create<SaveState>((set, get) => ({
  save: createNewSave(),
  loading: false,
  load: () => {
    const save = loadSave();
    set({ save, loading: false });
    useSettingsStore.getState().setSettings(save.settings);
  },
  saveNow: () => {
    const { save } = get();
    const settings = useSettingsStore.getState().settings;
    const toSave = { ...save, settings, timestamp: Date.now() };
    const ok = writeSave(toSave);
    if (ok) set({ save: toSave });
    return ok;
  },
  clearAll: () => {
    clearSave();
    const newSave = createNewSave();
    set({ save: newSave });
    useSettingsStore.getState().setSettings(newSave.settings);
  },
  addRecord: (record) => {
    const { save, saveNow } = get();
    const updated = addExperimentRecord(save, record);
    set({ save: updated });
    saveNow();
  },
  updateProgress: (levelId, updates) => set(s => {
    const idx = s.save.progress.findIndex(p => p.levelId === levelId);
    if (idx < 0) return s;
    const progress = [...s.save.progress];
    progress[idx] = { ...progress[idx], ...updates };
    return { save: { ...s.save, progress } };
  }),
  updateStatistics: (updates) => set(s => ({
    save: { ...s.save, statistics: { ...s.save.statistics, ...updates } },
  })),
  exportData: () => exportSaveToFile(get().save),
  importData: async (file) => {
    const data = await importSaveFromFile(file);
    if (!data) return false;
    set({ save: data });
    useSettingsStore.getState().setSettings(data.settings);
    get().saveNow();
    return true;
  },
  getProgress: (levelId) => get().save.progress.find(p => p.levelId === levelId),
}));
