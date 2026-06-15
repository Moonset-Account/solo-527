import { ref, computed } from 'vue'

export interface User {
  id: number
  username: string
  name: string
  role: 'tenant' | 'operator' | 'engineer' | 'admin'
  tenantId?: number
  avatar?: string
  phone?: string
  email?: string
}

const user = ref<User | null>(null)
const token = ref<string | null>(null)

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)
  const isTenant = computed(() => user.value?.role === 'tenant')
  const isOperator = computed(() => user.value?.role === 'operator')
  const isEngineer = computed(() => user.value?.role === 'engineer')
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username: string, password: string) {
    try {
      const data = await $fetch<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      user.value = data.user
      token.value = data.token
      if (process.client) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      return data
    } catch (error) {
      throw error
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
