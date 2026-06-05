import dbConnect from '@/lib/db';
import Standing from '@/models/Standing';
import Match from '@/models/Match';
import Score from '@/models/Score';
import Team from '@/models/Team';

export async function recalculateStandings(seasonId: string) {
  await dbConnect();
  const matches = await Match.find({
    seasonId,
    status: 'completed',
  }).select('_id homeTeamId awayTeamId');
  if (matches.length === 0) {
    return [];
  }
  const matchIds = matches.map((m) => m._id);
  const scores = await Score.find({
    matchId: { $in: matchIds },
    homeConfirmed: true,
    awayConfirmed: true,
  });
  const standingsMap = new Map<
    string,
    {
      teamId: string;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
    }
  >();
  for (const score of scores) {
    const match = matches.find((m) => m._id.equals(score.matchId));
    if (!match) continue;
    const homeId = match.homeTeamId.toString();
    const awayId = match.awayTeamId.toString();
    if (!standingsMap.has(homeId)) {
      standingsMap.set(homeId, {
        teamId: homeId,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, points: 0,
      });
    }
    if (!standingsMap.has(awayId)) {
      standingsMap.set(awayId, {
        teamId: awayId,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, points: 0,
      });
    }
    const home = standingsMap.get(homeId)!;
    const away = standingsMap.get(awayId)!;
    home.played++;
    away.played++;
    home.goalsFor += score.homeScore;
    home.goalsAgainst += score.awayScore;
    away.goalsFor += score.awayScore;
    away.goalsAgainst += score.homeScore;
    if (score.homeScore > score.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (score.homeScore < score.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }
  for (const [teamId, data] of standingsMap) {
    await Standing.findOneAndUpdate(
      { seasonId, teamId },
      {
        seasonId,
        teamId,
        played: data.played,
        won: data.won,
        drawn: data.drawn,
        lost: data.lost,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        points: data.points,
      },
      { upsert: true, new: true }
    );
  }
  const allTeamIds = await Team.find({ seasonId, status: 'approved' }).select('_id');
  for (const t of allTeamIds) {
    const tid = t._id.toString();
    if (!standingsMap.has(tid)) {
      await Standing.findOneAndUpdate(
        { seasonId, teamId: tid },
        {
          seasonId,
          teamId: tid,
          played: 0, won: 0, drawn: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, points: 0,
        },
        { upsert: true, new: true }
      );
    }
  }
  return getStandings(seasonId);
}

export async function getStandings(seasonId: string) {
  await dbConnect();
  const standings = await Standing.find({ seasonId })
    .populate('teamId', 'name')
    .sort({ points: -1, goalsFor: -1 });
  return standings;
}
