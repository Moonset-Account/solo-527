import type { UserRole, PermissionConfig } from '@/types'

export const ROLE_PERMISSIONS: Record<UserRole, PermissionConfig> = {
  store_manager: {
    canExport: false,
    canViewPersonalData: false,
    canViewAllStores: false,
    canManageCategory: false
  },
  region_operation: {
    canExport: true,
    canViewPersonalData: false,
    canViewAllStores: true,
    canManageCategory: false
  },
  headquarters_operation: {
    canExport: true,
    canViewPersonalData: true,
    canViewAllStores: true,
    canManageCategory: true
  }
}

export function getRoleName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    store_manager: '门店经理',
    region_operation: '大区运营',
    headquarters_operation: '总部运营'
  }
  return names[role] || role
}

export function canExport(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role]?.canExport ?? false
}

export function canViewPersonalData(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role]?.canViewPersonalData ?? false
}

export function canViewAllStores(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role]?.canViewAllStores ?? false
}

export function canManageCategory(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role]?.canManageCategory ?? false
}

export function getPermissions(role: UserRole): PermissionConfig {
  return ROLE_PERMISSIONS[role] || {
    canExport: false,
    canViewPersonalData: false,
    canViewAllStores: false,
    canManageCategory: false
  }
}

export function hasPermission(role: UserRole, permission: keyof PermissionConfig): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false
}
