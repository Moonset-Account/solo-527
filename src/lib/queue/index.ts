import { Queue } from 'bullmq';
import getRedis from '../redis';

let notificationQueue: Queue | null = null;

export function getNotificationQueue() {
  if (!notificationQueue) {
    notificationQueue = new Queue('notifications', {
      connection: getRedis() as any,
    });
  }
  return notificationQueue;
}

export async function sendInvoiceReminder(invoiceId: string) {
  const queue = getNotificationQueue();
  await queue.add('invoice-reminder', { invoiceId }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
}

export async function schedulePaymentReminder(invoiceId: string, delay: number) {
  const queue = getNotificationQueue();
  await queue.add('payment-reminder', { invoiceId }, {
    delay,
    attempts: 3,
  });
}

export async function sendProjectUpdateNotification(projectId: string, userId: string, message: string) {
  const queue = getNotificationQueue();
  await queue.add('project-update', { projectId, userId, message });
}

export async function createNotification(userId: string, data: {
  title: string;
  content?: string;
  type: string;
  entityId?: string;
  entityType?: string;
}) {
  const { prisma } = await import('../prisma');
  return prisma.notification.create({
    data: {
      userId,
      title: data.title,
      content: data.content,
      type: data.type,
      entityId: data.entityId,
      entityType: data.entityType,
    },
  });
}
