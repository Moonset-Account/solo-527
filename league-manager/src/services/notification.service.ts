import dbConnect from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { enqueue } from '@/lib/queue';
import Message from '@/models/Message';
import Team from '@/models/Team';
import Match from '@/models/Match';
import User from '@/models/User';
import { Types } from 'mongoose';

type MessageType = 'system' | 'review' | 'schedule' | 'score' | 'appeal';

async function getUserEmail(userId: string): Promise<string | null> {
  await dbConnect();
  const user = await User.findById(userId).select('email');
  return user?.email || null;
}

async function sendNotificationWithEmail(
  userId: string,
  title: string,
  content: string,
  type: MessageType,
  relatedId?: string
) {
  await dbConnect();
  const notificationData: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    title,
    content,
    type,
    read: false,
  };
  if (relatedId) {
    notificationData.relatedId = new Types.ObjectId(relatedId);
  }
  await Message.create(notificationData);

  const email = await getUserEmail(userId);
  if (email) {
    enqueue(sendEmail, [email, title, `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1B5E20;">${title}</h2>
      <p>${content}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
      <p style="color:#999;font-size:12px;">此邮件由业余联赛管理系统自动发送，请勿回复。</p>
    </div>`]);
  }
}

async function sendBulkNotificationsWithEmail(
  userIds: string[],
  title: string,
  content: string,
  type: MessageType,
  relatedId?: string
) {
  await dbConnect();
  const docs = userIds.map((uid) => {
    const doc: Record<string, unknown> = {
      userId: new Types.ObjectId(uid),
      title,
      content,
      type,
      read: false,
    };
    if (relatedId) {
      doc.relatedId = new Types.ObjectId(relatedId);
    }
    return doc;
  });
  await Message.insertMany(docs);

  for (const uid of userIds) {
    const email = await getUserEmail(uid);
    if (email) {
      enqueue(sendEmail, [email, title, `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1B5E20;">${title}</h2>
        <p>${content}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
        <p style="color:#999;font-size:12px;">此邮件由业余联赛管理系统自动发送，请勿回复。</p>
      </div>`]);
    }
  }
}

export async function sendNotification(
  userId: string,
  title: string,
  content: string,
  type: MessageType,
  relatedId?: string
) {
  return sendNotificationWithEmail(userId, title, content, type, relatedId);
}

export async function sendBulkNotifications(
  userIds: string[],
  title: string,
  content: string,
  type: MessageType,
  relatedId?: string
) {
  return sendBulkNotificationsWithEmail(userIds, title, content, type, relatedId);
}

export async function notifyTeamReview(teamId: string, action: 'approved' | 'rejected') {
  await dbConnect();
  const team = await Team.findById(teamId);
  if (!team) {
    throw new Error('队伍不存在');
  }
  const title = action === 'approved' ? '队伍审核通过' : '队伍审核未通过';
  const content =
    action === 'approved'
      ? `您的队伍「${team.name}」已通过审核，可以开始参加比赛。`
      : `您的队伍「${team.name}」未通过审核，请查看审核意见。`;
  return sendNotificationWithEmail(
    team.captainId.toString(),
    title,
    content,
    'review',
    teamId
  );
}

export async function notifyScheduleChange(matchId: string) {
  await dbConnect();
  const match = await Match.findById(matchId)
    .populate('homeTeamId')
    .populate('awayTeamId');
  if (!match) {
    throw new Error('比赛不存在');
  }
  const homeTeam = match.homeTeamId as unknown as { captainId: Types.ObjectId; name: string };
  const awayTeam = match.awayTeamId as unknown as { captainId: Types.ObjectId; name: string };
  const userIds = [homeTeam.captainId.toString(), awayTeam.captainId.toString()];
  if (match.refereeId) {
    userIds.push(match.refereeId.toString());
  }
  const title = '赛程变更通知';
  const content = `涉及「${homeTeam.name}」vs「${awayTeam.name}」的比赛信息已更新，请查看最新安排。`;
  return sendBulkNotificationsWithEmail(userIds, title, content, 'schedule', matchId);
}

export async function notifyScoreConfirmation(matchId: string) {
  await dbConnect();
  const match = await Match.findById(matchId)
    .populate('homeTeamId')
    .populate('awayTeamId');
  if (!match) {
    throw new Error('比赛不存在');
  }
  const homeTeam = match.homeTeamId as unknown as { captainId: Types.ObjectId; name: string };
  const awayTeam = match.awayTeamId as unknown as { captainId: Types.ObjectId; name: string };
  const userIds = [homeTeam.captainId.toString(), awayTeam.captainId.toString()];
  const title = '比分确认通知';
  const content = `「${homeTeam.name}」vs「${awayTeam.name}」的比赛比分已录入，请确认。`;
  return sendBulkNotificationsWithEmail(userIds, title, content, 'score', matchId);
}

export async function notifyAppealResult(appealId: string, action: 'upheld' | 'rejected', submitterId: string) {
  const title = action === 'upheld' ? '申诉已通过' : '申诉已驳回';
  const content = action === 'upheld'
    ? `您的申诉已通过，相关比赛结果将根据裁决进行调整。`
    : `您的申诉已被驳回，维持原判。`;
  return sendNotificationWithEmail(submitterId, title, content, 'appeal', appealId);
}

export async function notifyRosterLock(teamId: string) {
  await dbConnect();
  const team = await Team.findById(teamId);
  if (!team) return;
  const title = '名单已锁定';
  const content = `您的队伍「${team.name}」的参赛名单已被管理员锁定，此后不能再修改球员信息。`;
  return sendNotificationWithEmail(team.captainId.toString(), title, content, 'system', teamId);
}

export async function notifyNewTeamRegistration(adminId: string, teamName: string) {
  const title = '新球队报名';
  const content = `新球队「${teamName}」已提交报名申请，请及时审核。`;
  return sendNotificationWithEmail(adminId, title, content, 'review');
}
