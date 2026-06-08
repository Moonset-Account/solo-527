import { create } from 'zustand';
import type { GameState, Level, ErrorCondition, ReactionResult, Equipment, Reagent } from '@/types';

const initialGameState: GameState = {
  currentLevel: null,
  currentStepIndex: 0,
  temperature: 25,
  isHeating: false,
  isStirring: false,
  isPaused: false,
  isComplete: false,
  isFailed: false,
  startTime: 0,
  elapsedTime: 0,
  accuracy: 100,
  failureReason: '',
  placedEquipment: [],
  addedReagents: [],
  reactions: [],
  errors: [],
  safetyAlerts: [],
};

interface GameStore extends GameState {
  initLevel: (level: Level) => void;
  setCurrentStep: (index: number) => void;
  advanceStep: () => void;
  setTemperature: (temp: number) => void;
  toggleHeating: () => void;
  toggleStirring: () => void;
  placeEquipment: (equipment: Equipment) => void;
  addReagent: (reagent: Reagent, amount: number, equipmentId: string) => void;
  addReaction: (reaction: ReactionResult) => void;
  addError: (error: ErrorCondition) => void;
  addSafetyAlert: (message: string, severity: 'warning' | 'error' | 'critical') => void;
  clearSafetyAlerts: () => void;
  setPaused: (paused: boolean) => void;
  setComplete: () => void;
  setFailed: (reason: string) => void;
  resetGame: () => void;
  updateElapsedTime: () => void;
  setAccuracy: (accuracy: number) => void;
}

export const useGameStore = create<GameStore>()((set) => ({
  ...initialGameState,

  initLevel: (level) =>
    set({
      currentLevel: level,
      currentStepIndex: 0,
      temperature: 25,
      isHeating: false,
      isStirring: false,
      isPaused: false,
      isComplete: false,
      isFailed: false,
      startTime: Date.now(),
      elapsedTime: 0,
      accuracy: 100,
      failureReason: '',
      placedEquipment: [],
      addedReagents: [],
      reactions: [],
      errors: [],
      safetyAlerts: [],
    }),

  setCurrentStep: (index) => set({ currentStepIndex: index }),

  advanceStep: () =>
    set((state) => ({ currentStepIndex: state.currentStepIndex + 1 })),

  setTemperature: (temp) => set({ temperature: temp }),

  toggleHeating: () => set((state) => ({ isHeating: !state.isHeating })),

  toggleStirring: () => set((state) => ({ isStirring: !state.isStirring })),

  placeEquipment: (equipment) =>
    set((state) => ({
      placedEquipment: [...state.placedEquipment, equipment],
    })),

  addReagent: (reagent, amount, equipmentId) =>
    set((state) => ({
      addedReagents: [...state.addedReagents, { reagent, amount, equipmentId }],
    })),

  addReaction: (reaction) =>
    set((state) => ({
      reactions: [...state.reactions, reaction],
    })),

  addError: (error) =>
    set((state) => ({
      errors: [...state.errors, error],
    })),

  addSafetyAlert: (message, severity) =>
    set((state) => ({
      safetyAlerts: [...state.safetyAlerts, { message, severity }],
    })),

  clearSafetyAlerts: () => set({ safetyAlerts: [] }),

  setPaused: (paused) => set({ isPaused: paused }),

  setComplete: () => set({ isComplete: true, elapsedTime: Date.now() - useGameStore.getState().startTime }),

  setFailed: (reason) =>
    set({ isFailed: true, failureReason: reason }),

  resetGame: () => set({ ...initialGameState }),

  updateElapsedTime: () =>
    set((state) => {
      if (state.startTime === 0) return { elapsedTime: 0 };
      return { elapsedTime: Date.now() - state.startTime };
    }),

  setAccuracy: (accuracy) => set({ accuracy }),
}));
