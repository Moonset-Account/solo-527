import type { AudioSettings } from '../../types/config';

type SfxName =
  | 'click' | 'success' | 'error' | 'pour' | 'stir'
  | 'heat' | 'bubbles' | 'reaction' | 'ding' | 'whoosh'
  | 'safety' | 'pickup' | 'drop' | 'star';

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings;
  private bgmOscillator: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmPlaying = false;

  constructor(settings: AudioSettings) {
    this.settings = settings;
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) throw new Error('No AudioContext available');
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.masterVolume;
      this.masterGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.settings.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  updateSettings(s: AudioSettings): void {
    this.settings = s;
    if (this.masterGain) this.masterGain.gain.value = s.muted ? 0 : s.masterVolume;
    if (this.sfxGain) this.sfxGain.gain.value = s.sfxVolume;
    if (this.bgmGain) this.bgmGain.gain.value = s.bgmVolume * 0.5;
  }

  playSfx(name: SfxName, volume = 1): void {
    if (this.settings.muted) return;
    const ctx = this.ensureCtx();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;
    switch (name) {
      case 'click': this.playTone(880, 0.04, 'square', 0.15 * volume); break;
      case 'success': this.playChord([523, 659, 784], 0.3, 'sine', 0.2 * volume); break;
      case 'error': this.playTone(180, 0.2, 'sawtooth', 0.25 * volume); break;
      case 'pour': this.playNoise(0.5, 0.015 * volume, 600, 2000); break;
      case 'stir': this.playNoise(0.3, 0.01 * volume, 100, 400); break;
      case 'heat': this.playNoise(1.5, 0.008 * volume, 50, 200); break;
      case 'bubbles': this.playBubbles(0.8, 0.04 * volume); break;
      case 'reaction': this.playChord([440, 660, 880, 1100], 0.6, 'triangle', 0.15 * volume); break;
      case 'ding': this.playTone(1760, 0.3, 'sine', 0.2 * volume); break;
      case 'whoosh': this.playNoise(0.25, 0.02 * volume, 200, 800); break;
      case 'safety':
        this.playTone(800, 0.15, 'square', 0.2 * volume);
        setTimeout(() => this.playTone(800, 0.15, 'square', 0.2 * volume), 200);
        break;
      case 'pickup': this.playTone(600, 0.06, 'triangle', 0.15 * volume); break;
      case 'drop': this.playTone(200, 0.08, 'sine', 0.15 * volume); break;
      case 'star': this.playTone(1318, 0.08, 'sine', 0.2 * volume); break;
    }
  }

  startBgm(): void {
    if (this.bgmPlaying || this.settings.muted) return;
    const ctx = this.ensureCtx();
    if (!this.masterGain) return;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = this.settings.bgmVolume * 0.3;
    this.bgmGain.connect(this.masterGain);
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    let i = 0;
    const playNext = () => {
      if (!this.bgmPlaying || !this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[i % notes.length] / 2;
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      osc.connect(g).connect(this.bgmGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.3);
      i++;
      setTimeout(playNext, 700);
    };
    this.bgmPlaying = true;
    playNext();
  }

  stopBgm(): void {
    this.bgmPlaying = false;
    if (this.bgmOscillator) { try { this.bgmOscillator.stop(); } catch { /* noop */ } this.bgmOscillator = null; }
  }

  private playTone(freq: number, dur: number, type: OscillatorType, vol: number): void {
    const ctx = this.ensureCtx();
    if (!this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  private playChord(freqs: number[], dur: number, type: OscillatorType, vol: number): void {
    freqs.forEach((f, i) => setTimeout(() => this.playTone(f, dur, type, vol), i * 40));
  }

  private playNoise(dur: number, vol: number, filterLow: number, filterHigh: number): void {
    const ctx = this.ensureCtx();
    if (!this.sfxGain) return;
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (filterLow + filterHigh) / 2;
    filter.Q.value = 1;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter).connect(gain).connect(this.sfxGain);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  private playBubbles(dur: number, vol: number): void {
    const end = performance.now() + dur * 1000;
    const tick = () => {
      if (performance.now() > end) return;
      this.playTone(600 + Math.random() * 1200, 0.06, 'sine', vol * (0.5 + Math.random() * 0.5));
      setTimeout(tick, 60 + Math.random() * 120);
    };
    tick();
  }
}
