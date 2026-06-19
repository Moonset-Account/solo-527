import { Router } from 'express';
import { body, query } from 'express-validator';
import prisma from '../lib/prisma';
import { validateRequest } from '../middlewares/validate';
import { success } from '../utils/response';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { createOperationLog } from '../middlewares/operationLogger';
import { OperationAction, TodoStatus, TodoPriority, Role } from '@prisma/client';

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
      const status = req.query.status as TodoStatus | undefined;
      const priority = req.query.priority as TodoPriority | undefined;
      const type = req.query.type as string | undefined;
      const assigneeId = req.query.assigneeId ? parseInt(req.query.assigneeId as string) : undefined;
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const myOnly = req.query.myOnly === 'true';
      const keyword = (req.query.keyword as string) || '';
      const overdue = req.query.overdue === 'true';

      const where: any = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (type) where.type = type;
      if (assigneeId) where.assigneeId = assigneeId;
      if (memberId) where.memberId = memberId;
      if (myOnly && req.user) where.assigneeId = req.user.id;
      if (overdue) {
        where.AND = [
          { dueDate: { not: null, lt: new Date() } },
          { status: { in: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS] } },
        ];
      }
      if (keyword) {
        where.OR = [
          { title: { contains: keyword } },
          { description: { contains: keyword } },
        ];
      }

      const [todos, total] = await Promise.all([
        prisma.todo.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [
            { status: 'asc' },
            { priority: 'desc' },
            { dueDate: 'asc' },
          ],
          include: {
            assignee: { select: { id: true, name: true, role: true } },
            creator: { select: { id: true, name: true } },
            member: { select: { id: true, name: true, phone: true, level: true, status: true } },
            fallingBehind: { select: { id: true, lagDays: true } },
          },
        }),
        prisma.todo.count({ where }),
      ]);

      const list = todos.map((t) => ({
        ...t,
        isOverdue: t.dueDate
          ? t.dueDate < new Date() && (t.status === TodoStatus.PENDING || t.status === TodoStatus.IN_PROGRESS)
          : false,
      }));

      res.json(success({ list, total, page, pageSize }));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/stats/board', async (req, res, next) => {
  try {
    const assigneeId = req.query.assigneeId ? parseInt(req.query.assigneeId as string) : undefined;
    const myOnly = req.query.myOnly === 'true';

    const where: any = {};
    if (assigneeId) where.assigneeId = assigneeId;
    else if (myOnly && req.user) where.assigneeId = req.user.id;

    const [byStatus, byPriority, byType, overdueCount, todayDue] = await Promise.all([
      prisma.todo.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.todo.groupBy({
        by: ['priority'],
        where: { ...where, status: { in: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS] } },
        _count: true,
      }),
      prisma.todo.groupBy({
        by: ['type'],
        where: { ...where, status: { in: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS] } },
        _count: true,
      }),
      prisma.todo.count({
        where: {
          ...where,
          status: { in: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS] },
          dueDate: { not: null, lt: new Date() },
        },
      }),
      prisma.todo.count({
        where: {
          ...where,
          status: { in: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS] },
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    res.json(success({
      byStatus,
      byPriority,
      byType,
      overdueCount,
      todayDue,
    }));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const todo = await prisma.todo.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, role: true, phone: true } },
        creator: { select: { id: true, name: true } },
        member: { select: { id: true, name: true, phone: true, level: true, status: true, childName: true, isLagging: true } },
        fallingBehind: true,
      },
    });

    if (!todo) {
      throw new NotFoundError('待办不存在');
    }

    res.json(success(todo));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('标题不能为空'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const {
        type,
        title,
        description,
        priority,
        dueDate,
        assigneeId,
        memberId,
        laggingId,
        relatedType,
        relatedId,
      } = req.body;

      const todo = await prisma.todo.create({
        data: {
          type: type || 'CUSTOM',
          title,
          description,
          priority: priority || TodoPriority.MEDIUM,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          assigneeId,
          creatorId: req.user?.id,
          memberId,
          laggingId,
          relatedType,
          relatedId,
        },
      });

      await createOperationLog(req, {
        action: OperationAction.CREATE,
        targetType: 'Todo',
        targetId: todo.id,
        targetName: title,
        memberId,
        newValue: { title, type, priority, assigneeId, dueDate },
      });

      res.json(success({ id: todo.id }, '待办创建成功'));
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('待办不存在');
    }

    const canEdit =
      req.user!.role === Role.ADMIN ||
      existing.creatorId === req.user!.id ||
      existing.assigneeId === req.user!.id;

    if (!canEdit) {
      throw new ForbiddenError(
        '无权编辑此待办',
        '只有创建人、指派人或管理员可以编辑此待办事项'
      );
    }

    const data: any = {};
    const fields = [
      'type', 'title', 'description', 'status', 'priority',
      'dueDate', 'assigneeId', 'memberId', 'laggingId',
      'relatedType', 'relatedId', 'completedNote',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    if (data.dueDate) data.dueDate = new Date(data.dueDate);

    const wasUncompleted =
      existing.status === TodoStatus.PENDING || existing.status === TodoStatus.IN_PROGRESS;
    const nowCompleted = data.status === TodoStatus.COMPLETED;
    if (wasUncompleted && nowCompleted && !data.completedAt) {
      data.completedAt = new Date();
    }

    const todo = await prisma.todo.update({ where: { id }, data });

    await createOperationLog(req, {
      action: data.status === TodoStatus.COMPLETED ? OperationAction.COMPLETE : OperationAction.UPDATE,
      targetType: 'Todo',
      targetId: todo.id,
      targetName: todo.title,
      memberId: todo.memberId,
      oldValue: { status: existing.status, priority: existing.priority, assigneeId: existing.assigneeId },
      newValue: data,
    });

    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/assign', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { assigneeId } = req.body;

    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('待办不存在');
    }

    if (!assigneeId) {
      throw new BadRequestError('请选择指派人员');
    }

    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!assignee) {
      throw new NotFoundError('指派人员不存在');
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: { assigneeId, status: TodoStatus.IN_PROGRESS },
    });

    await createOperationLog(req, {
      action: OperationAction.ASSIGN,
      targetType: 'Todo',
      targetId: todo.id,
      targetName: `${todo.title} -> ${assignee.name}`,
      memberId: todo.memberId,
      newValue: { assigneeId, assigneeName: assignee.name },
    });

    res.json(success(null, `已指派给 ${assignee.name}`));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('待办不存在');
    }

    if (req.user!.role !== Role.ADMIN && existing.creatorId !== req.user!.id) {
      throw new ForbiddenError(
        '无权删除此待办',
        '只有创建人或管理员可以删除此待办事项'
      );
    }

    await prisma.todo.delete({ where: { id } });

    await createOperationLog(req, {
      action: OperationAction.DELETE,
      targetType: 'Todo',
      targetId: id,
      targetName: existing.title,
    });

    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
});

export default router;
