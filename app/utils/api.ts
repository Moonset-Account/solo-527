import type { 
  FilterParams, 
  OverviewResponse, 
  FunnelResponse, 
  ParetoResponse,
  PromotionResponse,
  SupplierResponse,
  FilterOptionsResponse,
  ExportTaskRequest,
  ExportTaskStatus
} from '@shared/types';

const API_BASE = '/api';

function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v));
    } else {
      searchParams.set(key, String(value));
    }
  });
  
  return searchParams.toString();
}

async function fetchAPI<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = params 
    ? `${API_BASE}${endpoint}?${buildQueryParams(params)}`
    : `${API_BASE}${endpoint}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  getOverview: (filters: FilterParams) => 
    fetchAPI<OverviewResponse>('/overview', filters),
  
  getFunnel: (filters: FilterParams) =>
    fetchAPI<FunnelResponse>('/funnel', filters),
  
  getPareto: (filters: FilterParams, dimension?: string) =>
    fetchAPI<ParetoResponse>('/pareto', { ...filters, dimension }),
  
  getPromotion: (filters: FilterParams) =>
    fetchAPI<PromotionResponse>('/promotion', filters),
  
  getSuppliers: (filters: FilterParams) =>
    fetchAPI<SupplierResponse>('/suppliers', filters),
  
  getFilterOptions: () =>
    fetchAPI<FilterOptionsResponse>('/filters'),
  
  createExport: (data: ExportTaskRequest) =>
    fetch(`${API_BASE}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  
  getExportStatus: (id: string) =>
    fetchAPI<ExportTaskStatus>(`/export/${id}`),
};
