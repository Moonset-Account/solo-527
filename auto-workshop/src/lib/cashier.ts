import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS } from '@/lib/constants';
import { generateCashierNo } from '@/lib/utils';

export async function createCashierOrder(
  workOrderId: string,
  totalAmount: number,
  discount: number,
  paymentMethod?: string
) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { cashierOrders: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (!workOrder) {
    throw new Error('工单不存在');
  }

  const finalAmount = totalAmount - discount;
  const previousAmount = workOrder.cashierOrders.length > 0
    ? Number(workOrder.cashierOrders[0].finalAmount)
    : Number(workOrder.totalAmount || 0);

  const amountChanged = Math.abs(finalAmount - previousAmount) > 0.01;

  const cashierOrder = await prisma.cashierOrder.create({
    data: {
      workOrderId,
      orderNo: generateCashierNo(),
      totalAmount,
      discount,
      finalAmount,
      paymentMethod,
      previousAmount,
      amountChanged,
      changeReason: amountChanged ? `金额从 ${previousAmount} 变更为 ${finalAmount}` : undefined,
    },
  });

  await redis.del(CACHE_KEYS.WORK_ORDER(workOrderId));

  return cashierOrder;
}

export async function getCashierOrderHistory(workOrderId: string) {
  return prisma.cashierOrder.findMany({
    where: { workOrderId },
    orderBy: { createdAt: 'desc' },
  });
}
