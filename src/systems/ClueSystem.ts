import { ClueData } from '@/types';
import { TILE_SIZE, COLORS } from '@/config/GameConfig';
import Phaser from 'phaser';

interface ClueState {
  data: ClueData;
  sprite: Phaser.GameObjects.Container;
  collected: boolean;
}

export class ClueSystem {
  private scene: Phaser.Scene;
  private clues: Map<string, ClueState> = new Map();
  private collectedCount: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  addClue(clueData: ClueData, worldX: number, worldY: number): void {
    const container = this.scene.add.container(worldX, worldY);
    const bg = this.scene.add.rectangle(0, 0, TILE_SIZE - 8, TILE_SIZE - 8, COLORS.clue, 0.8);
    const icon = this.scene.add.text(0, 0, '?', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    container.add([bg, icon]);
    this.clues.set(clueData.id, { data: clueData, sprite: container, collected: false });
  }

  tryCollect(gridX: number, gridY: number): ClueData | null {
    const offsetX = (this.scene.scale.width - 10 * TILE_SIZE) / 2;
    const offsetY = (this.scene.scale.height - 8 * TILE_SIZE) / 2;
    for (const [id, state] of this.clues) {
      if (state.collected) continue;
      const clueGX = Math.floor((state.sprite.x - offsetX) / TILE_SIZE);
      const clueGY = Math.floor((state.sprite.y - offsetY) / TILE_SIZE);
      if (clueGX === gridX && clueGY === gridY) {
        state.collected = true;
        this.collectedCount++;
        this.scene.tweens.add({
          targets: state.sprite,
          alpha: 0,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 300,
          onComplete: () => state.sprite.setVisible(false),
        });
        return state.data;
      }
    }
    return null;
  }

  getCollectedClues(): ClueData[] {
    const result: ClueData[] = [];
    for (const state of this.clues.values()) {
      if (state.collected) result.push(state.data);
    }
    return result;
  }

  getCollectedCount(): number { return this.collectedCount; }
  getTotalCount(): number { return this.clues.size; }

  clear(): void {
    this.clues.forEach(s => s.sprite.destroy());
    this.clues.clear();
    this.collectedCount = 0;
  }
}
