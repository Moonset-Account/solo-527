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
    include: { items: true, parts: true },
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
    items: workOrder.items.map((i: { name: string; price: { toString: () => string }; status: string }) => ({
      name: i.name,
      price: i.price.toString(),
      status: i.status,
    })),
    parts: workOrder.parts.map((p: { partId: string; quantity: number; status: string }) => ({
      partId: p.partId,
      quantity: p.quantity,
      status: p.status,
    })),
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
