import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { SaveSystem } from '@/systems/SaveSystem';

export class BootScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const barW = 300;
    const barH = 20;

    this.add.rectangle(cx, cy, barW + 4, barH + 4, 0xf0e6d3, 0.8);
    const bar = this.add.rectangle(cx - barW / 2, cy, barW, barH, COLORS.accent);
    bar.setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = barW * value;
    });

    this.createPlaceholderTextures();
  }

  create(): void {
    this.saveSystem = new SaveSystem();
    this.game.registry.set('saveSystem', this.saveSystem);

    const debugLogs: Array<{ timestamp: number; level: string; message: string; data?: unknown }> = [];
    this.game.registry.set('debugLogs', debugLogs);

    this.log('info', 'BootScene complete, game initialized');

    this.scene.start('MainMenuScene');
  }

  private createPlaceholderTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0, add: false } as any);

    g.fillStyle(COLORS.player);
    g.fillRoundedRect(4, 4, 40, 40, 6);
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeRoundedRect(4, 4, 40, 40, 6);
    g.generateTexture('player', 48, 48);
    g.clear();

    g.fillStyle(COLORS.bookshelf);
    g.fillRect(2, 2, 44, 44);
    g.lineStyle(2, 0x3d2b1f);
    g.strokeRect(2, 2, 44, 44);
    g.lineStyle(1, 0x8b6347);
    g.lineBetween(2, 16, 46, 16);
    g.lineBetween(2, 30, 46, 30);
    g.generateTexture('bookshelf', 48, 48);
    g.clear();

    g.fillStyle(COLORS.book);
    g.fillRoundedRect(8, 4, 32, 40, 4);
    g.lineStyle(1, 0xb8860b);
    g.strokeRoundedRect(8, 4, 32, 40, 4);
    g.generateTexture('book', 48, 48);
    g.clear();

    g.fillStyle(COLORS.indexCard);
    g.fillRoundedRect(6, 8, 36, 32, 2);
    g.lineStyle(2, 0xfef3c7);
    g.strokeRoundedRect(6, 8, 36, 32, 2);
    g.generateTexture('index_card', 48, 48);
    g.clear();

    g.fillStyle(COLORS.clue);
    g.fillCircle(24, 24, 16);
    g.lineStyle(2, 0x93c5fd);
    g.strokeCircle(24, 24, 16);
    g.generateTexture('clue_item', 48, 48);
    g.clear();

    g.fillStyle(0x4ade80, 0.3);
    g.fillRoundedRect(2, 2, 44, 44, 4);
    g.lineStyle(2, 0x4ade80, 0.8);
    g.strokeRoundedRect(2, 2, 44, 44, 4);
    g.generateTexture('shelf_slot_highlight', 48, 48);
    g.clear();

    g.destroy();
  }

  private log(level: string, message: string, data?: unknown): void {
    const logs = this.game.registry.get('debugLogs') as Array<{ timestamp: number; level: string; message: string; data?: unknown }>;
    if (logs) {
      logs.push({ timestamp: Date.now(), level, message, data });
    }
  }
}
