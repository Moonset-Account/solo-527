import { Direction, EntityData } from '@/types';
import { GridSystem } from './GridSystem';
import { TILE_SIZE } from '@/config/GameConfig';
import Phaser from 'phaser';

interface PushableEntity {
  data: EntityData;
  sprite: Phaser.GameObjects.Container;
  gridX: number;
  gridY: number;
}

export class PushSystem {
  private scene: Phaser.Scene;
  private grid: GridSystem;
  private pushables: Map<string, PushableEntity> = new Map();

  constructor(scene: Phaser.Scene, grid: GridSystem) {
    this.scene = scene;
    this.grid = grid;
  }

  addPushable(key: string, data: EntityData, sprite: Phaser.GameObjects.Container): void {
    this.pushables.set(key, { data, sprite, gridX: data.x, gridY: data.y });
  }

  canPush(key: string, direction: Direction): boolean {
    const entity = this.pushables.get(key);
    if (!entity) return false;
    const { newX, newY } = this.getNewPos(entity.gridX, entity.gridY, direction);
    if (!this.grid.isPushable(newX, newY)) return false;
    for (const [otherKey, other] of this.pushables) {
      if (otherKey === key) continue;
      if (other.gridX === newX && other.gridY === newY) return false;
    }
    return true;
  }

  push(key: string, direction: Direction): boolean {
    if (!this.canPush(key, direction)) return false;
    const entity = this.pushables.get(key)!;
    const { newX, newY } = this.getNewPos(entity.gridX, entity.gridY, direction);
    entity.gridX = newX;
    entity.gridY = newY;
    const worldPos = this.grid.gridToWorld(newX, newY);
    this.scene.tweens.add({
      targets: entity.sprite,
      x: worldPos.x,
      y: worldPos.y,
      duration: 120,
      ease: 'Power1',
    });
    return true;
  }

  getEntityAt(gx: number, gy: number): string | null {
    for (const [key, entity] of this.pushables) {
      if (entity.gridX === gx && entity.gridY === gy) return key;
    }
    return null;
  }

  getEntityGridPos(key: string): { x: number; y: number } | null {
    const entity = this.pushables.get(key);
    return entity ? { x: entity.gridX, y: entity.gridY } : null;
  }

  isAt(key: string, tx: number, ty: number): boolean {
    const entity = this.pushables.get(key);
    return entity ? entity.gridX === tx && entity.gridY === ty : false;
  }

  clear(): void {
    this.pushables.clear();
  }

  private getNewPos(x: number, y: number, dir: Direction): { newX: number; newY: number } {
    switch (dir) {
      case 'up': return { newX: x, newY: y - 1 };
      case 'down': return { newX: x, newY: y + 1 };
      case 'left': return { newX: x - 1, newY: y };
      case 'right': return { newX: x + 1, newY: y };
    }
  }
}
