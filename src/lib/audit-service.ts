interface AuditLogOptions {
  userId: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'download';
  entityType: string;
  entityId: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(options: AuditLogOptions) {
  console.log('[Audit]', options.action, options.entityType, options.entityId, options.changes);
}

export async function getAuditLogsByEntity(entityType: string, entityId: string) {
  return [];
}

export async function getAuditLogsByUser(userId: string, limit = 50) {
  return [];
}

function diffObjects(before: Record<string, unknown>, after: Record<string, unknown>) {
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    if (before[key] !== after[key]) {
      changes[key] = {
        before: before[key],
        after: after[key],
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : undefined;
}

export function createChangeTracker<T extends Record<string, unknown>>(original: T) {
  return (updated: Partial<T>) => {
    return diffObjects(original as Record<string, unknown>, {
      ...original,
      ...updated,
    } as Record<string, unknown>);
  };
}
