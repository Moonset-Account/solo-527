export namespace GameConfig {
  export const TILE_SIZE = 48;
  export const GRID_COLS = 12;
  export const GRID_ROWS = 10;

  export const CANVAS_WIDTH = TILE_SIZE * GRID_COLS;
  export const CANVAS_HEIGHT = TILE_SIZE * GRID_ROWS + 120;

  export const WORLD_WIDTH = TILE_SIZE * GRID_COLS;
  export const WORLD_HEIGHT = TILE_SIZE * GRID_ROWS;

  export const MOVE_DURATION = 180;
  export const PUSH_DURATION = 220;

  export namespace Colors {
    export const BG_NIGHT = 0x0f0d1a;
    export const BG_FLOOR = 0x1a1726;
    export const BG_FLOOR_ALT = 0x1f1c30;
    export const WALL = 0x2d2845;
    export const SHELF = 0x5c4033;
    export const SHELF_EDGE = 0x3d2a1f;
    export const PLAYER = 0x6bb7ff;
    export const PLAYER_DARK = 0x3d7ab8;
    export const BOOK = 0xd4a855;
    export const CLUE = 0x9ff0a0;
    export const TARGET = 0xffb347;
    export const CARD = 0xf0e6d2;
    export const TEXT = 0xe8e6f0;
    export const TEXT_DIM = 0x8a85a0;
    export const ACCENT = 0x8b7cff;
    export const DANGER = 0xff6b6b;
    export const SUCCESS = 0x6bff9a;
    export const SHADOW = 0x000000;
  }

  export namespace Audio {
    export const MASTER_VOLUME_DEFAULT = 0.6;
    export const SFX_VOLUME_DEFAULT = 0.8;
    export const MUSIC_VOLUME_DEFAULT = 0.4;
  }

  export namespace Storage {
    export const KEY_SAVE = 'bookstore_puzzle_save_v1';
    export const KEY_SETTINGS = 'bookstore_puzzle_settings_v1';
    export const KEY_ACHIEVEMENTS = 'bookstore_puzzle_ach_v1';
    export const KEY_LEADERBOARD = 'bookstore_puzzle_lb_v1';
    export const KEY_DAILY = 'bookstore_puzzle_daily_v1';
  }

  export const TOTAL_LEVELS = 5;
  export const DAILY_SEED_BASE = 20260101;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIR_VECTORS: Record<Direction, { dx: number; dy: number; angle: number }> = {
  up: { dx: 0, dy: -1, angle: -Math.PI / 2 },
  down: { dx: 0, dy: 1, angle: Math.PI / 2 },
  left: { dx: -1, dy: 0, angle: Math.PI },
  right: { dx: 1, dy: 0, angle: 0 },
};

export enum TileType {
  EMPTY = 0,
  FLOOR = 1,
  WALL = 2,
  TARGET_ZONE = 3,
  CARD_SLOT = 4,
  EXIT = 5,
}

export enum EntityType {
  PLAYER = 'player',
  SHELF = 'shelf',
  BOOK = 'book',
  CLUE = 'clue',
  INDEX_CARD = 'card',
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface LevelData {
  id: number;
  name: string;
  description: string;
  maxSteps: number;
  starThresholds: [number, number, number];
  grid: number[][];
  playerStart: Vec2;
  shelves: Array<{ pos: Vec2; id: string; targetZoneId?: string }>;
  books: Array<{ pos: Vec2; id: string; category: string; title: string; isWrongPlace?: boolean }>;
  clues: Array<{ pos: Vec2; id: string; text: string; collected?: boolean }>;
  indexCards: Array<{ pos: Vec2; id: string; category: string; repaired?: boolean }>;
  targetZones: Array<{ pos: Vec2; id: string; category?: string }>;
}
