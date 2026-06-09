import Phaser from 'phaser';
import { SaveSystem, SettingsData } from './SaveSystem';

type SfxType = 'move' | 'push' | 'blocked' | 'clue' | 'card' | 'book' | 'win' | 'fail' | 'click' | 'undo';

export class AudioSystem {
  private settings: SettingsData;
  private synths: Map<string, OscillatorNode> = new Map();
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicInterval: number | null = null;
  private musicStep = 0;
  private musicSeq: number[] = [];

  constructor(_scene: Phaser.Scene) {
    this.settings = SaveSystem.loadSettings();
    this.initWebAudio();
  }

  private initWebAudio(): void {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AC();
      this.masterGain = this.audioCtx.createGain();
      this.sfxGain = this.audioCtx.createGain();
      this.musicGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.settings.masterVolume;
      this.sfxGain.gain.value = this.settings.enableSfx ? this.settings.sfxVolume : 0;
      this.musicGain.gain.value = this.settings.enableMusic ? this.settings.musicVolume : 0;
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn('[AudioSystem] WebAudio not available');
    }
  }

  private ensureResume(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  updateSettings(settings: SettingsData): void {
    this.settings = settings;
    if (this.masterGain) this.masterGain.gain.value = settings.masterVolume;
    if (this.sfxGain) this.sfxGain.gain.value = settings.enableSfx ? settings.sfxVolume : 0;
    if (this.musicGain) this.musicGain.gain.value = settings.enableMusic ? settings.musicVolume : 0;
  }

  playSfx(type: SfxType, intensity: number = 1): void {
    this.ensureResume();
    if (!this.audioCtx || !this.sfxGain) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);

    const vol = 0.18 * intensity;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);

    switch (type) {
      case 'move':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      case 'push':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.26);
        break;
      case 'blocked':
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(150, now + 0.06);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      case 'clue':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(780, now + 0.05);
        osc.frequency.setValueAtTime(1040, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'card':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.24);
        break;
      case 'book':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.linearRampToValueAtTime(820, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      case 'win': {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => {
          const o = this.audioCtx!.createOscillator();
          const g = this.audioCtx!.createGain();
          o.connect(g); g.connect(this.sfxGain!);
          o.type = 'triangle';
          o.frequency.value = f;
          const t = now + i * 0.12;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.2, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          o.start(t);
          o.stop(t + 0.32);
        });
        return;
      }
      case 'fail': {
        const notes = [300, 240, 180];
        notes.forEach((f, i) => {
          const o = this.audioCtx!.createOscillator();
          const g = this.audioCtx!.createGain();
          o.connect(g); g.connect(this.sfxGain!);
          o.type = 'sawtooth';
          o.frequency.value = f;
          const t = now + i * 0.1;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.15, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          o.start(t);
          o.stop(t + 0.24);
        });
        return;
      }
      case 'click':
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      case 'undo':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
    }
  }

  startAmbientMusic(): void {
    this.ensureResume();
    if (!this.audioCtx || !this.musicGain) return;
    this.stopAmbientMusic();

    this.musicSeq = [196, 220, 247, 261, 247, 220, 196, 175];
    this.musicStep = 0;
    this.musicInterval = window.setInterval(() => {
      if (!this.audioCtx || !this.musicGain) return;
      const now = this.audioCtx.currentTime;
      const note = this.musicSeq[this.musicStep % this.musicSeq.length];
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain); gain.connect(this.musicGain);
      osc.type = 'sine';
      osc.frequency.value = note;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.start(now);
      osc.stop(now + 1.0);
      this.musicStep++;
    }, 800);
  }

  stopAmbientMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  destroy(): void {
    this.stopAmbientMusic();
    this.synths.forEach((o) => { try { o.stop(); } catch {} });
    this.synths.clear();
  }
}
