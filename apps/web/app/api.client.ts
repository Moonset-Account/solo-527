import type {
  Seat,
  UsageRecord,
  UsageTrendPoint,
  Reminder,
  ReminderBatch,
  PaymentCallback,
  AuditLog,
  OperationLog,
  ExportTask,
  PaginationResult,
  RiskStatistics,
} from '@seat-platform/shared';
import { API_BASE_URL } from './config';

export interface ListQuery {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  query?: ListQuery
): Promise<T> {
  const url = new URL(`${API_BASE_URL}/api${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || `请求失败: ${res.status}`);
  }

  return data as T;
}

export const api = {
  stats: {
    overview: () => request<any>('/stats/overview'),
  },
  seats: {
    list: (query?: ListQuery) => request<PaginationResult<Seat>>('/seats', undefined, query),
    get: (id: string) => request<Seat>(`/seats/${id}`),
    create: (data: unknown) => request<Seat>('/seats', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => request<Seat>(`/seats/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<{ success: boolean }>(`/seats/${id}`, { method: 'DELETE' }),
  },
  usage: {
    list: (seatId: string, query?: ListQuery) =>
      request<PaginationResult<UsageRecord>>(`/usage/seats/${seatId}`, undefined, query),
    trend: (query: { startDate: string; endDate: string; seatId?: string; granularity?: string }) =>
      request<UsageTrendPoint[]>('/usage/trend', undefined, query),
    abnormal: (query?: ListQuery) =>
      request<PaginationResult<UsageRecord>>('/usage/abnormal', undefined, query),
  },
  reminders: {
    list: (query?: ListQuery) => request<PaginationResult<Reminder>>('/reminders', undefined, query),
    batches: (query?: ListQuery) => request<PaginationResult<ReminderBatch>>('/reminders/batches', undefined, query),
    get: (id: string) => request<Reminder>(`/reminders/${id}`),
    create: (data: unknown) => request<Reminder>('/reminders', { method: 'POST', body: JSON.stringify(data) }),
    batchSend: (data: unknown) => request<ReminderBatch>('/reminders/batch', { method: 'POST', body: JSON.stringify(data) }),
    dismiss: (id: string) => request<Reminder>(`/reminders/${id}/dismiss`, { method: 'POST' }),
  },
  payments: {
    list: (query?: ListQuery) => request<PaginationResult<PaymentCallback>>('/payments', undefined, query),
    get: (id: string) => request<PaymentCallback>(`/payments/${id}`),
    update: (id: string, data: unknown) =>
      request<PaymentCallback>(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    retry: (id: string, data?: { remark?: string }) =>
      request<PaymentCallback>(`/payments/${id}/retry`, { method: 'POST', body: JSON.stringify(data || {}) }),
    riskStats: () => request<RiskStatistics>('/payments/statistics/risk'),
  },
  logs: {
    audit: (query?: ListQuery) => request<PaginationResult<AuditLog>>('/logs/audit', undefined, query),
    operations: (query?: ListQuery) => request<PaginationResult<OperationLog>>('/logs/operations', undefined, query),
  },
  exports: {
    list: (query?: ListQuery) => request<PaginationResult<ExportTask>>('/exports', undefined, query),
    get: (id: string) => request<ExportTask>(`/exports/${id}`),
    create: (data: unknown) => request<ExportTask>('/exports', { method: 'POST', body: JSON.stringify(data) }),
    downloadUrl: (id: string) => `${API_BASE_URL}/api/exports/${id}/download`,
  },
};
