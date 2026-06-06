import { Queue, Worker } from "bullmq";
import { redis } from "./db.js";
import nodemailer from "nodemailer";
import { pool } from "./db.js";

const NOTIFICATION_QUEUE_NAME = "notifications";

let notificationQueue: Queue;
let emailWorker: Worker;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface NotificationJob {
  type: "email" | "in_app";
  recipient: string;
  subject: string;
  content: string;
  userId?: string;
  relatedOrderId?: string;
}

export async function initNotificationQueue() {
  const redisConfig = {
    host: process.env.REDIS_URL ? undefined : "localhost",
    port: process.env.REDIS_URL ? undefined : 6379,
    ...(process.env.REDIS_URL ? { url: process.env.REDIS_URL } : {}),
  };

  notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
    connection: redisConfig as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

  emailWorker = new Worker(NOTIFICATION_QUEUE_NAME, async (job) => {
    const data = job.data as NotificationJob;
    
    if (data.type === "email") {
      await sendEmailNotification(data);
    } else if (data.type === "in_app") {
      await saveInAppNotification(data);
    }
  }, {
    connection: redisConfig as any,
    concurrency: 5,
  });

  emailWorker.on("failed", async (job, err) => {
    if (job) {
      const data = job.data as NotificationJob;
      await pool.query(
        `INSERT INTO notification_queue (type, recipient, subject, content, status, retry_count, last_error)
         VALUES ($1, $2, $3, $4, 'failed', $5, $6)`,
        [data.type, data.recipient, data.subject, data.content, job.attemptsMade, err.message]
      );
    }
  });

  console.log("Notification queue initialized");
}

async function sendEmailNotification(data: NotificationJob) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: data.recipient,
    subject: data.subject,
    html: data.content,
  });
}

async function saveInAppNotification(data: NotificationJob) {
  if (!data.userId) return;
  
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, content, related_order_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [data.userId, data.type === "email" ? "email" : "system", data.subject, data.content, data.relatedOrderId]
  );
}

export async function enqueueNotification(job: NotificationJob) {
  if (!notificationQueue) {
    await initNotificationQueue();
  }
  
  await notificationQueue.add("notification", job, {
    priority: job.type === "email" ? 10 : 5,
  });

  await pool.query(
    `INSERT INTO notification_queue (type, recipient, subject, content, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [job.type, job.recipient, job.subject, job.content]
  );
}

export async function notifyUser(userId: string, title: string, content: string, relatedOrderId?: string) {
  const userResult = await pool.query(
    `SELECT email FROM users WHERE id = $1`,
    [userId]
  );
  
  if (userResult.rows.length > 0) {
    const email = userResult.rows[0].email;
    
    await enqueueNotification({
      type: "in_app",
      recipient: userId,
      subject: title,
      content,
      userId,
      relatedOrderId,
    });

    await enqueueNotification({
      type: "email",
      recipient: email,
      subject: title,
      content,
      userId,
      relatedOrderId,
    });
  }
}
