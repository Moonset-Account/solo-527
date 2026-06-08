import { create } from 'zustand';
import type {
  AnimationState,
  TrafficLightConfig,
  TrafficLightState,
  ScoreResult,
  ReplaySnapshot,
  AdjustmentComparison,
} from '@/engine/types';

interface SimulationStoreState {
  simulationTime: number;
  trafficLightConfigs: TrafficLightConfig[];
  trafficLightStates: TrafficLightState[];
  selectedIntersection: string | null;
  animationState: AnimationState;
  speed: number;
  currentScore: ScoreResult | null;
  snapshots: ReplaySnapshot[];
  latestComparison: AdjustmentComparison | null;
  preAdjustmentSnapshot: ReplaySnapshot | null;
}

interface SimulationStoreActions {
  setAnimationState: (state: AnimationState) => void;
  setSpeed: (speed: number) => void;
  setSelectedIntersection: (id: string | null) => void;
  initTrafficLightConfigs: (configs: TrafficLightConfig[]) => void;
  updateTrafficLightConfig: (
    intersectionId: string,
    patch: Partial<TrafficLightConfig>,
  ) => void;
  updateTrafficLightStates: (states: TrafficLightState[]) => void;
  setSimulationTime: (time: number) => void;
  setCurrentScore: (score: ScoreResult | null) => void;
  addSnapshot: (snapshot: ReplaySnapshot) => void;
  clearSnapshots: () => void;
  setLatestComparison: (comparison: AdjustmentComparison | null) => void;
  setPreAdjustmentSnapshot: (snapshot: ReplaySnapshot | null) => void;
  resetSimulation: () => void;
}

export type SimulationStore = SimulationStoreState & SimulationStoreActions;

const initialState: SimulationStoreState = {
  simulationTime: 0,
  trafficLightConfigs: [],
  trafficLightStates: [],
  selectedIntersection: null,
  animationState: 'idle',
  speed: 1,
  currentScore: null,
  snapshots: [],
  latestComparison: null,
  preAdjustmentSnapshot: null,
};

export const useSimulationStore = create<SimulationStore>((set) => ({
  ...initialState,

  setAnimationState: (animationState: AnimationState) => {
    set({ animationState });
  },

  setSpeed: (speed: number) => {
    set({ speed });
  },

  setSelectedIntersection: (id: string | null) => {
    set({ selectedIntersection: id });
  },

  initTrafficLightConfigs: (configs: TrafficLightConfig[]) => {
    set({ trafficLightConfigs: configs });
  },

  updateTrafficLightConfig: (
    intersectionId: string,
    patch: Partial<TrafficLightConfig>,
  ) => {
    set((state) => ({
      trafficLightConfigs: state.trafficLightConfigs.map((config) =>
        config.intersectionId === intersectionId ? { ...config, ...patch } : config,
      ),
    }));
  },

  updateTrafficLightStates: (states: TrafficLightState[]) => {
    set({ trafficLightStates: states });
  },

  setSimulationTime: (time: number) => {
    set({ simulationTime: time });
  },

  setCurrentScore: (score: ScoreResult | null) => {
    set({ currentScore: score });
  },

  addSnapshot: (snapshot: ReplaySnapshot) => {
    set((state) => ({
      snapshots: [...state.snapshots, snapshot],
    }));
  },

  clearSnapshots: () => {
    set({ snapshots: [] });
  },

  setLatestComparison: (comparison: AdjustmentComparison | null) => {
    set({ latestComparison: comparison });
  },

  setPreAdjustmentSnapshot: (snapshot: ReplaySnapshot | null) => {
    set({ preAdjustmentSnapshot: snapshot });
  },

  resetSimulation: () => {
    set({ ...initialState });
  },
}));
