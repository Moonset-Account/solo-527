import { Router } from 'express';
import { query } from 'express-validator';
import prisma from '../lib/prisma';
import { validateRequest } from '../middlewares/validate';
import { success } from '../utils/response';

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
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const operatorId = req.query.operatorId ? parseInt(req.query.operatorId as string) : undefined;
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const action = req.query.action as string | undefined;
      const targetType = req.query.targetType as string | undefined;
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;
      const keyword = (req.query.keyword as string) || '';

      const where: any = {};
      if (operatorId) where.operatorId = operatorId;
      if (memberId) where.memberId = memberId;
      if (action) where.action = action;
      if (targetType) where.targetType = targetType;
      if (dateFrom) where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) };
      if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };
      if (keyword) {
        where.OR = [
          { targetName: { contains: keyword } },
          { detail: { contains: keyword } },
          { newValue: { contains: keyword } },
          { operator: { name: { contains: keyword } } },
          { member: { name: { contains: keyword } } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.operationLog.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            operator: { select: { id: true, name: true, role: true } },
            member: { select: { id: true, name: true, phone: true } },
          },
        }),
        prisma.operationLog.count({ where }),
      ]);

      const actionStats = await prisma.operationLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        _count: true,
      });

      const operatorStats = await prisma.operationLog.groupBy({
        by: ['operatorId'],
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        _count: true,
      });

      res.json(success({
        list: logs,
        total,
        page,
        pageSize,
        todayActionStats: actionStats,
        todayOperatorStats: operatorStats,
      }));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const log = await prisma.operationLog.findUnique({
      where: { id },
      include: {
        operator: { select: { id: true, name: true, role: true, username: true } },
        member: { select: { id: true, name: true, phone: true } },
      },
    });
    res.json(success(log));
  } catch (err) {
    next(err);
  }
});

router.get('/target/:type/:targetId', async (req, res, next) => {
  try {
    const { type, targetId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await prisma.operationLog.findMany({
      where: {
        targetType: type,
        targetId: parseInt(targetId),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        operator: { select: { id: true, name: true, role: true } },
      },
    });

    res.json(success(logs));
  } catch (err) {
    next(err);
  }
});

router.get('/member/:memberId', async (req, res, next) => {
  try {
    const memberId = parseInt(req.params.memberId);
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await prisma.operationLog.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        operator: { select: { id: true, name: true, role: true } },
      },
    });

    res.json(success(logs));
  } catch (err) {
    next(err);
  }
});

export default router;
