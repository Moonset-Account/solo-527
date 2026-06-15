import { LogAction, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface AuditLogOptions {
  action: LogAction;
  entityType: string;
  entityId: string;
  userId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  description?: string;
  repairRequestId?: string;
  complaintId?: string;
  refundId?: string;
  tradeId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(options: AuditLogOptions) {
  const {
    action,
    entityType,
    entityId,
    userId,
    oldValue,
    newValue,
    description,
    repairRequestId,
    complaintId,
    refundId,
    tradeId,
    ipAddress,
    userAgent,
  } = options;

  return prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      oldValue: oldValue as any,
      newValue: newValue as any,
      description,
      repairRequestId,
      complaintId,
      refundId,
      tradeId,
      ipAddress,
      userAgent,
    },
  });
}

export async function logRepairStatusChange(
  repairId: string,
  userId: string,
  oldStatus: string,
  newStatus: string,
  user?: User | null
) {
  return createAuditLog({
    action: LogAction.STATUS_CHANGE,
    entityType: "RepairRequest",
    entityId: repairId,
    userId,
    oldValue: { status: oldStatus },
    newValue: { status: newStatus },
    description: `${user?.name || "用户"} 将报修单状态从 ${oldStatus} 变更为 ${newStatus}`,
    repairRequestId: repairId,
  });
}

export async function logCreate(
  entityType: string,
  entityId: string,
  userId: string,
  newValue: Record<string, unknown>,
  description?: string,
  repairRequestId?: string
) {
  return createAuditLog({
    action: LogAction.CREATE,
    entityType,
    entityId,
    userId,
    newValue,
    description,
    repairRequestId,
  });
}

export async function logUpdate(
  entityType: string,
  entityId: string,
  userId: string,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown>,
  description?: string,
  repairRequestId?: string
) {
  return createAuditLog({
    action: LogAction.UPDATE,
    entityType,
    userId,
    entityId,
    oldValue,
    newValue,
    description,
    repairRequestId,
  });
}

export async function logExport(
  entityType: string,
  entityId: string,
  userId: string,
  description: string
) {
  return createAuditLog({
    action: LogAction.EXPORT,
    entityType,
    entityId,
    userId,
    description,
  });
}

export async function logApprove(
  entityType: string,
  entityId: string,
  userId: string,
  description: string,
  repairRequestId?: string
) {
  return createAuditLog({
    action: LogAction.APPROVE,
    entityType,
    entityId,
    userId,
    description,
    repairRequestId,
  });
}

export async function logReject(
  entityType: string,
  entityId: string,
  userId: string,
  description: string,
  repairRequestId?: string
) {
  return createAuditLog({
    action: LogAction.REJECT,
    entityType,
    entityId,
    userId,
    description,
    repairRequestId,
  });
}

export async function logRefund(
  entityType: string,
  entityId: string,
  userId: string,
  amount: number,
  description: string,
  repairRequestId?: string
) {
  return createAuditLog({
    action: LogAction.REFUND,
    entityType,
    entityId,
    userId,
    newValue: { amount },
    description,
    repairRequestId,
  });
}
