import api from './index'

export interface ScheduleBatch {
  batchId: string
  batchNo: string
  recipeName: string
  plannedQty: number
  unit: string
}

export interface Schedule {
  _id: string
  date: string
  teamId: string
  teamName: string
  batches: ScheduleBatch[]
  status: string
  isSandbox: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedSchedules {
  items: Schedule[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const fetchSchedules = (params?: Record<string, unknown>) => api.get('/schedules', { params })
export const fetchSchedule = (id: string) => api.get(`/schedules/${id}`)
export const fetchSchedulesByDate = (date: string) => api.get(`/schedules/date/${date}`)
export const createSchedule = (data: Partial<Schedule>) => api.post('/schedules', data)
export const updateSchedule = (id: string, data: Partial<Schedule>) => api.put(`/schedules/${id}`, data)
export const deleteSchedule = (id: string) => api.delete(`/schedules/${id}`)
export const addScheduleBatch = (id: string, batchData: ScheduleBatch) => api.post(`/schedules/${id}/batches`, batchData)
export const removeScheduleBatch = (id: string, batchId: string) => api.delete(`/schedules/${id}/batches/${batchId}`)
