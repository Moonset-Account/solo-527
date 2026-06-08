export interface Item {
  id: string;
  name: string;
  description: string;
  imageKey: string;
  examinable: boolean;
  rotationAngle?: number;
  clues: string[];
  examineText?: string;
  backsideText?: string;
  backsideClue?: string;
}

export interface Clue {
  id: string;
  text: string;
  sourceItem: string;
  sourceRoom: string;
  chapter: string;
  timestamp: number;
  linkedClues: string[];
}

export interface ClueLink {
  from: string;
  to: string;
  label?: string;
}

export interface PuzzleState {
  id: string;
  type: 'lock' | 'code' | 'combination';
  solved: boolean;
  attempts: number;
  hintsUsed: number;
  currentInput: string | number[];
  solution: string | number[];
  failCount: number;
}

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'item' | 'examine' | 'door' | 'narrative';
  targetId: string;
  glowOnHover: boolean;
  label: string;
}

export interface NarrativeEvent {
  id: string;
  trigger: string;
  text: string;
  soundEffect?: string;
  delay: number;
}

export interface RoomConfig {
  id: string;
  name: string;
  backgroundStyle: string;
  hotspots: Hotspot[];
  ambientSound: string;
  items: string[];
  puzzles: string[];
  narrativeEvents: NarrativeEvent[];
  doors: DoorConfig[];
}

export interface DoorConfig {
  id: string;
  hotspotId: string;
  targetRoom: string;
  locked: boolean;
  lockPuzzleId?: string;
  label: string;
}

export interface ChapterConfig {
  id: string;
  title: string;
  subtitle: string;
  intro: string;
  rooms: RoomConfig[];
  newRule: string;
  difficulty: number;
  startRoom: string;
  hintPoints: number;
}

export interface PuzzleConfig {
  id: string;
  type: 'lock' | 'code' | 'combination';
  chapter: string;
  room: string;
  description: string;
  solution: string | number[];
  hints: string[];
  requiredClues: string[];
  narrativeOnSolve: string;
  maxAttempts: number;
}

export interface TutorialStep {
  id: string;
  type: 'move' | 'examine' | 'pickup' | 'notebook' | 'puzzle';
  instruction: string;
  highlightTarget?: string;
  completed: boolean;
}

export interface TutorialConfig {
  steps: TutorialStep[];
  room: RoomConfig;
}

export interface StepFailure {
  chapterId: string;
  roomId: string;
  stepId: string;
  failCount: number;
  lastFailAt: number;
}

export interface PuzzleRetry {
  puzzleId: string;
  retryCount: number;
  hintsBeforeSolve: number;
  timeSpent: number;
}

export interface ChapterTiming {
  chapterId: string;
  startTime: number;
  endTime: number | null;
  completionTime: number | null;
}

export interface PlayerAnalytics {
  sessionId: string;
  tutorialSkipped: boolean;
  tutorialCompletedAt: number | null;
  stepFailures: StepFailure[];
  puzzleRetries: PuzzleRetry[];
  totalHintsUsed: number;
  chapterTimings: ChapterTiming[];
  checkpointSaves: number;
}

export interface GameState {
  currentChapter: string;
  currentRoom: string;
  inventory: string[];
  notebook: Clue[];
  clueLinks: ClueLink[];
  puzzleStates: Record<string, PuzzleState>;
  hintPoints: number;
  chaptersUnlocked: string[];
  tutorialCompleted: boolean;
  tutorialSkipped: boolean;
  totalPlayTime: number;
  gamePhase: 'menu' | 'tutorial' | 'playing' | 'puzzle' | 'settlement' | 'transition';
  activePuzzleId: string | null;
  narrativeText: string | null;
  itemBeingExamined: string | null;
}

export interface SettlementData {
  chapterId: string;
  completionTime: number;
  retryCount: number;
  hintsUsed: number;
  cluesFound: number;
  totalClues: number;
  rating: 'S' | 'A' | 'B' | 'C';
}

export type SoundType = 'ambient' | 'interaction' | 'atmosphere' | 'music';

export interface SoundConfig {
  id: string;
  src: string;
  type: SoundType;
  volume: number;
  loop: boolean;
}
