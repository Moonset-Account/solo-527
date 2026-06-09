import Phaser from 'phaser';
import { GameEngine } from './GameEngine';
import { Vec2, LevelData, TileType, GameConfig } from '@/config/GameConfig';

interface EntitySprites {
  player: Phaser.GameObjects.Sprite | null;
  shelves: Map<string, Phaser.GameObjects.Sprite>;
  books: Map<string, Phaser.GameObjects.Sprite>;
  clues: Map<string, Phaser.GameObjects.Sprite>;
  cards: Map<string, Phaser.GameObjects.Sprite>;
}

interface TilemapGraphics {
  floor: Phaser.GameObjects.Group | null;
  walls: Phaser.GameObjects.Group | null;
  targets: Phaser.GameObjects.Group | null;
  slots: Phaser.GameObjects.Group | null;
  exit: Phaser.GameObjects.Sprite | null;
}

export class Renderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null;
  private tilemap: TilemapGraphics;
  private entities: EntitySprites;
  private toastText: Phaser.GameObjects.Text | null = null;
  private toastTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container | null = null) {
    this.scene = scene;
    this.container = container;
    this.tilemap = {
      floor: null,
      walls: null,
      targets: null,
      slots: null,
      exit: null,
    };
    this.entities = {
      player: null,
      shelves: new Map(),
      books: new Map(),
      clues: new Map(),
      cards: new Map(),
    };
  }

  renderTilemap(level: LevelData): void {
    this.clearTilemap();

    const floorGroup = this.scene.add.group();
    const wallGroup = this.scene.add.group();
    const targetGroup = this.scene.add.group();
    const slotGroup = this.scene.add.group();

    const grid = level.grid;
    const tileSize = GameConfig.TILE_SIZE;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const tile = grid[y][x];
        const worldX = x * tileSize + tileSize / 2;
        const worldY = y * tileSize + tileSize / 2;

        if (tile !== TileType.EMPTY) {
          const floorColor = (x + y) % 2 === 0 ? GameConfig.Colors.BG_FLOOR : GameConfig.Colors.BG_FLOOR_ALT;
          const floorRect = this.scene.add.rectangle(
            worldX,
            worldY,
            tileSize,
            tileSize,
            floorColor
          );
          floorGroup.add(floorRect);
          this.addToContainer(floorRect);

          if (tile === TileType.WALL) {
            const wallRect = this.scene.add.rectangle(
              worldX,
              worldY,
              tileSize - 4,
              tileSize - 4,
              GameConfig.Colors.WALL
            );
            wallRect.setStrokeStyle(2, GameConfig.Colors.SHADOW, 0.3);
            wallGroup.add(wallRect);
            this.addToContainer(wallRect);
          } else if (tile === TileType.TARGET_ZONE) {
            const targetRect = this.scene.add.rectangle(
              worldX,
              worldY,
              tileSize - 8,
              tileSize - 8,
              GameConfig.Colors.TARGET,
              0.35
            );
            targetRect.setStrokeStyle(3, GameConfig.Colors.TARGET, 0.8);
            targetGroup.add(targetRect);
            this.addToContainer(targetRect);
          } else if (tile === TileType.CARD_SLOT) {
            const slotRect = this.scene.add.rectangle(
              worldX,
              worldY,
              tileSize - 12,
              tileSize - 12,
              GameConfig.Colors.CARD,
              0.2
            );
            slotRect.setStrokeStyle(2, GameConfig.Colors.CARD, 0.6);
            slotGroup.add(slotRect);
            this.addToContainer(slotRect);
          } else if (tile === TileType.EXIT) {
            const exitRect = this.scene.add.rectangle(
              worldX,
              worldY,
              tileSize - 6,
              tileSize - 6,
              GameConfig.Colors.SUCCESS,
              0.4
            );
            exitRect.setStrokeStyle(3, GameConfig.Colors.SUCCESS, 0.9);
            this.tilemap.exit = exitRect as unknown as Phaser.GameObjects.Sprite;
            this.addToContainer(exitRect);

            const exitLabel = this.scene.add.text(
              worldX,
              worldY,
              'EXIT',
              {
                fontSize: '12px',
                color: '#6bff9a',
                fontStyle: 'bold',
              }
            );
            exitLabel.setOrigin(0.5);
            this.addToContainer(exitLabel);
          }
        }
      }
    }

    this.tilemap.floor = floorGroup;
    this.tilemap.walls = wallGroup;
    this.tilemap.targets = targetGroup;
    this.tilemap.slots = slotGroup;
  }

  renderEntities(engine: GameEngine): void {
    this.clearEntities();

    const tileSize = GameConfig.TILE_SIZE;

    for (const shelf of engine.shelves.values()) {
      const worldX = shelf.pos.x * tileSize + tileSize / 2;
      const worldY = shelf.pos.y * tileSize + tileSize / 2;

      const shelfRect = this.scene.add.rectangle(
        worldX,
        worldY,
        tileSize - 8,
        tileSize - 8,
        shelf.onTarget ? GameConfig.Colors.SUCCESS : GameConfig.Colors.SHELF
      );
      shelfRect.setStrokeStyle(3, GameConfig.Colors.SHELF_EDGE);

      const shelfSprite = shelfRect as unknown as Phaser.GameObjects.Sprite;
      this.entities.shelves.set(shelf.id, shelfSprite);
      this.addToContainer(shelfRect);

      const label = this.scene.add.text(
        worldX,
        worldY,
        '📚',
        { fontSize: '24px' }
      );
      label.setOrigin(0.5);
      this.addToContainer(label);
    }

    for (const book of engine.books.values()) {
      if (book.collected) continue;

      const worldX = book.pos.x * tileSize + tileSize / 2;
      const worldY = book.pos.y * tileSize + tileSize / 2;

      const bookRect = this.scene.add.rectangle(
        worldX,
        worldY,
        tileSize - 20,
        tileSize - 16,
        GameConfig.Colors.BOOK
      );
      bookRect.setStrokeStyle(2, 0x8b6914);

      const bookSprite = bookRect as unknown as Phaser.GameObjects.Sprite;
      this.entities.books.set(book.id, bookSprite);
      this.addToContainer(bookRect);

      this.scene.tweens.add({
        targets: bookRect,
        y: worldY - 4,
        duration: 600,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    for (const clue of engine.clues.values()) {
      if (clue.collected) continue;

      const worldX = clue.pos.x * tileSize + tileSize / 2;
      const worldY = clue.pos.y * tileSize + tileSize / 2;

      const clueCircle = this.scene.add.circle(
        worldX,
        worldY,
        (tileSize - 20) / 2,
        GameConfig.Colors.CLUE,
        0.7
      );
      clueCircle.setStrokeStyle(2, GameConfig.Colors.CLUE, 1);

      const clueSprite = clueCircle as unknown as Phaser.GameObjects.Sprite;
      this.entities.clues.set(clue.id, clueSprite);
      this.addToContainer(clueCircle);

      this.scene.tweens.add({
        targets: clueCircle,
        alpha: { from: 0.5, to: 1 },
        scale: { from: 0.9, to: 1.1 },
        duration: 700,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    for (const card of engine.cards.values()) {
      const worldX = card.pos.x * tileSize + tileSize / 2;
      const worldY = card.pos.y * tileSize + tileSize / 2;

      const cardRect = this.scene.add.rectangle(
        worldX,
        worldY,
        tileSize - 16,
        tileSize - 24,
        card.repaired ? GameConfig.Colors.SUCCESS : GameConfig.Colors.CARD
      );
      cardRect.setStrokeStyle(2, card.repaired ? GameConfig.Colors.SUCCESS : 0x9a8b6d);

      const cardSprite = cardRect as unknown as Phaser.GameObjects.Sprite;
      this.entities.cards.set(card.id, cardSprite);
      this.addToContainer(cardRect);

      if (!card.repaired) {
        this.scene.tweens.add({
          targets: cardRect,
          angle: { from: -3, to: 3 },
          duration: 900,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      }
    }

    const playerWorldX = engine.playerPos.x * tileSize + tileSize / 2;
    const playerWorldY = engine.playerPos.y * tileSize + tileSize / 2;

    const playerCircle = this.scene.add.circle(
      playerWorldX,
      playerWorldY,
      (tileSize - 14) / 2,
      GameConfig.Colors.PLAYER
    );
    playerCircle.setStrokeStyle(3, GameConfig.Colors.PLAYER_DARK);

    const playerSprite = playerCircle as unknown as Phaser.GameObjects.Sprite;
    this.entities.player = playerSprite;
    this.addToContainer(playerCircle);

    const playerInner = this.scene.add.circle(
      playerWorldX,
      playerWorldY,
      (tileSize - 14) / 4,
      GameConfig.Colors.PLAYER_DARK
    );
    this.addToContainer(playerInner);
  }

  animatePlayerMove(
    from: Vec2,
    to: Vec2,
    duration: number,
    onComplete?: () => void
  ): void {
    if (!this.entities.player) return;

    const tileSize = GameConfig.TILE_SIZE;
    const fromX = from.x * tileSize + tileSize / 2;
    const fromY = from.y * tileSize + tileSize / 2;
    const toX = to.x * tileSize + tileSize / 2;
    const toY = to.y * tileSize + tileSize / 2;

    this.scene.tweens.add({
      targets: this.entities.player,
      x: { from: fromX, to: toX },
      y: { from: fromY, to: toY },
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => onComplete?.(),
    });
  }

  animateShelfMove(
    from: Vec2,
    to: Vec2,
    duration: number,
    onComplete?: () => void
  ): void {
    const tileSize = GameConfig.TILE_SIZE;
    const fromX = from.x * tileSize + tileSize / 2;
    const fromY = from.y * tileSize + tileSize / 2;
    const toX = to.x * tileSize + tileSize / 2;
    const toY = to.y * tileSize + tileSize / 2;

    const targetShelf = Array.from(this.entities.shelves.values()).find(s => {
      const dx = Math.abs(s.x - fromX);
      const dy = Math.abs(s.y - fromY);
      return dx < 2 && dy < 2;
    });

    if (!targetShelf) {
      onComplete?.();
      return;
    }

    this.scene.tweens.add({
      targets: targetShelf,
      x: { from: fromX, to: toX },
      y: { from: fromY, to: toY },
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => onComplete?.(),
    });
  }

  animateCollect(
    worldX: number,
    worldY: number,
    type: string,
    onComplete?: () => void
  ): void {
    const color = this.getColorByType(type);

    const particles = this.scene.add.particles(worldX, worldY, undefined, {
      speed: { min: 50, max: 150 },
      scale: { start: 0.4, end: 0 },
      lifespan: 400,
      quantity: 12,
      tint: color,
      blendMode: 'ADD',
    });

    this.scene.time.delayedCall(450, () => {
      particles.destroy();
      onComplete?.();
    });

    const collectCircle = this.scene.add.circle(worldX, worldY, 20, color, 0.6);
    this.scene.tweens.add({
      targets: collectCircle,
      scale: { from: 1, to: 2.5 },
      alpha: { from: 0.6, to: 0 },
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => collectCircle.destroy(),
    });
  }

  showToast(
    text: string,
    color: number = GameConfig.Colors.TEXT,
    duration: number = 2000
  ): void {
    if (this.toastText) {
      this.toastText.destroy();
      if (this.toastTimer !== null) {
        this.scene.time.removeEvent(this.toastTimer);
      }
    }

    const centerX = GameConfig.CANVAS_WIDTH / 2;
    const centerY = 60;

    const bgRect = this.scene.add.rectangle(
      centerX,
      centerY,
      text.length * 14 + 40,
      44,
      0x0f0d1a,
      0.9
    );
    bgRect.setStrokeStyle(2, color, 0.6);

    this.toastText = this.scene.add.text(
      centerX,
      centerY,
      text,
      {
        fontSize: '16px',
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    this.toastText.setOrigin(0.5);
    this.addToContainer(bgRect);
    this.addToContainer(this.toastText);

    this.scene.tweens.add({
      targets: [bgRect, this.toastText],
      y: `-=20`,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Quad.easeOut',
    });

    this.toastTimer = this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({
        targets: [bgRect, this.toastText as Phaser.GameObjects.GameObject],
        y: `-=20`,
        alpha: { from: 1, to: 0 },
        duration: 300,
        ease: 'Quad.easeIn',
        onComplete: () => {
          bgRect.destroy();
          if (this.toastText) {
            this.toastText.destroy();
            this.toastText = null;
          }
        },
      });
      this.toastTimer = null;
    });
  }

  shakeBlocked(worldX: number, worldY: number): void {
    if (this.entities.player) {
      const originalX = this.entities.player.x;
      const originalY = this.entities.player.y;

      this.scene.tweens.add({
        targets: this.entities.player,
        x: {
          from: originalX,
          start: originalX - 6,
          to: originalX,
        },
        duration: 80,
        ease: 'Quad.easeInOut',
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          if (this.entities.player) {
            this.entities.player.x = originalX;
            this.entities.player.y = originalY;
          }
        },
      });
    }

    const shakeCircle = this.scene.add.circle(worldX, worldY, 16, GameConfig.Colors.DANGER, 0.4);
    this.scene.tweens.add({
      targets: shakeCircle,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 0.4, to: 0 },
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => shakeCircle.destroy(),
    });
  }

  clear(): void {
    this.clearTilemap();
    this.clearEntities();
    if (this.toastText) {
      this.toastText.destroy();
      this.toastText = null;
    }
    if (this.toastTimer !== null) {
      this.scene.time.removeEvent(this.toastTimer);
      this.toastTimer = null;
    }
  }

  private clearTilemap(): void {
    if (this.tilemap.floor) {
      this.tilemap.floor.destroy(true);
      this.tilemap.floor = null;
    }
    if (this.tilemap.walls) {
      this.tilemap.walls.destroy(true);
      this.tilemap.walls = null;
    }
    if (this.tilemap.targets) {
      this.tilemap.targets.destroy(true);
      this.tilemap.targets = null;
    }
    if (this.tilemap.slots) {
      this.tilemap.slots.destroy(true);
      this.tilemap.slots = null;
    }
    if (this.tilemap.exit) {
      this.tilemap.exit.destroy();
      this.tilemap.exit = null;
    }
  }

  private clearEntities(): void {
    if (this.entities.player) {
      this.entities.player.destroy();
      this.entities.player = null;
    }
    for (const sprite of this.entities.shelves.values()) {
      sprite.destroy();
    }
    this.entities.shelves.clear();
    for (const sprite of this.entities.books.values()) {
      sprite.destroy();
    }
    this.entities.books.clear();
    for (const sprite of this.entities.clues.values()) {
      sprite.destroy();
    }
    this.entities.clues.clear();
    for (const sprite of this.entities.cards.values()) {
      sprite.destroy();
    }
    this.entities.cards.clear();
  }

  private addToContainer(obj: Phaser.GameObjects.GameObject): void {
    if (this.container) {
      this.container.add(obj);
    }
  }

  private getColorByType(type: string): number {
    switch (type) {
      case 'clue':
        return GameConfig.Colors.CLUE;
      case 'card':
        return GameConfig.Colors.CARD;
      case 'book':
        return GameConfig.Colors.BOOK;
      case 'shelf':
        return GameConfig.Colors.SHELF;
      default:
        return GameConfig.Colors.ACCENT;
    }
  }

  getPlayerSprite(): Phaser.GameObjects.Sprite | null {
    return this.entities.player;
  }

  getShelfSprite(id: string): Phaser.GameObjects.Sprite | undefined {
    return this.entities.shelves.get(id);
  }

  getBookSprite(id: string): Phaser.GameObjects.Sprite | undefined {
    return this.entities.books.get(id);
  }

  getClueSprite(id: string): Phaser.GameObjects.Sprite | undefined {
    return this.entities.clues.get(id);
  }

  getCardSprite(id: string): Phaser.GameObjects.Sprite | undefined {
    return this.entities.cards.get(id);
  }
}
