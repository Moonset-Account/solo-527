import type { Role } from '@prisma/client';
import prisma from './prisma';

export type Permission =
  | 'project:read'
  | 'project:write'
  | 'project:delete'
  | 'task:read'
  | 'task:write'
  | 'task:update_status'
  | 'budget:read'
  | 'budget:read_internal'
  | 'budget:write'
  | 'budget:update'
  | 'supplier:read'
  | 'supplier:write'
  | 'file:read'
  | 'file:upload'
  | 'file:approve'
  | 'file:update'
  | 'confirmation:read'
  | 'confirmation:confirm'
  | 'confirmation:create'
  | 'comment:read'
  | 'comment:write'
  | 'admin:dashboard'
  | 'user:manage'
  | 'user:read';

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    'project:read', 'project:write', 'project:delete',
    'task:read', 'task:write', 'task:update_status',
    'budget:read', 'budget:read_internal', 'budget:write', 'budget:update',
    'supplier:read', 'supplier:write',
    'file:read', 'file:upload', 'file:approve', 'file:update',
    'confirmation:read', 'confirmation:confirm', 'confirmation:create',
    'comment:read', 'comment:write',
    'admin:dashboard', 'user:manage', 'user:read',
  ],
  PLANNER: [
    'project:read', 'project:write',
    'task:read', 'task:write', 'task:update_status',
    'budget:read', 'budget:read_internal', 'budget:write', 'budget:update',
    'supplier:read', 'supplier:write',
    'file:read', 'file:upload', 'file:approve', 'file:update',
    'confirmation:read', 'confirmation:create',
    'comment:read', 'comment:write',
    'user:read',
  ],
  SUPPLIER: [
    'project:read',
    'task:read', 'task:update_status',
    'file:read', 'file:upload',
    'comment:read', 'comment:write',
  ],
  COUPLE: [
    'project:read',
    'task:read',
    'budget:read',
    'file:read',
    'confirmation:read', 'confirmation:confirm',
    'comment:read', 'comment:write',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

export async function canAccessProject(
  userId: string,
  role: Role,
  projectId: string
): Promise<boolean> {
  if (role === 'ADMIN') return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { managerId: true, coupleId: true },
  });

  if (!project) return false;

  if (role === 'PLANNER' && project.managerId === userId) return true;
  if (role === 'COUPLE' && project.coupleId === userId) return true;

  if (role === 'SUPPLIER') {
    const supplier = await prisma.supplier.findUnique({
      where: { userId },
    });
    if (!supplier) return false;

    const taskCount = await prisma.task.count({
      where: {
        projectId,
        assigneeId: userId,
      },
    });
    return taskCount > 0;
  }

  return false;
}

export function filterBudgetItemsByRole<T extends { isInternal: boolean }>(
  items: T[],
  role: Role
): T[] {
  if (role === 'ADMIN' || role === 'PLANNER') {
    return items;
  }
  return items.filter(item => !item.isInternal);
}
