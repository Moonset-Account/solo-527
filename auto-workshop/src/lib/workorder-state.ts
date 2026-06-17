import { prisma, type TransactionClient } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { STATUS_TRANSITIONS, CACHE_KEYS } from '@/lib/constants';
import { WorkOrderStatus } from '@/generated/prisma/enums';

export class WorkOrderStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkOrderStateError';
  }
}

export async function transitionWorkOrderStatus(
  workOrderId: string,
  toStatus: WorkOrderStatus,
  changedBy?: string,
  changeReason?: string,
  abnormalReason?: string
) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      items: true,
      parts: { include: { part: true } },
      testDrives: true,
      cashierOrders: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!workOrder) {
    throw new WorkOrderStateError('工单不存在');
  }

  const allowedTransitions = STATUS_TRANSITIONS[workOrder.status];
  if (!allowedTransitions.includes(toStatus)) {
    throw new WorkOrderStateError(
      `不允许从 ${workOrder.status} 转换到 ${toStatus}`
    );
  }

  if (toStatus === 'ABNORMAL_CLOSED' && !abnormalReason) {
    throw new WorkOrderStateError('异常关闭必须填写原因');
  }

  const snapshot = {
    status: workOrder.status,
    totalAmount: workOrder.totalAmount?.toString(),
    serviceItems: workOrder.items.map((i: { id: string; name: string; category: string; price: { toString: () => string }; laborFee: { toString: () => string }; status: string; remark: string | null }) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: i.price.toString(),
      laborFee: i.laborFee.toString(),
      status: i.status,
      remark: i.remark,
    })),
    parts: workOrder.parts.map((p: { id: string; partId: string; part: { name: string; partNo: string } | null; quantity: number; unitPrice: { toString: () => string }; totalPrice: { toString: () => string }; status: string }) => ({
      id: p.id,
      partId: p.partId,
      partName: p.part?.name,
      partNo: p.part?.partNo,
      quantity: p.quantity,
      unitPrice: p.unitPrice.toString(),
      totalPrice: p.totalPrice.toString(),
      status: p.status,
    })),
    testDrives: workOrder.testDrives.map((t: { id: string; startTime: string | Date; endTime: string | Date | null; driverName: string; mileage: number | null; remark: string | null }) => ({
      id: t.id,
      startTime: typeof t.startTime === 'string' ? t.startTime : t.startTime.toISOString(),
      endTime: t.endTime ? (typeof t.endTime === 'string' ? t.endTime : t.endTime.toISOString()) : null,
      driverName: t.driverName,
      mileage: t.mileage,
      remark: t.remark,
    })),
    cashierOrders: workOrder.cashierOrders.map((c: { id: string; orderNo: string; totalAmount: { toString: () => string }; discount: { toString: () => string }; finalAmount: { toString: () => string }; previousAmount: { toString: () => string } | null; amountChanged: boolean; changeReason: string | null; paymentStatus: string; paymentMethod: string | null; createdAt: string | Date }) => ({
      id: c.id,
      orderNo: c.orderNo,
      totalAmount: c.totalAmount.toString(),
      discount: c.discount.toString(),
      finalAmount: c.finalAmount.toString(),
      previousAmount: c.previousAmount?.toString(),
      amountChanged: c.amountChanged,
      changeReason: c.changeReason,
      paymentStatus: c.paymentStatus,
      paymentMethod: c.paymentMethod,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : c.createdAt.toISOString(),
    })),
    abnormalReason: toStatus === 'ABNORMAL_CLOSED' ? abnormalReason : undefined,
  };

  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    const updated = await tx.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: toStatus,
        abnormalReason: toStatus === 'ABNORMAL_CLOSED' ? abnormalReason : undefined,
      },
    });

    await tx.workOrderStatusLog.create({
      data: {
        workOrderId,
        fromStatus: workOrder.status,
        toStatus,
        changedBy,
        changeReason: changeReason || (toStatus === 'ABNORMAL_CLOSED' ? abnormalReason : undefined),
        snapshot,
      },
    });

    if (toStatus === 'COMPLETED' || toStatus === 'CASHIERED' || toStatus === 'ABNORMAL_CLOSED') {
      if (updated.technicianId) {
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const existingCapacity = await tx.technicianCapacity.findFirst({
          where: {
            technicianId: updated.technicianId,
            periodStart,
            periodEnd,
          },
        });

        const laborFeeSum = workOrder.items.reduce(
          (sum: number, i: { laborFee: { toNumber?: () => number; toString?: () => string } }) => {
            const val = i.laborFee.toNumber ? i.laborFee.toNumber() : parseFloat(String(i.laborFee)) || 0;
            return sum + val;
          },
          0
        );

        if (existingCapacity) {
          const updateData: Record<string, unknown> = {};
          if (toStatus === 'COMPLETED' || toStatus === 'CASHIERED') {
            updateData.completedOrders = { increment: 1 };
            updateData.totalLaborFee = (parseFloat(String(existingCapacity.totalLaborFee)) || 0) + laborFeeSum;
          }
          if (toStatus === 'ABNORMAL_CLOSED') {
            updateData.abnormalCloses = { increment: 1 };
          }
          await tx.technicianCapacity.update({
            where: { id: existingCapacity.id },
            data: updateData,
          });
        } else {
          await tx.technicianCapacity.create({
            data: {
              technicianId: updated.technicianId,
              periodStart,
              periodEnd,
              completedOrders: (toStatus === 'COMPLETED' || toStatus === 'CASHIERED') ? 1 : 0,
              totalLaborFee: (toStatus === 'COMPLETED' || toStatus === 'CASHIERED') ? laborFeeSum : 0,
              abnormalCloses: toStatus === 'ABNORMAL_CLOSED' ? 1 : 0,
              shortageHandles: 0,
            },
          });
        }
      }
    }

    return updated;
  });

  await redis.del(CACHE_KEYS.WORK_ORDER(workOrderId));
  await redis.del(CACHE_KEYS.WORK_ORDER_LIST('*'));

  return result;
}

export async function getWorkOrderStatusLogs(workOrderId: string) {
  return prisma.workOrderStatusLog.findMany({
    where: { workOrderId },
    orderBy: { createdAt: 'desc' },
  });
}
