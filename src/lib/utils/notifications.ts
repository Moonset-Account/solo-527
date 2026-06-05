import { Notification } from '@/lib/db/models';
import type { User } from '@/lib/types';

export interface NotificationPayload {
  userId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  title: string;
  content: string;
  templateId?: string;
}

const RETRY_DELAYS = [60000, 300000, 900000, 1800000, 3600000];

export async function createNotification(payload: NotificationPayload): Promise<string> {
  const notification = await Notification.create({
    ...payload,
    status: 'PENDING',
    retryCount: 0,
    maxRetries: RETRY_DELAYS.length,
  });

  processNotification(notification._id.toString()).catch(console.error);

  return notification._id.toString();
}

export async function processNotification(notificationId: string): Promise<boolean> {
  const notification = await Notification.findById(notificationId);
  
  if (!notification || notification.status === 'SENT') {
    return false;
  }

  try {
    const success = await sendNotification({
      type: notification.type,
      recipient: notification.userId,
      title: notification.title,
      content: notification.content,
    });

    if (success) {
      await Notification.findByIdAndUpdate(notificationId, {
        status: 'SENT',
        sentAt: new Date(),
        errorMessage: undefined,
      });
      return true;
    } else {
      throw new Error('Notification delivery failed');
    }
  } catch (error) {
    const retryCount = notification.retryCount + 1;
    
    if (retryCount >= notification.maxRetries) {
      await Notification.findByIdAndUpdate(notificationId, {
        status: 'FAILED',
        retryCount,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }

    const nextDelay = RETRY_DELAYS[retryCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    const nextRetryAt = new Date(Date.now() + nextDelay);

    await Notification.findByIdAndUpdate(notificationId, {
      status: 'PENDING',
      retryCount,
      nextRetryAt,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    scheduleRetry(notificationId, nextDelay);
    return false;
  }
}

function scheduleRetry(notificationId: string, delay: number): void {
  setTimeout(() => {
    processNotification(notificationId).catch(console.error);
  }, delay);
}

async function sendNotification(params: {
  type: string;
  recipient: string;
  title: string;
  content: string;
}): Promise<boolean> {
  console.log(`Sending ${params.type} notification to ${params.recipient}: ${params.title}`);
  
  switch (params.type) {
    case 'IN_APP':
      return true;
    case 'EMAIL':
      return Math.random() > 0.1;
    case 'SMS':
      return Math.random() > 0.15;
    case 'PUSH':
      return Math.random() > 0.05;
    default:
      return true;
  }
}

export async function processPendingNotifications(): Promise<void> {
  const now = new Date();
  
  const pendingNotifications = await Notification.find({
    status: 'PENDING',
    $or: [
      { nextRetryAt: { $exists: false } },
      { nextRetryAt: { $lte: now } }
    ],
    retryCount: { $lt: 5 }
  }).limit(50);

  for (const notification of pendingNotifications) {
    await processNotification(notification._id.toString());
  }
}

export async function createMatchNotifications(matchId: string, eventType: string): Promise<void> {
  const { Match, User, Team } = await import('@/lib/db/models');
  
  const match = await Match.findById(matchId)
    .populate('homeTeamId')
    .populate('awayTeamId')
    .populate('refereeIds');

  if (!match) return;

  const homeTeam = match.homeTeamId as any;
  const awayTeam = match.awayTeamId as any;
  const referees = match.refereeIds as unknown as User[];

  const teamManagers = await User.find({
    role: 'TEAM_MANAGER',
    _id: { $in: [homeTeam?.managerId, awayTeam?.managerId].filter(Boolean) }
  });

  const notificationPromises: Promise<string>[] = [];

  switch (eventType) {
    case 'SCHEDULED':
      teamManagers.forEach(manager => {
        notificationPromises.push(createNotification({
          userId: manager._id.toString(),
          type: 'IN_APP',
          title: '新赛程安排',
          content: `您的球队${match.homeTeamId === homeTeam?._id ? homeTeam?.name : awayTeam?.name}有新的比赛安排，时间：${match.startTime.toLocaleString()}`,
          templateId: 'MATCH_SCHEDULED'
        }));
      });
      referees.forEach(referee => {
        notificationPromises.push(createNotification({
          userId: referee._id.toString(),
          type: 'IN_APP',
          title: '新执法任务',
          content: `您被安排执法 ${homeTeam?.name} vs ${awayTeam?.name}，时间：${match.startTime.toLocaleString()}`,
          templateId: 'REFEREE_ASSIGNED'
        }));
      });
      break;

    case 'ROSTER_LOCKED':
      teamManagers.forEach(manager => {
        notificationPromises.push(createNotification({
          userId: manager._id.toString(),
          type: 'IN_APP',
          title: '阵容即将锁定',
          content: `${homeTeam?.name} vs ${awayTeam?.name} 的阵容将在1小时后锁定，请及时确认阵容`,
          templateId: 'ROSTER_LOCK_WARNING'
        }));
      });
      break;

    case 'SCORE_UPDATED':
      teamManagers.forEach(manager => {
        notificationPromises.push(createNotification({
          userId: manager._id.toString(),
          type: 'IN_APP',
          title: '比赛比分更新',
          content: `${homeTeam?.name} ${match.homeScore} - ${match.awayScore} ${awayTeam?.name}`,
          templateId: 'SCORE_UPDATED'
        }));
      });
      break;

    case 'APPEAL_DEADLINE':
      teamManagers.forEach(manager => {
        notificationPromises.push(createNotification({
          userId: manager._id.toString(),
          type: 'IN_APP',
          title: '申诉截止提醒',
          content: `${homeTeam?.name} vs ${awayTeam?.name} 的申诉截止时间即将到限`,
          templateId: 'APPEAL_DEADLINE'
        }));
      });
      break;
  }

  await Promise.all(notificationPromises);
}

export async function rollbackNotification(notificationId: string): Promise<void> {
  await Notification.findByIdAndUpdate(notificationId, {
    status: 'FAILED',
    errorMessage: 'Manually rolled back',
  });
}
