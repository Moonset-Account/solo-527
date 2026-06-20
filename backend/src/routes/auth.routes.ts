import { Router } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken, recordLastLogin } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { success } from '../utils/response';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import { createOperationLog } from '../middlewares/operationLogger';
import { OperationAction } from '../types/enums';

const router = Router();

router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError(
          '用户名或密码错误',
          '请检查用户名和密码是否正确，或联系管理员确认账号状态'
        );
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new UnauthorizedError(
          '用户名或密码错误',
          '请检查用户名和密码是否正确，注意区分大小写'
        );
      }

      const token = generateToken({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      });

      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
      await recordLastLogin(user.id, ipAddress);

      await createOperationLog(req, {
        action: OperationAction.LOGIN,
        targetType: 'User',
        targetId: user.id,
        targetName: user.name,
        detail: '用户登录成功',
      });

      res.json(
        success(
          {
            token,
            user: {
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role,
              phone: user.phone,
              email: user.email,
              avatar: user.avatar,
            },
          },
          '登录成功'
        )
      );
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
    body('name').notEmpty().withMessage('姓名不能为空'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { username, password, name, phone, email } = req.body;

      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        throw new BadRequestError(
          '用户名已存在',
          '请选择其他用户名，或使用该用户名直接登录'
        );
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          password: hashed,
          name,
          phone,
          email,
        },
      });

      const token = generateToken({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      });

      res.json(
        success(
          {
            token,
            user: {
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role,
            },
          },
          '注册成功'
        )
      );
    } catch (err) {
      next(err);
    }
  }
);

router.post('/logout', async (req, res, next) => {
  try {
    if (req.user) {
      await createOperationLog(req, {
        action: OperationAction.LOGOUT,
        targetType: 'User',
        targetId: req.user.id,
        targetName: req.user.name,
        detail: '用户退出登录',
      });
    }
    res.json(success(null, '退出成功'));
  } catch (err) {
    next(err);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        phone: true,
        email: true,
        avatar: true,
        lastLoginAt: true,
      },
    });
    res.json(success(user));
  } catch (err) {
    next(err);
  }
});

export default router;
