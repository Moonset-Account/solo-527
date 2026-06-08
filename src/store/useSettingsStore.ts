import { create } from 'zustand';
import * as AudioTrigger from '@/engine/AudioTrigger';

const SETTINGS_KEY = 'traffic_sim_settings';

interface SettingsState {
  masterVolume: number;
  sfxVolume: number;
  bgmVolume: number;
  quality: 'low' | 'medium' | 'high';

  setMasterVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setBgmVolume: (v: number) => void;
  setQuality: (q: 'low' | 'medium' | 'high') => void;
  loadSettings: () => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  masterVolume: 0.7,
  sfxVolume: 0.8,
  bgmVolume: 0.5,
  quality: 'medium',

  setMasterVolume: (v) => {
    AudioTrigger.setMasterVolume(v);
    set({ masterVolume: v });
  },
  setSfxVolume: (v) => {
    AudioTrigger.setSfxVolume(v);
    set({ sfxVolume: v });
  },
  setBgmVolume: (v) => {
    AudioTrigger.setBgmVolume(v);
    set({ bgmVolume: v });
  },
  setQuality: (q) => set({ quality: q }),
  loadSettings: () => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.masterVolume !== undefined) AudioTrigger.setMasterVolume(parsed.masterVolume);
        if (parsed.sfxVolume !== undefined) AudioTrigger.setSfxVolume(parsed.sfxVolume);
        if (parsed.bgmVolume !== undefined) AudioTrigger.setBgmVolume(parsed.bgmVolume);
        set({
          masterVolume: parsed.masterVolume ?? 0.7,
          sfxVolume: parsed.sfxVolume ?? 0.8,
          bgmVolume: parsed.bgmVolume ?? 0.5,
          quality: parsed.quality ?? 'medium',
        });
      }
    } catch {}
  },
  resetSettings: () => {
    AudioTrigger.setMasterVolume(0.7);
    AudioTrigger.setSfxVolume(0.8);
    AudioTrigger.setBgmVolume(0.5);
    set({ masterVolume: 0.7, sfxVolume: 0.8, bgmVolume: 0.5, quality: 'medium' });
  },
}));

useSettingsStore.subscribe((state) => {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        masterVolume: state.masterVolume,
        sfxVolume: state.sfxVolume,
        bgmVolume: state.bgmVolume,
        quality: state.quality,
      }),
    );
  } catch {}
});
