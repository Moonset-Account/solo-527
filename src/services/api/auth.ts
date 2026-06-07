import type { User } from '@/types'
import { AUTH_USER_KEY } from '@/utils/storage'

export interface CurrentUser {
  id: string
  role?: string
  storeId?: string
  regionId?: string
  token?: string
}

export function getCurrentUser(): CurrentUser | null {
  try {
    const stored = localStorage.getItem(AUTH_USER_KEY)
    if (stored) {
      const user = JSON.parse(stored) as User
      return {
        id: user.id,
        role: user.role,
        storeId: user.storeId,
        regionId: user.regionId,
        token: user.token,
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearCurrentUser(): void {
  localStorage.removeItem(AUTH_USER_KEY)
}
