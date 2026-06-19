import { prisma } from "./prisma";
import type { User } from "@prisma/client";
import { AuditAction, AuditEntity } from "@prisma/client";

export interface AuditInput {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  assetId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  changedFields?: string[];
  user: Pick<User, "id" | "email" | "name"> | null;
  note?: string;
}

export async function createAuditLog(input: AuditInput) {
  const {
    action,
    entity,
    entityId,
    assetId,
    oldValue,
    newValue,
    changedFields = [],
    user,
    note,
  } = input;

  const changedFieldsSet = changedFields.length > 0
    ? changedFields
    : inferChangedFields(oldValue, newValue);

  return prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId: entityId ?? undefined,
      assetId: assetId ?? undefined,
      oldValue: oldValue as Record<string, unknown> | undefined,
      newValue: newValue as Record<string, unknown> | undefined,
      changedFields: changedFieldsSet,
      userId: user?.id,
      userEmail: user?.email,
      note,
    },
  });
}

function inferChangedFields(oldValue: unknown, newValue: unknown): string[] {
  if (!oldValue || !newValue) return [];
  const oldObj = oldValue as Record<string, unknown>;
  const newObj = newValue as Record<string, unknown>;
  const fields: string[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  for (const key of allKeys) {
    const a = oldObj[key];
    const b = newObj[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      fields.push(key);
    }
  }
  return fields;
}
