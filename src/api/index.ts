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
  detail: (id: string) => http.get<Lead>(`/leads/${id}`),
  create: (data: Partial<Lead>) => http.post<Lead>('/leads', data),
  update: (id: string, data: Partial<Lead>) => http.patch<Lead>(`/leads/${id}`, data),
  delete: (id: string) => http.delete(`/leads/${id}`),
  stats: () => http.get<{
    total: number
    newThisWeek: number
    conversionRate: number
    avgResponseTime: number
  }>('/leads/stats'),
  changeStatus: (id: string, status: string) => http.patch(`/leads/${id}`, { status }),
  assign: (id: string, userId: string) => http.patch(`/leads/${id}`, { assignedTo: userId }),
  addTag: (id: string, tag: string) => http.patch(`/leads/${id}`, { $push: { tags: tag } }),
  scheduleMeasurement: (id: string, data: { measurer: string; date: string }) =>
    http.patch(`/leads/${id}`, { measurementInfo: data }),
}

export const followupsApi = {
  list: (params?: Record<string, unknown>) =>
    http.get<PaginatedResponse<Followup>>('/followups', { params }),
  create: (data: Partial<Followup>) => http.post<Followup>('/followups', data),
  update: (id: string, data: Partial<Followup>) => http.patch(`/followups/${id}`, data),
  complete: (id: string, data: { result: string; completedAt: string; nextFollowupAt?: string }) =>
    http.patch(`/followups/${id}`, data),
  calendar: (month: string) => http.get<FollowupCalendarEvent[]>('/followups/calendar', { params: { month } }),
}

export const followupRulesApi = {
  list: () => http.get<FollowupRule[]>('/followup-rules'),
  create: (data: Partial<FollowupRule>) => http.post<FollowupRule>('/followup-rules', data),
  update: (id: string, data: Partial<FollowupRule>) =>
    http.patch<FollowupRule>(`/followup-rules/${id}`, data),
  toggle: (id: string, enabled: boolean) =>
    http.patch(`/followup-rules/${id}/toggle`, { enabled }),
}

export const predictionsApi = {
  list: (params?: Record<string, unknown>) =>
    http.get<PaginatedResponse<Prediction>>('/predictions', { params }),
  funnel: () => http.get<FunnelData[]>('/predictions/funnel'),
  risks: () => http.get<Prediction[]>('/predictions/risks'),
  detail: (leadId: string) => http.get<Prediction>(`/predictions/${leadId}`),
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
  update: (id: string, data: Partial<Tag>) => http.patch<Tag>(`/tags/${id}`, data),
  batchQuery: (tagIds: string[], logic: TagQueryLogic) =>
    http.post<{ count: number; leadIds: string[] }>('/tags/batch-query', { tagIds, logic }),
  profile: (name: string) => http.get<{
    radar: { axis: string; value: number }[]
    distribution: { source: string; count: number }[]
  }>('/tags/profile', { params: { name } }),
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
    update: (id: string, data: Partial<DictItem>) =>
      http.patch<DictItem>(`/settings/dicts/${id}`, data),
    delete: (id: string) => http.delete(`/settings/dicts/${id}`),
  },
  reminders: {
    list: () => http.get<ReminderTemplate[]>('/settings/reminders'),
    create: (data: Partial<ReminderTemplate>) =>
      http.post<ReminderTemplate>('/settings/reminders', data),
    update: (id: string, data: Partial<ReminderTemplate>) =>
      http.patch<ReminderTemplate>(`/settings/reminders/${id}`, data),
    delete: (id: string) => http.delete(`/settings/reminders/${id}`),
  },
  scopes: {
    list: (type?: string) => http.get<ScopeConfig[]>('/settings/scopes', { params: { type } }),
    update: (id: string, data: Partial<ScopeConfig>) =>
      http.patch<ScopeConfig>(`/settings/scopes/${id}`, data),
  },
  roles: {
    list: () => http.get<{ id: string; name: string; permissions: string[] }[]>('/settings/roles'),
    update: (id: string, data: { name: string; permissions: string[] }) =>
      http.patch(`/settings/roles/${id}`, data),
  },
}
