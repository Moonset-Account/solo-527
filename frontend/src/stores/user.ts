import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout, getMe } from '@/api/auth'

export interface UserInfo {
  id: number
  username: string
  real_name: string
  role: string
  is_active: boolean
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('qinghe_token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  const login = async (username: string, password: string) => {
    const res = await apiLogin({ username, password })
    token.value = res.data.token
    userInfo.value = res.data.user
    localStorage.setItem('qinghe_token', res.data.token)
    localStorage.setItem('qinghe_user', JSON.stringify(res.data.user))
    return res
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch (_) {
      // ignore
    }
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('qinghe_token')
    localStorage.removeItem('qinghe_user')
  }

  const loadUserInfo = async () => {
    const savedUser = localStorage.getItem('qinghe_user')
    if (savedUser) {
      userInfo.value = JSON.parse(savedUser)
    }
    try {
      const res = await getMe()
      if (res.data) {
        userInfo.value = res.data
        localStorage.setItem('qinghe_user', JSON.stringify(res.data))
      }
    } catch (_) {
      // ignore
    }
  }

  const restoreFromStorage = () => {
    const savedToken = localStorage.getItem('qinghe_token')
    const savedUser = localStorage.getItem('qinghe_user')
    if (savedToken) {
      token.value = savedToken
    }
    if (savedUser) {
      try {
        userInfo.value = JSON.parse(savedUser)
      } catch (_) {
        // ignore
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    loadUserInfo,
    restoreFromStorage,
  }
})
