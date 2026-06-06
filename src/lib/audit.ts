import { prisma } from './prisma';
import { AuditAction } from '@prisma/client';

export async function createAuditLog(
  action: AuditAction,
  entityType: string,
  entityId: string,
  userId?: string,
  details?: any
) {
  return prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      details: details as any,
    },
  });
}

export async function getAuditLogsByEntity(entityType: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getAuditLogsByUser(userId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}
