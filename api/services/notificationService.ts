import { db } from '../db.js';

export function list(user_id: number) {
  const result: any[] = [];
  for (const [, n] of db.notifications) {
    if (n.user_id === user_id) {
      result.push(n);
    }
  }
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function markRead(id: number) {
  const notification = db.notifications.get(id);
  if (!notification) return { error: '通知不存在' };

  notification.read = true;
  db.notifications.set(id, notification);
  return { data: notification };
}

export function create(user_id: number, type: string, title: string, content: string) {
  const id = db.getNextId(db.notifications);
  const now = new Date().toISOString();
  const notification = {
    id,
    user_id,
    type,
    title,
    content,
    read: false,
    created_at: now,
  };
  db.notifications.set(id, notification);
  return notification;
}
