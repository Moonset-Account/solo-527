import request from './request'

export interface AdminInfo {
  id: number
  username: string
  nickname: string
  role: string
}

export interface AdminLoginParams {
  username: string
  password: string
}

export interface Community {
  id: number
  name: string
  district?: string
  address?: string
}

export function adminLogin(data: AdminLoginParams) {
  return request.post<{ admin: AdminInfo; token: string }>('/admin/auth/login', data)
}

export function getAdminInfo() {
  return request.get<AdminInfo>('/admin/info')
}

export function getDashboardStats() {
  return request.get('/admin/statistics/overview')
}

export function getDashboardChartData(params?: any) {
  return request.get('/admin/dashboard/chart', { params })
}

export function getAllCommunities() {
  return request.get<Community[]>('/communities/all')
}

export function getCommunities(params?: any) {
  return request.get('/admin/communities', { params })
}

export function createCommunity(data: Partial<Community>) {
  return request.post('/admin/communities', data)
}

export function updateCommunity(id: number, data: Partial<Community>) {
  return request.put(`/admin/communities/${id}`, data)
}

export function deleteCommunity(id: number) {
  return request.delete(`/admin/communities/${id}`)
}
