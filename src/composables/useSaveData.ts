import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { SaveData } from '@/types'

export function useSaveData() {
  const progressStore = useProgressStore()
  const settingsStore = useSettingsStore()

  function save() {
    const data = progressStore.getSaveData()
    data.settings = {
      musicVolume: settingsStore.musicVolume,
      sfxVolume: settingsStore.sfxVolume,
      showFps: settingsStore.showFps,
      frameRateMode: settingsStore.frameRateMode,
      inputMapping: { ...settingsStore.inputMapping },
    }
    localStorage.setItem('cipai_save', JSON.stringify(data))
  }

  function load(): boolean {
    const raw = localStorage.getItem('cipai_save')
    if (!raw) return false
    try {
      const data: SaveData = JSON.parse(raw)
      progressStore.loadSaveData(data)
      settingsStore.loadFromData(data.settings)
      return true
    } catch {
      return false
    }
  }

  function exportSave(): string {
    const data = progressStore.getSaveData()
    data.settings = {
      musicVolume: settingsStore.musicVolume,
      sfxVolume: settingsStore.sfxVolume,
      showFps: settingsStore.showFps,
      frameRateMode: settingsStore.frameRateMode,
      inputMapping: { ...settingsStore.inputMapping },
    }
    return JSON.stringify(data, null, 2)
  }

  function importSave(json: string): boolean {
    try {
      const data: SaveData = JSON.parse(json)
      progressStore.loadSaveData(data)
      settingsStore.loadFromData(data.settings)
      save()
      return true
    } catch {
      return false
    }
  }

  function resetAll() {
    progressStore.resetProgress()
    localStorage.removeItem('cipai_save')
  }

  return {
    save,
    load,
    exportSave,
    importSave,
    resetAll,
  }
}
