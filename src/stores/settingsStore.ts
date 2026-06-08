import { create } from 'zustand';
import { SettingsData, InputMode } from '@/types/game';

const STORAGE_KEY = 'chem_lab_settings';

const defaultSettings: SettingsData = {
  inputMode: 'mouse',
  musicVolume: 0.5,
  sfxVolume: 0.7,
};

function loadSettings(): SettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...defaultSettings };
}

function persistSettings(data: SettingsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

interface SettingsState {
  settings: SettingsData;
  loadSettings: () => void;
  setInputMode: (mode: InputMode) => void;
  setMusicVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(),
  loadSettings: () => set({ settings: loadSettings() }),
  setInputMode: (mode) => {
    const settings = { ...get().settings, inputMode: mode };
    persistSettings(settings);
    set({ settings });
  },
  setMusicVolume: (vol) => {
    const settings = { ...get().settings, musicVolume: Math.max(0, Math.min(1, vol)) };
    persistSettings(settings);
    set({ settings });
  },
  setSfxVolume: (vol) => {
    const settings = { ...get().settings, sfxVolume: Math.max(0, Math.min(1, vol)) };
    persistSettings(settings);
    set({ settings });
  },
}));
