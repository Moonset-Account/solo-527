import type { User, Role, LoginParams, LoginResult } from '~/types'

const defaultUser: User = {
  id: 1,
  username: 'manager',
  name: '张经理',
  role: Role.MANAGER,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockUsers: (User & { password: string })[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    role: Role.MANAGER,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    username: 'manager',
    password: 'manager123',
    name: '张经理',
    role: Role.MANAGER,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    username: 'advisor1',
    password: 'advisor123',
    name: '李顾问',
    role: Role.ADVISOR,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 4,
    username: 'advisor2',
    password: 'advisor123',
    name: '王顾问',
    role: Role.ADVISOR,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 5,
    username: 'frontdesk1',
    password: 'front123',
    name: '前台小美',
    role: Role.FRONT_DESK,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 6,
    username: 'director',
    password: 'director123',
    name: '赵院长',
    role: Role.DIRECTOR,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]

const STORAGE_KEY = 'dental_crm_auth'

export function useAuth() {
  const isAuthenticated = ref(false)
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)

  const initAuth = () => {
    if (process.server) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored) as LoginResult
        isAuthenticated.value = true
        currentUser.value = data.user
        token.value = data.token
      }
    } catch (e) {
      console.warn('恢复登录状态失败:', e)
    }
  }

  const persistAuth = (data: LoginResult) => {
    if (process.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }

  const clearAuth = () => {
    if (process.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const login = async (params: LoginParams): Promise<{ success: boolean; message: string }> => {
    loading.value = true

    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      const user = mockUsers.find(
        u => u.username === params.username && u.password === params.password
      )

      if (!user) {
        return { success: false, message: '用户名或密码错误' }
      }

      if (!user.active) {
        return { success: false, message: '账户已被禁用，请联系管理员' }
      }

      const { password: _pwd, ...safeUser } = user
      const result: LoginResult = {
        token: `mock_token_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        user: safeUser,
      }

      isAuthenticated.value = true
      currentUser.value = safeUser
      token.value = result.token
      persistAuth(result)

      return { success: true, message: '登录成功' }
    } finally {
      loading.value = false
    }
  }

  const loginAsDefault = async (): Promise<void> => {
    const { password: _pwd, ...safeUser } = mockUsers[1]
    const result: LoginResult = {
      token: `mock_token_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      user: safeUser,
    }

    isAuthenticated.value = true
    currentUser.value = safeUser
    token.value = result.token
    persistAuth(result)
  }

  const logout = (): void => {
    isAuthenticated.value = false
    currentUser.value = null
    token.value = null
    clearAuth()
  }

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!currentUser.value) return false
    const allowed = Array.isArray(roles) ? roles : [roles]
    return allowed.includes(currentUser.value.role)
  }

  const getRoleName = (role: Role): string => {
    const roleMap: Record<Role, string> = {
      [Role.FRONT_DESK]: '前台',
      [Role.ADVISOR]: '咨询顾问',
      [Role.MANAGER]: '经理',
      [Role.DIRECTOR]: '院长',
    }
    return roleMap[role] || role
  }

  const getRoleColor = (role: Role): string => {
    const colorMap: Record<Role, string> = {
      [Role.FRONT_DESK]: 'badge-slate',
      [Role.ADVISOR]: 'badge-primary',
      [Role.MANAGER]: 'badge-purple',
      [Role.DIRECTOR]: 'badge-warn',
    }
    return colorMap[role] || 'badge-slate'
  }

  initAuth()

  return {
    isAuthenticated,
    currentUser,
    token,
    loading,
    login,
    loginAsDefault,
    logout,
    hasRole,
    getRoleName,
    getRoleColor,
  }
}
