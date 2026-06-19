import { get, post, put, del } from '@/utils/request'
import type { Lead, PagedResponse, PaginationParams } from '@/types'

export const getLeadList = (params: PaginationParams): Promise<PagedResponse<Lead>> => {
  return get<PagedResponse<Lead>>('/leads', params)
}

export const getLeadDetail = (id: number): Promise<Lead> => {
  return get<Lead>(`/leads/${id}`)
}

export const createLead = (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  return post<Lead>('/leads', data)
}

export const updateLead = (id: number, data: Partial<Lead>): Promise<Lead> => {
  return put<Lead>(`/leads/${id}`, data)
}

export const deleteLead = (id: number): Promise<void> => {
  return del<void>(`/leads/${id}`)
}

export const assignLead = (id: number, data: { assigneeId: number; assigneeName: string }): Promise<void> => {
  return post<void>(`/leads/${id}/assign`, data)
}

export const batchAssignLeads = (data: {
  leadIds: number[]
  assigneeId: number
  assigneeName: string
}): Promise<void> => {
  return post<void>('/leads/batch-assign', data)
}

export const updateLeadStatus = (
  id: number,
  data: { status: Lead['status']; remark?: string }
): Promise<void> => {
  return post<void>(`/leads/${id}/status`, data)
}
