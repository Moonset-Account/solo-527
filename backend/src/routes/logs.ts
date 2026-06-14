import { Hono } from 'hono';
import { eq, and, desc, gte, lte, count } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { ok, getPageParams, requireAdmin } from '../middleware/auth';
import { fail } from '../utils';

const app = new Hono();

app.get('/', async (c) => {
  const query = c.req.query();
  const { page, pageSize, offset } = getPageParams(query);
  const logType = query.logType as typeof schema.actionLogTypeEnum.enumValues[number] | undefined;
  const operatorId = query.operatorId ? parseInt(query.operatorId) : undefined;
  const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
  const dateTo = query.dateTo ? new Date(query.dateTo + ' 23:59:59') : undefined;
  const relatedWorkOrderId = query.relatedWorkOrderId ? parseInt(query.relatedWorkOrderId) : undefined;

  const conditions = [];
  if (logType) conditions.push(eq(schema.actionLogs.logType, logType));
  if (operatorId) conditions.push(eq(schema.actionLogs.operatorId, operatorId));
  if (dateFrom) conditions.push(gte(schema.actionLogs.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(schema.actionLogs.createdAt, dateTo));
  if (relatedWorkOrderId) conditions.push(eq(schema.actionLogs.relatedWorkOrderId, relatedWorkOrderId));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [logs, totalResult] = await Promise.all([
    db.query.actionLogs.findMany({
      where: whereClause,
      with: {
        operator: { columns: { id: true, realName: true, role: true, username: true } },
        workOrder: { columns: { id: true, orderNo: true, productName: true } },
        process: { columns: { id: true, processName: true, sequence: true } },
        rework: { columns: { id: true, reworkReason: true } },
      },
      orderBy: desc(schema.actionLogs.createdAt),
      limit: pageSize,
      offset,
    }),
    db.select({ count: count() }).from(schema.actionLogs).where(whereClause),
  ]);

  const typeLabelMap: Record<string, string> = {
    rework_timeout_approval: '返工超时审批',
    rework_timeout_warning: '返工超时警告',
    work_order_override: '工单变更',
    material_override: '物料变更',
    permission_change: '权限变更',
    data_export: '数据导出',
  };

  return ok(
    c,
    logs.map((l) => ({ ...l, typeLabel: typeLabelMap[l.logType] || l.logType })),
    { total: totalResult[0].count, page, pageSize }
  );
});

app.get('/stats', requireAdmin(), async (c) => {
  const days = parseInt(c.req.query('days') || '30');
  const startDate = new Date(Date.now() - days * 86400000);

  const logs = await db.query.actionLogs.findMany({
    where: gte(schema.actionLogs.createdAt, startDate),
  });

  const byType: Record<string, number> = {};
  for (const l of logs) byType[l.logType] = (byType[l.logType] || 0) + 1;

  const byDate: Record<string, number> = {};
  for (const l of logs) {
    const key = new Date(l.createdAt).toISOString().slice(0, 10);
    byDate[key] = (byDate[key] || 0) + 1;
  }

  return ok(c, { total: logs.length, byType, byDate, dateRange: { start: startDate, end: new Date() } });
});

export default app;
