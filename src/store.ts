import { create } from 'zustand';
import type {
  RepairRequest,
  FlowRecord,
  QuotaConfig,
  CheckInRecord,
  Notification,
  BatchResult,
  SeatUtilizationDetail,
  IdentityFailureDetail,
  ProcessingRecordDetail,
  RequestStatus,
} from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API error: ${res.status} ${res.statusText}`);
  }
  const data: ApiResponse<T> = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data;
}

interface RepairFilter {
  status?: RequestStatus;
  building?: string;
  repairType?: string;
  page?: number;
  pageSize?: number;
}

interface CheckinFilter {
  studentId?: string;
  requestId?: string;
  startDate?: string;
  endDate?: string;
}

interface ExportFilter {
  type: 'seat_utilization' | 'identity_failure' | 'processing_record';
  startDate?: string;
  endDate?: string;
  format?: 'csv' | 'excel';
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface AppStore {
  repairs: RepairRequest[];
  repairsLoading: boolean;
  repairsTotal: number;
  fetchRepairs: (filter?: RepairFilter) => Promise<void>;
  createRepair: (data: Partial<RepairRequest>) => Promise<RepairRequest>;
  updateStatus: (id: string, status: RequestStatus) => Promise<void>;

  currentRequest: RepairRequest | null;
  currentRequestLoading: boolean;
  fetchRequest: (id: string) => Promise<void>;

  flowRecords: FlowRecord[];
  flowRecordsLoading: boolean;
  fetchFlowRecords: (requestId: string) => Promise<void>;

  quotas: QuotaConfig[];
  quotasLoading: boolean;
  fetchQuotas: () => Promise<void>;
  createQuota: (data: Partial<QuotaConfig>) => Promise<QuotaConfig>;
  updateQuota: (id: string, data: Partial<QuotaConfig>) => Promise<void>;

  checkins: CheckInRecord[];
  checkinsLoading: boolean;
  fetchCheckins: (filter?: CheckinFilter) => Promise<void>;
  createCheckin: (data: Partial<CheckInRecord>) => Promise<CheckInRecord>;

  notifications: Notification[];
  notificationsLoading: boolean;
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;

  batchResult: BatchResult | null;
  batchLoading: boolean;
  processBatch: (operation: string, requestIds: string[], remark?: string) => Promise<void>;
  retryFailed: (requestId: string) => Promise<void>;

  seatUtilization: SeatUtilizationDetail[];
  seatUtilizationLoading: boolean;
  fetchSeatUtilization: () => Promise<void>;

  identityFailures: IdentityFailureDetail[];
  identityFailuresLoading: boolean;
  fetchIdentityFailures: () => Promise<void>;

  processingRecords: ProcessingRecordDetail[];
  processingRecordsLoading: boolean;
  fetchProcessingRecords: () => Promise<void>;

  exportLoading: boolean;
  exportData: (filter: ExportFilter) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  repairs: [],
  repairsLoading: false,
  repairsTotal: 0,
  fetchRepairs: async (filter) => {
    set({ repairsLoading: true });
    try {
      const params = new URLSearchParams();
      if (filter?.status) params.set('status', filter.status);
      if (filter?.building) params.set('building', filter.building);
      if (filter?.repairType) params.set('repairType', filter.repairType);
      if (filter?.page) params.set('page', String(filter.page));
      if (filter?.pageSize) params.set('pageSize', String(filter.pageSize));
      const qs = params.toString();
      const result = await apiFetch<PaginatedData<RepairRequest>>(`/api/repairs${qs ? `?${qs}` : ''}`);
      set({ repairs: result.items, repairsTotal: result.total });
    } finally {
      set({ repairsLoading: false });
    }
  },
  createRepair: async (data) => {
    const result = await apiFetch<RepairRequest>('/api/repairs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    set((state) => ({ repairs: [result, ...state.repairs] }));
    return result;
  },
  updateStatus: async (id, status) => {
    await apiFetch<RepairRequest>(`/api/repairs/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    set((state) => ({
      repairs: state.repairs.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
  },

  currentRequest: null,
  currentRequestLoading: false,
  fetchRequest: async (id) => {
    set({ currentRequestLoading: true });
    try {
      const result = await apiFetch<RepairRequest>(`/api/repairs/${id}`);
      set({ currentRequest: result });
    } finally {
      set({ currentRequestLoading: false });
    }
  },

  flowRecords: [],
  flowRecordsLoading: false,
  fetchFlowRecords: async (requestId) => {
    set({ flowRecordsLoading: true });
    try {
      const result = await apiFetch<{ requestId: string; requestInfo: any; flowRecords: FlowRecord[] }>(`/api/flow/${requestId}`);
      set({ flowRecords: result.flowRecords });
    } finally {
      set({ flowRecordsLoading: false });
    }
  },

  quotas: [],
  quotasLoading: false,
  fetchQuotas: async () => {
    set({ quotasLoading: true });
    try {
      const result = await apiFetch<QuotaConfig[]>('/api/quotas');
      set({ quotas: result });
    } finally {
      set({ quotasLoading: false });
    }
  },
  createQuota: async (data) => {
    const result = await apiFetch<QuotaConfig>('/api/quotas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    set((state) => ({ quotas: [result, ...state.quotas] }));
    return result;
  },
  updateQuota: async (id, data) => {
    const result = await apiFetch<QuotaConfig>(`/api/quotas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    set((state) => ({
      quotas: state.quotas.map((q) => (q.id === id ? result : q)),
    }));
  },

  checkins: [],
  checkinsLoading: false,
  fetchCheckins: async (filter) => {
    set({ checkinsLoading: true });
    try {
      const params = new URLSearchParams();
      if (filter?.studentId) params.set('studentId', filter.studentId);
      if (filter?.requestId) params.set('requestId', filter.requestId);
      if (filter?.startDate) params.set('dateStart', filter.startDate);
      if (filter?.endDate) params.set('dateEnd', filter.endDate);
      const qs = params.toString();
      const result = await apiFetch<CheckInRecord[]>(`/api/checkins${qs ? `?${qs}` : ''}`);
      set({ checkins: result });
    } finally {
      set({ checkinsLoading: false });
    }
  },
  createCheckin: async (data) => {
    const result = await apiFetch<CheckInRecord>('/api/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    set((state) => ({ checkins: [result, ...state.checkins] }));
    return result;
  },

  notifications: [],
  notificationsLoading: false,
  unreadCount: 0,
  fetchNotifications: async () => {
    set({ notificationsLoading: true });
    try {
      const result = await apiFetch<{ items: Notification[]; total: number; unreadCount: number }>('/api/notifications');
      set({ notifications: result.items, unreadCount: result.unreadCount });
    } finally {
      set({ notificationsLoading: false });
    }
  },
  markRead: async (id) => {
    await apiFetch<Notification>(`/api/notifications/${id}/read`, { method: 'POST' });
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  batchResult: null,
  batchLoading: false,
  processBatch: async (operation, requestIds, remark) => {
    set({ batchLoading: true });
    try {
      const result = await apiFetch<BatchResult>('/api/batch/process', {
        method: 'POST',
        body: JSON.stringify({ operation, requestIds, remark }),
      });
      set({ batchResult: result });
    } finally {
      set({ batchLoading: false });
    }
  },
  retryFailed: async (requestId) => {
    set({ batchLoading: true });
    try {
      const retryResult = await apiFetch<BatchResult>('/api/batch/retry', {
        method: 'POST',
        body: JSON.stringify({ requestId, operation: 'approve' }),
      });

      set((state) => {
        const prev = state.batchResult;
        if (!prev) {
          return { batchResult: retryResult };
        }

        const retryFailedItem = retryResult.failures.find((f) => f.requestId === requestId);
        let newFailures = [...prev.failures];
        let newSuccessCount = prev.successCount;
        let newSuccessIds = [...prev.successIds];

        if (retryFailedItem) {
          newFailures = newFailures.map((f) =>
            f.requestId === requestId
              ? { ...f, reason: retryFailedItem.reason, retryable: retryFailedItem.retryable }
              : f,
          );
        } else if (retryResult.successCount > 0 && retryResult.successIds.includes(requestId)) {
          newFailures = newFailures.filter((f) => f.requestId !== requestId);
          newSuccessCount = prev.successCount + retryResult.successCount;
          newSuccessIds = [...prev.successIds, ...retryResult.successIds];
        }

        return {
          batchResult: {
            totalCount: prev.totalCount,
            successCount: newSuccessCount,
            failCount: newFailures.length,
            successIds: newSuccessIds,
            failures: newFailures,
          },
        };
      });
    } finally {
      set({ batchLoading: false });
    }
  },

  seatUtilization: [],
  seatUtilizationLoading: false,
  fetchSeatUtilization: async () => {
    set({ seatUtilizationLoading: true });
    try {
      const result = await apiFetch<SeatUtilizationDetail[]>('/api/details/seat-utilization');
      set({ seatUtilization: result });
    } finally {
      set({ seatUtilizationLoading: false });
    }
  },

  identityFailures: [],
  identityFailuresLoading: false,
  fetchIdentityFailures: async () => {
    set({ identityFailuresLoading: true });
    try {
      const result = await apiFetch<IdentityFailureDetail[]>('/api/details/identity-failures');
      set({ identityFailures: result });
    } finally {
      set({ identityFailuresLoading: false });
    }
  },

  processingRecords: [],
  processingRecordsLoading: false,
  fetchProcessingRecords: async () => {
    set({ processingRecordsLoading: true });
    try {
      const result = await apiFetch<ProcessingRecordDetail[]>('/api/details/processing-records');
      set({ processingRecords: result });
    } finally {
      set({ processingRecordsLoading: false });
    }
  },

  exportLoading: false,
  exportData: async (filter) => {
    set({ exportLoading: true });
    try {
      const res = await fetch('/api/details/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: filter.type,
          dateRange: filter.startDate && filter.endDate
            ? { start: filter.startDate, end: filter.endDate }
            : undefined,
          format: filter.format,
        }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${filter.type}_${Date.now()}.${filter.format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      set({ exportLoading: false });
    }
  },
}));
