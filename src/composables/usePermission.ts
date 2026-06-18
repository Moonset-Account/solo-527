import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const rolePermissions: Record<string, string[]> = {
  admin: ['leads:read', 'leads:write', 'leads:delete', 'followups:read', 'followups:write',
    'predictions:read', 'churn:read', 'tags:read', 'tags:write', 'reports:read',
    'settings:read', 'settings:write', 'roles:manage'],
  manager: ['leads:read', 'leads:write', 'followups:read', 'followups:write',
    'predictions:read', 'churn:read', 'tags:read', 'tags:write', 'reports:read',
    'settings:read'],
  sales: ['leads:read', 'leads:write', 'followups:read', 'followups:write',
    'predictions:read', 'tags:read'],
  viewer: ['leads:read', 'followups:read', 'predictions:read', 'churn:read', 'reports:read'],
}

export function usePermission() {
  const authStore = useAuthStore()

  const currentPermissions = computed(() => {
    const role = authStore.userRole
    return rolePermissions[role] || rolePermissions.viewer || []
  })

  function hasPermission(permission: string): boolean {
    return currentPermissions.value.includes(permission)
  }

  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => currentPermissions.value.includes(p))
  }

  function hasRole(role: string): boolean {
    return authStore.userRole === role
  }

  const isAdmin = computed(() => authStore.userRole === 'admin')
  const isManager = computed(() => authStore.userRole === 'manager' || authStore.userRole === 'admin')

  return { currentPermissions, hasPermission, hasAnyPermission, hasRole, isAdmin, isManager }
}
