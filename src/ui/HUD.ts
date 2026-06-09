import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';

interface HUDStats {
  steps: number;
  maxSteps: number;
  cluesCollected: number;
  totalClues: number;
  cardsRepaired: number;
  totalCards: number;
  wrongBooksRemaining: number;
  starThresholds: [number, number, number];
}

export class HUD {
  private scene: Phaser.Scene;
  private y: number;
  private width: number;
  private height: number;

  private container: Phaser.GameObjects.Container;
  private levelNameText: Phaser.GameObjects.Text;
  private levelDescText: Phaser.GameObjects.Text;
  private stepsText: Phaser.GameObjects.Text;
  private stepsBarBg: Phaser.GameObjects.Graphics;
  private stepsBar: Phaser.GameObjects.Graphics;
  private cluesText: Phaser.GameObjects.Text;
  private cardsText: Phaser.GameObjects.Text;
  private booksText: Phaser.GameObjects.Text;
  private hintsText: Phaser.GameObjects.Text;
  private tempMessageText: Phaser.GameObjects.Text;
  private starIcons: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, _x: number, y: number, width: number, height: number) {
    this.scene = scene;
    this.y = y;
    this.width = width;
    this.height = height;

    this.container = scene.add.container(_x, y);

    const C = GameConfig.Colors;
    const pad = 12;
    const topY = pad;
    const bottomY = height - pad - 28;

    this.levelNameText = scene.add.text(pad, topY, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: `#${C.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    });
    this.levelDescText = scene.add.text(pad, topY + 22, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: `#${C.TEXT_DIM.toString(16).padStart(6, '0')}`,
      wordWrap: { width: width * 0.32 },
    });

    const centerX = width / 2;
    this.stepsText = scene.add.text(centerX, topY, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: `#${C.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.stepsBarBg = scene.add.graphics();
    this.stepsBar = scene.add.graphics();
    this.drawStepsBar(0);

    for (let i = 0; i < 3; i++) {
      const star = scene.add.text(centerX - 32 + i * 32, topY + 44, '★', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: `#${C.TEXT_DIM.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5, 0);
      this.starIcons.push(star);
    }

    const rightX = width - pad;
    this.cluesText = scene.add.text(rightX, topY, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: `#${C.CLUE.toString(16).padStart(6, '0')}`,
    }).setOrigin(1, 0);
    this.cardsText = scene.add.text(rightX, topY + 22, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: `#${C.CARD.toString(16).padStart(6, '0')}`,
    }).setOrigin(1, 0);
    this.booksText = scene.add.text(rightX, topY + 44, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: `#${C.BOOK.toString(16).padStart(6, '0')}`,
    }).setOrigin(1, 0);

    this.hintsText = scene.add.text(width / 2, bottomY, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: `#${C.TEXT_DIM.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0);
    this.hintsText.setText(
      '方向键/WASD 移动   E/空格 交互   Z 撤销   R 重开   P 暂停'
    );

    this.tempMessageText = scene.add.text(width / 2, height / 2 - 10, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: `#${C.SUCCESS.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      stroke: `#${C.SHADOW.toString(16).padStart(6, '0')}`,
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setAlpha(0);

    this.container.add([
      this.levelNameText,
      this.levelDescText,
      this.stepsText,
      this.stepsBarBg,
      this.stepsBar,
      ...this.starIcons,
      this.cluesText,
      this.cardsText,
      this.booksText,
      this.hintsText,
      this.tempMessageText,
    ]);
  }

  private drawStepsBar(ratio: number): void {
    const barW = 220;
    const barH = 10;
    const centerX = this.width / 2;
    const barX = centerX - barW / 2;
    const barY = this.y + 30;

    this.stepsBarBg.clear();
    this.stepsBarBg.fillStyle(GameConfig.Colors.SHADOW, 0.6);
    this.stepsBarBg.fillRoundedRect(barX - 1, barY - 1, barW + 2, barH + 2, 6);
    this.stepsBarBg.fillStyle(GameConfig.Colors.BG_FLOOR_ALT, 1);
    this.stepsBarBg.fillRoundedRect(barX, barY, barW, barH, 5);

    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    let color = GameConfig.Colors.SUCCESS;
    if (clamped > 0.6) color = GameConfig.Colors.TARGET;
    if (clamped > 0.85) color = GameConfig.Colors.DANGER;

    this.stepsBar.clear();
    this.stepsBar.fillStyle(color, 1);
    this.stepsBar.fillRoundedRect(barX, barY, barW * clamped, barH, 5);
  }

  update(stats: HUDStats): void {
    const ratio = stats.steps / stats.maxSteps;

    this.stepsText.setText(`步数  ${stats.steps} / ${stats.maxSteps}`);
    this.drawStepsBar(ratio);

    for (let i = 0; i < 3; i++) {
      const threshold = stats.starThresholds[2 - i];
      const lit = stats.steps <= threshold;
      this.starIcons[i].setColor(
        lit ? `#${GameConfig.Colors.TARGET.toString(16).padStart(6, '0')}`
            : `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`
      );
    }

    this.cluesText.setText(`线索  ${stats.cluesCollected} / ${stats.totalClues}`);
    this.cardsText.setText(`修复  ${stats.cardsRepaired} / ${stats.totalCards}`);
    this.booksText.setText(`错放书  ${stats.wrongBooksRemaining}`);
  }

  setLevelName(name: string, desc: string): void {
    this.levelNameText.setText(name);
    this.levelDescText.setText(desc);
  }

  showTempMessage(text: string, duration: number = 1500): void {
    this.tempMessageText.setText(text);
    this.tempMessageText.setAlpha(1);
    this.tempMessageText.setScale(0.8);

    this.scene.tweens.add({
      targets: this.tempMessageText,
      alpha: { from: 1, to: 0 },
      scale: { from: 0.8, to: 1.1 },
      y: this.tempMessageText.y - 30,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.tempMessageText.setY(this.height / 2 - 10);
      },
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
