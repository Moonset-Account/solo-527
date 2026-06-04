import { getDb } from '../db/database.js';
import { enqueueNotification } from '../utils/queue.js';
import type { Appointment, MemberPackage } from '../../shared/types.js';

export function listAppointments(filters?: { member_id?: number; coach_id?: number; status?: string; date?: string }): Appointment[] {
  const db = getDb();
  let sql = 'SELECT * FROM appointments WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.member_id) {
    sql += ' AND member_id = ?';
    params.push(filters.member_id);
  }
  if (filters?.coach_id) {
    sql += ' AND coach_id = ?';
    params.push(filters.coach_id);
  }
  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.date) {
    sql += ' AND start_time LIKE ?';
    params.push(`${filters.date}%`);
  }

  sql += ' ORDER BY start_time DESC';
  return db.prepare(sql).all(...params) as Appointment[];
}

export function getAppointment(id: number): Appointment | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as Appointment | undefined;
}

export async function createAppointment(data: {
  member_id: number;
  coach_id: number;
  member_package_id?: number;
  start_time: string;
  end_time: string;
  type: string;
  group_class_id?: number;
  notes?: string;
}): Promise<Appointment> {
  const db = getDb();

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(data.member_id) as Record<string, unknown> | undefined;
  if (!member) throw new Error('MEMBER_NOT_FOUND');
  if (member.status === 'frozen') throw new Error('MEMBER_FROZEN');

  if (data.type === 'private') {
    if (!data.member_package_id) throw new Error('PACKAGE_REQUIRED');
    const pkg = db.prepare('SELECT * FROM member_packages WHERE id = ?').get(data.member_package_id) as MemberPackage | undefined;
    if (!pkg) throw new Error('PACKAGE_NOT_FOUND');
    if (pkg.member_id !== data.member_id) throw new Error('PACKAGE_NOT_BELONG_TO_MEMBER');
    if (pkg.status === 'frozen' || pkg.status === 'expired' || pkg.status === 'exhausted' || pkg.status === 'cancelled') throw new Error('PACKAGE_NOT_ACTIVE');
    if (pkg.remaining_sessions <= 0) throw new Error('NO_REMAINING_SESSIONS');
  }

  const conflict = db.prepare(`
    SELECT * FROM appointments
    WHERE coach_id = ?
    AND status != 'cancelled'
    AND (start_time < ? AND end_time > ?)
  `).get(data.coach_id, data.end_time, data.start_time) as Record<string, unknown> | undefined;
  if (conflict) throw new Error('COACH_TIME_CONFLICT');

  const result = db.prepare(`
    INSERT INTO appointments (member_id, coach_id, member_package_id, start_time, end_time, type, group_class_id, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'booked', ?)
  `).run(
    data.member_id,
    data.coach_id,
    data.member_package_id ?? null,
    data.start_time,
    data.end_time,
    data.type,
    data.group_class_id ?? null,
    data.notes ?? null
  );

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid) as Appointment;

  const memberUser = db.prepare('SELECT id FROM users WHERE member_id = ?').get(data.member_id) as { id: number } | undefined;
  if (memberUser) {
    await enqueueNotification({
      type: 'in_app',
      userId: memberUser.id,
      title: '预约确认',
      content: `您已成功预约 ${data.start_time} 的${data.type === 'private' ? '私教' : '团课'}课程`,
      messageType: 'reminder',
      relatedEntityType: 'appointment',
      relatedEntityId: appointment.id,
    });
  }

  const coachUser = db.prepare('SELECT id FROM users WHERE coach_id = ?').get(data.coach_id) as { id: number } | undefined;
  if (coachUser) {
    await enqueueNotification({
      type: 'in_app',
      userId: coachUser.id,
      title: '新预约',
      content: `新${data.type === 'private' ? '私教' : '团课'}预约: ${data.start_time}`,
      messageType: 'notification',
      relatedEntityType: 'appointment',
      relatedEntityId: appointment.id,
    });
  }

  return appointment;
}

export async function checkInAppointment(id: number): Promise<Appointment> {
  const db = getDb();
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as Appointment | undefined;
  if (!appointment) throw new Error('NOT_FOUND');
  if (appointment.status !== 'booked') throw new Error('INVALID_STATUS');

  if (appointment.type === 'private' && appointment.member_package_id) {
    const pkg = db.prepare('SELECT * FROM member_packages WHERE id = ?').get(appointment.member_package_id) as MemberPackage | undefined;
    if (!pkg) throw new Error('PACKAGE_NOT_FOUND');
    if (pkg.remaining_sessions <= 0) throw new Error('NO_REMAINING_SESSIONS');

    const newRemaining = pkg.remaining_sessions - 1;
    const newStatus = newRemaining === 0 ? 'exhausted' : pkg.status;

    db.prepare('UPDATE member_packages SET remaining_sessions = ?, status = ? WHERE id = ?').run(newRemaining, newStatus, pkg.id);

    db.prepare(`
      INSERT INTO session_deductions (appointment_id, member_package_id, sessions_deducted, remaining_after)
      VALUES (?, ?, 1, ?)
    `).run(id, pkg.id, newRemaining);

    db.prepare(`
      INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value)
      VALUES (NULL, 'member_package', ?, 'session_deducted', ?, ?)
    `).run(pkg.id, JSON.stringify({ remaining_sessions: pkg.remaining_sessions }), JSON.stringify({ remaining_sessions: newRemaining }));
  }

  db.prepare("UPDATE appointments SET status = 'checked_in', checked_in_at = datetime('now') WHERE id = ?").run(id);

  const memberUser = db.prepare('SELECT id FROM users WHERE member_id = ?').get(appointment.member_id) as { id: number } | undefined;
  if (memberUser) {
    await enqueueNotification({
      type: 'in_app',
      userId: memberUser.id,
      title: '签到成功',
      content: `您已成功签到 ${appointment.start_time} 的课程`,
      messageType: 'notification',
      relatedEntityType: 'appointment',
      relatedEntityId: id,
    });
  }

  return db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as Appointment;
}

export function updateAppointment(id: number, data: Partial<Appointment>): Appointment | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as Appointment | undefined;
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

  db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as Appointment;
}

export function deleteAppointment(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(id);
  return result.changes > 0;
}
