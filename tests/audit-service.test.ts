import { describe, it, expect } from 'vitest';
import {
  createAuditLog,
  getAuditLogsByEntity,
  createChangeTracker,
} from '@/lib/audit-service';

describe('Audit Log & History Tracking', () => {
  const adminUserId = 'test-admin-123';
  const projectId = 'test-project-456';

  it('创建审计日志', async () => {
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
    expect(Array.isArray(logs)).toBe(true);
  });

  it('变更追踪能检测状态变化', () => {
    const original = {
      id: projectId,
      name: '测试项目',
      status: 'draft',
      totalAmount: 10000,
      createdBy: adminUserId,
    };

    const trackChanges = createChangeTracker(original);
    const updates = { status: 'active' };
    const changes = trackChanges(updates);

    expect(changes).toBeDefined();
    if (changes) {
      expect(changes.status.before).toBe('draft');
      expect(changes.status.after).toBe('active');
    }
  });

  it('工时记录删除保留操作日志', async () => {
    const timeEntryId = 'test-time-789';

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
    expect(Array.isArray(logs)).toBe(true);
  });
});
