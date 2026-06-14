import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api/modules'
import router from '@/router'

interface UserInfo {
  id: number
  username: string
  email: string
  role: string
  avatarUrl?: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('qinghe_token', newToken)
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
  }

  const login = async (email: string, password: string) => {
    const res: any = await authApi.login({ email, password })
    if (res.token) {
      setToken(res.token)
      setUserInfo(res.user)
    }
    return res
  }

  const fetchUserInfo = async () => {
    try {
      const res: any = await authApi.me()
      setUserInfo(res)
      return res
    } catch {
      logout()
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('qinghe_token')
    router.push('/login')
  }

  const isLoggedIn = () => !!token.value

  const hasRole = (roles: string[]) => {
    if (!userInfo.value) return false
    return roles.includes(userInfo.value.role)
  }

  return {
    token,
    userInfo,
    setToken,
    setUserInfo,
    login,
    fetchUserInfo,
    logout,
    isLoggedIn,
    hasRole
  }
}, {
  persist: {
    key: 'qinghe_user',
    paths: ['token', 'userInfo']
  }
})
