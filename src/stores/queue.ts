import { defineStore } from 'pinia';
import type { QueuePrediction, FilterState } from '@/types';
import { generateQueuePrediction } from '@/data/mockData';

interface QueueStore {
  data: QueuePrediction[];
  loading: boolean;
  error: string | null;
  sampleSize: number;
  lastUpdate: Date | null;
  selectedAreaId: string | null;
  cache: Record<string, { data: QueuePrediction[]; sampleSize: number; timestamp: number }>;
}

export const useQueueStore = defineStore('queue', {
  state: (): QueueStore => ({
    data: [],
    loading: false,
    error: null,
    sampleSize: 0,
    lastUpdate: null,
    selectedAreaId: null,
    cache: {}
  }),
  getters: {
    anomalyPoints: (state) => {
      return state.data.filter(d => d.isAnomaly);
    },
    currentAreaData: (state) => {
      if (!state.selectedAreaId) return state.data;
      return state.data.filter(d => d.areaId === state.selectedAreaId);
    }
  },
  actions: {
    async fetchData(filters: FilterState, areaId?: string) {
      this.loading = true;
      this.error = null;
      const cacheKey = JSON.stringify({ filters, areaId });

      try {
        const cached = this.cache[cacheKey];
        const now = Date.now();
        if (cached && now - cached.timestamp < 30000) {
          this.data = cached.data;
          this.sampleSize = cached.sampleSize;
          this.loading = false;
          return;
        }

        await new Promise(r => setTimeout(r, 250 + Math.random() * 350));
        const result = generateQueuePrediction(filters, areaId);
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
    setSelectedArea(areaId: string | null) {
      this.selectedAreaId = areaId;
    },
    clearCache() {
      this.cache = {};
    }
  }
});
