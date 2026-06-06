import { Injectable } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import * as Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

@Injectable()
export class NotificationQueue {
  private notificationQueue: Queue;
  private emailQueue: Queue;

  constructor() {
    this.notificationQueue = new Queue('notifications', { connection });
    this.emailQueue = new Queue('emails', { connection });

    this.setupWorkers();
  }

  private setupWorkers() {
    const notificationWorker = new Worker('notifications', async (job) => {
      console.log(`Processing notification: ${job.name}`, job.data);
      return { success: true };
    }, { connection });

    const emailWorker = new Worker('emails', async (job) => {
      console.log(`Sending email: ${job.data.to}`, job.data.subject);
      return { success: true };
    }, { connection });
  }

  async addNotification(type: string, data: any) {
    return this.notificationQueue.add(type, data);
  }

  async sendEmail(to: string, subject: string, content: string) {
    return this.emailQueue.add('send', { to, subject, content });
  }

  async notifyLowMarginQuote(quoteId: string, managerId: string) {
    return this.notificationQueue.add('low_margin_quote', {
      quoteId,
      managerId,
      message: '有低毛利报价需要您审批',
    });
  }

  async notifyOverdueDemand(demandId: string, assigneeId: string) {
    return this.notificationQueue.add('overdue_demand', {
      demandId,
      assigneeId,
      message: '您有一个需求已超时，请尽快处理',
    });
  }
}
