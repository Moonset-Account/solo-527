import { post, get } from '../http'
import type { LoginParams, LoginResponse, User } from '@/types'

export async function loginApi(params: LoginParams): Promise<LoginResponse> {
  const data = await post<any>('/auth/login', params)
  const user: User = {
    id: String(data.user.id ?? ''),
    username: data.user.username || '',
    fullName: data.user.fullName || data.user.full_name || '',
    email: data.user.email || '',
    role: data.user.role as User['role'],
    isActive: Boolean(data.user.isActive ?? data.user.is_active ?? true),
    createdAt: data.user.createdAt || data.user.created_at || new Date().toISOString(),
  }
  return {
    token: String(data.token || ''),
    user,
  }
}

export async function logoutApi(): Promise<void> {
  await post<any>('/auth/logout', {})
}

export async function getUserInfoApi(): Promise<User> {
  const data = await get<any>('/auth/me')
  return {
    id: String(data.id ?? ''),
    username: data.username || '',
    fullName: data.fullName || data.full_name || '',
    email: data.email || '',
    role: data.role as User['role'],
    isActive: Boolean(data.isActive ?? data.is_active ?? true),
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
  }
}

export async function changePasswordApi(params: { oldPassword: string; newPassword: string }): Promise<void> {
  await post<any>('/auth/change-password', params)
}
