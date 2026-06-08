export interface TileData {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'shelf_slot' | 'index_stand';
}

export interface EntityData {
  x: number;
  y: number;
  type: 'bookshelf' | 'book' | 'index_card' | 'clue_item';
  bookId?: string;
  targetX?: number;
  targetY?: number;
  isMisplaced?: boolean;
}

export interface ClueData {
  id: string;
  text: string;
  bookId: string;
  x: number;
  y: number;
}

export interface LevelData {
  id: string;
  name: string;
  width: number;
  height: number;
  maxSteps: number;
  difficulty: number;
  tiles: TileData[];
  entities: EntityData[];
  clues: ClueData[];
  playerStart: { x: number; y: number };
}

export interface LevelSave {
  levelId: string;
  completed: boolean;
  bestSteps: number;
  stars: number;
}

export interface SaveData {
  version: string;
  lastPlayedLevel: number;
  levels: Record<string, LevelSave>;
}

export interface SettingsData {
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  fullscreen: boolean;
}

export interface DebugLogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameResult = 'success' | 'failure';

export interface ResultData {
  result: GameResult;
  levelId: string;
  steps: number;
  maxSteps: number;
  stars: number;
  collectedClues: number;
  totalClues: number;
}
