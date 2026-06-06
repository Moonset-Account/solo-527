import { prisma } from './prisma';
import type { AuditLog } from '@prisma/client';

export async function createAuditLog(data: {
  userId?: string;
  projectId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string;
}): Promise<AuditLog> {
  return prisma.auditLog.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
      newValues: data.newValues ? JSON.stringify(data.newValues) : null,
      ipAddress: data.ipAddress,
    },
  });
}

export function parseAuditLogValues(log: AuditLog): { oldValues?: Record<string, unknown>; newValues?: Record<string, unknown> } {
  return {
    oldValues: log.oldValues ? JSON.parse(log.oldValues) : undefined,
    newValues: log.newValues ? JSON.parse(log.newValues) : undefined,
  };
}

export async function logStatusChange(
  userId: string,
  entityType: string,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  projectId?: string
) {
  return createAuditLog({
    userId,
    projectId,
    action: 'STATUS_CHANGE',
    entityType,
    entityId,
    oldValues: { status: oldStatus },
    newValues: { status: newStatus },
  });
}

export async function logCreate(
  userId: string,
  entityType: string,
  entityId: string,
  newValues: Record<string, unknown>,
  projectId?: string
) {
  return createAuditLog({
    userId,
    projectId,
    action: 'CREATE',
    entityType,
    entityId,
    newValues,
  });
}

export async function logUpdate(
  userId: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  projectId?: string
) {
  return createAuditLog({
    userId,
    projectId,
    action: 'UPDATE',
    entityType,
    entityId,
    oldValues,
    newValues,
  });
}

export async function logDelete(
  userId: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, unknown>,
  projectId?: string
) {
  return createAuditLog({
    userId,
    projectId,
    action: 'DELETE',
    entityType,
    entityId,
    oldValues,
  });
}
