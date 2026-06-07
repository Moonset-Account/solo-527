import type {
  Vehicle, Route, Customer, DeliveryBatch, TemperatureRecord,
  PositionRecord, KPIData, AnomalyStatistics, TemperatureProbe,
  AnomalyEvent, DataQualityReport, SavedFilter, CompareMetrics,
  DoorRecord
} from '@shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  getKPIData: () => request<KPIData>('/kpi/overview'),
  
  getVehicles: () => request<Vehicle[]>('/meta/vehicles'),
  getRoutes: () => request<Route[]>('/meta/routes'),
  getCustomers: () => request<Customer[]>('/meta/customers'),
  getBatches: (filters?: any) => {
    const params = new URLSearchParams(filters || {}).toString();
    return request<DeliveryBatch[]>(`/meta/batches${params ? `?${params}` : ''}`);
  },
  
  getTemperatureTrend: (vehicleId?: string, batchId?: string) => {
    const params = new URLSearchParams();
    if (vehicleId) params.set('vehicleId', vehicleId);
    if (batchId) params.set('batchId', batchId);
    return request<TemperatureRecord[]>(`/temperature/trend?${params.toString()}`);
  },
  
  getAnomalyStatistics: (dimension: string = 'vehicle') =>
    request<AnomalyStatistics[]>(`/temperature/anomaly-statistics?dimension=${dimension}`),
  
  getProbeStatus: () => request<TemperatureProbe[]>('/temperature/probes'),
  
  getRouteTrack: (vehicleId: string, batchId?: string) => {
    const params = new URLSearchParams({ vehicleId });
    if (batchId) params.set('batchId', batchId);
    return request<PositionRecord[]>(`/route/track?${params.toString()}`);
  },
  
  getAnomalyList: (page: number = 1, pageSize: number = 20, filters?: any) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (filters) params.set('filters', JSON.stringify(filters));
    return request<{ list: AnomalyEvent[]; total: number; page: number; pageSize: number }>(
      `/exception/list?${params.toString()}`
    );
  },
  
  getAnomalyDetail: (exceptionId: string) =>
    request<{ anomaly: AnomalyEvent; relatedDoors: DoorRecord[] }>(
      `/exception/detail?exceptionId=${exceptionId}`
    ),
  
  getDoorRecords: (batchId: string) =>
    request<DoorRecord[]>(`/exception/doors?batchId=${batchId}`),
  
  getCompareMetrics: (dimension: string, ids: string[], metrics: string[] = []) => {
    const params = new URLSearchParams({
      dimension,
      ids: ids.join(','),
      metrics: metrics.join(','),
    });
    return request<CompareMetrics>(`/compare/metrics?${params.toString()}`);
  },
  
  getDataQualityReport: () => request<DataQualityReport>('/data-quality/report'),
  
  getSavedFilters: () => request<SavedFilter[]>('/filters/list'),
  
  saveFilter: (name: string, filters: Record<string, any>) =>
    request<SavedFilter>('/filters/save', {
      method: 'POST',
      body: JSON.stringify({ name, filters }),
    }),
  
  deleteFilter: (id: string) =>
    request<{ success: boolean }>(`/filters/${id}`, { method: 'DELETE' }),
};
