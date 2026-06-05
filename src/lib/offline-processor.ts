import prisma from './prisma';
import { OfflineSyncQueue } from '@prisma/client';

export async function processSyncItem(syncItemId: string) {
  const syncItem = await prisma.offlineSyncQueue.findUnique({
    where: { id: syncItemId },
  });

  if (!syncItem || syncItem.synced) return;

  try {
    await executeOperation(syncItem);
    await prisma.offlineSyncQueue.update({
      where: { id: syncItemId },
      data: {
        synced: true,
        syncedAt: new Date(),
      },
    });
    console.log(`✅ 同步成功: ${syncItem.entityType} ${syncItem.operation}`);
  } catch (error) {
    console.error(`❌ 同步失败: ${syncItem.entityType} ${syncItem.operation}`, error);
    throw error;
  }
}

async function executeOperation(syncItem: OfflineSyncQueue) {
  const { operation, entityType, entityData, userId } = syncItem;
  const data = entityData as any;

  switch (entityType) {
    case 'task':
      await handleTaskOperation(operation, data, userId);
      break;
    case 'budget':
      await handleBudgetOperation(operation, data, userId);
      break;
    case 'comment':
      await handleCommentOperation(operation, data, userId);
      break;
    case 'confirmation':
      await handleConfirmationOperation(operation, data, userId);
      break;
    case 'file':
      console.log(`文件操作需要特殊处理: ${operation}`);
      break;
    default:
      console.log(`未知实体类型: ${entityType}`);
  }
}

async function handleTaskOperation(operation: string, data: any, userId: string) {
  if (operation === 'create') {
    const { projectId, ...taskData } = data;
    await prisma.task.create({
      data: {
        ...taskData,
        projectId,
        creatorId: userId,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      },
    });
  } else if (operation === 'update') {
    const { taskId, status, ...updateData } = data;
    if (status) {
      await prisma.task.update({
        where: { id: taskId },
        data: { status },
      });
    } else if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          ...updateData,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        },
      });
    }
  }
}

async function handleBudgetOperation(operation: string, data: any, userId: string) {
  if (operation === 'create') {
    const { projectId, ...budgetData } = data;
    await prisma.budgetItem.create({
      data: {
        ...budgetData,
        projectId,
      },
    });
  } else if (operation === 'update') {
    const { budgetId, ...updateData } = data;
    if (budgetId) {
      await prisma.budgetItem.update({
        where: { id: budgetId },
        data: updateData,
      });
    }
  }
}

async function handleCommentOperation(operation: string, data: any, userId: string) {
  if (operation === 'create') {
    const { projectId, content } = data;
    await prisma.comment.create({
      data: {
        projectId,
        content,
        authorId: userId,
      },
    });
  }
}

async function handleConfirmationOperation(operation: string, data: any, userId: string) {
  if (operation === 'create') {
    const { projectId, ...confData } = data;
    await prisma.confirmation.create({
      data: {
        ...confData,
        projectId,
      },
    });
  } else if (operation === 'update') {
    const { confirmationId, status } = data;
    if (confirmationId && status) {
      await prisma.confirmation.update({
        where: { id: confirmationId },
        data: {
          status,
          confirmedAt: status === 'CONFIRMED' || status === 'DECLINED' ? new Date() : null,
        },
      });
    }
  }
}
