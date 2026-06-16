import { prisma } from "@/server/db/prisma";
import { Prisma } from "@prisma/client";

interface CreateAuditLogParams {
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  userId: string;
  userName: string;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  const { action, entityType, entityId, oldValue, newValue, userId, userName } =
    params;

  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        oldValue: oldValue as Prisma.InputJsonValue | undefined,
        newValue: newValue as Prisma.InputJsonValue | undefined,
        userId,
        userName,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
