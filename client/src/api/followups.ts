import { get, post, put, del } from '@/utils/request'
import type { Followup, PagedResponse, PaginationParams } from '@/types'

export const getFollowupList = (params: PaginationParams): Promise<PagedResponse<Followup>> => {
  return get<PagedResponse<Followup>>('/followups', params)
}

export const getFollowupDetail = (id: number): Promise<Followup> => {
  return get<Followup>(`/followups/${id}`)
}

export const createFollowup = (
  data: Omit<Followup, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Followup> => {
  return post<Followup>('/followups', data)
}

export const updateFollowup = (id: number, data: Partial<Followup>): Promise<Followup> => {
  return put<Followup>(`/followups/${id}`, data)
}

export const deleteFollowup = (id: number): Promise<void> => {
  return del<void>(`/followups/${id}`)
}

export const completeFollowup = (
  id: number,
  data: {
    result: string
    nextFollowupDate?: string
    appointmentSuccess?: boolean
    appointmentDate?: string
    vehicleId?: number
    status?: 'completed' | 'no_answer'
  }
): Promise<void> => {
  return post<void>(`/followups/${id}/complete`, data)
}

export const cancelFollowup = (id: number, data: { reason: string }): Promise<void> => {
  return post<void>(`/followups/${id}/cancel`, data)
}

export const getMyTasks = (params: PaginationParams): Promise<PagedResponse<Followup>> => {
  return get<PagedResponse<Followup>>('/followups/my-tasks', params)
}
