import bcrypt from 'bcryptjs';
import {
  db,
  uuidv4,
  mapUser,
  mapMaskingRule,
  mapMilestone,
  DbUserRow,
  DbMaskingRuleRow,
  DbMilestoneRow,
} from '../db/database.js';
import type { User, Role, MaskingRule, Milestone } from '#shared/types';

export interface CreateUserInput {
  email: string;
  name: string;
  role: Role;
  password?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
}

export class AdminService {
  listUsers(params?: { role?: Role; search?: string }): User[] {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const bind: unknown[] = [];

    if (params?.role) {
      sql += ' AND role = ?';
      bind.push(params.role);
    }
    if (params?.search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      const pattern = `%${params.search}%`;
      bind.push(pattern, pattern);
    }

    sql += ' ORDER BY created_at';
    const rows = db.prepare(sql).all(...bind) as DbUserRow[];
    return rows.map(mapUser);
  }

  getUser(id: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUserRow | undefined;
    return row ? mapUser(row) : null;
  }

  getUserByEmail(email: string): (User & { passwordHash: string }) | null {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUserRow | undefined;
    if (!row) return null;
    return {
      ...mapUser(row),
      passwordHash: row.password_hash,
    };
  }

  createUser(input: CreateUserInput): User {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(input.email) as { id: string } | undefined;
    if (existing) throw new Error('邮箱已被占用');

    const id = input.email ? undefined : uuidv4();
    const passwordHash = bcrypt.hashSync(input.password || '123456', 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, name, role, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id || uuidv4(), input.email, input.name, input.role, passwordHash, now);

    return this.getUserByEmail(input.email) as unknown as User;
  }

  updateUser(id: string, input: UpdateUserInput): User | null {
    const existing = this.getUser(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.email !== undefined) {
      updates.push('email = ?');
      values.push(input.email);
    }
    if (input.role !== undefined) {
      updates.push('role = ?');
      values.push(input.role);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getUser(id);
  }

  setRole(userId: string, role: Role): User | null {
    return this.updateUser(userId, { role });
  }

  deleteUser(id: string): boolean {
    if (id === 'user_admin') return false;
    const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return res.changes > 0;
  }

  listMaskingRules(): MaskingRule[] {
    const rows = db.prepare('SELECT * FROM masking_rules ORDER BY id').all() as DbMaskingRuleRow[];
    return rows.map(mapMaskingRule);
  }

  createMaskingRule(input: Omit<MaskingRule, 'id'>): MaskingRule {
    const id = `rule_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO masking_rules (id, name, type, pattern, replacement, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.name,
      input.type,
      input.pattern,
      input.replacement,
      input.enabled ? 1 : 0,
    );
    const row = db.prepare('SELECT * FROM masking_rules WHERE id = ?').get(id) as DbMaskingRuleRow;
    return mapMaskingRule(row);
  }

  updateMaskingRule(id: string, input: Partial<Omit<MaskingRule, 'id'>>): MaskingRule | null {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fields: Array<[keyof Omit<MaskingRule, 'id'>, (v: unknown) => unknown]> = [
      ['name', (v) => v],
      ['type', (v) => v],
      ['pattern', (v) => v],
      ['replacement', (v) => v],
      ['enabled', (v) => (v ? 1 : 0)],
    ];

    for (const [key, convert] of fields) {
      if (key in input) {
        updates.push(`${key === 'enabled' ? 'enabled' : key} = ?`);
        values.push(convert((input as unknown as Record<string, unknown>)[key]));
      }
    }

    if (updates.length === 0) {
      const row = db.prepare('SELECT * FROM masking_rules WHERE id = ?').get(id) as DbMaskingRuleRow | undefined;
      return row ? mapMaskingRule(row) : null;
    }

    values.push(id);
    db.prepare(`UPDATE masking_rules SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const row = db.prepare('SELECT * FROM masking_rules WHERE id = ?').get(id) as DbMaskingRuleRow | undefined;
    return row ? mapMaskingRule(row) : null;
  }

  deleteMaskingRule(id: string): boolean {
    const res = db.prepare('DELETE FROM masking_rules WHERE id = ?').run(id);
    return res.changes > 0;
  }

  listMilestones(projectId?: string): Milestone[] {
    let sql = 'SELECT * FROM milestones';
    const bind: unknown[] = [];
    if (projectId) {
      sql += ' WHERE project_id = ?';
      bind.push(projectId);
    }
    sql += ' ORDER BY created_at';
    const rows = db.prepare(sql).all(...bind) as DbMilestoneRow[];
    return rows.map(mapMilestone);
  }

  createMilestone(input: Omit<Milestone, 'id' | 'actionItemIds' | 'createdAt'> & { actionItemIds?: string[] }): Milestone {
    const id = `ms_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO milestones (id, project_id, title, description, due_date, status, action_item_ids_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.projectId,
      input.title,
      input.description ?? '',
      input.dueDate ?? null,
      input.status ?? 'planned',
      JSON.stringify(input.actionItemIds ?? []),
      now,
    );
    return this.listMilestones().find((m) => m.id === id)!;
  }

  updateMilestone(id: string, input: Partial<Omit<Milestone, 'id' | 'createdAt'>>): Milestone | null {
    const updates: string[] = [];
    const values: unknown[] = [];
    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(input.dueDate);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }
    if (input.actionItemIds !== undefined) {
      updates.push('action_item_ids_json = ?');
      values.push(JSON.stringify(input.actionItemIds));
    }
    if (updates.length === 0) {
      const row = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id) as DbMilestoneRow | undefined;
      return row ? mapMilestone(row) : null;
    }
    values.push(id);
    db.prepare(`UPDATE milestones SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const row = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id) as DbMilestoneRow | undefined;
    return row ? mapMilestone(row) : null;
  }

  deleteMilestone(id: string): boolean {
    const res = db.prepare('DELETE FROM milestones WHERE id = ?').run(id);
    return res.changes > 0;
  }
}

export default new AdminService();
