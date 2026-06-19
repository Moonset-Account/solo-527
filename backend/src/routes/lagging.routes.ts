import { Router } from 'express';
import { body, query } from 'express-validator';
import prisma from '../lib/prisma';
import { validateRequest } from '../middlewares/validate';
import { success } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { createOperationLog } from '../middlewares/operationLogger';
import { OperationAction, TodoType, TodoPriority } from '@prisma/client';

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
      const status = req.query.status as string | undefined;
      const campId = req.query.campId ? parseInt(req.query.campId as string) : undefined;
      const operatorId = req.query.operatorId ? parseInt(req.query.operatorId as string) : undefined;
      const minLagDays = req.query.minLagDays ? parseInt(req.query.minLagDays as string) : 1;

      const where: any = {};
      if (status && status !== 'ALL') where.followUpStatus = status;
      if (campId) where.campId = campId;
      if (operatorId) where.operatorId = operatorId;
      where.lagDays = { gte: minLagDays };
      where.OR = [{ resolvedAt: null }, { resolvedAt: { not: null }, followUpStatus: { not: 'RESOLVED' } }];

      const [records, total] = await Promise.all([
        prisma.fallingBehind.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [{ lagDays: 'desc' }, { detectedAt: 'desc' }],
          include: {
            member: {
              select: {
                id: true, name: true, phone: true, childName: true, childAge: true,
                level: true, status: true, totalCheckInDays: true, continuousDays: true,
                lastCheckInAt: true, tags: true,
              },
            },
            todos: {
              where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
              take: 2,
              include: { assignee: { select: { id: true, name: true } } },
            },
          },
        }),
        prisma.fallingBehind.count({ where }),
      ]);

      const statusCounts = await prisma.fallingBehind.groupBy({
        by: ['followUpStatus'],
        where: { lagDays: { gte: minLagDays } },
        _count: true,
      });

      res.json(success({
        list: records,
        total,
        page,
        pageSize,
        statusCounts,
      }));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const record = await prisma.fallingBehind.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true, name: true, phone: true, childName: true, childAge: true,
            level: true, status: true, totalCheckInDays: true, continuousDays: true,
            lastCheckInAt: true, conversionSource: true, expiresAt: true,
          },
        },
        todos: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundError('掉队记录不存在');
    }

    res.json(success(record));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.fallingBehind.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('掉队记录不存在');
    }

    const { followUpStatus, followUpResult, followUpRemark, reason, resolved } = req.body;
    const data: any = {};

    if (followUpStatus) data.followUpStatus = followUpStatus;
    if (followUpResult) data.followUpResult = followUpResult;
    if (followUpRemark) data.followUpRemark = followUpRemark;
    if (reason) data.reason = reason;
    if (resolved) {
      data.followUpStatus = 'RESOLVED';
      data.resolvedAt = new Date();
    }

    data.lastFollowedAt = new Date();
    data.operatorId = req.user?.id;

    const record = await prisma.fallingBehind.update({ where: { id }, data });

    if (resolved) {
      await prisma.member.update({
        where: { id: record.memberId },
        data: { isLagging: false, laggingDays: 0 },
      });
    }

    await createOperationLog(req, {
      action: OperationAction.UPDATE,
      targetType: 'FallingBehind',
      targetId: id,
      targetName: `跟进记录 #${id}`,
      memberId: record.memberId,
      oldValue: { followUpStatus: existing.followUpStatus },
      newValue: data,
    });

    res.json(success(null, resolved ? '已标记为已恢复' : '更新成功'));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/todos', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const record = await prisma.fallingBehind.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundError('掉队记录不存在');
    }

    const { title, description, priority, dueDate, assigneeId } = req.body;
    if (!title) {
      throw new BadRequestError('标题不能为空');
    }

    const todo = await prisma.todo.create({
      data: {
        type: TodoType.LAGGING_STUDENT,
        title,
        description: description || `跟进掉队学员，连续${record.lagDays}天未打卡`,
        priority: priority || TodoPriority.HIGH,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assigneeId,
        creatorId: req.user?.id,
        memberId: record.memberId,
        laggingId: id,
      },
    });

    await prisma.fallingBehind.update({
      where: { id },
      data: { followUpStatus: 'FOLLOWING' },
    });

    await createOperationLog(req, {
      action: OperationAction.CREATE,
      targetType: 'Todo',
      targetId: todo.id,
      targetName: title,
      memberId: record.memberId,
    });

    res.json(success({ id: todo.id }, '跟进待办已创建'));
  } catch (err) {
    next(err);
  }
});

router.post('/batch-follow', async (req, res, next) => {
  try {
    const { ids, followUpRemark, followUpStatus, createTodo } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('请选择要处理的记录');
    }

    let processed = 0;
    for (const id of ids) {
      const record = await prisma.fallingBehind.findUnique({ where: { id } });
      if (!record) continue;

      const updateData: any = {
        lastFollowedAt: new Date(),
        operatorId: req.user?.id,
      };
      if (followUpRemark) updateData.followUpRemark = followUpRemark;
      if (followUpStatus) updateData.followUpStatus = followUpStatus;

      await prisma.fallingBehind.update({ where: { id }, data: updateData });

      if (createTodo) {
        await prisma.todo.create({
          data: {
            type: TodoType.LAGGING_STUDENT,
            title: `跟进掉队学员（批量）`,
            description: followUpRemark || `需要跟进：连续${record.lagDays}天未打卡`,
            priority: TodoPriority.HIGH,
            creatorId: req.user?.id,
            memberId: record.memberId,
            laggingId: id,
          },
        });
      }
      processed++;
    }

    res.json(success({ processed }, `批量处理完成，共处理${processed}条记录`));
  } catch (err) {
    next(err);
  }
});

export default router;
