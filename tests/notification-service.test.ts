import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/db';
import { notifications, users, projects, clients, invoices } from '@/db/schema';
import {
  createNotification,
  processNotificationQueue,
  sendPaymentDueReminders,
} from '@/lib/notification-service';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue(true),
    }),
  },
}));

describe('Notification Service', () => {
  let testUserId: string;

  beforeEach(async () => {
    testUserId = uuidv4();
    await db.insert(users).values({
      id: testUserId,
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    });
  });

  it('创建通知并生成幂等键', async () => {
    const idempotencyKey = `test_${Date.now()}`;
    const notification = await createNotification({
      userId: testUserId,
      type: 'quote_sent',
      title: '报价单已发送',
      content: '您的报价单已发送，请查收',
      idempotencyKey,
    });

    expect(notification).toBeDefined();
    expect(notification.type).toBe('quote_sent');
    expect(notification.status).toBe('pending');
    expect(notification.idempotencyKey).toBe(idempotencyKey);
  });

  it('相同幂等键不会重复创建通知', async () => {
    const idempotencyKey = `unique_${Date.now()}`;
    
    const n1 = await createNotification({
      userId: testUserId,
      type: 'quote_sent',
      title: '报价单已发送',
      idempotencyKey,
    });

    const n2 = await createNotification({
      userId: testUserId,
      type: 'quote_sent',
      title: '报价单已发送',
      idempotencyKey,
    });

    expect(n1.id).toBe(n2.id);
  });

  it('通知发送成功后状态更新为 sent', async () => {
    const notification = await createNotification({
      userId: testUserId,
      type: 'system',
      title: '测试通知',
    });

    const results = await processNotificationQueue();

    const updated = await db.query.notifications.findFirst({
      where: eq(notifications.id, notification.id),
    });

    expect(updated?.status).toBe('sent');
    expect(updated?.sentAt).toBeDefined();
  });

  it('付款提醒到期自动发送', async () => {
    const clientUserId = uuidv4();
    const clientId = uuidv4();
    const projectId = uuidv4();
    const invoiceId = uuidv4();

    await db.insert(users).values({
      id: clientUserId,
      name: 'Client User',
      email: 'client@example.com',
      role: 'client',
    });

    await db.insert(clients).values({
      id: clientId,
      userId: clientUserId,
      companyName: 'Test Company',
    });

    await db.insert(projects).values({
      id: projectId,
      clientId,
      name: 'Test Project',
      totalAmount: 10000,
      createdBy: testUserId,
    });

    const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await db.insert(invoices).values({
      id: invoiceId,
      projectId,
      invoiceNumber: 'INV-TEST-001',
      title: '测试发票',
      totalAmount: 5000,
      paidAmount: 0,
      status: 'sent',
      dueDate,
      createdBy: testUserId,
    });

    const count = await sendPaymentDueReminders();

    expect(count).toBeGreaterThanOrEqual(1);

    const notifs = await db.query.notifications.findMany({
      where: eq(notifications.userId, clientUserId),
    });

    const paymentDueNotif = notifs.find((n) => n.type === 'payment_due');
    expect(paymentDueNotif).toBeDefined();
  });
});
