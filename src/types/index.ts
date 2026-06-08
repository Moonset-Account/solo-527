export type EquipmentType =
  | 'beaker'
  | 'flask'
  | 'test_tube'
  | 'alcohol_lamp'
  | 'thermometer'
  | 'stirring_rod'
  | 'dropper'
  | 'graduated_cylinder'
  | 'petri_dish'
  | 'funnel'
  | 'filter_paper'
  | 'glass_rod'
  | 'crucible'
  | 'tripod'
  | 'wire_gauze';

export type ReactionEffect =
  | 'color_change'
  | 'bubble'
  | 'precipitate'
  | 'heat_release'
  | 'heat_absorb'
  | 'gas_release'
  | 'dissolve'
  | 'crystallize'
  | 'flammable';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  description: string;
  icon?: string;
  capacity?: number;
}

export interface Reagent {
  id: string;
  name: string;
  formula: string;
  category?: string;
  color: string;
  concentration?: number | string;
  dangerLevel?: number;
  description?: string;
  icon?: string;
}

export interface ReactionResult {
  id: string;
  name: string;
  description: string;
  color?: string;
  hasPrecipitate?: boolean;
  hasGas?: boolean;
}

export interface ErrorCondition {
  id: string;
  condition?: string;
  type?: string;
  message: string;
  safetyTip?: string;
  severity: 'warning' | 'error' | 'critical';
}

export interface StepAction {
  type: string;
  equipmentId?: string;
  reagentId?: string;
  amount?: number;
  duration?: number;
  observation?: string;
}

export interface ExpectedResult {
  effects?: string[];
  colorFrom?: string;
  colorTo?: string;
  description: string;
  duration: number;
}

export interface Step {
  id: string;
  order: number;
  instruction: string;
  action: StepAction;
  expectedResult?: ExpectedResult;
  errorConditions?: ErrorCondition[];
  hints?: string[];
  safetyNotes?: string[];
}

export interface KnowledgeCard {
  id: string;
  title: string;
  content?: string;
  equation?: string;
  formula?: string;
  principle?: string;
  safetyNote?: string;
  tags?: string[];
  frontContent?: string;
  backContent?: string;
}

export interface Reaction {
  id: string;
  reagentAId: string;
  reagentBId: string;
  results: ReactionResult[];
}

export interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  tags: string[];
  steps: Step[];
  equipment: Equipment[];
  reagents: Reagent[];
  errorConditions?: ErrorCondition[];
  knowledgeCards: KnowledgeCard[];
  reactions?: Reaction[];
  requiredAccuracy?: number;
  unlockCondition?: string;
}

export interface SafetyAlert {
  message: string;
  severity: 'warning' | 'error' | 'critical';
}

export interface AddedReagent {
  reagent: Reagent;
  amount: number;
  equipmentId: string;
}

export interface GameState {
  currentLevel: Level | null;
  currentStepIndex: number;
  temperature: number;
  isHeating: boolean;
  isStirring: boolean;
  isPaused: boolean;
  isComplete: boolean;
  isFailed: boolean;
  startTime: number;
  elapsedTime: number;
  accuracy: number;
  failureReason: string;
  placedEquipment: Equipment[];
  addedReagents: AddedReagent[];
  reactions: ReactionResult[];
  errors: ErrorCondition[];
  safetyAlerts: SafetyAlert[];
}

export interface GameProgress {
  stars: number;
  bestTime: number;
  completed: boolean;
}

export interface Settings {
  masterVolume: number;
  sfxVolume: number;
  bgmVolume: number;
  debugMode: boolean;
  showFps: boolean;
}

export interface DebugLogEntry {
  timestamp: number;
  action: string;
  details: string;
  state?: Record<string, unknown>;
}
