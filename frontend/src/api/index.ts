import request from '@/utils/request'
import type {
  LoginRequest,
  LoginResponse,
  Member,
  Coach,
  MemberPackage,
  GroupClass,
  Booking,
  MemberFreeze,
  BodyMeasurement,
  DashboardStats,
  CoachPerformance,
  FunnelItem,
  Notification,
  AuditLog
} from '@/types'

export const authApi = {
  login: (data: LoginRequest) => request.post<any, LoginResponse>('/auth/login', data)
}

export const memberApi = {
  list: (params?: { status?: string; name?: string }) => request.get<any, Member[]>('/members', { params }),
  get: (id: number) => request.get<any, Member>(`/members/${id}`),
  create: (data: Partial<Member>) => request.post<any, Member>('/members', data),
  update: (id: number, data: Partial<Member>) => request.put<any, Member>(`/members/${id}`, data),
  getByPhone: (phone: string) => request.get<any, Member>(`/members/phone/${phone}`),
  getNewMembers: (startDate: string, endDate: string) =>
    request.get<any, Member[]>(`/members/new?startDate=${startDate}&endDate=${endDate}`),
  countActive: () => request.get<any, number>('/members/count/active')
}

export const coachApi = {
  list: (params?: { specialty?: string }) => request.get<any, Coach[]>('/coaches', { params }),
  get: (id: number) => request.get<any, Coach>(`/coaches/${id}`),
  create: (data: Partial<Coach>) => request.post<any, Coach>('/coaches', data),
  update: (id: number, data: Partial<Coach>) => request.put<any, Coach>(`/coaches/${id}`, data),
  getByUserId: (userId: number) => request.get<any, Coach>(`/coaches/user/${userId}`)
}

export const packageApi = {
  list: (params?: { status?: string }) => request.get<any, MemberPackage[]>('/packages', { params }),
  get: (id: number) => request.get<any, MemberPackage>(`/packages/${id}`),
  create: (data: Partial<MemberPackage>) => request.post<any, MemberPackage>('/packages', data),
  update: (id: number, data: Partial<MemberPackage>) => request.put<any, MemberPackage>(`/packages/${id}`, data),
  getByMember: (memberId: number) => request.get<any, MemberPackage[]>(`/packages/member/${memberId}`),
  getActiveByMember: (memberId: number) => request.get<any, MemberPackage[]>(`/packages/member/${memberId}/active`),
  getByCoach: (coachId: number) => request.get<any, MemberPackage[]>(`/packages/coach/${coachId}`),
  getExpiring: (start: string, end: string) =>
    request.get<any, MemberPackage[]>(`/packages/expiring?start=${start}&end=${end}`)
}

export const groupClassApi = {
  list: (params?: { status?: string }) => request.get<any, GroupClass[]>('/group-classes', { params }),
  get: (id: number) => request.get<any, GroupClass>(`/group-classes/${id}`),
  create: (data: Partial<GroupClass>) => request.post<any, GroupClass>('/group-classes', data),
  update: (id: number, data: Partial<GroupClass>) => request.put<any, GroupClass>(`/group-classes/${id}`, data),
  cancel: (id: number) => request.put<any, GroupClass>(`/group-classes/${id}/cancel`),
  getByDate: (date: string) => request.get<any, GroupClass[]>(`/group-classes/date/${date}`),
  getByDateRange: (startDate: string, endDate: string) =>
    request.get<any, GroupClass[]>(`/group-classes/range?startDate=${startDate}&endDate=${endDate}`),
  getByCoach: (coachId: number) => request.get<any, GroupClass[]>(`/group-classes/coach/${coachId}`),
  getCoachRange: (coachId: number, startDate: string, endDate: string) =>
    request.get<any, GroupClass[]>(`/group-classes/coach/${coachId}/range?startDate=${startDate}&endDate=${endDate}`)
}

export const bookingApi = {
  list: (params?: {
    memberId?: number
    coachId?: number
    startDate?: string
    endDate?: string
    status?: string
  }) => request.get<any, Booking[]>('/bookings', { params }),
  get: (id: number) => request.get<any, Booking>(`/bookings/${id}`),
  create: (data: Partial<Booking>) => request.post<any, Booking>('/bookings', data),
  cancel: (id: number) => request.put<any, Booking>(`/bookings/${id}/cancel`),
  checkIn: (id: number) => request.put<any, Booking>(`/bookings/${id}/checkin`),
  complete: (id: number) => request.put<any, Booking>(`/bookings/${id}/complete`),
  getCoachByDate: (coachId: number, date: string) =>
    request.get<any, Booking[]>(`/bookings/coach/${coachId}/date/${date}`)
}

export const freezeApi = {
  list: (params?: { status?: string }) => request.get<any, MemberFreeze[]>('/freezes', { params }),
  get: (id: number) => request.get<any, MemberFreeze>(`/freezes/${id}`),
  create: (data: Partial<MemberFreeze>) => request.post<any, MemberFreeze>('/freezes', data),
  cancel: (id: number) => request.put<any, MemberFreeze>(`/freezes/${id}/cancel`),
  getByMember: (memberId: number) => request.get<any, MemberFreeze[]>(`/freezes/member/${memberId}`),
  getActiveByMember: (memberId: number) => request.get<any, MemberFreeze[]>(`/freezes/member/${memberId}/active`),
  checkFrozen: (memberId: number, date: string) =>
    request.get<any, boolean>(`/freezes/member/${memberId}/check?date=${date}`)
}

export const measurementApi = {
  get: (id: number) => request.get<any, BodyMeasurement>(`/measurements/${id}`),
  create: (data: Partial<BodyMeasurement>) => request.post<any, BodyMeasurement>('/measurements', data),
  update: (id: number, data: Partial<BodyMeasurement>) =>
    request.put<any, BodyMeasurement>(`/measurements/${id}`, data),
  getByMember: (memberId: number) => request.get<any, BodyMeasurement[]>(`/measurements/member/${memberId}`),
  getByMemberRange: (memberId: number, startDate: string, endDate: string) =>
    request.get<any, BodyMeasurement[]>(`/measurements/member/${memberId}/range?startDate=${startDate}&endDate=${endDate}`)
}

export const dashboardApi = {
  getStats: (params?: { startDate?: string; endDate?: string; coachId?: number; status?: string }) =>
    request.get<any, DashboardStats>('/dashboard/stats', { params }),
  getCoachPerformance: (coachId: number, params?: { startDate?: string; endDate?: string }) =>
    request.get<any, CoachPerformance>(`/dashboard/coach/${coachId}/performance`, { params }),
  getRenewalFunnel: () => request.get<any, FunnelItem[]>('/dashboard/renewal-funnel')
}

export const notificationApi = {
  getByUser: (userId: number) => request.get<any, Notification[]>(`/notifications/user/${userId}`),
  getUnread: (userId: number) => request.get<any, Notification[]>(`/notifications/user/${userId}/unread`),
  countUnread: (userId: number) => request.get<any, number>(`/notifications/user/${userId}/count-unread`),
  markAsRead: (id: number) => request.put<any, void>(`/notifications/${id}/read`),
  markAllAsRead: (userId: number) => request.put<any, void>(`/notifications/user/${userId}/read-all`)
}

export const auditLogApi = {
  list: (params?: { module?: string; start?: string; end?: string; page?: number; size?: number }) =>
    request.get<any, { content: AuditLog[]; total: number }>('/audit-logs', { params })
}
