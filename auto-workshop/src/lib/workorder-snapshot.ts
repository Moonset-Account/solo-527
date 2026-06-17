import { prisma, type TransactionClient } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS } from '@/lib/constants';

type SnapshotItem = { id: string; name: string; category: string; price: string; laborFee: string; status: string; remark: string | null };
type SnapshotPart = { id: string; partId: string; partName: string | undefined; partNo: string | undefined; quantity: number; unitPrice: string; totalPrice: string; status: string };
type SnapshotTestDrive = { id: string; startTime: string; endTime: string | null; driverName: string; mileage: number | null; remark: string | null };
type SnapshotCashier = { id: string; orderNo: string; totalAmount: string; discount: string; finalAmount: string; previousAmount: string | undefined; amountChanged: boolean; changeReason: string | null; paymentStatus: string; paymentMethod: string | null; createdAt: string };

export interface WorkOrderSnapshot {
  status: string;
  totalAmount: string | undefined;
  serviceItems: SnapshotItem[];
  parts: SnapshotPart[];
  testDrives: SnapshotTestDrive[];
  cashierOrders: SnapshotCashier[];
  [key: string]: unknown;
}

async function buildWorkOrderSnapshot(workOrderId: string): Promise<WorkOrderSnapshot> {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      items: true,
      parts: { include: { part: true } },
      testDrives: true,
      cashierOrders: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!workOrder) throw new Error('工单不存在');

  return {
    status: workOrder.status,
    totalAmount: workOrder.totalAmount?.toString(),
    serviceItems: workOrder.items.map((i) => ({
      id: i.id, name: i.name, category: i.category,
      price: i.price.toString(), laborFee: i.laborFee.toString(),
      status: i.status, remark: i.remark,
    })),
    parts: workOrder.parts.map((p) => ({
      id: p.id, partId: p.partId, partName: p.part?.name, partNo: p.part?.partNo,
      quantity: p.quantity, unitPrice: p.unitPrice.toString(), totalPrice: p.totalPrice.toString(),
      status: p.status,
    })),
    testDrives: workOrder.testDrives.map((t) => ({
      id: t.id,
      startTime: typeof t.startTime === 'string' ? t.startTime : t.startTime.toISOString(),
      endTime: t.endTime ? (typeof t.endTime === 'string' ? t.endTime : t.endTime.toISOString()) : null,
      driverName: t.driverName, mileage: t.mileage, remark: t.remark,
    })),
    cashierOrders: workOrder.cashierOrders.map((c) => ({
      id: c.id, orderNo: c.orderNo,
      totalAmount: c.totalAmount.toString(), discount: c.discount.toString(),
      finalAmount: c.finalAmount.toString(), previousAmount: c.previousAmount?.toString(),
      amountChanged: c.amountChanged, changeReason: c.changeReason,
      paymentStatus: c.paymentStatus, paymentMethod: c.paymentMethod,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : c.createdAt.toISOString(),
    })),
  };
}

export async function recordWorkOrderSnapshot(
  workOrderId: string,
  changedBy: string,
  changeReason: string,
  extra?: Record<string, unknown>
) {
  const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder) throw new Error('工单不存在');

  const snapshot = await buildWorkOrderSnapshot(workOrderId);
  if (extra) Object.assign(snapshot, extra);

  await prisma.workOrderStatusLog.create({
    data: {
      workOrderId,
      fromStatus: workOrder.status,
      toStatus: workOrder.status,
      changedBy,
      changeReason,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
    },
  });

  await redis.del(CACHE_KEYS.WORK_ORDER(workOrderId));
  await redis.del(CACHE_KEYS.WORK_ORDER_LIST('*'));
}

export { buildWorkOrderSnapshot };
