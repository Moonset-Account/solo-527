import { create } from 'zustand';
import type {
  LevelConfig,
  GameSpeed,
  GamePhase,
  IntersectionState,
  VehicleState,
  ReplayFrame,
  SignalPhaseConfig,
  AdjustmentSnapshot,
} from '@/types';
import * as StatsTracker from '@/engine/StatsTracker';

interface GameState {
  level: LevelConfig | null;
  phase: GamePhase;
  speed: GameSpeed;
  gameTime: number;
  vehicles: VehicleState[];
  intersections: IntersectionState[];
  congestionScore: number;
  throughput: number;
  avgWaitTime: number;
  replayFrames: ReplayFrame[];
  selectedIntersection: string | null;
  lastAdjustment: AdjustmentSnapshot | null;
  completedLevels: string[];

  startLevel: (level: LevelConfig) => void;
  setPhase: (phase: GamePhase) => void;
  setSpeed: (speed: GameSpeed) => void;
  updateGameTime: (dt: number) => void;
  updateSimulation: (
    vehicles: VehicleState[],
    intersections: IntersectionState[],
    score: number,
    throughput: number,
    waitTime: number,
  ) => void;
  adjustSignal: (
    intersectionId: string,
    before: SignalPhaseConfig[],
    after: SignalPhaseConfig[],
  ) => void;
  selectIntersection: (id: string | null) => void;
  recordReplayFrame: (frame: ReplayFrame) => void;
  restartLevel: () => void;
  clearReplay: () => void;
  completeLevel: (levelId: string) => void;
  loadCompletedLevels: () => void;
}

const COMPLETED_KEY = 'traffic_sim_completed';

export const useGameStore = create<GameState>((set, get) => ({
  level: null,
  phase: 'menu',
  speed: 1,
  gameTime: 0,
  vehicles: [],
  intersections: [],
  congestionScore: 100,
  throughput: 0,
  avgWaitTime: 0,
  replayFrames: [],
  selectedIntersection: null,
  lastAdjustment: null,
  completedLevels: [],

  startLevel: (level: LevelConfig) => {
    const intersections: IntersectionState[] = level.intersections.map((ic) => ({
      id: ic.id,
      currentPhase: 0,
      phaseTimer: 0,
      phases: ic.signalPhases.map((p) => ({ ...p })),
    }));
    StatsTracker.startLevel(level.id);
    set({
      level,
      phase: 'playing',
      speed: 1,
      gameTime: 0,
      vehicles: [],
      intersections,
      congestionScore: 100,
      throughput: 0,
      avgWaitTime: 0,
      replayFrames: [],
      selectedIntersection: null,
      lastAdjustment: null,
    });
  },

  setPhase: (phase: GamePhase) => set({ phase }),

  setSpeed: (speed: GameSpeed) => set({ speed }),

  updateGameTime: (dt: number) => {
    const state = get();
    if (state.phase !== 'playing') return;
    StatsTracker.updatePlayTime(dt);
    set({ gameTime: state.gameTime + dt });
  },

  updateSimulation: (vehicles, intersections, score, throughput, waitTime) => {
    const state = get();
    StatsTracker.recordScore({
      timestamp: state.gameTime,
      congestionScore: score,
      throughput,
      avgWaitTime: waitTime,
    });
    set({
      vehicles,
      intersections,
      congestionScore: score,
      throughput,
      avgWaitTime: waitTime,
    });
  },

  adjustSignal: (intersectionId, before, after) => {
    const state = get();
    const snapshot: AdjustmentSnapshot = {
      timestamp: state.gameTime,
      intersectionId,
      before,
      after,
    };
    StatsTracker.recordAdjustment(snapshot);
    const intersections = state.intersections.map((is) => {
      if (is.id !== intersectionId) return is;
      return { ...is, phases: after.map((p) => ({ ...p })) };
    });
    set({ intersections, lastAdjustment: snapshot });
  },

  selectIntersection: (id) => set({ selectedIntersection: id }),

  recordReplayFrame: (frame) => {
    const state = get();
    if (state.replayFrames.length > 600) return;
    set({ replayFrames: [...state.replayFrames, frame] });
  },

  restartLevel: () => {
    const state = get();
    if (!state.level) return;
    StatsTracker.incrementFailure();
    const level = state.level;
    const intersections: IntersectionState[] = level.intersections.map((ic) => ({
      id: ic.id,
      currentPhase: 0,
      phaseTimer: 0,
      phases: ic.signalPhases.map((p) => ({ ...p })),
    }));
    StatsTracker.startLevel(level.id);
    set({
      phase: 'playing',
      speed: 1,
      gameTime: 0,
      vehicles: [],
      intersections,
      congestionScore: 100,
      throughput: 0,
      avgWaitTime: 0,
      replayFrames: [],
      selectedIntersection: null,
      lastAdjustment: null,
    });
  },

  clearReplay: () => set({ replayFrames: [] }),

  completeLevel: (levelId) => {
    const state = get();
    const completed = state.completedLevels.includes(levelId)
      ? state.completedLevels
      : [...state.completedLevels, levelId];
    set({ completedLevels: completed, phase: 'complete' });
    try {
      localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));
    } catch {}
  },

  loadCompletedLevels: () => {
    try {
      const raw = localStorage.getItem(COMPLETED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          set({ completedLevels: parsed });
        }
      }
    } catch {}
  },
}));
