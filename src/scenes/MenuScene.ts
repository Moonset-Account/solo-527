import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { AudioSystem } from '@/systems/AudioSystem';
import { SaveSystem } from '@/systems/SaveSystem';

interface MenuButton {
  rect: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  label: string;
  onClick: () => void;
  isHovered: boolean;
}

export class MenuScene extends Phaser.Scene {
  private audioSystem!: AudioSystem;
  private buttons: MenuButton[] = [];
  private selectedIndex = 0;
  private isUsingGamepad = false;
  private prevPadButtonStates: boolean[] = [];

  constructor() {
    super({ key: 'menu' });
  }

  create(): void {
    this.audioSystem = new AudioSystem(this);
    this.audioSystem.startAmbientMusic();

    this.createBackground();
    this.createTitle();
    this.createMainButtons();
    this.createSideButtons();
    this.createFooter();
    this.setupInput();
    this.updateSelectionVisual();
  }

  private createBackground(): void {
    const { width, height } = this.cameras.main;
    const g = this.add.graphics();
    g.fillStyle(GameConfig.Colors.BG_NIGHT, 1);
    g.fillRect(0, 0, width, height);

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height - 100);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.8);
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, size);
    }

    this.tweens.add({
      targets: g,
      alpha: { from: 0.6, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    });
  }

  private createTitle(): void {
    const centerX = this.cameras.main.width / 2;

    const title = this.add.text(centerX, 80, '夜间书店整理谜题', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5);

    title.setShadow(0, 4, '#000000', 6, false, true);

    this.tweens.add({
      targets: title,
      y: 80 - 5,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const subtitle = this.add.text(centerX, 130, 'Night Bookstore Puzzle', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5);

    subtitle.setLetterSpacing(4);

    const decor = this.add.graphics();
    decor.lineStyle(2, GameConfig.Colors.ACCENT, 0.6);
    decor.beginPath();
    decor.moveTo(centerX - 150, 155);
    decor.lineTo(centerX + 150, 155);
    decor.strokePath();
  }

  private createMainButtons(): void {
    const centerX = this.cameras.main.width / 2;
    const startY = 210;
    const spacing = 70;

    const buttonConfigs = [
      { label: '开始游戏', onClick: () => this.handleStartGame() },
      { label: '关卡选择', onClick: () => this.handleLevelSelect() },
      { label: '每日挑战', onClick: () => this.handleDailyChallenge() },
      { label: '设置', onClick: () => this.handleSettings() }
    ];

    buttonConfigs.forEach((config, index) => {
      const y = startY + index * spacing;
      this.createButton(centerX, y, 280, 50, config.label, config.onClick, index);
    });
  }

  private createSideButtons(): void {
    const { width } = this.cameras.main;
    const y = 470;

    this.createSmallButton(width / 2 - 100, y, 160, 44, '成就 🏆', () => this.handleAchievements());
    this.createSmallButton(width / 2 + 100, y, 160, 44, '排行榜 📊', () => this.handleLeaderboard());
  }

  private createButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void, index: number): void {
    const rect = this.add.graphics();
    this.drawButtonRect(rect, w, h, GameConfig.Colors.WALL, GameConfig.Colors.ACCENT);
    rect.setPosition(x - w / 2, y - h / 2);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5);

    rect.setInteractive(new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    rect.on('pointerover', () => {
      if (!this.isUsingGamepad) {
        this.selectedIndex = index;
      }
      this.hoverButton(index);
    });

    rect.on('pointerout', () => {
      if (!this.isUsingGamepad) {
        this.resetButtonVisual(index);
      }
    });

    rect.on('pointerdown', () => {
      this.pressButton(index);
    });

    this.buttons.push({ rect, text, label, onClick, isHovered: false });
  }

  private createSmallButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void): void {
    const rect = this.add.graphics();
    this.drawButtonRect(rect, w, h, 0x2d2845, 0x5c4033);
    rect.setPosition(x - w / 2, y - h / 2);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5);

    rect.setInteractive(new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    let originalAlpha = 1;
    const originalColor = `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`;
    rect.on('pointerover', () => {
      originalAlpha = rect.alpha;
      rect.alpha = 0.8;
      text.setColor(`#${GameConfig.Colors.ACCENT.toString(16).padStart(6, '0')}`);
      this.audioSystem.playSfx('click', 0.5);
    });

    rect.on('pointerout', () => {
      rect.alpha = originalAlpha;
      text.setColor(originalColor);
    });

    rect.on('pointerdown', () => {
      this.audioSystem.playSfx('click');
      onClick();
    });
  }

  private drawButtonRect(g: Phaser.GameObjects.Graphics, w: number, h: number, fillColor: number, strokeColor: number): void {
    g.clear();
    g.fillStyle(fillColor, 1);
    g.fillRoundedRect(0, 0, w, h, 10);
    g.lineStyle(3, strokeColor, 1);
    g.strokeRoundedRect(0, 0, w, h, 10);
  }

  private drawHoveredButtonRect(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    g.clear();
    g.fillStyle(0x3d3755, 1);
    g.fillRoundedRect(0, 0, w, h, 10);
    g.lineStyle(3, GameConfig.Colors.ACCENT, 1);
    g.strokeRoundedRect(0, 0, w, h, 10);
    g.lineStyle(1, 0xffffff, 0.3);
    g.strokeRoundedRect(3, 3, w - 6, h - 6, 8);
  }

  private hoverButton(index: number): void {
    const btn = this.buttons[index];
    if (!btn || btn.isHovered) return;
    btn.isHovered = true;

    const w = 280, h = 50;
    this.drawHoveredButtonRect(btn.rect, w, h);
    btn.text.setColor(`#${GameConfig.Colors.ACCENT.toString(16).padStart(6, '0')}`);
    this.audioSystem.playSfx('click', 0.4);

    this.tweens.add({
      targets: btn.rect,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 100,
      yoyo: true
    });
  }

  private resetButtonVisual(index: number): void {
    const btn = this.buttons[index];
    if (!btn) return;
    btn.isHovered = false;

    this.drawButtonRect(btn.rect, 280, 50, GameConfig.Colors.WALL, GameConfig.Colors.ACCENT);
    btn.rect.setScale(1, 1);
    btn.text.setColor(`#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`);
  }

  private pressButton(index: number): void {
    const btn = this.buttons[index];
    if (!btn) return;

    this.audioSystem.playSfx('click');

    this.tweens.add({
      targets: btn.rect,
      scaleX: 0.97,
      scaleY: 0.97,
      duration: 80,
      yoyo: true,
      onComplete: () => {
        btn.onClick();
      }
    });
  }

  private updateSelectionVisual(): void {
    this.buttons.forEach((_, i) => {
      if (i === this.selectedIndex) {
        this.hoverButton(i);
      } else {
        this.resetButtonVisual(i);
      }
    });
  }

  private createFooter(): void {
    const { width, height } = this.cameras.main;
    const y = height - 40;

    const hint = this.add.text(width / 2, y,
      '↑↓/WASD 选择 | Enter/Space 确认 | 手柄方向键/A键 操作',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`
      }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: { from: 0.5, to: 1 },
      duration: 1800,
      yoyo: true,
      repeat: -1
    });
  }

  private setupInput(): void {
    this.input.keyboard!.on('keydown-UP', () => this.moveSelection(-1));
    this.input.keyboard!.on('keydown-DOWN', () => this.moveSelection(1));
    this.input.keyboard!.on('keydown-W', () => this.moveSelection(-1));
    this.input.keyboard!.on('keydown-S', () => this.moveSelection(1));
    this.input.keyboard!.on('keydown-ENTER', () => this.confirmSelection());
    this.input.keyboard!.on('keydown-SPACE', () => this.confirmSelection());

    this.input.gamepad!.on('connected', () => {
      this.isUsingGamepad = true;
    });
  }

  private moveSelection(delta: number): void {
    this.isUsingGamepad = false;
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + delta, 0, this.buttons.length);
    this.updateSelectionVisual();
    this.audioSystem.playSfx('click', 0.3);
  }

  private confirmSelection(): void {
    this.pressButton(this.selectedIndex);
  }

  public update(_time: number, _delta: number): void {
    const pads = this.input.gamepad?.gamepads || [];
    if (pads.length === 0) return;
    const gamepad = pads[0];
    this.isUsingGamepad = true;

    const curStates: boolean[] = gamepad.buttons.map((b: any) => !!b.value);
    const justPressed = (idx: number) => curStates[idx] && !this.prevPadButtonStates[idx];
    const axisVal = (i: number) => (gamepad.axes[i] as any)?.value ?? 0;

    const checkUp = gamepad.up || justPressed(12) || axisVal(1) < -0.5;
    const checkDown = gamepad.down || justPressed(13) || axisVal(1) > 0.5;
    const checkLeft = justPressed(14) || axisVal(0) < -0.5;
    const checkRight = justPressed(15) || axisVal(0) > 0.5;
    const confirm = justPressed(0);

    if (checkUp || checkLeft) this.moveSelection(-1);
    else if (checkDown || checkRight) this.moveSelection(1);
    if (confirm) this.confirmSelection();

    this.prevPadButtonStates = curStates;
  }

  private handleStartGame(): void {
    const save = SaveSystem.loadSave();
    const lv = save.currentLevel || 1;
    this.scene.start('game', { levelId: lv, isDaily: false });
  }

  private handleLevelSelect(): void {
    this.scene.start('level_select');
  }

  private handleDailyChallenge(): void {
    this.scene.start('game', { levelId: 1, isDaily: true });
  }

  private handleSettings(): void {
    this.scene.start('settings');
  }

  private handleAchievements(): void {
    this.scene.start('achievements');
  }

  private handleLeaderboard(): void {
    this.scene.start('leaderboard');
  }

  public shutdown(): void {
    this.audioSystem?.destroy();
  }
}
