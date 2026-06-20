import { Router } from 'express';
import { body, query } from 'express-validator';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { validateRequest } from '../middlewares/validate';
import { success } from '../utils/response';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { roleMiddleware } from '../middlewares/auth';
import { Role, OperationAction } from '../types/enums';
import { createOperationLog } from '../middlewares/operationLogger';

const router = Router();

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量在1-100之间'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const keyword = (req.query.keyword as string) || '';
      const role = req.query.role as string | undefined;

      const where: any = {};
      if (keyword) {
        where.OR = [
          { username: { contains: keyword } },
          { name: { contains: keyword } },
          { phone: { contains: keyword } },
        ];
      }
      if (role) {
        where.role = role;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
            phone: true,
            email: true,
            avatar: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json(success({ list: users, total, page, pageSize }));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/teachers', async (_req, res, next) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: Role.TEACHER, isActive: true },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    });
    res.json(success(teachers));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  roleMiddleware(Role.ADMIN),
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
    body('name').notEmpty().withMessage('姓名不能为空'),
    body('role').isIn(Object.values(Role)).withMessage('角色无效'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { username, password, name, role, phone, email } = req.body;

      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        throw new BadRequestError('用户名已存在', '请选择其他用户名');
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { username, password: hashed, name, role, phone, email },
      });

      await createOperationLog(req, {
        action: OperationAction.CREATE,
        targetType: 'User',
        targetId: user.id,
        targetName: user.name,
        newValue: { username, name, role },
      });

      res.json(success({ id: user.id }, '创建成功'));
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id',
  roleMiddleware(Role.ADMIN),
  [
    body('name').optional().notEmpty().withMessage('姓名不能为空'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { name, phone, email, isActive, password } = req.body;

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError('用户不存在');
      }

      const data: any = {};
      if (name) data.name = name;
      if (phone !== undefined) data.phone = phone;
      if (email !== undefined) data.email = email;
      if (isActive !== undefined) data.isActive = isActive;
      if (password) {
        if (password.length < 6) {
          throw new BadRequestError('密码至少6位');
        }
        data.password = await bcrypt.hash(password, 10);
      }

      const oldValue = { name: existing.name, isActive: existing.isActive };
      const user = await prisma.user.update({ where: { id }, data });

      await createOperationLog(req, {
        action: OperationAction.UPDATE,
        targetType: 'User',
        targetId: user.id,
        targetName: user.name,
        oldValue,
        newValue: data,
      });

      res.json(success(null, '更新成功'));
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id/password',
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { oldPassword, newPassword } = req.body;

      if (req.user!.id !== id && req.user!.role !== Role.ADMIN) {
        throw new ForbiddenError('只能修改自己的密码', '如忘记密码请联系管理员重置');
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      if (req.user!.id === id) {
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
          throw new BadRequestError(
            '原密码不正确',
            '请输入正确的原密码，或联系管理员重置'
          );
        }
      }

      if (!newPassword || newPassword.length < 6) {
        throw new BadRequestError('新密码至少6位');
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id }, data: { password: hashed } });

      await createOperationLog(req, {
        action: OperationAction.UPDATE,
        targetType: 'User',
        targetId: id,
        targetName: user.name,
        detail: '修改密码',
      });

      res.json(success(null, '密码修改成功'));
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', roleMiddleware(Role.ADMIN), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user!.id) {
      throw new BadRequestError('不能删除自己', '请使用其他管理员账号操作');
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('用户不存在');
    }

    await prisma.user.delete({ where: { id } });

    await createOperationLog(req, {
      action: OperationAction.DELETE,
      targetType: 'User',
      targetId: id,
      targetName: existing.name,
    });

    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
});

export default router;
