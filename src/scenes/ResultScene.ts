import Phaser from 'phaser';
import { Conflict } from '../data/types.js';
import { createButton, formatTime, flashScreen } from '../utils/helpers.js';
import { SaveManager } from '../core/SaveManager.js';
import { AudioManager } from '../core/AudioManager.js';
import { LEVELS } from '../levels/index.js';

const FONT_FAMILY = '"Courier New", monospace';

const CONFLICT_LABELS: Record<Conflict['type'], string> = {
  same_track: '同轨冲突',
  delay_chain: '晚点连锁',
  platform_occupied: '站台占用',
};

interface ResultData {
  levelId: string;
  levelName: string;
  victory: boolean;
  time: number;
  conflicts: Conflict[];
  stars: number;
}

export class ResultScene extends Phaser.Scene {
  private resultData: ResultData | null = null;

  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: ResultData) {
    this.resultData = data;
  }

  create() {
    const data = this.resultData;
    if (!data) return;

    this.cameras.main.fadeIn(500);

    const saveManager = new SaveManager();
    const audio = new AudioManager(this);
    const cx = this.cameras.main.centerX;

    if (data.victory) {
      this.showVictory(data, cx, audio, saveManager);
    } else {
      this.showFailure(data, cx, audio);
    }

    this.createConflictLog(data.conflicts, cx);
    this.createButtons(data, cx);
  }

  private showVictory(data: ResultData, cx: number, audio: AudioManager, saveManager: SaveManager): void {
    this.add.text(cx, 100, '调度成功！', {
      fontSize: '48px',
      fontFamily: FONT_FAMILY,
      fontStyle: 'bold',
      color: '#22c55e',
    }).setOrigin(0.5);

    this.add.text(cx, 145, `用时: ${formatTime(data.time)}`, {
      fontSize: '20px',
      fontFamily: FONT_FAMILY,
      color: '#94a3b8',
    }).setOrigin(0.5);

    const starY = 195;
    const starSpacing = 50;
    const startX = cx - starSpacing;

    for (let i = 0; i < 3; i++) {
      const texture = i < data.stars ? 'star_filled' : 'star_empty';
      const star = this.add.image(startX + i * starSpacing, starY, texture)
        .setScale(0)
        .setDepth(10);

      this.tweens.add({
        targets: star,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        delay: 300 + i * 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: star,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 100,
          });
        },
      });
    }

    saveManager.saveLevelResult(data.levelId, {
      stars: data.stars,
      bestTime: data.time,
      completed: true,
    });

    audio.playSuccess();
    flashScreen(this, 0x22c55e, 0.15, 400);
  }

  private showFailure(_data: ResultData, cx: number, audio: AudioManager): void {
    this.add.text(cx, 100, '调度失败', {
      fontSize: '48px',
      fontFamily: FONT_FAMILY,
      fontStyle: 'bold',
      color: '#e63946',
    }).setOrigin(0.5);

    this.add.text(cx, 145, '存在严重调度冲突', {
      fontSize: '20px',
      fontFamily: FONT_FAMILY,
      color: '#94a3b8',
    }).setOrigin(0.5);

    audio.playFail();
    this.cameras.main.shake(300, 0.01);
    flashScreen(this, 0xe63946, 0.2, 400);
  }

  private createConflictLog(conflicts: Conflict[], cx: number): void {
    const panelWidth = 500;
    const panelHeight = 240;
    const panelX = cx - panelWidth / 2;
    const panelY = 240;

    const bg = this.add.image(cx, panelY + panelHeight / 2, 'panel');
    bg.setDisplaySize(panelWidth, panelHeight);

    this.add.text(cx, panelY + 12, '冲突记录', {
      fontSize: '18px',
      fontFamily: FONT_FAMILY,
      fontStyle: 'bold',
      color: '#f1f5f9',
    }).setOrigin(0.5, 0);

    const clipRect = this.make.graphics({} as Phaser.Types.GameObjects.Graphics.Options);
    clipRect.fillStyle(0xffffff);
    clipRect.fillRect(panelX + 8, panelY + 34, panelWidth - 16, panelHeight - 42);
    const mask = clipRect.createGeometryMask();

    const content = this.add.container(panelX + 16, panelY + 38);
    content.setMask(mask);

    const entryHeight = 50;
    for (let i = 0; i < conflicts.length; i++) {
      const c = conflicts[i];
      const y = i * entryHeight;
      const severityColor = c.severity === 'warning' ? '#fbbf24' : '#e63946';

      const typeLabel = this.add.text(0, y, CONFLICT_LABELS[c.type], {
        fontSize: '14px',
        fontFamily: FONT_FAMILY,
        fontStyle: 'bold',
        color: severityColor,
      });

      const timeLabel = this.add.text(100, y, formatTime(c.time), {
        fontSize: '14px',
        fontFamily: FONT_FAMILY,
        color: '#94a3b8',
      });

      const msgLabel = this.add.text(170, y, c.message, {
        fontSize: '13px',
        fontFamily: FONT_FAMILY,
        color: '#cbd5e1',
        wordWrap: { width: 290 },
      });

      content.add([typeLabel, timeLabel, msgLabel]);
    }

    const contentHeight = conflicts.length * entryHeight;
    const viewHeight = panelHeight - 42;

    if (contentHeight > viewHeight) {
      content.setInteractive(new Phaser.Geom.Rectangle(0, 0, panelWidth - 16, contentHeight), Phaser.Geom.Rectangle.Contains);
      this.input.setDraggable(content);

      const minY = panelY + 38 - (contentHeight - viewHeight);
      const maxY = panelY + 38;

      content.on('drag', (_pointer: Phaser.Input.Pointer, _dragX: number, dragY: number) => {
        content.y = Phaser.Math.Clamp(dragY, minY, maxY);
      });
    }
  }

  private createButtons(data: ResultData, cx: number): void {
    const y = 600;

    if (data.victory) {
      createButton(this, cx - 220, y, '重试', 'btn_danger', () => {
        this.scene.start('GameScene', { levelId: data.levelId });
      });

      createButton(this, cx, y, '下一关', 'btn_primary', () => {
        const currentIndex = LEVELS.findIndex(l => l.id === data.levelId);
        const nextLevel = currentIndex >= 0 && currentIndex < LEVELS.length - 1
          ? LEVELS[currentIndex + 1]
          : null;
        if (nextLevel) {
          this.scene.start('GameScene', { levelId: nextLevel.id });
        } else {
          this.scene.start('MenuScene');
        }
      });

      createButton(this, cx + 220, y, '返回菜单', 'btn_neutral', () => {
        this.scene.start('MenuScene');
      });
    } else {
      createButton(this, cx - 120, y, '重试', 'btn_danger', () => {
        this.scene.start('GameScene', { levelId: data.levelId });
      });

      createButton(this, cx + 120, y, '返回菜单', 'btn_neutral', () => {
        this.scene.start('MenuScene');
      });
    }
  }
}
