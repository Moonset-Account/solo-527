import prisma from '../db.js';

export async function logChange({ entityType, entityId, action, before, after, operatorId, operatorName, remark }) {
  await prisma.changeLog.create({
    data: {
      entityType,
      entityId,
      action,
      beforeSnapshot: before || undefined,
      afterSnapshot: after || undefined,
      operatorId,
      operatorName,
      remark,
    },
  });
}
