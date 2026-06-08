import Phaser from 'phaser';
import { Point } from '@core/types';
import { COLORS } from '@config/constants';
import { gridToWorld } from '@core/utils';
import { gameState } from '@core/GameState';
import { BookshelfData, BookData } from '@core/types';

export class BookshelfEntity {
  public container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private shelfId: string;
  private data: BookshelfData;
  private tileSize: number;
  private graphics: Phaser.GameObjects.Graphics;
  private bookGraphics: Phaser.GameObjects.Graphics | null = null;
  private highlightGraphics: Phaser.GameObjects.Graphics;
  private categoryLabel: Phaser.GameObjects.Text | null = null;
  private isMoving: boolean = false;
  private targetGridPos: Point;
  private animationDuration: number;
  private categoryColorMap: Record<string, number> = {
    fiction: COLORS.bookshelf,
    history: 0x7a4a2a,
    science: 0x2a5a7a,
    art: 0x7a5a2a,
    literature: 0x5a3a5a,
    philosophy: 0x3a5a3a,
    mystery: 0x3a3a5a,
    romance: 0x7a3a5a,
    scifi: 0x2a5a6a,
    biography: 0x5a4a3a,
    cooking: 0x6a4a2a
  };

  constructor(
    scene: Phaser.Scene,
    data: BookshelfData,
    tileSize: number,
    animationDuration: number
  ) {
    this.scene = scene;
    this.data = { ...data };
    this.shelfId = data.id;
    this.tileSize = tileSize;
    this.animationDuration = animationDuration;
    this.targetGridPos = { ...data.position };

    const worldPos = gridToWorld(data.position.x, data.position.y, tileSize);

    this.container = scene.add.container(worldPos.x, worldPos.y);
    this.container.setDepth(50);

    this.graphics = scene.add.graphics();
    this.highlightGraphics = scene.add.graphics();
    
    this.drawShelf();
    this.drawHighlight();
    this.addCategoryLabel();

    this.container.add([this.graphics, this.highlightGraphics]);

    if (this.categoryLabel) {
      this.container.add(this.categoryLabel);
    }

    if (data.bookId) {
      this.addBookVisual(gameState.getBook(data.bookId));
    }
  }

  private drawShelf(): void {
    this.graphics.clear();
    const s = this.tileSize;
    const padding = s * 0.08;

    let color = this.categoryColorMap[this.data.category || 'fiction'];
    let darkColor = Phaser.Display.Color.IntegerToColor(color);
    darkColor.darken(30);

    this.graphics.fillStyle(darkColor.color32, 1);
    this.graphics.fillRoundedRect(-s / 2 + padding, -s / 2 + padding, s - padding * 2, s - padding * 2, s * 0.08);

    this.graphics.fillStyle(color, 1);
    this.graphics.fillRoundedRect(-s / 2 + padding * 1.5, -s / 2 + padding * 1.5, s - padding * 3, s - padding * 3, s * 0.06);

    const shelfCount = 3;
    const shelfHeight = (s - padding * 4) / shelfCount;
    this.graphics.fillStyle(darkColor.color32, 0.6);
    for (let i = 1; i < shelfCount; i++) {
      const y = -s / 2 + padding * 2 + i * shelfHeight;
      this.graphics.fillRect(-s / 2 + padding * 2, y, s - padding * 4, s * 0.04);
    }

    this.graphics.lineStyle(s * 0.04, darkColor.color32, 0.8);
    this.graphics.strokeRoundedRect(-s / 2 + padding, -s / 2 + padding, s - padding * 2, s - padding * 2, s * 0.08);
  }

  private drawHighlight(): void {
    this.highlightGraphics.clear();

    if (this.data.isTarget) {
      const s = this.tileSize;
      const t = this.scene.time.now / 500;
      const glow = (Math.sin(t) * 0.3 + 0.7);

      this.highlightGraphics.lineStyle(s * 0.05, COLORS.bookCorrect, glow);
      this.highlightGraphics.strokeRoundedRect(
        -s / 2 + s * 0.04, -s / 2 + s * 0.04, s - s * 0.08, s - s * 0.08, s * 0.1);

      const markerSize = s * 0.1;
      this.highlightGraphics.fillStyle(COLORS.bookCorrect, glow * 0.8);
      this.highlightGraphics.fillTriangle(
        0, -s / 2 + s * 0.02,
        -markerSize / 2, -s / 2 + s * 0.12,
        markerSize / 2, -s / 2 + s * 0.12
      );
    }
  }

  private addCategoryLabel(): void {
    if (!this.data.category) return;
    
    const fontSize = Math.max(10, Math.floor(this.tileSize * 0.22));
    
    this.categoryLabel = this.scene.add.text(0, this.tileSize * 0.38,
      this.data.category.toUpperCase().slice(0, 3),
      {
        fontFamily: 'monospace',
        fontSize: `${fontSize}px`,
        color: '#e8e8f0'
      }
    );
    this.categoryLabel.setOrigin(0.5).setAlpha(0.85);
  }

  public addBookVisual(book: BookData | undefined): void {
    if (!book) return;
    
    this.removeBookVisual();

    this.bookGraphics = this.scene.add.graphics();
    const s = this.tileSize;
    const padding = s * 0.15;
    const bookCount = 1;
    const bookWidth = (s - padding * 3) / bookCount;
    const bookHeight = s * 0.2;

    const b = this.bookGraphics;

    b.fillStyle(book.color, 1);
    b.fillRoundedRect(-s / 2 + padding * 2 + bookWidth * 0, -s * 0.1, bookWidth * 0.9, bookHeight, bookHeight * 0.3);

    b.fillStyle(Phaser.Display.Color.IntegerToColor(book.color).darken(20).color32, 1);
    b.fillRect(-s / 2 + padding * 2 + bookWidth * 0, -s * 0.1, bookWidth * 0.15, bookHeight);

    if (gameState.isBookCorrectlyPlaced(book.id)) {
      b.lineStyle(s * 0.03, COLORS.success, 1);
      b.strokeRoundedRect(-s / 2 + padding * 2 + bookWidth * 0, -s * 0.1, bookWidth * 0.9, bookHeight, bookHeight * 0.3);
    }

    this.container.add(this.bookGraphics);
  }

  public removeBookVisual(): void {
    if (this.bookGraphics) {
      this.container.remove(this.bookGraphics);
      this.bookGraphics.destroy();
      this.bookGraphics = null;
    }
  }

  public moveTo(gridPos: Point, onComplete?: () => void): void {
    if (this.isMoving) return;

    this.isMoving = true;
    this.targetGridPos = { ...gridPos };
    const worldPos = gridToWorld(gridPos.x, gridPos.y, this.tileSize);

    this.scene.tweens.add({
      targets: this.container,
      x: worldPos.x,
      y: worldPos.y,
      duration: this.animationDuration * 1.3,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.isMoving = false;
        this.data.position = { ...gridPos };
        onComplete?.();
      }
    });

    this.scene.cameras.main.shake(this.animationDuration * 0.4, 0.002);
  }

  public pulseHighlight(): void {
    this.scene.tweens.add({
      targets: this.container,
      scale: 1.05,
      duration: this.animationDuration / 2,
      ease: 'Sine.easeInOut',
      yoyo: true
    });
  }

  public flashCorrect(): void {
    const flash = this.scene.add.graphics();
    const s = this.tileSize;
    flash.fillStyle(COLORS.success, 0.6);
    flash.fillRect(-s / 2, -s / 2, s, s);
    this.container.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.container.remove(flash);
        flash.destroy();
      }
    });
  }

  public flashWrong(): void {
    const flash = this.scene.add.graphics();
    const s = this.tileSize;
    flash.fillStyle(COLORS.error, 0.6);
    flash.fillRect(-s / 2, -s / 2, s, s);
    this.container.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 0.9,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.container.remove(flash);
        flash.destroy();
      }
    });
  }

  public getId(): string {
    return this.shelfId;
  }

  public getGridPosition(): Point {
    return { ...this.targetGridPos };
  }

  public getData(): BookshelfData {
    return { ...this.data };
  }

  public setBook(book: BookData | undefined): void {
    if (book) {
      this.addBookVisual(book);
      this.data.bookId = book.id;
    } else {
      this.removeBookVisual();
      this.data.bookId = undefined;
    }
  }

  public hasBook(): boolean {
    return !!this.data.bookId;
  }

  public getBookId(): string | undefined {
    return this.data.bookId;
  }

  public isInMotion(): boolean {
    return this.isMoving;
  }

  public update(time: number): void {
    if (this.data.isTarget) {
      this.drawHighlight();
    }
  }

  public destroy(): void {
    this.container.destroy();
  }

  public updateTileSize(newTileSize: number): void {
    this.tileSize = newTileSize;
    this.drawShelf();
    this.drawHighlight();

    if (this.categoryLabel) {
      this.categoryLabel.setFontSize(Math.max(10, Math.floor(this.tileSize * 0.22)));
      this.categoryLabel.setY(this.tileSize * 0.38);
    }

    const worldPos = gridToWorld(this.targetGridPos.x, this.targetGridPos.y, this.tileSize);
    this.container.setPosition(worldPos.x, worldPos.y);

    if (this.data.bookId) {
      const book = gameState.getBook(this.data.bookId);
      this.addBookVisual(book);
    }
  }
}
