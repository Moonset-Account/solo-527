import request from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    username: string
    name: string
    role: string
    email: string
    phone?: string
    department?: string
    status: string
    permissionExpireAt?: string
  }
}

export function login(params: LoginParams) {
  return request.post<any, LoginResult>('/auth/login', params)
}

export function refreshToken(token: string) {
  return request.post<any, { accessToken: string }>('/auth/refresh', { refreshToken: token })
}

export function logout() {
  return request.post('/auth/logout')
}

export function changePassword(params: { oldPassword: string; newPassword: string }) {
  return request.patch('/auth/password', params)
}

export function getProfile() {
  return request.get<any, any>('/users/profile')
}
