import { ref, computed } from 'vue'

interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

const user = ref<User | null>(null)
const token = ref<string | null>(null)

export const useAuth = () => {
  const api = useApi()
  
  const isLoggedIn = computed(() => !!token.value)
  
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  const isOperator = computed(() => 
    user.value?.role === 'admin' || user.value?.role === 'operator'
  )
  
  const initAuth = () => {
    if (process.client) {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      if (savedToken) {
        token.value = savedToken
      }
      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser)
        } catch (e) {
          console.error('Failed to parse user data')
        }
      }
    }
  }
  
  const login = async (username: string, password: string) => {
    const result = await api.post<{ access_token: string; token_type: string }>('/auth/login', {
      username,
      password,
    })
    
    token.value = result.access_token
    if (process.client) {
      localStorage.setItem('token', result.access_token)
    }
    
    await fetchUserInfo()
    
    return result
  }
  
  const fetchUserInfo = async () => {
    try {
      const userData = await api.get<User>('/auth/me')
      user.value = userData
      if (process.client) {
        localStorage.setItem('user', JSON.stringify(userData))
      }
      return userData
    } catch (e) {
      logout()
      throw e
    }
  }
  
  const logout = () => {
    user.value = null
    token.value = null
    if (process.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    navigateTo('/login')
  }
  
  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    isOperator,
    initAuth,
    login,
    logout,
    fetchUserInfo,
  }
}
