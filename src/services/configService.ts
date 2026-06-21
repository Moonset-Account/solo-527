import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';
import bcrypt from 'bcryptjs';

const CACHE_KEY = 'config:metrics';
const CACHE_TTL = 3600;

export const configService = {
  async getMetricConfigs() {
    const cached = await cache.get(CACHE_KEY);
    if (cached) return cached;

    const configs = await prisma.metricConfig.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    await cache.set(CACHE_KEY, configs, CACHE_TTL);
    return configs;
  },

  async updateMetricConfig(key: string, data: {
    name?: string;
    description?: string;
    formula?: string;
    unit?: string;
    category?: string;
  }) {
    const config = await prisma.metricConfig.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    });
    await cache.del(CACHE_KEY);
    return config;
  },

  async deleteMetricConfig(key: string) {
    await prisma.metricConfig.delete({ where: { key } });
    await cache.del(CACHE_KEY);
  },

  async getRolePermissions() {
    return prisma.rolePermission.findMany({
      orderBy: [{ role: 'asc' }, { resource: 'asc' }],
    });
  },

  async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    avatar?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role as never,
        avatar: data.avatar,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  },

  async updateUser(id: string, data: {
    name?: string;
    email?: string;
    role?: string;
    avatar?: string;
    password?: string;
  }) {
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.avatar) updateData.avatar = data.avatar;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  },

  async deleteUser(id: string) {
    await prisma.user.delete({ where: { id } });
  },

  async getPriceList(params: {
    priceLevel?: number;
    search?: string;
    partId?: string;
  } = {}) {
    const { priceLevel, search, partId } = params;

    const where: Record<string, unknown> = {};
    if (priceLevel !== undefined) where.priceLevel = priceLevel;
    if (partId) where.partId = partId;
    if (search) {
      where.OR = [
        { part: { name: { contains: search } } },
        { part: { sku: { contains: search } } },
        { serviceName: { contains: search } },
      ];
    }

    return prisma.priceList.findMany({
      where,
      include: { part: { select: { name: true, sku: true, unit: true } } },
      orderBy: [{ priceLevel: 'asc' }, { id: 'asc' }],
    });
  },
};
