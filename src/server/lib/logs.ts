import type { OperationLog } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

type LogInput = {
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  detail?: string;
  operatorId: string;
};

export async function createLog(
  db: PrismaClient,
  input: LogInput
): Promise<OperationLog> {
  return db.operationLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      fieldName: input.fieldName,
      oldValue: input.oldValue as never,
      newValue: input.newValue as never,
      detail: input.detail,
      operatorId: input.operatorId,
    },
  });
}

export async function createLogs(
  db: PrismaClient,
  logs: LogInput[]
): Promise<{ count: number }> {
  if (logs.length === 0) return { count: 0 };
  return db.operationLog.createMany({
    data: logs.map((l) => ({
      entityType: l.entityType,
      entityId: l.entityId,
      action: l.action,
      fieldName: l.fieldName,
      oldValue: l.oldValue as never,
      newValue: l.newValue as never,
      detail: l.detail,
      operatorId: l.operatorId,
    })),
  });
}

export function diffAndCreateLogs<T extends Record<string, unknown>>(
  entityType: string,
  entityId: string,
  oldEntity: T,
  newEntity: Partial<T>,
  operatorId: string,
  trackedFields: readonly (keyof T & string)[]
): LogInput[] {
  const logs: LogInput[] = [];
  for (const field of trackedFields) {
    const oldVal = oldEntity[field];
    const newVal = newEntity[field];
    if (field in newEntity && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      logs.push({
        entityType,
        entityId,
        action: "UPDATE",
        fieldName: field,
        oldValue: oldVal,
        newValue: newVal,
        operatorId,
      });
    }
  }
  return logs;
}
