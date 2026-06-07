import { defineStore } from 'pinia';
import type { QueuePrediction, FilterState } from '@/types';
import { api, type FilterQuery } from '@/utils/api';

function filtersToQuery(filters: FilterState, areaId?: string): FilterQuery {
  return {
    startTime: filters.timeRange?.[0]?.toISOString(),
    endTime: filters.timeRange?.[1]?.toISOString(),
    entrance: filters.entrance.length ? filters.entrance : undefined,
    areaId: areaId ? [areaId] : (filters.area.length ? filters.area : undefined),
    ticketType: filters.ticketType.length ? filters.ticketType : undefined,
    activity: filters.activity.length ? filters.activity : undefined
  };
}

interface QueueStore {
  data: QueuePrediction[];
  loading: boolean;
  error: string | null;
  sampleSize: number;
  lastUpdate: Date | null;
  selectedAreaId: string | null;
  cached: boolean;
}

export const useQueueStore = defineStore('queue', {
  state: (): QueueStore => ({
    data: [],
    loading: false,
    error: null,
    sampleSize: 0,
    lastUpdate: null,
    selectedAreaId: null,
    cached: false
  }),
  getters: {
    anomalyPoints: (state) => {
      return state.data.filter(d => d.isAnomaly);
    }
  },
  actions: {
    async fetchData(filters: FilterState, areaId?: string) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.getQueuePrediction(filtersToQuery(filters, areaId));
        this.data = res.data;
        this.sampleSize = res.data.filter(d => d.isHistory && d.actualCount !== null).reduce((s, d) => s + (d.actualCount || 0), 0);
        this.lastUpdate = new Date(res.updatedAt);
        this.cached = !!res.cached;
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    setSelectedArea(areaId: string | null) {
      this.selectedAreaId = areaId;
    }
  }
});
