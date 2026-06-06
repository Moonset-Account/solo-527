import { prisma } from '../utils/db';
import type { FilterParams, OverviewResponse, Anomaly } from '@shared/types';
import { ANOMALY_THRESHOLDS } from '../../scripts/metrics/definitions';

export async function getOverviewData(filters: FilterParams): Promise<OverviewResponse> {
  const [anomalies, summary] = await Promise.all([
    detectAnomalies(filters),
    getSummaryMetrics(filters),
  ]);

  return { anomalies, summary };
}

function buildInventoryWhere(filters: FilterParams, startDate: Date, endDate: Date) {
  const where: any = {
    receiveDate: { gte: startDate, lte: endDate },
  };
  if (filters.storeIds?.length) {
    where.storeId = { in: filters.storeIds };
  }
  if (filters.supplierIds?.length) {
    where.supplierId = { in: filters.supplierIds };
  }
  if (filters.categoryIds?.length) {
    where.product = { categoryId: { in: filters.categoryIds } };
  }
  if (filters.batchIds?.length) {
    where.batchId = { in: filters.batchIds };
  }
  return where;
}

function buildLossWhere(filters: FilterParams, startDate: Date, endDate: Date) {
  const where: any = {
    lossDate: { gte: startDate, lte: endDate },
  };
  if (filters.storeIds?.length || filters.supplierIds?.length || filters.categoryIds?.length || filters.batchIds?.length) {
    where.inventory = {};
    if (filters.storeIds?.length) {
      where.inventory.storeId = { in: filters.storeIds };
    }
    if (filters.supplierIds?.length) {
      where.inventory.supplierId = { in: filters.supplierIds };
    }
    if (filters.categoryIds?.length) {
      where.inventory.product = { categoryId: { in: filters.categoryIds } };
    }
    if (filters.batchIds?.length) {
      where.inventory.batchId = { in: filters.batchIds };
    }
  }
  return where;
}

async function getSummaryMetrics(filters: FilterParams) {
  const startDate = new Date(filters.startDate);
  const endDate = new Date(filters.endDate);

  const inventoryWhere = buildInventoryWhere(filters, startDate, endDate);
  const lossWhere = buildLossWhere(filters, startDate, endDate);

  const [inventories, losses, promos] = await Promise.all([
    prisma.factInventory.findMany({
      where: inventoryWhere,
      include: { product: true, lossRecords: true },
    }),
    prisma.factLoss.aggregate({
      where: lossWhere,
      _sum: { lossAmount: true, lossQty: true },
    }),
    prisma.factPromotion.findMany({
      where: {
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
        ],
        ...(filters.batchIds?.length || filters.storeIds?.length || filters.supplierIds?.length || filters.categoryIds?.length
          ? {
              inventory: {
                ...(filters.batchIds?.length ? { batchId: { in: filters.batchIds } } : {}),
                ...(filters.storeIds?.length ? { storeId: { in: filters.storeIds } } : {}),
                ...(filters.supplierIds?.length ? { supplierId: { in: filters.supplierIds } } : {}),
                ...(filters.categoryIds?.length ? { product: { categoryId: { in: filters.categoryIds } } } : {}),
              },
            }
          : {}),
      },
      select: { soldQty: true },
    }),
  ]);

  const totalLoss = losses._sum.lossAmount?.toNumber() || 0;
  const totalLossQty = losses._sum.lossQty || 0;
  const totalReceivedQty = inventories.reduce((sum, inv) => sum + inv.receivedQty, 0);
  const lossRate = totalReceivedQty > 0 ? totalLossQty / totalReceivedQty : 0;

  const nearExpiryCount = inventories.filter((inv: any) => {
    const shelfLifeMs = inv.product.shelfLifeDays * 24 * 60 * 60 * 1000;
    const elapsedMs = endDate.getTime() - inv.receiveDate.getTime();
    return elapsedMs / shelfLifeMs > 0.7;
  }).length;

  const totalSoldQty = promos.reduce((sum, p) => sum + p.soldQty, 0);
  const promotionEffectiveness = totalReceivedQty > 0 ? totalSoldQty / totalReceivedQty : 0;

  return {
    totalLoss: Math.round(totalLoss * 100) / 100,
    lossRate: Math.round(lossRate * 10000) / 100,
    nearExpiryCount,
    promotionEffectiveness: Math.round(promotionEffectiveness * 10000) / 100,
  };
}

async function detectAnomalies(filters: FilterParams): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const startDate = new Date(filters.startDate);
  const endDate = new Date(filters.endDate);

  const lossWhere = buildLossWhere(filters, startDate, endDate);
  const inventoryWhere = buildInventoryWhere(filters, startDate, endDate);

  const [losses, inventories, categories] = await Promise.all([
    prisma.factLoss.findMany({
      where: lossWhere,
      include: { inventory: { include: { product: true } } },
    }),
    prisma.factInventory.findMany({
      where: inventoryWhere,
      include: { product: true, lossRecords: true },
    }),
    prisma.dimProduct.findMany({
      distinct: ['categoryId'],
      select: { categoryId: true, categoryName: true },
    }),
  ]);

  const threshold = ANOMALY_THRESHOLDS.high_loss.critical;

  for (const cat of categories) {
    const catInventories = inventories.filter((inv: any) => inv.product.categoryId === cat.categoryId);
    const catLosses = losses.filter((l: any) => l.inventory.product.categoryId === cat.categoryId);
    
    const totalReceived = catInventories.reduce((sum, inv) => sum + inv.receivedQty, 0);
    const totalLossQty = catLosses.reduce((sum, l) => sum + l.lossQty, 0);
    const lossRate = totalReceived > 0 ? totalLossQty / totalReceived : 0;

    if (lossRate > threshold) {
      anomalies.push({
        id: `loss_${cat.categoryId}`,
        type: 'high_loss',
        title: `${cat.categoryName}损耗异常偏高`,
        description: `当前筛选范围内${cat.categoryName}损耗率达${Math.round(lossRate * 100)}%，超出阈值${Math.round(threshold * 100)}%`,
        severity: lossRate > threshold * 1.5 ? 'high' : 'medium',
        metric: {
          value: Math.round(lossRate * 1000) / 10,
          unit: '%',
          change: Math.round((lossRate - threshold) / threshold * 100),
        },
        filterContext: { categoryIds: [cat.categoryId] },
      });
    }
  }

  const nearExpiryList = inventories.filter((inv: any) => {
    const shelfLifeMs = inv.product.shelfLifeDays * 24 * 60 * 60 * 1000;
    const elapsedMs = endDate.getTime() - inv.receiveDate.getTime();
    return elapsedMs / shelfLifeMs > 0.7;
  });

  if (nearExpiryList.length > 0) {
    const byBatch: Record<string, number> = {};
    nearExpiryList.forEach((inv: any) => {
      byBatch[inv.batchId] = (byBatch[inv.batchId] || 0) + inv.remainingQty;
    });
    const nearExpiryBatches = Object.keys(byBatch).length;

    anomalies.push({
      id: 'near_expiry',
      type: 'near_expiry',
      title: `${nearExpiryBatches}批次商品即将临期`,
      description: `当前筛选范围内未来7天内有${nearExpiryBatches}个批次商品将到达保质期70%，涉及${nearExpiryList.length}件库存`,
      severity: nearExpiryBatches > 20 ? 'high' : nearExpiryBatches > 10 ? 'medium' : 'low',
      metric: { value: nearExpiryBatches, unit: '批次', change: 0 },
      filterContext: {},
    });
  }

  const totalReceived = inventories.reduce((sum, inv) => sum + inv.receivedQty, 0);
  const promoInventories = inventories.filter((inv: any) => inv.remainingQty < inv.receivedQty * 0.5);
  if (totalReceived > 0 && promoInventories.length / inventories.length < 0.3) {
    anomalies.push({
      id: 'poor_promotion',
      type: 'poor_promotion',
      title: '促销消化率偏低',
      description: `当前筛选范围内库存消化率仅${Math.round(promoInventories.length / inventories.length * 100)}%，建议加大促销力度`,
      severity: 'medium',
      metric: {
        value: Math.round(promoInventories.length / inventories.length * 100),
        unit: '%',
        change: -15,
      },
      filterContext: {},
    });
  }

  return anomalies.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.severity] - priority[b.severity];
  });
}
