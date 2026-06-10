import { ref, computed } from 'vue'

export interface UserInfo {
  userId: string
  username: string
  role: string
  realName?: string
}

const token = ref<string | null>(null)
const userInfo = ref<UserInfo | null>(null)

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)

  const setToken = (t: string) => {
    token.value = t
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', t)
    }
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInfo', JSON.stringify(info))
    }
  }

  const clearAuth = () => {
    token.value = null
    userInfo.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }

  const initAuth = () => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('token')
      const u = localStorage.getItem('userInfo')
      if (t) token.value = t
      if (u) {
        try {
          userInfo.value = JSON.parse(u)
        } catch {
          clearAuth()
        }
      }
    }
  }

  const login = async (username: string, password: string) => {
    const res = await $fetch<{ code: number; data: any; message: string }>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    if (res.code === 0) {
      setToken(res.data.token)
      setUserInfo(res.data.user)
      return true
    }
    throw new Error(res.message)
  }

  const logout = () => {
    clearAuth()
    navigateTo('/login')
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
    clearAuth,
  }
}

export function useRequest() {
  const { token, logout } = useAuth()

  const request = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`,
        }
      }
    },
    onResponse({ response }) {
      if (response.status === 401) {
        logout()
      }
    },
  })

  return request
}
