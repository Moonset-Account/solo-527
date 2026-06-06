import { query } from '../db/index.ts';
import { redis } from '../redis/index.ts';

const OVERDUE_CHECK_KEY = 'overdue_check:last_run';
const REMINDER_INTERVAL = 60 * 60 * 1000;

export async function checkOverdueIssues() {
  try {
    const lastRun = await redis.get(OVERDUE_CHECK_KEY);
    const now = Date.now();
    
    if (lastRun && now - parseInt(lastRun) < REMINDER_INTERVAL) {
      return;
    }
    
    await redis.set(OVERDUE_CHECK_KEY, now.toString());
    
    const result = await query(`
      UPDATE issues
      SET is_overdue = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending_rectify'
        AND due_date IS NOT NULL
        AND due_date < CURRENT_TIMESTAMP
        AND is_overdue = false
      RETURNING id, store_id, title
    `);
    
    for (const issue of result.rows) {
      await query(`
        INSERT INTO reminders (issue_id, user_id, reminder_type)
        SELECT $1, u.id, 'overdue'
        FROM users u
        WHERE u.store_id = $2 AND u.role = 'store_manager'
      `, [issue.id, issue.store_id]);
      
      await query(`
        INSERT INTO issue_logs (issue_id, action, comment)
        VALUES ($1, 'overdue', '问题已逾期，系统自动标记')
      `, [issue.id]);
      
      console.log(`Issue ${issue.id} marked as overdue: ${issue.title}`);
    }
    
    if (result.rows.length > 0) {
      console.log(`Marked ${result.rows.length} issues as overdue`);
    }
  } catch (error) {
    console.error('Check overdue issues error:', error);
  }
}

export function startOverdueChecker() {
  checkOverdueIssues();
  setInterval(checkOverdueIssues, REMINDER_INTERVAL);
  console.log('Overdue checker started');
}
