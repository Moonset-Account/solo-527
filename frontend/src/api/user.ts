import request from './request'

export interface UserInfo {
  id: number
  phone: string
  nickname: string
  avatar?: string
}

export interface LoginParams {
  phone: string
  code?: string
  password?: string
}

export function login(data: LoginParams) {
  return request.post<{ user: UserInfo; token: string }>('/auth/login', data)
}

export function sendSmsCode(phone: string) {
  return request.post('/auth/sms-code', { phone })
}

export function getUserInfo() {
  return request.get<UserInfo>('/user/info')
}

export function updateUserInfo(data: Partial<UserInfo>) {
  return request.put<UserInfo>('/user/info', data)
}
