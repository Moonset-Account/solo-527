import { create } from 'zustand';
import { FilterState, IndicatorKey } from '@/types';

interface FilterStore extends FilterState {
  setSelectedSections: (sections: string[]) => void;
  setSelectedPoints: (points: string[]) => void;
  setSelectedMonths: (months: string[]) => void;
  setSelectedIndicators: (indicators: IndicatorKey[]) => void;
  setSelectedAgencies: (agencies: string[]) => void;
  setDateRange: (range: { start: string; end: string }) => void;
  resetFilters: () => void;
  getFilterSummary: () => string;
}

const defaultState: FilterState = {
  selectedSections: [],
  selectedPoints: [],
  selectedMonths: [],
  selectedIndicators: ['temperature', 'ph', 'dissolvedOxygen', 'ammoniaNitrogen'],
  selectedAgencies: [],
  dateRange: {
    start: '2025-01-01',
    end: '2025-12-31'
  }
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...defaultState,

  setSelectedSections: (sections) => set({ selectedSections: sections }),
  setSelectedPoints: (points) => set({ selectedPoints: points }),
  setSelectedMonths: (months) => set({ selectedMonths: months }),
  setSelectedIndicators: (indicators) => set({ selectedIndicators: indicators }),
  setSelectedAgencies: (agencies) => set({ selectedAgencies: agencies }),
  setDateRange: (dateRange) => set({ dateRange }),

  resetFilters: () => set(defaultState),

  getFilterSummary: () => {
    const state = get();
    const parts: string[] = [];
    
    if (state.selectedSections.length > 0) {
      parts.push(`河段: ${state.selectedSections.length}个`);
    }
    if (state.selectedPoints.length > 0) {
      parts.push(`采样点: ${state.selectedPoints.length}个`);
    }
    if (state.selectedMonths.length > 0) {
      parts.push(`月份: ${state.selectedMonths.length}个`);
    }
    if (state.selectedIndicators.length < 4) {
      parts.push(`指标: ${state.selectedIndicators.length}个`);
    }
    if (state.selectedAgencies.length > 0) {
      parts.push(`机构: ${state.selectedAgencies.length}个`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : '全部数据';
  }
}));
