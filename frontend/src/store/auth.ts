import { create } from 'zustand'
import axios from '@/utils/request'

export interface User {
  id: number
  username: string
  real_name: string
  role: string
  role_display: string
  phone: string
  student_id: string
  dorm_building: string
  dorm_room: string
  is_verified: boolean
  avatar: string
  email: string
  date_joined: string
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

const getToken = () => localStorage.getItem('access_token')
const getRefreshToken = () => localStorage.getItem('refresh_token')

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getToken(),
  refreshToken: getRefreshToken(),
  user: null,

  login: async (username: string, password: string) => {
    const { data } = await axios.post('/api/auth/login/', { username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    set({ token: data.access, refreshToken: data.refresh })
    await get().fetchUser()
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ token: null, refreshToken: null, user: null })
  },

  fetchUser: async () => {
    try {
      const { data } = await axios.get('/api/users/me/')
      set({ user: data })
    } catch (e) {
      set({ user: null })
    }
  },
}))
