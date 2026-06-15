import { create } from 'zustand';
import { api } from '@/lib/api';

interface ExportRecord {
  id: number;
  exporterId: number;
  exporterName: string;
  dataType: string;
  querySummary: string;
  recordCount: number;
  filePath: string;
  createdAt: string;
}

interface ExportQuery {
  page?: number;
  limit?: number;
  dataType?: string;
}

interface ExportTriggerData {
  dataType: string;
  filters?: Record<string, string | number | undefined>;
}

interface ExportState {
  records: ExportRecord[];
  total: number;
  loading: boolean;
  fetchExports: (query?: ExportQuery) => Promise<void>;
  triggerExport: (data: ExportTriggerData) => Promise<ExportRecord>;
  downloadExport: (id: number) => void;
}

export const useExportStore = create<ExportState>((set) => ({
  records: [],
  total: 0,
  loading: false,

  fetchExports: async (query?: ExportQuery) => {
    set({ loading: true });
    try {
      const params: Record<string, string | number | undefined> = {
        page: query?.page || 1,
        limit: query?.limit || 10,
        dataType: query?.dataType,
      };
      const res = await api.get<{ items: ExportRecord[]; total: number }>('/exports', params);
      set({ records: res.items, total: res.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  triggerExport: async (data) => {
    const record = await api.post<ExportRecord>('/exports', data);
    return record;
  },

  downloadExport: (id: number) => {
    const token = localStorage.getItem('token');
    window.open(`/api/exports/${id}/download?token=${token}`, '_blank');
  },
}));
