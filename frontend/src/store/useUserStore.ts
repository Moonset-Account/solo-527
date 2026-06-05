import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserInfo {
  userId: number
  username: string
  realName: string
  role: string
  avatar?: string
}

interface UserState {
  token: string | null
  userInfo: UserInfo | null
  setToken: (token: string) => void
  setUserInfo: (userInfo: UserInfo) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      userInfo: null,
      setToken: (token) => set({ token }),
      setUserInfo: (userInfo) => set({ userInfo }),
      logout: () => set({ token: null, userInfo: null }),
    }),
    {
      name: 'user-storage',
    }
  )
)
