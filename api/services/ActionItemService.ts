import {
  db,
  uuidv4,
  mapActionItem,
  mapVersionHistory,
  DbActionItemRow,
  DbVersionHistoryRow,
  DbUserRow,
  mapUser,
} from '../db/database.js';
import type {
  ActionItem,
  ActionItemStatus,
  VersionHistory,
  User,
} from '#shared/types';

type PatchableFields = Partial<Pick<
  ActionItem,
  | 'content'
  | 'assignee'
  | 'assigneeStatus'
  | 'dueDate'
  | 'topic'
  | 'milestoneId'
  | 'priority'
  | 'status'
  | 'remarks'
>>;

const TRACKED_FIELDS: Array<keyof PatchableFields> = [
  'content',
  'assignee',
  'assigneeStatus',
  'dueDate',
  'topic',
  'milestoneId',
  'priority',
  'status',
  'remarks',
];

const DB_FIELD_MAP: Record<string, string> = {
  content: 'content',
  assignee: 'assignee',
  assigneeStatus: 'assignee_status',
  dueDate: 'due_date',
  topic: 'topic',
  milestoneId: 'milestone_id',
  priority: 'priority',
  status: 'status',
  remarks: 'remarks',
};

export class ActionItemService {
  list(params?: {
    meetingId?: string;
    status?: ActionItemStatus;
    assignee?: string;
    milestoneId?: string;
  }): ActionItem[] {
    let sql = 'SELECT * FROM action_items WHERE 1=1';
    const bind: unknown[] = [];

    if (params?.meetingId) {
      sql += ' AND meeting_id = ?';
      bind.push(params.meetingId);
    }
    if (params?.status) {
      sql += ' AND status = ?';
      bind.push(params.status);
    }
    if (params?.assignee) {
      sql += ' AND assignee = ?';
      bind.push(params.assignee);
    }
    if (params?.milestoneId) {
      sql += ' AND milestone_id = ?';
      bind.push(params.milestoneId);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...bind) as DbActionItemRow[];
    return rows.map(mapActionItem);
  }

  getById(id: string): ActionItem | null {
    const row = db.prepare('SELECT * FROM action_items WHERE id = ?').get(id) as DbActionItemRow | undefined;
    return row ? mapActionItem(row) : null;
  }

  patch(id: string, patch: PatchableFields, operator: User, remark?: string): ActionItem | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const diff: Record<string, { old: unknown; new: unknown }> = {};
    const snapshot: Partial<ActionItem> = {};

    for (const field of TRACKED_FIELDS) {
      if (!(field in patch)) continue;
      const oldVal = (existing as unknown as Record<string, unknown>)[field];
      const newVal = (patch as unknown as Record<string, unknown>)[field];
      if (oldVal !== newVal) {
        diff[field] = { old: oldVal, new: newVal };
        (snapshot as unknown as Record<string, unknown>)[field] = oldVal;
      }
    }

    if (Object.keys(diff).length === 0) return existing;

    const newVersion = existing.version + 1;
    const now = new Date().toISOString();

    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const key of Object.keys(patch)) {
      const dbField = DB_FIELD_MAP[key];
      if (!dbField) continue;
      setClauses.push(`${dbField} = ?`);
      values.push((patch as unknown as Record<string, unknown>)[key]);
    }
    setClauses.push('version = ?');
    values.push(newVersion);
    setClauses.push('updated_at = ?');
    values.push(now);
    setClauses.push('updated_by = ?');
    values.push(operator.id);

    values.push(id);

    const insertHistory = db.prepare(`
      INSERT INTO version_history
        (id, action_item_id, version, snapshot_json, diff_json, operator_id, operator_name, remark, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      db.prepare(`UPDATE action_items SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
      insertHistory.run(
        uuidv4(),
        id,
        newVersion,
        JSON.stringify(snapshot),
        JSON.stringify(diff),
        operator.id,
        operator.name,
        remark ?? null,
        now,
      );
    });

    tx();
    return this.getById(id);
  }

  batchConfirm(ids: string[], operator: User): ActionItem[] {
    const now = new Date().toISOString();
    const results: ActionItem[] = [];

    const tx = db.transaction(() => {
      for (const id of ids) {
        const existing = this.getById(id);
        if (!existing) continue;
        if (existing.status === 'confirmed' || existing.status === 'assigned') continue;

        const newStatus: ActionItemStatus = existing.assignee ? 'assigned' : 'confirmed';
        const patched = this.patch(
          id,
          { status: newStatus, assigneeStatus: existing.assignee ? 'confirmed' : existing.assigneeStatus },
          operator,
          '批量确认',
        );
        if (patched) results.push(patched);
      }
    });

    tx();
    return results;
  }

  batchAssign(ids: string[], assignee: string, operator: User): ActionItem[] {
    const results: ActionItem[] = [];
    const tx = db.transaction(() => {
      for (const id of ids) {
        const existing = this.getById(id);
        if (!existing) continue;
        const currentStatus: ActionItemStatus = existing.status === 'draft'
          ? 'assigned'
          : existing.status === 'confirmed'
            ? 'assigned'
            : existing.status;
        const patched = this.patch(
          id,
          {
            assignee,
            assigneeStatus: 'confirmed',
            status: currentStatus,
          },
          operator,
          `批量分配负责人: ${assignee}`,
        );
        if (patched) results.push(patched);
      }
    });

    tx();
    return results;
  }

  getHistory(id: string): VersionHistory[] {
    const rows = db
      .prepare('SELECT * FROM version_history WHERE action_item_id = ? ORDER BY version DESC')
      .all(id) as DbVersionHistoryRow[];
    return rows.map(mapVersionHistory);
  }

  rollback(id: string, targetVersion: number, operator: User): ActionItem | null {
    const histories = this.getHistory(id);
    if (histories.length === 0) return null;

    const target = histories.find((h) => h.version === targetVersion);
    const existing = this.getById(id);
    if (!target || !existing) return null;

    const restorePatch: PatchableFields = {};
    for (const field of TRACKED_FIELDS) {
      if (field in target.snapshot) {
        (restorePatch as unknown as Record<string, unknown>)[field] = (target.snapshot as unknown as Record<string, unknown>)[field];
      }
    }

    return this.patch(id, restorePatch, operator, `回滚到版本 v${targetVersion}`);
  }

  getOperator(id: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUserRow | undefined;
    return row ? mapUser(row) : null;
  }
}

export default new ActionItemService();
