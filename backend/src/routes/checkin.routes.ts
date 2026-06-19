import { Router } from 'express';
import { body, query } from 'express-validator';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { validateRequest } from '../middlewares/validate';
import { success } from '../utils/response';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { createOperationLog } from '../middlewares/operationLogger';
import { OperationAction, CheckInStatus } from '@prisma/client';

const router = Router();

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 200 }),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const campId = req.query.campId ? parseInt(req.query.campId as string) : undefined;
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const status = req.query.status as CheckInStatus | undefined;
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;

      const where: any = {};
      if (campId) where.campId = campId;
      if (memberId) where.memberId = memberId;
      if (status) where.status = status;
      if (dateFrom) where.checkInDate = { ...where.checkInDate, gte: new Date(dateFrom) };
      if (dateTo) where.checkInDate = { ...where.checkInDate, lte: dayjs(dateTo).endOf('day').toDate() };

      const [checkIns, total] = await Promise.all([
        prisma.checkIn.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { checkInDate: 'desc' },
          include: {
            member: { select: { id: true, name: true, phone: true, childName: true } },
            camp: { select: { id: true, name: true } },
            course: { select: { id: true, title: true } },
          },
        }),
        prisma.checkIn.count({ where }),
      ]);

      res.json(success({ list: checkIns, total, page, pageSize }));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/stats/daily', async (req, res, next) => {
  try {
    const campId = req.query.campId ? parseInt(req.query.campId as string) : undefined;
    const days = parseInt(req.query.days as string) || 7;
    const startDate = dayjs().subtract(days - 1, 'day').startOf('day');

    const rawData = await prisma.checkIn.groupBy({
      by: ['checkInDate', 'status'],
      where: {
        campId,
        checkInDate: { gte: startDate.toDate() },
      },
      _count: true,
    });

    const result: any[] = [];
    for (let i = 0; i < days; i++) {
      const d = startDate.add(i, 'day');
      const dStr = d.format('YYYY-MM-DD');
      const dayData = rawData.filter(
        (x) => dayjs(x.checkInDate).format('YYYY-MM-DD') === dStr
      );
      result.push({
        date: dStr,
        total: dayData.reduce((sum, x) => sum + x._count, 0),
        completed: dayData.find((x) => x.status === CheckInStatus.COMPLETED)?._count || 0,
        late: dayData.find((x) => x.status === CheckInStatus.LATE)?._count || 0,
        missed: dayData.find((x) => x.status === CheckInStatus.MISSED)?._count || 0,
        pending: dayData.find((x) => x.status === CheckInStatus.PENDING)?._count || 0,
      });
    }

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.get('/member-camp/:memberCampId', async (req, res, next) => {
  try {
    const memberCampId = parseInt(req.params.memberCampId);

    const memberCamp = await prisma.memberCamp.findUnique({
      where: { id: memberCampId },
      include: {
        camp: true,
        member: { select: { id: true, name: true, childName: true } },
      },
    });
    if (!memberCamp) {
      throw new NotFoundError('学员营期记录不存在');
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { memberCampId },
      orderBy: { dayIndex: 'asc' },
      include: { course: { select: { id: true, title: true, type: true, hasTrial: true } } },
    });

    const totalPastDays = Math.min(
      dayjs().diff(memberCamp.camp.startDate, 'day') + 1,
      memberCamp.camp.totalDays
    );
    const completedCount = checkIns.filter(
      (c) => c.status === CheckInStatus.COMPLETED || c.status === CheckInStatus.LATE
    ).length;
    const missedCount = checkIns.filter((c) => c.status === CheckInStatus.MISSED).length;

    res.json(success({
      memberCamp,
      checkIns,
      summary: {
        totalDays: memberCamp.camp.totalDays,
        pastDays: totalPastDays,
        completedCount,
        missedCount,
        pendingCount: totalPastDays - completedCount - missedCount,
        completionRate: Math.round((completedCount / Math.max(1, totalPastDays)) * 100),
      },
    }));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  [
    body('memberCampId').isInt().withMessage('学员营期ID必填'),
    body('dayIndex').isInt({ min: 1 }).withMessage('天数必填'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { memberCampId, dayIndex, remark, homeworkUrl, mediaUrl, score } = req.body;

      const memberCamp = await prisma.memberCamp.findUnique({
        where: { id: memberCampId },
        include: { member: true, camp: true },
      });
      if (!memberCamp) {
        throw new NotFoundError('学员营期记录不存在');
      }

      const existing = await prisma.checkIn.findUnique({
        where: { memberCampId_dayIndex: { memberCampId, dayIndex } },
      });
      if (existing) {
        if (existing.status === CheckInStatus.COMPLETED) {
          throw new ConflictError(
            '今日已打卡',
            '该天已完成打卡，如需修改请使用编辑功能'
          );
        }
      }

      const now = new Date();
      const checkInDate = dayjs(memberCamp.camp.startDate).add(dayIndex - 1, 'day').toDate();
      const isLate = dayjs().isAfter(dayjs(checkInDate).endOf('day'));

      const checkIn = existing
        ? await prisma.checkIn.update({
            where: { id: existing.id },
            data: {
              status: isLate ? CheckInStatus.LATE : CheckInStatus.COMPLETED,
              completedAt: now,
              remark,
              homeworkUrl,
              mediaUrl,
              score,
              operatorId: req.user?.id,
            },
          })
        : await prisma.checkIn.create({
            data: {
              memberCampId,
              memberId: memberCamp.memberId,
              campId: memberCamp.campId,
              dayIndex,
              checkInDate,
              status: isLate ? CheckInStatus.LATE : CheckInStatus.COMPLETED,
              completedAt: now,
              remark,
              homeworkUrl,
              mediaUrl,
              score,
              operatorId: req.user?.id,
            },
          });

      const allCheckIns = await prisma.checkIn.findMany({
        where: { memberId: memberCamp.memberId },
        orderBy: { checkInDate: 'desc' },
        select: { checkInDate: true, status: true },
      });

      let continuous = 0;
      for (const ci of allCheckIns) {
        if (ci.status === CheckInStatus.COMPLETED || ci.status === CheckInStatus.LATE) {
          continuous++;
        } else {
          break;
        }
      }

      const completedCount = allCheckIns.filter(
        (c) => c.status === CheckInStatus.COMPLETED || c.status === CheckInStatus.LATE
      ).length;

      await prisma.member.update({
        where: { id: memberCamp.memberId },
        data: {
          totalCheckInDays: completedCount,
          continuousDays: continuous,
          lastCheckInAt: now,
          isLagging: false,
          laggingDays: 0,
        },
      });

      await prisma.memberCamp.update({
        where: { id: memberCampId },
        data: {
          completedDays: {
            increment: existing ? 0 : 1,
          },
        },
      });

      await createOperationLog(req, {
        action: OperationAction.CHECK_IN,
        targetType: 'CheckIn',
        targetId: checkIn.id,
        targetName: `${memberCamp.member.name}第${dayIndex}天打卡`,
        memberId: memberCamp.memberId,
        newValue: { dayIndex, status: checkIn.status, isLate },
        checkInId: checkIn.id,
      });

      res.json(
        success(
          { id: checkIn.id, status: checkIn.status, isLate, continuous },
          isLate ? '补卡成功（已标记迟到）' : '打卡成功'
        )
      );
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.checkIn.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('打卡记录不存在');
    }

    const data: any = {};
    const fields = ['status', 'remark', 'homeworkUrl', 'mediaUrl', 'score'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    if (data.status && !existing.completedAt && (data.status === CheckInStatus.COMPLETED || data.status === CheckInStatus.LATE)) {
      data.completedAt = new Date();
    }

    const checkIn = await prisma.checkIn.update({ where: { id }, data });

    await createOperationLog(req, {
      action: OperationAction.UPDATE,
      targetType: 'CheckIn',
      targetId: checkIn.id,
      targetName: `第${checkIn.dayIndex}天打卡`,
      memberId: checkIn.memberId,
      oldValue: { status: existing.status, score: existing.score },
      newValue: data,
    });

    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
});

router.post('/batch-missed', async (req, res, next) => {
  try {
    const { campId } = req.body;
    if (!campId) {
      throw new BadRequestError('campId 必填');
    }

    const camp = await prisma.camp.findUnique({ where: { id: campId } });
    if (!camp) {
      throw new NotFoundError('营期不存在');
    }

    const memberCamps = await prisma.memberCamp.findMany({
      where: { campId, isActive: true },
      select: { id: true, memberId: true },
    });

    const today = dayjs();
    const pastDays = Math.min(
      today.diff(camp.startDate, 'day'),
      camp.totalDays - 1
    );

    let updated = 0;
    for (let d = 1; d <= pastDays; d++) {
      const checkDate = dayjs(camp.startDate).add(d - 1, 'day');
      if (checkDate.isAfter(today.subtract(1, 'day').endOf('day'))) continue;

      for (const mc of memberCamps) {
        const existing = await prisma.checkIn.findUnique({
          where: { memberCampId_dayIndex: { memberCampId: mc.id, dayIndex: d } },
        });
        if (!existing) {
          await prisma.checkIn.create({
            data: {
              memberCampId: mc.id,
              memberId: mc.memberId,
              campId,
              dayIndex: d,
              checkInDate: checkDate.toDate(),
              status: CheckInStatus.MISSED,
              remark: '系统自动标记未打卡',
            },
          });
          updated++;
        } else if (existing.status === CheckInStatus.PENDING) {
          await prisma.checkIn.update({
            where: { id: existing.id },
            data: {
              status: CheckInStatus.MISSED,
              remark: '系统自动标记未打卡',
            },
          });
          updated++;
        }
      }
    }

    const memberMissed = await prisma.$queryRawUnsafe<any[]>(`
      SELECT mc.memberId, COUNT(*) as missCount
      FROM CheckIn c
      JOIN MemberCamp mc ON c.memberCampId = mc.id
      WHERE mc.campId = ${campId}
        AND c.status = 'MISSED'
        AND c.dayIndex >= (
          SELECT MIN(c2.dayIndex)
          FROM CheckIn c2
          WHERE c2.memberCampId = mc.id AND c2.status = 'MISSED'
            AND NOT EXISTS (
              SELECT 1 FROM CheckIn c3
              WHERE c3.memberCampId = mc.id
                AND c3.dayIndex > c2.dayIndex
                AND c3.status IN ('COMPLETED','LATE')
            )
        )
      GROUP BY mc.memberId
    `);

    for (const row of memberMissed) {
      const missCount = Number(row.missCount) || 0;
      if (missCount >= 2) {
        await prisma.member.update({
          where: { id: Number(row.memberId) },
          data: { isLagging: true, laggingDays: missCount },
        });

        const lagRecord = await prisma.fallingBehind.findFirst({
          where: { memberId: Number(row.memberId), campId, resolvedAt: null },
        });
        if (!lagRecord) {
          await prisma.fallingBehind.create({
            data: {
              memberId: Number(row.memberId),
              campId,
              lagDays: missCount,
              reason: `连续${missCount}天未打卡`,
              followUpStatus: 'PENDING',
            },
          });
        } else {
          await prisma.fallingBehind.update({
            where: { id: lagRecord.id },
            data: { lagDays: missCount, lastCheckInAt: new Date() },
          });
        }
      }
    }

    res.json(success({ updated, processedMembers: memberMissed.length }, '批量处理完成'));
  } catch (err) {
    next(err);
  }
});

export default router;
