import { get, post, put, del } from '@/utils/request'
import type { Appointment, PagedResponse, PaginationParams } from '@/types'

export const getAppointmentList = (
  params: PaginationParams
): Promise<PagedResponse<Appointment>> => {
  return get<PagedResponse<Appointment>>('/appointments', params)
}

export const getAppointmentDetail = (id: number): Promise<Appointment> => {
  return get<Appointment>(`/appointments/${id}`)
}

export const createAppointment = (
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Appointment> => {
  return post<Appointment>('/appointments', data)
}

export const updateAppointment = (
  id: number,
  data: Partial<Appointment>
): Promise<Appointment> => {
  return put<Appointment>(`/appointments/${id}`, data)
}

export const deleteAppointment = (id: number): Promise<void> => {
  return del<void>(`/appointments/${id}`)
}

export const confirmAppointment = (id: number): Promise<void> => {
  return post<void>(`/appointments/${id}/confirm`)
}

export const cancelAppointment = (id: number, data: { reason: string }): Promise<void> => {
  return post<void>(`/appointments/${id}/cancel`, data)
}

export const completeAppointment = (id: number): Promise<void> => {
  return post<void>(`/appointments/${id}/complete`)
}

export const getTodayAppointments = (): Promise<Appointment[]> => {
  return get<Appointment[]>('/appointments/today')
}
