import { Howl } from 'howler'
import type { SoundConfig } from '@/types'

class SoundManager {
  private sounds: Map<string, Howl> = new Map()
  private muted: boolean = false
  private masterVolume: number = 1.0

  registerSounds(configs: SoundConfig[]): void {
    configs.forEach(config => {
      if (config.src) {
        const howl = new Howl({
          src: [config.src],
          volume: config.volume * this.masterVolume,
          loop: config.loop,
        })
        this.sounds.set(config.id, howl)
      }
    })
  }

  play(soundId: string): void {
    if (this.muted) return
    const sound = this.sounds.get(soundId)
    if (sound) {
      sound.play()
    }
  }

  stop(soundId: string): void {
    const sound = this.sounds.get(soundId)
    if (sound) {
      sound.stop()
    }
  }

  stopAll(): void {
    this.sounds.forEach(sound => sound.stop())
  }

  fadeOut(soundId: string, duration: number = 1000): void {
    const sound = this.sounds.get(soundId)
    if (sound) {
      sound.fade(sound.volume(), 0, duration)
      setTimeout(() => sound.stop(), duration)
    }
  }

  fadeIn(soundId: string, targetVolume: number = 1.0, duration: number = 1000): void {
    if (this.muted) return
    const sound = this.sounds.get(soundId)
    if (sound) {
      sound.volume(0)
      sound.play()
      sound.fade(0, targetVolume * this.masterVolume, duration)
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    this.sounds.forEach(sound => {
      sound.volume(sound.volume() * this.masterVolume)
    })
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    if (this.muted) {
      this.sounds.forEach(sound => sound.mute(true))
    } else {
      this.sounds.forEach(sound => sound.mute(false))
    }
    return this.muted
  }

  isMuted(): boolean {
    return this.muted
  }

  playAmbient(soundId: string): void {
    this.stopAllByType('ambient')
    this.fadeIn(soundId, 0.3, 2000)
  }

  private stopAllByType(type: string): void {
    const typeSounds = {
      ambient: ['ambient_hallway', 'ambient_room_creak', 'ambient_wind', 'ambient_drip', 'ambient_basement', 'ambient_deep'],
      atmosphere: ['atmos_low_hum', 'atmos_footstep'],
    }
    const ids = typeSounds[type as keyof typeof typeSounds] || []
    ids.forEach(id => this.stop(id))
  }
}

const soundManager = new SoundManager()
export default soundManager
