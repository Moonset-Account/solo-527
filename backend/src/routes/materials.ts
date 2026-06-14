import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, like, desc, asc, count, or, inArray } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { getCurrentUser, requireAdmin } from '../middleware/auth';
import { ok, fail, getPageParams, createTimelineEvent } from '../utils';

const app = new Hono();

app.get('/', async (c) => {
  const query = c.req.query();
  const { page, pageSize, offset } = getPageParams(query);
  const keyword = query.keyword;
  const status = query.status as typeof schema.materialStatusEnum.enumValues[number] | undefined;
  const shortage = query.shortage === 'true';

  const conditions = [];
  if (status) conditions.push(eq(schema.materials.status, status));
  if (keyword) {
    conditions.push(
      or(
        like(schema.materials.materialCode, `%${keyword}%`),
        like(schema.materials.materialName, `%${keyword}%`),
        like(schema.materials.specification, `%${keyword}%`)
      )
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  let baseQuery = db
    .select()
    .from(schema.materials)
    .orderBy(desc(schema.materials.updatedAt))
    .limit(pageSize)
    .offset(offset)
    .$dynamic();

  if (whereClause) baseQuery = baseQuery.where(whereClause);

  const [materials, totalResult] = await Promise.all([
    baseQuery,
    db.select({ count: count() }).from(schema.materials).where(whereClause),
  ]);

  const enriched = materials.map((m) => {
    const available = m.currentStock - m.reservedStock;
    const belowSafety = available < m.safetyStock;
    return {
      ...m,
      availableStock: available,
      isBelowSafety: belowSafety,
      shortageQuantity: Math.max(0, m.safetyStock - available),
    };
  });

  const finalList = shortage ? enriched.filter((m) => m.isBelowSafety || m.status === 'out_of_stock' || m.status === 'insufficient') : enriched;

  return ok(c, finalList, { total: shortage ? finalList.length : totalResult[0].count, page, pageSize });
});

app.get('/shortage-summary', async (c) => {
  const materials = await db.select().from(schema.materials);
  const woMaterials = await db.query.workOrderMaterials.findMany({
    where: eq(schema.workOrderMaterials.isKitted, false),
    with: {
      workOrder: { columns: { id: true, orderNo: true, productName: true, deliveryDate: true, status: true } },
      material: true,
    },
  });

  const shortageItems = woMaterials
    .filter((wom) => {
      const available = wom.material.currentStock - wom.material.reservedStock;
      return wom.allocatedQuantity < wom.requiredQuantity && available < wom.requiredQuantity - wom.allocatedQuantity;
    })
    .map((wom) => {
      const shortage = wom.requiredQuantity - wom.allocatedQuantity;
      const available = wom.material.currentStock - wom.material.reservedStock;
      return {
        id: wom.id,
        workOrderId: wom.workOrder.id,
        orderNo: wom.workOrder.orderNo,
        productName: wom.workOrder.productName,
        deliveryDate: wom.workOrder.deliveryDate,
        orderStatus: wom.workOrder.status,
        materialId: wom.material.id,
        materialCode: wom.material.materialCode,
        materialName: wom.material.materialName,
        required: wom.requiredQuantity,
        allocated: wom.allocatedQuantity,
        shortage,
        available,
        shortageNote: wom.shortageNote,
        supplier: wom.material.supplier,
        latestDeliveryDate: wom.material.latestDeliveryDate,
        leadTimeDays: wom.material.leadTimeDays,
      };
    })
    .sort((a, b) => {
      const da = a.deliveryDate?.getTime() || Infinity;
      const db = b.deliveryDate?.getTime() || Infinity;
      return da - db;
    });

  const materialGroup = new Map<number, { material: typeof schema.materials.$inferSelect; shortageTotal: number; affectedOrders: number }>();
  for (const item of shortageItems) {
    const existing = materialGroup.get(item.materialId);
    if (existing) {
      existing.shortageTotal += item.shortage;
      existing.affectedOrders++;
    } else {
      const mat = materials.find((m) => m.id === item.materialId)!;
      materialGroup.set(item.materialId, { material: mat, shortageTotal: item.shortage, affectedOrders: 1 });
    }
  }

  return ok(c, {
    byWorkOrder: shortageItems,
    byMaterial: Array.from(materialGroup.values()).sort((a, b) => b.shortageTotal - a.shortageTotal),
    summary: {
      totalShortageItems: shortageItems.length,
      affectedWorkOrders: new Set(shortageItems.map((s) => s.workOrderId)).size,
      totalMaterialTypes: materialGroup.size,
      highRiskItems: shortageItems.filter((s) => {
        if (!s.deliveryDate) return false;
        const days = (s.deliveryDate.getTime() - Date.now()) / 86400000;
        return days < 5;
      }).length,
    },
  });
});

app.get('/:id/alternatives', async (c) => {
  const id = parseInt(c.req.param('id'));
  const alternatives = await db.query.alternativeMaterials.findMany({
    where: eq(schema.alternativeMaterials.originalMaterialId, id),
    with: {
      alternativeMaterial: true,
      approvedByUser: { columns: { id: true, realName: true } },
    },
    orderBy: [asc(schema.alternativeMaterials.priority)],
  });
  return ok(c, alternatives);
});

app.post(
  '/alternatives/apply',
  zValidator(
    'json',
    z.object({
      workOrderMaterialId: z.number().int(),
      alternativeMaterialId: z.number().int(),
      quantity: z.number().int().positive(),
      note: z.string().optional(),
    })
  ),
  async (c) => {
    const payload = c.req.valid('json');
    const currentUser = getCurrentUser(c);

    const woMaterial = await db.query.workOrderMaterials.findFirst({
      where: eq(schema.workOrderMaterials.id, payload.workOrderMaterialId),
      with: { workOrder: true, material: true },
    });
    if (!woMaterial) return fail(c, '工单物料记录不存在', 404);

    const alternative = await db.query.alternativeMaterials.findFirst({
      where: and(eq(schema.alternativeMaterials.originalMaterialId, woMaterial.materialId), eq(schema.alternativeMaterials.alternativeMaterialId, payload.alternativeMaterialId), eq(schema.alternativeMaterials.isApproved, true)),
      with: { alternativeMaterial: true },
    });
    if (!alternative) return fail(c, '替代料关系不存在或未审批');

    const altStock = alternative.alternativeMaterial.currentStock - alternative.alternativeMaterial.reservedStock;
    if (altStock < payload.quantity) return fail(c, '替代料库存不足');

    await db
      .update(schema.workOrderMaterials)
      .set({
        allocatedQuantity: woMaterial.allocatedQuantity + Math.ceil(payload.quantity / Number(alternative.conversionRatio)),
        usedAlternativeId: alternative.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.workOrderMaterials.id, woMaterial.id));

    await db
      .update(schema.materials)
      .set({
        reservedStock: alternative.alternativeMaterial.reservedStock + payload.quantity,
        updatedAt: new Date(),
      })
      .where(eq(schema.materials.id, payload.alternativeMaterialId));

    const updatedWoM = await db.query.workOrderMaterials.findFirst({ where: eq(schema.workOrderMaterials.id, payload.workOrderMaterialId) });
    if (updatedWoM && updatedWoM.allocatedQuantity >= updatedWoM.requiredQuantity) {
      await db
        .update(schema.workOrderMaterials)
        .set({ isKitted: true, updatedAt: new Date() })
        .where(eq(schema.workOrderMaterials.id, payload.workOrderMaterialId));
    }

    await createTimelineEvent({
      workOrderId: woMaterial.workOrderId,
      eventType: 'alternative_material_used',
      title: `替代料使用：${woMaterial.material.materialCode} → ${alternative.alternativeMaterial.materialCode}`,
      description: `使用替代料 ${alternative.alternativeMaterial.materialName} ${payload.quantity}${alternative.alternativeMaterial.unit}，${payload.note || ''}`,
      metadata: { originalMaterialId: woMaterial.materialId, alternativeMaterialId: payload.alternativeMaterialId, quantity: payload.quantity },
      user: currentUser,
    });

    return ok(c, { success: true, message: '替代料已分配' });
  }
);

app.post('/', requireAdmin(), zValidator(
    'json',
    z.object({
      materialCode: z.string().min(1),
      materialName: z.string().min(1),
      specification: z.string().optional(),
      unit: z.string().default('件'),
      currentStock: z.number().int().default(0),
      safetyStock: z.number().int().default(0),
      supplier: z.string().optional(),
      leadTimeDays: z.number().int().default(7),
      remark: z.string().optional(),
    })
  ), async (c) => {
  const payload = c.req.valid('json');
  const existing = await db.query.materials.findFirst({ where: eq(schema.materials.materialCode, payload.materialCode) });
  if (existing) return fail(c, '物料编码已存在');
  const [inserted] = await db.insert(schema.materials).values(payload).returning();
  return ok(c, inserted);
});

export default app;
