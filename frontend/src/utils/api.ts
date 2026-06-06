import { request } from '../utils/request'
import type {
  LoginData,
  RegisterData,
  AuthResponse,
  User,
  Course,
  CourseSession,
  Booking,
  Artwork,
  MaterialPackage,
  Payment,
  TeacherSettlement,
  Notification,
  AuditLog,
  PaginationParams,
  Teacher,
  Student,
  CourseCategory,
  ApiResponse
} from '../types'

export const authAPI = {
  login: (data: LoginData) => request.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterData) => request.post<AuthResponse>('/auth/register', data),
  me: () => request.get<AuthResponse>('/auth/me'),
  updateProfile: (data: Partial<User>) => request.put<User>('/auth/profile', data)
}

export const courseAPI = {
  list: (params?: PaginationParams & { category_id?: number; difficulty?: number; sort?: string }) =>
    request.get<{ courses: Course[]; meta: any }>('/courses', { params }),
  detail: (id: number) => request.get<Course>(`/courses/${id}`),
  calendar: (params?: { start_date?: string; end_date?: string; teacher_id?: number }) =>
    request.get<CourseSession[]>('/courses/calendar', { params }),
  create: (data: Partial<Course>) => request.post<Course>('/courses', data),
  update: (id: number, data: Partial<Course>) => request.put<Course>(`/courses/${id}`, data)
}

export const courseCategoryAPI = {
  list: () => request.get<CourseCategory[]>('/course_categories')
}

export const bookingAPI = {
  list: (params?: PaginationParams & { status?: string; student_id?: number; course_session_id?: number }) =>
    request.get<{ bookings: Booking[]; meta: any }>('/bookings', { params }),
  detail: (id: number) => request.get<Booking>(`/bookings/${id}`),
  create: (data: { course_session_id: number; notes?: string }) =>
    request.post<Booking>('/bookings', data),
  cancel: (id: number, cancel_reason?: string) =>
    request.post<Booking>(`/bookings/${id}/cancel`, { cancel_reason }),
  approve: (id: number) => request.post<Booking>(`/bookings/${id}/approve`),
  reject: (id: number) => request.post<Booking>(`/bookings/${id}/reject`),
  checkIn: (id: number) => request.post<Booking>(`/bookings/${id}/check_in`),
  export: (params?: { start_date?: string; end_date?: string }) =>
    request.get('/bookings/export', { params, responseType: 'blob' })
}

export const artworkAPI = {
  list: (params?: PaginationParams & { student_id?: number; course_id?: number; sort?: string; is_public?: boolean; status?: number }) =>
    request.get<{ artworks: Artwork[]; meta: any }>('/artworks', { params }),
  detail: (id: number) => request.get<Artwork>(`/artworks/${id}`),
  create: (data: Partial<Artwork>) => request.post<Artwork>('/artworks', data),
  update: (id: number, data: Partial<Artwork>) => request.put<Artwork>(`/artworks/${id}`, data),
  delete: (id: number) => request.delete(`/artworks/${id}`),
  approve: (id: number) => request.post<Artwork>(`/artworks/${id}/approve`),
  reject: (id: number, reason?: string) => request.post<Artwork>(`/artworks/${id}/reject`, { reason }),
  like: (id: number) => request.post<{ likes_count: number }>(`/artworks/${id}/like`),
  incrementView: (id: number) => request.post(`/artworks/${id}/increment_view`),
  uploadImage: (formData: FormData) =>
    request.post<{ id: string; url: string; filename: string }>('/artworks/upload_image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
}

export const materialAPI = {
  list: (params?: PaginationParams & { available?: boolean; low_stock?: boolean }) =>
    request.get<{ material_packages: MaterialPackage[]; meta: any }>('/material_packages', { params }),
  detail: (id: number) => request.get<MaterialPackage>(`/material_packages/${id}`),
  create: (data: Partial<MaterialPackage>) => request.post<MaterialPackage>('/material_packages', data),
  update: (id: number, data: Partial<MaterialPackage>) => request.put<MaterialPackage>(`/material_packages/${id}`, data),
  stockIn: (id: number, quantity: number) => request.post<MaterialPackage>(`/material_packages/${id}/stock_in`, { quantity }),
  stockOut: (id: number, quantity: number) => request.post<MaterialPackage>(`/material_packages/${id}/stock_out`, { quantity }),
  export: () => request.get('/material_packages/export', { responseType: 'blob' })
}

export const paymentAPI = {
  list: (params?: PaginationParams & { student_id?: number; start_date?: string; end_date?: string }) =>
    request.get<{ payments: Payment[]; meta: any }>('/payments', { params }),
  create: (data: { booking_id: number; payment_method?: string }) =>
    request.post<Payment>('/payments', data),
  export: (params?: { start_date?: string; end_date?: string }) =>
    request.get('/payments/export', { params, responseType: 'blob' })
}

export const settlementAPI = {
  list: (params?: PaginationParams & { teacher_id?: number; status?: number }) =>
    request.get<{ settlements: TeacherSettlement[]; teacher_settlements: TeacherSettlement[]; meta: any }>('/teacher_settlements', { params }),
  detail: (id: number) => request.get<TeacherSettlement>(`/teacher_settlements/${id}`),
  generate: (data?: { teacher_id?: number; period_start?: string; period_end?: string }) =>
    request.post<{ settlements: TeacherSettlement[] }>('/teacher_settlements/generate', data || {}),
  submit: (id: number) => request.post<TeacherSettlement>(`/teacher_settlements/${id}/submit`),
  approve: (id: number) => request.post<TeacherSettlement>(`/teacher_settlements/${id}/approve`),
  reject: (id: number, reason?: string) => request.post<TeacherSettlement>(`/teacher_settlements/${id}/reject`, { reason }),
  pay: (id: number) => request.post<TeacherSettlement>(`/teacher_settlements/${id}/pay`),
  markPaid: (id: number) => request.post<TeacherSettlement>(`/teacher_settlements/${id}/mark_paid`),
  export: (params?: { start_date?: string; end_date?: string }) =>
    request.get('/teacher_settlements/export', { params, responseType: 'blob' })
}

export const notificationAPI = {
  list: (params?: PaginationParams & { unread?: boolean; type?: string }) =>
    request.get<{ notifications: Notification[]; meta: any }>('/notifications', { params }),
  detail: (id: number) => request.get<Notification>(`/notifications/${id}`),
  markRead: (id: number) => request.post<Notification>(`/notifications/${id}/mark_read`),
  markAllRead: () => request.post('/notifications/mark_all_read'),
  unreadCount: () => request.get<{ count: number }>('/notifications/unread_count'),
  export: () => request.get('/notifications/export', { responseType: 'blob' })
}

export const auditLogAPI = {
  list: (params?: PaginationParams & { user_id?: number; action_type?: string; auditable_type?: string; auditable_id?: number; start_date?: string; end_date?: string }) =>
    request.get<{ audit_logs: AuditLog[]; meta: any }>('/audit_logs', { params }),
  export: (params?: { start_date?: string; end_date?: string }) =>
    request.get('/audit_logs/export', { params, responseType: 'blob' })
}

export const teacherAPI = {
  list: () => request.get<Teacher[]>('/teachers'),
  detail: (id: number) => request.get<Teacher>(`/teachers/${id}`)
}

export const studentAPI = {
  list: () => request.get<Student[]>('/students'),
  detail: (id: number) => request.get<Student>(`/students/${id}`)
}
