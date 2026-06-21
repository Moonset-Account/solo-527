import { post, get } from '../http'
import type { LoginParams, LoginResponse, User } from '@/types'
import { mockUsers, mockResponse } from '@/mock/data'

export async function loginApi(params: LoginParams): Promise<LoginResponse> {
  const foundUser = mockUsers.find(
    u => u.username === params.username && u.password === params.password
  )

  if (!foundUser) {
    throw new Error('用户名或密码错误')
  }

  const { password, ...safeUser } = foundUser
  const token = `mock_token_${Date.now()}_${safeUser.id}`

  return mockResponse<LoginResponse>({
    token,
    user: safeUser as User
  }, 500)
}

export async function logoutApi(): Promise<void> {
  return mockResponse<void>(undefined, 200)
}

export async function getUserInfoApi(): Promise<User> {
  const savedUser = localStorage.getItem('auth_user')
  if (savedUser) {
    return mockResponse<User>(JSON.parse(savedUser), 300)
  }
  throw new Error('用户未登录')
}

export async function changePasswordApi(params: { oldPassword: string; newPassword: string }): Promise<void> {
  return mockResponse<void>(undefined, 400)
}
