import dbConnect from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import User from '@/models/User';
import Team from '@/models/Team';
import Player from '@/models/Player';
import Season from '@/models/Season';
import Venue from '@/models/Venue';
import Match from '@/models/Match';
import Score from '@/models/Score';
import Standing from '@/models/Standing';
import AuditLog from '@/models/AuditLog';
import bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';

const TEAM_NAMES = ['雄鹰队', '猛虎队', '飞龙队', '烈焰队'];
const POSITIONS = ['前锋', '中锋', '后卫', '守门员', '边锋', '后腰', '前腰', '边后卫'];

const PLAYER_NAMES = [
  '张伟', '王磊', '李强', '刘洋', '陈明', '杨帆', '赵鹏', '黄海',
  '周军', '吴波', '徐杰', '孙涛', '马超', '朱峰', '胡斌', '郭亮',
  '何勇', '林辉', '罗文', '梁刚', '宋飞', '唐龙', '韩冰', '冯雷',
  '董威', '萧逸', '程远', '曹毅', '袁昊', '邓博', '许浩', '傅鑫',
  '沈凯', '曾睿', '彭程', '吕晨', '苏阳', '蒋骏', '蔡翰', '贾宁',
];

function generateRoundRobin(teamIds: string[]) {
  const teams = [...teamIds];
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
      const isHome = round % 2 === 0;
      roundMatches.push({
        round: round + 1,
        home: isHome ? home : away,
        away: isHome ? away : home,
      });
    }
    rounds.push(roundMatches);
    rotating.push(rotating.shift()!);
  }
  return rounds;
}

export async function POST() {
  try {
    await dbConnect();

    await AuditLog.deleteMany({});
    await Score.deleteMany({});
    await Standing.deleteMany({});
    await Match.deleteMany({});
    await Player.deleteMany({});
    await Team.deleteMany({});
    await Season.deleteMany({});
    await User.deleteMany({});

    const salt = await bcrypt.genSalt(10);

    const admin = await User.create({
      name: '系统管理员',
      email: 'admin@league.com',
      password: await bcrypt.hash('admin123', salt),
      role: 'admin',
    });

    const captains = [];
    for (let i = 1; i <= 4; i++) {
      const captain = await User.create({
        name: `队长${i}`,
        email: `captain${i}@league.com`,
        password: await bcrypt.hash('captain123', salt),
        role: 'captain',
      });
      captains.push(captain);
    }

    const referees = [];
    for (let i = 1; i <= 2; i++) {
      const referee = await User.create({
        name: `裁判${i}`,
        email: `referee${i}@league.com`,
        password: await bcrypt.hash('referee123', salt),
        role: 'referee',
      });
      referees.push(referee);
    }

    const season = await Season.create({
      name: '2024春季联赛',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-06-30'),
      status: 'active',
      appealDeadlineDays: 2,
    });

    const venues = await Venue.insertMany([
      { name: '城市体育中心', address: '市中心大道100号', capacity: 5000 },
      { name: '社区运动场', address: '和平路200号', capacity: 2000 },
    ]);

    const teams = [];
    let playerIndex = 0;
    for (let i = 0; i < 4; i++) {
      const playerCount = 8 + Math.floor(Math.random() * 3);
      const team = await Team.create({
        name: TEAM_NAMES[i],
        captainId: captains[i]._id,
        seasonId: season._id,
        status: 'approved',
        rosterLocked: true,
        rosterLockedAt: new Date('2024-02-28'),
        reviewedBy: admin._id,
        reviewComment: '审核通过',
        players: [],
      });

      const playerDocs = [];
      for (let p = 0; p < playerCount; p++) {
        const player = await Player.create({
          name: PLAYER_NAMES[playerIndex % PLAYER_NAMES.length],
          number: p + 1,
          position: POSITIONS[p % POSITIONS.length],
          teamId: team._id,
        });
        playerDocs.push(player);
        playerIndex++;
      }

      team.players = playerDocs.map((p) => p._id);
      await team.save();

      captains[i].teamId = team._id;
      await captains[i].save();

      teams.push(team);
    }

    const teamIds = teams.map((t) => t._id.toString());
    const venueIds = venues.map((v) => v._id);
    const allRounds = generateRoundRobin(teamIds);

    const matches: InstanceType<typeof Match>[] = [];
    let matchDate = new Date('2024-03-02T14:00:00');
    for (const roundMatches of allRounds) {
      for (const rm of roundMatches) {
        const venueIndex = matches.length % venueIds.length;
        const refereeIndex = matches.length % referees.length;
        const match = await Match.create({
          seasonId: season._id,
          homeTeamId: rm.home,
          awayTeamId: rm.away,
          venueId: venueIds[venueIndex],
          refereeId: referees[refereeIndex]._id,
          matchDate: new Date(matchDate),
          status: 'scheduled',
          round: rm.round,
        });
        matches.push(match);
      }
      matchDate = addDays(matchDate, 7);
    }

    const completedMatches = matches.slice(0, 4);
    const scores = [];
    for (const match of completedMatches) {
      match.status = 'completed';
      await match.save();

      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 4);

      const events = [];
      for (let e = 0; e < homeScore; e++) {
        const team = await Team.findById(match.homeTeamId);
        const players = team?.players || [];
        events.push({
          eventType: 'goal' as const,
          playerId: players.length > 0 ? players[Math.floor(Math.random() * players.length)] : undefined,
          minute: Math.floor(Math.random() * 90) + 1,
          description: '进球',
        });
      }
      for (let e = 0; e < awayScore; e++) {
        const team = await Team.findById(match.awayTeamId);
        const players = team?.players || [];
        events.push({
          eventType: 'goal' as const,
          playerId: players.length > 0 ? players[Math.floor(Math.random() * players.length)] : undefined,
          minute: Math.floor(Math.random() * 90) + 1,
          description: '进球',
        });
      }

      const score = await Score.create({
        matchId: match._id,
        homeScore,
        awayScore,
        recordedBy: referees[0]._id,
        homeConfirmed: true,
        awayConfirmed: true,
        confirmedAt: new Date(match.matchDate.getTime() + 3600000),
        events,
      });
      scores.push(score);
    }

    const standingsMap = new Map<string, {
      teamId: string;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
    }>();

    for (const score of scores) {
      const match = completedMatches.find((m) => m._id.equals(score.matchId));
      if (!match) continue;
      const homeId = match.homeTeamId.toString();
      const awayId = match.awayTeamId.toString();
      if (!standingsMap.has(homeId)) {
        standingsMap.set(homeId, { teamId: homeId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
      }
      if (!standingsMap.has(awayId)) {
        standingsMap.set(awayId, { teamId: awayId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
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

    for (const teamId of teamIds) {
      const data = standingsMap.get(teamId) || {
        teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
      };
      await Standing.create({
        teamId: data.teamId,
        seasonId: season._id,
        played: data.played,
        won: data.won,
        drawn: data.drawn,
        lost: data.lost,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        points: data.points,
      });
    }

    await createAuditLog('user', 'seed', admin._id.toString(), undefined, { message: '创建种子数据用户' });
    await createAuditLog('team', 'seed', admin._id.toString(), undefined, { message: '创建种子数据队伍', count: teams.length });
    await createAuditLog('schedule', 'seed', admin._id.toString(), season._id.toString(), { message: '生成循环赛程', matchCount: matches.length });
    await createAuditLog('score', 'seed', admin._id.toString(), undefined, { message: '创建示例比分', count: scores.length });
    await createAuditLog('venue', 'seed', admin._id.toString(), undefined, { message: '创建场地', count: venues.length });

    return successResponse({
      message: '种子数据创建成功',
      summary: {
        users: { admin: 1, captains: captains.length, referees: referees.length },
        teams: teams.length,
        players: playerIndex,
        season: season.name,
        venues: venues.length,
        matches: matches.length,
        completedMatches: completedMatches.length,
        scores: scores.length,
        standings: standingsMap.size,
      },
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : '种子数据创建失败';
    return errorResponse(message, 500);
  }
}
