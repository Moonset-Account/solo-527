import { getDb } from '../db/database.js';
import type { Member } from '../../shared/types.js';

export function listMembers(status?: string): Member[] {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM members WHERE status = ? ORDER BY created_at DESC').all(status) as Member[];
  }
  return db.prepare('SELECT * FROM members ORDER BY created_at DESC').all() as Member[];
}

export function getMember(id: number): Member | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | undefined;
}

export function createMember(data: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Member {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO members (name, phone, email, gender, birthday, emergency_contact, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.name, data.phone, data.email ?? null, data.gender ?? null, data.birthday ?? null, data.emergency_contact ?? null, data.notes ?? null, data.status || 'active');
  return db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid) as Member;
}

export function updateMember(id: number, data: Partial<Member>): Member | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | undefined;
  if (!existing) return null;

  if (data.status && data.status !== existing.status) {
    db.prepare(`
      INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value)
      VALUES (NULL, 'member_status', ?, 'status_change', ?, ?)
    `).run(id, existing.status, data.status);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE members SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member;
}

export function deleteMember(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM members WHERE id = ?').run(id);
  return result.changes > 0;
}
