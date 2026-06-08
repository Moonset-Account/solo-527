import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

export class PauseScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private menuItems: string[] = ['继续游戏', '重试关卡', '设置', '返回主菜单'];
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private canInteract: boolean = false;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 320, 320, COLORS.panel, 0.95);
    panel.setStrokeStyle(2, COLORS.accent, 0.6);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, '暂停', {
      fontSize: '28px', fontFamily: 'serif', color: '#e6a817',
    }).setOrigin(0.5);

    const startY = GAME_HEIGHT / 2 - 40;
    const gap = 50;

    for (let i = 0; i < this.menuItems.length; i++) {
      const text = this.add.text(GAME_WIDTH / 2, startY + i * gap, this.menuItems[i], {
        fontSize: '20px', fontFamily: 'sans-serif', color: '#f0e6d3',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      text.on('pointerover', () => { this.selectedIndex = i; this.updateSelection(); });
      text.on('pointerdown', () => { this.selectedIndex = i; this.updateSelection(); this.confirmSelection(); });

      this.menuTexts.push(text);
    }

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-UP', () => this.moveSelection(-1));
      this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(1));
      this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());
      this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
      this.input.keyboard.on('keydown-P', () => this.resumeGame());
    }

    this.updateSelection();
    this.time.delayedCall(200, () => { this.canInteract = true; });
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
        t.setColor('#e6a817').setFontSize('22px');
      } else {
        t.setColor('#f0e6d3').setFontSize('20px');
      }
    }
  }

  private confirmSelection(): void {
    if (!this.canInteract) return;
    switch (this.selectedIndex) {
      case 0: this.resumeGame(); break;
      case 1: this.retryLevel(); break;
      case 2: this.openSettings(); break;
      case 3: this.returnToMenu(); break;
    }
  }

  private resumeGame(): void {
    this.scene.resume('GameScene');
    this.scene.stop('PauseScene');
  }

  private retryLevel(): void {
    this.scene.stop('PauseScene');
    this.scene.restart('GameScene' as any);
  }

  private openSettings(): void {
    this.scene.launch('SettingsScene', { from: 'PauseScene' });
  }

  private returnToMenu(): void {
    this.scene.stop('PauseScene');
    this.scene.stop('GameScene');
    this.scene.start('MainMenuScene');
  }
}
