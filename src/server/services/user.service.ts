import { prisma } from '../lib/prisma';
import { comparePassword, createSession, hashPassword } from '../lib/auth';

export const userService = {
  async login(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error('用户不存在');
    if (!user.active) throw new Error('账号已被禁用');

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw new Error('密码错误');

    const sid = await createSession(user);
    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, sid };
  },

  async list(options?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    role?: string;
    department?: string;
  }) {
    const where: any = {};
    if (options?.keyword) {
      where.OR = [
        { username: { contains: options.keyword, mode: 'insensitive' } },
        { name: { contains: options.keyword, mode: 'insensitive' } },
        { email: { contains: options.keyword, mode: 'insensitive' } },
      ];
    }
    if (options?.role) where.role = options.role;
    if (options?.department)
      where.department = { contains: options.department, mode: 'insensitive' };

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          department: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { assignedTasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, page, pageSize, items };
  },

  async listAllSimple() {
    return prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, department: true, role: true },
      orderBy: [{ department: 'asc' }, { name: 'asc' }],
    });
  },

  async create(data: {
    username: string;
    password: string;
    name: string;
    email: string;
    department?: string;
    role?: string;
    operatorId: string;
  }) {
    const exists = await prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] },
    });
    if (exists) throw new Error('用户名或邮箱已存在');

    const passwordHash = await hashPassword(data.password);
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          passwordHash,
          name: data.name,
          email: data.email,
          department: data.department,
          role: data.role || 'USER',
        },
      });
      await tx.taskLog.create({
        data: {
          action: 'USER_CREATED',
          operatorId: data.operatorId,
          newValue: {
            username: data.username,
            name: data.name,
            role: data.role || 'USER',
          },
        },
      });
      return user;
    });
  },

  async updateRole(
    id: string,
    newRole: string,
    operatorId: string
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('用户不存在');
    if (user.role === newRole) return user;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { role: newRole },
      });
      await tx.taskLog.create({
        data: {
          action: 'USER_ROLE_CHANGED',
          operatorId,
          oldValue: { role: user.role },
          newValue: { role: newRole, userId: id },
        },
      });
      return updated;
    });
  },

  async toggleActive(id: string, active: boolean) {
    return prisma.user.update({ where: { id }, data: { active } });
  },
};
