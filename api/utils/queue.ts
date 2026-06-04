import { Queue, Worker } from 'bullmq';
import logger from './logger.js';
import { getDb } from '../db/database.js';

let notificationQueue: Queue | null = null;
let redisAvailable = false;

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null as null,
  retryStrategy: () => null,
  lazyConnect: true,
  connectTimeout: 2000,
  enableOfflineQueue: false,
};

async function initRedis(): Promise<void> {
  try {
    const { default: IORedis } = await import('ioredis');
    const conn = new IORedis(redisOptions);
    conn.on('error', () => {});
    await conn.ping();
    redisAvailable = true;
    notificationQueue = new Queue('notifications', { connection: conn as any });
    logger.info('Redis connected for BullMQ');
  } catch {
    logger.warn('Redis not available, using fallback direct processing for notifications');
    redisAvailable = false;
  }
}

initRedis();

export async function getNotificationQueue(): Promise<Queue | null> {
  if (!redisAvailable) return null;
  return notificationQueue;
}

function writeMessageDirectly(userId: number, title: string, content: string, type: string, relatedEntityType?: string, relatedEntityId?: number): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO messages (user_id, title, content, type, read, related_entity_type, related_entity_id)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(userId, title, content, type, relatedEntityType ?? null, relatedEntityId ?? null);
  } catch (err) {
    logger.error('Failed to write message directly', { error: err });
  }
}

async function logEmail(userId: number | undefined, toAddress: string, subject: string, status: 'sent' | 'failed', errorMessage?: string): Promise<void> {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO email_logs (user_id, to_address, subject, status, error_message)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId ?? null, toAddress, subject, status, errorMessage ?? null);
  } catch (err) {
    logger.error('Failed to log email', { error: err });
  }
}

export interface NotificationJob {
  type: 'in_app' | 'email';
  userId: number;
  title: string;
  content: string;
  messageType: string;
  toAddress?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

export async function enqueueNotification(job: NotificationJob): Promise<void> {
  if (job.type === 'in_app') {
    writeMessageDirectly(job.userId, job.title, job.content, job.messageType, job.relatedEntityType, job.relatedEntityId);
  }

  if (job.type === 'email') {
    if (!job.toAddress) {
      logger.warn('Email notification missing to_address', { userId: job.userId });
      return;
    }
    await logEmail(job.userId, job.toAddress, job.title, 'sent');
    logger.info('Email notification logged', { to: job.toAddress, subject: job.title });
  }

  const queue = await getNotificationQueue();
  if (queue && redisAvailable) {
    try {
      await queue.add('notification', job, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
    } catch (err) {
      logger.warn('Failed to enqueue notification to BullMQ, already processed directly', { error: err });
    }
  }
}

export async function setupNotificationWorker(): Promise<void> {
  if (!redisAvailable) return;

  const { default: IORedis } = await import('ioredis');
  const conn = new IORedis({ ...redisOptions, retryStrategy: () => 2000 }) as any;

  const worker = new Worker<NotificationJob>('notifications', async (job) => {
    logger.info('Processing notification job', { jobId: job.id, type: job.data.type });
    if (job.data.type === 'in_app') {
      writeMessageDirectly(job.data.userId, job.data.title, job.data.content, job.data.messageType, job.data.relatedEntityType, job.data.relatedEntityId);
    }
    if (job.data.type === 'email' && job.data.toAddress) {
      await logEmail(job.data.userId, job.data.toAddress, job.data.title, 'sent');
    }
  }, { connection: conn });

  worker.on('failed', (job, err) => {
    logger.error('Notification job failed', { jobId: job?.id, error: err.message });
  });

  worker.on('completed', (job) => {
    logger.info('Notification job completed', { jobId: job.id });
  });
}
