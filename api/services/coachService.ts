import { getDb } from '../db/database.js';
import type { Coach, User } from '../../shared/types.js';

export function listCoaches(status?: string): Coach[] {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM coaches WHERE status = ? ORDER BY created_at DESC').all(status) as Coach[];
  }
  return db.prepare('SELECT * FROM coaches ORDER BY created_at DESC').all() as Coach[];
}

export function getCoach(id: number): Coach | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM coaches WHERE id = ?').get(id) as Coach | undefined;
}

export function createCoach(data: Omit<Coach, 'id' | 'created_at' | 'updated_at'>): Coach {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO coaches (name, phone, email, specialties, certifications, bio, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.name, data.phone, data.email ?? null, data.specialties ?? null, data.certifications ?? null, data.bio ?? null, data.status || 'active');
  return db.prepare('SELECT * FROM coaches WHERE id = ?').get(result.lastInsertRowid) as Coach;
}

export function updateCoach(id: number, data: Partial<Coach>): Coach | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM coaches WHERE id = ?').get(id) as Coach | undefined;
  if (!existing) return null;

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

  db.prepare(`UPDATE coaches SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM coaches WHERE id = ?').get(id) as Coach;
}

export function getCoachPerformance(coachId: number, requester: User): { id: number; name: string; sessions: number; revenue: number } {
  if (requester.role === 'coach' && requester.coach_id !== coachId) {
    throw new Error('FORBIDDEN');
  }

  const db = getDb();
  const coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(coachId) as Coach | undefined;
  if (!coach) throw new Error('NOT_FOUND');

  const stats = db.prepare(`
    SELECT COUNT(*) as sessions, COALESCE(SUM(mp.paid_amount / mp.total_sessions), 0) as revenue
    FROM appointments a
    LEFT JOIN member_packages mp ON a.member_package_id = mp.id
    WHERE a.coach_id = ? AND a.status = 'checked_in'
  `).get(coachId) as { sessions: number; revenue: number };

  return {
    id: coachId,
    name: coach.name,
    sessions: stats.sessions,
    revenue: Math.round(stats.revenue * 100) / 100,
  };
}
