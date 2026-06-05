import dbConnect from '@/lib/db';
import Team from '@/models/Team';
import Player from '@/models/Player';
import User from '@/models/User';
import { createAuditLog } from '@/lib/audit';
import { sendNotification, notifyTeamReview } from '@/services/notification.service';
import mongoose from 'mongoose';

interface CreateTeamData {
  name: string;
  captainId: string;
  seasonId: string;
  players: { name: string; number: number; position: string }[];
}

export async function createTeamWithPlayers(data: CreateTeamData) {
  await dbConnect();
  const session = await mongoose.startSession();
  try {
    let team: InstanceType<typeof Team> | null = null;
    const playerDocs: InstanceType<typeof Player>[] = [];
    await session.withTransaction(async () => {
      const [createdTeam] = await Team.create(
        [
          {
            name: data.name,
            captainId: data.captainId,
            seasonId: data.seasonId,
            status: 'pending',
            rosterLocked: false,
            players: [],
          },
        ],
        { session }
      );
      team = createdTeam;
      if (data.players && data.players.length > 0) {
        const playerData = data.players.map((p) => ({
          name: p.name,
          number: p.number,
          position: p.position,
          teamId: createdTeam._id,
        }));
        const createdPlayers = await Player.create(playerData, { session });
        playerDocs.push(...createdPlayers);
        const playerIds = createdPlayers.map((p: any) => p._id);
        await Team.updateOne(
          { _id: createdTeam._id },
          { $set: { players: playerIds } },
          { session }
        );
        team!.players = playerIds as any;
      }
    });
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length > 0) {
      const adminIds = admins.map((a) => a._id.toString());
      await sendNotification(
        adminIds[0],
        '新队伍注册待审核',
        `队伍「${data.name}」已提交注册，请尽快审核。`,
        'review',
        team!._id.toString()
      );
    }
    await createAuditLog('team', 'create_team', data.captainId, team!._id.toString(), {
      name: data.name,
      playerCount: data.players?.length || 0,
    });
    return { team, players: playerDocs };
  } finally {
    session.endSession();
  }
}

export async function reviewTeam(
  teamId: string,
  action: 'approved' | 'rejected',
  comment: string,
  adminId: string
) {
  await dbConnect();
  const team = await Team.findById(teamId);
  if (!team) {
    throw new Error('队伍不存在');
  }
  if (team.status !== 'pending') {
    throw new Error('该队伍已审核，无法重复操作');
  }
  team.status = action;
  team.reviewComment = comment;
  team.reviewedBy = adminId as any;
  await team.save();
  await createAuditLog('team', 'review_team', adminId, teamId, {
    action,
    comment,
  });
  await notifyTeamReview(teamId, action);
  return team;
}

export async function updateRoster(
  teamId: string,
  players: { name: string; number: number; position: string }[],
  userId: string
) {
  await dbConnect();
  const team = await Team.findById(teamId);
  if (!team) {
    throw new Error('队伍不存在');
  }
  if (team.rosterLocked) {
    throw new Error('名单已锁定，无法修改');
  }
  if (team.captainId.toString() !== userId) {
    throw new Error('只有队长可以修改名单');
  }
  await Player.deleteMany({ teamId });
  const playerData = players.map((p: { name: string; number: number; position: string }) => ({
    name: p.name,
    number: p.number,
    position: p.position,
    teamId: team._id,
  }));
  const createdPlayers = await Player.create(playerData);
  const playerIds = createdPlayers.map((p: any) => p._id);
  team.players = playerIds as any;
  await team.save();
  await createAuditLog('team', 'update_roster', userId, teamId, {
    playerCount: players.length,
  });
  return { team, players: createdPlayers };
}

export async function lockRoster(teamId: string, adminId: string) {
  await dbConnect();
  const team = await Team.findById(teamId);
  if (!team) {
    throw new Error('队伍不存在');
  }
  if (team.rosterLocked) {
    throw new Error('名单已锁定');
  }
  team.rosterLocked = true;
  team.rosterLockedAt = new Date();
  await team.save();
  await createAuditLog('team', 'lock_roster', adminId, teamId, {
    lockedAt: team.rosterLockedAt,
  });
  return team;
}
