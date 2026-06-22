import prisma from '../config/prisma.js';
import { parsePagination } from '../utils/common.js';
import bcrypt from 'bcryptjs';

export async function getUserList(query) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const { role, department, keyword } = query;

  const where = {};
  if (role) {
    where.role = role;
  }
  if (department) {
    where.department = department;
  }
  if (keyword) {
    where.OR = [
      { username: { contains: keyword } },
      { name: { contains: keyword } },
      { email: { contains: keyword } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        department: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function createUser(data) {
  const { username, password, name, email, department, role } = data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new Error('用户名已存在');
  }

  const passwordHash = await bcrypt.hash(password || '123456', 10);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      name,
      email,
      department,
      role: role || 'USER',
    },
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

export async function updateUser(id, data) {
  const { name, email, department, role, password } = data;

  const existing = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!existing) {
    throw new Error('用户不存在');
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (department !== undefined) updateData.department = department;
  if (role !== undefined) updateData.role = role;
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: updateData,
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

export async function getDepartmentList() {
  const users = await prisma.user.findMany({
    select: { department: true },
    distinct: ['department'],
    orderBy: { department: 'asc' },
  });

  return users.map(u => u.department).filter(Boolean);
}
