interface AuthUser {
  id: string
  username: string
  displayName: string
  role: string
  supervisorId: string | null
}

export function useAuthState() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const token = useState<string | null>('auth-token', () => null)
  const isLoggedIn = computed(() => !!token.value)

  const setAuth = (u: AuthUser, t: string) => {
    user.value = u
    token.value = t
    if (import.meta.client) {
      localStorage.setItem('token', t)
      localStorage.setItem('user', JSON.stringify(u))
    }
  }

  const clearAuth = () => {
    user.value = null
    token.value = null
    if (import.meta.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  const initAuth = () => {
    if (import.meta.client) {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      if (savedToken && savedUser) {
        token.value = savedToken
        try {
          user.value = JSON.parse(savedUser)
        } catch {
          clearAuth()
        }
      }
    }
  }

  return { user, token, isLoggedIn, setAuth, clearAuth, initAuth }
}
