import Phaser from 'phaser';
import { createButton } from '../utils/helpers.js';
import { SaveManager } from '../core/SaveManager.js';
import { AudioManager } from '../core/AudioManager.js';
import { LEVELS } from '../levels/index.js';

export class MenuScene extends Phaser.Scene {
  private saveManager!: SaveManager;
  private audioManager!: AudioManager;
  private levelPanel!: Phaser.GameObjects.Container;
  private levelPanelVisible: boolean = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.saveManager = new SaveManager();
    this.audioManager = new AudioManager(this);

    this.cameras.main.setBackgroundColor('#1a2744');
    this.cameras.main.fadeIn(500);

    this.createRailDecoration();

    this.add.text(this.cameras.main.centerX, 120, '铁路调度拼图', {
      fontSize: '48px',
      fontFamily: '"Courier New", monospace',
      color: '#e2e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(this.cameras.main.centerX, 175, 'RAILWAY DISPATCH PUZZLE', {
      fontSize: '18px',
      fontFamily: '"Courier New", monospace',
      color: '#94a3b8',
    }).setOrigin(0.5);

    const cx = this.cameras.main.centerX;

    createButton(this, cx, 260, '新游戏', 'btn_primary', () => {
      this.audioManager.playClick();
      this.scene.start('TutorialScene');
    });

    createButton(this, cx, 320, '继续游戏', 'btn_primary', () => {
      this.audioManager.playClick();
      const lastUnlocked = this.getLastUnlockedLevel();
      this.scene.start('GameScene', { level: lastUnlocked });
    });

    createButton(this, cx, 380, '教程', 'btn_neutral', () => {
      this.audioManager.playClick();
      this.scene.start('TutorialScene');
    });

    createButton(this, cx, 450, '关卡选择', 'btn_neutral', () => {
      this.audioManager.playClick();
      this.toggleLevelPanel();
    });

    this.levelPanel = this.createLevelPanel();
    this.levelPanel.setVisible(false);
  }

  private createRailDecoration(): void {
    const w = this.cameras.main.width;
    const positions = [50, this.cameras.main.height - 50, this.cameras.main.height - 90];
    for (const y of positions) {
      const count = Math.ceil(w / 64) + 1;
      for (let i = 0; i < count; i++) {
        this.add.image(i * 64, y, 'track_h').setAlpha(0.15).setOrigin(0, 0.5);
      }
    }
  }

  private createLevelPanel(): Phaser.GameObjects.Container {
    const panel = this.add.container(this.cameras.main.centerX, 540);

    const bg = this.add.image(0, 0, 'panel').setDisplaySize(500, 300).setAlpha(0.95);
    panel.add(bg);

    const panelTitle = this.add.text(0, -125, '关卡选择', {
      fontSize: '24px',
      fontFamily: '"Courier New", monospace',
      color: '#e2e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    panel.add(panelTitle);

    const cols = 3;
    const cellW = 140;
    const cellH = 80;
    const startX = -((Math.min(LEVELS.length, cols) - 1) * cellW) / 2;
    const startY = -60;

    LEVELS.forEach((level: typeof LEVELS[number], i: number) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * cellW;
      const y = startY + row * cellH;
      const unlocked = this.saveManager.isLevelUnlocked(level.id);
      const stars = this.saveManager.getLevelStars(level.id);

      const cell = this.add.container(x, y);

      const btnBg = this.add.image(0, 0, 'btn_neutral').setDisplaySize(120, 50);

      if (!unlocked) {
        btnBg.setAlpha(0.4);
        btnBg.setTint(0x888888);
      } else {
        btnBg.setInteractive({ useHandCursor: true });
        btnBg.on('pointerover', () => btnBg.setTint(0xdddddd));
        btnBg.on('pointerout', () => btnBg.clearTint());
        btnBg.on('pointerdown', () => {
          this.audioManager.playClick();
          this.scene.start('GameScene', { level });
        });
      }

      const nameText = this.add.text(0, -8, level.name, {
        fontSize: '14px',
        fontFamily: '"Courier New", monospace',
        color: unlocked ? '#e2e8f0' : '#6b7280',
      }).setOrigin(0.5);

      const starContainer = this.add.container(0, 14);
      for (let s = 0; s < 3; s++) {
        const starX = (s - 1) * 22;
        const starKey = s < stars ? 'star_filled' : 'star_empty';
        const starImg = this.add.image(starX, 0, starKey).setScale(0.6);
        if (!unlocked) starImg.setAlpha(0.3);
        starContainer.add(starImg);
      }

      cell.add([btnBg, nameText, starContainer]);
      panel.add(cell);
    });

    return panel;
  }

  private toggleLevelPanel(): void {
    this.levelPanelVisible = !this.levelPanelVisible;
    this.levelPanel.setVisible(this.levelPanelVisible);
  }

  private getLastUnlockedLevel(): typeof LEVELS[number] {
    this.saveManager.refresh();
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (this.saveManager.isLevelUnlocked(LEVELS[i].id)) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }
}
