const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');
const { generateToken } = require('../utils/jwt');
const { comparePassword, hashPassword } = require('../utils/password');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400);
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { grid: true },
    });

    if (!user) {
      return error(res, '用户名或密码错误', 401);
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return error(res, '用户名或密码错误', 401);
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      gridId: user.gridId,
    });

    const { password: _, ...userInfo } = user;

    return success(res, {
      token,
      user: userInfo,
    }, '登录成功');
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { username, password, name, phone } = req.body;

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
        phone,
        role: 'GRID_WORKER',
      },
    });

    const { password: _, ...userInfo } = user;

    return success(res, userInfo, '注册成功');
  } catch (err) {
    next(err);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { grid: true },
    });

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    const { password: _, ...userInfo } = user;

    return success(res, userInfo, '获取成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  register,
  getCurrentUser,
};
