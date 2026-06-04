import { getDb } from '../db/database.js';
import type { PackageType, MemberPackage } from '../../shared/types.js';

export function listPackageTypes(activeOnly?: boolean): PackageType[] {
  const db = getDb();
  if (activeOnly) {
    return db.prepare('SELECT * FROM package_types WHERE active = 1 ORDER BY created_at DESC').all() as PackageType[];
  }
  return db.prepare('SELECT * FROM package_types ORDER BY created_at DESC').all() as PackageType[];
}

export function getPackageType(id: number): PackageType | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM package_types WHERE id = ?').get(id) as PackageType | undefined;
}

export function createPackageType(data: Omit<PackageType, 'id' | 'created_at'>): PackageType {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO package_types (name, total_sessions, valid_days, price, description, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.name, data.total_sessions, data.valid_days, data.price, data.description ?? null, data.active ? 1 : 0);
  return db.prepare('SELECT * FROM package_types WHERE id = ?').get(result.lastInsertRowid) as PackageType;
}

export function updatePackageType(id: number, data: Partial<PackageType>): PackageType | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM package_types WHERE id = ?').get(id) as PackageType | undefined;
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id' || key === 'created_at') continue;
    if (key === 'active') {
      fields.push('active = ?');
      values.push(value ? 1 : 0);
    } else {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return existing;
  values.push(id);

  db.prepare(`UPDATE package_types SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM package_types WHERE id = ?').get(id) as PackageType;
}

export function deletePackageType(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM package_types WHERE id = ?').run(id);
  return result.changes > 0;
}

export function purchasePackage(memberId: number, packageTypeId: number, paidAmount: number): MemberPackage {
  const db = getDb();
  const packageType = db.prepare('SELECT * FROM package_types WHERE id = ?').get(packageTypeId) as PackageType | undefined;
  if (!packageType) throw new Error('PACKAGE_TYPE_NOT_FOUND');

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId) as Record<string, unknown> | undefined;
  if (!member) throw new Error('MEMBER_NOT_FOUND');

  const now = new Date();
  const startDate = now.toISOString().slice(0, 10);
  const expiryDate = new Date(now.getTime() + packageType.valid_days * 86400000).toISOString().slice(0, 10);

  const result = db.prepare(`
    INSERT INTO member_packages (member_id, package_type_id, remaining_sessions, total_sessions, start_date, expiry_date, paid_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(memberId, packageTypeId, packageType.total_sessions, packageType.total_sessions, startDate, expiryDate, paidAmount);

  return db.prepare('SELECT * FROM member_packages WHERE id = ?').get(result.lastInsertRowid) as MemberPackage;
}

export function listMemberPackages(memberId: number): MemberPackage[] {
  const db = getDb();
  return db.prepare('SELECT * FROM member_packages WHERE member_id = ? ORDER BY created_at DESC').all(memberId) as MemberPackage[];
}
