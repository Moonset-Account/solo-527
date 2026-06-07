import type { HeatmapData, QueuePrediction, TicketAnalysis, ConversionFunnel, KPIData, RawRecord, DataQualityReport } from '@/types';

const API_BASE = '/api';

async function request<T>(url: string, params?: Record<string, any>): Promise<T> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => query.append(key, v));
      } else if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
  }
  const fullUrl = params && Object.keys(params).length ? `${API_BASE}${url}?${query.toString()}` : `${API_BASE}${url}`;
  const res = await fetch(fullUrl);
  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText}`);
  }
  return res.json();
}

export interface ApiResponse<T> {
  data: T;
  cached?: boolean;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  updatedAt: string;
}

export interface FilterQuery {
  startTime?: string;
  endTime?: string;
  entrance?: string[];
  areaId?: string[];
  ticketType?: string[];
  activity?: string[];
}

export const api = {
  getKPI(params?: FilterQuery) {
    return request<ApiResponse<KPIData>>('/kpi', params);
  },

  getHeatmap(params?: FilterQuery) {
    return request<ApiResponse<HeatmapData[]>>('/heatmap', params);
  },

  getQueuePrediction(params?: FilterQuery) {
    return request<ApiResponse<QueuePrediction[]>>('/queue-prediction', params);
  },

  getTicketAnalysis(params?: FilterQuery) {
    return request<ApiResponse<TicketAnalysis[]>>('/ticket-analysis', params);
  },

  getConversionFunnel(params?: FilterQuery) {
    return request<ApiResponse<ConversionFunnel[]>>('/conversion-funnel', params);
  },

  getRawRecords(params?: FilterQuery & { page?: number; pageSize?: number; source?: string }) {
    return request<PaginatedResponse<RawRecord>>('/raw-records', params);
  },

  getDataQuality(params?: FilterQuery) {
    return request<ApiResponse<DataQualityReport>>('/data-quality', params);
  }
};
