import type { UserRole } from '@/types'

const ROLE_DASHBOARDS: Record<UserRole, string> = {
  researcher: '/booking',
  archivist: '/archive',
  admin: '/admin/samples',
  equipment_teacher: '/equipment',
}

export function useRoleDashboard(role: UserRole): string {
  return ROLE_DASHBOARDS[role] || '/'
}

export function canAccess(role: UserRole, path: string): boolean {
  if (path.startsWith('/admin') && role !== 'admin') return false
  if (path.startsWith('/equipment') && role !== 'admin' && role !== 'equipment_teacher') return false
  if (path.startsWith('/permissions') && role !== 'admin') return false
  return true
}
