import { Match, Season } from '@/lib/db/models';
import { addHours, differenceInHours, isBefore } from 'date-fns';

export async function validateRosterLock(matchId: string): Promise<{ valid: boolean; message?: string }> {
  const match = await Match.findById(matchId);
  
  if (!match) {
    return { valid: false, message: '比赛不存在' };
  }

  if (match.rosterLocked) {
    return { valid: false, message: '该比赛阵容已锁定，无法修改' };
  }

  const season = await Season.findById(match.seasonId);
  if (!season) {
    return { valid: false, message: '赛季不存在' };
  }

  const lockHoursBefore = season.rules.rosterLockHoursBeforeMatch || 1;
  const lockTime = addHours(match.startTime, -lockHoursBefore);
  const now = new Date();

  if (isBefore(now, lockTime)) {
    return { valid: true };
  }

  return { 
    valid: false, 
    message: `比赛开始前${lockHoursBefore}小时阵容已锁定，无法修改。锁定时间: ${lockTime.toLocaleString()}` 
  };
}

export async function validateAppealDeadline(matchId: string): Promise<{ valid: boolean; message?: string; deadline?: Date }> {
  const match = await Match.findById(matchId);
  
  if (!match) {
    return { valid: false, message: '比赛不存在' };
  }

  if (match.status !== 'FINISHED') {
    return { valid: false, message: '比赛尚未结束，无法提交申诉' };
  }

  const season = await Season.findById(match.seasonId);
  if (!season) {
    return { valid: false, message: '赛季不存在' };
  }

  const deadlineHours = season.rules.appealDeadlineHoursAfterMatch || 24;
  const matchEndTime = match.endTime || match.startTime;
  const deadline = addHours(matchEndTime, deadlineHours);
  const now = new Date();

  if (isBefore(now, deadline)) {
    return { valid: true, deadline };
  }

  const hoursPassed = differenceInHours(now, deadline);
  
  return { 
    valid: false, 
    deadline,
    message: `申诉已超过截止时间。截止时间为 ${deadline.toLocaleString()}，已超过 ${hoursPassed} 小时` 
  };
}

export async function autoLockRosters(): Promise<number> {
  const now = new Date();
  
  const matchesToLock = await Match.find({
    rosterLocked: false,
    status: 'SCHEDULED',
    lockTime: { $lte: now }
  });

  let lockedCount = 0;
  
  for (const match of matchesToLock) {
    const updated = await Match.findByIdAndUpdate(
      match._id,
      { 
        rosterLocked: true,
        updatedAt: now
      },
      { new: true }
    );
    
    if (updated?.rosterLocked) {
      lockedCount++;
    }
  }

  return lockedCount;
}

export async function autoUpdateAppealStatus(): Promise<number> {
  const now = new Date();
  
  const expiredAppeals = await Match.aggregate([
    {
      $match: {
        status: 'FINISHED',
        endTime: { $exists: true }
      }
    },
    {
      $lookup: {
        from: 'seasons',
        localField: 'seasonId',
        foreignField: '_id',
        as: 'season'
      }
    },
    {
      $unwind: '$season'
    },
    {
      $addFields: {
        appealDeadline: {
          $add: ['$endTime', { $multiply: ['$season.rules.appealDeadlineHoursAfterMatch', 3600000] }]
        }
      }
    },
    {
      $match: {
        appealDeadline: { $lte: now }
      }
    }
  ]);

  return expiredAppeals.length;
}

export async function calculateLockTime(startTime: Date, seasonId: string): Promise<Date> {
  const season = await Season.findById(seasonId);
  const lockHours = season?.rules.rosterLockHoursBeforeMatch || 1;
  return addHours(startTime, -lockHours);
}

export async function calculateAppealDeadline(matchEndTime: Date, seasonId: string): Promise<Date> {
  const season = await Season.findById(seasonId);
  const deadlineHours = season?.rules.appealDeadlineHoursAfterMatch || 24;
  return addHours(matchEndTime, deadlineHours);
}
