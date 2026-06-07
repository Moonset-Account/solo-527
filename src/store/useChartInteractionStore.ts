import { create } from 'zustand';
import { ChartInteractionState } from '@/types';

interface ChartInteractionStore extends ChartInteractionState {
  setSelectedPointId: (pointId: string | null) => void;
  setHighlightedTime: (time: string | null) => void;
  setZoomRange: (range: { start: string; end: string } | null) => void;
  resetInteraction: () => void;
}

const defaultState: ChartInteractionState = {
  selectedPointId: null,
  highlightedTime: null,
  zoomRange: null
};

export const useChartInteractionStore = create<ChartInteractionStore>((set) => ({
  ...defaultState,

  setSelectedPointId: (selectedPointId) => set({ selectedPointId }),
  setHighlightedTime: (highlightedTime) => set({ highlightedTime }),
  setZoomRange: (zoomRange) => set({ zoomRange }),
  resetInteraction: () => set(defaultState)
}));
