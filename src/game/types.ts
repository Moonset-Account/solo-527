export type ComponentType = 'battery' | 'resistor' | 'capacitor' | 'switch' | 'bulb';

export type ErrorType = 'short_circuit' | 'no_power' | 'wrong_component' | 'disconnected';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Port {
  id: string;
  componentId: string;
  localOffset: Vec2;
  position?: Vec2;
  label?: string;
}

export interface BatteryProps {
  type: 'battery';
  voltage: number;
}

export interface ResistorProps {
  type: 'resistor';
  resistance: number;
}

export interface CapacitorProps {
  type: 'capacitor';
  capacitance: number;
}

export interface SwitchProps {
  type: 'switch';
  closed: boolean;
}

export interface BulbProps {
  type: 'bulb';
  resistance: number;
  thresholdPower: number;
  powerThreshold?: number;
}

export type ComponentProperties =
  | BatteryProps
  | ResistorProps
  | CapacitorProps
  | SwitchProps
  | BulbProps;

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  position: Vec2;
  rotation: number;
  properties: ComponentProperties;
  ports: Port[];
}

export interface WireInstance {
  id: string;
  fromPortId: string;
  toPortId: string;
  fromPort?: string;
  toPort?: string;
  path?: Vec2[];
}

export interface ComponentState {
  voltage: number;
  current: number;
  power: number;
  lit?: boolean;
  closed?: boolean;
  charge?: number;
}

export interface SimulationResult {
  hasShortCircuit: boolean;
  shortCircuitPath?: string[];
  shortCircuitWires?: string[];
  nodeVoltages: Record<string, number>;
  wireCurrents: Record<string, number>;
  componentStates: Record<string, ComponentState>;
}

export type ObjectiveType =
  | 'bulb_lit'
  | 'all_switches_used'
  | 'component_count'
  | 'no_short_circuit'
  | 'specific_bulbs_lit';

export interface Objective {
  id: string;
  type: ObjectiveType;
  params: Record<string, any>;
  description: string;
}

export interface StarCondition {
  stars: 1 | 2 | 3;
  condition: Objective;
}

export interface HintStep {
  id: string;
  step: number;
  text: string;
  highlightComponentIds?: string[];
}

export interface TutorialStep {
  id: string;
  step: number;
  title: string;
  description: string;
  action: string;
  highlightArea?: { x: number; y: number; w: number; h: number };
  highlightComponentIds?: string[];
}

export type Difficulty = 'tutorial' | 'easy' | 'medium' | 'hard';

export interface LevelConfig {
  id: string;
  order: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  prerequisites: string[];
  availableComponents: ComponentType[];
  preplacedComponents?: ComponentInstance[];
  fixedComponents?: string[];
  objectives: Objective[];
  starConditions: StarCondition[];
  hints: HintStep[];
  tutorialSteps?: TutorialStep[];
}

export interface FailureRecord {
  step: string;
  timestamp: number;
  errorType: ErrorType;
  circuitStateSnapshotId?: string;
}

export interface PlayerProgress {
  unlockedLevelIds: string[];
  levelStars: Record<string, 0 | 1 | 2 | 3>;
  levelBestTimes: Record<string, number>;
  tutorialCompleted: boolean;
  tutorialSkipped: boolean;
}

export interface PlayerAnalytics {
  totalPlayTime: number;
  levelsAttempted: Record<string, number>;
  levelFailures: Record<string, FailureRecord[]>;
  levelRetries: Record<string, number>;
  componentsPlaced: number;
  wiresDrawn: number;
  tutorialStepsSkipped: string[];
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  gridVisible: boolean;
  animationsEnabled: boolean;
  theme: 'light' | 'dark';
  autoSave: boolean;
  showTutorial: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  audioEnabled?: boolean;
  musicVolume?: number;
  sfxVolume?: number;
  tutorialEnabled?: boolean;
  autoSaveEnabled?: boolean;
}

export interface CircuitData {
  components: ComponentInstance[];
  wires: WireInstance[];
}

export interface SavedCircuit {
  id: string;
  name: string;
  levelId?: string;
  createdAt: number;
  thumbnail: string;
  circuit: CircuitData;
}

export interface SaveData {
  version: string;
  createdAt: number;
  updatedAt: number;
  settings: GameSettings;
  progress: PlayerProgress;
  analytics: PlayerAnalytics;
  savedCircuits: SavedCircuit[];
}

export interface SaveSystem {
  getData(): SaveData;
  load(): SaveData;
  save(data: SaveData): void;
  updateAnalytics(updater: (analytics: PlayerAnalytics) => void): SaveData;
  updateProgress(updater: (progress: PlayerProgress) => void): SaveData;
  updateSettings(settings: Partial<GameSettings>): SaveData;
}

export type ComponentCategoryKey = 'source' | 'passive' | 'active' | 'output';

export interface ComponentCategory {
  key: ComponentCategoryKey;
  label: string;
  icon: string;
}
