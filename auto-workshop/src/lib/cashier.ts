import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS } from '@/lib/constants';
import { generateCashierNo } from '@/lib/utils';
import { recordWorkOrderSnapshot } from '@/lib/workorder-snapshot';

export async function createCashierOrder(
  workOrderId: string,
  totalAmount: number,
  discount: number,
  paymentMethod?: string,
  changedBy?: string
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

  if (amountChanged) {
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { totalAmount: finalAmount },
    });
  }

  const operator = changedBy || '系统';
  const reason = amountChanged
    ? `收银单金额变更: 原 ¥${previousAmount} → 现 ¥${finalAmount}`
    : `创建收银单 ${cashierOrder.orderNo}，金额 ¥${finalAmount}`;

  await recordWorkOrderSnapshot(workOrderId, operator, reason, {
    cashierAction: amountChanged ? 'amount_changed' : 'created',
    cashierOrderNo: cashierOrder.orderNo,
    previousAmount: previousAmount.toString(),
    newAmount: finalAmount.toString(),
  });

  return cashierOrder;
}

export async function getCashierOrderHistory(workOrderId: string) {
  return prisma.cashierOrder.findMany({
    where: { workOrderId },
    orderBy: { createdAt: 'desc' },
  });
}
