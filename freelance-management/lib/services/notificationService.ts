import { db } from '@/lib/db/schema';
import { Notification, NotificationType } from '@/types';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'noreply@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

export function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  content: string,
  relatedId?: number,
  relatedType?: string
): Notification {
  const stmt = db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(userId, type, title, content, relatedId || null, relatedType || null);
  return getNotificationById(result.lastInsertRowid as number)!;
}

export function getNotificationById(id: number): Notification | null {
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as Notification | null;
}

export function getUserNotifications(userId: number, limit = 20): Notification[] {
  return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit) as Notification[];
}

export function getUnreadNotificationCount(userId: number): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(userId) as { count: number };
  return result.count;
}

export function markNotificationAsRead(id: number, userId: number): void {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
}

export function markAllNotificationsAsRead(userId: number): void {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
}

export async function sendEmailNotification(
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@freelance.com',
      to,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

export function notifyProjectStatusChange(
  projectId: number,
  projectName: string,
  newStatus: string,
  recipientIds: number[]
): void {
  recipientIds.forEach(userId => {
    createNotification(
      userId,
      NotificationType.PROJECT_STATUS_CHANGED,
      '项目状态更新',
      `项目"${projectName}"状态已更新为: ${newStatus}`,
      projectId,
      'project'
    );
  });
}

export function notifyInvoiceCreated(
  invoiceId: number,
  invoiceNumber: string,
  amount: number,
  recipientId: number
): void {
  createNotification(
    recipientId,
    NotificationType.INVOICE_CREATED,
    '收到新发票',
    `您有新的发票 ${invoiceNumber}，金额 ¥${amount.toLocaleString()}`,
    invoiceId,
    'invoice'
  );
}

export function notifyPaymentReceived(
  invoiceId: number,
  invoiceNumber: string,
  amount: number,
  recipientId: number
): void {
  createNotification(
    recipientId,
    NotificationType.PAYMENT_RECEIVED,
    '付款已收到',
    `发票 ${invoiceNumber} 已收到付款 ¥${amount.toLocaleString()}`,
    invoiceId,
    'payment'
  );
}

export function notifyTaskAssigned(
  taskId: number,
  taskTitle: string,
  projectName: string,
  assigneeId: number
): void {
  createNotification(
    assigneeId,
    NotificationType.TASK_ASSIGNED,
    '新任务分配',
    `您被分配了新任务: "${taskTitle}" (${projectName})`,
    taskId,
    'task'
  );
}

export function notifyDeadlineReminder(
  projectId: number,
  projectName: string,
  dueDate: string,
  recipientIds: number[]
): void {
  recipientIds.forEach(userId => {
    createNotification(
      userId,
      NotificationType.DEADLINE_REMINDER,
      '截止日期提醒',
      `项目"${projectName}"将于 ${dueDate} 到期`,
      projectId,
      'project'
    );
  });
}
