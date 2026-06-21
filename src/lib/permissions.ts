import type { Role } from '@prisma/client';

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
  const permissions = rolePermissions[role];
  if (!permissions) return false;

  return permissions.some(
    (p) => p.resources.includes(resource) && p.actions.includes(action)
  );
}

export function getAccessibleResources(role: Role): string[] {
  const permissions = rolePermissions[role];
  if (!permissions) return [];

  return permissions.flatMap((p) => p.resources);
}
