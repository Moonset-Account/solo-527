import dbConnect from '@/lib/db';
import Match from '@/models/Match';
import Team from '@/models/Team';
import Venue from '@/models/Venue';
import { createAuditLog } from '@/lib/audit';
import { sendNotification, notifyScheduleChange } from '@/services/notification.service';
import { addDays } from 'date-fns';

function generateRoundRobin(teamIds: string[]): { round: number; home: string; away: string }[][] {
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) {
    teams.push('bye');
  }
  const n = teams.length;
  const rounds: { round: number; home: string; away: string }[][] = [];
  const half = n / 2;
  const fixed = teams[0];
  const rotating = teams.slice(1);
  for (let round = 0; round < n - 1; round++) {
    const roundMatches: { round: number; home: string; away: string }[] = [];
    const current = [fixed, ...rotating];
    for (let i = 0; i < half; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      if (home !== 'bye' && away !== 'bye') {
        const isHome = round % 2 === 0;
        roundMatches.push({
          round: round + 1,
          home: isHome ? home : away,
          away: isHome ? away : home,
        });
      }
    }
    rounds.push(roundMatches);
    rotating.push(rotating.shift()!);
  }
  return rounds;
}

export async function generateSchedule(
  seasonId: string,
  startDate: string | Date,
  interval: number,
  venueIds: string[]
) {
  await dbConnect();
  const teams = await Team.find({ seasonId, status: 'approved' }).select('_id');
  if (teams.length < 2) {
    throw new Error('审核通过的队伍不足，无法生成赛程');
  }
  const teamIds = teams.map((t) => t._id.toString());
  const allRounds = generateRoundRobin(teamIds);
  const venues = await Venue.find({ _id: { $in: venueIds } }).select('_id');
  if (venues.length === 0) {
    throw new Error('未找到有效场地');
  }
  const venuePool = venues.map((v) => v._id);
  const matches: InstanceType<typeof Match>[] = [];
  let currentDate = new Date(startDate);
  for (const roundMatches of allRounds) {
    for (const rm of roundMatches) {
      const venueIndex = matches.length % venuePool.length;
      const match = await Match.create({
        seasonId,
        homeTeamId: rm.home,
        awayTeamId: rm.away,
        matchDate: new Date(currentDate),
        venueId: venuePool[venueIndex],
        status: 'scheduled',
        round: rm.round,
      });
      matches.push(match);
    }
    currentDate = addDays(currentDate, interval);
  }
  await createAuditLog('schedule', 'generate', 'system', seasonId, {
    teamCount: teamIds.length,
    matchCount: matches.length,
    startDate,
    interval,
  });
  for (const match of matches) {
    try {
      await notifyScheduleChange(match._id.toString());
    } catch {}
  }
  return matches;
}

export async function adjustMatch(
  matchId: string,
  data: { matchDate?: Date; venueId?: string; status?: string; adjustmentReason?: string },
  adminId: string
) {
  await dbConnect();
  const match = await Match.findById(matchId);
  if (!match) {
    throw new Error('比赛不存在');
  }
  if (data.matchDate) match.matchDate = data.matchDate;
  if (data.venueId) match.venueId = data.venueId as any;
  if (data.status) match.status = data.status as any;
  if (data.adjustmentReason) match.adjustmentReason = data.adjustmentReason;
  match.adjustedBy = adminId as any;
  await match.save();
  await createAuditLog('schedule', 'adjust', adminId, matchId, {
    updates: data,
  });
  await notifyScheduleChange(matchId);
  return match;
}

export async function assignReferee(
  matchId: string,
  refereeId: string,
  adminId: string
) {
  await dbConnect();
  const match = await Match.findById(matchId);
  if (!match) {
    throw new Error('比赛不存在');
  }
  match.refereeId = refereeId as any;
  await match.save();
  await createAuditLog('referee', 'assign', adminId, matchId, {
    refereeId,
  });
  await sendNotification(
    refereeId,
    '裁判指派通知',
    '您已被指派为一场比赛的裁判，请查看赛程详情。',
    'schedule',
    matchId
  );
  return match;
}
