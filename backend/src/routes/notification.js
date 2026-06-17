const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { z } = require('zod');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { type, isRead, page = 1, pageSize = 50 } = req.query;
    const where = {};

    if (type) where.type = type;
    if (isRead !== undefined && isRead !== '') {
      where.status = isRead === 'true' ? 'READ' : 'UNREAD';
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const notifications = await prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const result = notifications.map((n) => ({
      ...n,
      isRead: n.status === 'READ',
    }));

    res.json({
      code: 200,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/unread/count', async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { status: 'UNREAD' },
    });
    res.json({ code: 200, data: count });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/read', async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
    res.json({
      code: 200,
      message: '标记已读成功',
      data: { ...notification, isRead: true },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { status: 'UNREAD' },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
    res.json({ code: 200, message: '全部标记已读成功' });
  } catch (error) {
    next(error);
  }
});

const systemNotificationSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().min(1, '内容不能为空'),
});

router.post('/system', requireAdmin, async (req, res, next) => {
  try {
    const data = systemNotificationSchema.parse(req.body);

    const notification = await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: data.title,
        content: data.content,
        status: 'UNREAD',
      },
    });

    res.json({
      code: 200,
      message: '发送成功',
      data: { ...notification, isRead: false },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
