import { create } from 'zustand';
import type { Settings } from '@/types';

const STORAGE_KEY = 'chem-lab-settings';

const defaultSettings: Settings = {
  masterVolume: 80,
  sfxVolume: 70,
  bgmVolume: 50,
  debugMode: false,
  showFps: false,
};

interface SettingsStore extends Settings {
  setMasterVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setBgmVolume: (v: number) => void;
  setDebugMode: (v: boolean) => void;
  setShowFps: (v: boolean) => void;
  loadSettings: () => void;
  saveSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  ...defaultSettings,

  setMasterVolume: (v) => {
    set({ masterVolume: v });
    get().saveSettings();
  },

  setSfxVolume: (v) => {
    set({ sfxVolume: v });
    get().saveSettings();
  },

  setBgmVolume: (v) => {
    set({ bgmVolume: v });
    get().saveSettings();
  },

  setDebugMode: (v) => {
    set({ debugMode: v });
    get().saveSettings();
  },

  setShowFps: (v) => {
    set({ showFps: v });
    get().saveSettings();
  },

  loadSettings: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        set({
          masterVolume: parsed.masterVolume ?? defaultSettings.masterVolume,
          sfxVolume: parsed.sfxVolume ?? defaultSettings.sfxVolume,
          bgmVolume: parsed.bgmVolume ?? defaultSettings.bgmVolume,
          debugMode: parsed.debugMode ?? defaultSettings.debugMode,
          showFps: parsed.showFps ?? defaultSettings.showFps,
        });
      }
    } catch {
      set({ ...defaultSettings });
    }
  },

  saveSettings: () => {
    const { masterVolume, sfxVolume, bgmVolume, debugMode, showFps } = get();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ masterVolume, sfxVolume, bgmVolume, debugMode, showFps }),
      );
    } catch {
      // storage full or unavailable
    }
  },
}));
