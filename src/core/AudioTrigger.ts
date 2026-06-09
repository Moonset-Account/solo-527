type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

class AudioTrigger {
  private static _instance: AudioTrigger | null = null;

  private _audioContext: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private _enabled: boolean = true;
  private _contextResumed: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this._audioContext = new AudioContext();
      this._masterGain = this._audioContext.createGain();
      this._masterGain.gain.value = 0.7;
      this._masterGain.connect(this._audioContext.destination);
    }
  }

  static getInstance(): AudioTrigger {
    if (!AudioTrigger._instance) {
      AudioTrigger._instance = new AudioTrigger();
    }
    return AudioTrigger._instance;
  }

  get masterGain(): GainNode | null {
    return this._masterGain;
  }

  async ensureContext(): Promise<void> {
    if (!this._audioContext || !this._masterGain) return;
    if (!this._contextResumed && this._audioContext.state === 'suspended') {
      await this._audioContext.resume();
      this._contextResumed = true;
    }
  }

  setVolume(v: number): void {
    if (!this._masterGain) return;
    const clamped = Math.max(0, Math.min(1, v));
    this._masterGain.gain.setValueAtTime(clamped, this._audioContext?.currentTime || 0);
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    if (this._masterGain && this._audioContext) {
      this._masterGain.gain.setValueAtTime(
        enabled ? this._masterGain.gain.value : 0,
        this._audioContext.currentTime
      );
    }
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const ctx = this._audioContext!;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private scheduleEvent(node: AudioNode | AudioNode[], source?: AudioBufferSourceNode | OscillatorNode): void {
    const nodes = Array.isArray(node) ? node : [node];
    const cleanup = (): void => {
      for (const n of nodes) {
        try {
          n.disconnect();
        } catch (_) {
          // ignore disconnect errors
        }
      }
    };
    if (source) {
      source.onended = cleanup;
    } else {
      cleanup();
    }
  }

  private async playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainValue: number = 0.1,
    sweepToFreq?: number
  ): Promise<void> {
    await this.ensureContext();
    if (!this._audioContext || !this._masterGain || !this._enabled) return;

    const ctx = this._audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, now);

    if (sweepToFreq !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(sweepToFreq, 0.0001),
        now + duration
      );
    }

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gainValue, now + 0.01);
    gainNode.gain.setValueAtTime(gainValue, now + duration - 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this._masterGain);

    this.scheduleEvent([oscillator, gainNode], oscillator);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);

    return new Promise((resolve) => {
      setTimeout(resolve, (duration + 0.05) * 1000);
    });
  }

  async playClick(): Promise<void> {
    await this.ensureContext();
    if (!this._audioContext || !this._masterGain || !this._enabled) return;

    const ctx = this._audioContext;
    const now = ctx.currentTime;

    const attack = 0.001;
    const decay = 0.05;
    const sustain = 0;
    const release = 0.02;
    const peakGain = 0.15;
    const totalDuration = attack + decay + sustain + release;

    const oscillator = ctx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peakGain, now + attack);
    gainNode.gain.linearRampToValueAtTime(peakGain * (sustain > 0 ? 0.6 : 0), now + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0, now + attack + decay + sustain + release);

    oscillator.connect(gainNode);
    gainNode.connect(this._masterGain);

    this.scheduleEvent([oscillator, gainNode], oscillator);

    oscillator.start(now);
    oscillator.stop(now + totalDuration + 0.02);

    return new Promise((resolve) => {
      setTimeout(resolve, (totalDuration + 0.05) * 1000);
    });
  }

  async playWireConnect(): Promise<void> {
    await this.ensureContext();
    if (!this._audioContext || !this._masterGain || !this._enabled) return;

    const ctx = this._audioContext;
    const now = ctx.currentTime;
    const duration = 0.15;

    const noiseBuffer = this.createNoiseBuffer(duration);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1500;
    bandpass.Q.value = 2;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gainNode.gain.setValueAtTime(0.08, now + duration - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    source.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(this._masterGain);

    this.scheduleEvent([source, bandpass, gainNode], source);

    source.start(now);
    source.stop(now + duration + 0.02);

    return new Promise((resolve) => {
      setTimeout(resolve, (duration + 0.05) * 1000);
    });
  }

  async playSwitchToggle(): Promise<void> {
    return this.playTone(200, 0.05, 'sawtooth', 0.2, 800);
  }

  async playBulbOn(): Promise<void> {
    await this.ensureContext();
    if (!this._audioContext || !this._masterGain || !this._enabled) return;

    const ctx = this._audioContext;
    const now = ctx.currentTime;

    const warmupDuration = 0.1;
    const dingDuration = 0.25;

    const warmupOsc = ctx.createOscillator();
    warmupOsc.type = 'sine';
    warmupOsc.frequency.setValueAtTime(200, now);

    const warmupGain = ctx.createGain();
    warmupGain.gain.setValueAtTime(0, now);
    warmupGain.gain.linearRampToValueAtTime(0.1, now + warmupDuration);
    warmupGain.gain.linearRampToValueAtTime(0, now + warmupDuration + 0.05);

    warmupOsc.connect(warmupGain);
    warmupGain.connect(this._masterGain);

    const dingOsc = ctx.createOscillator();
    dingOsc.type = 'sine';
    dingOsc.frequency.setValueAtTime(1200, now + warmupDuration * 0.5);

    const dingGain = ctx.createGain();
    dingGain.gain.setValueAtTime(0, now + warmupDuration * 0.5);
    dingGain.gain.linearRampToValueAtTime(0.15, now + warmupDuration * 0.5 + 0.01);
    dingGain.gain.setValueAtTime(0.15, now + warmupDuration * 0.5 + dingDuration - 0.05);
    dingGain.gain.exponentialRampToValueAtTime(0.001, now + warmupDuration * 0.5 + dingDuration);

    dingOsc.connect(dingGain);
    dingGain.connect(this._masterGain);

    this.scheduleEvent([warmupOsc, warmupGain], warmupOsc);
    this.scheduleEvent([dingOsc, dingGain], dingOsc);

    warmupOsc.start(now);
    warmupOsc.stop(now + warmupDuration + 0.1);

    dingOsc.start(now + warmupDuration * 0.5);
    dingOsc.stop(now + warmupDuration * 0.5 + dingDuration + 0.05);

    return new Promise((resolve) => {
      setTimeout(resolve, (warmupDuration * 0.5 + dingDuration + 0.1) * 1000);
    });
  }

  async playBulbOff(): Promise<void> {
    await this.ensureContext();
    if (!this._audioContext || !this._masterGain || !this._enabled) return;

    const ctx = this._audioContext;
    const now = ctx.currentTime;
    const duration = 0.2;

    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this._masterGain);

    this.scheduleEvent([oscillator, gainNode], oscillator);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);

    return new Promise((resolve) => {
      setTimeout(resolve, (duration + 0.05) * 1000);
    });
  }

  async playError(): Promise<void> {
    await this.ensureContext();
    if (!this._audioContext || !this._masterGain || !this._enabled) return;

    const ctx = this._audioContext;
    const now = ctx.currentTime;

    const segments = [
      { start: 0, dur: 0.1 },
      { start: 0.2, dur: 0.1 },
      { start: 0.4, dur: 0.3 },
    ];

    for (const seg of segments) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now + seg.start);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + seg.start);
      gain.gain.linearRampToValueAtTime(0.18, now + seg.start + 0.005);
      gain.gain.setValueAtTime(0.18, now + seg.start + seg.dur - 0.01);
      gain.gain.linearRampToValueAtTime(0, now + seg.start + seg.dur);

      osc.connect(gain);
      gain.connect(this._masterGain);

      this.scheduleEvent([osc, gain], osc);

      osc.start(now + seg.start);
      osc.stop(now + seg.start + seg.dur + 0.02);
    }

    return new Promise((resolve) => {
      setTimeout(resolve, (0.4 + 0.3 + 0.1) * 1000);
    });
  }

  async playSuccess(): Promise<void> {
    await this.ensureContext();
    if (!this._audioContext || !this._masterGain || !this._enabled) return;

    const notes = [523.25, 659.25, 783.99];
    const noteDuration = 0.2;
    const noteGap = 0.08;

    for (let i = 0; i < notes.length; i++) {
      void this.playTone(notes[i], noteDuration, 'sine', 0.15);
      await new Promise((resolve) => {
        setTimeout(resolve, (noteDuration + noteGap) * 1000);
      });
    }

    return new Promise((resolve) => {
      setTimeout(resolve, (notes.length * (noteDuration + noteGap)) * 1000);
    });
  }

  async playDelete(): Promise<void> {
    return this.playTone(600, 0.15, 'sawtooth', 0.12, 200);
  }

  async playStarEarned(stars: 1 | 2 | 3): Promise<void> {
    await this.ensureContext();
    if (!this._audioContext || !this._masterGain || !this._enabled) return;

    const arpeggios: Record<1 | 2 | 3, number[]> = {
      1: [523.25],
      2: [523.25, 659.25],
      3: [523.25, 659.25, 783.99, 1046.5],
    };

    const notes = arpeggios[stars];
    const noteDuration = 0.18;
    const noteGap = 0.05;

    for (let i = 0; i < notes.length; i++) {
      void this.playTone(notes[i], noteDuration, 'sine', 0.15);
      await new Promise((resolve) => {
        setTimeout(resolve, (noteDuration + noteGap) * 1000);
      });
    }

    return new Promise((resolve) => {
      setTimeout(resolve, (notes.length * (noteDuration + noteGap)) * 1000);
    });
  }
}

export default AudioTrigger;
