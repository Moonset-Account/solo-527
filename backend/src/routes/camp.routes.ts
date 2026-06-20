import { Router } from 'express';
import { body, query } from 'express-validator';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';
import { validateRequest } from '../middlewares/validate';
import { success } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { roleMiddleware } from '../middlewares/auth';
import { Role, CampStatus, OperationAction } from '../types/enums';
import { createOperationLog } from '../middlewares/operationLogger';

const router = Router();

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const keyword = (req.query.keyword as string) || '';
      const status = req.query.status as typeof CampStatus[keyof typeof CampStatus] | undefined;

      const where: any = {};
      if (keyword) where.name = { contains: keyword };
      if (status) where.status = status;

      const [camps, total] = await Promise.all([
        prisma.camp.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { startDate: 'desc' },
          include: {
            teacher: { select: { id: true, name: true, phone: true } },
            _count: { select: { memberCamps: { where: { isActive: true } } } },
          },
        }),
        prisma.camp.count({ where }),
      ]);

      const list = camps.map((c) => ({
        ...c,
        memberCount: c._count.memberCamps,
        _count: undefined,
      }));

      res.json(success({ list, total, page, pageSize }));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/active', async (_req, res, next) => {
  try {
    const camps = await prisma.camp.findMany({
      where: { status: { in: [CampStatus.UPCOMING, CampStatus.ONGOING] } },
      orderBy: { startDate: 'asc' },
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { memberCamps: { where: { isActive: true } } } },
      },
    });
    const list = camps.map((c) => ({
      ...c,
      memberCount: c._count.memberCamps,
      _count: undefined,
    }));
    res.json(success(list));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const camp = await prisma.camp.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, phone: true } },
        courses: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, title: true, type: true, dayIndex: true, duration: true, hasTrial: true, sortOrder: true },
        },
        _count: { select: { memberCamps: { where: { isActive: true } }, courses: { where: { isActive: true } } } },
      },
    });

    if (!camp) throw new NotFoundError('营期不存在');

    const result = {
      ...camp,
      memberCount: camp._count.memberCamps,
      courseCount: camp._count.courses,
      progress: camp.status === CampStatus.ONGOING
        ? Math.min(100, Math.round((dayjs().diff(camp.startDate, 'day') + 1) / camp.totalDays * 100))
        : camp.status === CampStatus.COMPLETED ? 100 : 0,
      _count: undefined,
    };

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/members', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const [memberCamps, total] = await Promise.all([
      prisma.memberCamp.findMany({
        where: { campId: id, isActive: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          member: { select: { id: true, name: true, phone: true, childName: true, childAge: true, level: true, status: true, totalCheckInDays: true, continuousDays: true, isLagging: true, laggingDays: true, lastCheckInAt: true } },
          teacher: { select: { id: true, name: true } },
          _count: { select: { checkIns: { where: { status: 'COMPLETED' } } } },
        },
        orderBy: { joinedAt: 'desc' },
      }),
      prisma.memberCamp.count({ where: { campId: id, isActive: true } }),
    ]);

    const list = memberCamps.map((mc) => ({
      id: mc.id,
      joinedAt: mc.joinedAt,
      completedDays: mc.completedDays,
      completedCheckInCount: mc._count.checkIns,
      teacher: mc.teacher,
      ...mc.member,
    }));

    res.json(success({ list, total, page, pageSize }));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  roleMiddleware(Role.ADMIN),
  [
    body('name').notEmpty().withMessage('营期名称不能为空'),
    body('startDate').notEmpty().withMessage('开始日期不能为空'),
    body('endDate').notEmpty().withMessage('结束日期不能为空'),
    body('totalDays').isInt({ min: 1 }).withMessage('总天数必须大于0'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { name, description, startDate, endDate, totalDays, checkInRule, maxMembers, teacherId, coverImage, tags } = req.body;
      if (dayjs(endDate).isBefore(startDate)) throw new BadRequestError('结束日期不能早于开始日期');

      const camp = await prisma.camp.create({
        data: { name, description, startDate: new Date(startDate), endDate: new Date(endDate), totalDays, checkInRule, maxMembers, teacherId, coverImage, tags },
      });

      await createOperationLog(req, {
        action: OperationAction.CREATE,
        targetType: 'Camp',
        targetId: camp.id,
        targetName: camp.name,
        newValue: { name, startDate, endDate, totalDays },
      });

      res.json(success({ id: camp.id }, '营期创建成功'));
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id',
  roleMiddleware(Role.ADMIN, Role.TEACHER),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await prisma.camp.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('营期不存在');

      const data: any = {};
      ['name', 'description', 'status', 'startDate', 'endDate', 'totalDays', 'checkInRule', 'maxMembers', 'teacherId', 'coverImage', 'tags'].forEach((f) => {
        if (req.body[f] !== undefined) data[f] = req.body[f];
      });
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);

      const camp = await prisma.camp.update({ where: { id }, data });
      await createOperationLog(req, {
        action: OperationAction.UPDATE, targetType: 'Camp', targetId: camp.id, targetName: camp.name, oldValue: existing, newValue: data,
      });

      res.json(success(null, '更新成功'));
    } catch (err) {
      next(err);
    }
  }
);

router.post('/:id/members', async (req, res, next) => {
  try {
    const campId = parseInt(req.params.id);
    const { memberIds } = req.body;
    if (!Array.isArray(memberIds) || memberIds.length === 0) throw new BadRequestError('请选择要添加的学员');

    const camp = await prisma.camp.findUnique({ where: { id: campId } });
    if (!camp) throw new NotFoundError('营期不存在');

    let added = 0;
    for (const memberId of memberIds) {
      const existing = await prisma.memberCamp.findUnique({ where: { memberId_campId: { memberId, campId } } });
      if (!existing) {
        await prisma.memberCamp.create({ data: { memberId, campId, teacherId: camp.teacherId } });
        added++;
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        await createOperationLog(req, {
          action: OperationAction.CREATE, targetType: 'MemberCamp', targetId: memberId, targetName: `${member?.name || ''}加入${camp.name}`, memberId,
        });
      }
    }

    res.json(success({ added }, `成功添加${added}名学员`));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/members/:memberId', async (req, res, next) => {
  try {
    const campId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);

    const mc = await prisma.memberCamp.findUnique({
      where: { memberId_campId: { memberId, campId } },
      include: { member: true, camp: true },
    });
    if (!mc) throw new NotFoundError('学员不在此营期中');

    await prisma.memberCamp.delete({ where: { memberId_campId: { memberId, campId } } });
    await createOperationLog(req, {
      action: OperationAction.DELETE, targetType: 'MemberCamp', targetId: mc.id, targetName: `${mc.member.name}移出${mc.camp.name}`, memberId,
    });

    res.json(success(null, '移除成功'));
  } catch (err) {
    next(err);
  }
});

export default router;
