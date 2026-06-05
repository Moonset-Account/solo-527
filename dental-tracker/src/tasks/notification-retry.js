const db = require('../db/pool');

const RETRY_INTERVAL_MS = 60000;

async function processPendingNotifications() {
  try {
    const { rows } = await db.query(
      `SELECT * FROM notifications
       WHERE is_sent = FALSE AND send_attempts < max_attempts
       ORDER BY created_at ASC
       LIMIT 50`
    );

    for (const notif of rows) {
      try {
        console.log(`[通知] 发送: ${notif.title} (尝试 ${notif.send_attempts + 1}/${notif.max_attempts})`);

        await db.query(
          `UPDATE notifications SET is_sent = TRUE, send_attempts = send_attempts + 1, last_attempt_at = NOW()
           WHERE id = $1`,
          [notif.id]
        );
      } catch (sendErr) {
        await db.query(
          `UPDATE notifications SET send_attempts = send_attempts + 1, last_attempt_at = NOW()
           WHERE id = $1`,
          [notif.id]
        );
        console.error(`[通知] 发送失败 (ID: ${notif.id}):`, sendErr.message);
      }
    }
  } catch (err) {
    console.error('[通知重试] 轮询出错:', err.message);
  }
}

function startNotificationRetryTask() {
  setInterval(processPendingNotifications, RETRY_INTERVAL_MS);
  console.log(`[通知重试] 后台任务已启动，间隔 ${RETRY_INTERVAL_MS / 1000}s`);
}

module.exports = { startNotificationRetryTask, processPendingNotifications };
