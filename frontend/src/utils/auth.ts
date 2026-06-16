import type { UserInfo, UserRole } from '@/types'

const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

export const getUserInfo = (): UserInfo | null => {
  const data = localStorage.getItem(USER_KEY)
  if (data) {
    try {
      return JSON.parse(data) as UserInfo
    } catch {
      return null
    }
  }
  return null
}

export const setUserInfo = (user: UserInfo): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const removeUserInfo = (): void => {
  localStorage.removeItem(USER_KEY)
}

export const hasRole = (role: UserRole | UserRole[]): boolean => {
  const user = getUserInfo()
  if (!user) return false
  if (Array.isArray(role)) {
    return role.some(r => user.roles.includes(r))
  }
  return user.roles.includes(role)
}

export const clearAuth = (): void => {
  removeToken()
  removeUserInfo()
}
