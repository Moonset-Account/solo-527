import { getDb } from '../db/database.js';
import type { BodyTest } from '../../shared/types.js';

export function createBodyTest(data: {
  member_id: number;
  coach_id: number;
  height?: number;
  weight?: number;
  body_fat?: number;
  muscle_mass?: number;
  waist?: number;
  chest?: number;
  hips?: number;
  notes?: string;
  test_date: string;
}): BodyTest {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO body_tests (member_id, coach_id, height, weight, body_fat, muscle_mass, waist, chest, hips, notes, test_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.member_id, data.coach_id,
    data.height ?? null, data.weight ?? null, data.body_fat ?? null,
    data.muscle_mass ?? null, data.waist ?? null, data.chest ?? null,
    data.hips ?? null, data.notes ?? null, data.test_date
  );
  return db.prepare('SELECT * FROM body_tests WHERE id = ?').get(result.lastInsertRowid) as BodyTest;
}

export function listBodyTestsForMember(memberId: number): BodyTest[] {
  const db = getDb();
  return db.prepare('SELECT * FROM body_tests WHERE member_id = ? ORDER BY test_date DESC').all(memberId) as BodyTest[];
}
