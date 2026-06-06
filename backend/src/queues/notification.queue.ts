import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';

const connectionConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

@Injectable()
export class NotificationQueue implements OnModuleInit {
  private readonly logger = new Logger(NotificationQueue.name);
  private notificationQueue: Queue;
  private emailQueue: Queue;
  private notificationWorker: Worker;
  private emailWorker: Worker;

  constructor() {
    this.notificationQueue = new Queue('notifications', {
      connection: connectionConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.emailQueue = new Queue('emails', {
      connection: connectionConfig,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });
  }

  async onModuleInit() {
    this.setupWorkers();
  }

  private setupWorkers() {
    this.notificationWorker = new Worker('notifications', async (job) => {
      this.logger.log(`Processing notification: ${job.name}`, JSON.stringify(job.data));
      return { success: true };
    }, { connection: connectionConfig, concurrency: 5 });

    this.emailWorker = new Worker('emails', async (job) => {
      this.logger.log(`Sending email: ${job.data.to} - ${job.data.subject}`);
      return { success: true };
    }, { connection: connectionConfig, concurrency: 3 });

    this.notificationWorker.on('completed', (job) => {
      this.logger.debug(`Notification job ${job.id} completed`);
    });

    this.notificationWorker.on('failed', (job, err) => {
      this.logger.error(`Notification job ${job?.id} failed: ${err.message}`);
    });

    this.emailWorker.on('completed', (job) => {
      this.logger.debug(`Email job ${job.id} completed`);
    });

    this.emailWorker.on('failed', (job, err) => {
      this.logger.error(`Email job ${job?.id} failed: ${err.message}`);
    });
  }

  async addNotification(type: string, data: any) {
    const job = await this.notificationQueue.add(type, data);
    this.logger.log(`Notification added: ${type}, job id: ${job.id}`);
    return job;
  }

  async sendEmail(to: string, subject: string, content: string) {
    const job = await this.emailQueue.add('send', { to, subject, content });
    this.logger.log(`Email queued for ${to}, job id: ${job.id}`);
    return job;
  }

  async notifyLowMarginQuote(quoteId: string, managerId: string, customerName: string, amount: number) {
    return this.addNotification('low_margin_quote', {
      quoteId,
      managerId,
      customerName,
      amount,
      message: '有低毛利报价需要您审批',
    });
  }

  async notifyOverdueDemand(demandId: string, assigneeId: string, customerName: string) {
    return this.addNotification('overdue_demand', {
      demandId,
      assigneeId,
      customerName,
      message: '您有一个需求已超时，请尽快处理',
    });
  }

  async notifyQuoteApproved(quoteId: string, userId: string, customerName: string) {
    return this.addNotification('quote_approved', {
      quoteId,
      userId,
      customerName,
      message: '您的报价已通过审批',
    });
  }

  async notifyQuoteRejected(quoteId: string, userId: string, customerName: string, reason: string) {
    return this.addNotification('quote_rejected', {
      quoteId,
      userId,
      customerName,
      reason,
      message: '您的报价被拒绝',
    });
  }

  async getQueueStats() {
    const [notifCounts, emailCounts] = await Promise.all([
      this.notificationQueue.getJobCounts('active', 'waiting', 'completed', 'failed'),
      this.emailQueue.getJobCounts('active', 'waiting', 'completed', 'failed'),
    ]);

    return {
      notifications: {
        active: notifCounts.active || 0,
        waiting: notifCounts.waiting || 0,
        completed: notifCounts.completed || 0,
        failed: notifCounts.failed || 0,
      },
      emails: {
        active: emailCounts.active || 0,
        waiting: emailCounts.waiting || 0,
        completed: emailCounts.completed || 0,
        failed: emailCounts.failed || 0,
      },
    };
  }
}
