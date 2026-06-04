import { getDb } from '../db/database.js';
import { enqueueNotification } from '../utils/queue.js';
import type { Freeze, MemberPackage } from '../../shared/types.js';

export function listFreezes(filters?: { member_id?: number; status?: string }): Freeze[] {
  const db = getDb();
  let sql = 'SELECT * FROM freezes WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.member_id) {
    sql += ' AND member_id = ?';
    params.push(filters.member_id);
  }
  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params) as Freeze[];
}

export function getFreeze(id: number): Freeze | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM freezes WHERE id = ?').get(id) as Freeze | undefined;
}

export function getMemberFreezes(memberId: number): Freeze[] {
  const db = getDb();
  return db.prepare('SELECT * FROM freezes WHERE member_id = ? ORDER BY created_at DESC').all(memberId) as Freeze[];
}

export async function createFreeze(data: {
  member_id: number;
  member_package_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
}): Promise<Freeze> {
  const db = getDb();

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(data.member_id) as Record<string, unknown> | undefined;
  if (!member) throw new Error('MEMBER_NOT_FOUND');

  const pkg = db.prepare('SELECT * FROM member_packages WHERE id = ?').get(data.member_package_id) as MemberPackage | undefined;
  if (!pkg) throw new Error('PACKAGE_NOT_FOUND');
  if (pkg.member_id !== data.member_id) throw new Error('PACKAGE_NOT_BELONG_TO_MEMBER');

  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  const extraDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);

  const result = db.prepare(`
    INSERT INTO freezes (member_id, member_package_id, start_date, end_date, reason, status, extra_days)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(data.member_id, data.member_package_id, data.start_date, data.end_date, data.reason ?? null, extraDays);

  const freeze = db.prepare('SELECT * FROM freezes WHERE id = ?').get(result.lastInsertRowid) as Freeze;

  const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as { id: number }[];
  for (const admin of adminUsers) {
    await enqueueNotification({
      type: 'in_app',
      userId: admin.id,
      title: '冻绷新申请',
      content: `会员申请冻结套餐,请审核`,
      messageType: 'approval',
      relatedEntityType: 'freeze',
      relatedEntityId: freeze.id,
    });
  }

  return freeze;
}

export async function approveFreeze(id: number, approvedBy: number): Promise<Freeze> {
  const db = getDb();
  const freeze = db.prepare('SELECT * FROM freezes WHERE id = ?').get(id) as Freeze | undefined;
  if (!freeze) throw new Error('NOT_FOUND');
  if (freeze.status !== 'pending') throw new Error('INVALID_STATUS');

  db.prepare(`
    UPDATE freezes SET status = 'approved', approved_by = ?, approved_at = datetime('now')
    WHERE id = ?
  `).run(approvedBy, id);

  db.prepare("UPDATE members SET status = 'frozen', updated_at = datetime('now') WHERE id = ?").run(freeze.member_id);

  const pkg = db.prepare('SELECT * FROM member_packages WHERE id = ?').get(freeze.member_package_id) as MemberPackage | undefined;
  if (pkg) {
    const newExpiry = new Date(new Date(pkg.expiry_date).getTime() + freeze.extra_days * 86400000).toISOString().slice(0, 10);
    db.prepare(`
      UPDATE member_packages SET expiry_date = ?, status = 'frozen' WHERE id = ?
    `).run(newExpiry, freeze.member_package_id);

    db.prepare(`
      INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value)
      VALUES (?, 'member_package', ?, 'freeze_approved', ?, ?)
    `).run(approvedBy, freeze.member_package_id, JSON.stringify({ expiry_date: pkg.expiry_date, status: pkg.status }), JSON.stringify({ expiry_date: newExpiry, status: 'frozen' }));
  }

  db.prepare(`
    INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value)
    VALUES (?, 'member', ?, 'status_change', 'active', 'frozen')
  `).run(approvedBy, freeze.member_id);

  const memberUser = db.prepare('SELECT id FROM users WHERE member_id = ?').get(freeze.member_id) as { id: number } | undefined;
  if (memberUser) {
    await enqueueNotification({
      type: 'in_app',
      userId: memberUser.id,
      title: '冻结申请已通过',
      content: `您的冻结申请已通过,套餐有效期已延长${freeze.extra_days}天`,
      messageType: 'approval',
      relatedEntityType: 'freeze',
      relatedEntityId: id,
    });
  }

  return db.prepare('SELECT * FROM freezes WHERE id = ?').get(id) as Freeze;
}

export async function rejectFreeze(id: number, approvedBy: number): Promise<Freeze> {
  const db = getDb();
  const freeze = db.prepare('SELECT * FROM freezes WHERE id = ?').get(id) as Freeze | undefined;
  if (!freeze) throw new Error('NOT_FOUND');
  if (freeze.status !== 'pending') throw new Error('INVALID_STATUS');

  db.prepare(`
    UPDATE freezes SET status = 'rejected', approved_by = ?, approved_at = datetime('now')
    WHERE id = ?
  `).run(approvedBy, id);

  const memberUser = db.prepare('SELECT id FROM users WHERE member_id = ?').get(freeze.member_id) as { id: number } | undefined;
  if (memberUser) {
    await enqueueNotification({
      type: 'in_app',
      userId: memberUser.id,
      title: '冻结申请已拒绝',
      content: `您的冻结申请已被拒绝`,
      messageType: 'approval',
      relatedEntityType: 'freeze',
      relatedEntityId: id,
    });
  }

  return db.prepare('SELECT * FROM freezes WHERE id = ?').get(id) as Freeze;
}

export async function autoUnfreeze(): Promise<number> {
  const db = getDb();
  const now = new Date().toISOString().slice(0, 10);

  const expiredFreezes = db.prepare(`
    SELECT * FROM freezes WHERE status = 'approved' AND end_date <= ?
  `).all(now) as Freeze[];

  let count = 0;
  for (const freeze of expiredFreezes) {
    db.prepare("UPDATE freezes SET status = 'completed' WHERE id = ?").run(freeze.id);
    db.prepare("UPDATE members SET status = 'active', updated_at = datetime('now') WHERE id = ?").run(freeze.member_id);

    const pkg = db.prepare('SELECT * FROM member_packages WHERE id = ?').get(freeze.member_package_id) as MemberPackage | undefined;
    if (pkg && pkg.status === 'frozen') {
      const today = new Date();
      const expiry = new Date(pkg.expiry_date);
      const newStatus = expiry <= today ? 'expired' : 'active';
      db.prepare("UPDATE member_packages SET status = ? WHERE id = ?").run(newStatus, freeze.member_package_id);
    }

    const memberUser = db.prepare('SELECT id FROM users WHERE member_id = ?').get(freeze.member_id) as { id: number } | undefined;
    if (memberUser) {
      await enqueueNotification({
        type: 'in_app',
        userId: memberUser.id,
        title: '冻结已结束',
        content: '您的套餐冻结已结束,可以继续预约课程',
        messageType: 'notification',
        relatedEntityType: 'freeze',
        relatedEntityId: freeze.id,
      });
    }

    db.prepare(`
      INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value)
      VALUES (NULL, 'member', ?, 'auto_unfreeze', 'frozen', 'active')
    `).run(freeze.member_id);

    count++;
  }

  return count;
}
