import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

export function useAudio() {
  const settingsStore = useSettingsStore()
  const audioContext = ref<AudioContext | null>(null)

  function getContext(): AudioContext {
    if (!audioContext.value) {
      audioContext.value = new AudioContext()
    }
    return audioContext.value
  }

  function playPlace() {
    const ctx = getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.value = settingsStore.sfxVolume * 0.3
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.stop(ctx.currentTime + 0.15)
  }

  function playError() {
    const ctx = getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 200
    osc.type = 'sawtooth'
    gain.gain.value = settingsStore.sfxVolume * 0.2
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.stop(ctx.currentTime + 0.3)
  }

  function playComplete() {
    const ctx = getContext()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.value = settingsStore.sfxVolume * 0.2
      osc.start(ctx.currentTime + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3)
      osc.stop(ctx.currentTime + i * 0.15 + 0.3)
    })
  }

  function playHint() {
    const ctx = getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 600
    osc.type = 'triangle'
    gain.gain.value = settingsStore.sfxVolume * 0.15
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.stop(ctx.currentTime + 0.2)
  }

  function playClick() {
    const ctx = getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 1000
    osc.type = 'sine'
    gain.gain.value = settingsStore.sfxVolume * 0.1
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.stop(ctx.currentTime + 0.05)
  }

  return {
    playPlace,
    playError,
    playComplete,
    playHint,
    playClick,
  }
}
