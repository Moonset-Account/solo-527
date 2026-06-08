import Phaser from 'phaser';
import { SaveManager } from '../systems/SaveManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    this.add.text(width / 2, 140, '图书馆夜巡', {
      fontSize: '52px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 210, '夜班管理员的解谜冒险', {
      fontSize: '20px',
      color: '#94a3b8',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.drawLibraryDecor(width, height);

    this.createMenuButton(width / 2, 340, '开始新游戏', () => {
      SaveManager.getInstance().clearSave();
      this.scene.start('GameScene', { chapter: 1, levelIndex: 0 });
    });

    const save = SaveManager.getInstance().getData();
    if (save.completedLevels.length > 0) {
      this.createMenuButton(width / 2, 420, `继续游戏（第${save.currentChapter}章）`, () => {
        this.scene.start('GameScene', {
          chapter: save.currentChapter,
          levelIndex: save.currentLevelIndex,
        });
      });
    }

    this.add.text(width / 2, 560, '操作说明', {
      fontSize: '18px',
      color: '#64748b',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const instructions = [
      '点击书架上的书 → 查看详情和线索',
      '点击借阅卡 → 收集到物品栏',
      '点击线索板按钮 → 查看/标记嫌疑项',
      '选中书籍后点击「提交判断」→ 确认错位藏书',
      '连续三次判断错误 → 提示高亮关联区域',
    ];

    instructions.forEach((line, i) => {
      this.add.text(width / 2, 600 + i * 28, line, {
        fontSize: '14px',
        color: '#475569',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    });
  }

  private drawLibraryDecor(width: number, height: number): void {
    const g = this.add.graphics();

    g.fillStyle(0x2d1f0e, 0.3);
    g.fillRect(40, 80, 30, 160);
    g.fillRect(width - 70, 80, 30, 160);

    g.lineStyle(1, 0x0f3460, 0.3);
    for (let i = 0; i < 6; i++) {
      const y = 700 + i * 12;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(width, y);
      g.strokePath();
    }
  }

  private createMenuButton(x: number, y: number, label: string, callback: () => void): void {
    const btn = this.add.image(x, y, 'button').setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '18px',
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
