import { create } from 'zustand'
import type { LoginResponse, UserRole } from '@/types'

interface UserState {
  token: string | null
  userInfo: LoginResponse | null
  setAuth: (data: LoginResponse) => void
  logout: () => void
  isAdmin: () => boolean
  isReceptionist: () => boolean
  isCoach: () => boolean
  hasRole: (roles: UserRole[]) => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
  token: localStorage.getItem('token'),
  userInfo: localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')!) : null,

  setAuth: (data: LoginResponse) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data))
    set({ token: data.token, userInfo: data })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    set({ token: null, userInfo: null })
  },

  isAdmin: () => get().userInfo?.role === 'ADMIN',
  isReceptionist: () => get().userInfo?.role === 'RECEPTIONIST',
  isCoach: () => get().userInfo?.role === 'COACH',
  hasRole: (roles: UserRole[]) => {
    const role = get().userInfo?.role
    return role ? roles.includes(role) : false
  }
}))
