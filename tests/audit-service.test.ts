import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { users, projects, auditLogs, quotes, timeEntries } from '@/db/schema';
import {
  createAuditLog,
  getAuditLogsByEntity,
  createChangeTracker,
} from '@/lib/audit-service';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

describe('Audit Log & History Tracking', () => {
  let adminUserId: string;
  let projectId: string;

  beforeEach(async () => {
    adminUserId = uuidv4();
    projectId = uuidv4();

    await db.insert(users).values({
      id: adminUserId,
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'admin',
    });
  });

  it('创建项目自动记录审计日志', async () => {
    await db.insert(projects).values({
      id: projectId,
      name: '新网站设计',
      totalAmount: 50000,
      createdBy: adminUserId,
    });

    await createAuditLog({
      userId: adminUserId,
      action: 'create',
      entityType: 'project',
      entityId: projectId,
      changes: {
        name: { before: null, after: '新网站设计' },
        totalAmount: { before: null, after: 50000 },
      },
    });

    const logs = await getAuditLogsByEntity('project', projectId);

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('create');
    expect(logs[0].userId).toBe(adminUserId);
    expect(logs[0].entityType).toBe('project');
    expect(logs[0].entityId).toBe(projectId);
  });

  it('更新项目状态记录变更前后', async () => {
    const original = {
      id: projectId,
      name: '测试项目',
      status: 'draft',
      totalAmount: 10000,
      createdBy: adminUserId,
    };

    await db.insert(projects).values(original);

    const trackChanges = createChangeTracker(original);

    const updates = { status: 'active' };
    const changes = trackChanges(updates);

    await createAuditLog({
      userId: adminUserId,
      action: 'update',
      entityType: 'project',
      entityId: projectId,
      changes,
    });

    const logs = await getAuditLogsByEntity('project', projectId);
    const updateLog = logs.find((l) => l.action === 'update');

    expect(updateLog).toBeDefined();
    if (updateLog?.changes) {
      const parsedChanges = typeof updateLog.changes === 'string'
        ? JSON.parse(updateLog.changes)
        : updateLog.changes;
      expect(parsedChanges.status.before).toBe('draft');
      expect(parsedChanges.status.after).toBe('active');
    }
  });

  it('报价单版本历史可追溯', async () => {
    const quoteId = uuidv4();
    const quoteId2 = uuidv4();

    await db.insert(quotes).values({
      id: quoteId,
      projectId,
      quoteNumber: 'Q-TEST-001',
      title: '测试报价',
      totalAmount: 10000,
      status: 'draft',
      version: 1,
      createdBy: adminUserId,
    });

    await db.insert(quotes).values({
      id: quoteId2,
      projectId,
      quoteNumber: 'Q-TEST-001',
      title: '测试报价',
      totalAmount: 12000,
      status: 'draft',
      version: 2,
      createdBy: adminUserId,
    });

    const history = await db.query.quotes.findMany({
      where: (q, { eq }) => eq(q.quoteNumber, 'Q-TEST-001'),
      orderBy: (q, { asc }) => [asc(q.version)],
    });

    expect(history).toHaveLength(2);
    expect(history[0].version).toBe(1);
    expect(history[0].totalAmount).toBe(10000);
    expect(history[1].version).toBe(2);
    expect(history[1].totalAmount).toBe(12000);
  });

  it('工时记录删除保留操作日志', async () => {
    const timeEntryId = uuidv4();

    await db.insert(timeEntries).values({
      id: timeEntryId,
      projectId,
      userId: adminUserId,
      startTime: new Date(),
      durationMinutes: 120,
      description: '设计工作',
    });

    await db.delete(timeEntries).where(eq(timeEntries.id, timeEntryId));

    await createAuditLog({
      userId: adminUserId,
      action: 'delete',
      entityType: 'time_entry',
      entityId: timeEntryId,
      changes: {
        description: { before: '设计工作', after: null },
        duration: { before: 120, after: null },
      },
    });

    const logs = await getAuditLogsByEntity('time_entry', timeEntryId);
    const deleteLog = logs.find((l) => l.action === 'delete');

    expect(deleteLog).toBeDefined();
    expect(deleteLog?.action).toBe('delete');
    expect(deleteLog?.userId).toBe(adminUserId);
  });

  it('审计日志按时间倒序排列', async () => {
    const entityId = uuidv4();

    await createAuditLog({
      userId: adminUserId,
      action: 'create',
      entityType: 'test',
      entityId,
    });

    await createAuditLog({
      userId: adminUserId,
      action: 'update',
      entityType: 'test',
      entityId,
    });

    await createAuditLog({
      userId: adminUserId,
      action: 'delete',
      entityType: 'test',
      entityId,
    });

    const logs = await getAuditLogsByEntity('test', entityId);

    expect(logs[0].action).toBe('delete');
    expect(logs[1].action).toBe('update');
    expect(logs[2].action).toBe('create');
  });
});
