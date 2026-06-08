import { create } from 'zustand';
import type { LevelResult } from '../types/save';

interface GameNavigationState {
  currentRoute: 'menu' | 'levels' | 'game' | 'settings' | 'result';
  selectedLevelId: string | null;
  lastResult: LevelResult | null;
  navigate: (route: GameNavigationState['currentRoute']) => void;
  selectLevel: (id: string) => void;
  setResult: (r: LevelResult | null) => void;
  reset: () => void;
}

export const useGameNavStore = create<GameNavigationState>(set => ({
  currentRoute: 'menu',
  selectedLevelId: null,
  lastResult: null,
  navigate: (route) => set({ currentRoute: route }),
  selectLevel: (id) => set({ selectedLevelId: id, currentRoute: 'game' }),
  setResult: (r) => set({ lastResult: r, currentRoute: r ? 'result' : 'menu' }),
  reset: () => set({ currentRoute: 'menu', selectedLevelId: null, lastResult: null }),
}));
