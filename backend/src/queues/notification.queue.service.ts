import { Injectable, Inject, Logger } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { NOTIFICATION_QUEUE, EMAIL_QUEUE } from './queue.module';

export interface NotificationData {
  type: 'quote_submitted' | 'quote_approved' | 'quote_rejected' | 'contract_created' | 'contract_approved' | 'overdue_reminder';
  userId: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  email?: boolean;
  emailData?: {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
  };
}

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @Inject(NOTIFICATION_QUEUE) private notificationQueue: Queue,
    @Inject(EMAIL_QUEUE) private emailQueue: Queue,
  ) {}

  async addNotification(data: NotificationData): Promise<Job> {
    const job = await this.notificationQueue.add('send-notification', data, {
      delay: 0,
      priority: this.getPriority(data.type),
    });
    this.logger.log(`Notification added to queue: ${data.type} for user ${data.userId}, job id: ${job.id}`);

    if (data.email && data.emailData) {
      await this.emailQueue.add('send-email', data.emailData);
      this.logger.log(`Email added to queue for ${data.emailData.to}`);
    }

    return job;
  }

  async addBulkNotifications(notifications: NotificationData[]): Promise<Job[]> {
    const jobs = await Promise.all(
      notifications.map((n) => this.notificationQueue.add('send-notification', n)),
    );
    this.logger.log(`Bulk notifications added: ${jobs.length} jobs`);
    return jobs;
  }

  async getQueueStats() {
    const counts = await this.notificationQueue.getJobCounts('active', 'waiting', 'completed', 'failed');
    const emailCounts = await this.emailQueue.getJobCounts('active', 'waiting', 'completed', 'failed');

    return {
      notifications: {
        active: counts.active || 0,
        waiting: counts.waiting || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
      },
      emails: {
        active: emailCounts.active || 0,
        waiting: emailCounts.waiting || 0,
        completed: emailCounts.completed || 0,
        failed: emailCounts.failed || 0,
      },
    };
  }

  private getPriority(type: string): number {
    const priorities: Record<string, number> = {
      overdue_reminder: 1,
      quote_approved: 2,
      contract_approved: 2,
      quote_submitted: 3,
      quote_rejected: 3,
      contract_created: 4,
    };
    return priorities[type] || 5;
  }

  async processNotificationQueue() {
    const { Worker } = require('bullmq');

    const worker = new Worker(NOTIFICATION_QUEUE, async (job: Job<NotificationData>) => {
      this.logger.log(`Processing notification job ${job.id}: ${job.data.type}`);

      try {
        await this.processNotification(job.data);
        job.updateProgress(100);
        return { success: true };
      } catch (error) {
        this.logger.error(`Notification job ${job.id} failed:`, error);
        throw error;
      }
    }, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
      concurrency: 5,
    });

    worker.on('completed', (job) => {
      this.logger.debug(`Notification job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Notification job ${job?.id} failed with error:`, err);
    });

    return worker;
  }

  private async processNotification(data: NotificationData): Promise<void> {
    this.logger.debug(`Processing ${data.type} notification for user ${data.userId}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
