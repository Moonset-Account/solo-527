import { prisma, type TransactionClient } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS, STATUS_TRANSITIONS } from '@/lib/constants';
import { recordWorkOrderSnapshot } from '@/lib/workorder-snapshot';

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

    if (shortage.workOrder.status === 'PARTS_WAITING') {
      const canTransition = STATUS_TRANSITIONS[shortage.workOrder.status]?.includes('IN_PROGRESS');
      if (canTransition) {
        await tx.workOrder.update({
          where: { id: shortage.workOrderId },
          data: { status: 'IN_PROGRESS' },
        });
        await tx.workOrderStatusLog.create({
          data: {
            workOrderId: shortage.workOrderId,
            fromStatus: 'PARTS_WAITING',
            toStatus: 'IN_PROGRESS',
            changedBy: handledBy,
            changeReason: `配件缺货处理完成: ${handleResult}`,
          },
        });
      }
    }

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
            shortageMarks: 0,
          },
        });
      }
    }

    return updated;
  });

  await recordWorkOrderSnapshot(shortage.workOrderId, handledBy, `缺货处理: ${handleResult}`, { handledShortageId: shortageId });

  return result;
}

export async function markPartShortage(
  workOrderPartId: string,
  workOrderId: string,
  markedBy: string,
  remark?: string
) {
  const existing = await prisma.partShortage.findFirst({
    where: {
      workOrderPartId,
      status: 'pending',
    },
  });
  if (existing) {
    throw new Error('该配件已有待处理的缺货记录');
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { technician: true },
  });
  if (!workOrder) {
    throw new Error('工单不存在');
  }

  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    const shortage = await tx.partShortage.create({
      data: {
        workOrderId,
        workOrderPartId,
        status: 'pending',
      },
    });

    await tx.workOrderPart.update({
      where: { id: workOrderPartId },
      data: { status: 'shortage' },
    });

    if (workOrder.status !== 'PARTS_WAITING' && workOrder.status !== 'ABNORMAL_CLOSED' && workOrder.status !== 'CASHIERED') {
      const canTransition = STATUS_TRANSITIONS[workOrder.status]?.includes('PARTS_WAITING');
      if (canTransition) {
        await tx.workOrder.update({
          where: { id: workOrderId },
          data: { status: 'PARTS_WAITING' },
        });
        await tx.workOrderStatusLog.create({
          data: {
            workOrderId,
            fromStatus: workOrder.status,
            toStatus: 'PARTS_WAITING',
            changedBy: markedBy,
            changeReason: remark || `配件缺货标记`,
          },
        });
      }
    }

    if (workOrder.technicianId) {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const existingCapacity = await tx.technicianCapacity.findFirst({
        where: {
          technicianId: workOrder.technicianId,
          periodStart,
          periodEnd,
        },
      });

      if (existingCapacity) {
        await tx.technicianCapacity.update({
          where: { id: existingCapacity.id },
          data: { shortageMarks: { increment: 1 } },
        });
      } else {
        await tx.technicianCapacity.create({
          data: {
            technicianId: workOrder.technicianId,
            periodStart,
            periodEnd,
            shortageHandles: 0,
            shortageMarks: 1,
          },
        });
      }
    }

    return shortage;
  });

  await recordWorkOrderSnapshot(workOrderId, markedBy, remark || '配件缺货标记', { markedShortagePartId: workOrderPartId });

  return result;
}
