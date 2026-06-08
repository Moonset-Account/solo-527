import { eventBus } from './EventBus.js';
import { saveSystem } from './SaveSystem.js';

export class AudioManager {
  constructor() {
    this.enabled = true;
    this.musicEnabled = true;
    this.volume = 0.7;
    this.sounds = new Map();
    this.musicTracks = new Map();
    this.currentMusic = null;
    this.audioContext = null;
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('[AudioManager] Web Audio不可用，使用降级方案');
    }
    const settings = saveSystem.getSettings();
    this.enabled = settings.soundEnabled;
    this.musicEnabled = settings.musicEnabled;
    this.volume = settings.masterVolume;
    this.registerDefaultSounds();

    eventBus.on('audio:play', (name) => this.play(name));
    eventBus.on('audio:music', (name) => this.playMusic(name));
    eventBus.on('audio:toggle', (enabled) => this.setEnabled(enabled));
    eventBus.on('audio:volume', (vol) => this.setVolume(vol));
    eventBus.on('audio:settingsChanged', (settings) => this.applySettings(settings));
  }

  registerDefaultSounds() {
    this.registerSound('click', { freq: 800, duration: 0.08, type: 'sine' });
    this.registerSound('success', { freq: 600, duration: 0.15, type: 'sine', sweep: 800 });
    this.registerSound('warning', { freq: 440, duration: 0.12, type: 'square' });
    this.registerSound('error', { freq: 200, duration: 0.25, type: 'sawtooth', sweep: 100 });
    this.registerSound('trafficLight', { freq: 1200, duration: 0.06, type: 'sine' });
    this.registerSound('bus', { freq: 300, duration: 0.18, type: 'triangle', sweep: 400 });
    this.registerSound('award', { freq: 523, duration: 0.12, type: 'sine' });
    this.registerSound('award2', { freq: 659, duration: 0.12, type: 'sine' });
    this.registerSound('award3', { freq: 784, duration: 0.2, type: 'sine' });
  }

  registerSound(name, config) {
    this.sounds.set(name, config);
  }

  play(name, volumeOverride = null) {
    if (!this.enabled || !this.audioContext) return;
    const config = this.sounds.get(name);
    if (!config) return;
    try {
      const ctx = this.audioContext;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = config.type || 'sine';
      osc.frequency.setValueAtTime(config.freq, now);
      if (config.sweep) {
        osc.frequency.exponentialRampToValueAtTime(config.sweep, now + config.duration);
      }
      const vol = (volumeOverride ?? this.volume) * 0.3;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + config.duration);
    } catch (e) {
      console.warn('[AudioManager] 播放音效失败:', e);
    }
  }

  playMusic(name) {
    if (!this.musicEnabled) return;
    this.stopMusic();
    const music = this.musicTracks.get(name);
    if (music) {
      music.loop = true;
      music.volume = this.volume * 0.2;
      music.play().catch(() => {});
      this.currentMusic = music;
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic = null;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.stopMusic();
    saveSystem.saveSettings({ soundEnabled: enabled });
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (!enabled) this.stopMusic();
    saveSystem.saveSettings({ musicEnabled: enabled });
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    saveSystem.saveSettings({ masterVolume: this.volume });
  }

  applySettings(settings) {
    if (settings.soundEnabled !== undefined) this.enabled = settings.soundEnabled;
    if (settings.musicEnabled !== undefined) {
      this.musicEnabled = settings.musicEnabled;
      if (!this.musicEnabled) this.stopMusic();
    }
    if (settings.masterVolume !== undefined) this.volume = settings.masterVolume;
  }

  playVictoryJingle() {
    setTimeout(() => this.play('award'), 0);
    setTimeout(() => this.play('award2'), 150);
    setTimeout(() => this.play('award3'), 300);
  }

  playFailureSound() {
    this.play('error');
  }

  playClick() {
    this.play('click');
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audioManager = new AudioManager();
