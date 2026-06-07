import { defineStore } from 'pinia';
import type { DataQualityReport, FilterState } from '@/types';
import { api, type FilterQuery } from '@/utils/api';

function filtersToQuery(filters: FilterState): FilterQuery {
  return {
    startTime: filters.timeRange?.[0]?.toISOString(),
    endTime: filters.timeRange?.[1]?.toISOString(),
    entrance: filters.entrance.length ? filters.entrance : undefined,
    areaId: filters.area.length ? filters.area : undefined,
    ticketType: filters.ticketType.length ? filters.ticketType : undefined,
    activity: filters.activity.length ? filters.activity : undefined
  };
}

interface DataQualityStore {
  report: DataQualityReport | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
  cached: boolean;
}

export const useDataQualityStore = defineStore('dataQuality', {
  state: (): DataQualityStore => ({
    report: null,
    loading: false,
    error: null,
    lastFetch: null,
    cached: false
  }),
  getters: {
    hasMissingValueWarning: (state) => {
      return state.report ? state.report.missingRate > 5 : false;
    },
    hasAnomalyWarning: (state) => {
      return state.report ? state.report.outlierCount > 30 : false;
    }
  },
  actions: {
    async fetchReport(filters: FilterState) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.getDataQuality(filtersToQuery(filters));
        this.report = res.data;
        this.lastFetch = new Date(res.updatedAt);
        this.cached = !!res.cached;
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }
});
