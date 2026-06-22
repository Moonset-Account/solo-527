import prisma from '../config/prisma.js';
import { parsePagination } from '../utils/common.js';

export async function createNotification(data) {
  const { licenseId, notifierId, receiverId, type, title, content, handleResult } = data;

  const notification = await prisma.notification.create({
    data: {
      licenseId,
      notifierId,
      receiverId,
      type,
      title,
      content,
      handleResult: handleResult || null,
      status: 'SENT',
    },
    include: {
      license: {
        include: {
          plugin: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, department: true } },
        },
      },
      notifier: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
  });

  return notification;
}

export async function getNotificationList(userId, role, query) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const { type, status, licenseId } = query;

  const where = {};

  if (role === 'USER') {
    where.receiverId = userId;
  }

  if (type) {
    where.type = type;
  }
  if (status) {
    where.status = status;
  }
  if (licenseId) {
    where.licenseId = Number(licenseId);
  }

  const [list, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        license: {
          include: {
            plugin: { select: { id: true, name: true } },
            user: { select: { id: true, name: true, department: true } },
          },
        },
        notifier: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function getNotificationDetail(id, userId, role) {
  const notification = await prisma.notification.findUnique({
    where: { id: Number(id) },
    include: {
      license: {
        include: {
          plugin: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, department: true, email: true } },
          plan: { select: { id: true, name: true, price: true, billingCycle: true } },
          application: { select: { id: true, reason: true, processingNote: true } },
        },
      },
      notifier: { select: { id: true, name: true, department: true } },
      receiver: { select: { id: true, name: true, department: true } },
    },
  });

  if (!notification) {
    throw new Error('通知记录不存在');
  }

  if (role === 'USER' && notification.receiverId !== userId) {
    throw new Error('无权查看该通知');
  }

  return notification;
}

export async function sendRenewalReminder(licenseId, notifierId, data) {
  const { handleResult } = data;

  const license = await prisma.license.findUnique({
    where: { id: Number(licenseId) },
    include: {
      plugin: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, department: true } },
      plan: { select: { id: true, name: true, price: true, billingCycle: true } },
    },
  });

  if (!license) {
    throw new Error('授权不存在');
  }

  const endDate = new Date(license.endDate);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let title = `续费提醒：${license.plugin.name} 即将到期`;
  let content = `您名下的插件「${license.plugin.name}」（${license.plan.name}）将于 ${endDate.toISOString().split('T')[0]} 到期，剩余 ${daysLeft} 天。请及时处理续费事宜。`;

  if (daysLeft <= 0) {
    title = `续费提醒：${license.plugin.name} 已过期`;
    content = `您名下的插件「${license.plugin.name}」（${license.plan.name}）已于 ${endDate.toISOString().split('T')[0]} 过期。请尽快处理续费。`;
  }

  const notification = await prisma.notification.create({
    data: {
      licenseId: license.id,
      notifierId,
      receiverId: license.userId,
      type: 'RENEWAL_REMINDER',
      title,
      content,
      handleResult: handleResult || null,
      status: 'SENT',
    },
    include: {
      license: {
        include: {
          plugin: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, department: true } },
        },
      },
      notifier: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
  });

  return notification;
}
