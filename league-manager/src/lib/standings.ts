import Score from '@/models/Score';
import Match from '@/models/Match';
import Standing from '@/models/Standing';
import dbConnect from '@/lib/db';

export async function recalculateStandings(seasonId: string) {
  await dbConnect();

  const matches = await Match.find({ seasonId, status: 'completed' });
  const matchIds = matches.map((m) => m._id);

  const confirmedScores = await Score.find({
    matchId: { $in: matchIds },
    homeConfirmed: true,
    awayConfirmed: true,
  });

  const map = new Map<
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

  for (const score of confirmedScores) {
    const match = matches.find((m) => m._id.equals(score.matchId));
    if (!match) continue;

    const homeId = match.homeTeamId.toString();
    const awayId = match.awayTeamId.toString();

    if (!map.has(homeId)) {
      map.set(homeId, { teamId: homeId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
    }
    if (!map.has(awayId)) {
      map.set(awayId, { teamId: awayId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
    }

    const home = map.get(homeId)!;
    const away = map.get(awayId)!;

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

  await Standing.deleteMany({ seasonId });

  const results = [];
  for (const [, data] of map) {
    results.push(
      await Standing.create({
        seasonId,
        teamId: data.teamId,
        played: data.played,
        won: data.won,
        drawn: data.drawn,
        lost: data.lost,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        points: data.points,
      })
    );
  }

  return results;
}
