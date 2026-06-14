import { Hono } from 'hono';
import { eq, and, desc, gte, count, or, isNull, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { ok } from '../utils';

const app = new Hono();

app.get('/summary', async (c) => {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);

  const [workOrders, materials, processes, reworks] = await Promise.all([
    db.select().from(schema.workOrders),
    db.select().from(schema.materials),
    db.select().from(schema.processes),
    db.select().from(schema.reworkRecords).where(isNull(schema.reworkRecords.resolvedAt)),
  ]);

  const woByStatus: Record<string, number> = {};
  for (const wo of workOrders) woByStatus[wo.status] = (woByStatus[wo.status] || 0) + 1;

  const riskByLevel: Record<string, number> = {};
  for (const wo of workOrders) riskByLevel[wo.deliveryRisk || 'low'] = (riskByLevel[wo.deliveryRisk || 'low'] || 0) + 1;

  const woMaterials = await db.query.workOrderMaterials.findMany({
    with: { workOrder: { columns: { status: true } }, material: true },
  });

  let kittedCount = 0;
  let shortageCount = 0;
  for (const wom of woMaterials) {
    if (wom.isKitted) kittedCount++;
    else {
      const available = wom.material.currentStock - wom.material.reservedStock;
      if (wom.allocatedQuantity < wom.requiredQuantity && available < wom.requiredQuantity - wom.allocatedQuantity) {
        shortageCount++;
      }
    }
  }

  const matByStatus: Record<string, number> = {};
  let belowSafetyCount = 0;
  for (const m of materials) {
    matByStatus[m.status] = (matByStatus[m.status] || 0) + 1;
    const avail = m.currentStock - m.reservedStock;
    if (avail < m.safetyStock) belowSafetyCount++;
  }

  const procByStatus: Record<string, number> = {};
  for (const p of processes) procByStatus[p.status] = (procByStatus[p.status] || 0) + 1;

  const timeoutRisk = reworks.filter(r => r.deadlineAt && r.deadlineAt < now && !r.resolvedAt).length;
  const warningRisk = reworks.filter(r => {
    if (!r.deadlineAt || r.resolvedAt) return false;
    const diff = r.deadlineAt.getTime() - now.getTime();
    return diff >= 0 && diff < 4 * 3600000;
  }).length;

  const upcomingDeliveries = workOrders
    .filter(w => w.deliveryDate && w.deliveryDate <= sevenDaysLater && w.status !== 'completed' && w.status !== 'cancelled')
    .sort((a, b) => (a.deliveryDate?.getTime() || 0) - (b.deliveryDate?.getTime() || 0));

  return ok(c, {
    workOrders: {
      total: workOrders.length,
      byStatus: woByStatus,
      pending: woByStatus['pending'] || 0,
      inProgress: woByStatus['in_progress'] || 0,
      materialReady: woByStatus['material_ready'] || 0,
      completed: woByStatus['completed'] || 0,
      delayed: woByStatus['delayed'] || 0,
      deliveryRiskByLevel: riskByLevel,
      highRiskCount: (riskByLevel['high'] || 0) + (riskByLevel['critical'] || 0),
      upcomingDeliveries: upcomingDeliveries.slice(0, 10),
    },
    materials: {
      total: materials.length,
      byStatus: matByStatus,
      belowSafetyCount,
      inStock: matByStatus['in_stock'] || 0,
      insufficient: matByStatus['insufficient'] || 0,
      outOfStock: matByStatus['out_of_stock'] || 0,
      pendingArrival: matByStatus['pending_arrival'] || 0,
    },
    kitCheck: {
      totalMaterialLines: woMaterials.length,
      kittedCount,
      shortageCount,
      kittedRate: woMaterials.length ? Math.round((kittedCount / woMaterials.length) * 100) : 0,
      partialCount: woMaterials.length - kittedCount - shortageCount,
    },
    processes: {
      total: processes.length,
      byStatus: procByStatus,
      pending: procByStatus['pending'] || 0,
      inProgress: procByStatus['in_progress'] || 0,
      completed: procByStatus['completed'] || 0,
      rework: procByStatus['rework'] || 0,
    },
    reworks: {
      unresolved: reworks.length,
      timeoutRisk,
      warningRisk,
      safe: reworks.length - timeoutRisk - warningRisk,
    },
  });
});

app.get('/kitting-board', async (c) => {
  const statuses = ['pending', 'material_ready', 'in_progress'] as const;
  const orders = await db.query.workOrders.findMany({
    where: inArray(schema.workOrders.status, statuses),
    with: {
      workOrderMaterials: { with: { material: true } },
      processes: { orderBy: sql`${schema.processes.sequence} ASC` },
    },
    orderBy: [desc(schema.workOrders.priority), schema.workOrders.deliveryDate],
  });

  const materialIds = Array.from(new Set(orders.flatMap(o => o.workOrderMaterials.map(m => m.materialId))));
  const alternativesMap = new Map<number, typeof schema.alternativeMaterials.$inferSelect[]>();
  if (materialIds.length) {
    const alts = await db.query.alternativeMaterials.findMany({
      where: and(inArray(schema.alternativeMaterials.originalMaterialId, materialIds), eq(schema.alternativeMaterials.isApproved, true)),
      with: { alternativeMaterial: true },
    });
    for (const a of alts) {
      if (!alternativesMap.has(a.originalMaterialId)) alternativesMap.set(a.originalMaterialId, []);
      alternativesMap.get(a.originalMaterialId)!.push(a);
    }
  }

  const rows = orders.map(wo => {
    let totalShortageQty = 0;
    let hasShortage = false;
    let hasAlternative = false;

    const materials = wo.workOrderMaterials.map(wom => {
      const available = wom.material.currentStock - wom.material.reservedStock;
      const shortage = Math.max(0, wom.requiredQuantity - wom.allocatedQuantity);
      const alts = alternativesMap.get(wom.material.id) || [];
      const altAvailable = alts.reduce((sum, a) => sum + (a.alternativeMaterial.currentStock - a.alternativeMaterial.reservedStock), 0);
      const canUseAlt = alts.some(a => (a.alternativeMaterial.currentStock - a.alternativeMaterial.reservedStock) >= shortage * Number(a.conversionRatio));
      if (shortage > 0) totalShortageQty += shortage;
      if (shortage > 0 && available < shortage && !canUseAlt) hasShortage = true;
      if (shortage > 0 && canUseAlt) hasAlternative = true;
      return {
        ...wom,
        available,
        shortage,
        altAvailable,
        canUseAlt,
        alts: alts.map(a => ({
          materialCode: a.alternativeMaterial.materialCode,
          materialName: a.alternativeMaterial.materialName,
          available: a.alternativeMaterial.currentStock - a.alternativeMaterial.reservedStock,
          conversionRatio: a.conversionRatio,
        })),
      };
    });

    const totalItems = materials.length;
    const kittedItems = materials.filter(m => m.isKitted).length;
    const kittedRate = totalItems ? Math.round((kittedItems / totalItems) * 100) : 0;

    let kittingStatus: 'complete' | 'alternative' | 'partial' | 'shortage' = 'complete';
    if (hasShortage) kittingStatus = 'shortage';
    else if (hasAlternative) kittingStatus = 'alternative';
    else if (kittedItems < totalItems) kittingStatus = 'partial';

    const now = new Date();
    let deliveryStatus: 'normal' | 'warning' | 'critical' = 'normal';
    if (wo.deliveryDate) {
      const days = (wo.deliveryDate.getTime() - now.getTime()) / 86400000;
      if (days < 0) deliveryStatus = 'critical';
      else if (days <= 3) deliveryStatus = 'warning';
    }

    return {
      id: wo.id,
      orderNo: wo.orderNo,
      productName: wo.productName,
      productCode: wo.productCode,
      quantity: wo.quantity,
      unit: wo.unit,
      priority: wo.priority,
      status: wo.status,
      deliveryDate: wo.deliveryDate,
      deliveryRisk: wo.deliveryRisk,
      deliveryStatus,
      customer: wo.customer,
      materials,
      processCount: wo.processes.length,
      completedProcesses: wo.processes.filter(p => p.status === 'completed').length,
      kittingStatus,
      totalItems,
      kittedItems,
      kittedRate,
      totalShortageQty,
    };
  });

  const summary = {
    total: rows.length,
    complete: rows.filter(r => r.kittingStatus === 'complete').length,
    alternative: rows.filter(r => r.kittingStatus === 'alternative').length,
    partial: rows.filter(r => r.kittingStatus === 'partial').length,
    shortage: rows.filter(r => r.kittingStatus === 'shortage').length,
  };

  return ok(c, { rows, summary });
});

export default app;
