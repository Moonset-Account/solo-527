import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { getCurrentUser } from '../middleware/auth';
import { ok, fail, createTimelineEvent } from '../utils';

const app = new Hono();

app.get('/', async (c) => {
  const workOrderId = c.req.query('workOrderId');
  const status = c.req.query('status');

  const conditions = [];
  if (workOrderId) conditions.push(eq(schema.processes.workOrderId, parseInt(workOrderId)));
  if (status) conditions.push(eq(schema.processes.status, status as any));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const processes = await db.query.processes.findMany({
    where: whereClause,
    with: {
      workOrder: { columns: { id: true, orderNo: true, productName: true } },
      assignedUser: { columns: { id: true, realName: true } },
      reworkRecords: {
        with: {
          reportedByUser: { columns: { id: true, realName: true } },
        },
        orderBy: desc(schema.reworkRecords.createdAt),
      },
    },
    orderBy: [asc(schema.processes.workOrderId), asc(schema.processes.sequence)],
  });

  return ok(c, processes);
});

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const process = await db.query.processes.findFirst({
    where: eq(schema.processes.id, id),
    with: {
      workOrder: true,
      assignedUser: { columns: { id: true, realName: true, username: true } },
      reworkRecords: {
        with: {
          reportedByUser: { columns: { id: true, realName: true } },
          assignedToUser: { columns: { id: true, realName: true } },
          resolvedByUser: { columns: { id: true, realName: true } },
        },
        orderBy: desc(schema.reworkRecords.createdAt),
      },
    },
  });
  if (!process) return fail(c, '工序不存在', 404);
  return ok(c, process);
});

app.post(
  '/:id/start',
  zValidator(
    'json',
    z.object({
      remark: z.string().optional(),
    })
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const payload = c.req.valid('json');
    const currentUser = getCurrentUser(c);

    const existing = await db.query.processes.findFirst({
      where: eq(schema.processes.id, id),
      with: { workOrder: true },
    });
    if (!existing) return fail(c, '工序不存在', 404);
    if (existing.status !== 'pending' && existing.status !== 'rework') {
      return fail(c, '只有待开始或返工状态的工序才能开工');
    }

    const now = new Date();
    const actualStartAt = existing.actualStartAt || now;
    await db
      .update(schema.processes)
      .set({
        status: 'in_progress',
        actualStartAt,
        assignedTo: existing.assignedTo || currentUser.sub,
        updatedAt: now,
      })
      .where(eq(schema.processes.id, id));

    if (!existing.workOrder.actualStartDate && existing.workOrder.status !== 'in_progress') {
      await db
        .update(schema.workOrders)
        .set({ status: 'in_progress', actualStartDate: now, updatedAt: now })
        .where(eq(schema.workOrders.id, existing.workOrderId));
    }

    await createTimelineEvent({
      workOrderId: existing.workOrderId,
      processId: id,
      eventType: 'process_started',
      title: `工序开始：${existing.processName}`,
      description: payload.remark || `工序 ${existing.processName} 开工`,
      metadata: { sequence: existing.sequence, equipment: existing.equipment },
      user: currentUser,
      eventAt: now,
    });

    const updated = await db.query.processes.findFirst({ where: eq(schema.processes.id, id) });
    return ok(c, updated);
  }
);

app.post(
  '/:id/complete',
  zValidator(
    'json',
    z.object({
      remark: z.string().optional(),
      actualDurationHours: z.string().optional(),
    })
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const payload = c.req.valid('json');
    const currentUser = getCurrentUser(c);

    const existing = await db.query.processes.findFirst({
      where: eq(schema.processes.id, id),
      with: { workOrder: true },
    });
    if (!existing) return fail(c, '工序不存在', 404);
    if (existing.status !== 'in_progress') {
      return fail(c, '只有生产中的工序才能完成');
    }

    const now = new Date();
    const actualStart = existing.actualStartAt || now;
    const duration = payload.actualDurationHours || (
      ((now.getTime() - actualStart.getTime()) / 3600000).toFixed(2)
    );

    await db
      .update(schema.processes)
      .set({
        status: 'completed',
        actualEndAt: now,
        actualDurationHours: duration,
        updatedAt: now,
      })
      .where(eq(schema.processes.id, id));

    const otherProcesses = await db.query.processes.findMany({
      where: eq(schema.processes.workOrderId, existing.workOrderId),
    });
    const allCompleted = otherProcesses.every((p) => p.id === id || p.status === 'completed');
    if (allCompleted && existing.workOrder.status !== 'completed') {
      await db
        .update(schema.workOrders)
        .set({ status: 'completed', actualEndDate: now, updatedAt: now })
        .where(eq(schema.workOrders.id, existing.workOrderId));
    }

    await createTimelineEvent({
      workOrderId: existing.workOrderId,
      processId: id,
      eventType: 'process_completed',
      title: `工序完成：${existing.processName}`,
      description: payload.remark || `工序 ${existing.processName} 完成，用时 ${duration} 小时`,
      metadata: { sequence: existing.sequence, duration, equipment: existing.equipment },
      user: currentUser,
      eventAt: now,
    });

    const updated = await db.query.processes.findFirst({ where: eq(schema.processes.id, id) });
    return ok(c, updated);
  }
);

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      workOrderId: z.number().int(),
      processName: z.string().min(1),
      processCode: z.string().optional(),
      sequence: z.number().int().default(1),
      plannedDurationHours: z.string().optional(),
      equipment: z.string().optional(),
      assignedTo: z.number().int().optional(),
      plannedStartAt: z.string().optional(),
      plannedEndAt: z.string().optional(),
      maxReworkLimit: z.number().int().default(2),
      remark: z.string().optional(),
    })
  ),
  async (c) => {
    const payload = c.req.valid('json');
    const [inserted] = await db
      .insert(schema.processes)
      .values({
        workOrderId: payload.workOrderId,
        processName: payload.processName,
        processCode: payload.processCode,
        sequence: payload.sequence,
        plannedDurationHours: payload.plannedDurationHours,
        equipment: payload.equipment,
        assignedTo: payload.assignedTo,
        plannedStartAt: payload.plannedStartAt ? new Date(payload.plannedStartAt) : undefined,
        plannedEndAt: payload.plannedEndAt ? new Date(payload.plannedEndAt) : undefined,
        maxReworkLimit: payload.maxReworkLimit,
        remark: payload.remark,
      })
      .returning();
    return ok(c, inserted);
  }
);

app.put(
  '/:id',
  zValidator(
    'json',
    z.object({
      processName: z.string().optional(),
      sequence: z.number().int().optional(),
      status: z.enum(schema.processStatusEnum.enumValues).optional(),
      equipment: z.string().optional(),
      assignedTo: z.number().int().nullable().optional(),
      remark: z.string().optional(),
    })
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const payload = c.req.valid('json');
    const existing = await db.query.processes.findFirst({ where: eq(schema.processes.id, id) });
    if (!existing) return fail(c, '工序不存在', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.processName !== undefined) updateData.processName = payload.processName;
    if (payload.sequence !== undefined) updateData.sequence = payload.sequence;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.equipment !== undefined) updateData.equipment = payload.equipment;
    if (payload.assignedTo !== undefined) updateData.assignedTo = payload.assignedTo;
    if (payload.remark !== undefined) updateData.remark = payload.remark;

    await db.update(schema.processes).set(updateData).where(eq(schema.processes.id, id));
    const updated = await db.query.processes.findFirst({ where: eq(schema.processes.id, id) });
    return ok(c, updated);
  }
);

export default app;
