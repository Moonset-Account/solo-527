import { Vec2, Direction, LevelData, TileType, DIR_VECTORS } from '@/config/GameConfig';

interface ShelfData {
  pos: Vec2;
  id: string;
  targetZoneId?: string;
  onTarget: boolean;
}

interface BookData {
  pos: Vec2;
  id: string;
  category: string;
  title: string;
  isWrongPlace?: boolean;
  collected: boolean;
  sorted: boolean;
}

interface ClueData {
  pos: Vec2;
  id: string;
  text: string;
  collected: boolean;
}

interface CardData {
  pos: Vec2;
  id: string;
  category: string;
  repaired: boolean;
}

interface TargetZoneData {
  pos: Vec2;
  id: string;
  category?: string;
  filledBy?: string;
}

interface HistoryEntry {
  playerPos: Vec2;
  steps: number;
  shelves: Map<string, ShelfData>;
  books: Map<string, BookData>;
  clues: Map<string, ClueData>;
  cards: Map<string, CardData>;
  targetZones: Map<string, TargetZoneData>;
  moveRecord: MoveRecord;
}

interface MoveRecord {
  direction: Direction;
  pushedShelfId?: string;
  from: Vec2;
  to: Vec2;
  shelfFrom?: Vec2;
  shelfTo?: Vec2;
}

interface EngineListeners {
  onStateChange?: () => void;
  onMove?: (from: Vec2, to: Vec2, direction: Direction) => void;
  onPush?: (shelfId: string, from: Vec2, to: Vec2) => void;
  onClueCollect?: (clue: ClueData) => void;
  onCardRepair?: (card: CardData) => void;
  onBookSort?: (book: BookData) => void;
  onWin?: () => void;
  onFail?: () => void;
  onBlocked?: (pos: Vec2) => void;
}

const MAX_HISTORY = 50;

export type InteractResult =
  | { type: 'clue'; data: ClueData }
  | { type: 'card'; data: CardData }
  | { type: 'book'; data: BookData }
  | { type: 'exit'; data: null }
  | { type: null; data?: undefined };

export class GameEngine {
  level!: LevelData;
  playerPos: Vec2 = { x: 0, y: 0 };
  steps: number = 0;
  shelves: Map<string, ShelfData> = new Map();
  books: Map<string, BookData> = new Map();
  clues: Map<string, ClueData> = new Map();
  cards: Map<string, CardData> = new Map();
  targetZones: Map<string, TargetZoneData> = new Map();
  historyStack: HistoryEntry[] = [];
  moveHistory: MoveRecord[] = [];
  listeners: EngineListeners = {};

  loadLevel(level: LevelData): void {
    this.level = level;
    this.playerPos = { ...level.playerStart };
    this.steps = 0;
    this.shelves = new Map();
    this.books = new Map();
    this.clues = new Map();
    this.cards = new Map();
    this.targetZones = new Map();
    this.historyStack = [];
    this.moveHistory = [];

    for (const s of level.shelves) {
      this.shelves.set(s.id, {
        pos: { ...s.pos },
        id: s.id,
        targetZoneId: s.targetZoneId,
        onTarget: false,
      });
    }

    for (const b of level.books) {
      this.books.set(b.id, {
        pos: { ...b.pos },
        id: b.id,
        category: b.category,
        title: b.title,
        isWrongPlace: b.isWrongPlace,
        collected: false,
        sorted: false,
      });
    }

    for (const c of level.clues) {
      this.clues.set(c.id, {
        pos: { ...c.pos },
        id: c.id,
        text: c.text,
        collected: c.collected ?? false,
      });
    }

    for (const ic of level.indexCards) {
      this.cards.set(ic.id, {
        pos: { ...ic.pos },
        id: ic.id,
        category: ic.category,
        repaired: ic.repaired ?? false,
      });
    }

    for (const tz of level.targetZones) {
      this.targetZones.set(tz.id, {
        pos: { ...tz.pos },
        id: tz.id,
        category: tz.category,
        filledBy: undefined,
      });
    }

    this.checkShelvesOnTargets();
    this.listeners.onStateChange?.();
  }

  isWalkable(x: number, y: number): boolean {
    if (y < 0 || y >= this.level.grid.length) return false;
    if (x < 0 || x >= this.level.grid[y].length) return false;

    const tile = this.level.grid[y][x];
    if (tile === TileType.WALL || tile === TileType.EMPTY) return false;

    for (const shelf of this.shelves.values()) {
      if (shelf.pos.x === x && shelf.pos.y === y) return false;
    }

    return true;
  }

  move(direction: Direction): { success: boolean; pushed: boolean } {
    const dir = DIR_VECTORS[direction];
    const newX = this.playerPos.x + dir.dx;
    const newY = this.playerPos.y + dir.dy;
    const to: Vec2 = { x: newX, y: newY };
    const from: Vec2 = { ...this.playerPos };

    if (this.checkFail()) {
      this.listeners.onFail?.();
      return { success: false, pushed: false };
    }

    let pushedShelfId: string | undefined;
    let shelfFrom: Vec2 | undefined;
    let shelfTo: Vec2 | undefined;
    let pushed = false;

    const shelfAtTarget = this.getShelfAt(newX, newY);
    if (shelfAtTarget) {
      const pushX = newX + dir.dx;
      const pushY = newY + dir.dy;

      if (!this.isWalkable(pushX, pushY)) {
        this.listeners.onBlocked?.(to);
        return { success: false, pushed: false };
      }

      pushedShelfId = shelfAtTarget.id;
      shelfFrom = { ...shelfAtTarget.pos };
      shelfTo = { x: pushX, y: pushY };
      pushed = true;
    } else {
      if (!this.isWalkable(newX, newY)) {
        this.listeners.onBlocked?.(to);
        return { success: false, pushed: false };
      }
    }

    this.pushHistory({
      direction,
      pushedShelfId,
      from,
      to,
      shelfFrom,
      shelfTo,
    });

    if (pushed && shelfAtTarget && shelfTo) {
      shelfAtTarget.pos = shelfTo;
      this.listeners.onPush?.(pushedShelfId!, shelfFrom!, shelfTo);
    }

    this.playerPos = to;
    this.steps++;

    const moveRecord: MoveRecord = {
      direction,
      pushedShelfId,
      from,
      to,
      shelfFrom,
      shelfTo,
    };
    this.moveHistory.push(moveRecord);

    this.checkShelvesOnTargets();
    this.listeners.onMove?.(from, to, direction);
    this.listeners.onStateChange?.();

    if (this.checkWinCondition()) {
      this.listeners.onWin?.();
    } else if (this.checkFail()) {
      this.listeners.onFail?.();
    }

    return { success: true, pushed };
  }

  undo(): boolean {
    if (this.historyStack.length === 0) return false;

    const entry = this.historyStack.pop()!;

    this.playerPos = { ...entry.playerPos };
    this.steps = entry.steps;

    this.shelves = new Map();
    for (const [key, value] of entry.shelves.entries()) {
      this.shelves.set(key, { ...value, pos: { ...value.pos } });
    }

    this.books = new Map();
    for (const [key, value] of entry.books.entries()) {
      this.books.set(key, { ...value, pos: { ...value.pos } });
    }

    this.clues = new Map();
    for (const [key, value] of entry.clues.entries()) {
      this.clues.set(key, { ...value, pos: { ...value.pos } });
    }

    this.cards = new Map();
    for (const [key, value] of entry.cards.entries()) {
      this.cards.set(key, { ...value, pos: { ...value.pos } });
    }

    this.targetZones = new Map();
    for (const [key, value] of entry.targetZones.entries()) {
      this.targetZones.set(key, { ...value, pos: { ...value.pos } });
    }

    this.moveHistory.pop();
    this.listeners.onStateChange?.();

    return true;
  }

  checkShelvesOnTargets(): void {
    for (const tz of this.targetZones.values()) {
      tz.filledBy = undefined;
    }

    for (const shelf of this.shelves.values()) {
      let onTarget = false;
      for (const tz of this.targetZones.values()) {
        if (shelf.pos.x === tz.pos.x && shelf.pos.y === tz.pos.y) {
          const categoryMatch = !tz.category || !this.getShelfCategoryById(shelf.id) || tz.category === this.getShelfCategoryById(shelf.id);
          if (categoryMatch) {
            onTarget = true;
            tz.filledBy = shelf.id;
            break;
          }
        }
      }
      shelf.onTarget = onTarget;
    }
  }

  tryInteract(): InteractResult {
    const px = this.playerPos.x;
    const py = this.playerPos.y;

    for (const clue of this.clues.values()) {
      if (!clue.collected && clue.pos.x === px && clue.pos.y === py) {
        clue.collected = true;
        this.listeners.onClueCollect?.(clue);
        this.listeners.onStateChange?.();
        return { type: 'clue', data: clue };
      }
    }

    for (const card of this.cards.values()) {
      if (!card.repaired && card.pos.x === px && card.pos.y === py) {
        card.repaired = true;
        this.listeners.onCardRepair?.(card);
        this.listeners.onStateChange?.();
        return { type: 'card', data: card };
      }
    }

    for (const book of this.books.values()) {
      if (book.isWrongPlace && !book.collected && book.pos.x === px && book.pos.y === py) {
        book.collected = true;
        book.sorted = true;
        this.listeners.onBookSort?.(book);
        this.listeners.onStateChange?.();
        return { type: 'book', data: book };
      }
    }

    const tile = this.level.grid[py]?.[px];
    if (tile === TileType.EXIT && this.checkWinCondition()) {
      this.listeners.onWin?.();
      return { type: 'exit', data: null };
    }

    return { type: null };
  }

  checkWinCondition(): boolean {
    for (const shelf of this.shelves.values()) {
      if (shelf.targetZoneId && !shelf.onTarget) {
        return false;
      }
    }

    for (const book of this.books.values()) {
      if (book.isWrongPlace && !book.collected) {
        return false;
      }
    }

    for (const card of this.cards.values()) {
      if (!card.repaired) {
        return false;
      }
    }

    const tile = this.level.grid[this.playerPos.y]?.[this.playerPos.x];
    return tile === TileType.EXIT;
  }

  checkFail(): boolean {
    return this.steps >= this.level.maxSteps;
  }

  getState() {
    return {
      levelId: this.level.id,
      playerPos: { ...this.playerPos },
      steps: this.steps,
      maxSteps: this.level.maxSteps,
      shelves: Array.from(this.shelves.values()).map(s => ({ ...s, pos: { ...s.pos } })),
      books: Array.from(this.books.values()).map(b => ({ ...b, pos: { ...b.pos } })),
      clues: Array.from(this.clues.values()).map(c => ({ ...c, pos: { ...c.pos } })),
      cards: Array.from(this.cards.values()).map(c => ({ ...c, pos: { ...c.pos } })),
      targetZones: Array.from(this.targetZones.values()).map(t => ({ ...t, pos: { ...t.pos } })),
      moveHistory: [...this.moveHistory],
      canUndo: this.historyStack.length > 0,
      isWin: this.checkWinCondition(),
      isFail: this.checkFail(),
    };
  }

  private getShelfAt(x: number, y: number): ShelfData | undefined {
    for (const shelf of this.shelves.values()) {
      if (shelf.pos.x === x && shelf.pos.y === y) return shelf;
    }
    return undefined;
  }

  private getShelfCategoryById(_shelfId: string): string | undefined {
    const tz = this.level.targetZones.find(t => {
      const shelf = this.shelves.get(_shelfId);
      return shelf?.targetZoneId === t.id;
    });
    return tz?.category;
  }

  private cloneMap<K, V extends { pos: Vec2 }>(map: Map<K, V>): Map<K, V> {
    const result = new Map<K, V>();
    for (const [key, value] of map.entries()) {
      result.set(key, { ...value, pos: { ...value.pos } } as V);
    }
    return result;
  }

  private pushHistory(moveRecord: MoveRecord): void {
    const entry: HistoryEntry = {
      playerPos: { ...this.playerPos },
      steps: this.steps,
      shelves: this.cloneMap(this.shelves) as Map<string, ShelfData>,
      books: this.cloneMap(this.books) as Map<string, BookData>,
      clues: this.cloneMap(this.clues) as Map<string, ClueData>,
      cards: this.cloneMap(this.cards) as Map<string, CardData>,
      targetZones: this.cloneMap(this.targetZones) as Map<string, TargetZoneData>,
      moveRecord,
    };

    this.historyStack.push(entry);

    while (this.historyStack.length > MAX_HISTORY) {
      this.historyStack.shift();
    }
  }
}
