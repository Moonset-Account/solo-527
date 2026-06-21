const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getOperationLogs(req, res) {
  try {
    const { page = 1, pageSize = 10, module, userId, startTime, endTime, action } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {};

    if (module) {
      where.module = module;
    }

    if (userId) {
      where.userId = Number(userId);
    }

    if (action) {
      where.action = action;
    }

    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt.gte = new Date(startTime);
      }
      if (endTime) {
        where.createdAt.lte = new Date(endTime);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      }),
      prisma.operationLog.count({ where }),
    ]);

    success(res, {
      list: logs,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取操作日志列表失败', { error: err.message });
    error(res, '获取操作日志列表失败', 500);
  }
}

async function getOperationLogById(req, res) {
  try {
    const { id } = req.params;

    const log = await prisma.operationLog.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!log) {
      return error(res, '日志不存在', 404);
    }

    success(res, log, '获取成功');
  } catch (err) {
    logger.error('获取操作日志详情失败', { error: err.message, id: req.params.id });
    error(res, '获取操作日志详情失败', 500);
  }
}

module.exports = {
  getOperationLogs,
  getOperationLogById,
};
