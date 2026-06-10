import request from './request'

export const getStaffList = (params?: { type?: string; active?: string }) =>
  request.get<any, any>('/staff', { params })

export const getStaffDetail = (id: number | string) =>
  request.get<any, any>(`/staff/${id}`)

export const createStaff = (data: any) =>
  request.post<any, any>('/staff', data)

export const updateStaff = (id: number | string, data: any) =>
  request.put<any, any>(`/staff/${id}`, data)

export const deleteStaff = (id: number | string) =>
  request.delete<any, any>(`/staff/${id}`)

export const getStaffSchedules = (id: number | string, params?: any) =>
  request.get<any, any>(`/staff/${id}/schedules`, { params })

export const addStaffSchedule = (id: number | string, data: any) =>
  request.post<any, any>(`/staff/${id}/schedules`, data)

export const updateStaffSchedule = (id: number | string, data: any) =>
  request.put<any, any>(`/staff/schedules/${id}`, data)

export const deleteStaffSchedule = (id: number | string) =>
  request.delete<any, any>(`/staff/schedules/${id}`)
