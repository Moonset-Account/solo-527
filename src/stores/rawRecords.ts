import { defineStore } from 'pinia';
import type { RawRecord, FilterState } from '@/types';
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

interface RawRecordsStore {
  records: RawRecord[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  source?: string;
  areaId?: string;
  lastUpdate: Date | null;
}

export const useRawRecordsStore = defineStore('rawRecords', {
  state: (): RawRecordsStore => ({
    records: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 20,
    total: 0,
    source: undefined,
    areaId: undefined,
    lastUpdate: null
  }),
  actions: {
    async fetchRecords(filters: FilterState, options?: { page?: number; pageSize?: number; source?: string; areaId?: string }) {
      this.loading = true;
      this.error = null;
      try {
        if (options?.page) this.page = options.page;
        if (options?.pageSize) this.pageSize = options.pageSize;
        if (options?.source) this.source = options.source;
        if (options?.areaId !== undefined) this.areaId = options.areaId;

        const res = await api.getRawRecords({
          ...filtersToQuery(filters, this.areaId),
          page: this.page,
          pageSize: this.pageSize,
          source: this.source
        });
        this.records = res.data;
        this.total = res.total;
        this.lastUpdate = new Date(res.updatedAt);
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    setPage(page: number) {
      this.page = page;
    },
    reset() {
      this.records = [];
      this.page = 1;
      this.total = 0;
      this.source = undefined;
      this.areaId = undefined;
    }
  }
});
