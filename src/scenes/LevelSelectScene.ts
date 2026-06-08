import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { SaveSystem } from '@/systems/SaveSystem';

interface LevelEntry {
  id: string;
  name: string;
  difficulty: number;
}

const LEVELS: LevelEntry[] = [
  { id: 'tutorial_01', name: '初入书店', difficulty: 0 },
  { id: 'level_01', name: '星空书架', difficulty: 1 },
  { id: 'level_02', name: '迷宫书廊', difficulty: 2 },
  { id: 'level_03', name: '深夜整理', difficulty: 3 },
];

export class LevelSelectScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private levelCards: Phaser.GameObjects.Container[] = [];
  private selectedIndex: number = 0;
  private canInteract: boolean = false;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    this.saveSystem = this.game.registry.get('saveSystem');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    this.add.text(GAME_WIDTH / 2, 40, '选择关卡', {
      fontSize: '28px', fontFamily: 'serif', color: '#e6a817',
    }).setOrigin(0.5);

    this.createLevelCards();

    const backBtn = this.add.text(60, GAME_HEIGHT - 30, '返回主菜单', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#9ca3af',
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-LEFT', () => this.moveSelection(-1));
      this.input.keyboard.on('keydown-RIGHT', () => this.moveSelection(1));
      this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());
      this.input.keyboard.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
    }

    this.updateSelection();
    this.time.delayedCall(300, () => { this.canInteract = true; });
  }

  private createLevelCards(): void {
    const cardW = 180;
    const cardH = 220;
    const gap = 20;
    const totalW = LEVELS.length * cardW + (LEVELS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    const cy = GAME_HEIGHT / 2;

    for (let i = 0; i < LEVELS.length; i++) {
      const lvl = LEVELS[i];
      const cx = startX + i * (cardW + gap);
      const unlocked = this.saveSystem.isLevelUnlocked(lvl.id);
      const levelSave = this.saveSystem.getLevelSave(lvl.id);
      const stars = levelSave ? levelSave.stars : 0;

      const container = this.add.container(cx, cy);

      const bg = this.add.rectangle(0, 0, cardW, cardH, unlocked ? COLORS.panelLight : 0x1a1a2e, 0.95);
      bg.setStrokeStyle(2, unlocked ? COLORS.accent : 0x4a4a6a, 0.5);
      container.add(bg);

      const diffColors = [0x4ade80, 0xfbbf24, 0xf97316, 0xef4444];
      const diffBar = this.add.rectangle(0, -cardH / 2 + 10, cardW, 6, diffColors[lvl.difficulty] || 0x4ade80);
      container.add(diffBar);

      const nameText = this.add.text(0, -40, lvl.name, {
        fontSize: '18px', fontFamily: 'serif', color: unlocked ? '#f0e6d3' : '#6b7280',
      }).setOrigin(0.5);
      container.add(nameText);

      const starsText = this.add.text(0, 10, this.getStarString(stars, unlocked), {
        fontSize: '24px', color: unlocked ? '#e6a817' : '#4a4a6a',
      }).setOrigin(0.5);
      container.add(starsText);

      if (levelSave && levelSave.completed) {
        const stepText = this.add.text(0, 50, `最佳: ${levelSave.bestSteps}步`, {
          fontSize: '12px', fontFamily: 'sans-serif', color: '#9ca3af',
        }).setOrigin(0.5);
        container.add(stepText);
      }

      if (!unlocked) {
        const lock = this.add.text(0, 0, '🔒', { fontSize: '32px' }).setOrigin(0.5);
        container.add(lock);
      }

      container.setSize(cardW, cardH);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerover', () => { this.selectedIndex = i; this.updateSelection(); });
      container.on('pointerdown', () => { this.selectedIndex = i; this.updateSelection(); this.confirmSelection(); });

      this.levelCards.push(container);
    }
  }

  private getStarString(count: number, unlocked: boolean): string {
    if (!unlocked) return '☆ ☆ ☆';
    let s = '';
    for (let i = 0; i < 3; i++) {
      s += i < count ? '★ ' : '☆ ';
    }
    return s.trim();
  }

  private moveSelection(dir: number): void {
    if (!this.canInteract) return;
    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex + dir, 0, LEVELS.length - 1);
    this.updateSelection();
  }

  private updateSelection(): void {
    for (let i = 0; i < this.levelCards.length; i++) {
      const card = this.levelCards[i];
      if (i === this.selectedIndex) {
        card.setScale(1.08);
      } else {
        card.setScale(1.0);
      }
    }
  }

  private confirmSelection(): void {
    if (!this.canInteract) return;
    const lvl = LEVELS[this.selectedIndex];
    if (!this.saveSystem.isLevelUnlocked(lvl.id)) return;

    this.canInteract = false;
    this.game.registry.set('currentLevelId', lvl.id);
    this.scene.start('GameScene');
  }
}
