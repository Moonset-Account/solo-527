import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole, PermissionConfig } from '@/types'
import { getPermissions, getRoleName } from '@/utils/permission'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value)

  const permissions = computed<PermissionConfig>(() => {
    if (!user.value) {
      return {
        canExport: false,
        canViewPersonalData: false,
        canViewAllStores: false,
        canManageCategory: false
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
        permissions: []
      },
      region_operation: {
        id: 'region-001',
        name: '王运营',
        role: 'region_operation',
        regionId: 'REG-001',
        permissions: []
      },
      headquarters_operation: {
        id: 'hq-001',
        name: '李分析师',
        role: 'headquarters_operation',
        permissions: []
      }
    }
    user.value = users[role]
    localStorage.setItem('auth_user', JSON.stringify(users[role]))
  }

  function logout() {
    user.value = null
    localStorage.removeItem('auth_user')
  }

  function initFromStorage() {
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      try {
        user.value = JSON.parse(stored)
      } catch {
        localStorage.removeItem('auth_user')
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
    initFromStorage
  }
})
