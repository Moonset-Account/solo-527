import apiClient from './client';
import type {
  DashboardStats,
  TrendDataPoint,
  DeviceAlert,
  AlertStatus,
  AlertLevel,
  Strategy,
  StrategyStatus,
  RevenueRecord,
  SubsidyRecord,
  MeterZone,
  PaginatedResponse,
} from '../../shared/types';

export const dashboardApi = {
  getStats: () => apiClient.get<never, DashboardStats>('/dashboard/stats'),
  getTrends: (days: number = 7) => apiClient.get<never, TrendDataPoint[]>('/dashboard/trends', { params: { days } }),
};

export const alertsApi = {
  getList: (params: {
    page?: number;
    pageSize?: number;
    status?: AlertStatus;
    level?: AlertLevel;
    deviceId?: string;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get<never, PaginatedResponse<DeviceAlert>>('/alerts', { params }),

  getDetail: (id: string) => apiClient.get<never, DeviceAlert>(`/alerts/${id}`),

  updateStatus: (id: string, status: AlertStatus, remark: string, operatorId: string) =>
    apiClient.put<never, { success: boolean; data: DeviceAlert }>(`/alerts/${id}/status`, {
      status,
      remark,
      operatorId,
    }),

  createWebhook: (data: {
    deviceId: string;
    deviceName?: string;
    alertLevel: AlertLevel;
    alertType?: string;
    title: string;
    description?: string;
  }) => apiClient.post<never, { success: boolean; data: DeviceAlert }>('/alerts/webhook', data),
};

export const strategiesApi = {
  getList: (params: {
    page?: number;
    pageSize?: number;
    status?: StrategyStatus;
    keyword?: string;
  }) => apiClient.get<never, PaginatedResponse<Strategy>>('/strategies', { params }),

  getDetail: (id: string) => apiClient.get<never, Strategy>(`/strategies/${id}`),

  create: (data: {
    name: string;
    description?: string;
    triggerCondition: Record<string, any>;
    action: Record<string, any>;
    status?: StrategyStatus;
    createdById: string;
  }) => apiClient.post<never, { success: boolean; data: Strategy }>('/strategies', data),

  update: (id: string, data: Partial<Omit<Strategy, 'id' | 'createdAt' | 'createdById'>>) =>
    apiClient.put<never, { success: boolean; data: Strategy }>(`/strategies/${id}`, data),

  toggle: (id: string) =>
    apiClient.put<never, { success: boolean; data: Strategy }>(`/strategies/${id}/toggle`),
};

export const revenueApi = {
  getSummary: () =>
    apiClient.get<
      never,
      {
        totalChargeEnergy: number;
        totalDischargeEnergy: number;
        totalRevenue: number;
        totalSubsidy: number;
        gapCount: number;
        totalRecords: number;
      }
    >('/revenue/summary'),

  getDetails: (params: {
    page?: number;
    pageSize?: number;
    zoneId?: string;
    startDate?: string;
    endDate?: string;
    hasGap?: boolean;
  }) => apiClient.get<never, PaginatedResponse<RevenueRecord>>('/revenue/details', { params }),

  getGaps: () =>
    apiClient.get<
      never,
      {
        totalGaps: number;
        totalGapDuration: number;
        averageGapDuration: number;
        reasonStats: Record<string, number>;
        personStats: Record<string, number>;
        details: RevenueRecord[];
      }
    >('/revenue/gaps'),
};

export const subsidiesApi = {
  getList: (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
    zoneId?: string;
    period?: string;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get<never, PaginatedResponse<SubsidyRecord>>('/subsidies', { params }),
};

export const metersApi = {
  getZones: (params?: {
    status?: string;
    keyword?: string;
  }) => apiClient.get<never, MeterZone[]>('/meters', { params }),
};
