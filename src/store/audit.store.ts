import { create } from 'zustand';
import { api } from '@/lib/api';

interface AuditLog {
  id: number;
  operatorId: number;
  operatorName: string;
  action: string;
  targetType: string;
  targetId: number;
  targetName: string;
  detail: string;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  isSuccess: boolean;
  createdAt: string;
}

interface AuditLogQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  operatorId?: number;
  action?: string;
  failedOnly?: boolean;
}

interface AuditState {
  logs: AuditLog[];
  total: number;
  loading: boolean;
  fetchAuditLogs: (query?: AuditLogQuery) => Promise<void>;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  total: 0,
  loading: false,

  fetchAuditLogs: async (query?: AuditLogQuery) => {
    set({ loading: true });
    try {
      const params: Record<string, string | number | undefined> = {
        page: query?.page || 1,
        limit: query?.limit || 20,
        startDate: query?.startDate,
        endDate: query?.endDate,
        operatorId: query?.operatorId,
        action: query?.action,
        failedOnly: query?.failedOnly ? '1' : undefined,
      };
      const res = await api.get<{ items: AuditLog[]; total: number }>('/audit-logs', params);
      set({ logs: res.items, total: res.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
