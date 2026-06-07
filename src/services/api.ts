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
} from '@/types';
import {
  mockHazards,
  mockDashboardStats,
  mockClosureRateTrend,
  mockOverdueRanking,
  mockFloorHeatmap,
  mockTeamTrend,
  mockTeams,
  mockHazardTypes,
  mockInspectionPoints,
  mockFines,
  mockFineStatistics,
  mockAppeals,
  mockWeatherRecords,
  mockStopWorkRecords,
} from '@/mock/data';
import dayjs from 'dayjs';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const applyFilters = <T extends { team?: { id: string }; type?: { id: string }; status?: string; level?: string; inspectionPoint?: { floor: number }; discoveredAt?: string }>(
  items: T[],
  filters: FilterCriteria
): T[] => {
  return items.filter((item) => {
    if (filters.teamIds?.length && item.team?.id && !filters.teamIds.includes(item.team.id)) {
      return false;
    }
    if (filters.typeIds?.length && item.type?.id && !filters.typeIds.includes(item.type.id)) {
      return false;
    }
    if (filters.statuses?.length && item.status && !filters.statuses.includes(item.status as any)) {
      return false;
    }
    if (filters.levels?.length && item.level && !filters.levels.includes(item.level as any)) {
      return false;
    }
    if (filters.floors?.length && item.inspectionPoint?.floor !== undefined && !filters.floors.includes(item.inspectionPoint.floor)) {
      return false;
    }
    if (filters.dateRange && item.discoveredAt) {
      const discovered = dayjs(item.discoveredAt);
      const start = dayjs(filters.dateRange[0]);
      const end = dayjs(filters.dateRange[1]);
      if (discovered.isBefore(start) || discovered.isAfter(end)) {
        return false;
      }
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      const str = JSON.stringify(item).toLowerCase();
      if (!str.includes(keyword)) {
        return false;
      }
    }
    return true;
  });
};

export const dashboardApi = {
  getStats: async (filters: FilterCriteria = {}): Promise<DashboardStats> => {
    await delay(300);
    const filtered = applyFilters(mockHazards, filters);
    const closed = filtered.filter((h) => h.status === 'closed').length;
    const overdue = filtered.filter((h) => h.isOverdue).length;
    const confirmedFines = filtered.filter((h) => h.fineStatus === 'confirmed');
    const pendingFines = filtered.filter((h) => h.fineStatus === 'pending');
    
    return {
      total: filtered.length,
      pending: filtered.filter((h) => h.status === 'pending').length,
      inProgress: filtered.filter((h) => h.status === 'in_progress').length,
      underReview: filtered.filter((h) => h.status === 'under_review').length,
      closed,
      overdue,
      closureRate: filtered.length > 0 ? Math.round((closed / filtered.length) * 100) : 0,
      overdueRate: filtered.length > 0 ? Math.round((overdue / filtered.length) * 100) : 0,
      totalConfirmedFine: confirmedFines.reduce((sum, h) => sum + (h.fineAmount || 0), 0),
      totalPendingFine: pendingFines.reduce((sum, h) => sum + (h.fineAmount || 0), 0),
    };
  },

  getClosureRateTrend: async (days: number = 14, filters: FilterCriteria = {}): Promise<ClosureRateTrendItem[]> => {
    await delay(200);
    return mockClosureRateTrend.slice(-days);
  },

  getOverdueRanking: async (limit: number = 10, filters: FilterCriteria = {}): Promise<OverdueRankingItem[]> => {
    await delay(200);
    return mockOverdueRanking.slice(0, limit);
  },

  getFloorHeatmap: async (filters: FilterCriteria = {}): Promise<FloorHeatmapItem[]> => {
    await delay(200);
    return mockFloorHeatmap;
  },

  getTeamTrend: async (days: number = 7, filters: FilterCriteria = {}): Promise<TeamTrendItem[]> => {
    await delay(200);
    return mockTeamTrend;
  },
};

export const hazardApi = {
  getList: async (
    page: number = 1,
    pageSize: number = 10,
    filters: FilterCriteria = {}
  ): Promise<PaginatedResponse<Hazard>> => {
    await delay(300);
    const filtered = applyFilters(mockHazards, filters);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    
    return {
      items,
      total: filtered.length,
      page,
      pageSize,
    };
  },

  getById: async (id: string): Promise<Hazard | undefined> => {
    await delay(200);
    return mockHazards.find((h) => h.id === id);
  },

  submitRectification: async (hazardId: string, data: { description: string; photoIds: string[] }) => {
    await delay(300);
    return { success: true };
  },

  reviewRectification: async (hazardId: string, data: { result: 'pass' | 'reject'; reason?: string }) => {
    await delay(300);
    return { success: true };
  },

  submitAppeal: async (hazardId: string, data: { reason: string }) => {
    await delay(300);
    return { success: true };
  },

  getWeatherEvidence: async (hazardId: string, startDate: string, endDate: string): Promise<WeatherRecord[]> => {
    await delay(200);
    return mockWeatherRecords.filter((w) => {
      const date = dayjs(w.date);
      return date.isAfter(dayjs(startDate).subtract(1, 'day')) && date.isBefore(dayjs(endDate).add(1, 'day'));
    });
  },

  getStopWorkEvidence: async (startDate: string, endDate: string): Promise<StopWorkRecord[]> => {
    await delay(200);
    return mockStopWorkRecords.filter((s) => {
      const start = dayjs(s.startDate);
      const end = dayjs(s.endDate);
      const targetStart = dayjs(startDate);
      const targetEnd = dayjs(endDate);
      return start.isBefore(targetEnd) && end.isAfter(targetStart);
    });
  },
};

export const fineApi = {
  getList: async (
    page: number = 1,
    pageSize: number = 10,
    filters: FilterCriteria & { status?: string } = {}
  ): Promise<PaginatedResponse<Fine>> => {
    await delay(300);
    let filtered = [...mockFines];
    if (filters.status) {
      filtered = filtered.filter((f) => f.status === filters.status);
    }
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    
    return {
      items,
      total: filtered.length,
      page,
      pageSize,
    };
  },

  confirmFine: async (fineId: string) => {
    await delay(300);
    return { success: true };
  },

  rejectFine: async (fineId: string, reason: string) => {
    await delay(300);
    return { success: true };
  },

  getStatistics: async (filters: FilterCriteria = {}): Promise<FineStatistics> => {
    await delay(200);
    return mockFineStatistics;
  },
};

export const appealApi = {
  getList: async (
    page: number = 1,
    pageSize: number = 10,
    filters: FilterCriteria & { status?: string } = {}
  ): Promise<PaginatedResponse<AppealRecord>> => {
    await delay(300);
    let filtered = [...mockAppeals];
    if (filters.status) {
      filtered = filtered.filter((a) => a.status === filters.status);
    }
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    
    return {
      items,
      total: filtered.length,
      page,
      pageSize,
    };
  },

  handleAppeal: async (appealId: string, data: { result: 'approved' | 'rejected'; remark?: string }) => {
    await delay(300);
    return { success: true };
  },
};

export const masterDataApi = {
  getTeams: async (): Promise<Team[]> => {
    await delay(100);
    return mockTeams;
  },

  getHazardTypes: async (): Promise<HazardType[]> => {
    await delay(100);
    return mockHazardTypes;
  },

  getInspectionPoints: async (): Promise<InspectionPoint[]> => {
    await delay(100);
    return mockInspectionPoints;
  },

  getFloors: async (): Promise<number[]> => {
    await delay(100);
    return [-1, 1, 2, 3, 4, 5, 6];
  },
};

export const exportApi = {
  exportHazards: async (filters: FilterCriteria = {}): Promise<Blob> => {
    await delay(500);
    const data = applyFilters(mockHazards, filters);
    const csvContent = [
      ['隐患编号', '标题', '类型', '等级', '楼层', '责任班组', '状态', '发现时间', '截止时间'].join(','),
      ...data.map((h) => [
        h.code,
        h.title,
        h.type.name,
        h.level,
        h.inspectionPoint.floor,
        h.team.name,
        h.status,
        h.discoveredAt,
        h.deadline,
      ].join(',')),
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },

  exportFines: async (filters: FilterCriteria = {}): Promise<Blob> => {
    await delay(500);
    const csvContent = [
      ['罚款编号', '隐患编号', '隐患标题', '责任班组', '金额', '状态', '创建时间'].join(','),
      ...mockFines.map((f) => [
        f.id,
        f.hazardCode,
        f.hazardTitle,
        f.teamName,
        f.amount,
        f.status,
        f.createdAt,
      ].join(',')),
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },
};

export default api;
