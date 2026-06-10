const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');

async function getOperationLogs(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const eventId = req.query.eventId ? parseInt(req.query.eventId) : undefined;
    const operatorId = req.query.operatorId ? parseInt(req.query.operatorId) : undefined;
    const action = req.query.action;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const where = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (operatorId) {
      where.operatorId = operatorId;
    }

    if (action) {
      where.action = { contains: action };
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + ' 23:59:59');
      }
    }

    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          event: { select: { id: true, title: true } },
          operator: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.operationLog.count({ where }),
    ]);

    return paginate(res, logs, total, page, pageSize);
  } catch (err) {
    next(err);
  }
}

async function getOperationLogById(req, res, next) {
  try {
    const { id } = req.params;

    const log = await prisma.operationLog.findUnique({
      where: { id: parseInt(id) },
      include: {
        event: true,
        operator: { select: { id: true, name: true, username: true } },
      },
    });

    if (!log) {
      return error(res, '操作日志不存在', 404);
    }

    return success(res, log);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOperationLogs,
  getOperationLogById,
};
