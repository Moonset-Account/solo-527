interface User {
  id: string
  username: string
  name: string
  email: string
  role: string
  department?: string
  phone?: string
  avatar?: string
  isActive: boolean
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value)

  const router = useRouter()

  async function fetchUser() {
    try {
      const res = await $fetch('/api/auth/me')
      user.value = (res as any).user
    } catch (e) {
      user.value = null
    }
    return user.value
  }

  async function login(username: string, password: string) {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    user.value = (res as any).user
    return user.value
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // ignore
    }
    user.value = null
    await router.push('/login')
  }

  function hasRole(...roles: string[]): boolean {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  return { user, isLoggedIn, fetchUser, login, logout, hasRole }
})
