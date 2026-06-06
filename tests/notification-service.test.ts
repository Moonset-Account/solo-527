import { describe, it, expect } from 'vitest';
import {
  createNotification,
  processNotificationQueue,
  sendPaymentDueReminders,
} from '@/lib/notification-service';

describe('Notification Service', () => {
  const testUserId = 'test-user-123';

  it('创建通知', async () => {
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
  });

  it('处理通知队列', async () => {
    await createNotification({
      userId: testUserId,
      type: 'system',
      title: '测试通知',
    });

    const results = await processNotificationQueue();
    expect(Array.isArray(results)).toBe(true);
  });

  it('付款到期提醒', async () => {
    const count = await sendPaymentDueReminders();
    expect(typeof count).toBe('number');
  });
});
