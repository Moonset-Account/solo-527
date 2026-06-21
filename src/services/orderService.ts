import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';
import { generateOrderNo } from '@/lib/utils';
import type { OrderStatus, ItemType } from '@prisma/client';

export interface CreateOrderData {
  customerId: string;
  vehicleId: string;
  repairType: string;
  faultDescription: string;
  estimatedDelivery: Date;
  items: {
    type: ItemType;
    name: string;
    partId?: string;
    quantity: number;
    unitPrice: number;
  }[];
  processes: {
    step: number;
    name: string;
    description?: string;
  }[];
  createdBy: string;
}

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const CACHE_PREFIX = 'order:list:';
const CACHE_TTL = 120;

export const orderService = {
  async list(params: OrderListParams = {}) {
    const { page = 1, pageSize = 20, status, search, dateFrom, dateTo } = params;
    const cacheKey = `${CACHE_PREFIX}${page}:${pageSize}:${status || 'all'}:${search || ''}`;

    const cached = await cache.get<{ orders: unknown[]; total: number }>(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { vehicle: { plateNumber: { contains: search } } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.createdAt as Record<string, Date>).lte = dateTo;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } },
          vehicle: { select: { plateNumber: true, brand: true, model: true } },
          technician: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    const result = { orders, total };
    await cache.set(cacheKey, result, CACHE_TTL);
    return result;
  },

  async getById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        items: true,
        processes: {
          orderBy: { step: 'asc' },
          include: { technician: { select: { name: true } } },
        },
        qualityChecks: {
          include: {
            inspector: { select: { name: true } },
            failedItems: true,
          },
          orderBy: { checkedAt: 'desc' },
        },
        creator: { select: { name: true } },
        technician: { select: { name: true } },
      },
    });
  },

  async create(data: CreateOrderData) {
    const orderNo = generateOrderNo();
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const order = await prisma.order.create({
      data: {
        orderNo,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        status: 'pending',
        repairType: data.repairType,
        faultDescription: data.faultDescription,
        estimatedDelivery: data.estimatedDelivery,
        totalAmount,
        createdBy: data.createdBy,
        items: {
          create: data.items.map((item) => ({
            ...item,
            amount: item.quantity * item.unitPrice,
          })),
        },
        processes: {
          create: data.processes.map((p) => ({
            ...p,
            status: 'pending',
          })),
        },
      },
      include: { items: true, processes: true },
    });

    await this.invalidateCache();
    return order;
  },

  async updateStatus(id: string, status: OrderStatus) {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    if (status === 'completed') {
      await prisma.order.update({
        where: { id },
        data: { actualDelivery: new Date() },
      });
    }

    await this.invalidateCache();
    return order;
  },

  async assignTechnician(id: string, technicianId: string) {
    const order = await prisma.order.update({
      where: { id },
      data: { technicianId },
    });
    await this.invalidateCache();
    return order;
  },

  async updateProcessStatus(
    processId: string,
    status: 'pending' | 'in_progress' | 'completed',
    technicianId?: string
  ) {
    const data: Record<string, unknown> = { status };
    if (technicianId) data.technicianId = technicianId;
    if (status === 'in_progress') data.startedAt = new Date();
    if (status === 'completed') data.completedAt = new Date();

    return prisma.orderProcess.update({
      where: { id: processId },
      data,
    });
  },

  async getDeliveryList() {
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return prisma.order.findMany({
      where: {
        status: { in: ['pending', 'in_progress', 'quality_check'] },
        estimatedDelivery: { lte: sevenDaysLater },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { plateNumber: true, brand: true, model: true } },
      },
      orderBy: { estimatedDelivery: 'asc' },
    });
  },

  async invalidateCache() {
    await cache.delPattern(`${CACHE_PREFIX}*`);
    await cache.del('dashboard:data');
  },
};
