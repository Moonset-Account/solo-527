import { getDb } from '../db/database.js';
import type { RenewalTracking, MemberPackage } from '../../shared/types.js';

export function getRenewalFunnel(): { expiring: number; expired: number; renewed: number; lost: number } {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'expiring' THEN 1 ELSE 0 END) as expiring,
      SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
      SUM(CASE WHEN status = 'renewed' THEN 1 ELSE 0 END) as renewed,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost
    FROM renewal_tracking
  `).get() as { expiring: number; expired: number; renewed: number; lost: number };
  return stats || { expiring: 0, expired: 0, renewed: 0, lost: 0 };
}

export function listExpiringPackages(): (RenewalTracking & { member_name: string; package_name: string; expiry_date: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT rt.*, m.name as member_name, pt.name as package_name, mp.expiry_date
    FROM renewal_tracking rt
    JOIN members m ON rt.member_id = m.id
    JOIN member_packages mp ON rt.member_package_id = mp.id
    JOIN package_types pt ON mp.package_type_id = pt.id
    WHERE rt.status IN ('expiring', 'expired')
    ORDER BY mp.expiry_date ASC
  `).all() as (RenewalTracking & { member_name: string; package_name: string; expiry_date: string })[];
}

export function addFollowUpNotes(id: number, notes: string): RenewalTracking | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM renewal_tracking WHERE id = ?').get(id) as RenewalTracking | undefined;
  if (!existing) return null;

  const lastReminder = existing.first_reminder_at ? new Date().toISOString() : null;
  if (!existing.first_reminder_at) {
    db.prepare(`
      UPDATE renewal_tracking SET follow_up_notes = ?, first_reminder_at = datetime('now')
      WHERE id = ?
    `).run(notes, id);
  } else {
    db.prepare(`
      UPDATE renewal_tracking SET follow_up_notes = ?, last_reminder_at = datetime('now')
      WHERE id = ?
    `).run(notes, id);
  }

  return db.prepare('SELECT * FROM renewal_tracking WHERE id = ?').get(id) as RenewalTracking;
}

export function markAsRenewed(id: number): RenewalTracking | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM renewal_tracking WHERE id = ?').get(id) as RenewalTracking | undefined;
  if (!existing) return null;

  db.prepare(`
    UPDATE renewal_tracking SET status = 'renewed', renewed_at = datetime('now')
    WHERE id = ?
  `).run(id);

  return db.prepare('SELECT * FROM renewal_tracking WHERE id = ?').get(id) as RenewalTracking;
}

export function scanExpiringPackages(daysThreshold: number = 30): RenewalTracking[] {
  const db = getDb();
  const now = new Date();
  const threshold = new Date(now.getTime() + daysThreshold * 86400000).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const expiring = db.prepare(`
    SELECT mp.* FROM member_packages mp
    LEFT JOIN renewal_tracking rt ON mp.id = rt.member_package_id AND rt.status IN ('expiring', 'expired')
    WHERE mp.status = 'active'
    AND mp.expiry_date <= ?
    AND mp.expiry_date > ?
    AND rt.id IS NULL
  `).all(threshold, today) as MemberPackage[];

  const results: RenewalTracking[] = [];
  for (const pkg of expiring) {
    const result = db.prepare(`
      INSERT INTO renewal_tracking (member_id, member_package_id, status)
      VALUES (?, ?, 'expiring')
    `).run(pkg.member_id, pkg.id);
    results.push(db.prepare('SELECT * FROM renewal_tracking WHERE id = ?').get(result.lastInsertRowid) as RenewalTracking);
  }

  const expired = db.prepare(`
    SELECT mp.* FROM member_packages mp
    LEFT JOIN renewal_tracking rt ON mp.id = rt.member_package_id AND rt.status IN ('expiring', 'expired')
    WHERE mp.status = 'active'
    AND mp.expiry_date <= ?
    AND rt.id IS NULL
  `).all(today) as MemberPackage[];

  for (const pkg of expired) {
    const result = db.prepare(`
      INSERT INTO renewal_tracking (member_id, member_package_id, status)
      VALUES (?, ?, 'expired')
    `).run(pkg.member_id, pkg.id);
    results.push(db.prepare('SELECT * FROM renewal_tracking WHERE id = ?').get(result.lastInsertRowid) as RenewalTracking);
  }

  return results;
}
