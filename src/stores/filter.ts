import { defineStore } from 'pinia';
import type { FilterState } from '@/types';

function getDefaultFilters(): FilterState {
  const now = new Date();
  const start = new Date(now);
  start.setHours(8, 0, 0, 0);
  const end = new Date(now);
  end.setHours(20, 0, 0, 0);
  return {
    entrance: [],
    area: [],
    timeRange: [start, end],
    ticketType: [],
    activity: []
  };
}

interface FilterStore {
  filters: FilterState;
  isolatedStates: Record<string, FilterState>;
}

export const useFilterStore = defineStore('filter', {
  state: (): FilterStore => ({
    filters: getDefaultFilters(),
    isolatedStates: {}
  }),
  getters: {
    getIsolatedState: (state) => (viewId: string) => {
      return state.isolatedStates[viewId] || state.filters;
    },
    timeRangeLabel: (state) => {
      if (!state.filters.timeRange) return '未选择';
      const [start, end] = state.filters.timeRange;
      return `${start.toLocaleDateString('zh-CN')} ${start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
  },
  actions: {
    setEntrance(entrance: string[]) {
      this.filters.entrance = entrance;
    },
    setArea(area: string[]) {
      this.filters.area = area;
    },
    setTimeRange(start: Date, end: Date) {
      this.filters.timeRange = [start, end];
    },
    setTicketType(ticketType: string[]) {
      this.filters.ticketType = ticketType;
    },
    setActivity(activity: string[]) {
      this.filters.activity = activity;
    },
    resetFilters() {
      this.filters = getDefaultFilters();
    },
    initIsolatedState(viewId: string) {
      if (!this.isolatedStates[viewId]) {
        this.isolatedStates[viewId] = JSON.parse(JSON.stringify(this.filters));
      }
    },
    updateIsolatedState(viewId: string, updates: Partial<FilterState>) {
      if (!this.isolatedStates[viewId]) {
        this.initIsolatedState(viewId);
      }
      this.isolatedStates[viewId] = {
        ...this.isolatedStates[viewId],
        ...updates
      };
    },
    syncIsolatedToGlobal(viewId: string) {
      if (this.isolatedStates[viewId]) {
        this.filters = JSON.parse(JSON.stringify(this.isolatedStates[viewId]));
      }
    }
  }
});
