import Phaser from 'phaser';

export class FeedbackManager {
  private scene: Phaser.Scene;
  private activeTweens: Phaser.Tweens.Tween[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playCorrectFeedback(x: number, y: number, callback?: () => void): void {
    const checkmark = this.scene.add.text(x, y, '✓', {
      fontSize: '48px',
      color: '#4ade80',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(1000);

    const tween = this.scene.tweens.add({
      targets: checkmark,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        checkmark.destroy();
        callback?.();
      },
    });
    this.activeTweens.push(tween);
  }

  playWrongFeedback(target: Phaser.GameObjects.GameObject, callback?: () => void): void {
    const tween = this.scene.tweens.add({
      targets: target,
      x: (target as any).x + 6,
      duration: 60,
      yoyo: true,
      repeat: 3,
      ease: 'Linear',
      onComplete: () => {
        callback?.();
      },
    });
    this.activeTweens.push(tween);
  }

  playDiscoveryFeedback(x: number, y: number, text: string, callback?: () => void): void {
    const bg = this.scene.add.rectangle(x, y, 300, 50, 0x16213e, 0.9)
      .setOrigin(0.5).setDepth(999);

    const label = this.scene.add.text(x, y, text, {
      fontSize: '16px',
      color: '#fbbf24',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(1000);

    const tween = this.scene.tweens.add({
      targets: [bg, label],
      y: y - 30,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        bg.destroy();
        label.destroy();
        callback?.();
      },
    });
    this.activeTweens.push(tween);
  }

  playHighlightPulse(target: Phaser.GameObjects.GameObject, duration: number = 2000): void {
    const tween = this.scene.tweens.add({
      targets: target,
      alpha: { from: 0.2, to: 0.6 },
      duration: 500,
      yoyo: true,
      repeat: Math.floor(duration / 1000),
      ease: 'Sine.easeInOut',
    });
    this.activeTweens.push(tween);
  }

  playShelfScan(x: number, y: number, width: number, height: number, callback?: () => void): void {
    const scanLine = this.scene.add.rectangle(x, y, width, 3, 0xfbbf24, 0.8)
      .setOrigin(0, 0).setDepth(999);

    const tween = this.scene.tweens.add({
      targets: scanLine,
      y: y + height,
      duration: 600,
      ease: 'Linear',
      onComplete: () => {
        scanLine.destroy();
        callback?.();
      },
    });
    this.activeTweens.push(tween);
  }

  playBookPull(bookObj: Phaser.GameObjects.Container, callback?: () => void): void {
    const tween = this.scene.tweens.add({
      targets: bookObj,
      x: (bookObj as any).x + 30,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        callback?.();
      },
    });
    this.activeTweens.push(tween);
  }

  stopAll(): void {
    this.activeTweens.forEach((t) => t.stop());
    this.activeTweens = [];
  }
}
