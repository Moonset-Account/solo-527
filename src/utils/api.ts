const API_BASE = '/api';

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  enterpriseIds?: string[];
  gateIds?: string[];
  visitorTypes?: string[];
  laneIds?: string[];
}

export interface OverviewResult {
  totalVisitors: number;
  totalAbnormal: number;
  abnormalRate: number;
  peakHour: string;
  peakVisitorCount: number;
  abnormalEvents: Array<{
    id: string;
    level: 'critical' | 'warning' | 'info';
    time: string;
    description: string;
    hasRemark: boolean;
    gateName: string;
    enterpriseName: string;
  }>;
}

export interface HeatmapPoint {
  gateId: string;
  gateName: string;
  hour: number;
  count: number;
}

export interface RankItem {
  enterpriseId: string;
  enterpriseName: string;
  total: number;
  abnormal: number;
  abnormalRate: number;
  rank: number;
}

export interface ExceptionItem {
  id: string;
  time: string;
  plateNumber: string;
  idCard: string;
  visitorType: string;
  gateName: string;
  lane: string;
  enterpriseName: string;
  reason: string;
  level: 'critical' | 'warning' | 'info';
  remark?: string;
  operator?: string;
}

export interface ExceptionListResult {
  total: number;
  list: ExceptionItem[];
}

export interface TrendPoint {
  time: string;
  count: number;
  abnormal: number;
  isMissing: boolean;
  isPeak: boolean;
  remark?: string;
}

export interface Dimensions {
  enterprises: Array<{ id: string; name: string; industry: string; building: string }>;
  gates: Array<{ id: string; name: string; laneCount: number; isVehicle: boolean }>;
  lanes: Array<{ id: string; gateId: string; name: string; direction: string }>;
  visitorTypes: Array<{ id: string; name: string }>;
}

function buildQueryString(params: Record<string, any>): string {
  const qs: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        qs.push(`${key}=${encodeURIComponent(value.join(','))}`);
      }
    } else {
      qs.push(`${key}=${encodeURIComponent(value)}`);
    }
  }
  return qs.length > 0 ? '?' + qs.join('&') : '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  getOverview: (params: FilterParams): Promise<OverviewResult> =>
    request<OverviewResult>(`/aggregate/overview${buildQueryString(params)}`),

  getHeatmap: (params: FilterParams): Promise<HeatmapPoint[]> =>
    request<HeatmapPoint[]>(`/aggregate/heatmap${buildQueryString(params)}`),

  getRank: (params: FilterParams, sortBy: 'total' | 'abnormal' = 'total', limit = 10): Promise<RankItem[]> =>
    request<RankItem[]>(`/aggregate/rank${buildQueryString({ ...params, sortBy, limit })}`),

  getExceptions: (params: FilterParams, page = 1, pageSize = 20): Promise<ExceptionListResult> =>
    request<ExceptionListResult>(`/aggregate/exceptions${buildQueryString({ ...params, page, pageSize })}`),

  getTrend: (params: FilterParams, granularity: 'hour' | 'day' = 'hour'): Promise<TrendPoint[]> =>
    request<TrendPoint[]>(`/aggregate/trend${buildQueryString({ ...params, granularity })}`),

  getDimensions: (): Promise<Dimensions> =>
    request<Dimensions>('/aggregate/dimensions'),

  updateRemark: (id: string, remark: string): Promise<{ success: boolean }> =>
    request(`/aggregate/exceptions/${id}/remark`, {
      method: 'POST',
      body: JSON.stringify({ remark }),
    }),

  createExport: (format: 'xlsx' | 'csv', params: FilterParams): Promise<{ taskId: string; status: string }> =>
    request('/export/create', {
      method: 'POST',
      body: JSON.stringify({ format, ...params }),
    }),

  getExportStatus: (taskId: string): Promise<any> =>
    request(`/export/${taskId}/status`),

  listExportTasks: (): Promise<any[]> =>
    request('/export/tasks'),
};
