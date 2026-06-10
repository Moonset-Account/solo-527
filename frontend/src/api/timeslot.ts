import request from './request'

export const getTimeSlotList = (params?: any) =>
  request.get<any, any>('/time-slots', { params })

export const getTimeSlotCalendar = (params?: any) =>
  request.get<any, any>('/time-slots/calendar', { params })

export const getAvailableSlots = (params?: any) =>
  request.get<any, any>('/time-slots/available', { params })

export const createTimeSlot = (data: any) =>
  request.post<any, any>('/time-slots', data)

export const bulkCreateTimeSlots = (data: any) =>
  request.post<any, any>('/time-slots/bulk', data)

export const updateTimeSlot = (id: number | string, data: any) =>
  request.put<any, any>(`/time-slots/${id}`, data)

export const deleteTimeSlot = (id: number | string) =>
  request.delete<any, any>(`/time-slots/${id}`)
