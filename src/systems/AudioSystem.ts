import { eventBus, GameEvents } from '@core/EventBus';
import { saveSystem } from './SaveSystem';

export type SoundType =
  | 'move'
  | 'push'
  | 'clue'
  | 'cardFix'
  | 'bookPlace'
  | 'bookCorrect'
  | 'bookWrong'
  | 'win'
  | 'fail'
  | 'undo'
  | 'restart'
  | 'click'
  | 'select'
  | 'notification'
  | 'door';

export interface AudioTrack {
  key: string;
  type: 'sfx' | 'music';
  volume: number;
  duration: number;
}

export class AudioSystem {
  private static instance: AudioSystem;
  private scene: Phaser.Scene | null = null;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.3;
  private audioContext: AudioContext | null = null;
  private audioCache: Map<string, AudioBuffer> = new Map();
  private musicTrack: Phaser.Sound.BaseSound | null = null;
  private enabled: boolean = true;

  private constructor() {
    eventBus.on(GameEvents.PLAYER_MOVE, () => this.play('move'));
    eventBus.on(GameEvents.PLAYER_PUSH, () => this.play('push'));
    eventBus.on(GameEvents.CLUE_COLLECTED, () => this.play('clue'));
    eventBus.on(GameEvents.INDEXCARD_FIXED, () => this.play('cardFix'));
    eventBus.on(GameEvents.BOOK_PLACED, (data: any) => {
      if (data?.correct) {
        this.play('bookCorrect');
      } else {
        this.play('bookWrong');
      }
    });
    eventBus.on(GameEvents.GAME_WIN, () => this.play('win'));
    eventBus.on(GameEvents.GAME_FAIL, () => this.play('fail'));
    eventBus.on(GameEvents.UNDO_ACTION, () => this.play('undo'));
    eventBus.on(GameEvents.LEVEL_RESTART, () => this.play('restart'));
  }

  static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.loadSettings();
  }

  private loadSettings(): void {
    const settings = saveSystem.getSettings();
    this.sfxVolume = settings.sfxVolume;
    this.musicVolume = settings.musicVolume;
  }

  private ensureAudioContext(): AudioContext | null {
    if (!this.enabled) return null;
    
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('[AudioSystem] AudioContext not available');
        return null;
      }
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  play(type: SoundType, volume?: number): void {
    if (!this.enabled) return;
    
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const vol = (volume ?? this.sfxVolume) * this.sfxVolume;
    this.playProceduralSound(type, vol, ctx);
  }

  private playProceduralSound(type: SoundType, volume: number, ctx: AudioContext): void {
    const now = ctx.currentTime;

    switch (type) {
      case 'move':
        this.createShortClick(ctx, now, volume * 0.3, 300, 0.03);
        break;

      case 'push':
        this.createSweep(ctx, now, volume * 0.5, 100, 200, 0.12);
        break;

      case 'clue':
        this.createCollectSound(ctx, now, volume * 0.8);
        break;

      case 'cardFix':
        this.createFixSound(ctx, now, volume * 0.7);
        break;

      case 'bookPlace':
        this.createShortClick(ctx, now, volume * 0.6, 440, 0.08);
        break;

      case 'bookCorrect':
        this.createSuccessChime(ctx, now, volume * 0.8);
        break;

      case 'bookWrong':
        this.createBuzz(ctx, now, volume * 0.5);
        break;

      case 'win':
        this.createWinFanfare(ctx, now, volume);
        break;

      case 'fail':
        this.createFailSound(ctx, now, volume);
        break;

      case 'undo':
        this.createSweep(ctx, now, volume * 0.4, 500, 300, 0.08);
        break;

      case 'restart':
        this.createShortClick(ctx, now, volume * 0.5, 200, 0.1);
        break;

      case 'click':
        this.createShortClick(ctx, now, volume * 0.5, 800, 0.02);
        break;

      case 'select':
        this.createShortClick(ctx, now, volume * 0.6, 600, 0.05);
        break;

      case 'notification':
        this.createShortClick(ctx, now, volume * 0.4, 500, 0.05);
        break;

      case 'door':
        this.createDoorSound(ctx, now, volume);
        break;
    }
  }

  private createShortClick(ctx: AudioContext, time: number, volume: number, freq: number, duration: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private createSweep(ctx: AudioContext, time: number, volume: number, startFreq: number, endFreq: number, duration: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume * 0.5, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private createCollectSound(ctx: AudioContext, time: number, volume: number): void {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = time + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  private createFixSound(ctx: AudioContext, time: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(400, time);
    osc.frequency.setValueAtTime(600, time + 0.05);
    osc.frequency.setValueAtTime(800, time + 0.1);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume * 0.3, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  private createSuccessChime(ctx: AudioContext, time: number, volume: number): void {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = time + i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  private createBuzz(ctx: AudioContext, time: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.2);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume * 0.4, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  private createWinFanfare(ctx: AudioContext, time: number, volume: number): void {
    const melody = [
      { f: 523.25, t: 0 },
      { f: 659.25, t: 0.1 },
      { f: 783.99, t: 0.2 },
      { f: 1046.50, t: 0.3 },
      { f: 783.99, t: 0.5 },
      { f: 1046.50, t: 0.6 }
    ];

    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = time + note.t;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  private createFailSound(ctx: AudioContext, time: number, volume: number): void {
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = time + i * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.15);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume * 0.5, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  private createDoorSound(ctx: AudioContext, time: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, time);
    osc.frequency.linearRampToValueAtTime(200, time + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, time);
    filter.frequency.linearRampToValueAtTime(2000, time + 0.3);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume * 0.3, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.42);
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    saveSystem.updateSettings({ sfxVolume: this.sfxVolume });
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicTrack && 'setVolume' in this.musicTrack) {
      (this.musicTrack as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
    saveSystem.updateSettings({ musicVolume: this.musicVolume });
  }

  getSFXVolume(): number {
    return this.sfxVolume;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  toggleEnabled(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  playAmbient(): void {
    if (!this.scene || !this.enabled) return;

    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    if (this.musicTrack) {
      this.stopMusic();
    }

    this.playAmbientPad(ctx);
  }

  private playAmbientPad(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const freqs = [220, 277.18, 329.63];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 800;

      const vol = (this.musicVolume * 0.08) / freqs.length;
      gain.gain.setValueAtTime(0, now + i * 0.3);
      gain.gain.linearRampToValueAtTime(vol, now + i * 0.3 + 2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.3);
    });
  }

  stopMusic(): void {
    if (this.musicTrack) {
      if (this.musicTrack.isPlaying) {
        this.musicTrack.stop();
      }
      this.musicTrack.destroy();
      this.musicTrack = null;
    }
  }
}

export const audioSystem = AudioSystem.getInstance();
