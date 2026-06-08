import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GameSettings } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  const musicVolume = ref(0.5)
  const sfxVolume = ref(0.7)
  const showFps = ref(false)
  const frameRateMode = ref<'auto' | '30' | '60'>('auto')
  const inputMapping = ref<Record<string, string>>({
    h: 'hint',
    z: 'undo',
    ' ': 'pause',
    Escape: 'menu',
    Enter: 'confirm',
  })

  function setMusicVolume(v: number) {
    musicVolume.value = Math.max(0, Math.min(1, v))
  }

  function setSfxVolume(v: number) {
    sfxVolume.value = Math.max(0, Math.min(1, v))
  }

  function setShowFps(v: boolean) {
    showFps.value = v
  }

  function setFrameRateMode(mode: 'auto' | '30' | '60') {
    frameRateMode.value = mode
  }

  function remapKey(oldKey: string, newKey: string) {
    const action = inputMapping.value[oldKey]
    if (action) {
      delete inputMapping.value[oldKey]
      inputMapping.value[newKey] = action
    }
  }

  function loadFromData(data: Partial<GameSettings>) {
    if (data.musicVolume !== undefined) musicVolume.value = data.musicVolume
    if (data.sfxVolume !== undefined) sfxVolume.value = data.sfxVolume
    if (data.showFps !== undefined) showFps.value = data.showFps
    if (data.frameRateMode !== undefined) frameRateMode.value = data.frameRateMode
    if (data.inputMapping) inputMapping.value = data.inputMapping
  }

  return {
    musicVolume,
    sfxVolume,
    showFps,
    frameRateMode,
    inputMapping,
    setMusicVolume,
    setSfxVolume,
    setShowFps,
    setFrameRateMode,
    remapKey,
    loadFromData,
  }
})
