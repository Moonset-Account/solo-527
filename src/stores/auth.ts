import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole, PermissionConfig } from '@/types'
import { getPermissions, getRoleName } from '@/utils/permission'
import { setCurrentUser, clearCurrentUser, getCurrentUser } from '@/services/api/auth'
import { clearQueryCache } from '@/services/clickhouse'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value)

  const permissions = computed<PermissionConfig>(() => {
    if (!user.value) {
      return {
        canExport: false,
        canViewPersonalData: false,
        canViewAllStores: false,
        canManageCategory: false,
      }
    }
    return getPermissions(user.value.role)
  })

  const roleName = computed(() => {
    if (!user.value) return ''
    return getRoleName(user.value.role)
  })

  function login(role: UserRole) {
    const users: Record<UserRole, User> = {
      store_manager: {
        id: 'store-001',
        name: '张店长',
        role: 'store_manager',
        storeId: 'STORE-001',
        regionId: 'REG-001',
        token: 'token_store_001_' + Date.now(),
        permissions: [],
      },
      region_operation: {
        id: 'region-001',
        name: '王运营',
        role: 'region_operation',
        regionId: '华东区',
        token: 'token_region_001_' + Date.now(),
        permissions: [],
      },
      headquarters_operation: {
        id: 'hq-001',
        name: '李分析师',
        role: 'headquarters_operation',
        token: 'token_hq_001_' + Date.now(),
        permissions: [],
      },
    }
    user.value = users[role]
    setCurrentUser(users[role])
    clearQueryCache()
  }

  function logout() {
    user.value = null
    clearCurrentUser()
    clearQueryCache()
  }

  function initFromStorage() {
    const stored = getCurrentUser()
    if (stored) {
      try {
        user.value = {
          id: stored.id,
          name: '',
          role: stored.role as UserRole,
          storeId: stored.storeId,
          regionId: stored.regionId,
          token: stored.token,
          permissions: [],
        }
      } catch {
        clearCurrentUser()
      }
    }
  }

  return {
    user,
    isLoggedIn,
    permissions,
    roleName,
    login,
    logout,
    initFromStorage,
  }
})
