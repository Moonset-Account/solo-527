import { useUserStore } from '@/store/user'

export function hasRole(roles) {
  const userStore = useUserStore()
  const userRoles = userStore.roles
  if (!roles || roles.length === 0) {
    return true
  }
  return userRoles.some(role => roles.includes(role))
}

export function hasPermission(permissions) {
  const userStore = useUserStore()
  const userPermissions = userStore.permissions
  if (!permissions || permissions.length === 0) {
    return true
  }
  return userPermissions.some(permission => permissions.includes(permission))
}

export function checkRole(role) {
  const userStore = useUserStore()
  return userStore.roles.includes(role)
}

export function checkPermission(permission) {
  const userStore = useUserStore()
  return userStore.permissions.includes(permission)
}
