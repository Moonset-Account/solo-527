import api from './api'
import type { Invoice, PaymentItem, ApiResponse } from '@/types'

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
