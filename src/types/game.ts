export type InputMode = 'keyboard' | 'mouse' | 'touch';

export type StepAction = 'select_apparatus' | 'add_reagent' | 'control_temperature' | 'stir' | 'observe' | 'pour' | 'filter' | 'heat' | 'wait' | 'drop' | 'measure';

export interface Reagent {
  id: string;
  name: string;
  formula: string;
  concentration: string;
  color: string;
  state: 'liquid' | 'solid' | 'gas';
  dangerLevel: 0 | 1 | 2 | 3;
}

export interface Apparatus {
  id: string;
  name: string;
  type: 'beaker' | 'flask' | 'test_tube' | 'thermometer' | 'bunsen_burner' | 'dropper' | 'stirrer' | 'funnel' | 'graduated_cylinder';
  capacity?: number;
}

export interface ExperimentStep {
  id: string;
  order: number;
  description: string;
  action: StepAction;
  target: string;
  tolerance: number;
  hint: string;
  errorPrompt: string;
  safetyNote?: string;
}

export interface Experiment {
  id: string;
  title: string;
  steps: ExperimentStep[];
  requiredApparatus: string[];
  requiredReagents: string[];
  successCondition: string;
}

export interface KnowledgeCard {
  id: string;
  title: string;
  principle: string;
  safetyNote: string;
  realWorldApplication: string;
  relatedFormula?: string;
}

export interface Level {
  id: string;
  title: string;
  description: string;
  experimentId: string;
  knowledgeCardId: string;
  newRules: string[];
  timeLimit?: number;
  hintCount: number;
  order: number;
}

export interface KeyChoice {
  stepId: string;
  timestamp: number;
  choice: string;
  correct: boolean;
}

export interface PlayTracker {
  levelId: string;
  startTime: number;
  endTime: number;
  duration: number;
  failureCount: number;
  keyChoices: KeyChoice[];
  score: number;
  hintsUsed: number;
}

export interface SaveData {
  currentLevel: number;
  completedLevels: string[];
  trackers: PlayTracker[];
  totalPlayTime: number;
  totalFailures: number;
}

export interface SettingsData {
  inputMode: InputMode;
  musicVolume: number;
  sfxVolume: number;
}

export type GamePhase = 'menu' | 'tutorial' | 'playing' | 'paused' | 'success' | 'failed' | 'knowledge' | 'result';

export interface LabObject {
  id: string;
  type: 'apparatus' | 'reagent';
  refId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  placed: boolean;
}

export interface ReactionEffect {
  type: 'bubble' | 'color_change' | 'precipitate' | 'heat_glow' | 'steam' | 'smoke';
  x: number;
  y: number;
  duration: number;
  color?: string;
  intensity: number;
}

export interface AnimationState {
  id: string;
  progress: number;
  duration: number;
  easing: (t: number) => number;
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
}
