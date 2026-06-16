import { request } from './request'
import type {
  LoginParams,
  LoginResponse,
  UserInfo,
  GridEvent,
  Resident,
  PatrolTask,
  TodoItem,
  EventStatusLog,
  RectificationReview,
  FollowUpVisit,
  PageParams,
  PageResult,
  EventReportParams,
  ResidentFormData
} from '@/types'

export const login = (data: LoginParams) => {
  return request.post<LoginResponse>('/auth/login', data)
}

export const logout = () => {
  return request.post('/auth/logout')
}

export const getUserInfo = () => {
  return request.get<UserInfo>('/user/info')
}

export const getEventList = (params: PageParams) => {
  return request.get<PageResult<GridEvent>>('/events', { params })
}

export const getEventDetail = (id: number) => {
  return request.get<GridEvent>(`/events/${id}`)
}

export const createEvent = (data: EventReportParams) => {
  return request.post<GridEvent>('/events', data)
}

export const updateEvent = (id: number, data: Partial<GridEvent>) => {
  return request.put<GridEvent>(`/events/${id}`, data)
}

export const updateEventStatus = (id: number, status: string, remark?: string) => {
  return request.put<GridEvent>(`/events/${id}/status`, { status, remark })
}

export const getEventStatusLogs = (eventId: number) => {
  return request.get<EventStatusLog[]>(`/events/${eventId}/logs`)
}

export const getEventReviews = (eventId: number) => {
  return request.get<RectificationReview[]>(`/events/${eventId}/reviews`)
}

export const getEventVisits = (eventId: number) => {
  return request.get<FollowUpVisit[]>(`/events/${eventId}/visits`)
}

export const getResidentList = (params: PageParams) => {
  return request.get<PageResult<Resident>>('/residents', { params })
}

export const getResidentDetail = (id: number) => {
  return request.get<Resident>(`/residents/${id}`)
}

export const createResident = (data: ResidentFormData) => {
  return request.post<Resident>('/residents', data)
}

export const updateResident = (id: number, data: ResidentFormData) => {
  return request.put<Resident>(`/residents/${id}`, data)
}

export const deleteResident = (id: number) => {
  return request.delete(`/residents/${id}`)
}

export const importResidents = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/residents/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getPatrolTaskList = (params: PageParams) => {
  return request.get<PageResult<PatrolTask>>('/tasks', { params })
}

export const getPatrolTaskDetail = (id: number) => {
  return request.get<PatrolTask>(`/tasks/${id}`)
}

export const updatePatrolTask = (id: number, data: Partial<PatrolTask>) => {
  return request.put<PatrolTask>(`/tasks/${id}`, data)
}

export const getTodoList = (params: PageParams) => {
  return request.get<PageResult<TodoItem>>('/todos', { params })
}

export const updateTodoStatus = (id: number, status: string) => {
  return request.put<TodoItem>(`/todos/${id}/status`, { status })
}

export const getTodoStats = () => {
  return request.get<{ pending: number; completed: number; total: number }>('/todos/stats')
}

export const getEventStats = () => {
  return request.get<{
    total: number
    pending: number
    processing: number
    completed: number
    categoryStats: { category: string; count: number }[]
    dailyStats: { date: string; count: number }[]
  }>('/reports/event-stats')
}

export const getTaskStats = () => {
  return request.get<{
    total: number
    pending: number
    inProgress: number
    completed: number
    expired: number
  }>('/reports/task-stats')
}

export const getResidentStats = () => {
  return request.get<{
    total: number
    local: number
    migrant: number
    special: number
    buildingStats: { building: string; count: number }[]
  }>('/reports/resident-stats')
}

export const exportReport = (type: string, params?: any) => {
  return request.get(`/reports/export/${type}`, { params, responseType: 'blob' })
}
