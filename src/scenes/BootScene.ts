import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.generateTextures();
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  private generateTextures(): void {
    this.createBookTexture();
    this.createShelfTexture();
    this.createLadderTexture();
    this.createCardTexture();
    this.createButtonTexture();
    this.createPanelTexture();
    this.createHighlightTexture();
    this.createIconTexture('icon_flashlight', 0xfbbf24);
    this.createIconTexture('icon_card', 0x60a5fa);
    this.createIconTexture('icon_ladder', 0xa78bfa);
    this.createIconTexture('icon_note', 0xf472b6);
    this.createIconTexture('icon_mark', 0xef4444);
    this.createIconTexture('icon_hint', 0x34d399);
  }

  private createBookTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8b5e3c);
    g.fillRoundedRect(0, 0, 52, 70, 4);
    g.fillStyle(0xa0522d);
    g.fillRect(4, 4, 44, 62);
    g.lineStyle(1, 0xd4a574);
    g.strokeRoundedRect(0, 0, 52, 70, 4);
    g.generateTexture('book', 52, 70);
    g.destroy();
  }

  private createShelfTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x5c3d2e);
    g.fillRect(0, 0, 200, 300);
    g.lineStyle(2, 0x8b5e3c);
    g.strokeRect(0, 0, 200, 300);
    for (let i = 1; i < 4; i++) {
      g.lineStyle(2, 0x6b4430);
      g.beginPath();
      g.moveTo(0, i * 75);
      g.lineTo(200, i * 75);
      g.strokePath();
    }
    g.generateTexture('shelf', 200, 300);
    g.destroy();
  }

  private createLadderTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xd4a574);
    g.fillRect(0, 0, 60, 140);
    g.lineStyle(2, 0x8b5e3c);
    g.strokeRect(0, 0, 60, 140);
    for (let i = 1; i < 5; i++) {
      g.fillStyle(0xc49464);
      g.fillRect(5, i * 28, 50, 8);
    }
    g.generateTexture('ladder', 60, 140);
    g.destroy();
  }

  private createCardTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xf5f0e1);
    g.fillRoundedRect(0, 0, 80, 50, 4);
    g.lineStyle(1, 0xc9b896);
    g.strokeRoundedRect(0, 0, 80, 50, 4);
    g.generateTexture('card', 80, 50);
    g.destroy();
  }

  private createButtonTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x16213e);
    g.fillRoundedRect(0, 0, 180, 56, 10);
    g.lineStyle(2, 0x0f3460);
    g.strokeRoundedRect(0, 0, 180, 56, 10);
    g.generateTexture('button', 180, 56);
    g.destroy();

    const g2 = this.make.graphics({ x: 0, y: 0 });
    g2.fillStyle(0x0f3460);
    g2.fillRoundedRect(0, 0, 180, 56, 10);
    g2.lineStyle(2, 0x1a5276);
    g2.strokeRoundedRect(0, 0, 180, 56, 10);
    g2.generateTexture('button_hover', 180, 56);
    g2.destroy();
  }

  private createPanelTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x16213e, 0.95);
    g.fillRoundedRect(0, 0, 600, 400, 12);
    g.lineStyle(2, 0x0f3460);
    g.strokeRoundedRect(0, 0, 600, 400, 12);
    g.generateTexture('panel', 600, 400);
    g.destroy();
  }

  private createHighlightTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xfbbf24, 0.3);
    g.fillRoundedRect(0, 0, 210, 80, 6);
    g.lineStyle(2, 0xfbbf24, 0.6);
    g.strokeRoundedRect(0, 0, 210, 80, 6);
    g.generateTexture('highlight', 210, 80);
    g.destroy();
  }

  private createIconTexture(key: string, color: number): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color);
    g.fillCircle(16, 16, 14);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }
}
