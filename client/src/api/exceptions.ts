import { get, post, put, del } from '@/utils/request'
import type { ExceptionRecord, PagedResponse, PaginationParams } from '@/types'

export const getExceptionList = (
  params: PaginationParams
): Promise<PagedResponse<ExceptionRecord>> => {
  return get<PagedResponse<ExceptionRecord>>('/exceptions', params)
}

export const getExceptionDetail = (id: number): Promise<ExceptionRecord> => {
  return get<ExceptionRecord>(`/exceptions/${id}`)
}

export const createException = (
  data: Omit<ExceptionRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExceptionRecord> => {
  return post<ExceptionRecord>('/exceptions', data)
}

export const updateException = (
  id: number,
  data: Partial<ExceptionRecord>
): Promise<ExceptionRecord> => {
  return put<ExceptionRecord>(`/exceptions/${id}`, data)
}

export const deleteException = (id: number): Promise<void> => {
  return del<void>(`/exceptions/${id}`)
}

export const handleException = (
  id: number,
  data: { handler: string; status: ExceptionRecord['status']; solution?: string }
): Promise<void> => {
  return post<void>(`/exceptions/${id}/handle`, data)
}

export const closeException = (id: number, data: { solution: string }): Promise<void> => {
  return post<void>(`/exceptions/${id}/close`, data)
}
