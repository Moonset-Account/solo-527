import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { eq, and, desc, gte, lte, inArray, or, like, count, isNull } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { getCurrentUser, getPageParams, ok, fail, createActionLog, createExportRecord } from '../utils';
import type { Context } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
  const query = c.req.query();
  const { page, pageSize, offset } = getPageParams(query);
  const exportType = query.exportType as typeof schema.exportTypeEnum.enumValues[number] | undefined;
  const requestedBy = query.requestedBy ? parseInt(query.requestedBy) : undefined;
  const status = query.status;

  const conditions = [];
  if (exportType) conditions.push(eq(schema.exportRecords.exportType, exportType));
  if (requestedBy) conditions.push(eq(schema.exportRecords.requestedBy, requestedBy));
  if (status) conditions.push(eq(schema.exportRecords.status, status));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [records, totalResult] = await Promise.all([
    db.query.exportRecords.findMany({
      where: whereClause,
      with: {
        requestedByUser: { columns: { id: true, realName: true, role: true, username: true } },
      },
      orderBy: desc(schema.exportRecords.createdAt),
      limit: pageSize,
      offset,
    }),
    db.select({ count: count() }).from(schema.exportRecords).where(whereClause),
  ]);

  return ok(c, records, { total: totalResult[0].count, page, pageSize });
});

app.post(
  '/work-orders',
  zValidator(
    'json',
    z.object({
      filters: z.object({
        status: z.string().optional(),
        deliveryRisk: z.string().optional(),
        keyword: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        ids: z.array(z.number().int()).optional(),
      }).optional(),
      includeMaterials: z.boolean().default(true),
      includeProcesses: z.boolean().default(true),
    })
  ),
  async (c) => {
    const payload = c.req.valid('json');
    const currentUser = getCurrentUser(c);
    const filters = payload.filters || {};

    const conditions = [];
    if (filters.status) conditions.push(eq(schema.workOrders.status, filters.status as any));
    if (filters.deliveryRisk) conditions.push(eq(schema.workOrders.deliveryRisk, filters.deliveryRisk as any));
    if (filters.keyword) {
      conditions.push(or(
        like(schema.workOrders.orderNo, `%${filters.keyword}%`),
        like(schema.workOrders.productName, `%${filters.keyword}%`),
      ));
    }
    if (filters.dateFrom) conditions.push(gte(schema.workOrders.deliveryDate, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(schema.workOrders.deliveryDate, new Date(filters.dateTo + ' 23:59:59')));
    if (filters.ids?.length) conditions.push(inArray(schema.workOrders.id, filters.ids));

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const orders = await db.query.workOrders.findMany({
      where: whereClause,
      with: {
        createdByUser: { columns: { realName: true } },
        workOrderMaterials: payload.includeMaterials ? { with: { material: true } } : undefined,
        processes: payload.includeProcesses ? { orderBy: schema.processes.sequence } : undefined,
      },
      orderBy: desc(schema.workOrders.createdAt),
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = currentUser.realName;
    workbook.created = new Date();

    const statusMap: Record<string, string> = {
      pending: '待排产', material_ready: '物料齐套', in_progress: '生产中',
      completed: '已完成', delayed: '已延期', cancelled: '已取消',
    };
    const riskMap: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' };

    const ws1 = workbook.addWorksheet('工单列表');
    ws1.columns = [
      { header: '工单号', key: 'orderNo', width: 20 },
      { header: '产品名称', key: 'productName', width: 30 },
      { header: '产品编码', key: 'productCode', width: 18 },
      { header: '数量', key: 'quantity', width: 10 },
      { header: '单位', key: 'unit', width: 8 },
      { header: '状态', key: 'status', width: 12 },
      { header: '优先级', key: 'priority', width: 8 },
      { header: '交期风险', key: 'risk', width: 10 },
      { header: '计划开始', key: 'plannedStart', width: 18 },
      { header: '计划完成', key: 'plannedEnd', width: 18 },
      { header: '实际开始', key: 'actualStart', width: 18 },
      { header: '实际完成', key: 'actualEnd', width: 18 },
      { header: '交货日期', key: 'delivery', width: 18 },
      { header: '客户', key: 'customer', width: 25 },
      { header: '创建人', key: 'creator', width: 12 },
      { header: '备注', key: 'remark', width: 30 },
    ];
    ws1.getRow(1).font = { bold: true };

    for (const wo of orders) {
      ws1.addRow({
        orderNo: wo.orderNo,
        productName: wo.productName,
        productCode: wo.productCode || '',
        quantity: wo.quantity,
        unit: wo.unit,
        status: statusMap[wo.status] || wo.status,
        priority: wo.priority,
        risk: riskMap[wo.deliveryRisk || 'low'],
        plannedStart: wo.plannedStartDate ? fmtDate(wo.plannedStartDate) : '',
        plannedEnd: wo.plannedEndDate ? fmtDate(wo.plannedEndDate) : '',
        actualStart: wo.actualStartDate ? fmtDate(wo.actualStartDate) : '',
        actualEnd: wo.actualEndDate ? fmtDate(wo.actualEndDate) : '',
        delivery: wo.deliveryDate ? fmtDate(wo.deliveryDate) : '',
        customer: wo.customer || '',
        creator: wo.createdByUser?.realName || '',
        remark: wo.remark || '',
      });
    }

    if (payload.includeMaterials) {
      const ws2 = workbook.addWorksheet('工单物料');
      ws2.columns = [
        { header: '工单号', key: 'orderNo', width: 20 },
        { header: '产品名称', key: 'productName', width: 25 },
        { header: '物料编码', key: 'materialCode', width: 15 },
        { header: '物料名称', key: 'materialName', width: 25 },
        { header: '规格', key: 'spec', width: 25 },
        { header: '单位', key: 'unit', width: 8 },
        { header: '需求数量', key: 'required', width: 10 },
        { header: '已分配', key: 'allocated', width: 10 },
        { header: '是否齐套', key: 'kitted', width: 10 },
        { header: '缺料说明', key: 'shortageNote', width: 25 },
      ];
      ws2.getRow(1).font = { bold: true };
      for (const wo of orders) {
        for (const wom of wo.workOrderMaterials || []) {
          ws2.addRow({
            orderNo: wo.orderNo,
            productName: wo.productName,
            materialCode: wom.material.materialCode,
            materialName: wom.material.materialName,
            spec: wom.material.specification || '',
            unit: wom.material.unit,
            required: wom.requiredQuantity,
            allocated: wom.allocatedQuantity,
            kitted: wom.isKitted ? '是' : '否',
            shortageNote: wom.shortageNote || '',
          });
        }
      }
    }

    if (payload.includeProcesses) {
      const ws3 = workbook.addWorksheet('工序列表');
      ws3.columns = [
        { header: '工单号', key: 'orderNo', width: 20 },
        { header: '工序号', key: 'sequence', width: 8 },
        { header: '工序名称', key: 'processName', width: 22 },
        { header: '状态', key: 'status', width: 10 },
        { header: '设备', key: 'equipment', width: 20 },
        { header: '计划工时(H)', key: 'plannedDur', width: 12 },
        { header: '实际工时(H)', key: 'actualDur', width: 12 },
        { header: '返工次数', key: 'reworkCount', width: 10 },
        { header: '实际开始', key: 'actualStart', width: 18 },
        { header: '实际结束', key: 'actualEnd', width: 18 },
      ];
      ws3.getRow(1).font = { bold: true };
      const procStatusMap: Record<string, string> = {
        pending: '待开始', in_progress: '进行中', completed: '已完成', rework: '返工中', cancelled: '已取消',
      };
      for (const wo of orders) {
        for (const p of wo.processes || []) {
          ws3.addRow({
            orderNo: wo.orderNo,
            sequence: p.sequence,
            processName: p.processName,
            status: procStatusMap[p.status] || p.status,
            equipment: p.equipment || '',
            plannedDur: p.plannedDurationHours || '',
            actualDur: p.actualDurationHours || '',
            reworkCount: p.reworkCount,
            actualStart: p.actualStartAt ? fmtDate(p.actualStartAt) : '',
            actualEnd: p.actualEndAt ? fmtDate(p.actualEndAt) : '',
          });
        }
      }
    }

    const fileName = `工单数据_${formatTimestamp(new Date())}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const size = buffer.byteLength;

    const [record] = await createExportRecord({
      exportType: 'work_orders',
      fileName,
      filterConditions: filters as any,
      user: currentUser,
      fileSize: size,
      recordCount: orders.length,
    });

    await createActionLog({
      logType: 'data_export',
      title: `数据导出：工单数据 ${orders.length} 条`,
      detail: `导出文件名：${fileName}，筛选条件：${JSON.stringify(filters)}`,
      user: currentUser,
      metadata: { exportId: record[0].id, filters, count: orders.length },
    });

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    c.header('X-Export-Record-Id', String(record[0].id));
    return c.body(buffer as unknown as BodyInit);
  }
);

app.post(
  '/timeline/:workOrderId',
  async (c) => {
    const workOrderId = parseInt(c.req.param('workOrderId'));
    const currentUser = getCurrentUser(c);

    const result = await fetchTimelineWithGroups(db, workOrderId);
    if (!result.workOrder) return fail(c, '工单不存在', 404);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = currentUser.realName;

    const ws1 = workbook.addWorksheet('工单概况');
    ws1.columns = [
      { header: '工单号', key: 'orderNo', width: 22 },
      { header: '产品名称', key: 'productName', width: 30 },
      { header: '状态', key: 'status', width: 12 },
      { header: '交期风险', key: 'risk', width: 10 },
      { header: '交货日期', key: 'delivery', width: 20 },
      { header: '计划开始', key: 'plannedStart', width: 20 },
      { header: '计划完成', key: 'plannedEnd', width: 20 },
    ];
    ws1.getRow(1).font = { bold: true };
    const statusMap: Record<string, string> = {
      pending: '待排产', material_ready: '物料齐套', in_progress: '生产中',
      completed: '已完成', delayed: '已延期', cancelled: '已取消',
    };
    const riskMap: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' };
    ws1.addRow({
      orderNo: result.workOrder.orderNo,
      productName: result.workOrder.productName,
      status: statusMap[result.workOrder.status] || result.workOrder.status,
      risk: riskMap[(result.workOrder.deliveryRisk as string) || 'low'],
      delivery: result.workOrder.deliveryDate ? fmtDate(result.workOrder.deliveryDate as Date) : '',
      plannedStart: result.workOrder.plannedStartDate ? fmtDate(result.workOrder.plannedStartDate as Date) : '',
      plannedEnd: result.workOrder.plannedEndDate ? fmtDate(result.workOrder.plannedEndDate as Date) : '',
    });

    const ws2 = workbook.addWorksheet('完整时间线');
    ws2.columns = [
      { header: '序号', key: 'idx', width: 6 },
      { header: '时间', key: 'time', width: 22 },
      { header: '类别', key: 'category', width: 10 },
      { header: '标题', key: 'title', width: 40 },
      { header: '详情描述', key: 'desc', width: 50 },
      { header: '操作人', key: 'operator', width: 15 },
      { header: '关联工序序号', key: 'sequence', width: 12 },
    ];
    ws2.getRow(1).font = { bold: true };

    result.timelineItems.forEach((item, idx) => {
      ws2.addRow({
        idx: idx + 1,
        time: fmtDate(item.time as Date),
        category: item.category,
        title: item.title,
        desc: item.description || '',
        operator: item.operatorName || '',
        sequence: item.sequence || '',
      });
    });

    if (result.reworks.length) {
      const ws3 = workbook.addWorksheet('返工详情');
      ws3.columns = [
        { header: 'ID', key: 'id', width: 6 },
        { header: '工序名称', key: 'processName', width: 22 },
        { header: '工序序号', key: 'sequence', width: 10 },
        { header: '返工次数', key: 'reworkCount', width: 10 },
        { header: '返工原因', key: 'reason', width: 40 },
        { header: '报告人', key: 'reporter', width: 12 },
        { header: '报告时间', key: 'reportedAt', width: 22 },
        { header: '截止时间', key: 'deadline', width: 22 },
        { header: '是否超时', key: 'timeout', width: 10 },
        { header: '解决说明', key: 'resolution', width: 35 },
        { header: '解决人', key: 'resolver', width: 12 },
        { header: '解决时间', key: 'resolvedAt', width: 22 },
      ];
      ws3.getRow(1).font = { bold: true };
      for (const rw of result.reworks) {
        ws3.addRow({
          id: rw.id,
          processName: (rw.process as any)?.processName || '',
          sequence: (rw.process as any)?.sequence || '',
          reworkCount: rw.reworkCount,
          reason: rw.reworkReason,
          reporter: (rw.reportedByUser as any)?.realName || '',
          reportedAt: fmtDate(rw.reportedAt),
          deadline: rw.deadlineAt ? fmtDate(rw.deadlineAt) : '',
          timeout: rw.isTimeout ? '是' : '否',
          resolution: rw.resolutionNote || '',
          resolver: (rw.resolvedByUser as any)?.realName || '',
          resolvedAt: rw.resolvedAt ? fmtDate(rw.resolvedAt) : '',
        });
      }
    }

    const fileName = `时间线_${result.workOrder.orderNo}_${formatTimestamp(new Date())}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();

    const [record] = await createExportRecord({
      exportType: 'timeline',
      fileName,
      filterConditions: { workOrderId, orderNo: result.workOrder.orderNo },
      user: currentUser,
      fileSize: buffer.byteLength,
      recordCount: result.timelineItems.length,
    });

    await createActionLog({
      logType: 'data_export',
      title: `数据导出：工单时间线 ${result.workOrder.orderNo}`,
      detail: `导出文件名：${fileName}，时间线条数：${result.timelineItems.length}`,
      relatedWorkOrderId: workOrderId,
      user: currentUser,
      metadata: { exportId: record[0].id, workOrderId },
    });

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    return c.body(buffer as unknown as BodyInit);
  }
);

app.post(
  '/reworks',
  zValidator(
    'json',
    z.object({
      filters: z.object({
        isTimeout: z.string().optional(),
        unresolved: z.boolean().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }).optional(),
    })
  ),
  async (c) => {
    const payload = c.req.valid('json');
    const currentUser = getCurrentUser(c);
    const filters = payload.filters || {};

    const conditions = [];
    if (filters.isTimeout === 'true') conditions.push(eq(schema.reworkRecords.isTimeout, true));
    if (filters.unresolved) conditions.push(isNull(schema.reworkRecords.resolvedAt));
    if (filters.dateFrom) conditions.push(gte(schema.reworkRecords.reportedAt, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(schema.reworkRecords.reportedAt, new Date(filters.dateTo + ' 23:59:59')));

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const reworks = await db.query.reworkRecords.findMany({
      where: whereClause,
      with: {
        workOrder: true,
        process: true,
        reportedByUser: { columns: { realName: true } },
        assignedToUser: { columns: { realName: true } },
        resolvedByUser: { columns: { realName: true } },
        timeoutApprovedByUser: { columns: { realName: true } },
      },
      orderBy: desc(schema.reworkRecords.reportedAt),
    });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('返工记录');
    ws.columns = [
      { header: 'ID', key: 'id', width: 6 },
      { header: '工单号', key: 'orderNo', width: 20 },
      { header: '产品名称', key: 'productName', width: 25 },
      { header: '工序名称', key: 'processName', width: 20 },
      { header: '工序号', key: 'sequence', width: 8 },
      { header: '返工次数', key: 'reworkCount', width: 10 },
      { header: '返工类型', key: 'type', width: 15 },
      { header: '返工原因', key: 'reason', width: 40 },
      { header: '报告人', key: 'reporter', width: 12 },
      { header: '报告时间', key: 'reportedAt', width: 22 },
      { header: '处理人', key: 'assignee', width: 12 },
      { header: '截止时间', key: 'deadline', width: 22 },
      { header: '是否超时', key: 'timeout', width: 10 },
      { header: '超时审批人', key: 'timeoutApprover', width: 12 },
      { header: '超时审批备注', key: 'timeoutNote', width: 30 },
      { header: '解决说明', key: 'resolution', width: 35 },
      { header: '解决人', key: 'resolver', width: 12 },
      { header: '解决时间', key: 'resolvedAt', width: 22 },
    ];
    ws.getRow(1).font = { bold: true };

    for (const rw of reworks) {
      ws.addRow({
        id: rw.id,
        orderNo: rw.workOrder?.orderNo || '',
        productName: rw.workOrder?.productName || '',
        processName: rw.process?.processName || '',
        sequence: rw.process?.sequence || '',
        reworkCount: rw.reworkCount,
        type: rw.reworkType || '',
        reason: rw.reworkReason,
        reporter: rw.reportedByUser?.realName || '',
        reportedAt: fmtDate(rw.reportedAt),
        assignee: rw.assignedToUser?.realName || '',
        deadline: rw.deadlineAt ? fmtDate(rw.deadlineAt) : '',
        timeout: rw.isTimeout ? '是' : '否',
        timeoutApprover: rw.timeoutApprovedByUser?.realName || '',
        timeoutNote: rw.timeoutApprovalNote || '',
        resolution: rw.resolutionNote || '',
        resolver: rw.resolvedByUser?.realName || '',
        resolvedAt: rw.resolvedAt ? fmtDate(rw.resolvedAt) : '',
      });
    }

    const fileName = `返工记录_${formatTimestamp(new Date())}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();

    const [record] = await createExportRecord({
      exportType: 'rework_records',
      fileName,
      filterConditions: filters as any,
      user: currentUser,
      fileSize: buffer.byteLength,
      recordCount: reworks.length,
    });

    await createActionLog({
      logType: 'data_export',
      title: `数据导出：返工记录 ${reworks.length} 条`,
      detail: `导出文件名：${fileName}`,
      user: currentUser,
      metadata: { exportId: record[0].id, filters, count: reworks.length },
    });

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    return c.body(buffer as unknown as BodyInit);
  }
);

async function fetchTimelineWithGroups(db: any, workOrderId: number) {
  const [workOrder, processes, events, reworks] = await Promise.all([
    db.query.workOrders.findFirst({ where: eq(schema.workOrders.id, workOrderId) }),
    db.query.processes.findMany({
      where: eq(schema.processes.workOrderId, workOrderId),
      orderBy: schema.processes.sequence,
    }),
    db.query.timelineEvents.findMany({
      where: eq(schema.timelineEvents.workOrderId, workOrderId),
      orderBy: schema.timelineEvents.eventAt,
    }),
    db.query.reworkRecords.findMany({
      where: eq(schema.reworkRecords.workOrderId, workOrderId),
      with: {
        process: { columns: { id: true, processName: true, sequence: true } },
        reportedByUser: { columns: { id: true, realName: true } },
        resolvedByUser: { columns: { id: true, realName: true } },
        timeoutApprovedByUser: { columns: { id: true, realName: true } },
      },
    }),
  ]);

  const timelineItems: any[] = [];
  if (workOrder) {
    timelineItems.push({
      id: `wo-c-${workOrder.id}`, time: workOrder.createdAt, type: 'work_order_created',
      category: '工单', title: `工单创建：${workOrder.orderNo}`,
      description: `产品：${workOrder.productName}`, operatorName: '系统',
    });
  }
  for (const proc of processes) {
    if (proc.actualStartAt) timelineItems.push({
      id: `ps-${proc.id}`, time: proc.actualStartAt, type: 'process_started',
      category: '工序', title: `工序开始：${proc.processName}`, sequence: proc.sequence,
    });
    if (proc.actualEndAt) timelineItems.push({
      id: `pe-${proc.id}`, time: proc.actualEndAt, type: 'process_completed',
      category: '工序', title: `工序完成：${proc.processName}`, sequence: proc.sequence,
    });
  }
  for (const rw of reworks) {
    timelineItems.push({
      id: `rr-${rw.id}`, time: rw.reportedAt, type: 'process_rework',
      category: '返工', title: `返工报告 #${rw.reworkCount}`, description: rw.reworkReason,
      operatorName: (rw.reportedByUser as any)?.realName,
    });
    if (rw.resolvedAt) timelineItems.push({
      id: `rrr-${rw.id}`, time: rw.resolvedAt, type: 'process_completed',
      category: '返工', title: `返工解决`, description: rw.resolutionNote,
      operatorName: (rw.resolvedByUser as any)?.realName,
    });
  }
  for (const ev of events) timelineItems.push({
    id: `ev-${ev.id}`, time: ev.eventAt, type: ev.eventType,
    category: ev.eventType.includes('material') ? '物料' : '系统',
    title: ev.title, description: ev.description, operatorName: ev.triggeredByName,
  });
  timelineItems.sort((a, b) => (a.time as Date).getTime() - (b.time as Date).getTime());

  return { workOrder, processes, reworks, timelineItems, events };
}

function fmtDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export default app;
