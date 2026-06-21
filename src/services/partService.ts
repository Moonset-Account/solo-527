import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';
import * as XLSX from 'xlsx';

export interface PartListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  lowStockOnly?: boolean;
}

export interface StockRecordParams {
  page?: number;
  pageSize?: number;
  partId?: string;
  type?: 'in' | 'out' | 'adjust' | 'check';
  dateFrom?: Date;
  dateTo?: Date;
}

const CACHE_PREFIX = 'part:';
const CACHE_TTL = 300;

export const partService = {
  async list(params: PartListParams = {}) {
    const { page = 1, pageSize = 20, category, search, lowStockOnly } = params;
    const cacheKey = `${CACHE_PREFIX}list:${page}:${pageSize}:${category || ''}:${search || ''}:${lowStockOnly || ''}`;

    const cached = await cache.get<{ parts: unknown[]; total: number }>(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {};

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { brand: { contains: search } },
      ];
    }
    if (lowStockOnly) {
      where.stock = { lte: prisma.part.fields.minStock };
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        include: { supplier: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.part.count({ where }),
    ]);

    const result = { parts, total };
    await cache.set(cacheKey, result, CACHE_TTL);
    return result;
  },

  async getById(id: string) {
    const cacheKey = `${CACHE_PREFIX}detail:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const part = await prisma.part.findUnique({
      where: { id },
      include: { supplier: true, priceList: true, stockRecords: { take: 10, orderBy: { createdAt: 'desc' } } },
    });

    if (part) await cache.set(cacheKey, part, CACHE_TTL);
    return part;
  },

  async create(data: {
    sku: string;
    name: string;
    category: string;
    brand: string;
    spec: string;
    unit: string;
    costPrice: number;
    salePrice: number;
    stock: number;
    minStock: number;
    maxStock: number;
    supplierId: string;
  }) {
    const part = await prisma.part.create({ data });
    await this.invalidateCache();
    return part;
  },

  async update(id: string, data: Partial<{
    name: string;
    category: string;
    brand: string;
    spec: string;
    unit: string;
    costPrice: number;
    salePrice: number;
    minStock: number;
    maxStock: number;
    supplierId: string;
  }>) {
    const part = await prisma.part.update({ where: { id }, data });
    await this.invalidateCache();
    return part;
  },

  async stockIn(partId: string, quantity: number, operatorId: string, orderId?: string, remark?: string) {
    const part = await prisma.part.findUnique({ where: { id: partId } });
    if (!part) throw new Error('配件不存在');

    const afterStock = part.stock + quantity;

    const [record, updatedPart] = await Promise.all([
      prisma.stockRecord.create({
        data: {
          partId,
          type: 'in',
          quantity,
          beforeStock: part.stock,
          afterStock,
          orderId,
          remark,
          operatorId,
        },
      }),
      prisma.part.update({
        where: { id: partId },
        data: { stock: afterStock },
      }),
    ]);

    await this.invalidateCache();
    return { record, part: updatedPart };
  },

  async stockOut(partId: string, quantity: number, operatorId: string, orderId?: string, remark?: string) {
    const part = await prisma.part.findUnique({ where: { id: partId } });
    if (!part) throw new Error('配件不存在');
    if (part.stock < quantity) throw new Error('库存不足');

    const afterStock = part.stock - quantity;

    const [record, updatedPart] = await Promise.all([
      prisma.stockRecord.create({
        data: {
          partId,
          type: 'out',
          quantity,
          beforeStock: part.stock,
          afterStock,
          orderId,
          remark,
          operatorId,
        },
      }),
      prisma.part.update({
        where: { id: partId },
        data: { stock: afterStock },
      }),
    ]);

    await this.invalidateCache();
    return { record, part: updatedPart };
  },

  async stockRecords(params: StockRecordParams = {}) {
    const { page = 1, pageSize = 20, partId, type, dateFrom, dateTo } = params;

    const where: Record<string, unknown> = {};
    if (partId) where.partId = partId;
    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.createdAt as Record<string, Date>).lte = dateTo;
    }

    const [records, total] = await Promise.all([
      prisma.stockRecord.findMany({
        where,
        include: {
          part: { select: { name: true, sku: true } },
          operator: { select: { name: true } },
          order: { select: { orderNo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.stockRecord.count({ where }),
    ]);

    return { records, total };
  },

  async getTurnoverAnalysis() {
    const cacheKey = `${CACHE_PREFIX}turnover`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const parts = await prisma.part.findMany({
      include: {
        _count: { select: { stockRecords: true } },
      },
      orderBy: { stock: 'asc' },
    });

    const result = parts.map((part) => {
      const turnoverRate = part._count.stockRecords > 0
        ? (part._count.stockRecords / 30) / Math.max(part.stock, 1)
        : 0;
      return {
        ...part,
        turnoverRate: Number(turnoverRate.toFixed(3)),
        isLowStock: part.stock <= part.minStock,
        isOverStock: part.stock >= part.maxStock,
      };
    });

    await cache.set(cacheKey, result, CACHE_TTL);
    return result;
  },

  async exportParts(format: 'xlsx' | 'csv' = 'xlsx') {
    const parts = await prisma.part.findMany({
      include: { supplier: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });

    const data = parts.map((p) => ({
      SKU: p.sku,
      名称: p.name,
      分类: p.category,
      品牌: p.brand,
      规格: p.spec,
      单位: p.unit,
      成本价: Number(p.costPrice),
      售价: Number(p.salePrice),
      库存: p.stock,
      最低库存: p.minStock,
      最高库存: p.maxStock,
      供应商: p.supplier.name,
    }));

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '配件清单');
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    return data;
  },

  async getCategories() {
    const parts = await prisma.part.findMany({ distinct: ['category'], select: { category: true } });
    return parts.map((p) => p.category);
  },

  async getLowStockParts() {
    return prisma.part.findMany({
      where: { stock: { lte: prisma.part.fields.minStock } },
      orderBy: { stock: 'asc' },
      take: 20,
    });
  },

  async invalidateCache() {
    await cache.delPattern(`${CACHE_PREFIX}*`);
    await cache.del('dashboard:data');
    await cache.del('stock:alert');
  },
};
