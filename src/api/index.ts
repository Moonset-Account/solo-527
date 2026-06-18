import axios from 'axios'
import type {
  LoginParams,
  LoginResult,
  Lead,
  Followup,
  FollowupRule,
  Prediction,
  ChurnRecord,
  Tag,
  DictItem,
  ReminderTemplate,
  ScopeConfig,
  Contract,
  LeadQualityReport,
  ContractPendingReason,
  ProcessingTimeReport,
  PaginatedResponse,
  FunnelData,
  ChurnTrend,
  FollowupCalendarEvent,
  PersonPerformance,
  TagQueryLogic,
} from '@/types'

const http = axios.create({ baseURL: '/api' })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export const authApi = {
  login: (data: LoginParams) => http.post<LoginResult>('/auth/login', data),
  logout: () => http.post('/auth/logout'),
  profile: () => http.get<LoginResult['user']>('/auth/profile'),
}

export const leadsApi = {
  list: (params?: Record<string, unknown>) =>
    http.get<PaginatedResponse<Lead>>('/leads', { params }),
  detail: (id: number) => http.get<Lead>(`/leads/${id}`),
  create: (data: Partial<Lead>) => http.post<Lead>('/leads', data),
  update: (id: number, data: Partial<Lead>) => http.put<Lead>(`/leads/${id}`, data),
  delete: (id: number) => http.delete(`/leads/${id}`),
  stats: () => http.get<{
    total: number
    newThisWeek: number
    conversionRate: number
    avgResponseTime: number
  }>('/leads/stats'),
  changeStatus: (id: number, status: string) => http.put(`/leads/${id}/status`, { status }),
  assign: (id: number, userId: number) => http.put(`/leads/${id}/assign`, { userId }),
  addTag: (id: number, tagId: number) => http.post(`/leads/${id}/tags`, { tagId }),
  scheduleMeasurement: (id: number, data: { measurer: string; date: string }) =>
    http.post(`/leads/${id}/measurement`, data),
}

export const followupsApi = {
  list: (params?: Record<string, unknown>) =>
    http.get<PaginatedResponse<Followup>>('/followups', { params }),
  create: (data: Partial<Followup>) => http.post<Followup>('/followups', data),
  update: (id: number, data: Partial<Followup>) => http.put(`/followups/${id}`, data),
  complete: (id: number, data: { result: string; nextFollowupDate?: string }) =>
    http.put(`/followups/${id}/complete`, data),
  calendar: (month: string) => http.get<FollowupCalendarEvent[]>('/followups/calendar', { params: { month } }),
  batchAssign: (ids: number[], userId: number) =>
    http.put('/followups/batch-assign', { ids, userId }),
  batchPostpone: (ids: number[], days: number) =>
    http.put('/followups/batch-postpone', { ids, days }),
  batchStatus: (ids: number[], status: string) =>
    http.put('/followups/batch-status', { ids, status }),
}

export const followupRulesApi = {
  list: () => http.get<FollowupRule[]>('/followup-rules'),
  create: (data: Partial<FollowupRule>) => http.post<FollowupRule>('/followup-rules', data),
  update: (id: number, data: Partial<FollowupRule>) =>
    http.put<FollowupRule>(`/followup-rules/${id}`, data),
  delete: (id: number) => http.delete(`/followup-rules/${id}`),
  toggle: (id: number, enabled: boolean) =>
    http.put(`/followup-rules/${id}/toggle`, { enabled }),
}

export const predictionsApi = {
  list: (params?: Record<string, unknown>) =>
    http.get<PaginatedResponse<Prediction>>('/predictions', { params }),
  funnel: () => http.get<FunnelData[]>('/predictions/funnel'),
  risks: () => http.get<Prediction[]>('/predictions/risks'),
  detail: (leadId: number) => http.get<Prediction>(`/predictions/${leadId}`),
}

export const churnApi = {
  stats: () => http.get<{
    totalChurned: number
    churnRateThisMonth: number
    potentialRecalls: number
  }>('/churn/stats'),
  reasons: () => http.get<{ reason: string; count: number }[]>('/churn/reasons'),
  trend: () => http.get<ChurnTrend[]>('/churn/trend'),
  warnings: () => http.get<ChurnRecord[]>('/churn/warnings'),
}

export const tagsApi = {
  list: (group?: string) => http.get<Tag[]>('/tags', { params: { group } }),
  create: (data: Partial<Tag>) => http.post<Tag>('/tags', data),
  update: (id: number, data: Partial<Tag>) => http.put<Tag>(`/tags/${id}`, data),
  delete: (id: number) => http.delete(`/tags/${id}`),
  batchQuery: (tagIds: number[], logic: TagQueryLogic) =>
    http.post<{ count: number; leadIds: number[] }>('/tags/batch-query', { tagIds, logic }),
  profile: (id: number) => http.get<{
    radar: { axis: string; value: number }[]
    distribution: { source: string; count: number }[]
  }>(`/tags/${id}/profile`),
}

export const reportsApi = {
  leadQuality: (params?: Record<string, unknown>) =>
    http.get<LeadQualityReport[]>('/reports/lead-quality', { params }),
  contractPending: () => http.get<ContractPendingReason[]>('/reports/contract-pending'),
  processingTime: () => http.get<ProcessingTimeReport[]>('/reports/processing-time'),
  performance: () => http.get<PersonPerformance[]>('/reports/performance'),
}

export const settingsApi = {
  dicts: {
    list: (category?: string) => http.get<DictItem[]>('/settings/dicts', { params: { category } }),
    create: (data: Partial<DictItem>) => http.post<DictItem>('/settings/dicts', data),
    update: (id: number, data: Partial<DictItem>) =>
      http.put<DictItem>(`/settings/dicts/${id}`, data),
    delete: (id: number) => http.delete(`/settings/dicts/${id}`),
  },
  reminders: {
    list: () => http.get<ReminderTemplate[]>('/settings/reminders'),
    create: (data: Partial<ReminderTemplate>) =>
      http.post<ReminderTemplate>('/settings/reminders', data),
    update: (id: number, data: Partial<ReminderTemplate>) =>
      http.put<ReminderTemplate>(`/settings/reminders/${id}`, data),
    delete: (id: number) => http.delete(`/settings/reminders/${id}`),
  },
  scopes: {
    list: (type?: string) => http.get<ScopeConfig[]>('/settings/scopes', { params: { type } }),
    update: (id: number, data: Partial<ScopeConfig>) =>
      http.put<ScopeConfig>(`/settings/scopes/${id}`, data),
  },
  roles: {
    list: () => http.get<{ id: number; name: string; permissions: string[] }[]>('/settings/roles'),
    update: (id: number, data: { name: string; permissions: string[] }) =>
      http.put(`/settings/roles/${id}`, data),
  },
}
