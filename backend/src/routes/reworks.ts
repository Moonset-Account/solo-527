import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, count, or, isNull } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { getCurrentUser, requireAdmin, requireRole } from '../middleware/auth';
import { ok, fail, getPageParams, createTimelineEvent, createActionLog } from '../utils';

const app = new Hono();

app.get('/', async (c) => {
  const query = c.req.query();
  const { page, pageSize, offset } = getPageParams(query);
  const workOrderId = query.workOrderId ? parseInt(query.workOrderId) : undefined;
  const processId = query.processId ? parseInt(query.processId) : undefined;
  const isTimeout = query.isTimeout;
  const unresolved = query.unresolved === 'true';

  const conditions = [];
  if (workOrderId) conditions.push(eq(schema.reworkRecords.workOrderId, workOrderId));
  if (processId) conditions.push(eq(schema.reworkRecords.processId, processId));
  if (isTimeout === 'true') conditions.push(eq(schema.reworkRecords.isTimeout, true));
  if (isTimeout === 'false') conditions.push(eq(schema.reworkRecords.isTimeout, false));
  if (unresolved) conditions.push(isNull(schema.reworkRecords.resolvedAt));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [records, totalResult] = await Promise.all([
    db.query.reworkRecords.findMany({
      where: whereClause,
      with: {
        workOrder: { columns: { id: true, orderNo: true, productName: true } },
        process: { columns: { id: true, processName: true, sequence: true, status: true } },
        reportedByUser: { columns: { id: true, realName: true } },
        assignedToUser: { columns: { id: true, realName: true } },
        resolvedByUser: { columns: { id: true, realName: true } },
        timeoutApprovedByUser: { columns: { id: true, realName: true } },
      },
      orderBy: desc(schema.reworkRecords.createdAt),
      limit: pageSize,
      offset,
    }),
    db.select({ count: count() }).from(schema.reworkRecords).where(whereClause),
  ]);

  const enriched = records.map((r) => {
    const now = new Date();
    const isOverdue = r.deadlineAt && now > r.deadlineAt && !r.resolvedAt;
    const hoursLeft = r.deadlineAt && !r.resolvedAt
      ? Math.max(0, Math.round((r.deadlineAt.getTime() - now.getTime()) / 3600000))
      : null;
    return { ...r, isOverdue, hoursLeft };
  });

  return ok(c, enriched, { total: totalResult[0].count, page, pageSize });
});

app.get('/timeout-risk', async (c) => {
  const now = new Date();
  const warningWindow = 4 * 3600000;
  const riskRecords = await db.query.reworkRecords.findMany({
    where: and(isNull(schema.reworkRecords.resolvedAt)),
    with: {
      workOrder: { columns: { id: true, orderNo: true, productName: true } },
      process: { columns: { id: true, processName: true, sequence: true } },
      assignedToUser: { columns: { id: true, realName: true } },
    },
    orderBy: desc(schema.reworkRecords.deadlineAt),
  });

  const result = riskRecords
    .map((r) => {
      if (!r.deadlineAt) return null;
      const diff = r.deadlineAt.getTime() - now.getTime();
      let riskLevel: 'safe' | 'warning' | 'critical' = 'safe';
      if (diff < 0) riskLevel = r.isTimeout ? 'critical' : 'critical';
      else if (diff < warningWindow) riskLevel = 'warning';
      return {
        ...r,
        riskLevel,
        remainingHours: Math.round(diff / 3600000),
      };
    })
    .filter(Boolean) as any[];

  return ok(c, {
    warning: result.filter((r) => r.riskLevel === 'warning'),
    critical: result.filter((r) => r.riskLevel === 'critical'),
    all: result,
    summary: {
      totalUnresolved: riskRecords.length,
      warningCount: result.filter((r) => r.riskLevel === 'warning').length,
      criticalCount: result.filter((r) => r.riskLevel === 'critical').length,
      needTimeoutApproval: result.filter((r) => r.riskLevel === 'critical' && !r.isTimeout).length,
    },
  });
});

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      processId: z.number().int(),
      workOrderId: z.number().int(),
      reworkReason: z.string().min(1),
      reworkType: z.string().optional(),
      assignedTo: z.number().int().optional(),
      deadlineHours: z.number().int().default(24),
    })
  ),
  async (c) => {
    const payload = c.req.valid('json');
    const currentUser = getCurrentUser(c);

    const process = await db.query.processes.findFirst({ where: eq(schema.processes.id, payload.processId) });
    if (!process) return fail(c, '工序不存在', 404);

    const newReworkCount = process.reworkCount + 1;
    const now = new Date();
    const deadlineAt = new Date(now.getTime() + payload.deadlineHours * 3600000);

    const [rework] = await db
      .insert(schema.reworkRecords)
      .values({
        processId: payload.processId,
        workOrderId: payload.workOrderId,
        reworkReason: payload.reworkReason,
        reworkType: payload.reworkType,
        reworkCount: newReworkCount,
        reportedBy: currentUser.sub,
        assignedTo: payload.assignedTo,
        deadlineAt,
      })
      .returning();

    await db
      .update(schema.processes)
      .set({
        status: 'rework',
        reworkCount: newReworkCount,
        reworkTimeoutAt: deadlineAt,
        updatedAt: now,
      })
      .where(eq(schema.processes.id, payload.processId));

    await createTimelineEvent({
      workOrderId: payload.workOrderId,
      processId: payload.processId,
      reworkRecordId: rework.id,
      eventType: 'process_rework',
      title: `返工记录 #${newReworkCount}：${process.processName}`,
      description: payload.reworkReason,
      metadata: { reworkType: payload.reworkType, deadlineHours: payload.deadlineHours, deadlineAt: deadlineAt.toISOString() },
      user: currentUser,
      eventAt: now,
    });

    return ok(c, rework);
  }
);

app.post(
  '/:id/approve-timeout',
  requireRole('admin', 'equipment_supervisor'),
  zValidator(
    'json',
    z.object({
      timeoutApprovalNote: z.string().min(1, '请填写超时审批备注'),
    })
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const payload = c.req.valid('json');
    const currentUser = getCurrentUser(c);
    const now = new Date();

    const existing = await db.query.reworkRecords.findFirst({
      where: eq(schema.reworkRecords.id, id),
      with: { process: true, workOrder: true },
    });
    if (!existing) return fail(c, '返工记录不存在', 404);
    if (existing.resolvedAt) return fail(c, '该返工已完成，无需超时审批');

    await db
      .update(schema.reworkRecords)
      .set({
        isTimeout: true,
        timeoutApprovedBy: currentUser.sub,
        timeoutApprovedAt: now,
        timeoutApprovalNote: payload.timeoutApprovalNote,
      })
      .where(eq(schema.reworkRecords.id, id));

    await createTimelineEvent({
      workOrderId: existing.workOrderId,
      processId: existing.processId,
      reworkRecordId: id,
      eventType: 'rework_timeout',
      title: `返工超时已批准：${existing.process.processName}`,
      description: `超时原因：${payload.timeoutApprovalNote}`,
      metadata: { originalDeadline: existing.deadlineAt },
      user: currentUser,
      eventAt: now,
    });

    await createActionLog({
      logType: 'rework_timeout_approval',
      title: `返工超时审批 - 工单 ${existing.workOrder.orderNo}`,
      detail: `工序：${existing.process.processName}，返工次数：${existing.reworkCount}，审批意见：${payload.timeoutApprovalNote}`,
      relatedWorkOrderId: existing.workOrderId,
      relatedProcessId: existing.processId,
      relatedReworkId: id,
      user: currentUser,
      metadata: { originalDeadline: existing.deadlineAt, reworkReason: existing.reworkReason },
    });

    const updated = await db.query.reworkRecords.findFirst({ where: eq(schema.reworkRecords.id, id) });
    return ok(c, updated);
  }
);

app.post(
  '/:id/resolve',
  zValidator(
    'json',
    z.object({
      resolutionNote: z.string().min(1, '请填写解决说明'),
    })
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const payload = c.req.valid('json');
    const currentUser = getCurrentUser(c);
    const now = new Date();

    const existing = await db.query.reworkRecords.findFirst({
      where: eq(schema.reworkRecords.id, id),
      with: { process: true, workOrder: true },
    });
    if (!existing) return fail(c, '返工记录不存在', 404);
    if (existing.resolvedAt) return fail(c, '该返工已处理完成');

    const autoTimeout = existing.deadlineAt && now > existing.deadlineAt && !existing.isTimeout;
    const updateData: Record<string, unknown> = {
      resolvedAt: now,
      resolvedBy: currentUser.sub,
      resolutionNote: payload.resolutionNote,
    };
    if (autoTimeout) {
      updateData.isTimeout = true;
    }

    await db.update(schema.reworkRecords).set(updateData).where(eq(schema.reworkRecords.id, id));

    if (autoTimeout) {
      await createActionLog({
        logType: 'rework_timeout_warning',
        title: `返工超时自动标记 - 工单 ${existing.workOrder.orderNo}`,
        detail: `工序：${existing.process.processName}，解决时已超时，说明：${payload.resolutionNote}`,
        relatedWorkOrderId: existing.workOrderId,
        relatedProcessId: existing.processId,
        relatedReworkId: id,
        user: currentUser,
      });
    }

    const updated = await db.query.reworkRecords.findFirst({ where: eq(schema.reworkRecords.id, id) });
    return ok(c, updated);
  }
);

export default app;
