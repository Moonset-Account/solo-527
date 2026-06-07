import { defineStore } from 'pinia';
import type { HeatmapData, FilterState } from '@/types';
import { generateHeatmapData } from '@/data/mockData';

interface HeatmapStore {
  data: HeatmapData[];
  loading: boolean;
  error: string | null;
  sampleSize: number;
  lastUpdate: Date | null;
  selectedAreaId: string | null;
  cache: Record<string, { data: HeatmapData[]; sampleSize: number; timestamp: number }>;
}

export const useHeatmapStore = defineStore('heatmap', {
  state: (): HeatmapStore => ({
    data: [],
    loading: false,
    error: null,
    sampleSize: 0,
    lastUpdate: null,
    selectedAreaId: null,
    cache: {}
  }),
  actions: {
    async fetchData(filters: FilterState) {
      this.loading = true;
      this.error = null;
      const cacheKey = JSON.stringify(filters);
      
      try {
        const cached = this.cache[cacheKey];
        const now = Date.now();
        if (cached && now - cached.timestamp < 60000) {
          this.data = cached.data;
          this.sampleSize = cached.sampleSize;
          this.loading = false;
          return;
        }

        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
        const result = generateHeatmapData(filters);
        this.data = result.data;
        this.sampleSize = result.sampleSize;
        this.lastUpdate = new Date();
        this.cache[cacheKey] = { ...result, timestamp: now };
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    selectArea(areaId: string | null) {
      this.selectedAreaId = areaId;
    },
    clearCache() {
      this.cache = {};
    }
  }
});
