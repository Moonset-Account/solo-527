import { Match, Standing, Season, Team } from '@/lib/db/models';

export interface StandingCalculationResult {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  points: number;
}

export async function calculateStandings(seasonId: string): Promise<StandingCalculationResult[]> {
  const season = await Season.findById(seasonId);
  if (!season) {
    throw new Error('赛季不存在');
  }

  const finishedMatches = await Match.find({
    seasonId,
    status: 'FINISHED',
    homeScore: { $exists: true },
    awayScore: { $exists: true }
  });

  const teams = await Team.find({ seasonId, status: 'APPROVED' });
  
  const teamStats: Map<string, StandingCalculationResult> = new Map();

  teams.forEach(team => {
    teamStats.set(team._id.toString(), {
      teamId: team._id.toString(),
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifference: 0,
      points: 0
    });
  });

  const { pointsPerWin, pointsPerDraw, pointsPerLoss } = season.rules;

  finishedMatches.forEach(match => {
    const homeTeamId = match.homeTeamId.toString();
    const awayTeamId = match.awayTeamId.toString();
    const homeScore = match.homeScore || 0;
    const awayScore = match.awayScore || 0;

    const homeStats = teamStats.get(homeTeamId);
    const awayStats = teamStats.get(awayTeamId);

    if (homeStats) {
      homeStats.played++;
      homeStats.pointsFor += homeScore;
      homeStats.pointsAgainst += awayScore;
      homeStats.pointDifference = homeStats.pointsFor - homeStats.pointsAgainst;

      if (homeScore > awayScore) {
        homeStats.won++;
        homeStats.points += pointsPerWin;
      } else if (homeScore === awayScore) {
        homeStats.drawn++;
        homeStats.points += pointsPerDraw;
      } else {
        homeStats.lost++;
        homeStats.points += pointsPerLoss;
      }
    }

    if (awayStats) {
      awayStats.played++;
      awayStats.pointsFor += awayScore;
      awayStats.pointsAgainst += homeScore;
      awayStats.pointDifference = awayStats.pointsFor - awayStats.pointsAgainst;

      if (awayScore > homeScore) {
        awayStats.won++;
        awayStats.points += pointsPerWin;
      } else if (awayScore === homeScore) {
        awayStats.drawn++;
        awayStats.points += pointsPerDraw;
      } else {
        awayStats.lost++;
        awayStats.points += pointsPerLoss;
      }
    }
  });

  const results = Array.from(teamStats.values());

  results.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
    return b.pointsFor - a.pointsFor;
  });

  return results;
}

export async function saveStandings(seasonId: string, standings: StandingCalculationResult[]): Promise<void> {
  const now = new Date();

  for (let i = 0; i < standings.length; i++) {
    const standing = standings[i];
    
    await Standing.findOneAndUpdate(
      { seasonId, teamId: standing.teamId },
      {
        ...standing,
        rank: i + 1,
        lastUpdated: now,
        updatedAt: now
      },
      { upsert: true, new: true }
    );
  }
}

export async function recalculateStandings(seasonId: string): Promise<StandingCalculationResult[]> {
  const standings = await calculateStandings(seasonId);
  await saveStandings(seasonId, standings);
  return standings;
}

export async function updateStandingsAfterMatch(matchId: string): Promise<void> {
  const match = await Match.findById(matchId);
  if (!match || match.status !== 'FINISHED') {
    return;
  }

  await recalculateStandings(match.seasonId.toString());
}

export function generateSchedule(teams: string[], rounds: number, startDate: Date, daysBetweenRounds: number = 7): Array<{
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  startTime: Date;
}> {
  const matches: Array<{
    round: number;
    homeTeamId: string;
    awayTeamId: string;
    startTime: Date;
  }> = [];

  const numTeams = teams.length;
  const hasBye = numTeams % 2 !== 0;
  const teamsWithBye = hasBye ? [...teams, 'BYE'] : teams;
  const numRoundsPerCycle = hasBye ? numTeams : numTeams - 1;

  for (let round = 0; round < rounds; round++) {
    const cycleRound = round % numRoundsPerCycle;
    const isReturnLeg = Math.floor(round / numRoundsPerCycle) % 2 === 1;

    const roundTeams = [...teamsWithBye];
    const fixedTeam = roundTeams[0];
    const rotatingTeams = roundTeams.slice(1);

    const rotated = [
      ...rotatingTeams.slice(-cycleRound),
      ...rotatingTeams.slice(0, -cycleRound)
    ];

    const matchups: [string, string][] = [];
    const allRoundTeams = [fixedTeam, ...rotated];

    for (let i = 0; i < allRoundTeams.length / 2; i++) {
      const homeIdx = i;
      const awayIdx = allRoundTeams.length - 1 - i;
      
      if (allRoundTeams[homeIdx] !== 'BYE' && allRoundTeams[awayIdx] !== 'BYE') {
        if (isReturnLeg) {
          matchups.push([allRoundTeams[awayIdx], allRoundTeams[homeIdx]]);
        } else {
          matchups.push([allRoundTeams[homeIdx], allRoundTeams[awayIdx]]);
        }
      }
    }

    matchups.forEach(([home, away], matchIndex) => {
      const matchDate = new Date(startDate);
      matchDate.setDate(matchDate.getDate() + round * daysBetweenRounds);
      matchDate.setHours(19 + Math.floor(matchIndex / 2), 0, 0, 0);

      matches.push({
        round: round + 1,
        homeTeamId: home,
        awayTeamId: away,
        startTime: matchDate
      });
    });
  }

  return matches;
}
