import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

export class MainMenuScene extends Phaser.Scene {
  private stars: Phaser.GameObjects.Arc[] = [];
  private selectedIndex: number = 0;
  private menuItems: string[] = ['开始游戏', '教程', '关卡选择', '关卡编辑器', '设置', '调试日志'];
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private titleText!: Phaser.GameObjects.Text;
  private canInteract: boolean = false;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.createStarfield();
    this.createTitle();
    this.createMenu();
    this.updateSelection();

    this.time.delayedCall(600, () => { this.canInteract = true; });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-UP', () => this.moveSelection(-1));
      this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(1));
      this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());
      this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
    }

    this.input.on('gamepaddown', (_pad: any, button: any) => {
      if (!this.canInteract) return;
      if (button.index === 12) this.moveSelection(-1);
      else if (button.index === 13) this.moveSelection(1);
      else if (button.index === 0) this.confirmSelection();
    });
  }

  private createStarfield(): void {
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const r = Phaser.Math.FloatBetween(0.5, 2);
      const star = this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));
      this.stars.push(star);
    }
  }

  private createTitle(): void {
    this.titleText = this.add.text(GAME_WIDTH / 2, 120, '夜间书店', {
      fontSize: '52px',
      fontFamily: 'serif',
      color: '#e6a817',
      stroke: '#1a1a2e',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    const subtitle = this.add.text(GAME_WIDTH / 2, 175, '整理谜题', {
      fontSize: '28px',
      fontFamily: 'serif',
      color: '#f0e6d3',
      stroke: '#1a1a2e',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      y: 100,
      duration: 800,
      ease: 'Power2',
    });
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      y: 155,
      duration: 800,
      delay: 200,
      ease: 'Power2',
    });

    const lampGlow = this.add.circle(GAME_WIDTH / 2, 90, 60, 0xe6a817, 0.08);
    this.tweens.add({
      targets: lampGlow,
      alpha: { from: 0.06, to: 0.12 },
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createMenu(): void {
    const startY = 260;
    const gap = 50;

    for (let i = 0; i < this.menuItems.length; i++) {
      const text = this.add.text(GAME_WIDTH / 2, startY + i * gap, this.menuItems[i], {
        fontSize: '22px',
        fontFamily: 'sans-serif',
        color: '#f0e6d3',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        this.selectedIndex = i;
        this.updateSelection();
      });
      text.on('pointerdown', () => {
        this.selectedIndex = i;
        this.updateSelection();
        this.confirmSelection();
      });

      this.menuTexts.push(text);
    }
  }

  private moveSelection(dir: number): void {
    if (!this.canInteract) return;
    this.selectedIndex = (this.selectedIndex + dir + this.menuItems.length) % this.menuItems.length;
    this.updateSelection();
  }

  private updateSelection(): void {
    for (let i = 0; i < this.menuTexts.length; i++) {
      const t = this.menuTexts[i];
      if (i === this.selectedIndex) {
        t.setColor('#e6a817').setFontSize('24px');
        t.setScale(1.05);
      } else {
        t.setColor('#f0e6d3').setFontSize('22px');
        t.setScale(1.0);
      }
    }
  }

  private confirmSelection(): void {
    if (!this.canInteract) return;
    this.canInteract = false;

    const key = this.game.registry.get('saveSystem');
    if (key) this.game.registry.set('saveSystem', key);

    switch (this.selectedIndex) {
      case 0:
        this.scene.start('LevelSelectScene');
        break;
      case 1:
        this.game.registry.set('tutorialMode', true);
        this.scene.start('TutorialScene');
        break;
      case 2:
        this.scene.start('LevelSelectScene');
        break;
      case 3:
        this.scene.start('EditorScene');
        break;
      case 4:
        this.scene.start('SettingsScene');
        break;
      case 5:
        this.scene.start('DebugScene');
        break;
    }
  }

  update(): void {
    for (const star of this.stars) {
      star.alpha += Phaser.Math.FloatBetween(-0.01, 0.01);
      star.alpha = Phaser.Math.Clamp(star.alpha, 0.2, 0.9);
    }
  }
}
