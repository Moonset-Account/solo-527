import { prisma, type TransactionClient } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS } from '@/lib/constants';

export async function handlePartShortage(
  shortageId: string,
  handledBy: string,
  handleResult: string
) {
  const shortage = await prisma.partShortage.findUnique({
    where: { id: shortageId },
    include: {
      workOrder: {
        include: { technician: true },
      },
    },
  });

  if (!shortage) {
    throw new Error('缺货记录不存在');
  }

  if (shortage.status === 'resolved') {
    throw new Error('该缺货记录已处理');
  }

  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    const updated = await tx.partShortage.update({
      where: { id: shortageId },
      data: {
        handledBy,
        handleResult,
        handledAt: new Date(),
        status: 'resolved',
      },
    });

    await tx.workOrderPart.update({
      where: { id: shortage.workOrderPartId },
      data: { status: 'available' },
    });

    if (shortage.workOrder.technicianId) {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const existingCapacity = await tx.technicianCapacity.findFirst({
        where: {
          technicianId: shortage.workOrder.technicianId,
          periodStart,
          periodEnd,
        },
      });

      if (existingCapacity) {
        await tx.technicianCapacity.update({
          where: { id: existingCapacity.id },
          data: { shortageHandles: { increment: 1 } },
        });
      } else {
        await tx.technicianCapacity.create({
          data: {
            technicianId: shortage.workOrder.technicianId,
            periodStart,
            periodEnd,
            shortageHandles: 1,
          },
        });
      }
    }

    return updated;
  });

  await redis.del(CACHE_KEYS.WORK_ORDER(shortage.workOrderId));

  return result;
}

export async function createPartShortage(workOrderPartId: string, workOrderId: string) {
  return prisma.partShortage.create({
    data: {
      workOrderId,
      workOrderPartId,
      status: 'pending',
    },
  });
}
