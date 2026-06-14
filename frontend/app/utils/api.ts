import type {
  LoginRequest,
  LoginResponse,
  User,
  Customer,
  Plan,
  MaterialItem,
  ConstructionNode,
  Contract,
  BudgetVersion,
  AcceptanceTemplate,
  InspectionTemplate,
  InspectionTask,
  InspectionRecord,
  SatisfactionRecord,
  Notification,
  ConfigChangeLog,
  QualityReport,
  DelayReport,
  PaginatedResponse,
} from '~/types'

function getToken(): string | null {
  if (import.meta.client) {
    return localStorage.getItem('token')
  }
  return null
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function apiGet<T>(url: string, params?: Record<string, any>): Promise<T> {
  return $fetch<T>(`/api${url}`, {
    method: 'GET',
    params,
    headers: getHeaders(),
  })
}

export async function apiPost<T>(url: string, body?: any): Promise<T> {
  return $fetch<T>(`/api${url}`, {
    method: 'POST',
    body,
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
  })
}

export async function apiPut<T>(url: string, body?: any): Promise<T> {
  return $fetch<T>(`/api${url}`, {
    method: 'PUT',
    body,
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
  })
}

export async function apiDelete<T>(url: string): Promise<T> {
  return $fetch<T>(`/api${url}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
}

export const authApi = {
  login: (data: LoginRequest) => apiPost<LoginResponse>('/auth/login', data),
  me: () => apiGet<User>('/auth/me'),
  users: (params?: { page?: number; page_size?: number; role?: string }) =>
    apiGet<PaginatedResponse<User>>('/auth/users', params),
  inspectors: () => apiGet<User[]>('/auth/inspectors'),
  materialStaff: () => apiGet<User[]>('/auth/material-staff'),
  customers: (params?: { page?: number; page_size?: number }) =>
    apiGet<PaginatedResponse<Customer>>('/auth/customers', params),
  createCustomer: (data: Partial<Customer>) => apiPost<Customer>('/auth/customers', data),
}

export const contractApi = {
  list: (params?: { page?: number; page_size?: number; status?: string }) =>
    apiGet<PaginatedResponse<Contract>>('/contracts', params),
  get: (id: number) => apiGet<Contract>(`/contracts/${id}`),
  create: (data: Partial<Contract>) => apiPost<Contract>('/contracts', data),
  update: (id: number, data: Partial<Contract>) => apiPut<Contract>(`/contracts/${id}`, data),
  delete: (id: number) => apiDelete<{ ok: boolean }>(`/contracts/${id}`),
}

export const planApi = {
  list: (params?: { page?: number; page_size?: number; status?: string }) =>
    apiGet<PaginatedResponse<Plan>>('/plans', params),
  get: (id: number) => apiGet<Plan>(`/plans/${id}`),
  create: (data: Partial<Plan>) => apiPost<Plan>('/plans', data),
  update: (id: number, data: Partial<Plan>) => apiPut<Plan>(`/plans/${id}`, data),
  delete: (id: number) => apiDelete<{ ok: boolean }>(`/plans/${id}`),
}

export const inspectionApi = {
  list: (params?: { page?: number; page_size?: number; contract_id?: number; status?: string }) =>
    apiGet<PaginatedResponse<InspectionTask>>('/inspections', params),
  get: (id: number) => apiGet<InspectionTask>(`/inspections/${id}`),
  create: (data: Partial<InspectionTask>) => apiPost<InspectionTask>('/inspections', data),
  updateStatus: (id: number, data: { status: string }) =>
    apiPut<InspectionTask>(`/inspections/${id}/status`, data),
  submitRecord: (id: number, data: Partial<InspectionRecord>) =>
    apiPost<InspectionRecord>(`/inspections/${id}/record`, data),
}

export const satisfactionApi = {
  list: (params?: { page?: number; page_size?: number; contract_id?: number; level?: string }) =>
    apiGet<PaginatedResponse<SatisfactionRecord>>('/satisfaction', params),
  update: (id: number, data: { level?: string; comment?: string }) =>
    apiPut<SatisfactionRecord>(`/satisfaction/${id}`, data),
  remind: (id: number) => apiPost<Notification>(`/satisfaction/${id}/remind`),
}

export const configApi = {
  acceptanceTemplates: (params?: { page?: number; page_size?: number }) =>
    apiGet<PaginatedResponse<AcceptanceTemplate>>('/config/acceptance-templates', params),
  createAcceptanceTemplate: (data: Partial<AcceptanceTemplate>) =>
    apiPost<AcceptanceTemplate>('/config/acceptance-templates', data),
  updateAcceptanceTemplate: (id: number, data: Partial<AcceptanceTemplate>) =>
    apiPut<AcceptanceTemplate>(`/config/acceptance-templates/${id}`, data),
  deleteAcceptanceTemplate: (id: number) =>
    apiDelete<{ ok: boolean }>(`/config/acceptance-templates/${id}`),
  budgetVersions: (params?: { page?: number; page_size?: number; contract_id?: number }) =>
    apiGet<PaginatedResponse<BudgetVersion>>('/config/budget-versions', params),
  createBudgetVersion: (data: Partial<BudgetVersion>) =>
    apiPost<BudgetVersion>('/config/budget-versions', data),
  updateBudgetVersion: (id: number, data: Partial<BudgetVersion>) =>
    apiPut<BudgetVersion>(`/config/budget-versions/${id}`, data),
  deleteBudgetVersion: (id: number) => apiDelete<{ ok: boolean }>(`/config/budget-versions/${id}`),
  inspectionTemplates: (params?: { page?: number; page_size?: number }) =>
    apiGet<PaginatedResponse<InspectionTemplate>>('/config/inspection-templates', params),
  createInspectionTemplate: (data: Partial<InspectionTemplate>) =>
    apiPost<InspectionTemplate>('/config/inspection-templates', data),
  updateInspectionTemplate: (id: number, data: Partial<InspectionTemplate>) =>
    apiPut<InspectionTemplate>(`/config/inspection-templates/${id}`, data),
  deleteInspectionTemplate: (id: number) =>
    apiDelete<{ ok: boolean }>(`/config/inspection-templates/${id}`),
  changelog: (params?: { page?: number; page_size?: number; entity_type?: string }) =>
    apiGet<PaginatedResponse<ConfigChangeLog>>('/config/changelog', params),
}

export const reportApi = {
  quality: (params?: { year?: number; month?: number; contract_id?: number }) =>
    apiGet<QualityReport>('/reports/quality', params),
  delay: (params?: { year?: number; month?: number; contract_id?: number }) =>
    apiGet<DelayReport>('/reports/delay', params),
}

export const notificationApi = {
  list: (params?: { page?: number; page_size?: number; is_read?: boolean }) =>
    apiGet<PaginatedResponse<Notification>>('/notifications', params),
  markRead: (id: number) => apiPut<{ ok: boolean; message?: string }>(`/notifications/${id}/read`),
}

export const demoApi = {
  seed: () => apiPost<{ ok: boolean; count: number; message?: string }>('/demo/seed'),
  clear: () =>
    apiDelete<{
      ok: boolean
      deleted: {
        contracts: number
        inspections: number
        records: number
        notifications: number
        satisfaction: number
        plans: number
        customers: number
        users: number
        budget_versions: number
        acceptance_templates: number
        inspection_templates: number
        config_logs: number
      }
    }>('/demo/clear'),
}
