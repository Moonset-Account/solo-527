import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { generateToken } from '../utils/jwt.js';

export async function login(username, password) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new Error('用户名或密码错误');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('用户名或密码错误');
  }

  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  const { passwordHash, ...userInfo } = user;

  return {
    token,
    user: userInfo,
  };
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      department: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}
