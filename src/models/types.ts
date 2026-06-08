export interface BookData {
  id: string;
  title: string;
  correctShelfId: string;
  currentShelfId: string;
  isMisplaced: boolean;
  row: number;
  col: number;
  category: string;
}

export interface ShelfData {
  id: string;
  label: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  reachable: boolean;
  requiresLadder: boolean;
}

export interface ClueData {
  id: string;
  type: 'borrowing_card' | 'shelf_label' | 'light_hint' | 'dust_trace' | 'misleading';
  description: string;
  relatedBookIds: string[];
  relatedShelfIds: string[];
  isMisleading: boolean;
  contradictionWith?: string;
}

export interface LevelData {
  id: string;
  chapter: number;
  title: string;
  description: string;
  shelves: ShelfData[];
  books: BookData[];
  clues: ClueData[];
  misplacedBookIds: string[];
  hasLadder: boolean;
  hasTimer: boolean;
  timeLimitSeconds: number;
  hintTier1: string;
  hintTier2: string;
  hintHighlightArea?: { shelfId: string; bookId: string };
  completionMessage: string;
}

export interface SaveData {
  currentChapter: number;
  currentLevelIndex: number;
  completedLevels: string[];
  inventory: InventoryItem[];
  discoveredClues: string[];
  markedSuspects: string[];
  wrongAttempts: number;
  totalWrongAttempts: number;
  timestamp: number;
}

export interface InventoryItem {
  id: string;
  type: 'borrowing_card' | 'flashlight' | 'ladder_key' | 'note';
  label: string;
  description: string;
  relatedClueIds: string[];
}
