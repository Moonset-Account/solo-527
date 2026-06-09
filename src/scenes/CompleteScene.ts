import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { AudioSystem } from '@/systems/AudioSystem';
import { Achievement } from '@/systems/AchievementSystem';
import { DailySystem } from '@/systems/DailySystem';
import { SaveSystem } from '@/systems/SaveSystem';

interface CompleteSceneInitData {
  levelId: number;
  steps: number;
  maxSteps: number;
  stars: number;
  levelName: string;
  isDaily: boolean;
  clues: number;
  cards: number;
  books: number;
  achievements?: Achievement[];
}

export class CompleteScene extends Phaser.Scene {
  private audioSys!: AudioSystem;
  private sceneData!: CompleteSceneInitData;

  constructor() {
    super({ key: 'complete' });
  }

  init(data: CompleteSceneInitData): void {
    this.sceneData = data;
  }

  create(): void {
    this.audioSys = new AudioSystem(this);
    this.cameras.main.setBackgroundColor(`#${GameConfig.Colors.BG_NIGHT.toString(16).padStart(6, '0')}`);

    const cx = GameConfig.CANVAS_WIDTH / 2;
    const cy = GameConfig.CANVAS_HEIGHT / 2;
    const w = 520;
    const h = 600;

    const panel = this.add.graphics();
    panel.fillStyle(GameConfig.Colors.BG_FLOOR, 1);
    panel.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);
    panel.lineStyle(2, GameConfig.Colors.ACCENT, 0.6);
    panel.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);

    this.add.text(cx, cy - h / 2 + 44, this.sceneData.levelName, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - h / 2 + 80, '关卡完成！', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: `#${GameConfig.Colors.SUCCESS.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    const starY = cy - h / 2 + 150;
    const starTexts: Phaser.GameObjects.Text[] = [];
    for (let i = 0; i < 3; i++) {
      const st = this.add.text(cx - 70 + i * 70, starY, '★', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5).setScale(0);
      starTexts.push(st);
    }
    for (let i = 0; i < 3; i++) {
      const lit = i < this.sceneData.stars;
      this.tweens.add({
        targets: starTexts[i],
        scale: 1,
        rotation: Math.PI * 2,
        duration: 500,
        delay: 200 + i * 250,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (lit) {
            starTexts[i].setColor(`#${GameConfig.Colors.TARGET.toString(16).padStart(6, '0')}`);
            this.tweens.add({
              targets: starTexts[i],
              scale: { from: 1, to: 1.15, duration: 300 },
              yoyo: true,
            });
          }
        },
      });
    }

    const statsY = cy - 20;
    const statsLeft = cx - w / 2 + 60;
    const statsRight = cx + w / 2 - 60;
    this.makeStat(statsLeft, statsY - 40, '步数', `${this.sceneData.steps} / ${this.sceneData.maxSteps}`, GameConfig.Colors.TEXT);
    this.makeStat(statsRight, statsY - 40, '线索', `${this.sceneData.clues}`, GameConfig.Colors.CLUE);
    this.makeStat(statsLeft, statsY + 10, '索引卡', `${this.sceneData.cards}`, GameConfig.Colors.CARD);
    this.makeStat(statsRight, statsY + 10, '错放书余', `${this.sceneData.books}`, GameConfig.Colors.BOOK);

    let achY = statsY + 80;
    if (this.sceneData.achievements && this.sceneData.achievements.length > 0) {
      this.add.text(cx, achY, '新解锁成就', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: `#${GameConfig.Colors.ACCENT.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      achY += 28;
      for (const ach of this.sceneData.achievements) {
        this.add.text(cx, achY, `${ach.icon}  ${ach.name}`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: `#${GameConfig.Colors.SUCCESS.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5);
        achY += 22;
      }
    }

    const btnY = cy + h / 2 - 110;
    const btnW = 150;
    const btnH = 44;

    if (!this.sceneData.isDaily && this.sceneData.levelId < GameConfig.TOTAL_LEVELS) {
      this.makeButton(cx - btnW - 12, btnY, btnW, btnH, '下一关', () => {
        this.audioSys.destroy();
        SaveSystem.setCurrentLevel(this.sceneData.levelId + 1);
        this.scene.start('game', { levelId: this.sceneData.levelId + 1, isDaily: false });
      });
    }

    this.makeButton(cx - btnW / 2, btnY, btnW, btnH, '再来一次', () => {
      this.audioSys.destroy();
      this.scene.start('game', { levelId: this.sceneData.levelId, isDaily: this.sceneData.isDaily });
    });

    this.makeButton(cx + btnW / 2 + 12, btnY, btnW, btnH, '关卡选择', () => {
      this.audioSys.destroy();
      this.scene.start('level_select');
    });

    const btnY2 = btnY + btnH + 14;
    let menuBtnX = cx - btnW - 12;
    if (this.sceneData.isDaily) {
      menuBtnX = cx + btnW / 2 + 12;
      this.makeButton(cx - btnW - 12, btnY2, btnW, btnH, '上传排行榜', () => {
        this.audioSys.playSfx('card');
        const name = DailySystem.getPlayerName();
        DailySystem.submitScore({
          name,
          levelId: this.sceneData.levelId,
          steps: this.sceneData.steps,
          stars: this.sceneData.stars,
          isDaily: true,
        });
        const saved = this.add.text(cx, btnY2 + btnH + 20, '成绩已上传！', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: `#${GameConfig.Colors.SUCCESS.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5);
        this.tweens.add({
          targets: saved,
          alpha: { from: 1, to: 0 },
          duration: 2000,
          delay: 1200,
        });
      });
    }

    this.makeButton(menuBtnX, btnY2, btnW, btnH, '返回菜单', () => {
      this.audioSys.destroy();
      this.scene.start('level_select');
    });

    if (this.sceneData.isDaily) {
      this.makeButton(cx - btnW / 2, btnY2, btnW, btnH, '排行榜', () => {
        this.audioSys.destroy();
        this.scene.start('leaderboard');
      });
    }
  }

  private makeStat(x: number, y: number, label: string, value: string, color: number): void {
    this.add.text(x - 8, y, label, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
    }).setOrigin(1, 0.5);
    this.add.text(x + 8, y, value, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
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
      fontSize: '15px',
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
      cont.setScale(1.04);
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
