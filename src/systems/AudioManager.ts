import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15): void {
    try {
      const ctx = (this.scene.game.config.audio as any)?.context
        ?? new (window.AudioContext || (window as any).webkitAudioContext)();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = volume;

      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      // silent fail for environments without AudioContext
    }
  }

  playCorrect(): void {
    this.generateTone(523, 100, 'sine', 0.12);
    setTimeout(() => this.generateTone(659, 100, 'sine', 0.12), 100);
    setTimeout(() => this.generateTone(784, 200, 'sine', 0.12), 200);
  }

  playWrong(): void {
    this.generateTone(200, 150, 'square', 0.08);
    setTimeout(() => this.generateTone(180, 200, 'square', 0.08), 150);
  }

  playDiscovery(): void {
    this.generateTone(440, 80, 'sine', 0.1);
    setTimeout(() => this.generateTone(554, 80, 'sine', 0.1), 80);
  }

  playPageFlip(): void {
    this.generateTone(800, 40, 'triangle', 0.06);
    setTimeout(() => this.generateTone(600, 60, 'triangle', 0.04), 40);
  }

  playShelfScan(): void {
    this.generateTone(300, 300, 'sine', 0.05);
  }

  playTimerTick(urgent: boolean = false): void {
    if (urgent) {
      this.generateTone(880, 50, 'square', 0.08);
    } else {
      this.generateTone(440, 50, 'sine', 0.04);
    }
  }

  playLevelComplete(): void {
    const notes = [523, 587, 659, 784];
    notes.forEach((n, i) => {
      setTimeout(() => this.generateTone(n, 150, 'sine', 0.12), i * 150);
    });
  }

  playGameOver(): void {
    const notes = [440, 370, 311, 261];
    notes.forEach((n, i) => {
      setTimeout(() => this.generateTone(n, 200, 'sine', 0.1), i * 200);
    });
  }
}
