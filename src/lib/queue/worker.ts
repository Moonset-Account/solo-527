import { Worker } from 'bullmq';
import { redis } from '../redis';
import { prisma } from '../prisma';
import { logger } from '../logger';

const connection = redis;

export const notificationWorker = new Worker('notifications', async (job) => {
  logger.info(`Processing notification job: ${job.id}`, job.data);

  const { userId, title, content, type, entityId, entityType } = job.data;

  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        content,
        type,
        entityId,
        entityType,
      },
    });

    logger.info(`Notification created for user: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to create notification:', error);
    throw error;
  }
}, { connection });

export const paymentReminderWorker = new Worker('payment-reminders', async (job) => {
  logger.info(`Processing payment reminder job: ${job.id}`, job.data);

  const { invoiceId } = job.data;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        project: true,
      },
    });

    if (!invoice) {
      logger.warn(`Invoice not found: ${invoiceId}`);
      return { success: false, error: 'Invoice not found' };
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: '付款提醒',
          content: `发票 ${invoice.invoiceNumber} 已到期，请跟进客户 ${invoice.client.name} 的付款`,
          type: 'PAYMENT_REMINDER',
          entityId: invoice.id,
          entityType: 'INVOICE',
        },
      });
    }

    logger.info(`Payment reminder sent for invoice: ${invoice.invoiceNumber}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to process payment reminder:', error);
    throw error;
  }
}, { connection });

notificationWorker.on('completed', (job) => {
  logger.info(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job ${job?.id} failed:`, err);
});

paymentReminderWorker.on('completed', (job) => {
  logger.info(`Payment reminder job ${job.id} completed`);
});

paymentReminderWorker.on('failed', (job, err) => {
  logger.error(`Payment reminder job ${job?.id} failed:`, err);
});

logger.info('Queue workers started');
