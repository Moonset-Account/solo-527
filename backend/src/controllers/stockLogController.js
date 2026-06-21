const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getStockLogs(req, res) {
  try {
    const { page = 1, pageSize = 10, productId, type, startDate, endDate, keyword } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {};

    if (productId) {
      where.productId = Number(productId);
    }

    if (type) {
      where.type = type;
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

    if (keyword) {
      where.OR = [
        { reason: { contains: keyword } },
        { remark: { contains: keyword } },
        { product: { name: { contains: keyword } } },
        { product: { sku: { contains: keyword } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.stockLog.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true,
            },
          },
        },
      }),
      prisma.stockLog.count({ where }),
    ]);

    success(res, {
      list: logs,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取库存日志失败', { error: err.message });
    error(res, '获取库存日志失败', 500);
  }
}

module.exports = {
  getStockLogs,
};
