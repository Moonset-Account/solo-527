import Phaser from 'phaser';
import { COLORS } from '@config/constants';
import { eventBus, GameEvents } from '@core/EventBus';
import { gameState } from '@core/GameState';
import { configManager } from '@systems/ConfigManager';
import { saveSystem } from '@systems/SaveSystem';
import { formatTime } from '@core/utils';

export class ResultOverlay {
  private scene: Phaser.Scene;
  private isWin: boolean;
  private reason?: string;
  private container: Phaser.GameObjects.Container;
  private dimmer!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private onRestart?: () => void;
  private onNextLevel?: () => void;
  private onMenu?: () => void;

  constructor(
    scene: Phaser.Scene,
    isWin: boolean,
    callbacks: {
      onRestart?: () => void;
      onNextLevel?: () => void;
      onMenu?: () => void;
    } = {},
    reason?: string
  ) {
    this.scene = scene;
    this.isWin = isWin;
    this.reason = reason;
    this.onRestart = callbacks.onRestart;
    this.onNextLevel = callbacks.onNextLevel;
    this.onMenu = callbacks.onMenu;

    this.container = scene.add.container(0, 0);
    this.container.setDepth(2000);
    this.container.setAlpha(0);

    this.createDimmer();
    this.createPanel();
    this.createContent();

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 500,
      ease: 'Cubic.easeIn'
    });
  }

  private createDimmer(): void {
    this.dimmer = this.scene.add.graphics();
    this.dimmer.fillStyle(0x000000, 0.75);
    this.dimmer.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    this.dimmer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1, 1), Phaser.Geom.Rectangle.Contains);
    this.container.add(this.dimmer);
  }

  private createPanel(): void {
    const w = 520;
    const h = 480;
    const cx = this.scene.scale.width / 2;
    const cy = this.scene.scale.height / 2;

    this.panel = this.scene.add.graphics();
    const accentColor = this.isWin ? COLORS.success : COLORS.error;

    this.panel.fillStyle(COLORS.hudBg, 0.98);
    this.panel.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);

    this.panel.lineStyle(3, accentColor, 0.9);
    this.panel.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);

    this.panel.fillStyle(accentColor, 0.15);
    this.panel.fillRoundedRect(cx - w / 2, cy - h / 2, w, 80, { tl: 16, tr: 16, bl: 0, br: 0 });

    this.container.add(this.panel);
  }

  private createContent(): void {
    const cx = this.scene.scale.width / 2;
    const cy = this.scene.scale.height / 2;

    const titleColor = this.isWin ? '#98c379' : '#ff6b6b';
    const titleText = this.isWin ? '🎉 通关成功！' : '💔 挑战失败';
    const title = this.scene.add.text(cx, cy - 180, titleText, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: titleColor,
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const subtitle = this.scene.add.text(cx, cy - 130, this.isWin ? '书籍都已正确归位' : (this.reason || '再接再厉！'), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#8892b0'
    });
    subtitle.setOrigin(0.5);

    this.createStats(cx, cy - 40);
    this.createButtons(cx, cy + 140);
  }

  private createStats(cx: number, cy: number): void {
    const steps = gameState.getStepsTaken();
    const time = gameState.getTimeElapsed();
    const level = gameState.getLevelConfig();
    const maxSteps = level?.maxSteps || 0;
    const progress = gameState.getProgress();

    const stats = [
      {
        label: '总步数',
        value: `${steps} / ${maxSteps}`,
        color: steps <= maxSteps * 0.7 ? '#98c379' : steps <= maxSteps * 0.9 ? '#ffd866' : '#ff6b6b',
        icon: '👣'
      },
      {
        label: '用时',
        value: formatTime(time),
        color: '#7aa2f7',
        icon: '⏱'
      },
      {
        label: '线索收集',
        value: `${progress.clues.collected} / ${progress.clues.total}`,
        color: '#ffd866',
        icon: '📝'
      },
      {
        label: '书籍归位',
        value: `${progress.books.correct} / ${progress.books.total}`,
        color: progress.books.correct >= progress.books.total ? '#98c379' : '#e06c75',
        icon: '📚'
      }
    ];

    const stars = this.calculateStars();
    const starsY = cy - 90;
    const starColor = this.isWin ? '#ffd866' : '#5a5a7a';
    
    for (let i = 0; i < 3; i++) {
      const starText = this.scene.add.text(cx + (i - 1) * 48, starsY, '★', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: i < stars ? starColor : '#3a3a4a',
        fontStyle: 'bold'
      });
      starText.setOrigin(0.5);
      this.container.add(starText);

      if (i < stars && this.isWin) {
        this.scene.tweens.add({
          targets: starText,
          scale: 1.2,
          yoyo: true,
          repeat: -1,
          hold: 1000,
          delay: i * 300,
          duration: 600,
          ease: 'Sine.easeInOut'
        });
      }
    }

    stats.forEach((stat, i) => {
      const y = cy + 20 + i * 38;
      const iconX = cx - 180;
      const labelX = cx - 140;
      const valueX = cx + 180;

      const icon = this.scene.add.text(iconX, y, stat.icon, {
        fontFamily: 'monospace',
        fontSize: '20px'
      });
      icon.setOrigin(0, 0.5);

      const label = this.scene.add.text(labelX, y, stat.label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#8892b0'
      });
      label.setOrigin(0, 0.5);

      const value = this.scene.add.text(valueX, y, stat.value, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: stat.color,
        fontStyle: 'bold'
      });
      value.setOrigin(1, 0.5);

      this.container.add([icon, label, value]);
    });

    if (this.isWin && level) {
      saveSystem.completeLevel(level.id, steps, time);
    }
  }

  private calculateStars(): number {
    if (!this.isWin) return 0;
    const steps = gameState.getStepsTaken();
    const time = gameState.getTimeElapsed();
    const level = gameState.getLevelConfig();
    const recommended = level?.recommendedSteps || level?.maxSteps;

    let stars = 1;
    if (recommended && steps <= recommended) stars = 2;
    if (recommended && steps <= recommended * 0.8 && time < 180) stars = 3;
    return stars;
  }

  private createButtons(cx: number, cy: number): void {
    const buttonW = 140;
    const buttonH = 48;
    const spacing = 24;

    const totalW = buttonW * (this.isWin ? 3 : 2) + spacing * (this.isWin ? 2 : 1);
    let startX = cx - totalW / 2 + buttonW / 2;

    const buttons: Array<{ label: string; color: number; textColor: string; callback: () => void; primary?: boolean }> = [];

    if (this.isWin) {
      const hasNext = !!configManager.getNextLevel(gameState.getLevelConfig()?.id || '');
      buttons.push({
        label: hasNext ? '下一关 →' : '完成',
        color: COLORS.success,
        textColor: '#0a0a14',
        callback: () => this.onNextLevel?.(),
        primary: true
      });
    }

    buttons.push({
      label: '🔄 重新挑战',
      color: COLORS.accent,
      textColor: '#ffffff',
      callback: () => this.onRestart?.()
    });

    buttons.push({
      label: '🏠 返回菜单',
      color: COLORS.hudBorder,
      textColor: '#e8e8f0',
      callback: () => this.onMenu?.()
    });

    buttons.forEach((btn, i) => {
      const x = startX + i * (buttonW + spacing);
      
      const bg = this.scene.add.graphics();
      bg.fillStyle(btn.color, 1);
      bg.fillRoundedRect(x - buttonW / 2, cy - buttonH / 2, buttonW, buttonH, 10);
      
      if (btn.primary) {
        bg.lineStyle(2, 0xffffff, 0.3);
        bg.strokeRoundedRect(x - buttonW / 2, cy - buttonH / 2, buttonW, buttonH, 10);
      }

      bg.setInteractive(new Phaser.Geom.Rectangle(x - buttonW / 2, cy - buttonH / 2, buttonW, buttonH), Phaser.Geom.Rectangle.Contains);
      
      bg.on('pointerover', () => {
        bg.setAlpha(0.85);
        this.scene.tweens.add({
          targets: bg,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100
        });
      });

      bg.on('pointerout', () => {
        bg.setAlpha(1);
        bg.setScale(1);
      });

      bg.on('pointerdown', () => {
        this.scene.tweens.add({
          targets: bg,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 80,
          yoyo: true,
          onComplete: () => btn.callback()
        });
      });

      const text = this.scene.add.text(x, cy, btn.label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: btn.textColor,
        fontStyle: 'bold'
      });
      text.setOrigin(0.5);

      this.container.add([bg, text]);
    });
  }

  destroy(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => this.container.destroy()
    });
  }
}
