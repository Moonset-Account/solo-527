export type HazardLevel = 'safe' | 'caution' | 'warning' | 'danger';
export type EquipmentType = 'beaker' | 'flask' | 'burette' | 'pipette' | 'thermometer' | 'burner' | 'stirrer';
export type InputDevice = 'keyboard' | 'mouse' | 'gamepad' | 'touch';
export type InputAction =
  | 'select' | 'cancel' | 'drag'
  | 'heat_up' | 'cool_down' | 'stir'
  | 'pour' | 'menu' | 'pause' | 'help';

export interface RenderParams {
  width: number;
  height: number;
  radius?: number;
}

export interface ReagentConfig {
  id: string;
  name: string;
  formula: string;
  color: string;
  glowColor?: string;
  density: number;
  toxicity: number;
  description: string;
  hazardLevel: HazardLevel;
  boilingPoint?: number;
  freezingPoint?: number;
}

export interface EquipmentConfig {
  id: string;
  name: string;
  type: EquipmentType;
  capacity: number;
  renderParams: RenderParams;
  heatable?: boolean;
  stirrable?: boolean;
  measurable?: boolean;
}

export type StepType = 'pour' | 'heat' | 'cool' | 'stir' | 'wait' | 'observe' | 'measure';
export type StepStatus = 'pending' | 'current' | 'completed' | 'failed' | 'skipped';

export interface ExperimentStep {
  id: string;
  type: StepType;
  title: string;
  description: string;
  targetEquipment?: string;
  targetReagent?: string;
  targetVolume?: number;
  targetTemperature?: number;
  tolerance?: number;
  duration?: number;
  maxScore: number;
  penaltyForError: number;
  triggersKnowledge?: string;
  hints?: string[];
  validations?: StepValidation[];
}

export interface StepValidation {
  type: 'volume_range' | 'temperature_range' | 'reagent_present' | 'equipment_clean' | 'duration_met';
  params: Record<string, number | string>;
}

export interface ReactionConfig {
  id: string;
  name: string;
  reactants: { reagentId: string; minAmount: number; maxAmount?: number }[];
  products: { reagentId: string; amount: number }[];
  temperatureRange?: { min: number; max: number };
  catalyst?: string;
  duration: number;
  visualEffect: 'precipitate' | 'gas' | 'color_change' | 'glow' | 'smoke' | 'heat' | 'explode_safe';
  effectColor?: string;
  exothermic?: number;
  endothermic?: number;
  description: string;
}

export interface KnowledgeCard {
  id: string;
  title: string;
  content: string;
  category: 'concept' | 'safety' | 'history' | 'application' | 'formula';
  triggerStep?: string;
  icon?: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  objective: string;
  timeLimit: number;
  maxScore: number;
  starThresholds: [number, number, number];
  availableReagents: string[];
  availableEquipment: string[];
  initialEquipmentPlacement: { equipmentId: string; x: number; y: number }[];
  steps: ExperimentStep[];
  reactions: ReactionConfig[];
  knowledgeCards: KnowledgeCard[];
  safetyNotes: string[];
  prerequisiteLevels?: string[];
}

export interface GraphicsSettings {
  particlesEnabled: boolean;
  fluidPrecision: 'low' | 'medium' | 'high';
  postProcessing: boolean;
  bloomIntensity: number;
  targetFPS: number;
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  bgmVolume: number;
  muted: boolean;
}

export interface InputBindings {
  device: InputDevice;
  bindings: Record<InputAction, string[]>;
}

export interface GameSettings {
  graphics: GraphicsSettings;
  audio: AudioSettings;
  inputs: Record<InputDevice, InputBindings>;
  currentInputDevice: InputDevice;
  showPerfStats: boolean;
  showHints: boolean;
  language: 'zh-CN';
}
