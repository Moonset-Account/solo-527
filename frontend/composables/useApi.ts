import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import type {
  ARRecord,
  ARRecordListResponse,
  ARRecordSummary,
  Payment,
  PaymentListResponse,
  Refund,
  RefundListResponse,
  WriteoffListResponse,
  CashGapForecastListResponse,
  Reminder,
  ReminderListResponse,
  FilterParams,
  ExportParams,
} from '~/types'

export const useApi = () => {
  const config = useRuntimeConfig()
  const client: AxiosInstance = axios.create({
    baseURL: config.public.apiBase as string,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const message = error.response?.data?.detail || error.message || '请求失败'
      console.error('[API Error]', message)
      return Promise.reject(error)
    },
  )

  async function get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await client.get<T>(url, { params })
    return response.data
  }

  async function post<T>(url: string, data?: Record<string, any>): Promise<T> {
    const response = await client.post<T>(url, data)
    return response.data
  }

  async function put<T>(url: string, data?: Record<string, any>): Promise<T> {
    const response = await client.put<T>(url, data)
    return response.data
  }

  async function del<T>(url: string): Promise<T> {
    const response = await client.delete<T>(url)
    return response.data
  }

  function buildQuery(filters: Partial<FilterParams>): Record<string, any> {
    const query: Record<string, any> = {}
    if (filters.date_from) query.date_from = filters.date_from
    if (filters.date_to) query.date_to = filters.date_to
    if (filters.responsible_person) query.responsible_person = filters.responsible_person
    if (filters.status) query.status = filters.status
    if (filters.page) query.page = filters.page
    if (filters.page_size) query.page_size = filters.page_size
    return query
  }

  return {
    client,

    ar: {
      list: (filters: Partial<FilterParams>) =>
        get<ARRecordListResponse>('/ar-records', buildQuery(filters)),
      summary: () => get<ARRecordSummary[]>('/ar-records/summary'),
      get: (id: string) => get<ARRecord>(`/ar-records/${id}`),
      create: (data: Partial<ARRecord>) => post<ARRecord>('/ar-records', data),
      update: (id: string, data: Partial<ARRecord>) => put<ARRecord>(`/ar-records/${id}`, data),
      drillDown: (id: string) => get<ARRecord[]>(`/ar-records/${id}/drilldown`),
    },

    payment: {
      list: (filters: Partial<FilterParams>) =>
        get<PaymentListResponse>('/payments', buildQuery(filters)),
      get: (id: string) => get<Payment>(`/payments/${id}`),
      create: (data: Partial<Payment>) => post<Payment>('/payments', data),
      update: (id: string, data: Partial<Payment>) => put<Payment>(`/payments/${id}`, data),
    },

    refund: {
      list: (filters: Partial<FilterParams>) =>
        get<RefundListResponse>('/refunds', buildQuery(filters)),
      get: (id: string) => get<Refund>(`/refunds/${id}`),
      create: (data: Partial<Refund>) => post<Refund>('/refunds', data),
      review: (id: string, data: { reviewer: string; status: string; review_note?: string }) =>
        post<Refund>(`/refunds/${id}/review`, data),
      update: (id: string, data: Partial<Refund>) => put<Refund>(`/refunds/${id}`, data),
    },

    writeoff: {
      list: (filters: Partial<FilterParams>) =>
        get<WriteoffListResponse>('/writeoffs', buildQuery(filters)),
    },

    cashGap: {
      list: (filters: Partial<FilterParams>) =>
        get<CashGapForecastListResponse>('/cash-gaps', buildQuery(filters)),
      dashboard: () => get<any>('/cash-gaps/dashboard'),
      get: (id: string) => get<any>(`/cash-gaps/${id}`),
      create: (data: any) => post<any>('/cash-gaps', data),
      update: (id: string, data: any) => put<any>(`/cash-gaps/${id}`, data),
    },

    reminder: {
      list: (filters: Partial<FilterParams>) =>
        get<ReminderListResponse>('/reminders', buildQuery(filters)),
      get: (id: string) => get<Reminder>(`/reminders/${id}`),
      create: (data: Partial<Reminder>) => post<Reminder>('/reminders', data),
      update: (id: string, data: Partial<Reminder>) => put<Reminder>(`/reminders/${id}`, data),
      escalate: (id: string, escalatedTo: string) =>
        post<Reminder>(`/reminders/${id}/escalate`, { escalated_to: escalatedTo }),
    },

    export: (params: ExportParams) => post<Blob>('/exports/', {
      module: params.module,
      format: params.format,
      filters: params.filters,
    }),
  }
}
