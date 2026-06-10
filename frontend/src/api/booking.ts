import request from './request'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

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

export const exportBookingList = async (params?: any) => {
  const userStore = useUserStore()
  try {
    const response = await axios.get('/api/bookings/export/list', {
      params,
      responseType: 'blob',
      headers: userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {},
      timeout: 60000,
    })

    let fileName = '预约导出.xlsx'
    const disposition = response.headers['content-disposition']
    if (disposition) {
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
      if (match && match[1]) {
        try {
          fileName = decodeURIComponent(match[1])
        } catch { /* noop */ }
      } else {
        const match2 = disposition.match(/filename="?([^";]+)"?/i)
        if (match2 && match2[1]) {
          fileName = match2[1]
        }
      }
    }

    const blob = new Blob([response.data], {
      type: (response.headers['content-type'] as string) || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (err: any) {
    if (err.response && err.response.data && err.response.data instanceof Blob) {
      try {
        const text = await err.response.data.text()
        const json = JSON.parse(text)
        ElMessage.error(json.message || '导出失败')
      } catch {
        ElMessage.error('导出失败')
      }
    } else if (err.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      userStore.logout()
    } else {
      ElMessage.error(err.response?.data?.message || err.message || '导出失败')
    }
    throw err
  }
}

export const getNoShowList = (params?: any) =>
  request.get<any, any>('/bookings/no-show/list', { params })
