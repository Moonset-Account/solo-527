import { Router } from 'express';
import { body, query } from 'express-validator';
import prisma from '../lib/prisma';
import { validateRequest } from '../middlewares/validate';
import { success } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { roleMiddleware } from '../middlewares/auth';
import { Role, OperationAction } from '../types/enums';
import { createOperationLog } from '../middlewares/operationLogger';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const campId = parseInt(req.query.campId as string);
    if (!campId) {
      throw new BadRequestError('campId 参数必填');
    }

    const courses = await prisma.course.findMany({
      where: { campId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        description: true,
        dayIndex: true,
        duration: true,
        resourceUrl: true,
        resourceType: true,
        hasTrial: true,
        trialUrl: true,
        trialDuration: true,
        materialUrl: true,
        homeworkUrl: true,
        sortOrder: true,
      },
    });

    res.json(success(courses));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        camp: { select: { id: true, name: true, status: true, totalDays: true } },
      },
    });

    if (!course) {
      throw new NotFoundError('课程不存在');
    }

    res.json(success(course));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/trial', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        type: true,
        description: true,
        dayIndex: true,
        trialDuration: true,
        hasTrial: true,
      },
    });

    if (!course) {
      throw new NotFoundError('课程不存在');
    }

    if (!course.hasTrial) {
      throw new BadRequestError(
        '该课程没有试看权限',
        '请开通会员以观看完整课程内容'
      );
    }

    res.json(success(course));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  roleMiddleware(Role.ADMIN, Role.TEACHER),
  [
    body('campId').isInt().withMessage('营期ID无效'),
    body('title').notEmpty().withMessage('课程标题不能为空'),
    body('dayIndex').isInt({ min: 1 }).withMessage('天数必须大于0'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const data = req.body;
      const existing = await prisma.camp.findUnique({ where: { id: data.campId } });
      if (!existing) {
        throw new NotFoundError('所属营期不存在');
      }

      const course = await prisma.course.create({ data });

      await createOperationLog(req, {
        action: OperationAction.CREATE,
        targetType: 'Course',
        targetId: course.id,
        targetName: course.title,
        newValue: { title: data.title, campId: data.campId, dayIndex: data.dayIndex },
      });

      res.json(success({ id: course.id }, '课程创建成功'));
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/:id', roleMiddleware(Role.ADMIN, Role.TEACHER), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('课程不存在');
    }

    const data: any = {};
    const fields = ['title', 'type', 'description', 'dayIndex', 'duration', 'resourceUrl', 'resourceType', 'hasTrial', 'trialUrl', 'trialDuration', 'materialUrl', 'homeworkUrl', 'sortOrder', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });

    const course = await prisma.course.update({ where: { id }, data });

    await createOperationLog(req, {
      action: OperationAction.UPDATE,
      targetType: 'Course',
      targetId: course.id,
      targetName: course.title,
      oldValue: { title: existing.title, sortOrder: existing.sortOrder },
      newValue: data,
    });

    res.json(success(null, '更新成功'));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', roleMiddleware(Role.ADMIN, Role.TEACHER), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('课程不存在');
    }

    await prisma.course.delete({ where: { id } });

    await createOperationLog(req, {
      action: OperationAction.DELETE,
      targetType: 'Course',
      targetId: id,
      targetName: existing.title,
    });

    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
});

export default router;
