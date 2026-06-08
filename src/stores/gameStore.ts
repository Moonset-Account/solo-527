import { create } from 'zustand';
import { GamePhase, PlayTracker, ReactionEffect, LabObject } from '@/types/game';

interface GameState {
  phase: GamePhase;
  currentLevelId: string | null;
  currentStepIndex: number;
  totalSteps: number;
  temperature: number;
  labObjects: LabObject[];
  effects: ReactionEffect[];
  error: string | null;
  safetyNote: string | null;
  hint: string | null;
  tracker: PlayTracker | null;
  isPaused: boolean;
  selectedApparatus: string | null;
  selectedReagent: string | null;
  setPhase: (phase: GamePhase) => void;
  setCurrentLevel: (levelId: string) => void;
  setStepIndex: (index: number) => void;
  setTotalSteps: (total: number) => void;
  setTemperature: (temp: number | ((prev: number) => number)) => void;
  addLabObject: (obj: LabObject) => void;
  removeLabObject: (id: string) => void;
  setEffects: (effects: ReactionEffect[]) => void;
  setError: (error: string | null) => void;
  setSafetyNote: (note: string | null) => void;
  setHint: (hint: string | null) => void;
  setTracker: (tracker: PlayTracker | null) => void;
  setPaused: (paused: boolean) => void;
  selectApparatus: (id: string | null) => void;
  selectReagent: (id: string | null) => void;
  resetLab: () => void;
}

const initialState = {
  phase: 'menu' as GamePhase,
  currentLevelId: null,
  currentStepIndex: 0,
  totalSteps: 0,
  temperature: 0,
  labObjects: [] as LabObject[],
  effects: [] as ReactionEffect[],
  error: null as string | null,
  safetyNote: null as string | null,
  hint: null as string | null,
  tracker: null as PlayTracker | null,
  isPaused: false,
  selectedApparatus: null as string | null,
  selectedReagent: null as string | null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  setPhase: (phase) => set({ phase }),
  setCurrentLevel: (levelId) => set({ currentLevelId: levelId }),
  setStepIndex: (index) => set({ currentStepIndex: index }),
  setTotalSteps: (total) => set({ totalSteps: total }),
  setTemperature: (temp: number | ((prev: number) => number)) => set((s) => ({ temperature: typeof temp === 'function' ? temp(s.temperature) : temp })),
  addLabObject: (obj) => set((s) => ({ labObjects: [...s.labObjects, obj] })),
  removeLabObject: (id) => set((s) => ({ labObjects: s.labObjects.filter(o => o.id !== id) })),
  setEffects: (effects) => set({ effects }),
  setError: (error) => set({ error }),
  setSafetyNote: (note) => set({ safetyNote: note }),
  setHint: (hint) => set({ hint }),
  setTracker: (tracker) => set({ tracker }),
  setPaused: (paused) => set({ isPaused: paused }),
  selectApparatus: (id) => set({ selectedApparatus: id }),
  selectReagent: (id) => set({ selectedReagent: id }),
  resetLab: () => set({
    ...initialState,
    phase: 'menu',
  }),
}));
