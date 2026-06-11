import { create } from 'zustand'
import type { UserInfo } from '@/types/user'

interface UserState {
  userInfo: UserInfo | null
  token: string | null
  setUserInfo: (userInfo: UserInfo) => void
  setToken: (token: string) => void
  clearUser: () => void
}

const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  token: null,
  setUserInfo: (userInfo) => set({ userInfo }),
  setToken: (token) => set({ token }),
  clearUser: () => set({ userInfo: null, token: null }),
}))

export default useUserStore
