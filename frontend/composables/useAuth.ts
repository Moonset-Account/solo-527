import { ref } from 'vue'

const token = ref<string | null>(null)
const user = ref<User | null>(null)

export const useAuth = () => {
  const runtimeConfig = useRuntimeConfig()
  const apiBase = runtimeConfig.public.apiBase

  const login = async (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const res = await $fetch<{ access_token: string; token_type: string; user: User }>(`${apiBase}/auth/login`, {
      method: 'POST',
      body: formData
    })
    token.value = res.access_token
    user.value = res.user
    if (process.client) {
      localStorage.setItem('token', res.access_token)
      localStorage.setItem('user', JSON.stringify(res.user))
    }
    return res
  }

  const logout = () => {
    token.value = null
    user.value = null
    if (process.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    navigateTo('/login')
  }

  const checkAuth = () => {
    if (process.client && !token.value) {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      if (savedToken && savedUser) {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      }
    }
    return !!token.value
  }

  const getToken = () => {
    checkAuth()
    return token.value
  }

  const getUser = () => {
    checkAuth()
    return user.value
  }

  const hasRole = (...roles: string[]) => {
    const u = getUser()
    if (!u) return false
    return roles.includes(u.role)
  }

  const isAdmin = () => hasRole('admin')
  const isSupervisor = () => hasRole('admin', 'supervisor')
  const isStoreManager = () => hasRole('admin', 'supervisor', 'store_manager')
  const isBaker = () => hasRole('admin', 'supervisor', 'store_manager', 'baker')

  return {
    token,
    user,
    login,
    logout,
    checkAuth,
    getToken,
    getUser,
    hasRole,
    isAdmin,
    isSupervisor,
    isStoreManager,
    isBaker
  }
}
