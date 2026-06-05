import request from './request'

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post('/auth/login', data),
}

export const dashboardApi = {
  getStats: () => request.get('/dashboard/stats'),
}

export const memberApi = {
  list: () => request.get('/members'),
  get: (id: number) => request.get(`/members/${id}`),
  create: (data: any) => request.post('/members', data),
  update: (id: number, data: any) => request.put(`/members/${id}`, data),
  search: (keyword: string) => request.get(`/members/search?keyword=${keyword}`),
}

export const bookingApi = {
  create: (data: any) => request.post('/bookings', data),
  complete: (id: number) => request.put(`/bookings/${id}/complete`),
  cancel: (id: number, reason?: string) =>
    request.put(`/bookings/${id}/cancel`, null, { params: { reason } }),
  getByMember: (memberId: number) => request.get(`/bookings/member/${memberId}`),
  getByCoach: (coachId: number, date: string) =>
    request.get(`/bookings/coach/${coachId}?date=${date}`),
}

export const fileApi = {
  upload: (file: File, category = 'general') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    return request.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
