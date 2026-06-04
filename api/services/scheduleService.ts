import { getDb } from '../db/database.js';
import type { Schedule } from '../../shared/types.js';

export function listSchedules(filters?: { coach_id?: number; date?: string; start_date?: string; end_date?: string }): Schedule[] {
  const db = getDb();
  let sql = 'SELECT * FROM schedules WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.coach_id) {
    sql += ' AND coach_id = ?';
    params.push(filters.coach_id);
  }
  if (filters?.date) {
    sql += ' AND date = ?';
    params.push(filters.date);
  }
  if (filters?.start_date) {
    sql += ' AND date >= ?';
    params.push(filters.start_date);
  }
  if (filters?.end_date) {
    sql += ' AND date <= ?';
    params.push(filters.end_date);
  }

  sql += ' ORDER BY date ASC, start_time ASC';
  return db.prepare(sql).all(...params) as Schedule[];
}

export function createSchedule(data: {
  coach_id: number;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
}): Schedule {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO schedules (coach_id, date, start_time, end_time, type, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(data.coach_id, data.date, data.start_time, data.end_time, data.type);
  return db.prepare('SELECT * FROM schedules WHERE id = ?').get(result.lastInsertRowid) as Schedule;
}

export function approveSchedule(id: number, approvedBy: number): Schedule | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as Schedule | undefined;
  if (!existing) return null;
  if (existing.status !== 'pending') return null;

  db.prepare(`
    UPDATE schedules SET status = 'approved', approved_by = ? WHERE id = ?
  `).run(approvedBy, id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value)
    VALUES (?, 'schedule', ?, 'approve', 'pending', 'approved')
  `).run(approvedBy, id);

  return db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as Schedule;
}

export function rejectSchedule(id: number, approvedBy: number): Schedule | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as Schedule | undefined;
  if (!existing) return null;
  if (existing.status !== 'pending') return null;

  db.prepare(`
    UPDATE schedules SET status = 'rejected', approved_by = ? WHERE id = ?
  `).run(approvedBy, id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value)
    VALUES (?, 'schedule', ?, 'reject', 'pending', 'rejected')
  `).run(approvedBy, id);

  return db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as Schedule;
}

export function getCoachSchedule(coachId: number, startDate: string, endDate: string): Schedule[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM schedules
    WHERE coach_id = ? AND date >= ? AND date <= ?
    ORDER BY date ASC, start_time ASC
  `).all(coachId, startDate, endDate) as Schedule[];
}
