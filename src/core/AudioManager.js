import { globalEventBus, EVENTS } from './EventBus.js';
import { clamp } from './Utils.js';

export class AudioManager {
  constructor() {
    this.enabled = true;
    this.masterVolume = 0.7;
    this.sfxVolume = 0.6;
    this.bgmVolume = 0.3;
    this.muted = false;
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.bgmOsc = null;
    this._initialized = false;
    this._listeners = [];
  }

  init() {
    if (this._initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.masterVolume;
      this.master.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.master);

      this._initialized = true;
    } catch (e) {
      console.warn('[Audio] WebAudio not available:', e);
      this.enabled = false;
    }

    this._listeners.push(globalEventBus.on(EVENTS.SFX_PLAY, (type) => this.playSfx(type)));
    this._listeners.push(globalEventBus.on(EVENTS.BGM_PLAY, () => this.playBgm()));
    this._listeners.push(globalEventBus.on(EVENTS.BGM_STOP, () => this.stopBgm()));
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMaster(v) {
    this.masterVolume = clamp(v, 0, 1);
    if (this.master) this.master.gain.value = this.muted ? 0 : this.masterVolume;
  }
  setSfx(v) {
    this.sfxVolume = clamp(v, 0, 1);
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }
  setBgm(v) {
    this.bgmVolume = clamp(v, 0, 1);
    if (this.bgmGain) this.bgmGain.gain.value = this.bgmVolume;
  }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.masterVolume;
  }
  toggleMute() { this.setMuted(!this.muted); return this.muted; }

  _beep(freq = 440, dur = 0.1, type = 'sine', vol = 0.3) {
    if (!this.enabled || !this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  _chord(freqs, dur = 0.2, type = 'sine', vol = 0.2) {
    freqs.forEach(f => this._beep(f, dur, type, vol));
  }

  playSfx(type) {
    if (!this.enabled || !this._initialized) return;
    switch (type) {
      case 'click': this._beep(600, 0.05, 'square', 0.15); break;
      case 'select': this._beep(880, 0.08, 'sine', 0.2); break;
      case 'dispatch': this._chord([440, 554, 659], 0.12, 'triangle', 0.22); break;
      case 'task_complete': this._chord([523, 659, 784, 1046], 0.2, 'sine', 0.28); break;
      case 'task_fail': this._beep(180, 0.3, 'sawtooth', 0.25); break;
      case 'warning': this._beep(880, 0.1, 'square', 0.18); setTimeout(() => this._beep(660, 0.1, 'square', 0.18), 120); break;
      case 'disaster': this._beep(220, 0.4, 'sawtooth', 0.3); break;
      case 'level_win': this._chord([523, 659, 784, 1046, 1318], 0.4, 'sine', 0.3); break;
      case 'level_lose': this._chord([392, 349, 293, 220], 0.5, 'sawtooth', 0.25); break;
      case 'star': this._beep(1318, 0.1, 'sine', 0.3); break;
      default: this._beep(440, 0.06, 'sine', 0.15);
    }
  }

  playBgm() {
    if (!this.enabled || !this._initialized || this.bgmOsc) return;
    try {
      this.bgmOsc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      this.bgmOsc.type = 'sine';
      this.bgmOsc.frequency.value = 110;
      lfo.type = 'sine';
      lfo.frequency.value = 0.15;
      lfoGain.gain.value = 20;
      lfo.connect(lfoGain);
      lfoGain.connect(this.bgmOsc.frequency);
      this.bgmOsc.connect(this.bgmGain);
      this.bgmOsc.start();
      lfo.start();
    } catch (e) { /* ignore */ }
  }

  stopBgm() {
    if (this.bgmOsc) {
      try { this.bgmOsc.stop(); } catch (e) { /* ignore */ }
      this.bgmOsc = null;
    }
  }

  destroy() {
    this.stopBgm();
    this._listeners.forEach(off => off());
    this._listeners.length = 0;
    if (this.ctx) try { this.ctx.close(); } catch (e) { /* ignore */ }
    this._initialized = false;
  }
}

export const audioManager = new AudioManager();
