import type { EntityType } from "@prisma/client";
import type { AuditLog } from "@/types";
import { mockAuditLogs, getCurrentUser } from "./mockData";
import { generateId } from "@/lib/utils";

export const auditService = {
  async getAuditLogs(entityType?: EntityType, entityId?: string): Promise<AuditLog[]> {
    try {
      let logs = [...mockAuditLogs];
      if (entityType) {
        logs = logs.filter((log) => log.entityType === entityType);
      }
      if (entityId) {
        logs = logs.filter((log) => log.entityId === entityId);
      }
      return logs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.error("getAuditLogs error:", err);
      return mockAuditLogs;
    }
  },

  async createAuditLog(
    action: string,
    entityType: EntityType,
    entityId: string,
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null,
    remark: string,
    operatorId?: string,
    operatorName?: string
  ): Promise<AuditLog> {
    if (!remark) {
      throw new Error("remark is required");
    }
    const currentUser = getCurrentUser();
    const auditLog: AuditLog = {
      id: generateId(),
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      remark,
      operatorId: operatorId || currentUser.id,
      operatorName: operatorName || currentUser.name,
      createdAt: new Date(),
    };
    mockAuditLogs.unshift(auditLog);
    return auditLog;
  },
};
