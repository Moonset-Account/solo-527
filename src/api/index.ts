import axios from 'axios'
import type { LoginRequest, LoginResponse, Requirement, RequirementFilter, PaginatedResponse, RequirementComment, RequirementAttachment, RequirementNote, Reminder, Dictionary, ReminderThreshold, DefaultAssignee, AuditLog, User, CreateRequirementRequest, CreateReminderRequest } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
}

export const requirementApi = {
  list: (filter: RequirementFilter) => api.get<PaginatedResponse<Requirement>>('/requirements', { params: filter }),
  get: (id: number) => api.get<Requirement>(`/requirements/${id}`),
  create: (data: FormData) => api.post<Requirement>('/requirements', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: Partial<Requirement>) => api.put<Requirement>(`/requirements/${id}`, data),
  delete: (id: number) => api.delete(`/requirements/${id}`),
  addComment: (id: number, data: { content: string; type: string }) => api.post<RequirementComment>(`/requirements/${id}/comments`, data),
  addNote: (id: number, data: { content: string }) => api.post<RequirementNote>(`/requirements/${id}/notes`, data),
  uploadAttachment: (id: number, file: FormData) => api.post<RequirementAttachment>(`/requirements/${id}/attachments`, file, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAttachment: (requirementId: number, attachmentId: number) => api.delete(`/requirements/${requirementId}/attachments/${attachmentId}`),
  markAttachmentMissing: (requirementId: number, attachmentId: number, isMissing: boolean) => api.patch(`/requirements/${requirementId}/attachments/${attachmentId}`, { isMissing }),
}

export const reminderApi = {
  list: (params?: { status?: string; page?: number }) => api.get<PaginatedResponse<Reminder>>('/reminders', { params }),
  create: (data: CreateReminderRequest) => api.post<Reminder>('/reminders', data),
  acknowledge: (id: number) => api.patch<Reminder>(`/reminders/${id}/acknowledge`),
}

export const adminApi = {
  dictionaries: {
    list: (category?: string) => api.get<Dictionary[]>('/admin/dictionaries', { params: { type: category } }),
    create: (data: Partial<Dictionary>) => api.post<Dictionary>('/admin/dictionaries', data),
    update: (id: number, data: Partial<Dictionary>) => api.put<Dictionary>(`/admin/dictionaries/${id}`, data),
    delete: (id: number) => api.delete(`/admin/dictionaries/${id}`),
  },
  thresholds: {
    list: () => api.get<ReminderThreshold[]>('/admin/thresholds'),
    create: (data: Partial<ReminderThreshold>) => api.post<ReminderThreshold>('/admin/thresholds', data),
    update: (id: number, data: Partial<ReminderThreshold>) => api.put<ReminderThreshold>(`/admin/thresholds/${id}`, data),
    delete: (id: number) => api.delete(`/admin/thresholds/${id}`),
  },
  defaultAssignees: {
    list: () => api.get<DefaultAssignee[]>('/admin/default-assignees'),
    create: (data: Partial<DefaultAssignee>) => api.post<DefaultAssignee>('/admin/default-assignees', data),
    update: (id: number, data: Partial<DefaultAssignee>) => api.put<DefaultAssignee>(`/admin/default-assignees/${id}`, data),
    delete: (id: number) => api.delete(`/admin/default-assignees/${id}`),
  },
  users: {
    list: () => api.get<User[]>('/admin/users'),
    create: (data: Partial<User> & { password: string }) => api.post<User>('/admin/users', data),
    update: (id: number, data: Partial<User>) => api.put<User>(`/admin/users/${id}`, data),
    delete: (id: number) => api.delete(`/admin/users/${id}`),
  },
  logs: {
    list: (params?: { action?: string; resource?: string; userId?: number; startDate?: string; endDate?: string; page?: number }) => api.get<PaginatedResponse<AuditLog>>('/admin/logs', { params }),
  },
}

export default api
