import { mockAuditLogs } from "./mockData";
import type { AuditLog, EntityType } from "@/types";

export const auditLogService = {
  async getAuditLogs(entityType?: EntityType, entityId?: string): Promise<AuditLog[]> {
    let filtered = [...mockAuditLogs];
    if (entityType) {
      filtered = filtered.filter((l) => l.entityType === entityType);
    }
    if (entityId) {
      filtered = filtered.filter((l) => l.entityId === entityId);
    }
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
};
