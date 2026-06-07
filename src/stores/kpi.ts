import { defineStore } from 'pinia';
import type { KPIData, FilterState } from '@/types';
import { api, type FilterQuery } from '@/utils/api';

interface KPIStore {
  data: KPIData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  cached: boolean;
}

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

export const useKPIStore = defineStore('kpi', {
  state: (): KPIStore => ({
    data: null,
    loading: false,
    error: null,
    lastUpdate: null,
    cached: false
  }),
  actions: {
    async fetchData(filters: FilterState) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.getKPI(filtersToQuery(filters));
        this.data = res.data;
        this.lastUpdate = new Date(res.updatedAt);
        this.cached = !!res.cached;
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }
});
