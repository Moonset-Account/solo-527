import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: number
  username: string
  realName: string
  avatar?: string
  role: string
  email?: string
  phone?: string
  department?: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)

  function setToken(newToken: string) {
    token.value = newToken
    if (process.client) {
      localStorage.setItem('auth_token', newToken)
    }
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    if (process.client) {
      localStorage.setItem('user_info', JSON.stringify(info))
    }
  }

  async function login(username: string, password: string) {
    const { request } = useApi()
    try {
      const response = await request<{ token: string; user: UserInfo }>('/auth/login', {
        method: 'POST',
        body: { username, password },
      })
      setToken(response.token)
      setUserInfo(response.user)
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  function logout() {
    token.value = null
    userInfo.value = null
    if (process.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_info')
    }
    navigateTo('/login')
  }

  function initAuth() {
    if (process.client) {
      const savedToken = localStorage.getItem('auth_token')
      const savedUserInfo = localStorage.getItem('user_info')
      if (savedToken) {
        token.value = savedToken
      }
      if (savedUserInfo) {
        try {
          userInfo.value = JSON.parse(savedUserInfo)
        } catch {
          userInfo.value = null
        }
      }
    }
  }

  async function fetchUserInfo() {
    if (!token.value) return null
    const { request } = useApi()
    try {
      const user = await request<UserInfo>('/auth/user')
      setUserInfo(user)
      return user
    } catch (error) {
      console.error('Fetch user info failed:', error)
      return null
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    setToken,
    setUserInfo,
    initAuth,
    fetchUserInfo,
  }
})
