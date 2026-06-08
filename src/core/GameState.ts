import { GameStateData, LevelConfig, Point, Direction, TileType, BookshelfData, BookData, ClueData, IndexCardData } from './types';
import { eventBus, GameEvents } from './EventBus';
import { deepClone } from './utils';

export class GameState {
  private static instance: GameState;
  private state: GameStateData | null = null;
  private levelConfig: LevelConfig | null = null;
  private gridState: TileType[][] | null = null;
  private bookshelfStates: Map<string, Point> = new Map();
  private bookStates: Map<string, { shelfId: string | null; placed: boolean }> = new Map();
  private clueStates: Map<string, boolean> = new Map();
  private indexCardStates: Map<string, boolean> = new Map();
  private actionHistory: GameStateData[] = [];
  private maxHistorySize = 100;

  private constructor() {}

  static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  initializeFromLevel(level: LevelConfig): void {
    this.levelConfig = deepClone(level);
    this.gridState = level.grid.map(row => [...row]);

    this.levelConfig.bookshelves.forEach(shelf => {
      if (shelf.bookId) {
        const book = this.levelConfig!.books.find(b => b.id === shelf.bookId);
        if (book && !book.currentShelfId) {
          book.currentShelfId = shelf.id;
          book.isPlaced = true;
        }
      }
    });

    this.levelConfig.books.forEach(book => {
      if (book.currentShelfId) {
        const shelf = this.levelConfig!.bookshelves.find(s => s.id === book.currentShelfId);
        if (shelf && !shelf.bookId) {
          shelf.bookId = book.id;
        }
        book.isPlaced = true;
      }
    });
    
    this.bookshelfStates.clear();
    this.levelConfig.bookshelves.forEach(shelf => {
      this.bookshelfStates.set(shelf.id, { ...shelf.position });
    });

    this.bookStates.clear();
    this.levelConfig.books.forEach(book => {
      this.bookStates.set(book.id, {
        shelfId: book.currentShelfId || null,
        placed: book.isPlaced
      });
    });

    this.clueStates.clear();
    this.levelConfig.clues.forEach(clue => {
      this.clueStates.set(clue.id, false);
    });

    this.indexCardStates.clear();
    this.levelConfig.indexCards.forEach(card => {
      this.indexCardStates.set(card.id, false);
    });

    this.actionHistory = [];

    this.state = {
      currentLevelId: level.id,
      playerPosition: { ...level.playerStart },
      playerDirection: 'down',
      stepsTaken: 0,
      timeElapsed: 0,
      collectedClues: [],
      fixedIndexCards: [],
      placedBooks: this.levelConfig.books
        .filter(b => b.currentShelfId)
        .map(b => ({ bookId: b.id, shelfId: b.currentShelfId! })),
      bookshelfPositions: this.levelConfig.bookshelves.map(s => ({
        id: s.id,
        position: { ...s.position }
      })),
      isCompleted: false
    };

    eventBus.emit(GameEvents.LEVEL_START, level);
  }

  getState(): GameStateData | null {
    return this.state;
  }

  getLevelConfig(): LevelConfig | null {
    return this.levelConfig;
  }

  getGrid(): TileType[][] | null {
    return this.gridState;
  }

  getTile(x: number, y: number): TileType | null {
    if (!this.gridState) return null;
    if (y < 0 || y >= this.gridState.length) return null;
    if (x < 0 || x >= this.gridState[y].length) return null;
    return this.gridState[y][x];
  }

  isPassable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (tile === null) return false;
    if (tile === 'wall') return false;
    return true;
  }

  getBookshelfAt(x: number, y: number): BookshelfData | undefined {
    if (!this.levelConfig) return undefined;
    const shelfId = this.getBookshelfIdAt(x, y);
    if (!shelfId) return undefined;
    return this.levelConfig.bookshelves.find(s => s.id === shelfId);
  }

  getBookshelfIdAt(x: number, y: number): string | null {
    for (const [id, pos] of this.bookshelfStates.entries()) {
      if (pos.x === x && pos.y === y) {
        return id;
      }
    }
    return null;
  }

  getBookshelfPosition(shelfId: string): Point | null {
    return this.bookshelfStates.get(shelfId) || null;
  }

  setBookshelfPosition(shelfId: string, pos: Point): void {
    this.bookshelfStates.set(shelfId, { ...pos });
    if (this.state) {
      const idx = this.state.bookshelfPositions.findIndex(b => b.id === shelfId);
      if (idx >= 0) {
        this.state.bookshelfPositions[idx].position = { ...pos };
      }
    }
  }

  getBook(bookId: string): BookData | undefined {
    return this.levelConfig?.books.find(b => b.id === bookId);
  }

  getBookShelfForBook(bookId: string): string | null {
    return this.bookStates.get(bookId)?.shelfId || null;
  }

  placeBookOnShelf(bookId: string, shelfId: string): boolean {
    const book = this.getBook(bookId);
    const shelf = this.levelConfig?.bookshelves.find(s => s.id === shelfId);
    if (!book || !shelf) return false;

    const prevShelf = this.levelConfig?.bookshelves.find(s => s.bookId === bookId);
    if (prevShelf && prevShelf.id !== shelfId) {
      prevShelf.bookId = undefined;
    }

    shelf.bookId = bookId;
    book.currentShelfId = shelfId;
    this.bookStates.set(bookId, { shelfId, placed: true });
    if (this.state) {
      this.state.placedBooks = this.state.placedBooks.filter(pb => pb.bookId !== bookId);
      this.state.placedBooks.push({ bookId, shelfId });
    }
    eventBus.emit(GameEvents.BOOK_PLACED, { bookId, shelfId });
    return true;
  }

  removeBookFromShelf(bookId: string): boolean {
    const book = this.getBook(bookId);
    const state = this.bookStates.get(bookId);
    if (!book || !state || !state.shelfId) return false;

    const shelf = this.levelConfig?.bookshelves.find(s => s.id === state.shelfId);
    if (shelf) {
      shelf.bookId = undefined;
    }

    book.currentShelfId = undefined;
    book.isPlaced = false;
    this.bookStates.set(bookId, { shelfId: null, placed: false });
    if (this.state) {
      this.state.placedBooks = this.state.placedBooks.filter(pb => pb.bookId !== bookId);
    }
    eventBus.emit(GameEvents.BOOK_REMOVED, { bookId });
    return true;
  }

  isBookCorrectlyPlaced(bookId: string): boolean {
    const book = this.getBook(bookId);
    const state = this.bookStates.get(bookId);
    if (!book || !state || !state.shelfId) return false;
    return book.correctShelfId === state.shelfId;
  }

  collectClue(clueId: string): boolean {
    if (this.clueStates.get(clueId)) return false;
    this.clueStates.set(clueId, true);
    if (this.state) {
      this.state.collectedClues.push(clueId);
    }
    eventBus.emit(GameEvents.CLUE_COLLECTED, clueId);
    return true;
  }

  isClueCollected(clueId: string): boolean {
    return this.clueStates.get(clueId) || false;
  }

  fixIndexCard(cardId: string): boolean {
    if (this.indexCardStates.get(cardId)) return false;
    this.indexCardStates.set(cardId, true);
    if (this.state) {
      this.state.fixedIndexCards.push(cardId);
    }
    eventBus.emit(GameEvents.INDEXCARD_FIXED, cardId);
    return true;
  }

  isIndexCardFixed(cardId: string): boolean {
    return this.indexCardStates.get(cardId) || false;
  }

  getClueAt(x: number, y: number): ClueData | undefined {
    return this.levelConfig?.clues.find(c => c.position.x === x && c.position.y === y);
  }

  getIndexCardAt(x: number, y: number): IndexCardData | undefined {
    return this.levelConfig?.indexCards.find(c => c.position.x === x && c.position.y === y);
  }

  setPlayerPosition(pos: Point, direction: Direction): void {
    if (this.state) {
      this.state.playerPosition = { ...pos };
      this.state.playerDirection = direction;
      this.state.stepsTaken++;
      eventBus.emit(GameEvents.PLAYER_MOVE, { position: pos, direction });
    }
  }

  getPlayerPosition(): Point {
    return this.state?.playerPosition || { x: 0, y: 0 };
  }

  getPlayerDirection(): Direction {
    return this.state?.playerDirection || 'down';
  }

  getStepsTaken(): number {
    return this.state?.stepsTaken || 0;
  }

  getTimeElapsed(): number {
    return this.state?.timeElapsed || 0;
  }

  updateTime(delta: number): void {
    if (this.state) {
      this.state.timeElapsed += delta;
    }
  }

  saveToHistory(): void {
    if (!this.state) return;
    this.actionHistory.push(deepClone(this.state));
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
    }
  }

  undo(): boolean {
    if (this.actionHistory.length === 0) return false;
    const previous = this.actionHistory.pop()!;
    
    if (this.state) {
      this.state = deepClone(previous);
      previous.bookshelfPositions.forEach(bp => {
        this.bookshelfStates.set(bp.id, { ...bp.position });
      });
      if (this.levelConfig) {
        this.levelConfig.clues.forEach(c => {
          this.clueStates.set(c.id, previous.collectedClues.includes(c.id));
        });
        this.levelConfig.indexCards.forEach(c => {
          this.indexCardStates.set(c.id, previous.fixedIndexCards.includes(c.id));
        });
        this.levelConfig.books.forEach(b => {
          const placed = previous.placedBooks.find(pb => pb.bookId === b.id);
          this.bookStates.set(b.id, {
            shelfId: placed?.shelfId || null,
            placed: !!placed
          });
        });
      }
    }
    eventBus.emit(GameEvents.UNDO_ACTION);
    return true;
  }

  canUndo(): boolean {
    return this.actionHistory.length > 0;
  }

  checkWinCondition(): boolean {
    if (!this.levelConfig || !this.state) return false;
    
    const targetBooks = this.levelConfig.targetBooks;
    const allCorrect = targetBooks.every(bookId => this.isBookCorrectlyPlaced(bookId));
    
    if (allCorrect) {
      this.state.isCompleted = true;
      eventBus.emit(GameEvents.GAME_WIN, {
        steps: this.state.stepsTaken,
        time: this.state.timeElapsed
      });
      return true;
    }
    return false;
  }

  checkFailCondition(): { failed: boolean; reason?: string } {
    if (!this.levelConfig || !this.state) return { failed: false };
    
    if (this.state.stepsTaken >= this.levelConfig.maxSteps) {
      const reason = '步数已用尽！';
      this.state.failedReason = reason;
      eventBus.emit(GameEvents.GAME_FAIL, { reason });
      return { failed: true, reason };
    }

    if (this.levelConfig.timeLimit && this.state.timeElapsed >= this.levelConfig.timeLimit) {
      const reason = '时间已用尽！';
      this.state.failedReason = reason;
      eventBus.emit(GameEvents.GAME_FAIL, { reason });
      return { failed: true, reason };
    }

    return { failed: false };
  }

  getRemainingSteps(): number {
    if (!this.levelConfig) return 0;
    return Math.max(0, this.levelConfig.maxSteps - this.getStepsTaken());
  }

  getProgress(): {
    clues: { total: number; collected: number };
    cards: { total: number; fixed: number };
    books: { total: number; correct: number; placed: number };
  } {
    if (!this.levelConfig) {
      return {
        clues: { total: 0, collected: 0 },
        cards: { total: 0, fixed: 0 },
        books: { total: 0, correct: 0, placed: 0 }
      };
    }

    const clues = this.levelConfig.clues.length;
    const collectedClues = this.state?.collectedClues.length || 0;
    
    const cards = this.levelConfig.indexCards.length;
    const fixedCards = this.state?.fixedIndexCards.length || 0;
    
    const books = this.levelConfig.targetBooks.length;
    const correctBooks = this.levelConfig.targetBooks.filter(id => this.isBookCorrectlyPlaced(id)).length;
    const placedBooks = this.levelConfig.targetBooks.filter(id => {
      const state = this.bookStates.get(id);
      return state?.placed;
    }).length;

    return {
      clues: { total: clues, collected: collectedClues },
      cards: { total: cards, fixed: fixedCards },
      books: { total: books, correct: correctBooks, placed: placedBooks }
    };
  }
}

export const gameState = GameState.getInstance();
