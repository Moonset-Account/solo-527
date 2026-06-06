import { query } from '../db';
import cron from 'node-cron';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  content: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  const { userId, type, title, content } = params;
  
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, content, next_retry_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [userId, type, title, content]
  );
  
  return result.rows[0];
};

const sendNotification = async (notification: any) => {
  try {
    console.log(`发送通知 [${notification.id}] 给用户 ${notification.user_id}: ${notification.title}`);
    
    await query(
      `UPDATE notifications 
       SET status = 'sent', sent_at = NOW(), retry_count = retry_count + 1
       WHERE id = $1`,
      [notification.id]
    );
    
    return true;
  } catch (error: any) {
    console.error(`发送通知失败 [${notification.id}]:`, error.message);
    
    const retryCount = notification.retry_count + 1;
    const shouldRetry = retryCount < notification.max_retries;
    
    if (shouldRetry) {
      const nextRetryMinutes = Math.min(Math.pow(2, retryCount) * 5, 120);
      await query(
        `UPDATE notifications 
         SET status = 'failed', retry_count = $1, last_retry_at = NOW(), 
             next_retry_at = NOW() + ($2 || ' minutes')::INTERVAL, error_message = $3
         WHERE id = $4`,
        [retryCount, nextRetryMinutes, error.message, notification.id]
      );
    } else {
      await query(
        `UPDATE notifications 
         SET status = 'failed', retry_count = $1, last_retry_at = NOW(), error_message = $2
         WHERE id = $3`,
        [retryCount, error.message, notification.id]
      );
    }
    
    return false;
  }
};

export const processPendingNotifications = async () => {
  try {
    const result = await query(
      `SELECT * FROM notifications 
       WHERE status IN ('pending', 'failed') 
         AND (next_retry_at <= NOW() OR next_retry_at IS NULL)
       ORDER BY created_at ASC
       LIMIT 50`
    );
    
    for (const notification of result.rows) {
      await sendNotification(notification);
    }
  } catch (error) {
    console.error('处理待发送通知失败:', error);
  }
};

export const startNotificationScheduler = () => {
  cron.schedule('*/5 * * * *', () => {
    processPendingNotifications();
  });
  console.log('通知重试调度器已启动（每5分钟执行一次）');
};

export const getUserNotifications = async (userId: string, limit = 50) => {
  const result = await query(
    `SELECT * FROM notifications 
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};
