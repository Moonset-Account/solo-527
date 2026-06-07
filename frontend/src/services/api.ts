import axios from 'axios';
import { 
  FilterOptions, 
  AnomalySummary, 
  RetentionCohortResponse,
  CourseHeatmapResponse,
  CoachLoadResponse,
  ChurnWarningResponse,
  FilterState
} from '@/types';
import {
  mockFilterOptions,
  generateMockAnomalySummary,
  generateMockRetentionCohort,
  generateMockCourseHeatmap,
  generateMockCoachLoad,
  generateMockChurnWarning
} from './mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' ? true : false;

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

const buildQueryParams = (filters: FilterState): Record<string, any> => {
  const params: Record<string, any> = {};
  if (filters.memberTypeIds?.length) params.member_type_ids = filters.memberTypeIds;
  if (filters.storeIds?.length) params.store_ids = filters.storeIds;
  if (filters.coachIds?.length) params.coach_ids = filters.coachIds;
  if (filters.courseIds?.length) params.course_ids = filters.courseIds;
  if (filters.month) params.month = filters.month;
  return params;
};

export const apiService = {
  async getFilterOptions(): Promise<FilterOptions> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockFilterOptions;
    }
    const { data } = await api.get('/filters/options');
    return data;
  },

  async getAnomalySummary(filters: FilterState): Promise<AnomalySummary> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockAnomalySummary(filters);
    }
    const { data } = await api.get('/anomaly-summary', {
      params: buildQueryParams(filters),
      paramsSerializer: { indexes: null },
    });
    return data;
  },

  async getRetentionCohort(filters: FilterState, months: number = 6): Promise<RetentionCohortResponse> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return generateMockRetentionCohort(filters, months);
    }
    const { data } = await api.get('/retention-cohort', {
      params: { ...buildQueryParams(filters), months },
      paramsSerializer: { indexes: null },
    });
    return data;
  },

  async getCourseHeatmap(filters: FilterState): Promise<CourseHeatmapResponse> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockCourseHeatmap(filters);
    }
    const { data } = await api.get('/course-heatmap', {
      params: buildQueryParams(filters),
      paramsSerializer: { indexes: null },
    });
    return data;
  },

  async getCoachLoad(filters: FilterState): Promise<CoachLoadResponse> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockCoachLoad(filters);
    }
    const { data } = await api.get('/coach-load', {
      params: buildQueryParams(filters),
      paramsSerializer: { indexes: null },
    });
    return data;
  },

  async getChurnWarning(filters: FilterState, limit: number = 100): Promise<ChurnWarningResponse> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return generateMockChurnWarning(filters, limit);
    }
    const { data } = await api.get('/churn-warning', {
      params: { ...buildQueryParams(filters), limit },
      paramsSerializer: { indexes: null },
    });
    return data;
  },

  exportCohort(filters: FilterState, months: number = 6): string {
    const params = new URLSearchParams();
    filters.memberTypeIds?.forEach(id => params.append('member_type_ids', String(id)));
    filters.storeIds?.forEach(id => params.append('store_ids', String(id)));
    filters.coachIds?.forEach(id => params.append('coach_ids', String(id)));
    if (filters.month) params.append('month', filters.month);
    params.append('months', String(months));
    return `/api/export/cohort?${params.toString()}`;
  },

  exportChurnWarning(filters: FilterState): string {
    const params = new URLSearchParams();
    filters.memberTypeIds?.forEach(id => params.append('member_type_ids', String(id)));
    filters.storeIds?.forEach(id => params.append('store_ids', String(id)));
    filters.coachIds?.forEach(id => params.append('coach_ids', String(id)));
    if (filters.month) params.append('month', filters.month);
    return `/api/export/churn-warning?${params.toString()}`;
  },

  exportCoachLoad(filters: FilterState): string {
    const params = new URLSearchParams();
    filters.storeIds?.forEach(id => params.append('store_ids', String(id)));
    filters.coachIds?.forEach(id => params.append('coach_ids', String(id)));
    if (filters.month) params.append('month', filters.month);
    return `/api/export/coach-load?${params.toString()}`;
  },
};

export default api;
