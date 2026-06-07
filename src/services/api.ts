import axios from 'axios';
import {
  Hazard,
  DashboardStats,
  ClosureRateTrendItem,
  OverdueRankingItem,
  FloorHeatmapItem,
  TeamTrendItem,
  Team,
  HazardType,
  InspectionPoint,
  Fine,
  FineStatistics,
  AppealRecord,
  FilterCriteria,
  PaginatedResponse,
  WeatherRecord,
  StopWorkRecord,
  User,
} from '@/types';
import { saveAs } from 'file-saver';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const auth = JSON.parse(authStorage);
      if (auth.state?.token) {
        config.headers.Authorization = `Bearer ${auth.state.token}`;
      }
    } catch (e) {
      console.error('Failed to parse auth storage', e);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const buildFilterParams = (filters: FilterCriteria = {}): Record<string, any> => {
  const params: Record<string, any> = {};
  
  if (filters.dateRange?.length === 2) {
    params.start_date = filters.dateRange[0];
    params.end_date = filters.dateRange[1];
  }
  if (filters.floors?.length) {
    params.floors = filters.floors;
  }
  if (filters.teamIds?.length) {
    params.team_ids = filters.teamIds;
  }
  if (filters.typeIds?.length) {
    params.type_ids = filters.typeIds;
  }
  if (filters.statuses?.length) {
    params.statuses = filters.statuses;
  }
  if (filters.levels?.length) {
    params.levels = filters.levels;
  }
  if (filters.keyword) {
    params.keyword = filters.keyword;
  }
  
  return params;
};

export const authApi = {
  login: async (username: string, password: string): Promise<{ access_token: string; user: User }> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const dashboardApi = {
  getStats: async (filters: FilterCriteria = {}): Promise<DashboardStats> => {
    const params = buildFilterParams(filters);
    const response = await api.get('/dashboard/stats', { params });
    const data = response.data;
    return {
      total: data.total,
      pending: data.pending,
      inProgress: data.in_progress,
      underReview: data.under_review,
      closed: data.closed,
      overdue: data.overdue,
      closureRate: data.closure_rate,
      overdueRate: data.overdue_rate,
      totalConfirmedFine: data.total_confirmed_fine,
      totalPendingFine: data.total_pending_fine,
    };
  },

  getClosureRateTrend: async (days: number = 14, filters: FilterCriteria = {}): Promise<ClosureRateTrendItem[]> => {
    const params = buildFilterParams(filters);
    params.days = days;
    const response = await api.get('/dashboard/closure-rate-trend', { params });
    return response.data.map((item: any) => ({
      date: item.date,
      rate: item.closure_rate,
      closed: item.closed_hazards,
      total: item.new_hazards,
    }));
  },

  getOverdueRanking: async (limit: number = 10, filters: FilterCriteria = {}): Promise<OverdueRankingItem[]> => {
    const params = buildFilterParams(filters);
    params.limit = limit;
    const response = await api.get('/dashboard/overdue-ranking', { params });
    return response.data.map((item: any) => ({
      teamId: item.team_id,
      teamName: item.team_name,
      count: item.overdue_count,
      amount: 0,
    }));
  },

  getFloorHeatmap: async (filters: FilterCriteria = {}): Promise<FloorHeatmapItem[]> => {
    const params = buildFilterParams(filters);
    delete params.statuses;
    delete params.keyword;
    delete params.start_date;
    delete params.end_date;
    const response = await api.get('/dashboard/floor-heatmap', { params });
    return response.data.map((item: any) => ({
      floor: item.floor,
      count: item.hazard_count,
      points: [
        { name: '一般隐患', count: item.level_1_count },
        { name: '较大隐患', count: item.level_2_count },
        { name: '重大隐患', count: item.level_3_count },
      ],
    }));
  },

  getTeamTrend: async (days: number = 7, filters: FilterCriteria = {}): Promise<TeamTrendItem[]> => {
    const params = buildFilterParams(filters);
    params.days = days;
    delete params.team_ids;
    const response = await api.get('/dashboard/team-trend', { params });
    return response.data.map((item: any) => ({
      team: item.team_name,
      teamId: item.team_id,
      date: item.date,
      completed: 0,
      total: item.hazard_count,
    }));
  },
};

export const hazardApi = {
  getList: async (
    page: number = 1,
    pageSize: number = 10,
    filters: FilterCriteria = {}
  ): Promise<PaginatedResponse<Hazard>> => {
    const params = buildFilterParams(filters);
    params.page = page;
    params.page_size = pageSize;
    const response = await api.get('/hazards', { params });
    const data = response.data;
    
    const items = data.items.map((item: any) => ({
      ...item,
      isOverdue: item.is_overdue,
      fineAmount: item.fine_amount,
      fineStatus: item.fine_status,
      rejectReasons: item.reject_reasons,
      discoveryPhotos: item.discovery_photos,
      rectificationRecords: item.rectification_records,
      appealRecords: item.appeal_records,
      inspectionPoint: item.inspection_point,
    }));
    
    return {
      items,
      total: data.total,
      page: data.page,
      pageSize: data.page_size,
    };
  },

  getById: async (id: string): Promise<Hazard | undefined> => {
    try {
      const response = await api.get(`/hazards/${id}`);
      const item = response.data;
      return {
        ...item,
        isOverdue: item.is_overdue,
        fineAmount: item.fine_amount,
        fineStatus: item.fine_status,
        rejectReasons: item.reject_reasons,
        discoveryPhotos: item.discovery_photos,
        rectificationRecords: item.rectification_records,
        appealRecords: item.appeal_records,
        inspectionPoint: item.inspection_point,
      };
    } catch (e) {
      console.error('Failed to get hazard detail', e);
      return undefined;
    }
  },

  submitRectification: async (hazardId: string, data: { description: string; photoIds: string[] }) => {
    const response = await api.post(`/hazards/${hazardId}/submit-rectification`, data);
    return response.data;
  },

  reviewRectification: async (hazardId: string, data: { result: 'pass' | 'reject'; reason?: string }) => {
    const response = await api.post(`/hazards/${hazardId}/review`, data);
    return response.data;
  },

  submitAppeal: async (hazardId: string, data: { reason: string }) => {
    const response = await api.post(`/hazards/${hazardId}/appeal`, data);
    return response.data;
  },

  getWeatherEvidence: async (hazardId: string, startDate: string, endDate: string): Promise<WeatherRecord[]> => {
    const response = await api.get(`/hazards/${hazardId}/weather-evidence`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getStopWorkEvidence: async (hazardId: string, startDate: string, endDate: string): Promise<StopWorkRecord[]> => {
    const response = await api.get(`/hazards/${hazardId}/stop-work-evidence`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },
};

export const fineApi = {
  getList: async (
    page: number = 1,
    pageSize: number = 10,
    filters: FilterCriteria & { status?: string } = {}
  ): Promise<PaginatedResponse<Fine>> => {
    const params = buildFilterParams(filters);
    params.page = page;
    params.page_size = pageSize;
    if (filters.status) {
      params.status = filters.status;
    }
    const response = await api.get('/fines', { params });
    return response.data;
  },

  confirmFine: async (fineId: string) => {
    const response = await api.post(`/fines/${fineId}/confirm`);
    return response.data;
  },

  rejectFine: async (fineId: string, reason: string) => {
    const response = await api.post(`/fines/${fineId}/reject?reason=${encodeURIComponent(reason)}`);
    return response.data;
  },

  getStatistics: async (filters: FilterCriteria = {}): Promise<FineStatistics> => {
    const params = buildFilterParams(filters);
    const response = await api.get('/fines/statistics', { params });
    const data = response.data;
    return {
      totalConfirmed: data.total_confirmed,
      totalPending: data.total_pending,
      byTeam: data.by_team,
      byType: data.by_type,
      byMonth: data.by_month,
    };
  },
};

export const appealApi = {
  getList: async (
    page: number = 1,
    pageSize: number = 10,
    filters: FilterCriteria & { status?: string } = {}
  ): Promise<PaginatedResponse<AppealRecord>> => {
    const params = buildFilterParams(filters);
    params.page = page;
    params.page_size = pageSize;
    if (filters.status) {
      params.status = filters.status;
    }
    const response = await api.get('/appeals', { params });
    return response.data;
  },

  handleAppeal: async (appealId: string, data: { result: 'approved' | 'rejected'; remark?: string }) => {
    const response = await api.post(`/appeals/${appealId}/handle`, data);
    return response.data;
  },
};

export const masterDataApi = {
  getTeams: async (): Promise<Team[]> => {
    const response = await api.get('/master/teams');
    return response.data;
  },

  getHazardTypes: async (): Promise<HazardType[]> => {
    const response = await api.get('/master/hazard-types');
    return response.data;
  },

  getInspectionPoints: async (): Promise<InspectionPoint[]> => {
    const response = await api.get('/master/inspection-points');
    return response.data;
  },

  getFloors: async (): Promise<number[]> => {
    const response = await api.get('/master/floors');
    return response.data;
  },
};

export const exportApi = {
  exportHazards: async (filters: FilterCriteria = {}): Promise<Blob> => {
    const params = buildFilterParams(filters);
    params.format = 'csv';
    const response = await api.get('/export/hazards', {
      params,
      responseType: 'blob',
    });
    return new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  },

  exportFines: async (filters: FilterCriteria & { status?: string } = {}): Promise<Blob> => {
    const params = buildFilterParams(filters);
    if (filters.status) {
      params.status = filters.status;
    }
    params.format = 'csv';
    const response = await api.get('/export/fines', {
      params,
      responseType: 'blob',
    });
    return new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  },
};

export default api;
