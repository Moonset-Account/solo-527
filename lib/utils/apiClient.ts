const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/csv')) {
    return response.text() as unknown as T;
  }

  return response.json();
}

export const apiClient = {
  login: (username: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  getOverview: (organization?: string) =>
    request(`/overview${organization ? `?organization=${encodeURIComponent(organization)}` : ''}`),

  getSites: (organization?: string) =>
    request(`/sites${organization ? `?organization=${encodeURIComponent(organization)}` : ''}`),

  getMeasurements: (params?: {
    siteIds?: string[];
    organizations?: string[];
    startDate?: string;
    endDate?: string;
    dataSource?: 'manual' | 'automatic' | 'all';
    onlyAnomalies?: boolean;
    limit?: number;
    offset?: number;
    format?: 'csv';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.siteIds?.length) searchParams.set('siteIds', params.siteIds.join(','));
    if (params?.organizations?.length) searchParams.set('organizations', params.organizations.join(','));
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.dataSource) searchParams.set('dataSource', params.dataSource);
    if (params?.onlyAnomalies) searchParams.set('onlyAnomalies', 'true');
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    if (params?.format) searchParams.set('format', params.format);

    const query = searchParams.toString();
    return request(`/measurements${query ? `?${query}` : ''}`);
  },

  importMeasurements: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/measurements', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  addMeasurements: (measurements: any[]) =>
    request('/measurements', {
      method: 'POST',
      body: JSON.stringify(measurements),
    }),

  getQualityCheck: (organization?: string) =>
    request(`/quality${organization ? `?organization=${encodeURIComponent(organization)}` : ''}`),

  getDataDict: () => request('/datadict'),

  getAnomalyNotes: (measurementId?: string) =>
    request(`/anomalies${measurementId ? `?measurementId=${measurementId}` : ''}`),

  addAnomalyNote: (note: any) =>
    request('/anomalies', {
      method: 'POST',
      body: JSON.stringify(note),
    }),
};
