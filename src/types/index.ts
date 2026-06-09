export type LightPhase =
  | 'NS_GREEN'
  | 'NS_YELLOW'
  | 'EW_GREEN'
  | 'EW_YELLOW'
  | 'ALL_RED';

export interface PhaseConfig {
  nsGreen: number;
  ewGreen: number;
  yellow: number;
  allRed: number;
  busPriority: boolean;
  busThreshold: number;
}

export interface TrafficLightState {
  currentPhase: LightPhase;
  phaseTimer: number;
  totalCycle: number;
  busOverride: boolean;
  nsIntensity: number;
  ewIntensity: number;
}

export type VehicleType = 'car' | 'bus' | 'taxi';
export type Direction = 'N' | 'S' | 'E' | 'W';

export interface Vehicle {
  id: string;
  type: VehicleType;
  position: { x: number; z: number };
  rotation: number;
  speed: number;
  maxSpeed: number;
  laneId: string;
  route: Direction[];
  routeIndex: number;
  waitingTime: number;
  isBus: boolean;
  busRouteId?: string;
  color: string;
  progress: number;
  laneProgress: number;
  stopped: boolean;
  atIntersection: boolean;
}

export interface Lane {
  id: string;
  from: Direction;
  to: Direction;
  direction: Direction;
  position: { x: number; z: number };
  length: number;
  queue: Vehicle[];
  maxQueue: number;
}

export interface Intersection {
  id: string;
  position: { x: number; z: number };
  size: number;
  lanes: Map<string, Lane>;
  trafficLight: TrafficLightState;
  queueLength: Record<string, number>;
  busQueue: number;
}

export interface Road {
  id: string;
  from: { x: number; z: number };
  to: { x: number; z: number };
  lanes: number;
  direction: 'H' | 'V';
}

export interface RoadNetworkConfig {
  intersections: Array<{
    id: string;
    position: { x: number; z: number };
    size: number;
  }>;
  roads: Road[];
}

export interface MetricsSnapshot {
  timestamp: number;
  congestionIndex: number;
  avgWaitingTime: number;
  avgSpeed: number;
  busOnTimeRate: number;
  throughput: number;
  queueLengths: Record<string, number>;
  vehicleCount: number;
  busCount: number;
}

export interface SimulationFrame {
  time: number;
  vehicles: Array<{
    id: string;
    position: { x: number; z: number };
    rotation: number;
    color: string;
    type: VehicleType;
  }>;
  lightStates: Record<string, TrafficLightState>;
  metrics: MetricsSnapshot;
}

export type TargetConditionType =
  | 'congestion_below'
  | 'avg_wait_below'
  | 'bus_on_time_above'
  | 'throughput_above';

export interface TargetCondition {
  type: TargetConditionType;
  value: number;
  description: string;
}

export interface NewRuleIntroduction {
  ruleId: string;
  title: string;
  description: string;
  uiHighlight: string;
}

export interface SpawnPattern {
  time: number;
  duration: number;
  rate: number;
  directionBias: Record<Direction, number>;
  busRate: number;
  taxiRate: number;
}

export interface TutorialStepConfig {
  id: number;
  title: string;
  description: string;
  targetSelector?: string;
  highlightElement?: string;
  action?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  difficulty: 0 | 1 | 2 | 3 | 4 | 5;
  unlockRequirement: string | null;
  roadNetwork: RoadNetworkConfig;
  spawnPatterns: SpawnPattern[];
  duration: number;
  targetConditions: TargetCondition[];
  newRules: NewRuleIntroduction[];
  tutorialSteps?: TutorialStepConfig[];
  initialPhaseConfig: PhaseConfig;
}

export interface LevelRecord {
  completed: boolean;
  bestScore: number;
  bestMetrics: MetricsSnapshot | null;
  attempts: number;
  failures: number;
  lastPlayedAt: number;
  failureReasons: string[];
}

export interface PlayerStatistics {
  tutorialCompleted: boolean;
  tutorialSkipped: boolean;
  totalPlayTime: number;
  levels: Record<string, LevelRecord>;
}

export interface ReplayData {
  id: string;
  levelId: string;
  timingConfig: PhaseConfig;
  frames: SimulationFrame[];
  finalMetrics: MetricsSnapshot;
  timestamp: number;
  duration: number;
}

export interface SaveData {
  version: number;
  playerId: string;
  statistics: PlayerStatistics;
  currentLevel: string;
  replays: ReplayData[];
  sandboxSettings: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export type GameStatus =
  | 'idle'
  | 'tutorial'
  | 'playing'
  | 'paused'
  | 'simulating'
  | 'replaying'
  | 'success'
  | 'failed';

export interface GameState {
  status: GameStatus;
  currentLevelId: string | null;
  phaseConfig: PhaseConfig;
  timeElapsed: number;
  speedScale: number;
  attemptCount: number;
  tutorialStep: number;
  failureReason: string | null;
}

export type GameEvents = {
  'game:start': { levelId: string };
  'game:end': { success: boolean; score: number; metrics: MetricsSnapshot };
  'game:pause': void;
  'game:resume': void;
  'game:reset': void;
  'level:complete': { levelId: string; score: number; metrics: MetricsSnapshot };
  'level:fail': { levelId: string; reason: string; attempt: number };
  'level:select': { levelId: string };
  'tutorial:step': { stepId: number; skipped: boolean };
  'tutorial:complete': { skipped: boolean };
  'tutorial:skip': void;
  'timing:change': { config: PhaseConfig };
  'timing:apply': { config: PhaseConfig };
  'bus:priority': { enabled: boolean; threshold: number };
  'replay:capture': { frameData: SimulationFrame };
  'replay:start': { replayId: string };
  'replay:seek': { time: number };
  'replay:end': void;
  'replay:compare': { enabled: boolean; replayId?: string };
  'simulation:tick': { delta: number; metrics: MetricsSnapshot };
  'simulation:start': void;
  'simulation:end': void;
  'save:update': { data: SaveData };
  'save:loaded': { data: SaveData | null };
  'ui:toast': { message: string; type: 'info' | 'success' | 'warning' | 'error' };
};

export type BusRouteStop = {
  position: { x: number; z: number };
  stopDuration: number;
  name: string;
};

export interface BusRoute {
  id: string;
  name: string;
  stops: BusRouteStop[];
  schedule: number[];
  color: string;
}

export interface ScoreResult {
  total: number;
  breakdown: {
    congestion: number;
    waiting: number;
    speed: number;
    bus: number;
    throughput: number;
    bonus: number;
  };
  passed: boolean;
  failedConditions: TargetCondition[];
  failureReason: string | null;
}
