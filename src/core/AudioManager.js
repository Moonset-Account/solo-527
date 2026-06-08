export class AudioManager {
  constructor() {
    this.audioContext = null
    this.masterVolume = 0.7
    this.sfxVolume = 0.8
    this.bgmVolume = 0.3
    this.sfxMuted = false
    this.bgmMuted = false
    this.currentBgm = null
    this.bgmGainNode = null
    this.sfxGainNode = null
    this._initialized = false
  }

  _initAudioContext() {
    if (this._initialized) return
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AC()

      this.bgmGainNode = this.audioContext.createGain()
      this.bgmGainNode.gain.value = this.bgmVolume
      this.bgmGainNode.connect(this.audioContext.destination)

      this.sfxGainNode = this.audioContext.createGain()
      this.sfxGainNode.gain.value = this.sfxVolume
      this.sfxGainNode.connect(this.audioContext.destination)

      this._initialized = true
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  }

  _ensureContext() {
    if (!this._initialized) {
      this._initAudioContext()
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  playSfx(type) {
    this._ensureContext()
    if (!this._initialized || this.sfxMuted) return

    const ctx = this.audioContext
    const now = ctx.currentTime

    switch (type) {
      case 'button_click':
        this._playTone(800, 0.08, 'square', now, 0.2)
        this._playTone(1200, 0.06, 'square', now + 0.03, 0.15)
        break

      case 'tile_pick':
        this._playTone(523, 0.1, 'sine', now, 0.3)
        this._playTone(784, 0.08, 'sine', now + 0.02, 0.2)
        break

      case 'tile_place':
        this._playTone(659, 0.12, 'triangle', now, 0.35)
        this._playTone(880, 0.1, 'triangle', now + 0.05, 0.25)
        break

      case 'correct':
        this._playTone(523, 0.15, 'sine', now, 0.3)
        this._playTone(659, 0.15, 'sine', now + 0.1, 0.3)
        this._playTone(784, 0.25, 'sine', now + 0.2, 0.35)
        break

      case 'wrong':
        this._playTone(311, 0.2, 'sawtooth', now, 0.25)
        this._playTone(261, 0.25, 'sawtooth', now + 0.1, 0.2)
        break

      case 'scene_change':
        this._playTone(440, 0.1, 'sine', now, 0.2)
        this._playTone(554, 0.1, 'sine', now + 0.05, 0.2)
        this._playTone(659, 0.15, 'sine', now + 0.1, 0.2)
        break

      case 'level_complete':
        const notes = [523, 587, 659, 784, 880, 1047]
        notes.forEach((freq, i) => {
          this._playTone(freq, 0.2, 'triangle', now + i * 0.08, 0.3)
        })
        break

      case 'coin':
        this._playTone(988, 0.08, 'square', now, 0.25)
        this._playTone(1318, 0.12, 'square', now + 0.05, 0.25)
        break

      case 'hint':
        this._playTone(698, 0.1, 'sine', now, 0.2)
        this._playTone(880, 0.1, 'sine', now + 0.08, 0.2)
        this._playTone(698, 0.15, 'sine', now + 0.16, 0.2)
        break

      case 'card_flip':
        this._playNoise(0.08, now, 0.15)
        this._playTone(1000, 0.05, 'triangle', now + 0.03, 0.15)
        break

      default:
        this._playTone(440, 0.1, 'sine', now, 0.2)
    }
  }

  _playTone(frequency, duration, type, startTime, volume) {
    const ctx = this.audioContext
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.value = frequency

    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.connect(gain)
    gain.connect(this.sfxGainNode)

    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  _playNoise(duration, startTime, volume) {
    const ctx = this.audioContext
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    source.connect(gain)
    gain.connect(this.sfxGainNode)
    source.start(startTime)
  }

  startBgm(type = 'peaceful') {
    this._ensureContext()
    if (!this._initialized || this.bgmMuted) return
    if (this.currentBgm) this.stopBgm()

    const ctx = this.audioContext
    this.currentBgm = { type, oscillators: [], intervals: [] }

    const baseNotes = {
      peaceful: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00],
      exciting: [329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
      victory: [392.00, 493.88, 587.33, 659.25, 783.99, 880.00]
    }

    const notes = baseNotes[type] || baseNotes.peaceful
    let noteIndex = 0

    const playNextNote = () => {
      if (!this.currentBgm || this.bgmMuted) return
      const freq = notes[noteIndex % notes.length]
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.value = freq / 2
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.15, now + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      osc.connect(gain)
      gain.connect(this.bgmGainNode)
      osc.start(now)
      osc.stop(now + 1.3)

      noteIndex++
    }

    playNextNote()
    const interval = setInterval(playNextNote, 1000)
    this.currentBgm.intervals.push(interval)

    const playArpeggio = () => {
      if (!this.currentBgm || this.bgmMuted) return
      const now = ctx.currentTime
      const chordNotes = [notes[0], notes[2], notes[4]]
      chordNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, now + i * 0.15)
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.15 + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.5)
        osc.connect(gain)
        gain.connect(this.bgmGainNode)
        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.6)
      })
    }

    const arpInterval = setInterval(playArpeggio, 4000)
    this.currentBgm.intervals.push(arpInterval)
  }

  stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.intervals.forEach(clearInterval)
      this.currentBgm = null
    }
  }

  setSfxVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(1, value))
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.sfxVolume
    }
  }

  setBgmVolume(value) {
    this.bgmVolume = Math.max(0, Math.min(1, value))
    if (this.bgmGainNode) {
      this.bgmGainNode.gain.value = this.bgmVolume
    }
  }

  toggleSfxMute() {
    this.sfxMuted = !this.sfxMuted
    return this.sfxMuted
  }

  toggleBgmMute() {
    this.bgmMuted = !this.bgmMuted
    if (this.bgmMuted) {
      this.stopBgm()
    }
    return this.bgmMuted
  }

  getSettings() {
    return {
      sfxVolume: this.sfxVolume,
      bgmVolume: this.bgmVolume,
      sfxMuted: this.sfxMuted,
      bgmMuted: this.bgmMuted
    }
  }

  applySettings(settings) {
    if (settings.sfxVolume !== undefined) this.setSfxVolume(settings.sfxVolume)
    if (settings.bgmVolume !== undefined) this.setBgmVolume(settings.bgmVolume)
    if (settings.sfxMuted !== undefined) this.sfxMuted = settings.sfxMuted
    if (settings.bgmMuted !== undefined) this.bgmMuted = settings.bgmMuted
  }
}
