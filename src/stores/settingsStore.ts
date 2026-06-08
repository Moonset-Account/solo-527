import { create } from 'zustand'

interface SettingsStoreState {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  debugMode: boolean
}

interface SettingsStoreActions {
  setMasterVolume: (volume: number) => void
  setSfxVolume: (volume: number) => void
  setMusicVolume: (volume: number) => void
  setDebugMode: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsStoreState & SettingsStoreActions>()((set) => ({
  masterVolume: 0.8,
  sfxVolume: 0.7,
  musicVolume: 0.5,
  debugMode: false,

  setMasterVolume: (volume) => set({ masterVolume: volume }),
  setSfxVolume: (volume) => set({ sfxVolume: volume }),
  setMusicVolume: (volume) => set({ musicVolume: volume }),
  setDebugMode: (enabled) => set({ debugMode: enabled }),
}))
