const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getCommissions(req, res) {
  try {
    const { page = 1, pageSize = 10, consultantId, status, type, memberId, startDate, endDate } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {};

    if (consultantId) {
      where.consultantId = Number(consultantId);
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (memberId) {
      where.memberId = Number(memberId);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          consultant: {
            select: { id: true, name: true, level: true },
          },
          treatment: {
            select: { id: true, name: true },
          },
          member: {
            select: { id: true, name: true, memberNo: true },
          },
        },
      }),
      prisma.commission.count({ where }),
    ]);

    const amountSummary = await prisma.commission.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    success(res, {
      list: commissions,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalAmount: amountSummary._sum.amount || 0,
    }, '获取成功');
  } catch (err) {
    logger.error('获取提成列表失败', { error: err.message });
    error(res, '获取提成列表失败', 500);
  }
}

async function getCommissionById(req, res) {
  try {
    const { id } = req.params;

    const commission = await prisma.commission.findUnique({
      where: { id: Number(id) },
      include: {
        consultant: {
          select: { id: true, name: true, level: true, phone: true },
        },
        treatment: {
          select: { id: true, name: true },
        },
        member: {
          select: { id: true, name: true, memberNo: true, phone: true },
        },
      },
    });

    if (!commission) {
      return error(res, '提成记录不存在', 404);
    }

    success(res, commission, '获取成功');
  } catch (err) {
    logger.error('获取提成详情失败', { error: err.message, id: req.params.id });
    error(res, '获取提成详情失败', 500);
  }
}

async function createCommission(req, res) {
  try {
    const { consultantId, treatmentId, memberId, amount, type, relatedId, relatedType, remark } = req.body;

    if (!consultantId || !amount || !type) {
      return error(res, '顾问ID、金额和类型不能为空', 400);
    }

    const consultant = await prisma.consultant.findUnique({
      where: { id: Number(consultantId) },
    });

    if (!consultant) {
      return error(res, '顾问不存在', 404);
    }

    const commission = await prisma.commission.create({
      data: {
        consultantId: Number(consultantId),
        treatmentId: treatmentId ? Number(treatmentId) : null,
        memberId: memberId ? Number(memberId) : null,
        amount: Number(amount),
        type,
        relatedId: relatedId ? Number(relatedId) : null,
        relatedType,
        remark,
      },
    });

    await logger.operation(
      req.user?.id,
      'create',
      'commission',
      commission.id,
      'commission',
      `创建提成记录: ${consultant.name} - ${amount}元`,
      req
    );

    success(res, commission, '创建成功', 201);
  } catch (err) {
    logger.error('创建提成记录失败', { error: err.message });
    error(res, '创建提成记录失败', 500);
  }
}

async function updateCommission(req, res) {
  try {
    const { id } = req.params;
    const { amount, type, status, remark } = req.body;

    const commission = await prisma.commission.findUnique({
      where: { id: Number(id) },
      include: {
        consultant: true,
      },
    });

    if (!commission) {
      return error(res, '提成记录不存在', 404);
    }

    const updated = await prisma.commission.update({
      where: { id: Number(id) },
      data: {
        amount: amount !== undefined ? Number(amount) : undefined,
        type,
        status,
        remark,
      },
    });

    await logger.operation(
      req.user?.id,
      'update',
      'commission',
      Number(id),
      'commission',
      `更新提成记录: ${commission.consultant.name} - ${amount || commission.amount}元`,
      req
    );

    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新提成记录失败', { error: err.message, id: req.params.id });
    error(res, '更新提成记录失败', 500);
  }
}

async function settleCommission(req, res) {
  try {
    const { id } = req.params;
    const { settleDate, remark } = req.body;

    const commission = await prisma.commission.findUnique({
      where: { id: Number(id) },
      include: {
        consultant: true,
      },
    });

    if (!commission) {
      return error(res, '提成记录不存在', 404);
    }

    if (commission.status === 'settled') {
      return error(res, '提成已结算', 400);
    }

    const updated = await prisma.commission.update({
      where: { id: Number(id) },
      data: {
        status: 'settled',
        settleDate: settleDate ? new Date(settleDate) : new Date(),
        remark: remark || commission.remark,
      },
    });

    await logger.operation(
      req.user?.id,
      'settle',
      'commission',
      Number(id),
      'commission',
      `结算提成: ${commission.consultant.name} - ${commission.amount}元`,
      req
    );

    success(res, updated, '结算成功');
  } catch (err) {
    logger.error('结算提成失败', { error: err.message, id: req.params.id });
    error(res, '结算提成失败', 500);
  }
}

async function deleteCommission(req, res) {
  try {
    const { id } = req.params;

    const commission = await prisma.commission.findUnique({
      where: { id: Number(id) },
      include: {
        consultant: true,
      },
    });

    if (!commission) {
      return error(res, '提成记录不存在', 404);
    }

    if (commission.status === 'settled') {
      return error(res, '已结算的提成记录不能删除', 400);
    }

    await prisma.commission.delete({
      where: { id: Number(id) },
    });

    await logger.operation(
      req.user?.id,
      'delete',
      'commission',
      Number(id),
      'commission',
      `删除提成记录: ${commission.consultant.name} - ${commission.amount}元`,
      req
    );

    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除提成记录失败', { error: err.message, id: req.params.id });
    error(res, '删除提成记录失败', 500);
  }
}

module.exports = {
  getCommissions,
  getCommissionById,
  createCommission,
  updateCommission,
  settleCommission,
  deleteCommission,
};
