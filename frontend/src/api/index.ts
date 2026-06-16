import { request } from './request'
import type {
  LoginParams,
  LoginResponse,
  GridEvent,
  Resident,
  PatrolTask,
  TodoItem,
  EventStatusLog,
  RectificationReview,
  FollowUpVisit,
  PageResult,
  EventReportParams,
  ResidentFormData,
  DashboardReport,
  EventStatusReportItem,
  ClosureReport
} from '@/types'

export const login = (data: LoginParams) => {
  return request.post<LoginResponse>('/auth/login', data)
}

export const logout = () => {
  return request.post('/auth/logout')
}

export const getEventList = (params: Record<string, any>) => {
  return request.get<PageResult<GridEvent>>('/events', { params })
}

export const getEventDetail = (id: number) => {
  return request.get<GridEvent>(`/events/${id}`)
}

export const createEvent = (data: EventReportParams) => {
  return request.post<GridEvent>('/events', data)
}

export const updateEventStatus = (id: number, data: { newStatus: string; remark?: string; closeReason?: string }) => {
  return request.put<GridEvent>(`/events/${id}/status`, data)
}

export const getEventStatusLogs = (eventId: number) => {
  return request.get<EventStatusLog[]>(`/events/${eventId}/status-logs`)
}

export const getEventReviews = (eventId: number) => {
  return request.get<RectificationReview[]>(`/tasks/patrol/${eventId}/reviews`)
}

export const getEventVisits = (eventId: number) => {
  return request.get<FollowUpVisit[]>(`/tasks/patrol/${eventId}/visits`)
}

export const getResidentList = (params: Record<string, any>) => {
  return request.get<PageResult<Resident>>('/residents', { params })
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

export const exportResidents = (params?: Record<string, any>) => {
  return request.get('/residents/export', { params, responseType: 'blob' })
}

export const getPatrolTaskList = (params: Record<string, any>) => {
  return request.get<PageResult<PatrolTask>>('/tasks/patrol', { params })
}

export const getPatrolTaskDetail = (id: number) => {
  return request.get<PatrolTask>(`/tasks/patrol/${id}`)
}

export const updatePatrolTask = (id: number, data: Partial<PatrolTask>) => {
  return request.put<PatrolTask>(`/tasks/patrol/${id}`, data)
}

export const getTodoList = (params: Record<string, any>) => {
  return request.get<PageResult<TodoItem>>('/todos', { params })
}

export const completeTodo = (id: number) => {
  return request.put<TodoItem>(`/todos/${id}/complete`)
}

export const getDashboardReport = () => {
  return request.get<DashboardReport>('/reports/dashboard')
}

export const getEventStatusReport = () => {
  return request.get<EventStatusReportItem[]>('/reports/event-status')
}

export const getClosureReport = () => {
  return request.get<ClosureReport>('/reports/closure')
}

export const exportResidentsData = (params?: Record<string, any>) => {
  return request.get('/residents/export', { params, responseType: 'blob' })
}
