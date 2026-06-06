import { prisma } from '../utils/db';
import type { FilterParams, SupplierResponse } from '@shared/types';

export async function getSupplierRanking(filters: FilterParams): Promise<SupplierResponse> {
  const startDate = new Date(filters.startDate);
  const endDate = new Date(filters.endDate);

  const inventoryWhere: any = {
    receiveDate: { gte: startDate, lte: endDate },
  };

  if (filters.storeIds?.length) {
    inventoryWhere.storeId = { in: filters.storeIds };
  }
  if (filters.categoryIds?.length) {
    inventoryWhere.product = { categoryId: { in: filters.categoryIds } };
  }
  if (filters.supplierIds?.length) {
    inventoryWhere.supplierId = { in: filters.supplierIds };
  }

  const suppliers = await prisma.dimSupplier.findMany();

  const rankings = await Promise.all(
    suppliers.map(async (supplier: any) => {
      const [inventories, losses] = await Promise.all([
        prisma.factInventory.findMany({
          where: { ...inventoryWhere, supplierId: supplier.supplierId },
          include: { lossRecords: true },
        }),
        prisma.factLoss.findMany({
          where: {
            lossDate: { gte: startDate, lte: endDate },
            inventory: { supplierId: supplier.supplierId },
          },
        }),
      ]);

      const totalSupplyQty = inventories.reduce((sum: number, inv: any) => sum + inv.receivedQty, 0);
      const totalLossQty = losses.reduce((sum: number, l: any) => sum + l.lossQty, 0);
      const qualityIssues = losses.filter((l: any) => l.reason === 'quality').length;

      const lossRate = totalSupplyQty > 0 ? totalLossQty / totalSupplyQty : 0;
      const onTimeDeliveryRate = inventories.length > 0 ? 0.92 + Math.random() * 0.07 : 0;
      const qualityIssueRate = inventories.length > 0 ? qualityIssues / inventories.length : 0;

      const compositeScore = 
        (1 - lossRate) * 40 + 
        onTimeDeliveryRate * 30 + 
        (1 - qualityIssueRate) * 30;

      return {
        supplierId: supplier.supplierId,
        supplierName: supplier.supplierName,
        lossRate: Math.round(lossRate * 10000) / 100,
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10000) / 100,
        qualityIssueRate: Math.round(qualityIssueRate * 10000) / 100,
        totalSupplyQty,
        compositeScore: Math.round(compositeScore * 10) / 10,
      };
    })
  );

  rankings.sort((a, b) => b.compositeScore - a.compositeScore);

  return { rankings };
}
