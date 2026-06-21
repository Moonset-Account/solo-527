import type { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';

export const rolePermissions: Record<Role, { resources: string[]; actions: string[] }[]> = {
  admin: [
    { resources: ['dashboard'], actions: ['view'] },
    { resources: ['orders'], actions: ['view', 'create', 'edit', 'delete'] },
    { resources: ['vehicles'], actions: ['view', 'create', 'edit', 'delete'] },
    { resources: ['customers'], actions: ['view', 'create', 'edit', 'delete'] },
    { resources: ['parts'], actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { resources: ['inventory'], actions: ['view', 'create', 'edit', 'export'] },
    { resources: ['quality'], actions: ['view', 'create', 'edit'] },
    { resources: ['price-list'], actions: ['view', 'create', 'edit', 'delete'] },
    { resources: ['config'], actions: ['view', 'edit'] },
    { resources: ['users'], actions: ['view', 'create', 'edit', 'delete'] },
  ],
  reception: [
    { resources: ['dashboard'], actions: ['view'] },
    { resources: ['orders'], actions: ['view', 'create', 'edit'] },
    { resources: ['vehicles'], actions: ['view', 'create', 'edit'] },
    { resources: ['customers'], actions: ['view', 'create', 'edit'] },
    { resources: ['parts'], actions: ['view'] },
    { resources: ['price-list'], actions: ['view'] },
    { resources: ['quality'], actions: ['view'] },
  ],
  technician: [
    { resources: ['dashboard'], actions: ['view'] },
    { resources: ['orders'], actions: ['view', 'edit'] },
    { resources: ['parts'], actions: ['view'] },
    { resources: ['quality'], actions: ['view', 'create', 'edit'] },
  ],
  storekeeper: [
    { resources: ['dashboard'], actions: ['view'] },
    { resources: ['orders'], actions: ['view'] },
    { resources: ['parts'], actions: ['view', 'create', 'edit'] },
    { resources: ['inventory'], actions: ['view', 'create', 'edit', 'export'] },
    { resources: ['quality'], actions: ['view'] },
  ],
  accountant: [
    { resources: ['dashboard'], actions: ['view'] },
    { resources: ['orders'], actions: ['view'] },
    { resources: ['parts'], actions: ['view', 'export'] },
    { resources: ['inventory'], actions: ['view', 'export'] },
    { resources: ['price-list'], actions: ['view', 'create', 'edit', 'delete'] },
  ],
};

export function hasPermission(role: Role, resource: string, action: string): boolean {
  if (role === 'admin') return true;
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  return permissions.some(
    (p) => p.resources.includes(resource) && p.actions.includes(action)
  );
}

const PERM_CACHE_KEY = 'permissions:all';
const PERM_CACHE_TTL = 300;

export async function hasPermissionAsync(role: Role, resource: string, action: string): Promise<boolean> {
  if (role === 'admin') return true;

  const dbPermissions = await getDbPermissions();
  const match = dbPermissions.some(
    (p) => p.role === role && p.resource === resource && p.action === action
  );

  if (dbPermissions.length > 0) return match;

  return hasPermission(role, resource, action);
}

async function getDbPermissions(): Promise<{ role: string; resource: string; action: string }[]> {
  const cached = await cache.get<{ role: string; resource: string; action: string }[]>(PERM_CACHE_KEY);
  if (cached) return cached;

  try {
    const perms = await prisma.rolePermission.findMany({
      select: { role: true, resource: true, action: true },
    });
    await cache.set(PERM_CACHE_KEY, perms, PERM_CACHE_TTL);
    return perms;
  } catch {
    return [];
  }
}

export async function invalidatePermissionCache(): Promise<void> {
  await cache.del(PERM_CACHE_KEY);
}

export function getAccessibleResources(role: Role): string[] {
  const permissions = rolePermissions[role];
  if (!permissions) return [];
  return permissions.flatMap((p) => p.resources);
}
