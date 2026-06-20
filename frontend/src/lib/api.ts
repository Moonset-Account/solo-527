const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
  uploadedBy: string;
  reuseCount: number | null;
  createdAt: string;
  updatedAt: string;
  tagIds?: string[];
  tags?: { id: string; name: string; color: string | null }[];
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  usageCount?: number;
}

export interface TopicScript {
  id: string;
  title: string;
  content: string | null;
  materialId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishSchedule {
  id: string;
  title: string;
  scriptId: string | null;
  platform: string;
  scheduledAt: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingConversion {
  id: string;
  scheduleId: string;
  views: number | null;
  reads: number | null;
  shares: number | null;
  comments: number | null;
  conversionRate: string | null;
  recordedAt: string;
  scheduleTitle?: string;
  platform?: string;
}

export interface ConversionSummary {
  totalViews: number;
  totalReads: number;
  totalShares: number;
  totalComments: number;
  avgConversionRate?: string;
}

export interface Exception {
  id: string;
  scheduleId: string;
  type: string;
  description: string | null;
  status: 'open' | 'processing' | 'closed';
  handler: string | null;
  handledAt: string | null;
  closeExplanation: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  scheduleTitle?: string;
  platform?: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  details: Record<string, unknown> | null;
  operator: string;
  createdAt: string;
}

export interface DashboardOverview {
  materialCount: number;
  scheduleCount: number;
  openExceptions: number;
  publishedCount: number;
  conversions: ConversionSummary;
}

export const api = {
  materials: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: Material[] }>(`/materials${qs}`);
    },
    get: (id: string) => request<{ data: Material }>(`/materials/${id}`),
    create: (data: Partial<Material> & { tagIds?: string[] }) =>
      request<{ data: Material }>('/materials', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Material> & { tagIds?: string[] }) =>
      request<{ data: Material }>(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ data: Material }>(`/materials/${id}`, { method: 'DELETE' }),
    reuseSuggestions: () => request<{ data: Material[] }>('/materials/reuse-suggestions'),
  },
  tags: {
    list: () => request<{ data: Tag[] }>('/tags'),
    create: (data: { name: string; color?: string }) =>
      request<{ data: Tag }>('/tags', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ data: Tag }>(`/tags/${id}`, { method: 'DELETE' }),
  },
  scripts: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: TopicScript[] }>(`/scripts${qs}`);
    },
    get: (id: string) => request<{ data: TopicScript }>(`/scripts/${id}`),
    create: (data: Partial<TopicScript>) =>
      request<{ data: TopicScript }>('/scripts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<TopicScript>) =>
      request<{ data: TopicScript }>(`/scripts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  schedules: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: PublishSchedule[] }>(`/schedules${qs}`);
    },
    get: (id: string) => request<{ data: PublishSchedule }>(`/schedules/${id}`),
    create: (data: Partial<PublishSchedule>) =>
      request<{ data: PublishSchedule }>('/schedules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<PublishSchedule>) =>
      request<{ data: PublishSchedule }>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  conversions: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: ReadingConversion[] }>(`/conversions${qs}`);
    },
    summary: () => request<{ data: ConversionSummary }>('/conversions/summary'),
    create: (data: Partial<ReadingConversion>) =>
      request<{ data: ReadingConversion }>('/conversions', { method: 'POST', body: JSON.stringify(data) }),
    batch: (data: Partial<ReadingConversion>[]) =>
      request<{ data: ReadingConversion[] }>('/conversions/batch', { method: 'POST', body: JSON.stringify(data) }),
  },
  exceptions: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: Exception[] }>(`/exceptions${qs}`);
    },
    get: (id: string) => request<{ data: Exception }>(`/exceptions/${id}`),
    update: (id: string, data: Partial<Exception>) =>
      request<{ data: Exception }>(`/exceptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  history: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: AuditLog[] }>(`/history${qs}`);
    },
    byEntity: (entityType: string, entityId: string) =>
      request<{ data: AuditLog[] }>(`/history/entity/${entityType}/${entityId}`),
  },
  dashboard: {
    overview: () => request<{ data: DashboardOverview }>('/dashboard/overview'),
    conversionTrend: (days?: number) =>
      request<{ data: { date: string; views: number; reads: number; shares: number; comments: number }[] }>(
        `/dashboard/conversion-trend${days ? `?days=${days}` : ''}`
      ),
    topMaterials: () => request<{ data: Material[] }>('/dashboard/top-materials'),
    tagDistribution: () => request<{ data: (Tag & { count: number })[] }>('/dashboard/tag-distribution'),
    detail: (id: string) =>
      request<{ data: { material: Material; tags: Tag[]; scripts: TopicScript[]; schedules: PublishSchedule[] } }>(
        `/dashboard/detail/${id}`
      ),
  },
};
