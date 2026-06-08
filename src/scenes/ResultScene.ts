import Phaser from 'phaser';
import { LevelData } from '../models/types';
import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';

interface ResultSceneData {
  success: boolean;
  levelData: LevelData;
  nextChapter: number | null;
  failureReason?: 'timeout' | 'wrong';
  reasons?: string[];
  missed?: string[];
}

export class ResultScene extends Phaser.Scene {
  private sceneData!: ResultSceneData;
  private audioManager!: AudioManager;

  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: ResultSceneData): void {
    this.sceneData = data;
    this.audioManager = new AudioManager(this);
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a, 0.97);

    if (this.sceneData.success) {
      this.renderSuccess(width, height);
    } else {
      this.renderFailure(width, height);
    }
  }

  private renderSuccess(width: number, height: number): void {
    this.audioManager.playLevelComplete();

    this.add.text(width / 2, 80, '✦ 排查完成 ✦', {
      fontSize: '36px',
      color: '#4ade80',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const shelf = this.add.rectangle(width / 2, 160, 500, 2, 0x334155);
    shelf.setOrigin(0.5);

    const completionText = this.add.text(width / 2, 200, this.sceneData.levelData.completionMessage, {
      fontSize: '15px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      wordWrap: { width: 500 },
      lineSpacing: 8,
    }).setOrigin(0.5, 0);

    const stats = this.add.text(width / 2, 340, [
      `章节：第${this.sceneData.levelData.chapter}章`,
      `总错误次数：${SaveManager.getInstance().getData().totalWrongAttempts}`,
    ].join('\n'), {
      fontSize: '14px',
      color: '#94a3b8',
      fontFamily: 'sans-serif',
      lineSpacing: 6,
    }).setOrigin(0.5, 0);

    if (this.sceneData.nextChapter) {
      this.createButton(width / 2, 460, '进入下一章', () => {
        SaveManager.getInstance().setCurrentChapter(this.sceneData.nextChapter!);
        this.scene.start('GameScene', {
          chapter: this.sceneData.nextChapter,
          levelIndex: 0,
        });
      });
    } else {
      this.add.text(width / 2, 460, '所有章节已完成！', {
        fontSize: '20px',
        color: '#fbbf24',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.createButton(width / 2, 520, '返回主菜单', () => {
        this.scene.start('MenuScene');
      });
    }

    this.createButton(width / 2, 540 + (this.sceneData.nextChapter ? 0 : -20), '重新挑战本章', () => {
      this.scene.start('GameScene', {
        chapter: this.sceneData.levelData.chapter,
        levelIndex: 0,
      });
    });
  }

  private renderFailure(width: number, height: number): void {
    this.audioManager.playGameOver();

    let titleText: string;
    let titleColor: string;

    if (this.sceneData.failureReason === 'timeout') {
      titleText = '⏰ 闭馆时间已到';
      titleColor = '#f59e0b';
    } else {
      titleText = '判断有误';
      titleColor = '#ef4444';
    }

    this.add.text(width / 2, 60, titleText, {
      fontSize: '32px',
      color: titleColor,
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    let yPos = 120;

    if (this.sceneData.reasons && this.sceneData.reasons.length > 0) {
      this.add.text(width / 2, yPos, '失败原因分析', {
        fontSize: '16px',
        color: '#fbbf24',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      yPos += 30;

      this.sceneData.reasons.forEach((reason) => {
        const text = this.add.text(width / 2, yPos, `• ${reason}`, {
          fontSize: '13px',
          color: '#fca5a5',
          fontFamily: 'sans-serif',
          wordWrap: { width: 600 },
        }).setOrigin(0.5, 0);
        yPos += text.height + 8;
      });
    }

    if (this.sceneData.missed && this.sceneData.missed.length > 0) {
      yPos += 10;
      this.add.text(width / 2, yPos, '你遗漏的错位藏书', {
        fontSize: '16px',
        color: '#60a5fa',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      yPos += 30;

      this.sceneData.missed.forEach((m) => {
        const text = this.add.text(width / 2, yPos, `• ${m}`, {
          fontSize: '13px',
          color: '#93c5fd',
          fontFamily: 'sans-serif',
          wordWrap: { width: 600 },
        }).setOrigin(0.5, 0);
        yPos += text.height + 8;
      });
    }

    yPos += 15;
    this.add.text(width / 2, yPos, '提示：仔细对比借阅卡的归属区域与书籍实际所在书架的分类标签', {
      fontSize: '12px',
      color: '#64748b',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    yPos += 40;

    this.createButton(width / 2, yPos, '重新挑战本章', () => {
      this.scene.start('GameScene', {
        chapter: this.sceneData.levelData.chapter,
        levelIndex: 0,
      });
    });

    yPos += 60;
    this.createButton(width / 2, yPos, '返回主菜单', () => {
      this.scene.start('MenuScene');
    });
  }

  private createButton(x: number, y: number, label: string, callback: () => void): void {
    const btn = this.add.image(x, y, 'button').setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '16px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setTexture('button_hover');
      this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });

    btn.on('pointerout', () => {
      btn.setTexture('button');
      this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 });
    });

    btn.on('pointerdown', callback);
  }
}
