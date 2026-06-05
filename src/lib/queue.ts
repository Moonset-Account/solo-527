import { Queue, Worker, Job } from 'bullmq';
import redis from './redis';
import prisma from './prisma';

export const emailQueue = new Queue('email-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const reminderQueue = new Queue('reminder-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
  },
});

export const fileProcessingQueue = new Queue('file-processing-queue', {
  connection: redis,
});

export const syncQueue = new Queue('sync-queue', {
  connection: redis,
});

const emailWorker = new Worker('email-queue', async (job: Job) => {
  const { to, subject, template, data } = job.data;
  console.log(`[Email Queue] Sending email to ${to}: ${subject}`);
  return { success: true, to, subject };
}, { connection: redis });

const reminderWorker = new Worker('reminder-queue', async (job: Job) => {
  const { reminderId } = job.data;
  
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    include: { project: { include: { couple: true, manager: true } } },
  });

  if (!reminder || reminder.isSent) return;

  console.log(`[Reminder] Sending reminder: ${reminder.title}`);

  await prisma.reminder.update({
    where: { id: reminderId },
    data: { isSent: true },
  });

  return { success: true, reminderId };
}, { connection: redis });

const syncWorker = new Worker('sync-queue', async (job: Job) => {
  const { syncQueueId } = job.data;

  const syncItem = await prisma.offlineSyncQueue.findUnique({
    where: { id: syncQueueId },
  });

  if (!syncItem || syncItem.synced) return;

  console.log(`[Sync Queue] Processing ${syncItem.entityType} for user ${syncItem.userId}`);

  await prisma.offlineSyncQueue.update({
    where: { id: syncQueueId },
    data: { synced: true, syncedAt: new Date() },
  });

  return { success: true, syncQueueId };
}, { connection: redis });

export async function scheduleReminder(reminderId: string, remindAt: Date) {
  const now = new Date();
  const delay = remindAt.getTime() - now.getTime();
  
  if (delay > 0) {
    await reminderQueue.add('send-reminder', { reminderId }, {
      delay,
    });
  }
}

export async function enqueueSyncItem(syncQueueId: string) {
  await syncQueue.add('process-sync', { syncQueueId });
}

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});

reminderWorker.on('completed', (job) => {
  console.log(`Reminder job ${job.id} completed`);
});

reminderWorker.on('failed', (job, err) => {
  console.error(`Reminder job ${job?.id} failed:`, err);
});
