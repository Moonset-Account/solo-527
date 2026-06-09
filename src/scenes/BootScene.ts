import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload(): void {
    this.createPlayerTexture();
    this.createShelfTexture();
    this.createBookTexture();
    this.createClueTexture();
    this.createCardTexture();
    this.createWallTexture();
    this.createFloorTileTexture();
    this.createTargetZoneTexture();
    this.createCardSlotTexture();
    this.createExitDoorTexture();
  }

  private createPlayerTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(GameConfig.Colors.PLAYER_DARK, 1);
    g.fillCircle(24, 24, 20);
    g.fillStyle(GameConfig.Colors.PLAYER, 1);
    g.fillCircle(24, 24, 16);
    g.fillStyle(GameConfig.Colors.PLAYER_DARK, 1);
    g.fillTriangle(24, 10, 34, 26, 14, 26);
    g.generateTexture('player', 48, 48);
    g.destroy();
  }

  private createShelfTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(GameConfig.Colors.SHELF_EDGE, 1);
    g.fillRect(2, 2, 44, 44);
    g.fillStyle(GameConfig.Colors.SHELF, 1);
    g.fillRect(4, 4, 40, 40);
    g.lineStyle(2, GameConfig.Colors.SHELF_EDGE, 0.6);
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(4, 10 + i * 10);
      g.lineTo(44, 10 + i * 10);
      g.strokePath();
    }
    g.fillStyle(0x8b4513, 1);
    g.fillRect(6, 14, 10, 20);
    g.fillStyle(0x2e8b57, 1);
    g.fillRect(18, 14, 10, 20);
    g.fillStyle(0x4682b4, 1);
    g.fillRect(30, 14, 10, 20);
    g.generateTexture('shelf', 48, 48);
    g.destroy();
  }

  private createBookTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x8b0000, 1);
    g.fillRect(0, 0, 6, 36);
    g.fillStyle(GameConfig.Colors.BOOK, 1);
    g.fillRect(6, 0, 26, 36);
    g.fillStyle(0xffd700, 1);
    g.fillRect(6, 4, 26, 2);
    g.fillRect(6, 30, 26, 2);
    g.fillRect(14, 12, 10, 2);
    g.fillRect(14, 18, 10, 2);
    g.generateTexture('book', 32, 36);
    g.destroy();
  }

  private createClueTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(GameConfig.Colors.CLUE, 0.3);
    g.fillCircle(14, 14, 12);
    g.lineStyle(3, GameConfig.Colors.CLUE, 1);
    g.strokeCircle(14, 14, 10);
    g.lineStyle(4, GameConfig.Colors.CLUE, 1);
    g.beginPath();
    g.moveTo(21, 21);
    g.lineTo(27, 27);
    g.strokePath();
    g.generateTexture('clue', 28, 28);
    g.destroy();
  }

  private createCardTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xc4b896, 1);
    g.fillRect(0, 0, 30, 40);
    g.fillStyle(GameConfig.Colors.CARD, 1);
    g.fillRect(1, 1, 28, 38);
    g.fillStyle(0x333333, 0.4);
    g.fillRect(4, 6, 22, 2);
    g.fillRect(4, 12, 18, 2);
    g.fillRect(4, 18, 20, 2);
    g.fillRect(4, 24, 16, 2);
    g.fillStyle(0x0000ff, 0.6);
    g.fillRect(4, 32, 8, 4);
    g.generateTexture('card', 30, 40);
    g.destroy();
  }

  private createWallTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(GameConfig.Colors.WALL, 1);
    g.fillRect(0, 0, 48, 48);
    g.lineStyle(2, 0x1a1726, 1);
    g.strokeRect(0, 0, 48, 24);
    g.strokeRect(0, 24, 48, 24);
    g.strokeRect(24, 0, 24, 24);
    g.strokeRect(0, 24, 24, 24);
    g.strokeRect(12, 0, 12, 24);
    g.strokeRect(36, 24, 12, 24);
    g.generateTexture('wall', 48, 48);
    g.destroy();
  }

  private createFloorTileTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(GameConfig.Colors.BG_FLOOR, 1);
    g.fillRect(0, 0, 48, 48);
    g.fillStyle(GameConfig.Colors.BG_FLOOR_ALT, 1);
    g.fillRect(0, 0, 24, 24);
    g.fillRect(24, 24, 24, 24);
    g.lineStyle(1, 0x0f0d1a, 0.3);
    g.strokeRect(0, 0, 48, 48);
    g.generateTexture('floor_tile', 48, 48);
    g.destroy();
  }

  private createTargetZoneTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(GameConfig.Colors.TARGET, 0.25);
    g.fillRect(4, 4, 40, 40);
    g.lineStyle(3, GameConfig.Colors.TARGET, 0.8);
    g.strokeRect(4, 4, 40, 40);
    g.lineStyle(2, GameConfig.Colors.TARGET, 0.5);
    g.strokeRect(10, 10, 28, 28);
    g.fillStyle(GameConfig.Colors.TARGET, 0.6);
    g.fillRect(22, 22, 4, 4);
    g.generateTexture('target_zone', 48, 48);
    g.destroy();
  }

  private createCardSlotTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x1a1726, 1);
    g.fillRect(4, 4, 40, 40);
    g.fillStyle(0x0f0d1a, 1);
    g.fillRect(8, 8, 32, 32);
    g.lineStyle(2, 0x3d2845, 1);
    g.strokeRect(8, 8, 32, 32);
    g.lineStyle(1, 0x5c4033, 0.4);
    g.strokeRect(14, 14, 20, 20);
    g.generateTexture('card_slot', 48, 48);
    g.destroy();
  }

  private createExitDoorTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x3d2a1f, 1);
    g.fillRect(6, 4, 36, 42);
    g.fillStyle(GameConfig.Colors.ACCENT, 1);
    g.fillRect(8, 6, 32, 38);
    g.lineStyle(2, 0x6b5bff, 1);
    g.strokeRect(10, 8, 28, 34);
    g.fillStyle(0xffd700, 1);
    g.fillCircle(32, 26, 3);
    g.lineStyle(2, 0x3d2a1f, 0.6);
    g.beginPath();
    g.moveTo(24, 8);
    g.lineTo(24, 42);
    g.strokePath();
    g.generateTexture('exit_door', 48, 48);
    g.destroy();
  }

  create(): void {
    this.scene.start('preload');
  }
}
