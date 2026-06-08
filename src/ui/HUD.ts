import Phaser from 'phaser';
import { COLORS } from '@config/constants';
import { gameState } from '@core/GameState';
import { configManager } from '@systems/ConfigManager';
import { saveSystem } from '@systems/SaveSystem';
import { performanceMonitor } from '@systems/PerformanceMonitor';
import { formatTime } from '@core/utils';
import { BookData } from '@core/types';
import { GameController } from '@game/GameController';

export class HUD {
  private scene: Phaser.Scene;
  private gameController: GameController;
  private container: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Graphics;
  private infoElements: Map<string, Phaser.GameObjects.Text> = new Map();
  private progressBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private bottomBar!: Phaser.GameObjects.Graphics;
  private carryingBookDisplay: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, gameController: GameController) {
    this.scene = scene;
    this.gameController = gameController;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    this.createTopBar();
    this.createBottomBar();
    this.createFPSCounter();
  }

  private createTopBar(): void {
    const w = this.scene.scale.width;
    const h = 56;

    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(COLORS.hudBg, 0.92);
    this.bg.fillRect(0, 0, w, h);
    this.bg.lineStyle(1, COLORS.hudBorder, 0.8);
    this.bg.lineBetween(0, h, w, h);

    this.createInfoText('level', 20, h / 2, '第一夜：新手指引', 'left');
    this.createInfoText('steps', w * 0.28, h / 2, '步数: 0 / 60', 'center');
    this.createInfoText('time', w * 0.48, h / 2, '时间: 00:00', 'center');
    
    this.createProgressElement('books', w * 0.65, h / 2, '📚 书籍', 0, 2);
    this.createProgressElement('clues', w * 0.65 + 110, h / 2, '📝 线索', 0, 2);
    this.createProgressElement('cards', w * 0.65 + 220, h / 2, '📇 索引卡', 0, 2);

    this.container.add(this.bg);
  }

  private createInfoText(key: string, x: number, y: number, text: string, align: string): void {
    const t = this.scene.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e8e8f0',
      fontStyle: 'bold'
    });
    
    if (align === 'center') t.setOrigin(0.5, 0.5);
    else if (align === 'right') t.setOrigin(1, 0.5);
    else t.setOrigin(0, 0.5);

    this.infoElements.set(key, t);
    this.container.add(t);
  }

  private createProgressElement(key: string, x: number, y: number, label: string, current: number, total: number): void {
    const group = this.scene.add.container(x, y);

    const labelText = this.scene.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#8892b0'
    });
    labelText.setOrigin(0, 1.3);

    const countText = this.scene.add.text(0, 0, `${current}/${total}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: current >= total ? '#98c379' : '#ffd866',
      fontStyle: 'bold'
    });
    countText.setOrigin(0, 0.3);

    group.add([labelText, countText]);
    this.infoElements.set(`${key}_count`, countText);
    this.container.add(group);
  }

  private createBottomBar(): void {
    const w = this.scene.scale.width;
    const h = 64;
    const y = this.scene.scale.height - h;

    this.bottomBar = this.scene.add.graphics();
    this.bottomBar.fillStyle(COLORS.hudBg, 0.92);
    this.bottomBar.fillRect(0, y, w, h);
    this.bottomBar.lineStyle(1, COLORS.hudBorder, 0.8);
    this.bottomBar.lineBetween(0, y, w, y);

    const controls = [
      { key: 'WASD', desc: '移动' },
      { key: '空格', desc: '交互/拾取' },
      { key: 'Z', desc: '撤销' },
      { key: 'R', desc: '重来' },
      { key: 'ESC', desc: '菜单' }
    ];

    controls.forEach((ctrl, i) => {
      const ctrlX = 20 + i * (w / controls.length);
      
      const keyBg = this.scene.add.graphics();
      keyBg.fillStyle(COLORS.hudBorder, 0.8);
      keyBg.fillRoundedRect(ctrlX, y + 14, 52, 36, 6);
      keyBg.lineStyle(1, COLORS.accent, 0.6);
      keyBg.strokeRoundedRect(ctrlX, y + 14, 52, 36, 6);

      const keyText = this.scene.add.text(ctrlX + 26, y + 32, ctrl.key, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#e8e8f0',
        fontStyle: 'bold'
      });
      keyText.setOrigin(0.5, 0.5);

      const descText = this.scene.add.text(ctrlX + 62, y + 32, ctrl.desc, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8892b0'
      });
      descText.setOrigin(0, 0.5);

      this.container.add([keyBg, keyText, descText]);
    });

    this.container.add(this.bottomBar);
  }

  private createFPSCounter(): void {
    if (!configManager.isShowFPS()) return;

    const fpsText = this.scene.add.text(this.scene.scale.width - 16, 72, 'FPS: 60', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#8892b0'
    });
    fpsText.setOrigin(1, 0);
    fpsText.setScrollFactor(0);
    fpsText.setDepth(1500);
    this.infoElements.set('fps', fpsText);
    this.container.add(fpsText);

    const stats = this.scene.add.text(this.scene.scale.width - 16, 90, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#5a5a7a'
    });
    stats.setOrigin(1, 0);
    stats.setScrollFactor(0);
    stats.setDepth(1500);
    this.infoElements.set('stats', stats);
    this.container.add(stats);
  }

  update(delta: number): void {
    const level = gameState.getLevelConfig();
    const progress = gameState.getProgress();
    const steps = gameState.getStepsTaken();
    const maxSteps = level?.maxSteps || 0;
    const time = gameState.getTimeElapsed();
    const remaining = gameState.getRemainingSteps();

    const levelText = this.infoElements.get('level');
    if (levelText && level) levelText.setText(level.name);

    const stepsText = this.infoElements.get('steps');
    if (stepsText) {
      const stepsColor = remaining <= Math.max(5, maxSteps * 0.1) ? '#ff6b6b' : '#e8e8f0';
      stepsText.setText(`步数: ${steps} / ${maxSteps}`);
      stepsText.setColor(stepsColor);
    }

    const timeText = this.infoElements.get('time');
    if (timeText) {
      if (level?.timeLimit) {
        const remainingTime = Math.max(0, level.timeLimit - time);
        timeText.setText(`剩余时间: ${formatTime(remainingTime)}`);
        if (remainingTime < 30) timeText.setColor('#ff6b6b');
        else if (remainingTime < 60) timeText.setColor('#ffd866');
      } else {
        timeText.setText(`时间: ${formatTime(time)}`);
      }
    }

    this.updateProgressText('books', progress.books.correct, progress.books.total);
    this.updateProgressText('clues', progress.clues.collected, progress.clues.total);
    this.updateProgressText('cards', progress.cards.fixed, progress.cards.total);

    this.updateFPSDisplay();
    this.updateCarryingBookDisplay();
  }

  private updateProgressText(key: string, current: number, total: number): void {
    const text = this.infoElements.get(`${key}_count`);
    if (!text) return;
    text.setText(`${current}/${total}`);
    text.setColor(current >= total ? '#98c379' : '#ffd866');
  }

  private updateFPSDisplay(): void {
    const fpsText = this.infoElements.get('fps');
    const statsText = this.infoElements.get('stats');

    const stats = performanceMonitor.getStats();
    if (fpsText) {
      const grade = performanceMonitor.getPerformanceGrade();
      const colors = {
        excellent: '#98c379',
        good: '#7aa2f7',
        average: '#ffd866',
        poor: '#ff6b6b'
      };
      fpsText.setText(`FPS: ${stats.fps}`);
      fpsText.setColor(colors[grade]);
    }

    if (statsText) {
      statsText.setText(`FT:${stats.frameTime}ms | ENT:${stats.entities} | MEM:${stats.memoryUsed}MB`);
    }
  }

  private updateCarryingBookDisplay(): void {
    const book = this.gameController.getCarryingBook();
    const bottomY = this.scene.scale.height - 64;

    if (book) {
      if (this.carryingBookDisplay) {
        this.updateCarryingBook(book);
        return;
      }
      this.createCarryingBookDisplay(book);
    } else {
      this.removeCarryingBookDisplay();
    }
  }

  private createCarryingBookDisplay(book: BookData): void {
    const y = this.scene.scale.height - 32;
    const x = this.scene.scale.width / 2;

    this.carryingBookDisplay = this.scene.add.container(x, y + 50);
    this.carryingBookDisplay.setDepth(1100);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.hudBg, 0.95);
    bg.fillRoundedRect(-170, -28, 340, 52, 10);
    bg.lineStyle(2, book.color, 0.9);
    bg.strokeRoundedRect(-170, -28, 340, 52, 10);

    const bookIcon = this.scene.add.graphics();
    bookIcon.fillStyle(book.color, 1);
    bookIcon.fillRoundedRect(-150, -16, 32, 36, 4);
    bookIcon.fillStyle(0x000000, 0.3);
    bookIcon.fillRect(-150, -16, 6, 36);

    const label = this.scene.add.text(-100, -12, '手持书籍：', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#8892b0'
    });

    const name = this.scene.add.text(-100, 2, book.name, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#e8e8f0',
      fontStyle: 'bold'
    });

    const hint = this.scene.add.text(120, 0, '按空格放置', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#7aa2f7'
    });
    hint.setOrigin(1, 0.5);

    this.carryingBookDisplay.add([bg, bookIcon, label, name, hint]);

    this.scene.tweens.add({
      targets: this.carryingBookDisplay,
      y: y,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  private updateCarryingBook(book: BookData): void {
    if (!this.carryingBookDisplay) return;
  }

  private removeCarryingBookDisplay(): void {
    if (!this.carryingBookDisplay) return;

    const display = this.carryingBookDisplay;
    this.scene.tweens.add({
      targets: display,
      y: display.y + 50,
      alpha: 0,
      duration: 200,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        display.destroy();
      }
    });
    this.carryingBookDisplay = null;
  }

  destroy(): void {
    this.container.destroy();
  }

  resize(): void {
    this.destroy();
  }
}
