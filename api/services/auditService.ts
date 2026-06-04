import { getDb } from '../db/database.js';
import type { AuditLog } from '../../shared/types.js';

export function queryAuditLogs(filters?: {
  entity_type?: string;
  entity_id?: number;
  user_id?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}): { logs: AuditLog[]; total: number } {
  const db = getDb();
  let countSql = 'SELECT COUNT(*) as cnt FROM audit_logs WHERE 1=1';
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: unknown[] = [];
  const countParams: unknown[] = [];

  if (filters?.entity_type) {
    countSql += ' AND entity_type = ?';
    sql += ' AND entity_type = ?';
    params.push(filters.entity_type);
    countParams.push(filters.entity_type);
  }
  if (filters?.entity_id) {
    countSql += ' AND entity_id = ?';
    sql += ' AND entity_id = ?';
    params.push(filters.entity_id);
    countParams.push(filters.entity_id);
  }
  if (filters?.user_id) {
    countSql += ' AND user_id = ?';
    sql += ' AND user_id = ?';
    params.push(filters.user_id);
    countParams.push(filters.user_id);
  }
  if (filters?.start_date) {
    countSql += ' AND created_at >= ?';
    sql += ' AND created_at >= ?';
    params.push(filters.start_date);
    countParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    countSql += ' AND created_at <= ?';
    sql += ' AND created_at <= ?';
    params.push(filters.end_date);
    countParams.push(filters.end_date);
  }

  const total = (db.prepare(countSql).get(...countParams) as { cnt: number }).cnt;

  sql += ' ORDER BY created_at DESC';
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const logs = db.prepare(sql).all(...params) as AuditLog[];
  return { logs, total };
}
