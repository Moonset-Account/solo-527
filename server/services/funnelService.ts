import { prisma } from '../utils/db';
import type { FilterParams, FunnelResponse, FunnelStageType } from '@shared/types';
import { STAGE_DEFINITIONS } from '../../scripts/metrics/definitions';

export async function getFunnelData(filters: FilterParams): Promise<FunnelResponse> {
  const startDate = new Date(filters.startDate);
  const endDate = new Date(filters.endDate);

  const where: any = {
    receiveDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (filters.storeIds?.length) {
    where.storeId = { in: filters.storeIds };
  }
  if (filters.supplierIds?.length) {
    where.supplierId = { in: filters.supplierIds };
  }
  if (filters.batchIds?.length) {
    where.batchId = { in: filters.batchIds };
  }
  if (filters.categoryIds?.length) {
    where.product = {
      categoryId: { in: filters.categoryIds },
    };
  }

  const inventories = await prisma.factInventory.findMany({
    where,
    include: {
      product: true,
      lossRecords: true,
      promotions: true,
    },
  });

  const now = new Date();
  const stages: FunnelStageType[] = ['received', 'sellable', 'near_expiry', 'promotion', 'written_off', 'returned'];
  
  const stageData = stages.map((stage) => {
    let quantity = 0;
    let amount = 0;
    const batches: any[] = [];

    inventories.forEach((inv: any) => {
      const receivedQty = inv.receivedQty;
      const totalLossQty = inv.lossRecords.reduce((sum: number, l: any) => sum + l.lossQty, 0);
      const promoSoldQty = inv.promotions.reduce((sum: number, p: any) => sum + p.soldQty, 0);
      const remainingQty = receivedQty - totalLossQty - promoSoldQty;
      
      const shelfLifeMs = inv.product.shelfLifeDays * 24 * 60 * 60 * 1000;
      const elapsedMs = now.getTime() - inv.receiveDate.getTime();
      const shelfLifeUsed = elapsedMs / shelfLifeMs;
      
      const writeOffQty = inv.lossRecords
        .filter((l: any) => l.lossType === 'written_off')
        .reduce((sum: number, l: any) => sum + l.lossQty, 0);
      const returnQty = inv.lossRecords
        .filter((l: any) => l.lossType === 'returned')
        .reduce((sum: number, l: any) => sum + l.lossQty, 0);

      let stageQty = 0;
      switch (stage) {
        case 'received':
          stageQty = receivedQty;
          break;
        case 'sellable':
          stageQty = remainingQty > 0 ? remainingQty : 0;
          break;
        case 'near_expiry':
          stageQty = shelfLifeUsed > 0.7 && remainingQty > 0 ? remainingQty : 0;
          break;
        case 'promotion':
          stageQty = promoSoldQty;
          break;
        case 'written_off':
          stageQty = writeOffQty;
          break;
        case 'returned':
          stageQty = returnQty;
          break;
      }

      if (stageQty > 0) {
        quantity += stageQty;
        amount += stageQty * inv.costPrice.toNumber();
        batches.push({
          batchId: inv.batchId,
          skuId: inv.skuId,
          skuName: inv.product.skuName,
          quantity: stageQty,
          expiryDate: inv.expiryDate.toISOString().split('T')[0],
        });
      }
    });

    return {
      stage,
      name: STAGE_DEFINITIONS[stage].name,
      quantity,
      amount,
      conversionRate: 0,
      batches,
    };
  });

  for (let i = 1; i < stageData.length; i++) {
    stageData[i].conversionRate = stageData[i - 1].quantity > 0
      ? stageData[i].quantity / stageData[i - 1].quantity
      : 0;
  }

  return {
    stages: stageData,
    totalBatches: inventories.length,
  };
}
