export type Direction = 'north' | 'south' | 'east' | 'west';

export type LightPhase = 'ns-green' | 'ns-yellow' | 'ew-green' | 'ew-yellow';

export type AnimationState = 'idle' | 'playing' | 'paused' | 'fastForward' | 'replaying';

export type RoadLayout = 'single' | 'double' | 'grid-2x2' | 'grid-3x3';

export type StarRating = 0 | 1 | 2 | 3;

export type VehicleType = 'car' | 'bus';

export interface TrafficLightConfig {
  intersectionId: string;
  nsGreenDuration: number;
  ewGreenDuration: number;
  yellowDuration: number;
  busPriorityEnabled: boolean;
  busPriorityAdvanceSeconds: number;
  busPriorityExtendSeconds: number;
  busPriorityCooldown: number;
}

export interface TrafficDensity {
  direction: Direction;
  vehiclesPerMinute: number;
  peakMultiplier: number;
  peakStartTime: number;
  peakEndTime: number;
}

export interface BusRouteConfig {
  routeId: string;
  stops: string[];
  frequency: number;
  color: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlightElement?: string;
  action?: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  roadLayout: RoadLayout;
  targetScore: number;
  timeLimit: number;
  trafficDensity: TrafficDensity[];
  busRoutes: BusRouteConfig[];
  initialTrafficLightConfigs: TrafficLightConfig[];
  tutorialSteps?: TutorialStep[];
}

export interface ScoreResult {
  congestionScore: number;
  throughput: number;
  avgWaitTime: number;
  busAvgWaitTime: number;
  starRating: StarRating;
}

export interface ReplaySnapshot {
  timestamp: number;
  trafficLightConfig: TrafficLightConfig[];
  scoreSnapshot: ScoreResult;
}

export interface Intersection {
  id: string;
  position: { x: number; z: number };
  roads: Direction[];
  trafficLightId: string;
}

export interface Vehicle {
  id: string;
  position: { x: number; z: number };
  direction: Direction;
  speed: number;
  waitingTime: number;
  route: string[];
  currentSegment: number;
  isWaiting: boolean;
  type: VehicleType;
}

export interface TrafficLightState {
  intersectionId: string;
  phase: LightPhase;
  timer: number;
  nsGreenDuration: number;
  ewGreenDuration: number;
  busPriorityEnabled: boolean;
  busPriorityCooldown: number;
}
