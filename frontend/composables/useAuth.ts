import { ref, computed } from 'vue'

interface User {
  id: number
  username: string
  real_name: string
  role: string
  is_active: boolean
}

const token = ref<string | null>(localStorage.getItem('token'))
const user = ref<User | null>(null)
const isAuthenticated = computed(() => !!token.value)

export function useAuth() {
  const config = useRuntimeConfig()

  async function login(username: string, password: string) {
    try {
      const response = await $fetch<{ access_token: string; token_type: string }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      
      token.value = response.access_token
      localStorage.setItem('token', response.access_token)
      
      await fetchUserInfo()
      return true
    } catch (error: any) {
      throw new Error(error.data?.detail || '登录失败')
    }
  }

  async function fetchUserInfo() {
    if (!token.value) return
    
    try {
      const userData = await $fetch<User>('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
      user.value = userData
    } catch (error) {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    navigateTo('/login')
  }

  function getAuthHeaders() {
    return token.value ? { 'Authorization': `Bearer ${token.value}` } : {}
  }

  async function apiRequest<T>(url: string, options: any = {}): Promise<T> {
    const headers = {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    try {
      return await $fetch<T>(url, {
        ...options,
        headers
      })
    } catch (error: any) {
      if (error.response?.status === 401) {
        logout()
      }
      throw error
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    fetchUserInfo,
    getAuthHeaders,
    apiRequest
  }
}
