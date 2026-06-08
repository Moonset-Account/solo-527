import type { ExperimentStep, StepStatus, LevelConfig } from './config';

export type GameStateType = 'loading' | 'ready' | 'running' | 'paused' | 'completed' | 'failed';

export interface ReagentInstance {
  id: string;
  reagentId: string;
  volume: number;
  concentration?: number;
  temperature: number;
  mixedWith?: string[];
}

export interface EquipmentInstance {
  id: string;
  equipmentId: string;
  x: number;
  y: number;
  rotation: number;
  contents: ReagentInstance[];
  temperature: number;
  isHeating: boolean;
  isStirring: boolean;
  stirringSpeed: number;
  heatLevel: number;
  clean: boolean;
  selected: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'bubble' | 'smoke' | 'spark' | 'glow' | 'precipitate';
  parentEquipmentId?: string;
}

export interface ActiveReaction {
  id: string;
  reactionId: string;
  equipmentId: string;
  progress: number;
  duration: number;
  startTime: number;
}

export interface ToastMessage {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'safety';
  title: string;
  message: string;
  duration: number;
  startTime: number;
}

export interface KnowledgePopup {
  cardId: string;
  title: string;
  content: string;
  category: string;
  visible: boolean;
}

export interface PerformanceStats {
  fps: number;
  frameTime: number;
  minFps: number;
  maxFps: number;
  avgFps: number;
  drawCalls: number;
  particles: number;
  memory: number;
}

export interface ExperimentState {
  state: GameStateType;
  levelId: string;
  levelConfig: LevelConfig | null;
  startTime: number;
  elapsedTime: number;
  pausedTime: number;
  score: number;
  currentStepIndex: number;
  stepsProgress: { stepId: string; status: StepStatus; score: number; startedAt: number; completedAt?: number; errors: number }[];
  equipment: EquipmentInstance[];
  selectedEquipmentId: string | null;
  draggingReagent: { reagentId: string; volume: number; x: number; y: number } | null;
  particles: Particle[];
  activeReactions: ActiveReaction[];
  toasts: ToastMessage[];
  knowledgePopup: KnowledgePopup | null;
  errors: number;
  safetyViolations: number;
  knowledgeViewed: string[];
}

export interface GameEvents {
  onStepComplete?: (step: ExperimentStep, score: number) => void;
  onStepError?: (step: ExperimentStep, error: string) => void;
  onReactionStart?: (reactionId: string, equipmentId: string) => void;
  onReactionComplete?: (reactionId: string, equipmentId: string) => void;
  onSafetyViolation?: (message: string) => void;
  onLevelComplete?: () => void;
  onLevelFailed?: (reason: string) => void;
  onKnowledgeTriggered?: (cardId: string) => void;
}
