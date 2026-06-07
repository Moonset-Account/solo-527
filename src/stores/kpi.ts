import { defineStore } from 'pinia';
import type { KPIData, FilterState } from '@/types';
import { generateKPIData } from '@/data/mockData';

interface KPIStore {
  data: KPIData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export const useKPIStore = defineStore('kpi', {
  state: (): KPIStore => ({
    data: null,
    loading: false,
    error: null,
    lastUpdate: null
  }),
  actions: {
    async fetchData(filters: FilterState) {
      this.loading = true;
      this.error = null;
      try {
        await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
        this.data = generateKPIData(filters);
        this.lastUpdate = new Date();
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }
});
