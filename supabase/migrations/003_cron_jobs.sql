-- 启用 pg_cron 扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 每天早上9点执行尾款提醒任务
SELECT cron.schedule(
  'daily-payment-reminders',
  '0 9 * * *',
  $$
    SELECT 
      net.http_post(
        url := 'https://' || (SELECT value FROM config_var WHERE name = 'SUPABASE_PROJECT_REF') || '.functions.supabase.co/send-reminders',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || (SELECT value FROM config_var WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'),
          'Content-Type', 'application/json'
        )
      );
  $$
);

-- 每小时处理待发送通知
SELECT cron.schedule(
  'hourly-notification-processing',
  '0 * * * *',
  $$
    UPDATE notifications
    SET status = 'sent',
        sent_at = NOW()
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '5 minutes'
    LIMIT 50;
  $$
);

-- 每天清理30天前的已发送通知
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 * * *',
  $$
    DELETE FROM notifications
    WHERE status = 'sent'
      AND sent_at < NOW() - INTERVAL '30 days';
  $$
);

-- 每天自动更新已完成的订单状态
SELECT cron.schedule(
  'auto-complete-bookings',
  '0 1 * * *',
  $$
    UPDATE bookings
    SET status = 'completed'
    WHERE status = 'in_progress'
      AND end_time < NOW() - INTERVAL '1 day';
  $$
);

-- 查看所有定时任务
-- SELECT * FROM cron.job;

-- 取消定时任务示例
-- SELECT cron.unschedule('daily-payment-reminders');
