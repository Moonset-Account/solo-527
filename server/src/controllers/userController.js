const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');
const { hashPassword } = require('../utils/password');

async function getUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || '';
    const role = req.query.role;
    const gridId = req.query.gridId ? parseInt(req.query.gridId) : undefined;

    const where = {};

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { name: { contains: keyword } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (gridId) {
      where.gridId = gridId;
    }

    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: { grid: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    return paginate(res, usersWithoutPassword, total, page, pageSize);
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { grid: true },
    });

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    const { password: _, ...userInfo } = user;

    return success(res, userInfo);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { username, password, name, role, gridId, avatar, phone } = req.body;

    if (!username || !password || !name) {
      return error(res, '用户名、密码和姓名不能为空', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return error(res, '用户名已存在', 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || 'GRID_WORKER',
        gridId: gridId || null,
        avatar,
        phone,
      },
    });

    const { password: _, ...userInfo } = user;

    return success(res, userInfo, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, role, gridId, avatar, phone, password } = req.body;

    const updateData = {
      name,
      role,
      gridId: gridId || null,
      avatar,
      phone,
    };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    const { password: _, ...userInfo } = user;

    return success(res, userInfo, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
