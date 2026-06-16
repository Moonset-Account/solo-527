import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { success, fail } from '../utils/response.js';
import { signToken } from '../middleware/auth.js';

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return fail(res, '用户名和密码不能为空');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { supplier: { select: { id: true, code: true, name: true } } },
    });

    if (!user) {
      return fail(res, '用户名或密码错误', 401);
    }

    if (!user.isActive) {
      return fail(res, '账号已被禁用，请联系管理员', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return fail(res, '用户名或密码错误', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken(user);

    const userInfo = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      supplierId: user.supplierId,
      supplier: user.supplier,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };

    return success(res, { token, user: userInfo }, '登录成功');
  } catch (err) {
    console.error('login error:', err);
    return fail(res, '登录失败，请稍后重试', 500);
  }
}

export async function logout(req, res) {
  return success(res, null, '退出登录成功');
}

export async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { supplier: { select: { id: true, code: true, name: true } } },
    });

    if (!user) {
      return fail(res, '用户不存在', 404);
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      supplierId: user.supplierId,
      supplier: user.supplier,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };

    return success(res, userInfo, '获取用户信息成功');
  } catch (err) {
    console.error('me error:', err);
    return fail(res, '获取用户信息失败', 500);
  }
}

export async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return fail(res, '旧密码和新密码不能为空');
  }

  if (newPassword.length < 6) {
    return fail(res, '新密码长度不能少于6位');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return fail(res, '用户不存在', 404);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      return fail(res, '旧密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: hashedPassword },
    });

    return success(res, null, '密码修改成功');
  } catch (err) {
    console.error('changePassword error:', err);
    return fail(res, '密码修改失败，请稍后重试', 500);
  }
}
