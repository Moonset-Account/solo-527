import { Router } from 'express';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { success } from '../utils/response';
import { CheckInStatus, MemberStatus, TodoStatus, TodoType } from '@prisma/client';

const router = Router();

router.get('/dashboard', async (_req, res, next) => {
  try {
    const now = dayjs();
    const todayStart = now.startOf('day');
    const weekStart = now.startOf('week');
    const monthStart = now.startOf('month');

    const [
      memberStats,
      todayCheckIn,
      todayNewMembers,
      activeCamps,
      pendingTodos,
      laggingCount,
      expiringSoonCount,
    ] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) as expired,
          SUM(CASE WHEN isLagging = 1 THEN 1 ELSE 0 END) as lagging
        FROM Member
      `),
      prisma.checkIn.count({
        where: {
          status: { in: [CheckInStatus.COMPLETED, CheckInStatus.LATE] },
          checkInDate: { gte: todayStart.toDate() },
        },
      }),
      prisma.member.count({
        where: { createdAt: { gte: todayStart.toDate() } },
      }),
      prisma.camp.findMany({
        where: { status: { in: ['ONGOING', 'UPCOMING'] } },
        orderBy: { startDate: 'asc' },
        take: 5,
        include: {
          _count: { select: { memberCamps: { where: { isActive: true } } } },
          teacher: { select: { id: true, name: true } },
        },
      }),
      prisma.todo.count({
        where: { status: { in: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS] } },
      }),
      prisma.fallingBehind.count({
        where: { followUpStatus: { not: 'RESOLVED' }, resolvedAt: null, lagDays: { gte: 2 } },
      }),
      prisma.member.count({
        where: {
          status: MemberStatus.ACTIVE,
          expiresAt: { gte: now.toDate(), lte: now.add(7, 'day').toDate() },
        },
      }),
    ]);

    const weeklyCheckIn = await prisma.checkIn.groupBy({
      by: ['status'],
      where: { checkInDate: { gte: weekStart.toDate() } },
      _count: true,
    });

    const monthlyCheckIn = await prisma.checkIn.groupBy({
      by: ['status'],
      where: { checkInDate: { gte: monthStart.toDate() } },
      _count: true,
    });

    const todoStats = await prisma.todo.groupBy({
      by: ['status', 'priority'],
      where: { status: { in: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS] } },
      _count: true,
    });

    const camps = activeCamps.map((c: any) => ({
      ...c,
      memberCount: c._count.memberCamps,
      progress: c.status === 'ONGOING'
        ? Math.min(100, Math.round((now.diff(c.startDate, 'day') + 1) / c.totalDays * 100))
        : 0,
      _count: undefined,
    }));

    res.json(success({
      overview: {
        totalMembers: Number(memberStats[0]?.total) || 0,
        activeMembers: Number(memberStats[0]?.active) || 0,
        expiredMembers: Number(memberStats[0]?.expired) || 0,
        laggingMembers: Number(memberStats[0]?.lagging) || 0,
        todayCheckIn,
        todayNewMembers,
        pendingTodos,
        laggingCount,
        expiringSoonCount,
        campCount: camps.length,
      },
      weeklyCheckIn,
      monthlyCheckIn,
      todoStats,
      upcomingCamps: camps,
    }));
  } catch (err) {
    next(err);
  }
});

router.get('/checkin', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const campId = req.query.campId ? parseInt(req.query.campId as string) : undefined;
    const startDate = dayjs().subtract(days - 1, 'day').startOf('day');

    const where: any = { checkInDate: { gte: startDate.toDate() } };
    if (campId) where.campId = campId;

    const rawData = await prisma.checkIn.groupBy({
      by: ['checkInDate', 'status'],
      where,
      _count: true,
    });

    const daily: any[] = [];
    for (let i = 0; i < days; i++) {
      const d = startDate.add(i, 'day');
      const dStr = d.format('YYYY-MM-DD');
      const dayData = rawData.filter(
        (x) => dayjs(x.checkInDate).format('YYYY-MM-DD') === dStr
      );
      const total = dayData.reduce((sum, x) => sum + x._count, 0);
      const completed = dayData.find((x) => x.status === CheckInStatus.COMPLETED)?._count || 0;
      const late = dayData.find((x) => x.status === CheckInStatus.LATE)?._count || 0;
      const missed = dayData.find((x) => x.status === CheckInStatus.MISSED)?._count || 0;
      const pending = dayData.find((x) => x.status === CheckInStatus.PENDING)?._count || 0;
      const effective = completed + late + missed;
      daily.push({
        date: dStr,
        weekDay: d.format('ddd'),
        total,
        completed,
        late,
        missed,
        pending,
        effectiveRate: effective > 0 ? Math.round(((completed + late) / effective) * 100) : 0,
      });
    }

    const campStats = campId ? null : await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        c.id,
        c.name,
        c.status,
        c.totalDays,
        c.startDate,
        c.endDate,
        COUNT(DISTINCT mc.memberId) as memberCount,
        COUNT(DISTINCT CASE WHEN ci.status IN ('COMPLETED','LATE') THEN ci.memberId END) as activeMembers
      FROM Camp c
      LEFT JOIN MemberCamp mc ON c.id = mc.campId AND mc.isActive = 1
      LEFT JOIN CheckIn ci ON c.id = ci.campId AND ci.checkInDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      WHERE c.status IN ('ONGOING','UPCOMING')
      GROUP BY c.id
      ORDER BY c.startDate DESC
    `);

    const summary = {
      totalRecords: rawData.reduce((s, r) => s + r._count, 0),
      completedCount: rawData.filter(r => r.status === CheckInStatus.COMPLETED).reduce((s, r) => s + r._count, 0),
      lateCount: rawData.filter(r => r.status === CheckInStatus.LATE).reduce((s, r) => s + r._count, 0),
      missedCount: rawData.filter(r => r.status === CheckInStatus.MISSED).reduce((s, r) => s + r._count, 0),
    };

    res.json(success({ daily, campStats, summary }));
  } catch (err) {
    next(err);
  }
});

router.get('/retention', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = dayjs().subtract(days - 1, 'day').startOf('day');

    const retentionData = await prisma.subscriptionRetention.findMany({
      where: { reportDate: { gte: startDate.toDate() } },
      orderBy: { reportDate: 'asc' },
    });

    const newBySource = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        cs.id as sourceId,
        cs.name as sourceName,
        cs.channel,
        COUNT(m.id) as newCount
      FROM Member m
      LEFT JOIN ConversionSource cs ON m.conversionSourceId = cs.id
      WHERE m.createdAt >= ?
      GROUP BY cs.id, cs.name, cs.channel
      ORDER BY newCount DESC
    `, startDate.toDate());

    const expiredHandled = await prisma.todo.findMany({
      where: {
        type: TodoType.COURSE_EXPIRE,
        createdAt: { gte: startDate.toDate() },
      },
      select: {
        id: true, status: true, createdAt: true,
        member: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = retentionData.length > 0
      ? {
          avgRetention: retentionData.reduce((s, r) => s + r.retentionRate, 0) / retentionData.length,
          avgChurn: retentionData.reduce((s, r) => s + r.churnRate, 0) / retentionData.length,
          totalNew: retentionData.reduce((s, r) => s + r.newMembers, 0),
          totalRenewed: retentionData.reduce((s, r) => s + r.renewedMembers, 0),
          totalExpired: retentionData.reduce((s, r) => s + r.expiredMembers, 0),
          expiredToTodoCount: retentionData.reduce((s, r) => s + r.expiredToTodo, 0),
          totalRevenue: retentionData.reduce((s, r) => s + r.totalRevenue, 0),
        }
      : null;

    res.json(success({
      daily: retentionData,
      newBySource,
      expiredHandled,
      summary: summary ? {
        ...summary,
        avgRetention: parseFloat(summary.avgRetention.toFixed(2)),
        avgChurn: parseFloat(summary.avgChurn.toFixed(2)),
      } : null,
    }));
  } catch (err) {
    next(err);
  }
});

router.get('/conversion', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = dayjs().subtract(days - 1, 'day').startOf('day').toDate();

    const logs = await prisma.conversionLog.findMany({
      where: { createdAt: { gte: startDate } },
      include: { conversionSource: true },
    });

    const bySource: any[] = [];
    const sourceMap: Record<number, any> = {};

    for (const log of logs) {
      const sid = log.sourceId;
      if (!sourceMap[sid]) {
        sourceMap[sid] = {
          sourceId: sid,
          sourceName: log.conversionSource?.name || '未知',
          channel: log.conversionSource?.channel || 'OTHER',
          total: 0,
          converted: 0,
          trial: 0,
          following: 0,
          lost: 0,
        };
        bySource.push(sourceMap[sid]);
      }
      sourceMap[sid].total++;
      if (log.stage === 'CONVERTED') sourceMap[sid].converted++;
      else if (log.stage === 'TRIAL') sourceMap[sid].trial++;
      else if (log.stage === 'FOLLOWING' || log.stage === 'CONTACTED') sourceMap[sid].following++;
      else if (log.stage === 'LOST') sourceMap[sid].lost++;
    }

    bySource.forEach((s) => {
      s.rate = s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0;
    });
    bySource.sort((a, b) => b.converted - a.converted);

    const byChannel: Record<string, any> = {};
    for (const s of bySource) {
      if (!byChannel[s.channel]) {
        byChannel[s.channel] = { channel: s.channel, total: 0, converted: 0, rate: 0 };
      }
      byChannel[s.channel].total += s.total;
      byChannel[s.channel].converted += s.converted;
    }
    Object.values(byChannel).forEach((c) => {
      c.rate = c.total > 0 ? Math.round((c.converted / c.total) * 100) : 0;
    });

    const byDay: any[] = [];
    for (let i = 0; i < Math.min(days, 30); i++) {
      const d = dayjs(startDate).add(i, 'day');
      const dLogs = logs.filter(
        (l) => dayjs(l.createdAt).format('YYYY-MM-DD') === d.format('YYYY-MM-DD')
      );
      byDay.push({
        date: d.format('YYYY-MM-DD'),
        total: dLogs.length,
        converted: dLogs.filter((l) => l.stage === 'CONVERTED').length,
        trial: dLogs.filter((l) => l.stage === 'TRIAL').length,
      });
    }

    const total = logs.length;
    const converted = logs.filter((l) => l.stage === 'CONVERTED').length;

    res.json(success({
      bySource,
      byChannel: Object.values(byChannel),
      byDay,
      summary: {
        total,
        converted,
        trial: logs.filter((l) => l.stage === 'TRIAL').length,
        following: logs.filter((l) => l.stage === 'FOLLOWING' || l.stage === 'CONTACTED').length,
        overallRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      },
    }));
  } catch (err) {
    next(err);
  }
});

router.get('/export/members', async (_req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      include: {
        conversionSource: { select: { name: true } },
        benefits: { select: { benefitType: true, name: true, usedCount: true, totalCount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(success({
      data: members.map((m) => ({
        姓名: m.name,
        手机号: m.phone,
        孩子姓名: m.childName,
        孩子年龄: m.childAge,
        会员等级: m.level,
        状态: m.status,
        转化来源: m.conversionSource?.name,
        累计打卡: m.totalCheckInDays,
        连续打卡: m.continuousDays,
        最近打卡: m.lastCheckInAt,
        是否掉队: m.isLagging ? '是' : '否',
        掉队天数: m.laggingDays,
        订阅时间: m.subscribedAt,
        到期时间: m.expiresAt,
        标签: m.tags,
        备注: m.remark,
      })),
      total: members.length,
    }));
  } catch (err) {
    next(err);
  }
});

router.get('/handover', async (_req, res, next) => {
  try {
    const now = dayjs();

    const [pendingTodos, laggingStudents, expiringMembers, todayCompletedTodos, todayFollowCount] = await Promise.all([
      prisma.todo.findMany({
        where: { status: { in: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS] } },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 20,
        include: {
          assignee: { select: { id: true, name: true, role: true } },
          member: { select: { id: true, name: true, phone: true, level: true, status: true } },
        },
      }),
      prisma.fallingBehind.findMany({
        where: { followUpStatus: { not: 'RESOLVED' }, resolvedAt: null, lagDays: { gte: 2 } },
        orderBy: [{ lagDays: 'desc' }],
        take: 15,
        include: {
          member: { select: { id: true, name: true, phone: true, childName: true, level: true } },
        },
      }),
      prisma.member.findMany({
        where: {
          status: MemberStatus.ACTIVE,
          expiresAt: { lte: now.add(7, 'day').toDate(), gte: now.toDate() },
        },
        orderBy: { expiresAt: 'asc' },
        take: 15,
        include: { conversionSource: { select: { name: true } } },
      }),
      prisma.todo.count({
        where: {
          status: TodoStatus.COMPLETED,
          completedAt: { gte: now.startOf('day').toDate() },
        },
      }),
      prisma.fallingBehind.count({
        where: { lastFollowedAt: { gte: now.startOf('day').toDate() } },
      }),
    ]);

    const todayStats = {
      completedTodos: todayCompletedTodos,
      followUpCount: todayFollowCount,
      pendingCount: pendingTodos.length,
      laggingCount: laggingStudents.length,
      expiringCount: expiringMembers.length,
    };

    res.json(success({
      todayStats,
      pendingTodos,
      laggingStudents,
      expiringMembers: expiringMembers.map((m) => ({
        ...m,
        daysLeft: m.expiresAt ? dayjs(m.expiresAt).diff(now, 'day') : 0,
      })),
    }));
  } catch (err) {
    next(err);
  }
});

export default router;
