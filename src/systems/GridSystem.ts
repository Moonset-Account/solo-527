import { TILE_SIZE, COLORS } from '@/config/GameConfig';
import { LevelData, TileData } from '@/types';
import Phaser from 'phaser';

export class GridSystem {
  private scene: Phaser.Scene;
  private tiles: Map<string, TileData> = new Map();
  private tileSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private width: number = 0;
  private height: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  loadLevel(levelData: LevelData): void {
    this.clear();
    this.width = levelData.width;
    this.height = levelData.height;
    this.offsetX = (this.scene.scale.width - this.width * TILE_SIZE) / 2;
    this.offsetY = (this.scene.scale.height - this.height * TILE_SIZE) / 2;

    for (const tile of levelData.tiles) {
      const key = `${tile.x},${tile.y}`;
      this.tiles.set(key, tile);
      const color = this.getTileColor(tile.type);
      const sprite = this.scene.add.rectangle(
        this.offsetX + tile.x * TILE_SIZE + TILE_SIZE / 2,
        this.offsetY + tile.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE - 2,
        TILE_SIZE - 2,
        color
      );
      sprite.setStrokeStyle(1, 0x0a0a1a, 0.5);
      this.tileSprites.set(key, sprite);
    }
  }

  private getTileColor(type: string): number {
    switch (type) {
      case 'floor': return COLORS.floor;
      case 'wall': return COLORS.wall;
      case 'shelf_slot': return COLORS.shelfSlot;
      case 'index_stand': return COLORS.indexCard;
      default: return COLORS.floor;
    }
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.tiles.get(`${x},${y}`);
    return tile ? tile.type !== 'wall' : false;
  }

  isPushable(x: number, y: number): boolean {
    const tile = this.tiles.get(`${x},${y}`);
    return tile ? tile.type !== 'wall' : false;
  }

  getTileAt(x: number, y: number): TileData | undefined {
    return this.tiles.get(`${x},${y}`);
  }

  gridToWorld(gx: number, gy: number): { x: number; y: number } {
    return {
      x: this.offsetX + gx * TILE_SIZE + TILE_SIZE / 2,
      y: this.offsetY + gy * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  worldToGrid(wx: number, wy: number): { x: number; y: number } {
    return {
      x: Math.floor((wx - this.offsetX) / TILE_SIZE),
      y: Math.floor((wy - this.offsetY) / TILE_SIZE),
    };
  }

  getWidth(): number { return this.width; }
  getHeight(): number { return this.height; }
  getOffsetX(): number { return this.offsetX; }
  getOffsetY(): number { return this.offsetY; }

  clear(): void {
    this.tileSprites.forEach(s => s.destroy());
    this.tileSprites.clear();
    this.tiles.clear();
  }
}
