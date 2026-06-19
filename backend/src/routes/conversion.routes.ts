import { Router } from 'express';
import { body, query } from 'express-validator';
import prisma from '../lib/prisma';
import { validateRequest } from '../middlewares/validate';
import { success } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { roleMiddleware } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { createOperationLog } from '../middlewares/operationLogger';
import { OperationAction } from '@prisma/client';

const router = Router();

router.get('/sources', async (req, res, next) => {
  try {
    const isActive = req.query.isActive as string | undefined;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const sources = await prisma.conversionSource.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { members: true, logs: true } },
      },
    });

    const list = sources.map((s) => ({
      ...s,
      memberCount: s._count.members,
      logCount: s._count.logs,
      _count: undefined,
    }));

    res.json(success(list));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/sources',
  roleMiddleware(Role.ADMIN),
  [
    body('name').notEmpty().withMessage('名称不能为空'),
    body('channel').notEmpty().withMessage('渠道必填'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { name, channel, description } = req.body;
      const source = await prisma.conversionSource.create({
        data: { name, channel, description },
      });

      await createOperationLog(req, {
        action: OperationAction.CREATE,
        targetType: 'ConversionSource',
        targetId: source.id,
        targetName: source.name,
        newValue: { name, channel },
      });

      res.json(success({ id: source.id }, '创建成功'));
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/sources/:id', roleMiddleware(Role.ADMIN), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.conversionSource.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('转化来源不存在');
    }

    const data: any = {};
    ['name', 'channel', 'description', 'isActive'].forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });

    const source = await prisma.conversionSource.update({ where: { id }, data });

    await createOperationLog(req, {
      action: OperationAction.UPDATE,
      targetType: 'ConversionSource',
      targetId: source.id,
      targetName: source.name,
      oldValue: { name: existing.name, isActive: existing.isActive },
      newValue: data,
    });

    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
});

router.get(
  '/logs',
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 200 }),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const sourceId = req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined;
      const channel = req.query.channel as string | undefined;
      const stage = req.query.stage as string | undefined;
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;
      const keyword = (req.query.keyword as string) || '';

      const where: any = {};
      if (sourceId) where.sourceId = sourceId;
      if (stage) where.stage = stage;
      if (dateFrom) where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) };
      if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };
      if (channel) {
        where.conversionSource = { channel };
      }
      if (keyword) {
        where.OR = [
          { member: { name: { contains: keyword } } },
          { member: { phone: { contains: keyword } } },
          { detail: { contains: keyword } },
          { result: { contains: keyword } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.conversionLog.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            member: { select: { id: true, name: true, phone: true, level: true, status: true } },
            conversionSource: true,
          },
        }),
        prisma.conversionLog.count({ where }),
      ]);

      res.json(success({ list: logs, total, page, pageSize }));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/stats/summary', async (req, res, next) => {
  try {
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    const where: any = {};
    if (dateFrom) where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) };
    if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };

    const allLogs = await prisma.conversionLog.findMany({
      where,
      include: { conversionSource: true },
    });

    const bySource: Record<number, { name: string; channel: string; total: number; converted: number; following: number }> = {};

    for (const log of allLogs) {
      const sid = log.sourceId;
      if (!bySource[sid]) {
        bySource[sid] = {
          name: log.conversionSource?.name || '未知',
          channel: log.conversionSource?.channel || 'OTHER',
          total: 0,
          converted: 0,
          following: 0,
        };
      }
      bySource[sid].total++;
      if (log.stage === 'CONVERTED') bySource[sid].converted++;
      else if (log.stage === 'FOLLOWING' || log.stage === 'TRIAL') bySource[sid].following++;
    }

    const byChannel: Record<string, { total: number; converted: number; rate: number }> = {};
    for (const source of Object.values(bySource)) {
      if (!byChannel[source.channel]) {
        byChannel[source.channel] = { total: 0, converted: 0, rate: 0 };
      }
      byChannel[source.channel].total += source.total;
      byChannel[source.channel].converted += source.converted;
    }
    for (const ch of Object.keys(byChannel)) {
      const d = byChannel[ch];
      d.rate = d.total > 0 ? Math.round((d.converted / d.total) * 100) : 0;
    }

    const totalLogs = allLogs.length;
    const convertedLogs = allLogs.filter((l) => l.stage === 'CONVERTED').length;
    const overallRate = totalLogs > 0 ? Math.round((convertedLogs / totalLogs) * 100) : 0;

    res.json(success({
      bySource: Object.values(bySource).sort((a, b) => b.total - a.total),
      byChannel,
      summary: {
        total: totalLogs,
        converted: convertedLogs,
        overallRate,
      },
    }));
  } catch (err) {
    next(err);
  }
});

router.get('/stats/funnel', async (req, res, next) => {
  try {
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    const sourceId = req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined;

    const where: any = {};
    if (dateFrom) where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) };
    if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };
    if (sourceId) where.sourceId = sourceId;

    const stages = ['LEAD', 'CONTACTED', 'TRIAL', 'FOLLOWING', 'CONVERTED', 'LOST'];
    const result: { stage: string; count: number }[] = [];

    for (const stage of stages) {
      const count = await prisma.conversionLog.count({
        where: { ...where, stage },
      });
      result.push({ stage, count });
    }

    const total = result[0].count || 1;
    result.forEach((r) => {
      (r as any).rate = Math.round((r.count / total) * 100);
    });

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.post('/logs', async (req, res, next) => {
  try {
    const { memberId, sourceId, stage, detail, result, convertedAt } = req.body;
    if (!memberId || !sourceId) {
      throw new BadRequestError('memberId 和 sourceId 必填');
    }

    const log = await prisma.conversionLog.create({
      data: {
        memberId,
        sourceId,
        operatorId: req.user?.id,
        stage,
        detail,
        result,
        convertedAt: convertedAt ? new Date(convertedAt) : undefined,
      },
    });

    await createOperationLog(req, {
      action: OperationAction.CREATE,
      targetType: 'ConversionLog',
      targetId: log.id,
      targetName: `转化记录：${stage}`,
      memberId,
    });

    res.json(success({ id: log.id }, '记录创建成功'));
  } catch (err) {
    next(err);
  }
});

router.patch('/logs/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.conversionLog.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('记录不存在');
    }

    const data: any = {};
    ['stage', 'detail', 'result', 'convertedAt'].forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    if (data.convertedAt) data.convertedAt = new Date(data.convertedAt);

    const log = await prisma.conversionLog.update({ where: { id }, data });

    await createOperationLog(req, {
      action: OperationAction.UPDATE,
      targetType: 'ConversionLog',
      targetId: log.id,
      targetName: `转化记录`,
      memberId: log.memberId,
      newValue: data,
    });

    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
});

export default router;
