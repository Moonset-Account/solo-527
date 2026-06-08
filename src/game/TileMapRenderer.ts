import Phaser from 'phaser';
import { LevelConfig, TileType, Point } from '@core/types';
import { COLORS } from '@config/constants';
import { gridToWorld } from '@core/utils';

export class TileMapRenderer {
  private scene: Phaser.Scene;
  private level: LevelConfig;
  private tileSize: number;
  private tileGraphics: Phaser.GameObjects.Graphics;
  private wallGraphics: Phaser.GameObjects.Graphics;
  private gridLines: Phaser.GameObjects.Graphics | null = null;
  private lampLights: Phaser.GameObjects.Graphics;
  private showGrid: boolean;
  private decorElements: Phaser.GameObjects.Group;

  constructor(
    scene: Phaser.Scene,
    level: LevelConfig,
    tileSize: number,
    showGrid: boolean = false
  ) {
    this.scene = scene;
    this.level = level;
    this.tileSize = tileSize;
    this.showGrid = showGrid;

    this.tileGraphics = scene.add.graphics();
    this.tileGraphics.setDepth(0);

    this.wallGraphics = scene.add.graphics();
    this.wallGraphics.setDepth(5);

    this.lampLights = scene.add.graphics();
    this.lampLights.setDepth(2);

    this.decorElements = scene.add.group();

    this.drawFloor();
    this.drawWalls();
    this.drawDecor();
    this.drawLamps();

    if (this.showGrid) {
      this.drawGridLines();
    }
  }

  private drawFloor(): void {
    const { width, height, grid } = this.level;
    const s = this.tileSize;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = grid[y][x];
        
        if (tile === 'wall') continue;

        const wx = x * s;
        const wy = y * s;
        const isAlt = (x + y) % 2 === 0;

        this.tileGraphics.fillStyle(isAlt ? COLORS.floor : COLORS.floorAlt, 1);
        this.tileGraphics.fillRect(wx, wy, s, s);

        this.tileGraphics.lineStyle(1, COLORS.wallDark, 0.15);
        this.tileGraphics.strokeRect(wx + 0.5, wy + 0.5, s - 1, s - 1);
      }
    }
  }

  private drawWalls(): void {
    const { width, height, grid } = this.level;
    const s = this.tileSize;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] !== 'wall') continue;

        const wx = x * s;
        const wy = y * s;

        this.wallGraphics.fillStyle(COLORS.wall, 1);
        this.wallGraphics.fillRect(wx, wy, s, s);

        this.wallGraphics.fillStyle(COLORS.wallDark, 0.35);
        this.wallGraphics.fillRect(wx, wy, s, s * 0.25);

        this.wallGraphics.lineStyle(s * 0.06, COLORS.wallDark, 0.6);
        this.wallGraphics.lineBetween(wx, wy + s, wx + s, wy);
        this.wallGraphics.lineBetween(wx + s, wy + s, wx + s, wy);

        const brickH = s * 0.5;
        this.wallGraphics.lineStyle(1, COLORS.wallDark, 0.4);
        this.wallGraphics.lineBetween(wx, wy + brickH, wx + s, wy + brickH);
        this.wallGraphics.lineBetween(wx + s * 0.5, wy + brickH, wx + s * 0.5, wy + s);
      }
    }
  }

  private drawGridLines(): void {
    const { width, height } = this.level;
    const s = this.tileSize;

    if (this.gridLines) this.gridLines.clear();
    else this.gridLines = this.scene.add.graphics();

    this.gridLines.setDepth(3);
    this.gridLines.setAlpha(0.3);

    this.gridLines.lineStyle(1, COLORS.gridLine, 0.6);

    for (let x = 0; x <= width; x++) {
      this.gridLines.lineBetween(x * s, 0, x * s, height * s);
    }
    for (let y = 0; y <= height; y++) {
      this.gridLines.lineBetween(0, y * s, width * s, y * s);
    }
  }

  private drawDecor(): void {
    const { width, height, grid } = this.level;
    const s = this.tileSize;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] !== 'floor') continue;
        
        const edgeWall = this.isNearWall(x, y);
        if (edgeWall && Math.random() < 0.04) {
          this.addFloorDecor(x * s + s / 2, y * s + s / 2);
        }
      }
    }
  }

  private isNearWall(x: number, y: number): boolean {
    const grid = this.level.grid;
    return grid[y - 1]?.[x] === 'wall' ||
      grid[y + 1]?.[x] === 'wall' ||
      grid[y]?.[x - 1] === 'wall' ||
      grid[y]?.[x + 1] === 'wall';
  }

  private addFloorDecor(cx: number, cy: number): void {
    const s = this.tileSize;
    const kind = Math.floor(Math.random() * 4);

    const g = this.scene.add.graphics();
    g.setDepth(1);

    switch (kind) {
      case 0:
        g.fillStyle(COLORS.wallDark, 0.4);
        g.fillCircle(cx - s * 0.2, cy - s * 0.15, s * 0.03);
        g.fillCircle(cx + s * 0.1, cy + s * 0.1, s * 0.02);
        g.fillCircle(cx - s * 0.05, cy + s * 0.25, s * 0.025);
        break;
      case 1:
        g.fillStyle(0x8B7355, 0.3);
        g.fillRoundedRect(cx - s * 0.15, cy - s * 0.1, s * 0.3, s * 0.2, s * 0.03);
        break;
      case 2:
        g.fillRect(cx - s * 0.08, cy - s * 0.08, s * 0.16, s * 0.16);
        break;
      case 3:
        g.fillStyle(COLORS.clueGlow, 0.08);
        g.fillCircle(cx, cy, s * 0.15);
        break;
    }

    this.decorElements.add(g);
  }

  private drawLamps(): void {
    const { width, height, grid } = this.level;
    const s = this.tileSize;

    const corners: Array<[number, number]> = [[2, 2], [width - 3, 2], [2, height - 3], [width - 3, height - 3]];
    for (const [lx, ly] of corners) {
      if (grid[ly]?.[lx] === 'floor') {
        this.addLamp(lx * s + s / 2, ly * s + s / 2);
      }
    }
  }

  private addLamp(cx: number, cy: number): void {
    const s = this.tileSize;
    const lamp = this.scene.add.graphics();
    lamp.setDepth(2);

    lamp.fillStyle(0x3d3d5c, 1);
    lamp.fillCircle(cx, cy, s * 0.1);

    lamp.fillStyle(COLORS.warning, 0.15);
    lamp.fillCircle(cx, cy, s * 0.6);

    this.lampLights.fillStyle(COLORS.warning, 0.06);
    this.lampLights.fillCircle(cx, cy, s * 0.9);

    lamp.fillStyle(0xffeebb, 0.9);
    lamp.fillCircle(cx, cy, s * 0.04);

    this.scene.tweens.add({
      targets: lamp,
      alpha: 0.9,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    this.decorElements.add(lamp);
  }

  public toggleGrid(show: boolean): void {
    this.showGrid = show;
    if (show && !this.gridLines) {
      this.drawGridLines();
    } else if (this.gridLines) {
      this.gridLines.setVisible(show);
    }
  }

  public update(time: number, delta: number): void {
    const { width, height } = this.level;
    const s = this.tileSize;
    const t = time / 1000;

    this.lampLights.clear();

    const corners: Array<[number, number]> = [[2, 2], [width - 3, 2], [2, height - 3], [width - 3, height - 3]];
    
    corners.forEach(([lx, ly], i) => {
      const cx = lx * s + s / 2;
      const cy = ly * s + s / 2;
      const pulse = 0.05 + Math.sin(t * 2 + i) * 0.01;
      this.lampLights.fillStyle(COLORS.warning, pulse);
      this.lampLights.fillCircle(cx, cy, s * 0.9);
    });
  }

  public isWalkable(x: number, y: number): boolean {
    const grid = this.level.grid;
    if (y < 0 || y >= grid.length) return false;
    if (x < 0 || x >= grid[y].length) return false;
    return grid[y][x] !== 'wall';
  }

  public getWorldSize(): { width: number; height: number } {
    return {
      width: this.level.width * this.tileSize,
      height: this.level.height * this.tileSize
    };
  }

  public destroy(): void {
    this.tileGraphics.destroy();
    this.wallGraphics.destroy();
    this.lampLights.destroy();
    this.gridLines?.destroy();
    this.decorElements.destroy(true);
  }

  public updateTileSize(newTileSize: number): void {
    this.tileSize = newTileSize;
    this.tileGraphics.clear();
    this.wallGraphics.clear();
    this.lampLights.clear();
    this.decorElements.clear(true);
    this.gridLines?.destroy();
    this.gridLines = null;

    this.drawFloor();
    this.drawWalls();
    this.drawLamps();
    this.drawDecor();
    
    if (this.showGrid) {
      this.drawGridLines();
    }
  }
}
