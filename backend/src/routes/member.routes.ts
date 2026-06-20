import { Router } from 'express';
import { body, query } from 'express-validator';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { validateRequest } from '../middlewares/validate';
import { success } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { createOperationLog } from '../middlewares/operationLogger';
import { OperationAction, MemberStatus, TodoType, TodoPriority } from '../types/enums';

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
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const keyword = (req.query.keyword as string) || '';
      const level = req.query.level as string | undefined;
      const status = req.query.status as MemberStatus | undefined;
      const isLagging = req.query.isLagging as string | undefined;
      const sourceId = req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined;
      const expiringSoon = req.query.expiringSoon === 'true';

      const where: any = {};
      if (keyword) {
        where.OR = [
          { name: { contains: keyword } },
          { phone: { contains: keyword } },
          { childName: { contains: keyword } },
        ];
      }
      if (level) where.level = level;
      if (status) where.status = status;
      if (isLagging !== undefined) where.isLagging = isLagging === 'true';
      if (sourceId) where.conversionSourceId = sourceId;
      if (expiringSoon) {
        const soon = dayjs().add(7, 'day').toDate();
        where.expiresAt = { lte: soon, gte: new Date() };
        where.status = MemberStatus.ACTIVE;
      }

      const [members, total] = await Promise.all([
        prisma.member.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            conversionSource: { select: { id: true, name: true, channel: true } },
            _count: { select: { checkIns: true, memberCamps: true } },
          },
        }),
        prisma.member.count({ where }),
      ]);

      const list = members.map((m) => ({
        ...m,
        checkInCount: m._count.checkIns,
        campCount: m._count.memberCamps,
        daysUntilExpire: m.expiresAt ? Math.max(0, dayjs(m.expiresAt).diff(dayjs(), 'day')) : null,
        _count: undefined,
      }));

      res.json(success({ list, total, page, pageSize }));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/stats/summary', async (_req, res, next) => {
  try {
    const now = dayjs();
    const [total, active, expiring, lagging, todayNew, totalCheckIn] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { status: MemberStatus.ACTIVE } }),
      prisma.member.count({
        where: {
          status: MemberStatus.ACTIVE,
          expiresAt: { lte: now.add(7, 'day').toDate(), gte: now.toDate() },
        },
      }),
      prisma.member.count({ where: { isLagging: true } }),
      prisma.member.count({
        where: { createdAt: { gte: now.startOf('day').toDate() } },
      }),
      prisma.checkIn.count({
        where: {
          status: 'COMPLETED',
          checkInDate: { gte: now.startOf('day').toDate() },
        },
      }),
    ]);

    res.json(success({
      total,
      active,
      expiring,
      lagging,
      todayNew,
      todayCheckIn: totalCheckIn,
    }));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        conversionSource: { select: { id: true, name: true, channel: true } },
        benefits: { orderBy: { createdAt: 'desc' } },
        memberCamps: {
          where: { isActive: true },
          include: {
            camp: {
              select: { id: true, name: true, status: true, startDate: true, endDate: true, totalDays: true },
            },
            teacher: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { joinedAt: 'desc' },
        },
        checkIns: {
          take: 30,
          orderBy: { checkInDate: 'desc' },
          include: {
            camp: { select: { id: true, name: true } },
            course: { select: { id: true, title: true } },
          },
        },
        laggingRecords: {
          orderBy: { detectedAt: 'desc' },
          take: 10,
          include: { todos: { take: 5 } },
        },
        todos: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
          orderBy: { priority: 'desc', dueDate: 'asc' },
          take: 5,
          include: { assignee: { select: { id: true, name: true } } },
        },
        conversionLogs: { take: 10, orderBy: { createdAt: 'desc' }, include: { conversionSource: true } },
      },
    });

    if (!member) {
      throw new NotFoundError('会员不存在');
    }

    const enrichedCamps = member.memberCamps.map((mc) => {
      const campCheckIns = member.checkIns.filter((c) => c.campId === mc.campId);
      const completed = campCheckIns.filter((c) => c.status === 'COMPLETED').length;
      const pastDays = Math.min(dayjs().diff(mc.camp.startDate, 'day') + 1, mc.camp.totalDays);
      return {
        ...mc,
        completedDays: completed,
        pastDays,
        progress: mc.camp.status === 'COMPLETED' ? 100 : Math.max(0, Math.round(completed / Math.max(1, pastDays) * 100)),
        completionRate: Math.round(completed / Math.max(1, pastDays) * 100),
      };
    });

    const trialCourses: any[] = [];
    for (const mc of enrichedCamps) {
      if (mc.camp.status === 'UPCOMING') continue;
      const courses = await prisma.course.findMany({
        where: { campId: mc.campId, hasTrial: true, isActive: true },
        take: 3,
        orderBy: { sortOrder: 'asc' },
      });
      trialCourses.push(...courses.map(c => ({ ...c, campName: mc.camp.name, campId: mc.campId })));
    }

    const result = {
      ...member,
      memberCamps: enrichedCamps,
      trialCourses: trialCourses.slice(0, 5),
      daysUntilExpire: member.expiresAt ? Math.max(0, dayjs(member.expiresAt).diff(dayjs(), 'day')) : null,
      isExpiringSoon: member.expiresAt && member.status === MemberStatus.ACTIVE
        ? dayjs(member.expiresAt).diff(dayjs(), 'day') <= 7
        : false,
    };

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('姓名不能为空'),
    body('phone').notEmpty().withMessage('手机号不能为空'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const data = req.body;

      const existing = await prisma.member.findUnique({ where: { phone: data.phone } });
      if (existing) {
        throw new BadRequestError(
          '手机号已存在',
          '该手机号已注册，请直接查询该会员信息或使用其他手机号'
        );
      }

      const member = await prisma.member.create({ data });

      if (data.conversionSourceId) {
        await prisma.conversionLog.create({
          data: {
            memberId: member.id,
            sourceId: data.conversionSourceId,
            operatorId: req.user?.id,
            stage: data.level === 'TRIAL' ? 'TRIAL' : 'CONVERTED',
            detail: '新会员注册',
            result: data.level === 'TRIAL' ? '进入体验期' : '成功付费',
            convertedAt: data.level !== 'TRIAL' ? new Date() : undefined,
          },
        });
      }

      await createOperationLog(req, {
        action: OperationAction.CREATE,
        targetType: 'Member',
        targetId: member.id,
        targetName: member.name,
        memberId: member.id,
        newValue: { name: data.name, phone: data.phone, level: data.level },
      });

      res.json(success({ id: member.id }, '会员创建成功'));
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('会员不存在');
    }

    const data: any = {};
    const fields = ['name', 'phone', 'childName', 'childAge', 'avatar', 'wechatId', 'level', 'status', 'conversionSourceId', 'sourceDetail', 'subscribedAt', 'expiresAt', 'remark', 'tags'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    if (data.subscribedAt) data.subscribedAt = new Date(data.subscribedAt);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);

    if (data.status && data.status === MemberStatus.EXPIRED && existing.status !== MemberStatus.EXPIRED) {
      await prisma.todo.create({
        data: {
          type: TodoType.COURSE_EXPIRE,
          title: `课程过期跟进：${existing.name}`,
          description: `会员已过期（原到期日${dayjs(existing.expiresAt).format('YYYY-MM-DD')}），请尽快联系进行续费沟通`,
          priority: TodoPriority.HIGH,
          memberId: id,
          creatorId: req.user?.id,
        },
      });
    }

    const member = await prisma.member.update({ where: { id }, data });

    await createOperationLog(req, {
      action: OperationAction.UPDATE,
      targetType: 'Member',
      targetId: member.id,
      targetName: member.name,
      memberId: member.id,
      oldValue: { status: existing.status, level: existing.level, expiresAt: existing.expiresAt },
      newValue: data,
    });

    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/benefits', async (req, res, next) => {
  try {
    const memberId = parseInt(req.params.id);
    const existing = await prisma.member.findUnique({ where: { id: memberId } });
    if (!existing) {
      throw new NotFoundError('会员不存在');
    }

    const { benefitType, name, description, totalCount, validFrom, validUntil } = req.body;
    const benefit = await prisma.memberBenefit.create({
      data: {
        memberId,
        benefitType,
        name,
        description,
        totalCount,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
      },
    });

    await createOperationLog(req, {
      action: OperationAction.CREATE,
      targetType: 'MemberBenefit',
      targetId: benefit.id,
      targetName: `新增权益：${name}`,
      memberId,
    });

    res.json(success({ id: benefit.id }, '权益添加成功'));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/benefits/:benefitId', async (req, res, next) => {
  try {
    const memberId = parseInt(req.params.id);
    const benefitId = parseInt(req.params.benefitId);

    const benefit = await prisma.memberBenefit.findUnique({
      where: { id: benefitId },
    });
    if (!benefit || benefit.memberId !== memberId) {
      throw new NotFoundError('权益记录不存在');
    }

    const data: any = {};
    const fields = ['name', 'description', 'totalCount', 'usedCount', 'validFrom', 'validUntil', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });

    await prisma.memberBenefit.update({ where: { id: benefitId }, data });

    await createOperationLog(req, {
      action: OperationAction.UPDATE,
      targetType: 'MemberBenefit',
      targetId: benefitId,
      targetName: benefit.name,
      memberId,
      newValue: data,
    });

    res.json(success(null, '权益更新成功'));
  } catch (err) {
    next(err);
  }
});

export default router;
