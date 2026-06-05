import dbConnect from '@/lib/db';
import Appeal from '@/models/Appeal';
import Match from '@/models/Match';
import Season from '@/models/Season';
import User from '@/models/User';
import Score from '@/models/Score';
import { createAuditLog } from '@/lib/audit';
import { sendNotification } from '@/services/notification.service';
import { recalculateStandings } from '@/services/standing.service';
import { addDays } from 'date-fns';

export async function submitAppeal(
  matchId: string,
  reason: string,
  evidence: string[],
  submitterId: string,
  seasonId: string
) {
  await dbConnect();
  const match = await Match.findById(matchId);
  if (!match) {
    throw new Error('比赛不存在');
  }
  const season = await Season.findById(seasonId);
  if (!season) {
    throw new Error('赛季不存在');
  }
  const deadline = addDays(new Date(match.matchDate), season.appealDeadlineDays);
  if (new Date() > deadline) {
    throw new Error('申诉期限已过，无法提交申诉');
  }
  const existingAppeal = await Appeal.findOne({
    matchId,
    submittedBy: submitterId,
    status: 'pending',
  });
  if (existingAppeal) {
    throw new Error('您已对该比赛提交过待处理申诉');
  }
  const appeal = await Appeal.create({
    matchId,
    submittedBy: submitterId,
    reason,
    evidence,
    status: 'pending',
    deadline,
  });
  await createAuditLog('appeal', 'submit', submitterId, matchId, {
    reason,
  });
  const admins = await User.find({ role: 'admin' }).select('_id');
  for (const admin of admins) {
    await sendNotification(
      admin._id.toString(),
      '新申诉待处理',
      '一场比赛的申诉已提交，请尽快处理。',
      'appeal',
      appeal._id.toString()
    );
  }
  return appeal;
}

export async function resolveAppeal(
  appealId: string,
  action: 'upheld' | 'rejected' | 'expired',
  comment: string,
  adminId: string,
  scoreChange?: { homeScore: number; awayScore: number }
) {
  await dbConnect();
  const appeal = await Appeal.findById(appealId);
  if (!appeal) {
    throw new Error('申诉不存在');
  }
  if (appeal.status !== 'pending') {
    throw new Error('该申诉已处理，无法重复操作');
  }
  appeal.status = action;
  appeal.resolution = comment;
  appeal.resolvedBy = adminId as any;
  appeal.resolvedAt = new Date();
  await appeal.save();
  if (action === 'upheld' && scoreChange) {
    const match = await Match.findById(appeal.matchId);
    if (match) {
      const score = await Score.findOne({ matchId: appeal.matchId });
      if (score) {
        score.homeScore = scoreChange.homeScore;
        score.awayScore = scoreChange.awayScore;
        await score.save();
      }
      await recalculateStandings(match.seasonId.toString());
    }
  }
  await createAuditLog('appeal', 'resolve', adminId, appealId, {
    action,
    scoreChange: scoreChange || null,
  });
  const resultMessage =
    action === 'upheld'
      ? '您的申诉已被支持。'
      : action === 'rejected'
        ? '您的申诉已被驳回。'
        : '您的申诉已过期。';
  await sendNotification(
    appeal.submittedBy.toString(),
    '申诉处理结果通知',
    resultMessage,
    'appeal',
    appealId
  );
  return appeal;
}
