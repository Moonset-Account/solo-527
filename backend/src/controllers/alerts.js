import prisma from '../utils/prisma.js';
import { success, fail, notFound, paginate } from '../utils/response.js';

export async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const count = await prisma.alert.count({
      where: {
        targetUserId: userId,
        status: 'UNREAD',
      },
    });
    return success(res, { count }, '获取未读提醒数量成功');
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return fail(res, '获取未读提醒数量失败');
  }
}

export async function getAlerts(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, status, type } = req.query;

    const where = { targetUserId: userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [total, list] = await Promise.all([
      prisma.alert.count({ where }),
      prisma.alert.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return success(res, paginate(list, page, pageSize, total), '获取提醒列表成功');
  } catch (err) {
    console.error('getAlerts error:', err);
    return fail(res, '获取提醒列表失败');
  }
}

export async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({ where: { id: Number(id) } });
    if (!alert) return notFound(res, '提醒不存在');
    if (alert.targetUserId !== userId) return fail(res, '无权限操作此提醒', 403);

    const updated = await prisma.alert.update({
      where: { id: Number(id) },
      data: { status: 'READ', readAt: new Date() },
    });

    return success(res, updated, '标记已读成功');
  } catch (err) {
    console.error('markAsRead error:', err);
    return fail(res, '标记已读失败');
  }
}

export async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    const result = await prisma.alert.updateMany({
      where: { targetUserId: userId, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });

    return success(res, { updatedCount: result.count }, '全部标记已读成功');
  } catch (err) {
    console.error('markAllAsRead error:', err);
    return fail(res, '全部标记已读失败');
  }
}

export async function deleteAlert(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({ where: { id: Number(id) } });
    if (!alert) return notFound(res, '提醒不存在');
    if (alert.targetUserId !== userId) return fail(res, '无权限操作此提醒', 403);

    await prisma.alert.delete({ where: { id: Number(id) } });

    return success(res, null, '删除提醒成功');
  } catch (err) {
    console.error('deleteAlert error:', err);
    return fail(res, '删除提醒失败');
  }
}
