import Phaser from 'phaser';
import { Point, Direction, LevelConfig, BookData } from '@core/types';
import { eventBus, GameEvents } from '@core/EventBus';
import { gameState } from '@core/GameState';
import { PlayerEntity } from './PlayerEntity';
import { BookshelfEntity } from './BookshelfEntity';
import { ClueEntity } from './ClueEntity';
import { IndexCardEntity } from './IndexCardEntity';
import { TileMapRenderer } from './TileMapRenderer';
import { addPoints, pointsEqual } from '@core/utils';
import { configManager } from '@systems/ConfigManager';
import { audioSystem } from '@systems/AudioSystem';

export class GameController {
  private scene: Phaser.Scene;
  private level: LevelConfig;
  private tileSize: number;
  private animationDuration: number;

  public tileMap!: TileMapRenderer;
  public player!: PlayerEntity;
  public bookshelves: Map<string, BookshelfEntity> = new Map();
  public clues: Map<string, ClueEntity> = new Map();
  public indexCards: Map<string, IndexCardEntity> = new Map();

  private isProcessing: boolean = false;
  private pendingAction: boolean = false;
  private selectedShelf: BookshelfEntity | null = null;
  private carryingBook: BookData | null = null;
  private lastInteractAt: number = 0;

  constructor(scene: Phaser.Scene, level: LevelConfig) {
    this.scene = scene;
    this.level = level;
    this.tileSize = configManager.getTileSize();
    this.animationDuration = configManager.getAnimationDuration();
  }

  initialize(): void {
    gameState.initializeFromLevel(this.level);
    this.createTileMap();
    this.createPlayer();
    this.createBookshelves();
    this.createClues();
    this.createIndexCards();
  }

  private createTileMap(): void {
    this.tileMap = new TileMapRenderer(
      this.scene,
      this.level,
      this.tileSize,
      configManager.isShowGrid()
    );
  }

  private createPlayer(): void {
    this.player = new PlayerEntity(
      this.scene,
      this.level.playerStart,
      this.tileSize,
      this.animationDuration
    );
  }

  private createBookshelves(): void {
    this.bookshelves.clear();
    
    this.level.bookshelves.forEach(shelfData => {
      const entity = new BookshelfEntity(
        this.scene,
        shelfData,
        this.tileSize,
        this.animationDuration
      );
      this.bookshelves.set(shelfData.id, entity);

      const originalBook = this.level.books.find(b => b.currentShelfId === shelfData.id);
      if (originalBook) {
        entity.setBook(originalBook);
      }
    });
  }

  private createClues(): void {
    this.clues.clear();
    
    this.level.clues.forEach(clueData => {
      const entity = new ClueEntity(
        this.scene,
        clueData,
        this.tileSize
      );
      this.clues.set(clueData.id, entity);
    });
  }

  private createIndexCards(): void {
    this.indexCards.clear();
    
    this.level.indexCards.forEach(cardData => {
      const entity = new IndexCardEntity(
        this.scene,
        cardData,
        this.tileSize
      );
      this.indexCards.set(cardData.id, entity);
    });
  }

  update(time: number, delta: number): void {
    this.tileMap?.update(time, delta);
    this.clues.forEach(clue => clue.update(time));
    
    this.selectedShelf?.pulseHighlight();
  }

  handleMove(direction: Direction): boolean {
    if (this.isProcessing || this.player.isInMotion()) return false;

    const dirVec = this.getDirectionVector(direction);
    const currentPos = gameState.getPlayerPosition();
    const nextPos = addPoints(currentPos, dirVec);

    const nextTile = gameState.getTile(nextPos.x, nextPos.y);
    if (nextTile === 'wall' || nextTile === null) {
      this.player.bumpAnimation(direction);
      audioSystem.play('click', 0.15);
      return false;
    }

    const bookshelfAtTarget = this.findBookshelfAt(nextPos);
    if (bookshelfAtTarget) {
      return this.tryPushBookshelf(bookshelfAtTarget, dirVec, direction, currentPos);
    }

    gameState.saveToHistory();
    this.isProcessing = true;
    this.player.moveTo(nextPos, direction, () => {
      gameState.setPlayerPosition(nextPos, direction);
      this.isProcessing = false;
      this.afterMoveChecks(nextPos);
    });

    eventBus.emit(GameEvents.PLAYER_MOVE, { position: nextPos, direction });
    return true;
  }

  private tryPushBookshelf(
    shelf: BookshelfEntity,
    dirVec: Point,
    direction: Direction,
    playerCurrentPos: Point
  ): boolean {
    const behindShelfPos = addPoints(shelf.getGridPosition(), dirVec);

    if (!gameState.isPassable(behindShelfPos.x, behindShelfPos.y)) {
      this.player.bumpAnimation(direction);
      shelf.pulseHighlight();
      return false;
    }

    if (this.findBookshelfAt(behindShelfPos)) {
      this.player.bumpAnimation(direction);
      shelf.pulseHighlight();
      return false;
    }

    gameState.saveToHistory();
    this.isProcessing = true;

    this.player.pushAnimation();
    eventBus.emit(GameEvents.PLAYER_PUSH, { shelfId: shelf.getId() });

    const playerNextPos = addPoints(playerCurrentPos, dirVec);
    const playerOffset = {
      x: this.tileSize * 0.3 * dirVec.x,
      y: this.tileSize * 0.3 * dirVec.y
    };

    this.scene.tweens.add({
      targets: this.player.sprite,
      x: this.player.sprite.x + playerOffset.x,
      y: this.player.sprite.y + playerOffset.y,
      duration: this.animationDuration * 0.3,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        shelf.moveTo(behindShelfPos, () => {
          gameState.setBookshelfPosition(shelf.getId(), behindShelfPos);
          eventBus.emit(GameEvents.BOOKSHELF_MOVED, {
            id: shelf.getId(),
            position: behindShelfPos
          });

          this.player.moveTo(playerNextPos, direction, () => {
            gameState.setPlayerPosition(playerNextPos, direction);
            this.isProcessing = false;
            this.afterMoveChecks(playerNextPos);
          });
        });
      }
    });

    return true;
  }

  private afterMoveChecks(pos: Point): void {
    this.checkClueCollection(pos);
    this.checkIndexCardProximity(pos);
    this.checkShelfProximity(pos);
    this.checkWinCondition();
    this.checkFailCondition();
  }

  private checkClueCollection(pos: Point): void {
    for (const [id, clue] of this.clues) {
      if (clue.hasBeenCollected()) continue;
      const cluePos = clue.getPosition();
      if (pointsEqual(pos, cluePos) || this.isAdjacent(pos, cluePos)) {
        clue.collect(() => {
          const collected = gameState.collectClue(id);
          if (collected) {
            this.player.collectAnimation();
            this.showNotification(`收集到线索：${clue.getData().title}`, 'success');
          }
        });
        break;
      }
    }
  }

  private checkIndexCardProximity(pos: Point): void {}

  private checkShelfProximity(pos: Point): void {
    let nearest: BookshelfEntity | null = null;
    let nearestDist = Infinity;

    for (const shelf of this.bookshelves.values()) {
      const dist = this.manhattanDistance(pos, shelf.getGridPosition());
      if (dist <= 1 && dist < nearestDist) {
        nearest = shelf;
        nearestDist = dist;
      }
    }

    this.selectedShelf = nearest;
  }

  handleInteract(): boolean {
    const now = Date.now();
    if (now - this.lastInteractAt < 250) return false;
    this.lastInteractAt = now;

    const playerPos = gameState.getPlayerPosition();

    for (const [cardId, card] of this.indexCards) {
      const cardPos = card.getPosition();
      if (pointsEqual(playerPos, cardPos) || this.isAdjacent(playerPos, cardPos)) {
        return this.tryFixIndexCard(cardId);
      }
    }

    if (this.selectedShelf) {
      return this.tryShelfInteraction(this.selectedShelf);
    }

    return false;
  }

  private tryFixIndexCard(cardId: string): boolean {
    const card = this.indexCards.get(cardId);
    if (!card || card.isCardFixed()) return false;

    const required = card.getRequiredClueIds();
    const missing = required.filter(id => !gameState.isClueCollected(id));

    if (missing.length > 0) {
      card.shake();
      this.showNotification(`需要先收集相关线索（缺少${missing.length}个）`, 'warning');
      audioSystem.play('bookWrong');
      return false;
    }

    card.fix(() => {
      gameState.fixIndexCard(cardId);
      audioSystem.play('cardFix');
      this.showNotification(`索引卡已修复！关联书籍：${card.getData().bookId}`, 'success');
    });
    return true;
  }

  private tryShelfInteraction(shelf: BookshelfEntity): boolean {
    const data = shelf.getData();

    if (this.carryingBook) {
      if (shelf.hasBook()) {
        this.showNotification('书架上已经有书了！', 'warning');
        shelf.pulseHighlight();
        return false;
      }

      const book = this.carryingBook;
      const isCorrect = book.correctShelfId === shelf.getId();

      shelf.setBook(book);
      const placed = gameState.placeBookOnShelf(book.id, shelf.getId());

      if (placed) {
        this.showNotification(
          isCorrect ? `✓ ${book.name} 放置正确！` : `${book.name} 已放置，但位置不对...`,
          isCorrect ? 'success' : 'warning'
        );
        audioSystem.play(isCorrect ? 'bookCorrect' : 'bookWrong');
        if (isCorrect) shelf.flashCorrect();
        else shelf.flashWrong();
      }

      this.carryingBook = null;
      this.deselectAllShelfBooks();
      return true;
    } else {
      if (!shelf.hasBook()) {
        this.showNotification('这个书架是空的', 'info');
        return false;
      }

      const book = gameState.getBook(data.bookId!);
      if (!book) return false;

      this.carryingBook = book;
      shelf.setBook(undefined);
      this.showNotification(`拿起了《${book.name}》，去找它的正确位置吧`, 'info');
      audioSystem.play('bookPlace');
      return true;
    }
  }

  private deselectAllShelfBooks(): void {
    this.selectedShelf = null;
  }

  handleUndo(): boolean {
    if (!gameState.canUndo()) {
      this.showNotification('没有可撤销的操作', 'warning');
      return false;
    }

    const result = gameState.undo();
    if (result) {
      audioSystem.play('undo');
      this.syncVisualsFromState();
      this.showNotification('已撤销一步', 'info');
    }
    return result;
  }

  handleRestart(): void {
    audioSystem.play('restart');
    eventBus.emit(GameEvents.LEVEL_RESTART);
  }

  private syncVisualsFromState(): void {
    const state = gameState.getState();
    if (!state) return;

    state.bookshelfPositions.forEach(bp => {
      const shelf = this.bookshelves.get(bp.id);
      if (shelf && !shelf.isInMotion()) {
        shelf.container.setPosition(
          bp.position.x * this.tileSize + this.tileSize / 2,
          bp.position.y * this.tileSize + this.tileSize / 2
        );
      }
    });

    const worldPos = {
      x: state.playerPosition.x * this.tileSize + this.tileSize / 2,
      y: state.playerPosition.y * this.tileSize + this.tileSize / 2
    };
    this.player.sprite.setPosition(worldPos.x, worldPos.y);

    this.clues.forEach((clue, id) => {
      const collected = state.collectedClues.includes(id);
      if (collected && !clue.hasBeenCollected()) {
        clue.container.setVisible(false);
        (clue as any).isCollected = true;
      } else if (!collected && clue.hasBeenCollected()) {
        clue.container.setVisible(true);
        (clue as any).isCollected = false;
      }
    });

    this.indexCards.forEach((card, id) => {
      const fixed = state.fixedIndexCards.includes(id);
      if (fixed !== card.isCardFixed()) {
        if (fixed) (card as any).isFixed = true;
      }
    });

    if (this.carryingBook) {
      this.level.books.find(b => b.id === this.carryingBook!.id);
    }
  }

  private findBookshelfAt(pos: Point): BookshelfEntity | null {
    for (const shelf of this.bookshelves.values()) {
      if (pointsEqual(shelf.getGridPosition(), pos)) {
        return shelf;
      }
    }
    return null;
  }

  private getDirectionVector(dir: Direction): Point {
    const vectors: Record<Direction, Point> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    return vectors[dir];
  }

  private isAdjacent(a: Point, b: Point): boolean {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
  }

  private manhattanDistance(a: Point, b: Point): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private checkWinCondition(): boolean {
    return gameState.checkWinCondition();
  }

  private checkFailCondition(): { failed: boolean; reason?: string } {
    return gameState.checkFailCondition();
  }

  getCarryingBook(): BookData | null {
    return this.carryingBook;
  }

  private showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
    eventBus.emit(GameEvents.NOTIFICATION, {
      id: `notif_${Date.now()}`,
      message,
      type,
      duration: 2500
    });
  }

  destroy(): void {
    this.tileMap?.destroy();
    this.player?.destroy();
    this.bookshelves.forEach(s => s.destroy());
    this.clues.forEach(c => c.destroy());
    this.indexCards.forEach(c => c.destroy());
  }

  resizeTileSize(newSize: number): void {
    this.tileSize = newSize;
    this.tileMap?.updateTileSize(newSize);
    this.player?.updateTileSize(newSize);
    this.bookshelves.forEach(s => s.updateTileSize(newSize));
    this.clues.forEach(c => c.updateTileSize(newSize));
    this.indexCards.forEach(c => c.updateTileSize(newSize));
  }
}
