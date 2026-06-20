import request from './request'

export interface ActivityOrganizer {
  organizerId: string
  organizerName: string
}

export interface Activity {
  _id: string
  title: string
  description: string
  organizer: ActivityOrganizer
  location: string
  startTime: string
  endTime: string
  maxParticipants: number
  currentParticipants: number
  fee: number
  guaranteeEnabled: boolean
  status: 'draft' | 'published' | 'closed' | 'completed'
  isRegistered?: boolean
  createdAt: string
  updatedAt: string
}

export interface ActivityListParams {
  status?: string
  keyword?: string
  page?: number
  limit?: number
  userId?: string
}

export interface CreateActivityData {
  title: string
  description: string
  organizer: ActivityOrganizer
  startTime: string
  endTime: string
  location: string
  maxParticipants: number
  fee: number
  status?: string
  guaranteeEnabled?: boolean
}

export interface UpdateActivityData {
  title?: string
  description?: string
  organizer?: ActivityOrganizer
  startTime?: string
  endTime?: string
  location?: string
  maxParticipants?: number
  fee?: number
  status?: string
  guaranteeEnabled?: boolean
}

export interface RegisterData {
  userId: string
  userName: string
}

export interface CancelRegistrationData {
  userId: string
}

export const getActivities = (params?: ActivityListParams) => {
  return request.get('/activities', { params })
}

export const getActivity = (id: string, userId?: string) => {
  return request.get(`/activities/${id}`, { params: userId ? { userId } : undefined })
}

export const createActivity = (data: CreateActivityData) => {
  return request.post('/activities', data)
}

export const updateActivity = (id: string, data: UpdateActivityData) => {
  return request.patch(`/activities/${id}`, data)
}

export const registerActivity = (id: string, data: RegisterData) => {
  return request.post(`/activities/${id}/register`, data)
}

export const cancelRegistration = (id: string, data: CancelRegistrationData) => {
  return request.post(`/activities/${id}/cancel`, data)
}
