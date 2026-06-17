import { request } from './request'
import type {
  LoginParams,
  LoginResponse,
  User,
  Application,
  ApplicationItem,
  PaginatedResponse,
  PaginationParams,
  Reagent,
  Instrument,
  InstrumentBooking,
  Sample,
  Notification,
  Dictionary,
  Project,
  OriginalDocument,
  AuditLog,
  QueryApplicationDto,
  QueryReagentDto,
  QuerySampleDto,
  QueryNotificationDto,
} from '@/types'

export const authApi = {
  login: (params: LoginParams) => request.post<LoginResponse>('/auth/login', params),
  logout: () => request.post<void>('/auth/logout'),
}

export const userApi = {
  me: () => request.get<User>('/users/me'),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request.post<void>('/users/change-password', data),
  list: (params?: any) => request.get<PaginatedResponse<User>>('/users', params),
  create: (data: any) => request.post<User>('/users', data),
  update: (id: string, data: any) => request.put<User>(`/users/${id}`, data),
  remove: (id: string) => request.delete<void>(`/users/${id}`),
}

export const applicationApi = {
  create: (data: any) => request.post<Application>('/applications', data),
  submit: (id: string, data?: any) => request.post<Application>(`/applications/${id}/submit`, data),
  approve: (id: string, data: any) => request.post<Application>(`/applications/${id}/approve`, data),
  reject: (id: string, data: any) => request.post<Application>(`/applications/${id}/reject`, data),
  pick: (id: string, data: any) => request.post<Application>(`/applications/${id}/pick`, data),
  cancel: (id: string) => request.post<Application>(`/applications/${id}/cancel`),
  list: (params?: any) => request.get<PaginatedResponse<Application>>('/applications', params),
  detail: (id: string) => request.get<Application>(`/applications/${id}`),
  statistics: () => request.get<any>('/applications/statistics'),
}

export const reagentApi = {
  create: (data: any) => request.post<Reagent>('/reagents', data),
  list: (params?: any) => request.get<PaginatedResponse<Reagent>>('/reagents', params),
  detail: (id: string) => request.get<Reagent>(`/reagents/${id}`),
  update: (id: string, data: any) => request.put<Reagent>(`/reagents/${id}`, data),
  remove: (id: string) => request.delete<void>(`/reagents/${id}`),
  adjustStock: (id: string, data: { quantity: number; reason?: string }) =>
    request.post<void>(`/reagents/${id}/adjust-stock`, data),
  statistics: () => request.get<any>('/reagents/statistics'),
}

export const instrumentApi = {
  create: (data: any) => request.post<Instrument>('/instruments', data),
  list: (params?: any) => request.get<PaginatedResponse<Instrument>>('/instruments', params),
  detail: (id: string) => request.get<Instrument>(`/instruments/${id}`),
  createBooking: (data: any) => request.post<InstrumentBooking>('/instruments/bookings', data),
  listBookings: (params?: any) => request.get<PaginatedResponse<InstrumentBooking>>('/instruments/bookings/list', params),
  bookingDetail: (id: string) => request.get<InstrumentBooking>(`/instruments/bookings/${id}`),
  cancelBooking: (id: string) => request.post<void>(`/instruments/bookings/${id}/cancel`),
}

export const sampleApi = {
  create: (data: any) => request.post<Sample>('/samples', data),
  list: (params?: any) => request.get<PaginatedResponse<Sample>>('/samples', params),
  detail: (id: string) => request.get<Sample>(`/samples/${id}`),
  updateStatus: (id: string, data: any) => request.put<Sample>(`/samples/${id}/status`, data),
  statistics: () => request.get<any>('/samples/statistics'),
}

export const notificationApi = {
  list: (params?: any) =>
    request.get<{ list: Notification[]; total: number; unreadCount: number }>('/notifications', params),
  unreadCount: () => request.get<number>('/notifications/unread-count'),
  markRead: (id: string) => request.put<void>(`/notifications/${id}/read`),
  markAllRead: () => request.put<void>('/notifications/read-all'),
  confirm: (id: string) => request.post<Notification>(`/notifications/${id}/confirm`),
  maintenanceBoard: () => request.get<{ pending: any[]; confirmed: any[] }>('/notifications/maintenance-board'),
}

export const configApi = {
  listDictionaries: (params?: any) => request.get<PaginatedResponse<Dictionary>>('/config/dictionaries', params),
  getDictionaryItems: (code: string) =>
    request.get<Array<{ value: string; label: string; sort: number; enabled: boolean }>>(
      `/config/dictionaries/items/${code}`
    ),
  createDictionary: (data: any) => request.post<Dictionary>('/config/dictionaries', data),
  updateDictionary: (id: string, data: any) => request.put<Dictionary>(`/config/dictionaries/${id}`, data),
  deleteDictionary: (id: string) => request.delete<void>(`/config/dictionaries/${id}`),
  listNotificationConfigs: () => request.get<any[]>('/config/notification-configs'),
  createNotificationConfig: (data: any) => request.post<any>('/config/notification-configs', data),
  updateNotificationConfig: (id: string, data: any) => request.put<any>(`/config/notification-configs/${id}`, data),
}

export const projectApi = {
  create: (data: any) => request.post<Project>('/projects', data),
  list: (params?: any) => request.get<PaginatedResponse<Project>>('/projects', params),
  detail: (id: string) => request.get<Project>(`/projects/${id}`),
  update: (id: string, data: any) => request.put<Project>(`/projects/${id}`, data),
  createReport: (data: any) => request.post<any>('/projects/reports', data),
  listReports: (projectId: string) => request.get<any[]>(`/projects/${projectId}/reports`),
}

export const hazardousApi = {
  create: (data: any) => request.post<any>('/hazardous', data),
  list: (params?: any) => request.get<PaginatedResponse<any>>('/hazardous', params),
  detail: (id: string) => request.get<any>(`/hazardous/${id}`),
  update: (id: string, data: any) => request.put<any>(`/hazardous/${id}`, data),
}

export const auditApi = {
  list: (params?: any) => request.get<PaginatedResponse<AuditLog>>('/audit', params),
  findByTarget: (targetId: string, module?: string) =>
    request.get<AuditLog[]>(`/audit/target/${targetId}`, { module }),
}

export const dashboardApi = {
  overview: () => request.get<any>('/dashboard/overview'),
  createDocument: (data: any) => request.post<OriginalDocument>('/dashboard/documents', data),
  listDocuments: (params?: any) => request.get<PaginatedResponse<OriginalDocument>>('/dashboard/documents', params),
  documentDetail: (id: string) => request.get<OriginalDocument>(`/dashboard/documents/${id}`),
}
