export interface TrackNode {
  id: string;
  x: number;
  y: number;
  type: 'junction' | 'platform' | 'signal' | 'endpoint';
  connections: string[];
  switchState?: number;
  signalState?: 'red' | 'green';
  platformId?: string;
}

export interface TrackEdge {
  from: string;
  to: string;
  length: number;
  speedLimit: number;
}

export interface ScheduleEntry {
  nodeId: string;
  arrivalTime: number;
  departureTime: number;
  action: 'pass' | 'stop';
}

export interface Train {
  id: string;
  type: 'passenger' | 'freight';
  name: string;
  color: number;
  speed: number;
  priority: number;
  schedule: ScheduleEntry[];
  path: string[];
  currentPathIndex: number;
  progress: number;
  state: 'waiting' | 'running' | 'arrived' | 'delayed' | 'crashed';
  delayAmount: number;
  misrouted: boolean;
}

export interface Conflict {
  type: 'same_track' | 'delay_chain' | 'platform_occupied';
  severity: 'warning' | 'critical';
  trains: string[];
  location: string;
  time: number;
  message: string;
}

export interface TutorialStep {
  highlightNodeIds: string[];
  message: string;
  waitForAction: 'switch' | 'signal' | 'start' | 'none';
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  timeLimit: number;
  nodes: TrackNode[];
  edges: TrackEdge[];
  trains: Train[];
  starThresholds: { one: number; two: number; three: number };
  tutorialSteps?: TutorialStep[];
}

export interface LevelResult {
  stars: number;
  bestTime: number;
  completed: boolean;
}

export interface SaveData {
  unlockedLevels: string[];
  levelResults: Record<string, LevelResult>;
  settings: {
    musicVolume: number;
    sfxVolume: number;
  };
}

export interface ReplayAction {
  time: number;
  type: 'switch' | 'signal' | 'priority';
  nodeId: string;
  prevState: number | string;
  newState: number | string;
}

export type UIState = 'idle' | 'selecting' | 'conflict' | 'paused' | 'gameover' | 'victory';
