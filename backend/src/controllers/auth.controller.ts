import { Router } from 'express';
import { authService } from '../services/AuthService';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { UserRole } from '../entities/User';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return errorResponse(res, '用户名和密码不能为空');
    }

    const result = await authService.login(username, password);
    
    if (!result) {
      return errorResponse(res, '用户名或密码错误', 401);
    }

    const { user, token } = result;
    successResponse(res, {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      token,
    }, '登录成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role, email, phone } = req.body;
    
    const user = await authService.register({
      username,
      password,
      name,
      role: role || 'candidate',
      email,
      phone,
    });

    successResponse(res, {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }, '注册成功');
  } catch (error: any) {
    errorResponse(res, error.message);
  }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    successResponse(res, {
      id: req.user.id,
      username: req.user.username,
      name: req.user.name,
      role: req.user.role,
      email: req.user.email,
      phone: req.user.phone,
    });
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/users', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const { role, page, pageSize } = req.query;
    
    const result = await authService.getUsers({
      role: role as UserRole,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });

    paginatedResponse(
      res,
      result.items.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
      result.total,
      page ? parseInt(page as string) : 1,
      pageSize ? parseInt(pageSize as string) : 20
    );
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/users/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = await authService.updateUser(id, req.body);
    
    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    successResponse(res, {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
    }, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.delete('/users/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await authService.deleteUser(id);
    
    if (!result) {
      return errorResponse(res, '用户不存在', 404);
    }

    successResponse(res, null, '删除成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

export default router;
