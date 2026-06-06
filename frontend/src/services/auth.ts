import api from './api'
import type { User, ApiResponse } from '@/types'

export const authApi = {
  login: (phone: string, password: string) =>
    api.post<{ user: User; token: string; expiry: string }>('/accounts/login/', { phone, password }),

  getCurrentUser: () =>
    api.get<User>('/accounts/users/me/'),

  logout: () =>
    api.post('/auth/logout/')
}

export const userApi = {
  getList: (params?: any) =>
    api.get<ApiResponse<User[]>>('/accounts/users/', { params }),

  create: (data: any) =>
    api.post<User>('/accounts/users/', data),

  update: (id: number, data: any) =>
    api.patch<User>(`/accounts/users/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/accounts/users/${id}/`)
}
