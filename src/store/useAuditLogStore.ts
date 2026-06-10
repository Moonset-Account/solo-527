import { create } from 'zustand';
import {
  auditLogApi,
  AuditLogDto,
  CreateAuditLogRequest,
  AuditLogQueryRequest,
  PagedResult
} from '@/services/api';

interface AuditLogState {
  auditLogs: AuditLogDto[];
  currentAuditLog: AuditLogDto | null;
  pagedResult: PagedResult<AuditLogDto> | null;
  loading: boolean;
  error: string | null;

  fetchAuditLogs: (params?: AuditLogQueryRequest) => Promise<void>;
  fetchAuditLog: (id: string) => Promise<void>;
  createAuditLog: (data: CreateAuditLogRequest) => Promise<AuditLogDto>;
  setCurrentAuditLog: (auditLog: AuditLogDto | null) => void;
  getLogsByEntity: (entityType: string, entityId: string) => AuditLogDto[];
  getLogsByOperator: (operatorId: string) => AuditLogDto[];
  clearError: () => void;
}

export const useAuditLogStore = create<AuditLogState>((set, get) => ({
  auditLogs: [],
  currentAuditLog: null,
  pagedResult: null,
  loading: false,
  error: null,

  fetchAuditLogs: async (params?: AuditLogQueryRequest) => {
    set({ loading: true, error: null });
    try {
      const result = await auditLogApi.getAuditLogs(params);
      set({ auditLogs: result.items, pagedResult: result, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取审计日志列表失败', loading: false });
    }
  },

  fetchAuditLog: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const auditLog = await auditLogApi.getAuditLog(id);
      set({ currentAuditLog: auditLog, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取审计日志详情失败', loading: false });
    }
  },

  createAuditLog: async (data: CreateAuditLogRequest) => {
    set({ loading: true, error: null });
    try {
      const newLog = await auditLogApi.createAuditLog(data);
      const { auditLogs } = get();
      set({ auditLogs: [newLog, ...auditLogs], loading: false });
      return newLog;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建审计日志失败', loading: false });
      throw err;
    }
  },

  setCurrentAuditLog: (auditLog) => {
    set({ currentAuditLog: auditLog });
  },

  getLogsByEntity: (entityType: string, entityId: string) => {
    const { auditLogs } = get();
    return auditLogs.filter(l => l.entityType === entityType && l.entityId === entityId);
  },

  getLogsByOperator: (operatorId: string) => {
    const { auditLogs } = get();
    return auditLogs.filter(l => l.operatorId === operatorId);
  },

  clearError: () => {
    set({ error: null });
  }
}));
