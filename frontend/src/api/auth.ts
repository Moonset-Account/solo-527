import request, { PaginatedResponse } from './index'

export interface User {
  id: number
  username: string
  name: string
  real_name: string
  email: string
  phone: string
  organization: number | null
  organization_name: string
  role: string
  role_display: string
  is_admin: boolean
  is_active: boolean
  date_joined: string
  last_login: string
  created_at: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post<any, LoginResponse>('/auth/login/', data),

  logout: () =>
    request.post('/auth/logout/'),

  me: () =>
    request.get<any, User>('/auth/users/me/'),

  changePassword: (data: { old_password: string; new_password: string }) =>
    request.post('/auth/users/change_password/', data),

  users: (params?: any) =>
    request.get<any, PaginatedResponse<User>>('/auth/users/', { params }),

  createUser: (data: any) =>
    request.post('/auth/users/', data),

  updateUser: (id: number, data: any) =>
    request.patch(`/auth/users/${id}/`, data),

  resetPassword: (id: number) =>
    request.post(`/auth/users/${id}/reset_password/`),
}

export const userApi = {
  list: (params?: any) =>
    request.get<any, PaginatedResponse<User>>('/auth/users/', { params }),

  create: (data: any) =>
    request.post('/auth/users/', data),

  update: (id: number, data: any) =>
    request.put(`/auth/users/${id}/`, data),

  partialUpdate: (id: number, data: any) =>
    request.patch(`/auth/users/${id}/`, data),

  delete: (id: number) =>
    request.delete(`/auth/users/${id}/`),
}
