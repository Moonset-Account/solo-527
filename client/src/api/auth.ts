import { get, post } from '@/utils/request'
import type { LoginParams, LoginResult, User, ApiResponse, PagedResponse, PaginationParams } from '@/types'

export const login = (data: LoginParams): Promise<LoginResult> => {
  return post<LoginResult>('/auth/login', data)
}

export const logout = (): Promise<void> => {
  return post<void>('/auth/logout')
}

export const getCurrentUser = (): Promise<User> => {
  return post<User>('/auth/me')
}

export const changePassword = (data: { oldPassword: string; newPassword: string }): Promise<void> => {
  return post<void>('/auth/change-password', data)
}

export const getUserList = (params: PaginationParams): Promise<PagedResponse<User>> => {
  return get<PagedResponse<User>>('/users', params)
}

export const getAdvisorList = (): Promise<User[]> => {
  return get<User[]>('/users/advisors')
}
