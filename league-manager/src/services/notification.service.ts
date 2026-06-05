import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Team from '@/models/Team';
import Match from '@/models/Match';
import { Types } from 'mongoose';

type MessageType = 'system' | 'review' | 'schedule' | 'score' | 'appeal';

export async function sendNotification(
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
  return Message.create(notificationData);
}

export async function sendBulkNotifications(
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
  return Message.insertMany(docs);
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
  return sendNotification(
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
  return sendBulkNotifications(userIds, title, content, 'schedule', matchId);
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
  return sendBulkNotifications(userIds, title, content, 'score', matchId);
}
