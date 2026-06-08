import { create } from 'zustand';
import type { GameSettings, GraphicsSettings, AudioSettings, InputDevice, InputAction } from '../types/config';
import { DEFAULT_SETTINGS } from '../utils/save';

interface SettingsState {
  settings: GameSettings;
  setGraphics: (g: Partial<GraphicsSettings>) => void;
  setAudio: (a: Partial<AudioSettings>) => void;
  setInputDevice: (d: InputDevice) => void;
  rebind: (action: InputAction, device: InputDevice, key: string, index?: number) => void;
  resetInputBindings: () => void;
  togglePerfStats: () => void;
  toggleHints: () => void;
  setSettings: (s: GameSettings) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: structuredClone(DEFAULT_SETTINGS),
  setGraphics: (g) => set(s => ({
    settings: { ...s.settings, graphics: { ...s.settings.graphics, ...g } },
  })),
  setAudio: (a) => set(s => ({
    settings: { ...s.settings, audio: { ...s.settings.audio, ...a } },
  })),
  setInputDevice: (d) => set(s => ({
    settings: { ...s.settings, currentInputDevice: d },
  })),
  rebind: (action, device, key, index = 0) => set(s => {
    const bindings = structuredClone(s.settings.inputs[device].bindings);
    const arr = bindings[action];
    if (arr.length <= index) arr.push(key); else arr[index] = key;
    return {
      settings: {
        ...s.settings,
        inputs: {
          ...s.settings.inputs,
          [device]: { device, bindings },
        },
      },
    };
  }),
  resetInputBindings: () => set(s => ({
    settings: {
      ...s.settings,
      inputs: structuredClone(DEFAULT_SETTINGS.inputs),
    },
  })),
  togglePerfStats: () => set(s => ({
    settings: { ...s.settings, showPerfStats: !s.settings.showPerfStats },
  })),
  toggleHints: () => set(s => ({
    settings: { ...s.settings, showHints: !s.settings.showHints },
  })),
  setSettings: (settings) => set({ settings }),
}));
