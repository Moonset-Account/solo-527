import axios from 'axios'
import type { AxiosInstance } from 'axios'
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
  CashGapForecast,
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

  function buildQuery(filters: Partial<FilterParams> & Record<string, any>): Record<string, any> {
    const query: Record<string, any> = {}
    if (filters.date_from) query.date_from = filters.date_from
    if (filters.date_to) query.date_to = filters.date_to
    if (filters.responsible_person) query.responsible_person = filters.responsible_person
    if (filters.status) query.status = filters.status
    if (filters.page) query.page = filters.page
    if (filters.page_size) query.page_size = filters.page_size
    if (filters.type) query.type = filters.type
    if (filters.assigned_to) query.assigned_to = filters.assigned_to
    if (filters.gap_status) query.gap_status = filters.gap_status
    if (filters.applicant) query.applicant = filters.applicant
    if (filters.operator) query.operator = filters.operator
    if (filters.ar_record_id) query.ar_record_id = filters.ar_record_id
    if (filters.period_start) query.period_start = filters.period_start
    if (filters.period_end) query.period_end = filters.period_end
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
      list: (filters: Partial<FilterParams> & Record<string, any>) =>
        get<PaymentListResponse>('/payments', buildQuery(filters)),
      get: (id: string) => get<Payment>(`/payments/${id}`),
      create: (data: Partial<Payment>) => post<Payment>('/payments', data),
      update: (id: string, data: Partial<Payment>) => put<Payment>(`/payments/${id}`, data),
    },

    refund: {
      list: (filters: Partial<FilterParams> & Record<string, any>) =>
        get<RefundListResponse>('/refunds', buildQuery(filters)),
      get: (id: string) => get<Refund>(`/refunds/${id}`),
      create: (data: Partial<Refund>) => post<Refund>('/refunds', data),
      review: (id: string, data: { reviewer: string; status: string; review_note?: string }) =>
        post<Refund>(`/refunds/${id}/review`, data),
      update: (id: string, data: Partial<Refund>) => put<Refund>(`/refunds/${id}`, data),
    },

    writeoff: {
      list: (filters: Partial<FilterParams> & Record<string, any>) =>
        get<WriteoffListResponse>('/writeoffs', buildQuery(filters)),
      get: (id: string) => get<any>(`/writeoffs/${id}`),
      create: (data: any) => post<any>('/writeoffs', data),
      approve: (id: string, approver: string) =>
        post<any>(`/writeoffs/${id}/approve`, { approver }),
      update: (id: string, data: any) => put<any>(`/writeoffs/${id}`, data),
    },

    cashGap: {
      list: (filters: Partial<FilterParams> & Record<string, any>) =>
        get<CashGapForecastListResponse>('/cash-gaps', buildQuery(filters)),
      dashboard: () => get<any>('/cash-gaps/dashboard'),
      get: (id: string) => get<CashGapForecast>(`/cash-gaps/${id}`),
      create: (data: Partial<CashGapForecast>) => post<CashGapForecast>('/cash-gaps', data),
      update: (id: string, data: Partial<CashGapForecast>) => put<CashGapForecast>(`/cash-gaps/${id}`, data),
    },

    reminder: {
      list: (filters: Partial<FilterParams> & Record<string, any>) =>
        get<ReminderListResponse>('/reminders', buildQuery(filters)),
      get: (id: string) => get<Reminder>(`/reminders/${id}`),
      create: (data: Partial<Reminder>) => post<Reminder>('/reminders', data),
      update: (id: string, data: Partial<Reminder>) => put<Reminder>(`/reminders/${id}`, data),
      escalate: (id: string, escalatedTo: string) =>
        post<Reminder>(`/reminders/${id}/escalate`, { escalated_to: escalatedTo }),
    },

    exportFile: async (params: ExportParams): Promise<void> => {
      const response = await client.post('/exports/', {
        module: params.module,
        format: params.format,
        filters: params.filters,
      }, { responseType: 'blob' })
      const blob = response.data as Blob
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const disposition = response.headers['content-disposition']
      const filename = disposition
        ? disposition.split('filename=')[1]?.replace(/"/g, '')
        : `${params.module}_${new Date().toISOString().slice(0, 10)}.${params.format}`
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  }
}
