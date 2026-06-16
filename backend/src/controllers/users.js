import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { success, fail, paginate } from '../utils/response.js';

const userSelect = {
  id: true,
  username: true,
  realName: true,
  email: true,
  phone: true,
  role: true,
  supplierId: true,
  supplier: {
    select: { id: true, code: true, name: true },
  },
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export async function getUsers(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const keyword = req.query.keyword || '';
  const role = req.query.role || '';
  const isActive = req.query.isActive;

  const skip = (page - 1) * pageSize;

  const where = {};

  if (keyword) {
    where.OR = [
      { username: { contains: keyword } },
      { realName: { contains: keyword } },
      { email: { contains: keyword } },
      { phone: { contains: keyword } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined && isActive !== '') {
    where.isActive = isActive === 'true';
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return success(res, paginate(users, page, pageSize, total), '获取用户列表成功');
  } catch (err) {
    console.error('getUsers error:', err);
    return fail(res, '获取用户列表失败', 500);
  }
}

export async function createUser(req, res) {
  const { username, password, realName, email, phone, role, supplierId, isActive } = req.body;

  if (!username || !password || !realName || !role) {
    return fail(res, '用户名、密码、真实姓名、角色为必填项');
  }

  if (password.length < 6) {
    return fail(res, '密码长度不能少于6位');
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return fail(res, '用户名已存在');
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return fail(res, '邮箱已被使用');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        realName,
        email: email || null,
        phone: phone || null,
        role,
        supplierId: supplierId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      select: userSelect,
    });

    return success(res, user, '创建用户成功', 201);
  } catch (err) {
    console.error('createUser error:', err);
    if (err.code === 'P2002') {
      return fail(res, '用户名或邮箱已存在');
    }
    return fail(res, '创建用户失败', 500);
  }
}

export async function getUserById(req, res) {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return fail(res, '用户ID无效');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      return fail(res, '用户不存在', 404);
    }

    return success(res, user, '获取用户详情成功');
  } catch (err) {
    console.error('getUserById error:', err);
    return fail(res, '获取用户详情失败', 500);
  }
}

export async function updateUser(req, res) {
  const id = parseInt(req.params.id);
  const { realName, email, phone, role, supplierId, isActive, password } = req.body;

  if (isNaN(id)) {
    return fail(res, '用户ID无效');
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return fail(res, '用户不存在', 404);
    }

    if (email && email !== existingUser.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return fail(res, '邮箱已被使用');
      }
    }

    const data = {
      realName,
      email: email || null,
      phone: phone || null,
      role,
      supplierId: supplierId || null,
    };

    if (isActive !== undefined) {
      data.isActive = isActive;
    }

    if (password) {
      if (password.length < 6) {
        return fail(res, '密码长度不能少于6位');
      }
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    return success(res, user, '更新用户成功');
  } catch (err) {
    console.error('updateUser error:', err);
    if (err.code === 'P2002') {
      return fail(res, '邮箱已被使用');
    }
    return fail(res, '更新用户失败', 500);
  }
}

export async function updateUserStatus(req, res) {
  const id = parseInt(req.params.id);
  const { isActive } = req.body;

  if (isNaN(id)) {
    return fail(res, '用户ID无效');
  }

  if (isActive === undefined) {
    return fail(res, '状态参数 isActive 为必填项');
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return fail(res, '用户不存在', 404);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: !!isActive },
      select: userSelect,
    });

    return success(res, user, `用户已${isActive ? '启用' : '禁用'}`);
  } catch (err) {
    console.error('updateUserStatus error:', err);
    return fail(res, '更新用户状态失败', 500);
  }
}
