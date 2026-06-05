import { db } from '@/db';
import { notifications, projects, clients, users } from '@/db/schema';
import { eq, and, inArray, lte, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const MAX_RETRIES = 3;
const RETRY_INTERVALS = [0, 15 * 60 * 1000, 60 * 60 * 1000];

type NotificationType = typeof notifications.$inferSelect.type;
type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  idempotencyKey?: string;
};

export async function createNotification(params: CreateNotificationParams) {
  const idempotencyKey = params.idempotencyKey || uuidv4();

  const existing = await db.query.notifications.findFirst({
    where: eq(notifications.idempotencyKey, idempotencyKey),
  });

  if (existing) {
    return existing;
  }

  const [notification] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      content: params.content,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
      idempotencyKey,
      status: 'pending',
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: new Date(),
    })
    .returning();

  return notification;
}

function calculateNextRetry(retryCount: number): Date {
  const interval = RETRY_INTERVALS[retryCount] || RETRY_INTERVALS[RETRY_INTERVALS.length - 1];
  return new Date(Date.now() + interval);
}

async function sendNotification(notification: typeof notifications.$inferSelect) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, notification.userId),
  });

  if (!user?.email) {
    throw new Error('User email not found');
  }

  try {
    console.log(`[Notification] Sending ${notification.type} to ${user.email}: ${notification.title}`);
    return true;
  } catch (error) {
    throw new Error(`Failed to send email: ${(error as Error).message}`);
  }
}

export async function processNotificationQueue() {
  const pendingNotifications = await db.query.notifications.findMany({
    where: and(
      inArray(notifications.status, ['pending', 'retrying']),
      lte(notifications.nextRetryAt, new Date())
    ),
    orderBy: asc(notifications.createdAt),
    limit: 10,
  });

  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  for (const notification of pendingNotifications) {
    try {
      await sendNotification(notification);
      await db
        .update(notifications)
        .set({
          status: 'sent',
          sentAt: new Date(),
          errorMessage: null,
        })
        .where(eq(notifications.id, notification.id));

      results.push({ id: notification.id, success: true });
    } catch (error) {
      const newRetryCount = notification.retryCount + 1;
      const errorMessage = (error as Error).message;

      if (newRetryCount >= notification.maxRetries) {
        await db
          .update(notifications)
          .set({
            status: 'failed',
            retryCount: newRetryCount,
            errorMessage,
          })
          .where(eq(notifications.id, notification.id));

        results.push({ id: notification.id, success: false, error: errorMessage });
      } else {
        const nextRetryAt = calculateNextRetry(newRetryCount);
        await db
          .update(notifications)
          .set({
            status: 'retrying',
            retryCount: newRetryCount,
            nextRetryAt,
            errorMessage,
          })
          .where(eq(notifications.id, notification.id));

        results.push({ id: notification.id, success: false, error: errorMessage });
      }
    }
  }

  return results;
}

export async function getNotificationsByUserId(userId: string, limit = 20) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    limit,
  });
}

export async function markNotificationAsRead(notificationId: string) {
  await db
    .update(notifications)
    .set({ status: 'read' })
    .where(eq(notifications.id, notificationId));
}

export async function sendProjectStatusNotification(
  projectId: string,
  oldStatus: string,
  newStatus: string
) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      client: {
        with: {
          user: true,
        },
      },
    },
  });

  if (!project?.client?.user) return;

  await createNotification({
    userId: project.client.user.id,
    type: 'project_status',
    title: `项目「${project.name}」状态更新`,
    content: `项目状态已从「${oldStatus}」更新为「${newStatus}」`,
    relatedEntityType: 'project',
    relatedEntityId: projectId,
  });
}

export async function sendPaymentDueReminders() {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const overdueInvoices = await db.query.invoices.findMany({
    where: and(
      inArray(invoices.status, ['sent', 'viewed']),
      lte(invoices.dueDate, threeDaysLater)
    ),
    with: {
      project: {
        with: {
          client: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });

  for (const invoice of overdueInvoices) {
    if (!invoice.project?.client?.user) continue;

    const idempotencyKey = `payment_due_${invoice.id}_${invoice.dueDate?.toISOString().split('T')[0]}`;

    await createNotification({
      userId: invoice.project.client.user.id,
      type: 'payment_due',
      title: `发票「${invoice.invoiceNumber}」即将到期`,
      content: `发票金额 ¥${invoice.totalAmount.toFixed(2)}，到期日：${invoice.dueDate?.toLocaleDateString()}`,
      relatedEntityType: 'invoice',
      relatedEntityId: invoice.id,
      idempotencyKey,
    });
  }

  return overdueInvoices.length;
}
