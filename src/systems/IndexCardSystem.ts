import { TILE_SIZE, COLORS } from '@/config/GameConfig';
import Phaser from 'phaser';

interface IndexCard {
  gridX: number;
  gridY: number;
  sprite: Phaser.GameObjects.Container;
  fixed: boolean;
  requiredBookId: string;
}

export class IndexCardSystem {
  private scene: Phaser.Scene;
  private cards: Map<string, IndexCard> = new Map();
  private fixedCount: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  addCard(key: string, gridX: number, gridY: number, worldX: number, worldY: number, bookId: string): void {
    const container = this.scene.add.container(worldX, worldY);
    const bg = this.scene.add.rectangle(0, 0, TILE_SIZE - 4, TILE_SIZE - 4, COLORS.indexCard, 0.9);
    bg.setStrokeStyle(2, 0xfef3c7);
    const label = this.scene.add.text(0, 0, '📋', {
      fontSize: '18px',
    }).setOrigin(0.5);
    container.add([bg, label]);
    this.cards.set(key, { gridX, gridY, sprite: container, fixed: false, requiredBookId: bookId });
  }

  tryFix(gridX: number, gridY: number, bookId: string): boolean {
    for (const [key, card] of this.cards) {
      if (card.fixed) continue;
      if (card.gridX === gridX && card.gridY === gridY && card.requiredBookId === bookId) {
        card.fixed = true;
        this.fixedCount++;
        this.scene.tweens.add({
          targets: card.sprite,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 150,
          yoyo: true,
        });
        const bg = card.sprite.getAt(0) as Phaser.GameObjects.Rectangle;
        bg.setStrokeStyle(2, COLORS.success);
        return true;
      }
    }
    return false;
  }

  isAllFixed(): boolean {
    return this.cards.size > 0 && this.fixedCount >= this.cards.size;
  }

  getFixedCount(): number { return this.fixedCount; }
  getTotalCount(): number { return this.cards.size; }

  clear(): void {
    this.cards.forEach(c => c.sprite.destroy());
    this.cards.clear();
    this.fixedCount = 0;
  }
}
