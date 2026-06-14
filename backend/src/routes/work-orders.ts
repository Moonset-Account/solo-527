import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, like, desc, asc, count, or, isNull, gte, lte, inArray } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { getCurrentUser, requireAdmin } from '../middleware/auth';
import { ok, fail, getPageParams, createTimelineEvent } from '../utils';

const app = new Hono();

app.get('/', async (c) => {
  const query = c.req.query();
  const { page, pageSize, offset } = getPageParams(query);
  const status = query.status as typeof schema.workOrderStatusEnum.enumValues[number] | undefined;
  const keyword = query.keyword;
  const deliveryRisk = query.deliveryRisk as typeof schema.riskLevelEnum.enumValues[number] | undefined;
  const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
  const dateTo = query.dateTo ? new Date(query.dateTo + ' 23:59:59') : undefined;

  const conditions = [];
  if (status) conditions.push(eq(schema.workOrders.status, status));
  if (deliveryRisk) conditions.push(eq(schema.workOrders.deliveryRisk, deliveryRisk));
  if (keyword) {
    conditions.push(
      or(
        like(schema.workOrders.orderNo, `%${keyword}%`),
        like(schema.workOrders.productName, `%${keyword}%`),
        like(schema.workOrders.productCode, `%${keyword}%`),
        like(schema.workOrders.customer, `%${keyword}%`)
      )
    );
  }
  if (dateFrom) conditions.push(gte(schema.workOrders.deliveryDate, dateFrom));
  if (dateTo) conditions.push(lte(schema.workOrders.deliveryDate, dateTo));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [orders, totalResult] = await Promise.all([
    db.query.workOrders.findMany({
      where: whereClause,
      with: {
        createdByUser: { columns: { id: true, realName: true } },
        workOrderMaterials: {
          with: {
            material: true,
          },
        },
        processes: {
          orderBy: asc(schema.processes.sequence),
          with: { assignedUser: { columns: { id: true, realName: true } } },
        },
      },
      orderBy: [desc(schema.workOrders.priority), desc(schema.workOrders.createdAt)],
      limit: pageSize,
      offset,
    }),
    db.select({ count: count() }).from(schema.workOrders).where(whereClause),
  ]);

  const enriched = orders.map((o) => {
    const totalMaterials = o.workOrderMaterials.length;
    const kittedMaterials = o.workOrderMaterials.filter((m) => m.isKitted).length;
    const shortageMaterials = o.workOrderMaterials.filter(
      (m) => !m.isKitted && m.allocatedQuantity < m.requiredQuantity
    ).length;
    const completedProcesses = o.processes.filter((p) => p.status === 'completed').length;
    const reworkProcesses = o.processes.filter((p) => p.status === 'rework').length;

    return {
      ...o,
      materialSummary: {
        total: totalMaterials,
        kitted: kittedMaterials,
        shortage: shortageMaterials,
        kittedRate: totalMaterials ? Math.round((kittedMaterials / totalMaterials) * 100) : 100,
      },
      processSummary: {
        total: o.processes.length,
        completed: completedProcesses,
        rework: reworkProcesses,
        inProgress: o.processes.filter((p) => p.status === 'in_progress').length,
        completedRate: o.processes.length ? Math.round((completedProcesses / o.processes.length) * 100) : 0,
      },
    };
  });

  return ok(c, enriched, { total: totalResult[0].count, page, pageSize });
});

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const order = await db.query.workOrders.findFirst({
    where: eq(schema.workOrders.id, id),
    with: {
      createdByUser: { columns: { id: true, realName: true, username: true } },
      workOrderMaterials: {
        with: {
          material: true,
        },
      },
      processes: {
        orderBy: asc(schema.processes.sequence),
        with: {
          assignedUser: { columns: { id: true, realName: true } },
          reworkRecords: {
            with: {
              reportedByUser: { columns: { id: true, realName: true } },
              assignedToUser: { columns: { id: true, realName: true } },
              resolvedByUser: { columns: { id: true, realName: true } },
              timeoutApprovedByUser: { columns: { id: true, realName: true } },
            },
          },
        },
      },
      reworkRecords: {
        orderBy: desc(schema.reworkRecords.createdAt),
        with: {
          reportedByUser: { columns: { id: true, realName: true } },
          process: { columns: { id: true, processName: true, sequence: true } },
        },
      },
    },
  });

  if (!order) return fail(c, '工单不存在', 404);

  const materialIds = order.workOrderMaterials.map((m) => m.materialId);
  const alternatives = materialIds.length
    ? await db.query.alternativeMaterials.findMany({
        where: inArray(schema.alternativeMaterials.originalMaterialId, materialIds),
        with: {
          originalMaterial: { columns: { id: true, materialCode: true, materialName: true } },
          alternativeMaterial: true,
          approvedByUser: { columns: { id: true, realName: true } },
        },
      })
    : [];

  return ok(c, { ...order, alternativeMaterials: alternatives });
});

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      orderNo: z.string().min(1),
      productName: z.string().min(1),
      productCode: z.string().optional(),
      quantity: z.number().int().positive(),
      unit: z.string().default('件'),
      priority: z.number().int().min(1).max(10).default(5),
      plannedStartDate: z.string().optional(),
      plannedEndDate: z.string().optional(),
      deliveryDate: z.string().optional(),
      customer: z.string().optional(),
      remark: z.string().optional(),
      materials: z
        .array(
          z.object({
            materialId: z.number().int(),
            requiredQuantity: z.number().int().positive(),
          })
        )
        .optional(),
    })
  ),
  async (c) => {
    const payload = c.req.valid('json');
    const currentUser = getCurrentUser(c);

    const existing = await db.query.workOrders.findFirst({ where: eq(schema.workOrders.orderNo, payload.orderNo) });
    if (existing) return fail(c, '工单号已存在');

    const [inserted] = await db
      .insert(schema.workOrders)
      .values({
        orderNo: payload.orderNo,
        productName: payload.productName,
        productCode: payload.productCode,
        quantity: payload.quantity,
        unit: payload.unit,
        priority: payload.priority,
        plannedStartDate: payload.plannedStartDate ? new Date(payload.plannedStartDate) : undefined,
        plannedEndDate: payload.plannedEndDate ? new Date(payload.plannedEndDate) : undefined,
        deliveryDate: payload.deliveryDate ? new Date(payload.deliveryDate) : undefined,
        customer: payload.customer,
        remark: payload.remark,
        createdBy: currentUser.sub,
      })
      .returning();

    if (payload.materials?.length) {
      await db.insert(schema.workOrderMaterials).values(
        payload.materials.map((m) => ({
          workOrderId: inserted.id,
          materialId: m.materialId,
          requiredQuantity: m.requiredQuantity,
        }))
      );
    }

    await createTimelineEvent({
      workOrderId: inserted.id,
      eventType: 'work_order_created',
      title: '工单创建',
      description: `创建工单 ${inserted.orderNo}，产品：${inserted.productName}，数量：${inserted.quantity}${inserted.unit}`,
      user: currentUser,
      eventAt: inserted.createdAt,
    });

    return ok(c, inserted);
  }
);

app.put(
  '/:id',
  zValidator(
    'json',
    z.object({
      productName: z.string().optional(),
      productCode: z.string().optional(),
      quantity: z.number().int().positive().optional(),
      unit: z.string().optional(),
      status: z.enum(schema.workOrderStatusEnum.enumValues).optional(),
      priority: z.number().int().min(1).max(10).optional(),
      plannedStartDate: z.string().optional(),
      plannedEndDate: z.string().optional(),
      deliveryDate: z.string().optional(),
      customer: z.string().optional(),
      remark: z.string().optional(),
    })
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const payload = c.req.valid('json');
    const currentUser = getCurrentUser(c);

    const existing = await db.query.workOrders.findFirst({ where: eq(schema.workOrders.id, id) });
    if (!existing) return fail(c, '工单不存在', 404);

    const updateData: Record<string, unknown> = {};
    if (payload.productName !== undefined) updateData.productName = payload.productName;
    if (payload.productCode !== undefined) updateData.productCode = payload.productCode;
    if (payload.quantity !== undefined) updateData.quantity = payload.quantity;
    if (payload.unit !== undefined) updateData.unit = payload.unit;
    if (payload.priority !== undefined) updateData.priority = payload.priority;
    if (payload.plannedStartDate !== undefined)
      updateData.plannedStartDate = payload.plannedStartDate ? new Date(payload.plannedStartDate) : null;
    if (payload.plannedEndDate !== undefined)
      updateData.plannedEndDate = payload.plannedEndDate ? new Date(payload.plannedEndDate) : null;
    if (payload.deliveryDate !== undefined)
      updateData.deliveryDate = payload.deliveryDate ? new Date(payload.deliveryDate) : null;
    if (payload.customer !== undefined) updateData.customer = payload.customer;
    if (payload.remark !== undefined) updateData.remark = payload.remark;
    updateData.updatedAt = new Date();

    let newStatus = existing.status;
    if (payload.status && payload.status !== existing.status) {
      updateData.status = payload.status;
      newStatus = payload.status;
      if (payload.status === 'in_progress' && !existing.actualStartDate) {
        updateData.actualStartDate = new Date();
      }
      if (payload.status === 'completed') {
        updateData.actualEndDate = new Date();
      }
    }

    if (Object.keys(updateData).length > 1) {
      await db.update(schema.workOrders).set(updateData).where(eq(schema.workOrders.id, id));
    }

    if (payload.status && payload.status !== existing.status) {
      const statusMap: Record<string, string> = {
        pending: '待排产',
        material_ready: '物料齐套',
        in_progress: '生产中',
        completed: '已完成',
        delayed: '已延期',
        cancelled: '已取消',
      };
      await createTimelineEvent({
        workOrderId: id,
        eventType: 'work_order_status_changed',
        title: `工单状态变更：${statusMap[existing.status]} → ${statusMap[newStatus]}`,
        description: payload.remark,
        user: currentUser,
      });
    }

    const updated = await db.query.workOrders.findFirst({ where: eq(schema.workOrders.id, id) });
    return ok(c, updated);
  }
);

app.get('/:id/kit-check', async (c) => {
  const id = parseInt(c.req.param('id'));
  const order = await db.query.workOrders.findFirst({
    where: eq(schema.workOrders.id, id),
    with: {
      workOrderMaterials: { with: { material: true } },
    },
  });
  if (!order) return fail(c, '工单不存在', 404);

  const materialIds = order.workOrderMaterials.map((m) => m.materialId);
  const alternativesMap = new Map<number, typeof schema.alternativeMaterials.$inferSelect[]>();
  if (materialIds.length) {
    const alts = await db.query.alternativeMaterials.findMany({
      where: and(inArray(schema.alternativeMaterials.originalMaterialId, materialIds), eq(schema.alternativeMaterials.isApproved, true)),
      with: { alternativeMaterial: true },
    });
    for (const alt of alts) {
      if (!alternativesMap.has(alt.originalMaterialId)) alternativesMap.set(alt.originalMaterialId, []);
      alternativesMap.get(alt.originalMaterialId)!.push(alt);
    }
  }

  const details = order.workOrderMaterials.map((woM) => {
    const { material } = woM;
    const availableStock = material.currentStock - material.reservedStock;
    const shortage = Math.max(0, woM.requiredQuantity - woM.allocatedQuantity);
    const isKitted = shortage === 0;
    const alts = alternativesMap.get(material.id) || [];
    const altCanCover = alts.some((a) => a.alternativeMaterial.currentStock - a.alternativeMaterial.reservedStock >= shortage * Number(a.conversionRatio));

    return {
      id: woM.id,
      materialId: material.id,
      materialCode: material.materialCode,
      materialName: material.materialName,
      specification: material.specification,
      unit: material.unit,
      required: woM.requiredQuantity,
      allocated: woM.allocatedQuantity,
      shortage,
      isKitted,
      availableStock,
      currentStock: material.currentStock,
      status: isKitted ? '齐套' : shortage <= availableStock ? '可分配' : altCanCover ? '缺料（有替代料）' : '缺料',
      isShortage: !isKitted && shortage > availableStock && !altCanCover,
      hasAlternative: alts.length > 0,
      alternatives: alts.map((a) => ({
        id: a.id,
        materialCode: a.alternativeMaterial.materialCode,
        materialName: a.alternativeMaterial.materialName,
        available: a.alternativeMaterial.currentStock - a.alternativeMaterial.reservedStock,
        conversionRatio: a.conversionRatio,
      })),
      shortageNote: woM.shortageNote,
      latestDeliveryDate: material.latestDeliveryDate,
      supplier: material.supplier,
    };
  });

  const totalItems = details.length;
  const kittedItems = details.filter((d) => d.isKitted).length;
  const shortageItems = details.filter((d) => d.isShortage).length;
  const altCoverItems = details.filter((d) => d.hasAlternative && d.isShortage === false && !d.isKitted).length;
  const isAllKitted = shortageItems === 0 && kittedItems === totalItems;

  return ok(c, {
    orderId: id,
    orderNo: order.orderNo,
    productName: order.productName,
    summary: {
      totalItems,
      kittedItems,
      shortageItems,
      altCoverItems,
      kittedRate: totalItems ? Math.round((kittedItems / totalItems) * 100) : 0,
      isAllKitted,
    },
    details,
  });
});

app.delete('/:id', requireAdmin(), async (c) => {
  const id = parseInt(c.req.param('id'));
  const existing = await db.query.workOrders.findFirst({ where: eq(schema.workOrders.id, id) });
  if (!existing) return fail(c, '工单不存在', 404);
  await db.delete(schema.workOrders).where(eq(schema.workOrders.id, id));
  return ok(c, { deleted: true, id });
});

export default app;
