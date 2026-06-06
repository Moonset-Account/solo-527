import api from './api'
import type { LeaveRequest, ApiResponse } from '@/types'

export const leaveApi = {
  getList: (params?: any) =>
    api.get<ApiResponse<LeaveRequest[]>>('/leave/requests/', { params }),

  getDetail: (id: number) =>
    api.get<LeaveRequest>(`/leave/requests/${id}/`),

  create: (data: any) =>
    api.post<LeaveRequest>('/leave/requests/', data),

  approve: (id: number, comment?: string) =>
    api.post<LeaveRequest>(`/leave/requests/${id}/approve/`, { comment }),

  reject: (id: number, comment?: string) =>
    api.post<LeaveRequest>(`/leave/requests/${id}/reject/`, { comment }),

  cancel: (id: number) =>
    api.post<LeaveRequest>(`/leave/requests/${id}/cancel/`),

  getPendingCount: () =>
    api.get<{ pending_count: number }>('/leave/requests/pending_count/')
}
