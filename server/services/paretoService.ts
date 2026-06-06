import { prisma } from '../utils/db';
import type { FilterParams, ParetoResponse } from '@shared/types';

type ParetoDimension = 'category' | 'supplier' | 'store';

export async function getParetoData(
  filters: FilterParams, 
  dimension: ParetoDimension = 'category'
): Promise<ParetoResponse> {
  const startDate = new Date(filters.startDate);
  const endDate = new Date(filters.endDate);

  const lossWhere: any = {
    lossDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (filters.storeIds?.length) {
    lossWhere.inventory = { storeId: { in: filters.storeIds } };
  }
  if (filters.supplierIds?.length) {
    lossWhere.inventory = { ...lossWhere.inventory, supplierId: { in: filters.supplierIds } };
  }
  if (filters.categoryIds?.length) {
    lossWhere.inventory = { 
      ...lossWhere.inventory, 
      product: { categoryId: { in: filters.categoryIds } } 
    };
  }

  const losses = await prisma.factLoss.findMany({
    where: lossWhere,
    include: {
      inventory: {
        include: {
          product: true,
          store: true,
          supplier: true,
        },
      },
    },
  });

  const groupedData = new Map<string, { name: string; lossAmount: number; lossQty: number }>();

  losses.forEach((loss: any) => {
    let id: string;
    let name: string;

    switch (dimension) {
      case 'category':
        id = loss.inventory.product.categoryId;
        name = loss.inventory.product.categoryName;
        break;
      case 'supplier':
        id = loss.inventory.supplier.supplierId;
        name = loss.inventory.supplier.supplierName;
        break;
      case 'store':
        id = loss.inventory.store.storeId;
        name = loss.inventory.store.storeName;
        break;
    }

    const existing = groupedData.get(id) || { name, lossAmount: 0, lossQty: 0 };
    existing.lossAmount += loss.lossAmount.toNumber();
    existing.lossQty += loss.lossQty;
    groupedData.set(id, existing);
  });

  const sortedItems = Array.from(groupedData.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      lossAmount: data.lossAmount,
      lossQty: data.lossQty,
      cumulativePercent: 0,
    }))
    .sort((a, b) => b.lossAmount - a.lossAmount);

  const totalLossAmount = sortedItems.reduce((sum, item) => sum + item.lossAmount, 0);
  let cumulative = 0;
  
  sortedItems.forEach((item) => {
    cumulative += item.lossAmount;
    item.cumulativePercent = totalLossAmount > 0 ? (cumulative / totalLossAmount) * 100 : 0;
  });

  return {
    items: sortedItems,
    totalLossAmount,
  };
}
