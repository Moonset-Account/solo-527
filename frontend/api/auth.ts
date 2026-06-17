import request from './request'
import type { LoginRequest, LoginResponse, UserInfo, ApiResponse } from '~/types'

export function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return request.post('/auth/login', data)
}

export function logout(): Promise<ApiResponse> {
  return request.post('/auth/logout')
}

export function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  return request.get('/auth/me')
}
