import nodemailer from 'nodemailer';
import { getDb } from '../db/database.js';
import { enqueueNotification } from '../utils/queue.js';
import logger from '../utils/logger.js';
import type { Message } from '../../shared/types.js';

export function listMessages(userId: number, options?: { read?: boolean; page?: number; limit?: number }): { messages: Message[]; total: number } {
  const db = getDb();
  let countSql = 'SELECT COUNT(*) as cnt FROM messages WHERE user_id = ?';
  let sql = 'SELECT * FROM messages WHERE user_id = ?';
  const params: unknown[] = [userId];
  const countParams: unknown[] = [userId];

  if (options?.read !== undefined) {
    countSql += ' AND read = ?';
    sql += ' AND read = ?';
    params.push(options.read ? 1 : 0);
    countParams.push(options.read ? 1 : 0);
  }

  const total = (db.prepare(countSql).get(...countParams) as { cnt: number }).cnt;

  sql += ' ORDER BY created_at DESC';
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const messages = db.prepare(sql).all(...params) as Message[];
  return { messages, total };
}

export function markAsRead(id: number, userId: number): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE messages SET read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

export function getUnreadCount(userId: number): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as cnt FROM messages WHERE user_id = ? AND read = 0').get(userId) as { cnt: number };
  return row.cnt;
}

export async function sendMessage(data: {
  userId: number;
  title: string;
  content: string;
  type: string;
  sendEmail?: boolean;
  toAddress?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}): Promise<Message> {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO messages (user_id, title, content, type, read, related_entity_type, related_entity_id)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `).run(data.userId, data.title, data.content, data.type, data.relatedEntityType ?? null, data.relatedEntityId ?? null);

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid) as Message;

  if (data.sendEmail && data.toAddress) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        } : undefined,
      });

      if (process.env.SMTP_HOST) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@gyms.com',
          to: data.toAddress,
          subject: data.title,
          text: data.content,
        });
      }

      db.prepare(`
        INSERT INTO email_logs (user_id, to_address, subject, status)
        VALUES (?, ?, ?, 'sent')
      `).run(data.userId, data.toAddress, data.title);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Email send failed', { error: errorMsg });
      db.prepare(`
        INSERT INTO email_logs (user_id, to_address, subject, status, error_message)
        VALUES (?, ?, ?, 'failed', ?)
      `).run(data.userId, data.toAddress, data.title, errorMsg);
    }
  }

  return message;
}
