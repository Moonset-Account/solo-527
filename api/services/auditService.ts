import { db } from '../db.js';

export function list(filters: { user_id?: number; entity_type?: string; action?: string } = {}) {
  const result: any[] = [];
  for (const [, log] of db.auditLogs) {
    if (filters.user_id && log.user_id !== filters.user_id) continue;
    if (filters.entity_type && log.entity_type !== filters.entity_type) continue;
    if (filters.action && log.action !== filters.action) continue;
    result.push(log);
  }
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function log(userId: number | null, action: string, entityType: string, entityId: number | null, oldValue: string | null, newValue: string | null, ipAddress: string) {
  const id = db.getNextId(db.auditLogs);
  const entry = {
    id,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
    ip_address: ipAddress,
    created_at: new Date().toISOString(),
  };
  db.auditLogs.set(id, entry);
  return entry;
}
