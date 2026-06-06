import { prisma } from './prisma';
import { createAuditLog } from './audit';
import { TaskStatus } from '@prisma/client';

export async function getFrontDeskTasks(status?: TaskStatus) {
  return prisma.frontDeskTask.findMany({
    where: status ? { status } : undefined,
    include: {
      meeting: {
        include: {
          room: true,
          host: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function completeTask(taskId: string, userId?: string) {
  const task = await prisma.frontDeskTask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
    },
  });

  await createAuditLog(
    'TASK_COMPLETED',
    'FrontDeskTask',
    taskId,
    userId
  );

  return task;
}

export async function getPendingTasks() {
  return prisma.frontDeskTask.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      meeting: {
        include: {
          room: true,
          host: {
            select: {
              name: true,
              phone: true,
            },
          },
          visitors: {
            where: {
              status: {
                in: ['INVITED', 'CHECKED_IN'],
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}
