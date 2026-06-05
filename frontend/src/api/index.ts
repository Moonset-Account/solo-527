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

export const coachApi = {
  list: () => request.get('/coaches'),
  listActive: () => request.get('/coaches/active'),
  get: (id: number) => request.get(`/coaches/${id}`),
}

export const coursePackageApi = {
  list: () => request.get('/course-packages'),
  listActive: () => request.get('/course-packages/active'),
  get: (id: number) => request.get(`/course-packages/${id}`),
}

export const memberPackageApi = {
  getByMember: (memberId: number) => request.get(`/member-packages/member/${memberId}`),
  create: (data: any) => request.post('/member-packages', data),
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

export const groupClassApi = {
  list: (startDate?: string, endDate?: string) => {
    let url = '/group-classes'
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`
    }
    return request.get(url)
  },
  get: (id: number) => request.get(`/group-classes/${id}`),
  create: (data: any) => request.post('/group-classes', data),
  update: (id: number, data: any) => request.put(`/group-classes/${id}`, data),
  cancel: (id: number, reason?: string) =>
    request.put(`/group-classes/${id}/cancel`, null, { params: { reason } }),
}

export const memberFreezeApi = {
  getByMember: (memberId: number) => request.get(`/member-freezes/member/${memberId}`),
  create: (data: any) => request.post('/member-freezes', data),
  deactivate: (id: number) => request.put(`/member-freezes/${id}/deactivate`),
}

export const coachPerformanceApi = {
  getMyStats: (year?: number, month?: number) => {
    let url = '/coach-performance/my-stats'
    if (year && month) {
      url += `?year=${year}&month=${month}`
    }
    return request.get(url)
  },
  getMyBookings: (date?: string) => {
    let url = '/coach-performance/my-bookings'
    if (date) {
      url += `?date=${date}`
    }
    return request.get(url)
  },
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
