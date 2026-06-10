import request from './request'

export interface BookingListParams {
  page?: number
  perPage?: number
  keyword?: string
  status?: string
  startDate?: string
  endDate?: string
  staffId?: number | string
  onlyNoShow?: string
}

export const getBookingList = (params?: BookingListParams) =>
  request.get<any, any>('/bookings', { params })

export const getBookingDetail = (id: number | string) =>
  request.get<any, any>(`/bookings/${id}`)

export const createBooking = (data: any) =>
  request.post<any, any>('/bookings', data)

export const updateBooking = (id: number | string, data: any) =>
  request.put<any, any>(`/bookings/${id}`, data)

export const updateBookingStatus = (id: number | string, data: any) =>
  request.patch<any, any>(`/bookings/${id}/status`, data)

export const deleteBooking = (id: number | string) =>
  request.delete<any, any>(`/bookings/${id}`)

export const addBookingNote = (id: number | string, data: { content: string; type?: string }) =>
  request.post<any, any>(`/bookings/${id}/notes`, data)

export const getBookingNotes = (id: number | string) =>
  request.get<any, any>(`/bookings/${id}/notes`)

export const uploadAttachment = (id: number | string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return request.post<any, any>(`/bookings/${id}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getBookingAttachments = (id: number | string) =>
  request.get<any, any>(`/bookings/${id}/attachments`)

export const getBookingHistory = (id: number | string) =>
  request.get<any, any>(`/bookings/${id}/history`)

export const exportBookingList = (params?: any) => {
  const query = new URLSearchParams(params).toString()
  window.open(`/api/bookings/export/list${query ? '?' + query : ''}`, '_blank')
}

export const getNoShowList = (params?: any) =>
  request.get<any, any>('/bookings/no-show/list', { params })
