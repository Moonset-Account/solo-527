import Phaser from 'phaser';
import { configManager } from '@systems/ConfigManager';
import { saveSystem } from '@systems/SaveSystem';
import { audioSystem } from '@systems/AudioSystem';
import { eventBus, GameEvents } from '@core/EventBus';
import { COLORS } from '@config/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  init(): void {
    configManager.initialize();
  }

  preload(): void {
    const graphics = this.add.graphics();
    this.createProgressBar(graphics);
  }

  private createProgressBar(graphics: Phaser.GameObjects.Graphics): void {
    const w = 400;
    const h = 16;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    graphics.fillStyle(COLORS.hudBg, 0.9);
    graphics.fillRoundedRect(cx - w / 2 - 6, cy - h / 2 - 6, w + 12, h + 12, 8);

    this.load.on('progress', (value: number) => {
      graphics.clear();

      graphics.fillStyle(COLORS.hudBg, 0.9);
      graphics.fillRoundedRect(cx - w / 2 - 6, cy - h / 2 - 6, w + 12, h + 12, 8);

      graphics.fillStyle(COLORS.hudBorder, 0.95);
      graphics.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);

      graphics.fillStyle(COLORS.accent, 1);
      graphics.fillRoundedRect(cx - w / 2, cy - h / 2, w * value, h, 6);
    });

    this.load.on('complete', () => {
      this.time.delayedCall(300, () => {
        graphics.destroy();
      });
    });
  }

  create(): void {
    saveSystem.load();
    audioSystem.initialize(this);

    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.transition = 'opacity 0.5s ease';
      loading.style.opacity = '0';
      setTimeout(() => loading.remove(), 500);
    }

    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
    });
  }
}
