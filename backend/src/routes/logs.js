const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const { module, action, operatorName, startDate, endDate, page = 1, pageSize = 50 } = req.query;
    const where = {};

    if (module) where.module = module;
    if (action) where.action = action;
    if (operatorName) {
      where.user = {
        name: {
          contains: operatorName,
        },
      };
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + ' 23:59:59'),
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const logs = await prisma.operationLog.findMany({
      where,
      skip,
      take,
      include: {
        user: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = logs.map((log) => ({
      ...log,
      recordId: log.targetId,
      operatorName: log.user?.name,
      description: `${log.action} ${log.module}`,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
      newValue: log.newValue ? JSON.parse(log.newValue) : null,
    }));

    res.json({
      code: 200,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const log = await prisma.operationLog.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { name: true, username: true } },
      },
    });

    if (!log) {
      return res.status(404).json({ code: 404, message: '日志不存在' });
    }

    const result = {
      ...log,
      recordId: log.targetId,
      operatorName: log.user?.name,
      description: `${log.action} ${log.module}`,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
      newValue: log.newValue ? JSON.parse(log.newValue) : null,
    };

    res.json({ code: 200, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
