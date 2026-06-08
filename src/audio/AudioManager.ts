type SoundId = 'traffic-light-switch' | 'car-horn' | 'bus-approaching' | 'congestion-warning' | 'level-complete' | 'level-fail' | 'button-click' | 'slider-change';

interface SoundConfig {
  id: SoundId;
  volume: number;
  loop: boolean;
  frequency?: number;
  type?: OscillatorType;
  duration?: number;
}

const SOUND_CONFIGS: Record<SoundId, SoundConfig> = {
  'traffic-light-switch': { id: 'traffic-light-switch', volume: 0.3, loop: false, frequency: 800, type: 'sine', duration: 0.1 },
  'car-horn': { id: 'car-horn', volume: 0.2, loop: false, frequency: 400, type: 'sawtooth', duration: 0.15 },
  'bus-approaching': { id: 'bus-approaching', volume: 0.4, loop: false, frequency: 300, type: 'square', duration: 0.2 },
  'congestion-warning': { id: 'congestion-warning', volume: 0.5, loop: true, frequency: 600, type: 'sawtooth', duration: 0.3 },
  'level-complete': { id: 'level-complete', volume: 0.6, loop: false, frequency: 523, type: 'sine', duration: 0.5 },
  'level-fail': { id: 'level-fail', volume: 0.4, loop: false, frequency: 200, type: 'sawtooth', duration: 0.4 },
  'button-click': { id: 'button-click', volume: 0.2, loop: false, frequency: 1000, type: 'sine', duration: 0.05 },
  'slider-change': { id: 'slider-change', volume: 0.1, loop: false, frequency: 1200, type: 'sine', duration: 0.03 },
};

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSounds: Map<string, OscillatorNode> = new Map();
  private muted = false;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  play(soundId: SoundId): void {
    if (this.muted) return;

    const config = SOUND_CONFIGS[soundId];
    if (!config) return;

    const ctx = this.ensureContext();
    const gain = ctx.createGain();
    gain.gain.value = config.volume;
    gain.connect(this.masterGain!);

    const osc = ctx.createOscillator();
    osc.type = config.type ?? 'sine';
    osc.frequency.value = config.frequency ?? 440;
    osc.connect(gain);

    if (soundId === 'level-complete') {
      this.playLevelComplete(ctx, gain);
      return;
    }

    if (soundId === 'level-fail') {
      this.playLevelFail(ctx, gain);
      return;
    }

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + (config.duration ?? 0.1));

    if (config.loop) {
      this.activeSounds.set(soundId, osc);
    }
  }

  private playLevelComplete(ctx: AudioContext, gain: GainNode): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const noteGain = ctx.createGain();
      noteGain.gain.value = 0.15;
      noteGain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(noteGain);
      noteGain.connect(gain);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  }

  private playLevelFail(ctx: AudioContext, gain: GainNode): void {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const noteGain = ctx.createGain();
      noteGain.gain.value = 0.1;
      noteGain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
      osc.connect(noteGain);
      noteGain.connect(gain);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  }

  stop(soundId: SoundId): void {
    const osc = this.activeSounds.get(soundId);
    if (osc) {
      try { osc.stop(); } catch { /* already stopped */ }
      this.activeSounds.delete(soundId);
    }
  }

  stopAll(): void {
    for (const id of Array.from(this.activeSounds.keys())) {
      this.stop(id as SoundId);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 1;
    }
  }

  isMuted(): boolean {
    return this.muted;
  }
}

export type { SoundId };
