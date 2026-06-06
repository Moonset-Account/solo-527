import api from './api'
import type { PickupRecord, PickupTask, ApiResponse } from '@/types'

export const pickupApi = {
  getRecords: (params?: any) =>
    api.get<ApiResponse<PickupRecord[]>>('/pickup/records/', { params }),

  getRecord: (id: number) =>
    api.get<PickupRecord>(`/pickup/records/${id}/`),

  createRecord: (data: any) =>
    api.post<PickupRecord>('/pickup/records/', data),

  verifyRecord: (id: number, data: { status: string; reject_reason?: string; temperature?: number }) =>
    api.post<PickupRecord>(`/pickup/records/${id}/verify/`, data),

  checkAuthorized: (data: { child_id: number; phone: string; name?: string }) =>
    api.post<{ authorized: boolean; reason?: string; person?: any }>('/pickup/records/check_authorized/', data),

  getTasks: (params?: any) =>
    api.get<ApiResponse<PickupTask[]>>('/pickup/tasks/', { params }),

  createTask: (data: any) =>
    api.post<PickupTask>('/pickup/tasks/', data),

  updateTask: (id: number, data: any) =>
    api.patch<PickupTask>(`/pickup/tasks/${id}/`, data)
}
