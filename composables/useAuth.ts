export interface User {
  id: number
  username: string
  name: string
  role: string
  phone?: string
}

export interface AuthState {
  token: string | null
  user: User | null
}

export const useAuth = () => {
  const state = useState<AuthState>('auth', () => ({
    token: null,
    user: null
  }))

  const isLoggedIn = computed(() => !!state.value.token)

  const hasRole = (roles: string[]) => {
    if (!state.value.user) return false
    return roles.includes(state.value.user.role)
  }

  const login = async (username: string, password: string) => {
    const res = await $fetch<{
      code: number
      message: string
      data: { token: string; user: User }
    }>('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })

    if (res.code === 0) {
      state.value.token = res.data.token
      state.value.user = res.data.user
      if (process.client) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }
    }
    return res
  }

  const logout = () => {
    state.value.token = null
    state.value.user = null
    if (process.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    navigateTo('/login')
  }

  const checkAuth = () => {
    if (process.client) {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token && user) {
        state.value.token = token
        state.value.user = JSON.parse(user)
      }
    }
  }

  const getHeaders = () => {
    return state.value.token
      ? { Authorization: `Bearer ${state.value.token}` }
      : {}
  }

  return {
    state,
    isLoggedIn,
    hasRole,
    login,
    logout,
    checkAuth,
    getHeaders
  }
}
