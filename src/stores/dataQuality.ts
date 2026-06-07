import { defineStore } from 'pinia';
import type { DataQualityReport } from '@/types';
import { generateDataQualityReport } from '@/data/mockData';

interface DataQualityStore {
  report: DataQualityReport | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

export const useDataQualityStore = defineStore('dataQuality', {
  state: (): DataQualityStore => ({
    report: null,
    loading: false,
    error: null,
    lastFetch: null
  }),
  getters: {
    hasMissingValueWarning: (state) => {
      return state.report ? state.report.missingValueRate > 5 : false;
    },
    hasAnomalyWarning: (state) => {
      return state.report ? state.report.anomalyCount > 30 : false;
    }
  },
  actions: {
    async fetchReport() {
      this.loading = true;
      this.error = null;
      try {
        await new Promise(r => setTimeout(r, 100 + Math.random() * 150));
        this.report = generateDataQualityReport();
        this.lastFetch = new Date();
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }
});
