const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');

async function getNotifications(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const isRead = req.query.isRead ? req.query.isRead === 'true' : undefined;
    const type = req.query.type;

    const where = {
      userId: req.user.id,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const skip = (page - 1) * pageSize;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          event: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return paginate(res, notifications, total, page, pageSize);
  } catch (err) {
    next(err);
  }
}

async function getNotificationById(req, res, next) {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
      include: {
        event: true,
      },
    });

    if (!notification) {
      return error(res, '通知不存在', 404);
    }

    if (notification.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, '无权查看此通知', 403);
    }

    return success(res, notification);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return error(res, '通知不存在', 404);
    }

    if (notification.userId !== req.user.id) {
      return error(res, '无权操作此通知', 403);
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });

    return success(res, updatedNotification, '标记已读成功');
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return success(res, null, '全部标记已读成功');
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    return success(res, { count });
  } catch (err) {
    next(err);
  }
}

async function createNotification(req, res, next) {
  try {
    const { userId, title, content, type, eventId } = req.body;

    if (!userId || !title || !content) {
      return error(res, '必填项不能为空', 400);
    }

    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        title,
        content,
        type: type || 'SYSTEM',
        eventId: eventId ? parseInt(eventId) : null,
      },
    });

    return success(res, notification, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return error(res, '通知不存在', 404);
    }

    if (notification.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return error(res, '无权删除此通知', 403);
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification,
  deleteNotification,
};
