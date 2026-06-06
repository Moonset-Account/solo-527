import { prisma } from '../utils/db';
import type { FilterParams, PromotionResponse } from '@shared/types';

export async function getPromotionComparison(filters: FilterParams): Promise<PromotionResponse> {
  const startDate = new Date(filters.startDate);
  const endDate = new Date(filters.endDate);

  const categories = await prisma.dimProduct.findMany({
    distinct: ['categoryId'],
    select: {
      categoryId: true,
      categoryName: true,
    },
  });

  const comparisons = await Promise.all(
    categories.map(async (cat: any) => {
      const [beforeData, duringData] = await Promise.all([
        getCategoryStats(cat.categoryId, startDate, endDate, filters, true),
        getCategoryStats(cat.categoryId, startDate, endDate, filters, false),
      ]);

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        beforePeriod: beforeData,
        duringPeriod: duringData,
        improvement: {
          salesChange: duringData.dailyAvgSales > 0 
            ? ((duringData.dailyAvgSales - beforeData.dailyAvgSales) / beforeData.dailyAvgSales) * 100
            : 0,
          lossChange: beforeData.dailyAvgLoss > 0
            ? ((duringData.dailyAvgLoss - beforeData.dailyAvgLoss) / beforeData.dailyAvgLoss) * 100
            : 0,
          expiryRateChange: duringData.nearExpiryRate - beforeData.nearExpiryRate,
        },
      };
    })
  );

  return { comparisons };
}

async function getCategoryStats(
  categoryId: string,
  startDate: Date,
  endDate: Date,
  filters: FilterParams,
  isBefore: boolean
) {
  let periodStart: Date;
  let periodEnd: Date;

  if (isBefore) {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    periodEnd = new Date(startDate);
    periodEnd.setDate(periodEnd.getDate() - 1);
    periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - daysDiff);
  } else {
    periodStart = new Date(startDate);
    periodEnd = new Date(endDate);
  }

  const days = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const inventoryWhere: any = {
    receiveDate: { gte: periodStart, lte: periodEnd },
    product: { categoryId },
  };

  if (filters.storeIds?.length) {
    inventoryWhere.storeId = { in: filters.storeIds };
  }
  if (filters.supplierIds?.length) {
    inventoryWhere.supplierId = { in: filters.supplierIds };
  }
  if (filters.batchIds?.length) {
    inventoryWhere.batchId = { in: filters.batchIds };
  }

  const lossWhere: any = {
    lossDate: { gte: periodStart, lte: periodEnd },
    inventory: { product: { categoryId } },
  };
  if (filters.storeIds?.length) {
    lossWhere.inventory.storeId = { in: filters.storeIds };
  }
  if (filters.supplierIds?.length) {
    lossWhere.inventory.supplierId = { in: filters.supplierIds };
  }
  if (filters.batchIds?.length) {
    lossWhere.inventory.batchId = { in: filters.batchIds };
  }

  const promoWhere: any = {
    OR: [
      { startDate: { gte: periodStart, lte: periodEnd } },
      { endDate: { gte: periodStart, lte: periodEnd } },
      { AND: [{ startDate: { lte: periodStart } }, { endDate: { gte: periodEnd } }] },
    ],
    inventory: { product: { categoryId } },
  };
  if (filters.storeIds?.length) {
    promoWhere.inventory.storeId = { in: filters.storeIds };
  }
  if (filters.supplierIds?.length) {
    promoWhere.inventory.supplierId = { in: filters.supplierIds };
  }
  if (filters.batchIds?.length) {
    promoWhere.inventory.batchId = { in: filters.batchIds };
  }

  const [inventories, losses, promos] = await Promise.all([
    prisma.factInventory.findMany({
      where: inventoryWhere,
      include: { lossRecords: true, promotions: true, product: true },
    }),
    prisma.factLoss.findMany({
      where: lossWhere,
    }),
    prisma.factPromotion.findMany({
      where: promoWhere,
    }),
  ]);

  const totalSales = promos.reduce((sum: number, p: any) => sum + p.soldQty, 0);
      const totalLoss = losses.reduce((sum: number, l: any) => sum + l.lossQty, 0);
      const nearExpiryCount = inventories.filter((inv: any) => {
    const shelfLifeMs = inv.product.shelfLifeDays * 24 * 60 * 60 * 1000;
    const elapsedMs = endDate.getTime() - inv.receiveDate.getTime();
    return elapsedMs / shelfLifeMs > 0.7;
  }).length;

  return {
    dailyAvgSales: totalSales / days,
    dailyAvgLoss: totalLoss / days,
    nearExpiryRate: inventories.length > 0 ? nearExpiryCount / inventories.length : 0,
  };
}
