const MAX_RETRIES = 3;
const RETRY_INTERVALS = [0, 15 * 60 * 1000, 60 * 60 * 1000];

export async function createNotification(params: any) {
  console.log('[Notification] Created:', params);
  return { id: Date.now(), ...params, status: 'pending' };
}

function calculateNextRetry(retryCount: number): Date {
  const interval = RETRY_INTERVALS[retryCount] || RETRY_INTERVALS[RETRY_INTERVALS.length - 1];
  return new Date(Date.now() + interval);
}

export async function processNotificationQueue() {
  console.log('[Notification] Processing queue...');
  return [];
}

export async function getNotificationsByUserId(userId: string, limit = 20) {
  return [];
}

export async function markNotificationAsRead(notificationId: string) {
  console.log('[Notification] Marked as read:', notificationId);
}

export async function sendProjectStatusNotification(
  projectId: string,
  oldStatus: string,
  newStatus: string
) {
  console.log('[Notification] Project status changed:', { projectId, oldStatus, newStatus });
}

export async function sendPaymentDueReminders() {
  console.log('[Notification] Checking payment due reminders...');
  return 0;
}
