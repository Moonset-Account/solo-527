import { EVENT_TYPES } from './EventBus.js';
import { GAME_CONFIG } from '../config/GameConfig.js';

export const SFX_TYPES = {
  CLICK: 'sfx_click',
  HOVER: 'sfx_hover',
  SUCCESS: 'sfx_success',
  FAIL: 'sfx_fail',
  TRAIN_HORN: 'sfx_train_horn',
  TRAIN_MOVE: 'sfx_train_move',
  TRAIN_ARRIVE: 'sfx_train_arrive',
  TRAIN_DEPART: 'sfx_train_depart',
  SIGNAL_CHANGE: 'sfx_signal',
  SWITCH: 'sfx_switch',
  CONFLICT: 'sfx_conflict',
  NOTIFY: 'sfx_notify',
  BUTTON: 'sfx_button',
  STAR: 'sfx_star',
  WHOOSH: 'sfx_whoosh',
  TICK: 'sfx_tick',
  ERROR: 'sfx_error'
};

export class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = new Map();
    this.music = null;
    this.isEnabled = true;
    this.sfxVolume = GAME_CONFIG.audio.sfxVolume;
    this.musicVolume = GAME_CONFIG.audio.musicVolume;
    this.masterVolume = GAME_CONFIG.audio.masterVolume;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.EventBus.on(EVENT_TYPES.AUDIO_PLAY, this.playSFX.bind(this));
    window.EventBus.on(EVENT_TYPES.AUDIO_MUSIC, this.playMusic.bind(this));
    window.EventBus.on(EVENT_TYPES.AUDIO_STOP, this.stopAll.bind(this));
  }

  initPlaceholderSounds() {
    const markerConfig = [
      { key: SFX_TYPES.CLICK, freq: 800, duration: 0.06 },
      { key: SFX_TYPES.HOVER, freq: 600, duration: 0.04 },
      { key: SFX_TYPES.SUCCESS, freq: 523, duration: 0.3, chord: [523, 659, 784] },
      { key: SFX_TYPES.FAIL, freq: 200, duration: 0.4, down: true },
      { key: SFX_TYPES.TRAIN_HORN, freq: 440, duration: 0.5 },
      { key: SFX_TYPES.TRAIN_MOVE, freq: 120, duration: 0.1 },
      { key: SFX_TYPES.TRAIN_ARRIVE, freq: 660, duration: 0.2 },
      { key: SFX_TYPES.TRAIN_DEPART, freq: 330, duration: 0.15 },
      { key: SFX_TYPES.SIGNAL_CHANGE, freq: 1000, duration: 0.08 },
      { key: SFX_TYPES.SWITCH, freq: 700, duration: 0.12 },
      { key: SFX_TYPES.CONFLICT, freq: 150, duration: 0.5, down: true },
      { key: SFX_TYPES.NOTIFY, freq: 880, duration: 0.15 },
      { key: SFX_TYPES.STAR, freq: 988, duration: 0.2, chord: [784, 988, 1175] },
      { key: SFX_TYPES.WHOOSH, freq: 400, duration: 0.2, sweep: true },
      { key: SFX_TYPES.TICK, freq: 1200, duration: 0.03 },
      { key: SFX_TYPES.ERROR, freq: 220, duration: 0.15, down: true }
    ];

    markerConfig.forEach(cfg => {
      try {
        const sound = this.scene.sound.add(cfg.key);
        this.sounds.set(cfg.key, sound);
      } catch (e) {
      }
    });
  }

  playSFX(type, volumeMultiplier = 1) {
    if (!this.isEnabled || !this.scene) return;

    const sound = this.sounds.get(type);
    if (!sound) {
      this.playBeep(type);
      return;
    }

    try {
      const vol = this.sfxVolume * this.masterVolume * volumeMultiplier;
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play({ volume: vol });
    } catch (e) {
      this.playBeep(type);
    }
  }

  playBeep(type) {
    if (!this.isEnabled || !this.scene) return;

    let freqMap = {
      [SFX_TYPES.CLICK]: 800,
      [SFX_TYPES.HOVER]: 600,
      [SFX_TYPES.SUCCESS]: 523,
      [SFX_TYPES.FAIL]: 220,
      [SFX_TYPES.CONFLICT]: 180,
      [SFX_TYPES.SWITCH]: 700,
      [SFX_TYPES.SIGNAL_CHANGE]: 1000,
      [SFX_TYPES.NOTIFY]: 880,
      [SFX_TYPES.STAR]: 988,
      [SFX_TYPES.ERROR]: 260,
      [SFX_TYPES.TICK]: 1200,
      [SFX_TYPES.TRAIN_HORN]: 440,
      [SFX_TYPES.TRAIN_ARRIVE]: 660,
      [SFX_TYPES.TRAIN_DEPART]: 330
    };

    const freq = freqMap[type] || 440;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const now = ctx.currentTime;
      const volume = this.sfxVolume * this.masterVolume * 0.05;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
    }
  }

  playMusic(key, loop = true) {
    if (!this.isEnabled) return;
    this.stopMusic();
    try {
      this.music = this.scene.sound.add(key, {
        loop,
        volume: this.musicVolume * this.masterVolume
      });
      this.music.play();
    } catch (e) {
    }
  }

  stopMusic() {
    if (this.music) {
      try {
        this.music.stop();
      } catch (e) {
      }
      this.music = null;
    }
  }

  stopAll() {
    this.stopMusic();
    this.sounds.forEach(sound => {
      try {
        sound.stop();
      } catch (e) {
      }
    });
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  setSFXVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.music) {
      try {
        this.music.setVolume(this.musicVolume * this.masterVolume);
      } catch (e) {
      }
    }
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  destroy() {
    this.stopAll();
    this.sounds.clear();
  }
}
