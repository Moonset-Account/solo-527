import { getDb } from '../db/database.js';
import type { GroupClass, Appointment } from '../../shared/types.js';

export function listGroupClasses(filters?: { coach_id?: number; status?: string }): GroupClass[] {
  const db = getDb();
  let sql = 'SELECT * FROM group_classes WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.coach_id) {
    sql += ' AND coach_id = ?';
    params.push(filters.coach_id);
  }
  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  sql += ' ORDER BY start_time DESC';
  return db.prepare(sql).all(...params) as GroupClass[];
}

export function getGroupClass(id: number): GroupClass | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM group_classes WHERE id = ?').get(id) as GroupClass | undefined;
}

export function createGroupClass(data: Omit<GroupClass, 'id' | 'current_bookings' | 'created_at'>): GroupClass {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO group_classes (name, coach_id, start_time, end_time, max_capacity, current_bookings, status)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(data.name, data.coach_id, data.start_time, data.end_time, data.max_capacity, data.status || 'scheduled');
  return db.prepare('SELECT * FROM group_classes WHERE id = ?').get(result.lastInsertRowid) as GroupClass;
}

export function updateGroupClass(id: number, data: Partial<GroupClass>): GroupClass | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM group_classes WHERE id = ?').get(id) as GroupClass | undefined;
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id' || key === 'created_at') continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return existing;
  values.push(id);

  db.prepare(`UPDATE group_classes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM group_classes WHERE id = ?').get(id) as GroupClass;
}

export function deleteGroupClass(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM group_classes WHERE id = ?').run(id);
  return result.changes > 0;
}

export async function bookGroupClass(classId: number, memberId: number): Promise<Appointment> {
  const db = getDb();
  const groupClass = db.prepare('SELECT * FROM group_classes WHERE id = ?').get(classId) as GroupClass | undefined;
  if (!groupClass) throw new Error('NOT_FOUND');
  if (groupClass.status !== 'scheduled') throw new Error('CLASS_NOT_AVAILABLE');
  if (groupClass.current_bookings >= groupClass.max_capacity) throw new Error('CLASS_FULL');

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId) as Record<string, unknown> | undefined;
  if (!member) throw new Error('MEMBER_NOT_FOUND');
  if (member.status === 'frozen') throw new Error('MEMBER_FROZEN');

  db.prepare('UPDATE group_classes SET current_bookings = current_bookings + 1 WHERE id = ?').run(classId);

  const result = db.prepare(`
    INSERT INTO appointments (member_id, coach_id, start_time, end_time, type, group_class_id, status)
    VALUES (?, ?, ?, ?, 'group', ?, 'booked')
  `).run(memberId, groupClass.coach_id, groupClass.start_time, groupClass.end_time, classId);

  return db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid) as Appointment;
}

export function cancelGroupClassBooking(classId: number, memberId: number): boolean {
  const db = getDb();
  const groupClass = db.prepare('SELECT * FROM group_classes WHERE id = ?').get(classId) as GroupClass | undefined;
  if (!groupClass) throw new Error('NOT_FOUND');

  const appointment = db.prepare(`
    SELECT * FROM appointments WHERE group_class_id = ? AND member_id = ? AND status = 'booked'
  `).get(classId, memberId) as Appointment | undefined;
  if (!appointment) throw new Error('BOOKING_NOT_FOUND');

  db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(appointment.id);
  db.prepare('UPDATE group_classes SET current_bookings = current_bookings - 1 WHERE id = ?').run(classId);

  return true;
}
