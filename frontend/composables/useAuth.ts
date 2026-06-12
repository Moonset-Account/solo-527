export function useAuth() {
  const user = ref<any>(null)
  const tokenCookie = useCookie('token')
  const token = ref<string | null>(tokenCookie.value ?? null)
  const isAuthenticated = computed(() => !!token.value)

  async function login(username: string, password: string) {
    const api = useApi()
    const res = await api.login(username, password)
    token.value = res.access_token
    tokenCookie.value = res.access_token
    await fetchUser()
  }

  function logout() {
    token.value = null
    tokenCookie.value = null
    user.value = null
    navigateTo('/login')
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const api = useApi()
      user.value = await api.getMe()
    } catch {
      logout()
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    fetchUser
  }
}
