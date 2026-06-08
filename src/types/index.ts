export type Direction = "north" | "south" | "east" | "west";
export type IntersectionType = "cross" | "t-junction" | "complex";
export type PeakType = "morning" | "evening" | "both";
export type GameSpeed = 0 | 1 | 2 | 4;
export type GamePhase = "menu" | "playing" | "paused" | "replay" | "complete";

export interface SignalPhaseConfig {
  direction: Direction;
  greenDuration: number;
  cycleLength: number;
  busPriority: boolean;
}

export interface IntersectionConfig {
  id: string;
  position: [number, number];
  type: IntersectionType;
  signalPhases: SignalPhaseConfig[];
}

export interface RoadConfig {
  id: string;
  from: string;
  to: string;
  lanes: number;
  speedLimit: number;
  direction: Direction;
}

export interface BusRouteConfig {
  id: string;
  name: string;
  stops: string[];
  frequency: number;
  color: string;
}

export interface TrafficScheduleConfig {
  timeRange: [number, number];
  densityMultiplier: number;
  peakType: PeakType;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  intersections: IntersectionConfig[];
  roads: RoadConfig[];
  busRoutes: BusRouteConfig[];
  trafficSchedule: TrafficScheduleConfig[];
  targetScore: number;
  timeLimit: number;
  initialCycleLength: number;
  initialGreenDuration: number;
}

export interface VehicleState {
  id: string;
  roadId: string;
  position: number;
  speed: number;
  lane: number;
  isBus: boolean;
  busRouteId?: string;
  color: string;
  waiting: boolean;
}

export interface IntersectionState {
  id: string;
  currentPhase: number;
  phaseTimer: number;
  phases: SignalPhaseConfig[];
}

export interface SimulationState {
  gameTime: number;
  vehicles: VehicleState[];
  intersections: IntersectionState[];
  congestionScore: number;
  throughput: number;
  avgWaitTime: number;
}

export interface AdjustmentSnapshot {
  timestamp: number;
  intersectionId: string;
  before: SignalPhaseConfig[];
  after: SignalPhaseConfig[];
}

export interface ScoreSnapshot {
  timestamp: number;
  congestionScore: number;
  throughput: number;
  avgWaitTime: number;
}

export interface PlayStats {
  levelId: string;
  playTimeSeconds: number;
  failureCount: number;
  adjustments: AdjustmentSnapshot[];
  scoreHistory: ScoreSnapshot[];
}

export interface SaveData {
  id: string;
  levelId: string;
  timestamp: number;
  gameTime: number;
  intersections: IntersectionState[];
  stats: PlayStats;
  speed: GameSpeed;
}

export interface ReplayFrame {
  time: number;
  vehicles: VehicleState[];
  intersections: IntersectionState[];
  congestionScore: number;
  throughput: number;
  avgWaitTime: number;
}
