import dbConnect from '@/lib/db';
import Score from '@/models/Score';
import Match from '@/models/Match';
import Team from '@/models/Team';
import { createAuditLog } from '@/lib/audit';
import { notifyScoreConfirmation } from '@/services/notification.service';
import { recalculateStandings } from '@/services/standing.service';

type EventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'other';

interface ScoreEvent {
  eventType: EventType;
  minute: number;
  playerId?: string;
  description?: string;
}

export async function recordScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  events: ScoreEvent[],
  refereeId: string
) {
  await dbConnect();
  const match = await Match.findById(matchId);
  if (!match) {
    throw new Error('比赛不存在');
  }
  if (match.refereeId?.toString() !== refereeId) {
    throw new Error('只有指派裁判可以录入比分');
  }
  const existingScore = await Score.findOne({ matchId });
  if (existingScore) {
    throw new Error('该比赛比分已录入');
  }
  const score = await Score.create({
    matchId,
    homeScore,
    awayScore,
    events: events.map((e) => ({
      eventType: e.eventType,
      minute: e.minute,
      playerId: e.playerId,
      description: e.description,
    })),
    homeConfirmed: false,
    awayConfirmed: false,
    recordedBy: refereeId,
  });
  match.status = 'completed';
  await match.save();
  await createAuditLog('score', 'record', refereeId, matchId, {
    homeScore,
    awayScore,
    eventCount: events.length,
  });
  await notifyScoreConfirmation(matchId);
  return score;
}

export async function confirmScore(
  scoreId: string,
  teamSide: 'home' | 'away',
  userId: string
) {
  await dbConnect();
  const score = await Score.findById(scoreId);
  if (!score) {
    throw new Error('比分记录不存在');
  }
  const match = await Match.findById(score.matchId);
  if (!match) {
    throw new Error('比赛不存在');
  }
  const teamId = teamSide === 'home' ? match.homeTeamId : match.awayTeamId;
  const team = await Team.findById(teamId);
  if (!team || team.captainId.toString() !== userId) {
    throw new Error(`您不是${teamSide === 'home' ? '主' : '客'}队队长，无法确认`);
  }
  if (teamSide === 'home') {
    if (score.homeConfirmed) {
      throw new Error('主队已确认，请勿重复操作');
    }
    score.homeConfirmed = true;
  } else {
    if (score.awayConfirmed) {
      throw new Error('客队已确认，请勿重复操作');
    }
    score.awayConfirmed = true;
  }
  if (score.homeConfirmed && score.awayConfirmed) {
    score.confirmedAt = new Date();
  }
  await score.save();
  await createAuditLog('score', 'confirm', userId, scoreId, {
    teamSide,
    matchId: match._id.toString(),
  });
  if (score.homeConfirmed && score.awayConfirmed) {
    await recalculateStandings(match.seasonId.toString());
  }
  return score;
}

export async function getPendingConfirmations(teamId: string) {
  await dbConnect();
  const team = await Team.findById(teamId);
  if (!team) {
    throw new Error('队伍不存在');
  }
  const homeMatches = await Match.find({ homeTeamId: teamId }).select('_id');
  const awayMatches = await Match.find({ awayTeamId: teamId }).select('_id');
  const homeMatchIds = homeMatches.map((m) => m._id);
  const awayMatchIds = awayMatches.map((m) => m._id);
  const homePending = await Score.find({
    matchId: { $in: homeMatchIds },
    homeConfirmed: false,
  }).populate('matchId');
  const awayPending = await Score.find({
    matchId: { $in: awayMatchIds },
    awayConfirmed: false,
  }).populate('matchId');
  return { homePending, awayPending };
}
