import { defineStore } from 'pinia';
import type { HeatmapData, FilterState } from '@/types';
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

interface HeatmapStore {
  data: HeatmapData[];
  loading: boolean;
  error: string | null;
  sampleSize: number;
  lastUpdate: Date | null;
  selectedAreaId: string | null;
  cached: boolean;
}

export const useHeatmapStore = defineStore('heatmap', {
  state: (): HeatmapStore => ({
    data: [],
    loading: false,
    error: null,
    sampleSize: 0,
    lastUpdate: null,
    selectedAreaId: null,
    cached: false
  }),
  actions: {
    async fetchData(filters: FilterState) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.getHeatmap(filtersToQuery(filters));
        this.data = res.data;
        this.sampleSize = res.data.reduce((s, d) => s + d.visitorCount, 0);
        this.lastUpdate = new Date(res.updatedAt);
        this.cached = !!res.cached;
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    selectArea(areaId: string | null) {
      this.selectedAreaId = areaId;
    }
  }
});
