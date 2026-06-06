import type {
  FilterParams,
  KPIData,
  SubjectTrend,
  BranchComparison,
  OverdueHeatmapItem,
  ReservationAnalysis,
  AgeGroupData,
  DataQualityStatus,
  SavedFilter,
  RawRecordWithValidation,
  RenewTrend,
  RenewByBranch,
  ActivityParticipationTrend,
  ActivityByType,
} from '../../shared/types.js';

const API_BASE = '/api/library';

async function request<T>(endpoint: string, method: string = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data as T;
}

export const apiClient = {
  getFilterOptions: () =>
    request<{
      collections: string[];
      subjects: string[];
      branches: string[];
      readerGroups: string[];
      months: string[];
    }>('/filter-options'),

  getKPIData: (filters: FilterParams) =>
    request<KPIData>('/kpi', 'POST', filters),

  getSubjectTrends: (filters: FilterParams) =>
    request<SubjectTrend[]>('/trends/subject', 'POST', filters),

  getBranchComparison: (filters: FilterParams) =>
    request<BranchComparison[]>('/comparison/branch', 'POST', filters),

  getOverdueHeatmap: (filters: FilterParams) =>
    request<OverdueHeatmapItem[]>('/overdue/heatmap', 'POST', filters),

  getReservationAnalysis: (filters: FilterParams) =>
    request<ReservationAnalysis>('/reservations/analysis', 'POST', filters),

  getAgeGroupAnalysis: (filters: FilterParams) =>
    request<AgeGroupData[]>('/readers/age-groups', 'POST', filters),

  getDataQualityStatus: () =>
    request<DataQualityStatus>('/data-quality/status'),

  getRawRecords: (filters: FilterParams, limit = 100) =>
    request<RawRecordWithValidation[]>('/records/raw', 'POST', { ...filters, limit }),

  refreshETL: () =>
    request<{ message: string }>('/etl/refresh', 'POST'),

  getSavedFilters: () =>
    request<SavedFilter[]>('/filters/saved'),

  saveFilter: (name: string, params: FilterParams) =>
    request<SavedFilter>('/filters/saved', 'POST', { name, params }),

  deleteFilter: (id: string) =>
    request<{ message: string }>(`/filters/saved/${id}`, 'DELETE'),

  getRenewTrends: (filters: FilterParams) =>
    request<RenewTrend[]>('/renews/trends', 'POST', filters),

  getRenewByBranch: (filters: FilterParams) =>
    request<RenewByBranch[]>('/renews/by-branch', 'POST', filters),

  getActivityTrends: (filters: FilterParams) =>
    request<ActivityParticipationTrend[]>('/activities/trends', 'POST', filters),

  getActivityByType: (filters: FilterParams) =>
    request<ActivityByType[]>('/activities/by-type', 'POST', filters),
};
