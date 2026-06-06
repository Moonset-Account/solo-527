import { prisma } from '../utils/db';
import type { FilterParams, FilterOptionsResponse } from '@shared/types';

export async function getFilterOptions(): Promise<FilterOptionsResponse> {
  const [stores, products, suppliers, batches] = await Promise.all([
    prisma.dimStore.findMany({ select: { storeId: true, storeName: true } }),
    prisma.dimProduct.findMany({ 
      distinct: ['categoryId'],
      select: { categoryId: true, categoryName: true } 
    }),
    prisma.dimSupplier.findMany({ select: { supplierId: true, supplierName: true } }),
    prisma.factInventory.findMany({
      distinct: ['batchId'],
      select: { batchId: true },
      take: 100,
    }),
  ]);

  return {
    stores: stores.map((s: { storeId: string; storeName: string }) => ({ id: s.storeId, name: s.storeName })),
    categories: products.map((p: { categoryId: string; categoryName: string }) => ({ id: p.categoryId, name: p.categoryName })),
    suppliers: suppliers.map((s: { supplierId: string; supplierName: string }) => ({ id: s.supplierId, name: s.supplierName })),
    batches: batches.map((b: { batchId: string }) => ({ id: b.batchId, name: b.batchId })),
  };
}

export function parseFilterParams(query: any): FilterParams {
  return {
    storeIds: query.storeIds ? (Array.isArray(query.storeIds) ? query.storeIds : [query.storeIds]) : undefined,
    categoryIds: query.categoryIds ? (Array.isArray(query.categoryIds) ? query.categoryIds : [query.categoryIds]) : undefined,
    supplierIds: query.supplierIds ? (Array.isArray(query.supplierIds) ? query.supplierIds : [query.supplierIds]) : undefined,
    batchIds: query.batchIds ? (Array.isArray(query.batchIds) ? query.batchIds : [query.batchIds]) : undefined,
    startDate: query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: query.endDate || new Date().toISOString().split('T')[0],
  };
}
