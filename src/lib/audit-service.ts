import { db } from '@/db';
import { auditLogs } from '@/db/schema';

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
  await db.insert(auditLogs).values({
    userId: options.userId,
    action: options.action,
    entityType: options.entityType,
    entityId: options.entityId,
    changes: options.changes ? JSON.stringify(options.changes) : null,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });
}

export async function getAuditLogsByEntity(entityType: string, entityId: string) {
  return db.query.auditLogs.findMany({
    where: (auditLogs, { and, eq }) =>
      and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)),
    orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
    with: {
      user: {
        columns: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getAuditLogsByUser(userId: string, limit = 50) {
  return db.query.auditLogs.findMany({
    where: (auditLogs, { eq }) => eq(auditLogs.userId, userId),
    orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
    limit,
  });
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
