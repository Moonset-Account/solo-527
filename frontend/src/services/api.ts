import axios from 'axios';
import type {
  OverviewMetrics,
  EnergyTrendPoint,
  EnergyBreakdownItem,
  AlarmItem,
  WorkorderItem,
  Device,
  ScheduleItem,
  AnomalyPoint,
  FilterOptions,
  WeekCompareData
} from '../types';

const API_BASE = 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const apiService = {
  async getOverview(roomIds?: string[], weekType?: string): Promise<OverviewMetrics> {
    const params: Record<string, string> = {};
    if (roomIds?.length) params.room_ids = roomIds.join(',');
    if (weekType) params.week_type = weekType;
    const { data } = await api.get('/overview', { params });
    return data;
  },

  async getEnergyTrend(params: {
    startTime?: string;
    endTime?: string;
    roomIds?: string[];
    categories?: string[];
    includeMaintenance?: boolean;
    weekType?: string;
  }): Promise<EnergyTrendPoint[]> {
    const queryParams: Record<string, string | boolean> = {};
    if (params.startTime) queryParams.start_time = params.startTime;
    if (params.endTime) queryParams.end_time = params.endTime;
    if (params.roomIds?.length) queryParams.room_ids = params.roomIds.join(',');
    if (params.categories?.length) queryParams.categories = params.categories.join(',');
    if (params.includeMaintenance !== undefined) queryParams.include_maintenance = params.includeMaintenance;
    if (params.weekType) queryParams.week_type = params.weekType;
    
    const { data } = await api.get('/energy/trend', { params: queryParams });
    return data;
  },

  async getEnergyBreakdown(params: {
    startTime?: string;
    endTime?: string;
    roomIds?: string[];
    includeMaintenance?: boolean;
    weekType?: string;
  }): Promise<EnergyBreakdownItem[]> {
    const queryParams: Record<string, string | boolean> = {};
    if (params.startTime) queryParams.start_time = params.startTime;
    if (params.endTime) queryParams.end_time = params.endTime;
    if (params.roomIds?.length) queryParams.room_ids = params.roomIds.join(',');
    if (params.includeMaintenance !== undefined) queryParams.include_maintenance = params.includeMaintenance;
    if (params.weekType) queryParams.week_type = params.weekType;
    
    const { data } = await api.get('/energy/breakdown', { params: queryParams });
    return data;
  },

  async compareWeeks(params: {
    examWeekStart?: string;
    normalWeekStart?: string;
    roomIds?: string[];
    includeMaintenance?: boolean;
  }): Promise<WeekCompareData> {
    const queryParams: Record<string, string | boolean> = {};
    if (params.examWeekStart) queryParams.exam_week_start = params.examWeekStart;
    if (params.normalWeekStart) queryParams.normal_week_start = params.normalWeekStart;
    if (params.roomIds?.length) queryParams.room_ids = params.roomIds.join(',');
    if (params.includeMaintenance !== undefined) queryParams.include_maintenance = params.includeMaintenance;
    
    const { data } = await api.get('/energy/compare', { params: queryParams });
    return data;
  },

  async getAnomalies(params: {
    startTime?: string;
    endTime?: string;
    severity?: string;
    roomIds?: string[];
    weekType?: string;
    includeMaintenance?: boolean;
  }): Promise<AnomalyPoint[]> {
    const queryParams: Record<string, string | boolean> = {};
    if (params.startTime) queryParams.start_time = params.startTime;
    if (params.endTime) queryParams.end_time = params.endTime;
    if (params.severity) queryParams.severity = params.severity;
    if (params.roomIds?.length) queryParams.room_ids = params.roomIds.join(',');
    if (params.weekType) queryParams.week_type = params.weekType;
    if (params.includeMaintenance !== undefined) queryParams.include_maintenance = params.includeMaintenance;
    
    const { data } = await api.get('/energy/anomalies', { params: queryParams });
    return data;
  },

  async getAnomalyDetail(id: string): Promise<AnomalyPoint> {
    const { data } = await api.get(`/energy/anomalies/${id}`);
    return data;
  },

  async addAnomalyComment(id: string, comment: string): Promise<void> {
    await api.post(`/energy/anomalies/${id}/comment`, { comment });
  },

  async getAlarms(params?: {
    status?: string;
    level?: string;
    limit?: number;
    roomIds?: string[];
  }): Promise<AlarmItem[]> {
    const queryParams: Record<string, string | number> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.level) queryParams.level = params.level;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.roomIds?.length) queryParams.room_ids = params.roomIds.join(',');
    const { data } = await api.get('/alarms', { params: queryParams });
    return data;
  },

  async getWorkorders(params?: {
    status?: string;
    priority?: string;
    limit?: number;
    roomIds?: string[];
  }): Promise<WorkorderItem[]> {
    const queryParams: Record<string, string | number> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.priority) queryParams.priority = params.priority;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.roomIds?.length) queryParams.room_ids = params.roomIds.join(',');
    const { data } = await api.get('/workorders', { params: queryParams });
    return data;
  },

  async getDeviceStatus(roomIds?: string[]): Promise<Device[]> {
    const params = roomIds?.length ? { room_ids: roomIds.join(',') } : {};
    const { data } = await api.get('/devices/status', { params });
    return data;
  },

  async getSchedules(params: {
    startTime?: string;
    endTime?: string;
    roomIds?: string[];
    weekType?: string;
  }): Promise<ScheduleItem[]> {
    const queryParams: Record<string, string> = {};
    if (params.startTime) queryParams.start_time = params.startTime;
    if (params.endTime) queryParams.end_time = params.endTime;
    if (params.roomIds?.length) queryParams.room_ids = params.roomIds.join(',');
    if (params.weekType) queryParams.week_type = params.weekType;
    
    const { data } = await api.get('/schedule', { params: queryParams });
    return data;
  },

  async getFilterOptions(): Promise<FilterOptions> {
    const { data } = await api.get('/filter/options');
    return data;
  },

  async exportPDF(params: {
    startTime: string;
    endTime: string;
    roomIds?: string[];
    includeMaintenance?: boolean;
    weekType?: string;
    includeCharts?: boolean;
  }): Promise<Blob> {
    const { data } = await api.post('/export/pdf', {
      start_time: params.startTime,
      end_time: params.endTime,
      room_ids: params.roomIds?.join(','),
      include_maintenance: params.includeMaintenance,
      week_type: params.weekType,
      include_charts: params.includeCharts
    }, {
      responseType: 'blob',
    });
    return data;
  }
};
