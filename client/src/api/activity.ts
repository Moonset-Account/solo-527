import request from './request'

export interface Activity {
  _id: string
  title: string
  description: string
  organizer: string
  location: string
  startTime: string
  endTime: string
  maxParticipants: number
  currentParticipants: number
  fee: number
  guaranteeEnabled: boolean
  status: 'draft' | 'open' | 'ongoing' | 'closed' | 'cancelled'
  isRegistered?: boolean
  createdAt: string
  updatedAt: string
}

export interface ActivityListParams {
  keyword?: string
  status?: string
  page?: number
  pageSize?: number
}

export const getActivities = (params?: ActivityListParams) => {
  return request.get('/activities', { params })
}

export const getActivity = (id: string) => {
  return request.get(`/activities/${id}`)
}

export const createActivity = (data: Partial<Activity>) => {
  return request.post('/activities', data)
}

export const updateActivity = (id: string, data: Partial<Activity>) => {
  return request.put(`/activities/${id}`, data)
}

export const registerActivity = (id: string) => {
  return request.post(`/activities/${id}/register`)
}

export const cancelRegistration = (id: string) => {
  return request.post(`/activities/${id}/cancel`)
}
