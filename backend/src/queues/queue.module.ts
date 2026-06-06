import { Module, Global } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NotificationQueueService } from './notification.queue.service';
import { ExportQueueService } from './export.queue.service';

export const NOTIFICATION_QUEUE = 'notification-queue';
export const EXPORT_QUEUE = 'export-queue';
export const EMAIL_QUEUE = 'email-queue';

const queueProviders = [
  {
    provide: NOTIFICATION_QUEUE,
    useFactory: () => {
      return new Queue(NOTIFICATION_QUEUE, {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });
    },
  },
  {
    provide: EXPORT_QUEUE,
    useFactory: () => {
      return new Queue(EXPORT_QUEUE, {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });
    },
  },
  {
    provide: EMAIL_QUEUE,
    useFactory: () => {
      return new Queue(EMAIL_QUEUE, {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      });
    },
  },
];

@Global()
@Module({
  providers: [...queueProviders, NotificationQueueService, ExportQueueService],
  exports: [...queueProviders, NotificationQueueService, ExportQueueService],
})
export class QueueModule {}
