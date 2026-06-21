const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getConsultants(req, res) {
  try {
    const { page = 1, pageSize = 10, keyword, status, level } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (level) {
      where.level = level;
    }

    const [consultants, total] = await Promise.all([
      prisma.consultant.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.consultant.count({ where }),
    ]);

    success(res, {
      list: consultants,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取顾问列表失败', { error: err.message });
    error(res, '获取顾问列表失败', 500);
  }
}

async function getConsultantById(req, res) {
  try {
    const { id } = req.params;

    const consultant = await prisma.consultant.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            memberTreatments: true,
            commissions: true,
            appointments: true,
          },
        },
      },
    });

    if (!consultant) {
      return error(res, '顾问不存在', 404);
    }

    success(res, consultant, '获取成功');
  } catch (err) {
    logger.error('获取顾问详情失败', { error: err.message, id: req.params.id });
    error(res, '获取顾问详情失败', 500);
  }
}

async function createConsultant(req, res) {
  try {
    const { name, phone, avatar, level, commissionRate, status } = req.body;

    if (!name) {
      return error(res, '顾问姓名不能为空', 400);
    }

    const consultant = await prisma.consultant.create({
      data: {
        name,
        phone,
        avatar,
        level: level || '初级',
        commissionRate: commissionRate ? Number(commissionRate) : 0,
        status: status || 'active',
      },
    });

    await logger.operation(
      req.user?.id,
      'create',
      'consultant',
      consultant.id,
      'consultant',
      `创建顾问: ${name}`,
      req
    );

    success(res, consultant, '创建成功', 201);
  } catch (err) {
    logger.error('创建顾问失败', { error: err.message });
    error(res, '创建顾问失败', 500);
  }
}

async function updateConsultant(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, avatar, level, commissionRate, status } = req.body;

    const consultant = await prisma.consultant.findUnique({
      where: { id: Number(id) },
    });

    if (!consultant) {
      return error(res, '顾问不存在', 404);
    }

    const updated = await prisma.consultant.update({
      where: { id: Number(id) },
      data: {
        name,
        phone,
        avatar,
        level,
        commissionRate: commissionRate !== undefined ? Number(commissionRate) : undefined,
        status,
      },
    });

    await logger.operation(
      req.user?.id,
      'update',
      'consultant',
      Number(id),
      'consultant',
      `更新顾问: ${name || consultant.name}`,
      req
    );

    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新顾问失败', { error: err.message, id: req.params.id });
    error(res, '更新顾问失败', 500);
  }
}

async function deleteConsultant(req, res) {
  try {
    const { id } = req.params;

    const consultant = await prisma.consultant.findUnique({
      where: { id: Number(id) },
    });

    if (!consultant) {
      return error(res, '顾问不存在', 404);
    }

    const relatedCount = await prisma.memberTreatment.count({
      where: { consultantId: Number(id) },
    });

    if (relatedCount > 0) {
      return error(res, '该顾问有关联的会员疗程，无法删除', 400);
    }

    await prisma.consultant.delete({
      where: { id: Number(id) },
    });

    await logger.operation(
      req.user?.id,
      'delete',
      'consultant',
      Number(id),
      'consultant',
      `删除顾问: ${consultant.name}`,
      req
    );

    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除顾问失败', { error: err.message, id: req.params.id });
    error(res, '删除顾问失败', 500);
  }
}

async function getConsultantCommissions(req, res) {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, status, type } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {
      consultantId: Number(id),
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
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

    const totalAmount = await prisma.commission.aggregate({
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
      totalAmount: totalAmount._sum.amount || 0,
    }, '获取成功');
  } catch (err) {
    logger.error('获取顾问提成记录失败', { error: err.message, id: req.params.id });
    error(res, '获取顾问提成记录失败', 500);
  }
}

module.exports = {
  getConsultants,
  getConsultantById,
  createConsultant,
  updateConsultant,
  deleteConsultant,
  getConsultantCommissions,
};
