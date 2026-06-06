import api from './api'
import type { Invoice, PaymentItem, LeaveRequest, ApiResponse } from '@/types'

export const paymentApi = {
  getItems: (params?: any) =>
    api.get<ApiResponse<PaymentItem[]>>('/payments/items/', { params }),

  createItem: (data: any) =>
    api.post<PaymentItem>('/payments/items/', data),

  updateItem: (id: number, data: any) =>
    api.patch<PaymentItem>(`/payments/items/${id}/`, data),

  getInvoices: (params?: any) =>
    api.get<ApiResponse<Invoice[]>>('/payments/invoices/', { params }),

  getInvoice: (id: number) =>
    api.get<Invoice>(`/payments/invoices/${id}/`),

  createInvoice: (data: any) =>
    api.post<Invoice>('/payments/invoices/', data),

  updateInvoice: (id: number, data: any) =>
    api.patch<Invoice>(`/payments/invoices/${id}/`, data),

  markPaid: (id: number, data: any) =>
    api.post<Invoice>(`/payments/invoices/${id}/mark_paid/`, data),

  sendReminder: (id: number) =>
    api.post(`/payments/invoices/${id}/send_reminder/`),

  getStatistics: () =>
    api.get('/payments/invoices/statistics/')
}

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

export const dashboardApi = {
  getOverview: () =>
    api.get('/dashboard/overview/'),

  getPickupTrend: (days = 7) =>
    api.get('/dashboard/pickup-trend/', { params: { days } }),

  getClassUtilization: () =>
    api.get('/dashboard/class-utilization/'),

  getStatusBreakdown: () =>
    api.get('/dashboard/status-breakdown/')
}
