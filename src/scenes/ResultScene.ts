import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { ResultData } from '@/types';

export class ResultScene extends Phaser.Scene {
  private resultData!: ResultData;

  constructor() {
    super({ key: 'ResultScene' });
  }

  create(): void {
    this.resultData = this.game.registry.get('lastResult') || {
      result: 'failure', levelId: 'level_01', steps: 0, maxSteps: 20, stars: 0, collectedClues: 0, totalClues: 0,
    };

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    if (this.resultData.result === 'success') {
      this.showSuccess();
    } else {
      this.showFailure();
    }

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ENTER', () => this.handleConfirm());
      this.input.keyboard.on('keydown-ESC', () => this.scene.start('LevelSelectScene'));
    }
  }

  private showSuccess(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy - 160, '整理完成！', {
      fontSize: '36px', fontFamily: 'serif', color: '#e6a817',
    }).setOrigin(0.5);

    const starY = cy - 80;
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(cx - 60 + i * 60, starY, '☆', {
        fontSize: '40px', color: '#4a4a6a',
      }).setOrigin(0.5);

      if (i < this.resultData.stars) {
        this.time.delayedCall(300 + i * 400, () => {
          star.setText('★').setColor('#e6a817');
          this.tweens.add({
            targets: star,
            scaleX: { from: 0, to: 1.3 },
            scaleY: { from: 0, to: 1.3 },
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
              this.tweens.add({ targets: star, scaleX: 1, scaleY: 1, duration: 200 });
            },
          });
        });
      }
    }

    this.add.text(cx, cy - 10, `步数: ${this.resultData.steps} / ${this.resultData.maxSteps}`, {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 30, `线索: ${this.resultData.collectedClues} / ${this.resultData.totalClues}`, {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#60a5fa',
    }).setOrigin(0.5);

    const nextBtn = this.add.text(cx - 80, cy + 100, '下一关', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#e6a817',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.nextLevel());

    const selectBtn = this.add.text(cx + 80, cy + 100, '关卡选择', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    selectBtn.on('pointerdown', () => this.scene.start('LevelSelectScene'));

    this.add.text(cx, cy + 160, '按 Enter 继续 | ESC 返回', {
      fontSize: '12px', fontFamily: 'sans-serif', color: '#6b7280',
    }).setOrigin(0.5);
  }

  private showFailure(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy - 100, '步数用完了…', {
      fontSize: '32px', fontFamily: 'serif', color: '#ef4444',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 40, `已用 ${this.resultData.steps} 步 (限制: ${this.resultData.maxSteps}步)`, {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(0.5);

    this.add.text(cx, cy, '再试一次吧！', {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#9ca3af',
    }).setOrigin(0.5);

    const retryBtn = this.add.text(cx, cy + 80, '重试', {
      fontSize: '24px', fontFamily: 'sans-serif', color: '#e6a817',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retryBtn.on('pointerdown', () => this.retryLevel());
    retryBtn.on('pointerover', () => retryBtn.setScale(1.1));
    retryBtn.on('pointerout', () => retryBtn.setScale(1.0));

    const selectBtn = this.add.text(cx, cy + 130, '返回关卡选择', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    selectBtn.on('pointerdown', () => this.scene.start('LevelSelectScene'));

    this.add.text(cx, cy + 180, 'Enter 重试 | ESC 返回', {
      fontSize: '12px', fontFamily: 'sans-serif', color: '#6b7280',
    }).setOrigin(0.5);
  }

  private handleConfirm(): void {
    if (this.resultData.result === 'success') {
      this.nextLevel();
    } else {
      this.retryLevel();
    }
  }

  private retryLevel(): void {
    this.game.registry.set('currentLevelId', this.resultData.levelId);
    this.scene.start('GameScene');
  }

  private nextLevel(): void {
    const num = parseInt(this.resultData.levelId.replace(/\D/g, '')) || 0;
    const nextId = `level_${String(num + 1).padStart(2, '0')}`;
    this.game.registry.set('currentLevelId', nextId);
    this.scene.start('GameScene');
  }
}
