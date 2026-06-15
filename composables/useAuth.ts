import { ref, computed } from 'vue'

export interface User {
  id: number
  username: string
  name: string
  role: 'TENANT' | 'OPERATOR' | 'ENGINEER' | 'ADMIN'
  tenantId?: number
  avatar?: string
  phone?: string
  email?: string
  tenant?: any
}

const user = ref<User | null>(null)
const token = ref<string | null>(null)

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)
  const isTenant = computed(() => user.value?.role === 'TENANT')
  const isOperator = computed(() => user.value?.role === 'OPERATOR')
  const isEngineer = computed(() => user.value?.role === 'ENGINEER')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  async function login(username: string, password: string) {
    try {
      const res = await $fetch<{ code: number; data: { user: User; token: string }; message: string }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      if (res.code !== 200 || !res.data) {
        throw new Error(res.message || '登录失败')
      }
      const data = res.data
      user.value = data.user
      token.value = data.token
      if (process.client) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      return data
    } catch (error: any) {
      throw error?.data || error
    }
  }

  function logout() {
    user.value = null
    token.value = null
    if (process.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    navigateTo('/login')
  }

  function initAuth() {
    if (process.client) {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      if (savedToken && savedUser) {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      }
    }
  }

  function getAuthHeaders() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  return {
    user,
    token,
    isLoggedIn,
    isTenant,
    isOperator,
    isEngineer,
    isAdmin,
    login,
    logout,
    initAuth,
    getAuthHeaders
  }
}
