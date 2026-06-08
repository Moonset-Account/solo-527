export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export type TileType = 'floor' | 'wall' | 'bookshelf' | 'bookslot' | 'indexcard' | 'clue' | 'target' | 'door' | 'lamp';

export interface TileData {
  type: TileType;
  passable: boolean;
  pushable?: boolean;
  bookId?: string;
  targetBookId?: string;
  isOnTarget?: boolean;
  collected?: boolean;
  fixed?: boolean;
  bookColor?: number;
}

export interface BookData {
  id: string;
  name: string;
  category: string;
  color: number;
  correctShelfId: string;
  currentShelfId?: string;
  isPlaced: boolean;
}

export interface ClueData {
  id: string;
  title: string;
  description: string;
  position: Point;
  collected: boolean;
  hintForBook?: string;
}

export interface IndexCardData {
  id: string;
  position: Point;
  bookId: string;
  isFixed: boolean;
  requiredClueIds: string[];
}

export interface BookshelfData {
  id: string;
  position: Point;
  bookId?: string;
  isTarget: boolean;
  category?: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  maxSteps: number;
  timeLimit?: number;
  grid: TileType[][];
  playerStart: Point;
  bookshelves: BookshelfData[];
  books: BookData[];
  clues: ClueData[];
  indexCards: IndexCardData[];
  targetBooks: string[];
  recommendedSteps?: number;
}

export interface GameSettings {
  tileSize: number;
  moveSpeed: number;
  pushSpeed: number;
  animationDuration: number;
  sfxVolume: number;
  musicVolume: number;
  showFPS: boolean;
  showGrid: boolean;
  inputRemap: InputMapping;
  targetFPS: number;
}

export type InputAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'interact'
  | 'undo'
  | 'restart'
  | 'pause'
  | 'menu'
  | 'editorToggle';

export interface InputMapping {
  keyboard: Record<InputAction, string[]>;
  gamepad: Record<InputAction, number[]>;
}

export interface GameStateData {
  currentLevelId: string;
  playerPosition: Point;
  playerDirection: Direction;
  stepsTaken: number;
  timeElapsed: number;
  collectedClues: string[];
  fixedIndexCards: string[];
  placedBooks: { bookId: string; shelfId: string }[];
  bookshelfPositions: { id: string; position: Point }[];
  carryingBookId: string | null;
  isCompleted: boolean;
  failedReason?: string;
}

export interface SaveData {
  version: string;
  timestamp: number;
  settings: GameSettings;
  completedLevels: string[];
  currentLevelState?: GameStateData;
  levelProgress: Record<string, {
    bestSteps: number;
    bestTime: number;
    stars: number;
  }>;
  customLevels: LevelConfig[];
}

export interface PerformanceStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  memoryUsed: number;
  entities: number;
}

export interface NotificationData {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}
