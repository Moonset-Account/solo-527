import request from '@/utils/request'
import type {
  EmailTemplate,
  EmailTemplateVersion,
  BatchTask,
  EmailRecord,
  CallLog,
  RiskSample,
  PageResult,
  BaseQuery,
} from '@/types'

export const templateApi = {
  list: (params: BaseQuery) =>
    request.get<any, PageResult<EmailTemplate>>('/templates', { params }),
  get: (id: number) =>
    request.get<any, EmailTemplate>(`/templates/${id}`),
  create: (data: any) =>
    request.post<any, EmailTemplate>('/templates', data),
  update: (data: any) =>
    request.put<any, EmailTemplate>('/templates', data),
  delete: (id: number) =>
    request.delete(`/templates/${id}`),
  listVersions: (id: number) =>
    request.get<any, EmailTemplateVersion[]>(`/templates/${id}/versions`),
  getVersion: (id: number, version: number) =>
    request.get<any, EmailTemplateVersion>(`/templates/${id}/versions/${version}`),
  revertToVersion: (id: number, version: number) =>
    request.post<any, EmailTemplate>(`/templates/${id}/versions/${version}/revert`),
}

export const taskApi = {
  list: (params: BaseQuery) =>
    request.get<any, PageResult<BatchTask>>('/tasks', { params }),
  get: (id: number) =>
    request.get<any, BatchTask>(`/tasks/${id}`),
  create: (data: any) =>
    request.post<any, BatchTask>('/tasks', data),
  update: (data: any) =>
    request.put<any, BatchTask>('/tasks', data),
  delete: (id: number) =>
    request.delete(`/tasks/${id}`),
  start: (id: number) =>
    request.post<any, BatchTask>(`/tasks/${id}/start`),
}

export const recordApi = {
  list: (params: BaseQuery & { taskId?: number }) =>
    request.get<any, PageResult<EmailRecord>>('/records', { params }),
  get: (id: number) =>
    request.get<any, EmailRecord>(`/records/${id}`),
  getStatsByLegalOwner: () =>
    request.get<any, any>('/records/stats/by-legal-owner'),
}

export const callLogApi = {
  list: (params: BaseQuery) =>
    request.get<any, PageResult<CallLog>>('/call-logs', { params }),
  get: (id: number) =>
    request.get<any, CallLog>(`/call-logs/${id}`),
  getErrorStats: (startTime: string, endTime: string) =>
    request.get<any, any[]>('/call-logs/stats/errors', {
      params: { startTime, endTime },
    }),
  getApiStats: (startTime: string, endTime: string) =>
    request.get<any, any[]>('/call-logs/stats/apis', {
      params: { startTime, endTime },
    }),
}

export const riskSampleApi = {
  list: (params: BaseQuery & { taskId?: number }) =>
    request.get<any, PageResult<RiskSample>>('/risk-samples', { params }),
  get: (id: number) =>
    request.get<any, RiskSample>(`/risk-samples/${id}`),
  review: (id: number, reviewStatus: string, reviewComment?: string) =>
    request.post<any, RiskSample>(`/risk-samples/${id}/review`, null, {
      params: { reviewStatus, reviewComment },
    }),
  getStats: () =>
    request.get<any, any>('/risk-samples/stats'),
}

export const statsApi = {
  getOverview: () =>
    request.get<any, any>('/stats/overview'),
  getAccuracyStats: (params: BaseQuery) =>
    request.get<any, any>('/stats/accuracy', { params }),
}

export const exportApi = {
  exportEmailRecords: (params: BaseQuery) => {
    const queryStr = new URLSearchParams(params as any).toString()
    window.open(`/api/export/email-records?${queryStr}`, '_blank')
  },
  exportRiskSamples: (params: BaseQuery) => {
    const queryStr = new URLSearchParams(params as any).toString()
    window.open(`/api/export/risk-samples?${queryStr}`, '_blank')
  },
}
