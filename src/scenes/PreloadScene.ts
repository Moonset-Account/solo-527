import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'preload' });
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(GameConfig.Colors.WALL, 0.8);
    this.progressBox.fillRect(centerX - 160, centerY - 25, 320, 50);
    this.progressBox.lineStyle(3, GameConfig.Colors.ACCENT, 1);
    this.progressBox.strokeRoundedRect(centerX - 160, centerY - 25, 320, 50, 8);

    this.progressBar = this.add.graphics();

    this.add.text(centerX, centerY - 60, '夜间书店...加载中', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5);

    this.percentText = this.add.text(centerX, centerY, '0%', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: `#${GameConfig.Colors.ACCENT.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      this.updateProgress(value);
    });

    this.load.on('complete', () => {
      this.updateProgress(1);
      this.time.delayedCall(500, () => {
        this.scene.start('menu');
      });
    });

    this.simulateLoading();
  }

  private simulateLoading(): void {
    let progress = 0;
    const timer = this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        progress += 0.02;
        if (progress >= 1) {
          progress = 1;
          timer.remove();
          this.load.emit('complete');
        }
        this.load.emit('progress', progress);
      }
    });
  }

  private updateProgress(value: number): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.progressBar.clear();
    this.progressBar.fillStyle(GameConfig.Colors.ACCENT, 1);
    this.progressBar.fillRoundedRect(centerX - 154, centerY - 19, 308 * value, 38, 6);

    const percent = Math.floor(value * 100);
    this.percentText.setText(`${percent}%`);
  }
}
