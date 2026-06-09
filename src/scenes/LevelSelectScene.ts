import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { LEVELS } from '@/config/levels';
import { AudioSystem } from '@/systems/AudioSystem';
import { SaveSystem, GameSaveData, LevelProgress } from '@/systems/SaveSystem';
import { DailySystem } from '@/systems/DailySystem';

export class LevelSelectScene extends Phaser.Scene {
  private audioSys!: AudioSystem;
  private save!: GameSaveData;

  constructor() {
    super({ key: 'level_select' });
  }

  create(): void {
    this.audioSys = new AudioSystem(this);
    this.save = SaveSystem.loadSave();
    this.cameras.main.setBackgroundColor(`#${GameConfig.Colors.BG_NIGHT.toString(16).padStart(6, '0')}`);

    const cx = GameConfig.CANVAS_WIDTH / 2;

    this.add.text(cx, 50, '夜间书店 · 选择关卡', {
      fontFamily: 'monospace',
      fontSize: '30px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 86, '选择一个关卡开始游戏，或尝试每日挑战', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    const dailyY = 130;
    this.makeDailyCard(cx, dailyY);

    const cols = 3;
    const cardW = 160;
    const cardH = 140;
    const gapX = 24;
    const gapY = 20;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = cx - totalW / 2 + cardW / 2;
    const startY = dailyY + 100;

    for (let i = 0; i < GameConfig.TOTAL_LEVELS; i++) {
      const level = LEVELS[i];
      const progress = this.save.levels[level.id] ?? { levelId: level.id, completed: false, bestSteps: -1, stars: 0 };
      const unlocked = level.id === 1 || (this.save.levels[level.id - 1]?.completed ?? false);
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.makeLevelCard(x, y, cardW, cardH, level, progress, unlocked);
    }

    const bottomBtnY = startY + Math.ceil(GameConfig.TOTAL_LEVELS / cols) * (cardH + gapY) - gapY + 20;
    this.makeButton(cx - 130, bottomBtnY, 120, 40, '设置', () => {
      this.audioSys.destroy();
      this.scene.start('settings');
    });
    this.makeButton(cx, bottomBtnY, 120, 40, '成就', () => {
      this.audioSys.destroy();
      this.scene.start('achievements');
    });
    this.makeButton(cx + 130, bottomBtnY, 120, 40, '排行榜', () => {
      this.audioSys.destroy();
      this.scene.start('leaderboard');
    });
  }

  private makeDailyCard(x: number, y: number): void {
    const w = 520;
    const h = 64;
    const progress = DailySystem.getTodayProgress();
    const challenge = DailySystem.getDailyChallenge();

    const g = this.add.graphics();
    const normalColor = GameConfig.Colors.ACCENT;
    g.fillStyle(progress.completed ? GameConfig.Colors.SUCCESS : normalColor, progress.completed ? 0.6 : 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    this.add.text(x - w / 2 + 20, y, '📅 每日挑战', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.add.text(x, y, challenge.modifiedLevel.name, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    let statusText = '点击挑战';
    if (progress.completed) {
      statusText = `已完成 · ${progress.bestSteps}步 · ${progress.stars}★`;
    }
    this.add.text(x + w / 2 - 20, y, statusText, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
    }).setOrigin(1, 0.5);

    const cont = this.add.container(x, y);
    cont.setSize(w, h);
    cont.setInteractive({ useHandCursor: true });
    cont.on('pointerover', () => {
      g.clear();
      g.fillStyle(GameConfig.Colors.PLAYER, progress.completed ? 0.7 : 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.6);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      cont.setScale(1.02);
    });
    cont.on('pointerout', () => {
      g.clear();
      g.fillStyle(progress.completed ? GameConfig.Colors.SUCCESS : normalColor, progress.completed ? 0.6 : 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      cont.setScale(1);
    });
    cont.on('pointerdown', () => {
      this.audioSys.playSfx('click');
      this.audioSys.destroy();
      this.scene.start('game', { levelId: challenge.levelId, isDaily: true });
    });
  }

  private makeLevelCard(
    x: number,
    y: number,
    w: number,
    h: number,
    level: typeof LEVELS[0],
    progress: LevelProgress,
    unlocked: boolean
  ): void {
    const cont = this.add.container(x, y);
    const g = this.add.graphics();
    const bgColor = unlocked ? (progress.completed ? GameConfig.Colors.SUCCESS : GameConfig.Colors.ACCENT) : GameConfig.Colors.TEXT_DIM;
    const bgAlpha = unlocked ? 1 : 0.5;
    g.fillStyle(bgColor, bgAlpha);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

    const idText = this.add.text(0, -h / 2 + 22, `#${level.id}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const nameText = this.add.text(0, -h / 2 + 46, level.name, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      wordWrap: { width: w - 16 },
      align: 'center',
    }).setOrigin(0.5);

    const starY = -2;
    for (let i = 0; i < 3; i++) {
      const lit = i < progress.stars;
      this.add.text(-22 + i * 22, starY, '★', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: lit ? `#${GameConfig.Colors.TARGET.toString(16).padStart(6, '0')}` : `#${GameConfig.Colors.SHADOW.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);
    }

    const bestText = this.add.text(0, h / 2 - 28, progress.completed && progress.bestSteps >= 0
      ? `最佳：${progress.bestSteps} 步`
      : unlocked ? '未通关' : '🔒 未解锁', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    const stepsText = this.add.text(0, h / 2 - 12, `限步：${level.maxSteps}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    cont.add([g, idText, nameText, bestText, stepsText]);
    cont.setSize(w, h);

    if (unlocked) {
      cont.setInteractive({ useHandCursor: true });
      cont.on('pointerover', () => {
        g.clear();
        g.fillStyle(GameConfig.Colors.PLAYER, progress.completed ? 0.85 : 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        g.lineStyle(2, GameConfig.Colors.SHADOW, 0.6);
        g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        cont.setScale(1.05);
      });
      cont.on('pointerout', () => {
        g.clear();
        g.fillStyle(bgColor, bgAlpha);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
        g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        cont.setScale(1);
      });
      cont.on('pointerdown', () => {
        this.audioSys.playSfx('click');
        SaveSystem.setCurrentLevel(level.id);
        this.audioSys.destroy();
        this.scene.start('game', { levelId: level.id, isDaily: false });
      });
    }
  }

  private makeButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const cont = this.add.container(x, y);
    const normalColor = GameConfig.Colors.ACCENT;
    const hoverColor = GameConfig.Colors.PLAYER;
    const g = this.add.graphics();
    g.fillStyle(normalColor, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add([g, text]);
    cont.setSize(w, h);
    cont.setInteractive({ useHandCursor: true });
    cont.on('pointerover', () => {
      g.clear();
      g.fillStyle(hoverColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.6);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      cont.setScale(1.05);
    });
    cont.on('pointerout', () => {
      g.clear();
      g.fillStyle(normalColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      cont.setScale(1);
    });
    cont.on('pointerdown', () => {
      this.audioSys.playSfx('click');
      onClick();
    });
    return cont;
  }

  shutdown(): void {
    this.audioSys?.destroy();
  }
}
