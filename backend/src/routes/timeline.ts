import { Hono } from 'hono';
import { eq, and, desc, asc, inArray, gte, lte, or, isNull } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { ok, fail, getPageParams } from '../utils';

const app = new Hono();

app.get('/work-order/:workOrderId', async (c) => {
  const workOrderId = parseInt(c.req.param('workOrderId'));
  const query = c.req.query();
  const { page, pageSize, offset } = getPageParams(query);
  const eventType = query.eventType as typeof schema.timelineEventTypeEnum.enumValues[number] | undefined;
  const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
  const dateTo = query.dateTo ? new Date(query.dateTo + ' 23:59:59') : undefined;

  const conditions = [eq(schema.timelineEvents.workOrderId, workOrderId)];
  if (eventType) conditions.push(eq(schema.timelineEvents.eventType, eventType));
  if (dateFrom) conditions.push(gte(schema.timelineEvents.eventAt, dateFrom));
  if (dateTo) conditions.push(lte(schema.timelineEvents.eventAt, dateTo));

  const events = await db.query.timelineEvents.findMany({
    where: and(...conditions),
    with: {
      process: { columns: { id: true, processName: true, sequence: true } },
      reworkRecord: { columns: { id: true, reworkReason: true, reworkCount: true } },
      triggeredByUser: { columns: { id: true, realName: true, role: true, username: true } },
    },
    orderBy: [asc(schema.timelineEvents.eventAt), desc(schema.timelineEvents.createdAt)],
    limit: pageSize,
    offset,
  });

  const enriched = events.map((ev) => ({
    ...ev,
    icon: getEventIcon(ev.eventType),
    color: getEventColor(ev.eventType),
    category: getEventCategory(ev.eventType),
  }));

  return ok(c, enriched);
});

app.get('/work-order/:workOrderId/timeline-groups', async (c) => {
  const workOrderId = parseInt(c.req.param('workOrderId'));

  const [workOrder, processes, events, reworks] = await Promise.all([
    db.query.workOrders.findFirst({
      where: eq(schema.workOrders.id, workOrderId),
      with: { createdByUser: { columns: { id: true, realName: true, username: true } } },
    }),
    db.query.processes.findMany({
      where: eq(schema.processes.workOrderId, workOrderId),
      with: {
        assignedUser: { columns: { id: true, realName: true } },
        reworkRecords: {
          with: {
            reportedByUser: { columns: { id: true, realName: true } },
            resolvedByUser: { columns: { id: true, realName: true } },
            timeoutApprovedByUser: { columns: { id: true, realName: true } },
          },
          orderBy: asc(schema.reworkRecords.createdAt),
        },
      },
      orderBy: asc(schema.processes.sequence),
    }),
    db.query.timelineEvents.findMany({
      where: eq(schema.timelineEvents.workOrderId, workOrderId),
      orderBy: asc(schema.timelineEvents.eventAt),
    }),
    db.query.reworkRecords.findMany({
      where: eq(schema.reworkRecords.workOrderId, workOrderId),
      with: {
        process: { columns: { id: true, processName: true, sequence: true } },
        reportedByUser: { columns: { id: true, realName: true } },
        assignedToUser: { columns: { id: true, realName: true } },
        resolvedByUser: { columns: { id: true, realName: true } },
      },
      orderBy: desc(schema.reworkRecords.createdAt),
    }),
  ]);

  if (!workOrder) return fail(c, '工单不存在', 404);

  const timelineItems: Array<{
    id: string;
    time: Date;
    type: string;
    category: '工单' | '工序' | '返工' | '物料' | '系统';
    title: string;
    description?: string;
    operatorName?: string;
    operatorRole?: string;
    relatedId?: number;
    metadata?: Record<string, unknown>;
    status?: string;
    sequence?: number;
  }> = [];

  timelineItems.push({
    id: `wo-created-${workOrder.id}`,
    time: workOrder.createdAt,
    type: 'work_order_created',
    category: '工单',
    title: `工单创建：${workOrder.orderNo}`,
    description: `产品：${workOrder.productName}，数量：${workOrder.quantity}${workOrder.unit}${workOrder.customer ? `，客户：${workOrder.customer}` : ''}`,
    operatorName: workOrder.createdByUser?.realName,
    operatorRole: workOrder.createdByUser?.role,
    relatedId: workOrder.id,
    status: workOrder.status,
  });

  for (const proc of processes) {
    if (proc.actualStartAt) {
      timelineItems.push({
        id: `proc-start-${proc.id}`,
        time: proc.actualStartAt,
        type: 'process_started',
        category: '工序',
        title: `工序开始：${proc.processName}`,
        description: proc.equipment ? `设备：${proc.equipment}` : undefined,
        operatorName: proc.assignedUser?.realName,
        relatedId: proc.id,
        sequence: proc.sequence,
      });
    }
    if (proc.actualEndAt) {
      timelineItems.push({
        id: `proc-end-${proc.id}`,
        time: proc.actualEndAt,
        type: 'process_completed',
        category: '工序',
        title: `工序完成：${proc.processName}`,
        description: proc.actualDurationHours ? `用时 ${proc.actualDurationHours} 小时` : undefined,
        operatorName: proc.assignedUser?.realName,
        relatedId: proc.id,
        sequence: proc.sequence,
      });
    }
  }

  for (const rw of reworks) {
    timelineItems.push({
      id: `rw-reported-${rw.id}`,
      time: rw.reportedAt,
      type: 'process_rework',
      category: '返工',
      title: `返工报告 #${rw.reworkCount}：${rw.process?.processName || ''}`,
      description: rw.reworkReason + (rw.reworkType ? `（类型：${rw.reworkType}）` : ''),
      operatorName: rw.reportedByUser?.realName,
      relatedId: rw.id,
      status: rw.isTimeout ? '超时' : rw.resolvedAt ? '已解决' : '处理中',
      sequence: rw.process?.sequence,
    });
    if (rw.timeoutApprovedAt) {
      timelineItems.push({
        id: `rw-timeout-${rw.id}`,
        time: rw.timeoutApprovedAt,
        type: 'rework_timeout',
        category: '返工',
        title: `返工超时批准：${rw.process?.processName || ''} 第${rw.reworkCount}次`,
        description: rw.timeoutApprovalNote,
        operatorName: rw.timeoutApprovedByUser?.realName,
        operatorRole: rw.timeoutApprovedByUser?.role,
        relatedId: rw.id,
        status: '超时已批准',
      });
    }
    if (rw.resolvedAt) {
      timelineItems.push({
        id: `rw-resolved-${rw.id}`,
        time: rw.resolvedAt,
        type: 'process_completed',
        category: '返工',
        title: `返工解决：${rw.process?.processName || ''}`,
        description: rw.resolutionNote,
        operatorName: rw.resolvedByUser?.realName,
        relatedId: rw.id,
        status: '已解决',
      });
    }
  }

  for (const ev of events) {
    if (
      ev.eventType === 'material_shortage' ||
      ev.eventType === 'alternative_material_used' ||
      ev.eventType === 'material_allocated' ||
      ev.eventType === 'delivery_warning' ||
      ev.eventType === 'manual_note'
    ) {
      timelineItems.push({
        id: `ev-${ev.id}`,
        time: ev.eventAt,
        type: ev.eventType,
        category: ev.eventType.startsWith('material') || ev.eventType === 'alternative_material_used' ? '物料' : ev.eventType === 'delivery_warning' ? '系统' : '系统',
        title: ev.title,
        description: ev.description,
        operatorName: ev.triggeredByName,
        metadata: ev.metadata as Record<string, unknown> | undefined,
      });
    }
  }

  timelineItems.sort((a, b) => a.time.getTime() - b.time.getTime());

  const categories: Record<string, number> = {};
  for (const item of timelineItems) {
    categories[item.category] = (categories[item.category] || 0) + 1;
  }

  return ok(c, {
    workOrder: {
      id: workOrder.id,
      orderNo: workOrder.orderNo,
      productName: workOrder.productName,
      status: workOrder.status,
      deliveryRisk: workOrder.deliveryRisk,
      deliveryDate: workOrder.deliveryDate,
      plannedStartDate: workOrder.plannedStartDate,
      plannedEndDate: workOrder.plannedEndDate,
    },
    processes,
    timelineItems,
    stats: {
      totalEvents: timelineItems.length,
      categories,
      startTime: timelineItems[0]?.time,
      endTime: timelineItems[timelineItems.length - 1]?.time,
    },
  });
});

app.get('/global', async (c) => {
  const query = c.req.query();
  const { page, pageSize, offset } = getPageParams(query);
  const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
  const dateTo = query.dateTo ? new Date(query.dateTo + ' 23:59:59') : undefined;
  const workOrderIds = query.workOrderIds ? (query.workOrderIds as string).split(',').map(Number) : undefined;

  const conditions = [];
  if (dateFrom) conditions.push(gte(schema.timelineEvents.eventAt, dateFrom));
  if (dateTo) conditions.push(lte(schema.timelineEvents.eventAt, dateTo));
  if (workOrderIds?.length) conditions.push(inArray(schema.timelineEvents.workOrderId, workOrderIds));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const events = await db.query.timelineEvents.findMany({
    where: whereClause,
    with: {
      workOrder: { columns: { id: true, orderNo: true, productName: true } },
      process: { columns: { id: true, processName: true, sequence: true } },
      triggeredByUser: { columns: { id: true, realName: true, role: true } },
    },
    orderBy: desc(schema.timelineEvents.eventAt),
    limit: pageSize,
    offset,
  });

  return ok(c, events.map(ev => ({
    ...ev,
    icon: getEventIcon(ev.eventType),
    color: getEventColor(ev.eventType),
  })));
});

function getEventIcon(type: string): string {
  const map: Record<string, string> = {
    work_order_created: '📋',
    work_order_status_changed: '🔄',
    process_started: '▶️',
    process_completed: '✅',
    process_rework: '⚠️',
    material_allocated: '📦',
    material_shortage: '❌',
    alternative_material_used: '🔁',
    delivery_warning: '🚨',
    rework_timeout: '⏰',
    manual_note: '📝',
  };
  return map[type] || '📌';
}

function getEventColor(type: string): string {
  const map: Record<string, string> = {
    work_order_created: '#3b82f6',
    work_order_status_changed: '#6366f1',
    process_started: '#0ea5e9',
    process_completed: '#10b981',
    process_rework: '#f59e0b',
    material_allocated: '#14b8a6',
    material_shortage: '#ef4444',
    alternative_material_used: '#8b5cf6',
    delivery_warning: '#dc2626',
    rework_timeout: '#ea580c',
    manual_note: '#6b7280',
  };
  return map[type] || '#6b7280';
}

function getEventCategory(type: string): string {
  if (type.startsWith('work_order')) return '工单';
  if (type.startsWith('process')) return type === 'process_rework' ? '返工' : '工序';
  if (type.startsWith('material') || type === 'alternative_material_used') return '物料';
  if (type === 'rework_timeout' || type === 'delivery_warning') return '预警';
  return '其他';
}

export default app;
