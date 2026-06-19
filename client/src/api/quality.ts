import { get, post, put } from '@/utils/request'
import type { QualityRecord, StatusTransition, PagedResponse, PaginationParams } from '@/types'

export const getQualityRecordList = (
  params: PaginationParams
): Promise<PagedResponse<QualityRecord>> => {
  return get<PagedResponse<QualityRecord>>('/quality/records', params)
}

export const getQualityRecordDetail = (id: number): Promise<QualityRecord> => {
  return get<QualityRecord>(`/quality/records/${id}`)
}

export const createQualityRecord = (
  data: Omit<QualityRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<QualityRecord> => {
  return post<QualityRecord>('/quality/records', data)
}

export const updateQualityRecord = (
  id: number,
  data: Partial<QualityRecord>
): Promise<QualityRecord> => {
  return put<QualityRecord>(`/quality/records/${id}`, data)
}

export const updateQualityStatus = (
  id: number,
  data: { status: QualityRecord['status']; remark?: string }
): Promise<void> => {
  return post<void>(`/quality/records/${id}/status`, data)
}

export const getStatusTransitions = (workOrderId: number): Promise<StatusTransition[]> => {
  return get<StatusTransition[]>(`/quality/transitions/${workOrderId}`)
}

export const getQualityReport = (params: {
  startDate: string
  endDate: string
}): Promise<{
  total: number
  passed: number
  failed: number
  passRate: number
  details: { date: string; total: number; passed: number }[]
}> => {
  return get('/quality/report', params)
}

export const getQualityStats = (): Promise<{
  pending: number
  inspecting: number
  passed: number
  failed: number
  repaired: number
}> => {
  return get('/quality/stats')
}

export const getStatistics = (params: {
  startDate: string
  endDate: string
}): Promise<{
  totalOrders: number
  completionRate: number
  exceptionRate: number
  noShowRate: number
}> => {
  return get('/quality/statistics', params)
}

export const getTransitionList = (
  params: PaginationParams
): Promise<PagedResponse<StatusTransition>> => {
  return get<PagedResponse<StatusTransition>>('/quality/transitions', params)
}

export const getNoShowList = (
  params: PaginationParams
): Promise<
  PagedResponse<{
    id: number
    workOrderId: number
    customerName: string
    customerPhone: string
    appointmentTime: string
    reason: string
    handler: string
    handleTime: string
  }>
> => {
  return get('/quality/no-shows', params)
}
