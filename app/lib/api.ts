import type {
  FilterParams,
  FunnelResponse,
  ChannelQualityResponse,
  ConsultantLoadResponse,
  FollowUpTrendResponse,
  AnomalySummaryResponse,
  ExportTask,
  ExportFormat,
} from '../../shared/types';

function buildQueryString(params: FilterParams): string {
  const searchParams = new URLSearchParams();

  if (params.projectIds?.length) {
    params.projectIds.forEach((id) => searchParams.append('projectIds', id));
  }
  if (params.consultantIds?.length) {
    params.consultantIds.forEach((id) => searchParams.append('consultantIds', id));
  }
  if (params.channelIds?.length) {
    params.channelIds.forEach((id) => searchParams.append('channelIds', id));
  }
  if (params.customerStage) {
    searchParams.set('customerStage', params.customerStage);
  }
  if (params.months?.length) {
    params.months.forEach((m) => searchParams.append('months', m));
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchAnomalies(filters: FilterParams): Promise<AnomalySummaryResponse> {
  return request<AnomalySummaryResponse>(`/api/anomalies${buildQueryString(filters)}`);
}

export async function fetchFunnel(filters: FilterParams): Promise<FunnelResponse> {
  return request<FunnelResponse>(`/api/funnel${buildQueryString(filters)}`);
}

export async function fetchChannelQuality(filters: FilterParams): Promise<ChannelQualityResponse> {
  return request<ChannelQualityResponse>(`/api/channel-quality${buildQueryString(filters)}`);
}

export async function fetchConsultantLoad(filters: FilterParams): Promise<ConsultantLoadResponse> {
  return request<ConsultantLoadResponse>(`/api/consultant-load${buildQueryString(filters)}`);
}

export async function fetchFollowUpTrend(filters: FilterParams): Promise<FollowUpTrendResponse> {
  return request<FollowUpTrendResponse>(`/api/follow-up-trend${buildQueryString(filters)}`);
}

export interface FilterOptionsResponse {
  projects: { id: string; name: string }[];
  consultants: { id: string; name: string }[];
  channels: { id: string; name: string }[];
  stages: string[];
  months: string[];
}

export async function fetchFilterOptions(): Promise<FilterOptionsResponse> {
  return request<FilterOptionsResponse>('/api/filter-options');
}

export async function submitExport(
  viewType: string,
  filters: FilterParams,
  format: ExportFormat,
): Promise<ExportTask> {
  return request<ExportTask>('/api/exports', {
    method: 'POST',
    body: JSON.stringify({ viewType, filters, format }),
  });
}

export async function fetchExportTasks(): Promise<ExportTask[]> {
  return request<ExportTask[]>('/api/exports');
}

export function downloadExport(taskId: string): string {
  return `/api/exports/${taskId}/download`;
}
