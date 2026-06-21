import type { Prisma, User } from "@prisma/client";
import { db } from "@/server/db";

export type TrackedEntity = "LEASE" | "BILL" | "ASSIGNMENT" | "SETTLEMENT" | "CONTRACT";

interface TrackedFieldConfig {
  entity: TrackedEntity;
  fields: string[];
}

const TRACKED_FIELDS: Record<TrackedEntity, string[]> = {
  LEASE: ["monthlyRent", "deposit", "startDate", "endDate", "paymentDay", "status", "tenantId"],
  BILL: ["amount", "paidAmount", "dueDate", "paidDate", "status", "paymentMethod"],
  ASSIGNMENT: ["status", "priority", "assigneeId", "handleNote", "satisfactionScore"],
  SETTLEMENT: ["totalRent", "managementFee", "ownerAmount", "status", "paidDate"],
  CONTRACT: ["status", "signedAt"],
};

export async function recordChanges<T extends { id: string }>(
  entityType: TrackedEntity,
  entityId: string,
  oldData: T,
  newData: Partial<T>,
  operator: User,
  reason?: string
): Promise<void> {
  const trackedFields = TRACKED_FIELDS[entityType];

  const changes: Prisma.ChangeRecordCreateManyInput[] = [];

  for (const field of trackedFields) {
    if (field in newData) {
      const oldValue = oldData[field as keyof T];
      const newValue = newData[field as keyof T];

      const oldStr = formatValue(oldValue);
      const newStr = formatValue(newValue);

      if (oldStr !== newStr) {
        changes.push({
          entityType,
          entityId,
          fieldName: field,
          oldValue: oldStr,
          newValue: newStr,
          operatorId: operator.id,
          reason,
        });
      }
    }
  }

  if (changes.length > 0) {
    await db.changeRecord.createMany({ data: changes });
  }
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export async function getChangeHistory(
  entityType: TrackedEntity,
  entityId: string
) {
  return db.changeRecord.findMany({
    where: { entityType, entityId },
    include: { operator: { select: { name: true, role: true } } },
    orderBy: { changedAt: "desc" },
  });
}

export interface AuditSearchParams {
  entityType?: TrackedEntity;
  entityId?: string;
  fieldName?: string;
  operatorId?: string;
  changedFrom?: Date;
  changedTo?: Date;
  oldValue?: string;
  newValue?: string;
  page?: number;
  pageSize?: number;
}

export async function searchChangeRecords(params: AuditSearchParams) {
  const {
    entityType,
    entityId,
    fieldName,
    operatorId,
    changedFrom,
    changedTo,
    oldValue,
    newValue,
    page = 1,
    pageSize = 20,
  } = params;

  const where: Prisma.ChangeRecordWhereInput = {};

  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (fieldName) where.fieldName = fieldName;
  if (operatorId) where.operatorId = operatorId;
  if (changedFrom) where.changedAt = { ...where.changedAt, gte: changedFrom };
  if (changedTo) where.changedAt = { ...where.changedAt, lte: changedTo };
  if (oldValue) where.oldValue = { contains: oldValue, mode: "insensitive" };
  if (newValue) where.newValue = { contains: newValue, mode: "insensitive" };

  const [total, records] = await Promise.all([
    db.changeRecord.count({ where }),
    db.changeRecord.findMany({
      where,
      include: { operator: { select: { name: true, role: true, email: true } } },
      orderBy: { changedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { total, records, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
