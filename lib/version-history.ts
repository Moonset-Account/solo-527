import { prisma } from "./prisma";
import type { Prisma, User } from "@prisma/client";

export type EntityType =
  | "Quote"
  | "QuoteItem"
  | "Addon"
  | "Material"
  | "SitePhoto"
  | "Contract"
  | "Project"
  | "BudgetChange";

export interface VersionSnapshot {
  [key: string]: unknown;
}

export async function createVersionHistory(
  entityType: EntityType,
  entityId: string,
  version: number,
  snapshot: VersionSnapshot,
  changedById: string,
  changeNote?: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;
  return client.versionHistory.create({
    data: {
      entityType,
      entityId,
      version,
      snapshot: snapshot as Prisma.JsonValue,
      changedById,
      changeNote,
    },
  });
}

export async function getVersionHistory(
  entityType: EntityType,
  entityId: string
) {
  return prisma.versionHistory.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      changedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      version: "desc",
    },
  });
}

export async function getSpecificVersion(
  entityType: EntityType,
  entityId: string,
  version: number
) {
  return prisma.versionHistory.findFirst({
    where: {
      entityType,
      entityId,
      version,
    },
    include: {
      changedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

export async function compareVersions(
  entityType: EntityType,
  entityId: string,
  versionA: number,
  versionB: number
) {
  const [historyA, historyB] = await Promise.all([
    getSpecificVersion(entityType, entityId, versionA),
    getSpecificVersion(entityType, entityId, versionB),
  ]);

  if (!historyA || !historyB) {
    return null;
  }

  const snapshotA = historyA.snapshot as VersionSnapshot;
  const snapshotB = historyB.snapshot as VersionSnapshot;

  const differences: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[] = [];

  const allFields = new Set([...Object.keys(snapshotA), ...Object.keys(snapshotB)]);

  for (const field of allFields) {
    if (field === "updatedAt" || field === "version") continue;
    const oldVal = snapshotA[field];
    const newVal = snapshotB[field];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      differences.push({ field, oldValue: oldVal, newValue: newVal });
    }
  }

  return {
    versionA: historyA,
    versionB: historyB,
    differences,
  };
}

export function takeSnapshot<T extends object>(entity: T): VersionSnapshot {
  const snapshot: VersionSnapshot = {};
  for (const [key, value] of Object.entries(entity)) {
    if (key === "id" || key.startsWith("_")) continue;
    if (value instanceof Date) {
      snapshot[key] = value.toISOString();
    } else if (typeof value === "object" && value !== null) {
      snapshot[key] = JSON.parse(JSON.stringify(value));
    } else {
      snapshot[key] = value;
    }
  }
  return snapshot;
}
