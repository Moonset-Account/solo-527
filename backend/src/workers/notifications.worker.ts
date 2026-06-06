import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { NotificationData } from '../queues/notification.queue.service';

dotenv.config();

const logger = new Logger('NotificationWorker');

const worker = new Worker(
  'notification-queue',
  async (job: Job<NotificationData>) => {
    logger.log(`Processing notification job ${job.id}: ${job.data.type}`);
    logger.debug(`Notification: ${job.data.title} - ${job.data.message}`);

    try {
      await processNotification(job.data);
      job.updateProgress(100);
      logger.log(`Notification job ${job.id} completed`);
      return { success: true };
    } catch (error) {
      logger.error(`Notification job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    },
    concurrency: 5,
  },
);

async function processNotification(data: NotificationData): Promise<void> {
  logger.debug(`Processing ${data.type} notification for user ${data.userId}`);

  switch (data.type) {
    case 'quote_submitted':
      logger.log(`[通知] 报价待审批: ${data.title}`);
      break;
    case 'quote_approved':
      logger.log(`[通知] 报价已通过: ${data.title}`);
      break;
    case 'quote_rejected':
      logger.log(`[通知] 报价已拒绝: ${data.title}`);
      break;
    case 'contract_created':
      logger.log(`[通知] 新合同创建: ${data.title}`);
      break;
    case 'contract_approved':
      logger.log(`[通知] 合同已审批: ${data.title}`);
      break;
    case 'overdue_reminder':
      logger.log(`[提醒] 任务超时: ${data.title}`);
      break;
    default:
      logger.log(`[通知] ${data.title}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
}

worker.on('completed', (job) => {
  logger.debug(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with error: ${err.message}`);
});

worker.on('error', (err) => {
  logger.error('Worker error:', err);
});

process.on('SIGINT', async () => {
  logger.log('Stopping notification worker...');
  await worker.close();
  process.exit(0);
});

logger.log('Notification worker started, waiting for jobs...');
