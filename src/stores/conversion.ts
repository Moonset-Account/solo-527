import { defineStore } from 'pinia';
import type { ConversionFunnel, FilterState } from '@/types';
import { generateConversionFunnel } from '@/data/mockData';

interface ConversionStore {
  data: ConversionFunnel[];
  loading: boolean;
  error: string | null;
  sampleSize: number;
  lastUpdate: Date | null;
  cache: Record<string, { data: ConversionFunnel[]; sampleSize: number; timestamp: number }>;
}

export const useConversionStore = defineStore('conversion', {
  state: (): ConversionStore => ({
    data: [],
    loading: false,
    error: null,
    sampleSize: 0,
    lastUpdate: null,
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
        if (cached && now - cached.timestamp < 120000) {
          this.data = cached.data;
          this.sampleSize = cached.sampleSize;
          this.loading = false;
          return;
        }

        await new Promise(r => setTimeout(r, 150 + Math.random() * 200));
        const result = generateConversionFunnel(filters);
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
    clearCache() {
      this.cache = {};
    }
  }
});
