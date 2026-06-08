type SoundType = "place" | "remove" | "processing" | "deliver" | "order_complete" | "qa_reject" | "qa_pass" | "bottleneck" | "click" | "upgrade" | "level_complete" | "coin";

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxVolume: number = 0.7;
  private bgmVolume: number = 0.5;
  private initialized: boolean = false;

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.initialized = true;
    } catch {
      // Audio not available
    }
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v / 100));
  }

  setBgmVolume(v: number) {
    this.bgmVolume = Math.max(0, Math.min(1, v / 100));
  }

  private getGain(): GainNode {
    if (!this.ctx) this.init();
    const gain = this.ctx!.createGain();
    gain.gain.value = this.sfxVolume * 0.3;
    gain.connect(this.ctx!.destination);
    return gain;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "square", volumeMod = 1) {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = this.sfxVolume * 0.2 * volumeMod;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, volumeMod = 1) {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = this.sfxVolume * 0.15 * volumeMod;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  play(sound: SoundType) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    switch (sound) {
      case "place":
        this.playNoise(0.08, 0.6);
        this.playTone(220, 0.1, "square", 0.4);
        setTimeout(() => this.playTone(330, 0.08, "square", 0.3), 40);
        break;
      case "remove":
        this.playNoise(0.1, 0.5);
        this.playTone(165, 0.12, "sawtooth", 0.3);
        break;
      case "processing":
        this.playTone(440, 0.15, "square", 0.2);
        setTimeout(() => this.playTone(550, 0.1, "square", 0.15), 80);
        break;
      case "deliver":
        this.playTone(523, 0.1, "square", 0.4);
        setTimeout(() => this.playTone(659, 0.1, "square", 0.4), 80);
        setTimeout(() => this.playTone(784, 0.15, "square", 0.5), 160);
        break;
      case "order_complete":
        this.playTone(523, 0.12, "square", 0.5);
        setTimeout(() => this.playTone(659, 0.12, "square", 0.5), 100);
        setTimeout(() => this.playTone(784, 0.12, "square", 0.5), 200);
        setTimeout(() => this.playTone(1047, 0.2, "square", 0.6), 300);
        break;
      case "qa_reject":
        this.playTone(200, 0.15, "sawtooth", 0.5);
        setTimeout(() => this.playTone(150, 0.2, "sawtooth", 0.4), 100);
        this.playNoise(0.1, 0.3);
        break;
      case "qa_pass":
        this.playTone(660, 0.08, "square", 0.3);
        setTimeout(() => this.playTone(880, 0.12, "square", 0.4), 60);
        break;
      case "bottleneck":
        this.playTone(330, 0.08, "square", 0.3);
        setTimeout(() => this.playTone(330, 0.08, "square", 0.3), 200);
        break;
      case "click":
        this.playNoise(0.03, 0.3);
        this.playTone(800, 0.03, "square", 0.2);
        break;
      case "upgrade":
        this.playTone(440, 0.1, "square", 0.4);
        setTimeout(() => this.playTone(550, 0.1, "square", 0.4), 60);
        setTimeout(() => this.playTone(660, 0.1, "square", 0.4), 120);
        setTimeout(() => this.playTone(880, 0.15, "square", 0.5), 180);
        break;
      case "level_complete":
        this.playTone(523, 0.15, "square", 0.5);
        setTimeout(() => this.playTone(659, 0.15, "square", 0.5), 150);
        setTimeout(() => this.playTone(784, 0.15, "square", 0.5), 300);
        setTimeout(() => this.playTone(1047, 0.15, "square", 0.6), 450);
        setTimeout(() => this.playTone(784, 0.15, "square", 0.5), 600);
        setTimeout(() => this.playTone(1047, 0.3, "square", 0.7), 750);
        break;
      case "coin":
        this.playTone(1200, 0.05, "square", 0.3);
        setTimeout(() => this.playTone(1500, 0.08, "square", 0.3), 40);
        break;
    }
  }

  destroy() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.initialized = false;
    }
  }
}

export const soundManager = new SoundManager();
