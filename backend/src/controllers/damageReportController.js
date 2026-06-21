const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getDamageReports(req, res) {
  try {
    const { page = 1, pageSize = 10, status, productId, startDate, endDate, keyword } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (productId) {
      where.productId = Number(productId);
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

    const [reports, total] = await Promise.all([
      prisma.damageReport.findMany({
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
      prisma.damageReport.count({ where }),
    ]);

    success(res, {
      list: reports,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取报损列表失败', { error: err.message });
    error(res, '获取报损列表失败', 500);
  }
}

async function getDamageReportById(req, res) {
  try {
    const { id } = req.params;

    const report = await prisma.damageReport.findUnique({
      where: { id: Number(id) },
      include: {
        product: true,
      },
    });

    if (!report) {
      return error(res, '报损单不存在', 404);
    }

    success(res, report, '获取成功');
  } catch (err) {
    logger.error('获取报损详情失败', { error: err.message, id: req.params.id });
    error(res, '获取报损详情失败', 500);
  }
}

async function createDamageReport(req, res) {
  try {
    const { productId, quantity, reason, remark } = req.body;

    if (!productId || !quantity || !reason) {
      return error(res, '产品、数量、报损原因不能为空', 400);
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return error(res, '报损数量必须大于0', 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return error(res, '产品不存在', 404);
    }

    const report = await prisma.damageReport.create({
      data: {
        productId: Number(productId),
        quantity: qty,
        reason,
        reporterId: req.user?.id,
        remark,
        status: 'pending',
      },
    });

    await logger.logOperation({
      userId: req.user?.id,
      action: 'create',
      module: 'damage_report',
      targetId: report.id,
      targetType: 'damage_report',
      detail: `创建报损申请: ${product.name}, 数量: ${qty}`,
      req,
    });

    success(res, report, '创建成功', 201);
  } catch (err) {
    logger.error('创建报损失败', { error: err.message });
    error(res, '创建报损失败', 500);
  }
}

async function updateDamageReport(req, res) {
  try {
    const { id } = req.params;
    const { productId, quantity, reason, remark } = req.body;

    const report = await prisma.damageReport.findUnique({
      where: { id: Number(id) },
    });

    if (!report) {
      return error(res, '报损单不存在', 404);
    }

    if (report.status !== 'pending') {
      return error(res, '只有待审批的报损单可以修改', 400);
    }

    const qty = quantity ? Number(quantity) : undefined;
    if (qty !== undefined && qty <= 0) {
      return error(res, '报损数量必须大于0', 400);
    }

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!product) {
        return error(res, '产品不存在', 404);
      }
    }

    const updated = await prisma.damageReport.update({
      where: { id: Number(id) },
      data: {
        productId: productId !== undefined ? Number(productId) : undefined,
        quantity: qty,
        reason,
        remark,
      },
    });

    await logger.logOperation({
      userId: req.user?.id,
      action: 'update',
      module: 'damage_report',
      targetId: Number(id),
      targetType: 'damage_report',
      detail: `更新报损单: ${id}`,
      req,
    });

    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新报损失败', { error: err.message, id: req.params.id });
    error(res, '更新报损失败', 500);
  }
}

async function approveDamageReport(req, res) {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const report = await prisma.damageReport.findUnique({
      where: { id: Number(id) },
      include: { product: true },
    });

    if (!report) {
      return error(res, '报损单不存在', 404);
    }

    if (report.status !== 'pending') {
      return error(res, '只有待审批的报损单可以审批', 400);
    }

    const product = report.product;
    if (product.stock < report.quantity) {
      return error(res, '产品库存不足，无法完成报损', 400);
    }

    const beforeStock = product.stock;
    const afterStock = beforeStock - report.quantity;

    const result = await prisma.$transaction(async (tx) => {
      const updatedReport = await tx.damageReport.update({
        where: { id: Number(id) },
        data: {
          status: 'approved',
          approverId: req.user?.id,
          approvedAt: new Date(),
          remark,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: report.productId },
        data: { stock: afterStock },
      });

      const stockLog = await tx.stockLog.create({
        data: {
          productId: report.productId,
          type: 'out',
          quantity: report.quantity,
          beforeStock,
          afterStock,
          reason: '报损出库',
          operatorId: req.user?.id,
          relatedId: Number(id),
          relatedType: 'damage_report',
          remark: report.reason,
        },
      });

      return { updatedReport, updatedProduct, stockLog };
    });

    await logger.logOperation({
      userId: req.user?.id,
      action: 'approve',
      module: 'damage_report',
      targetId: Number(id),
      targetType: 'damage_report',
      detail: `审批通过报损单: ${product.name}, 数量: ${report.quantity}`,
      req,
    });

    success(res, result.updatedReport, '审批通过');
  } catch (err) {
    logger.error('审批报损失败', { error: err.message, id: req.params.id });
    error(res, '审批报损失败', 500);
  }
}

async function rejectDamageReport(req, res) {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const report = await prisma.damageReport.findUnique({
      where: { id: Number(id) },
      include: { product: true },
    });

    if (!report) {
      return error(res, '报损单不存在', 404);
    }

    if (report.status !== 'pending') {
      return error(res, '只有待审批的报损单可以驳回', 400);
    }

    const updated = await prisma.damageReport.update({
      where: { id: Number(id) },
      data: {
        status: 'rejected',
        approverId: req.user?.id,
        approvedAt: new Date(),
        remark,
      },
    });

    await logger.logOperation({
      userId: req.user?.id,
      action: 'reject',
      module: 'damage_report',
      targetId: Number(id),
      targetType: 'damage_report',
      detail: `驳回报损单: ${report.product.name}, 数量: ${report.quantity}`,
      req,
    });

    success(res, updated, '已驳回');
  } catch (err) {
    logger.error('驳回报损失败', { error: err.message, id: req.params.id });
    error(res, '驳回报损失败', 500);
  }
}

async function deleteDamageReport(req, res) {
  try {
    const { id } = req.params;

    const report = await prisma.damageReport.findUnique({
      where: { id: Number(id) },
      include: { product: true },
    });

    if (!report) {
      return error(res, '报损单不存在', 404);
    }

    if (report.status === 'approved') {
      return error(res, '已审批通过的报损单不能删除', 400);
    }

    await prisma.damageReport.delete({
      where: { id: Number(id) },
    });

    await logger.logOperation({
      userId: req.user?.id,
      action: 'delete',
      module: 'damage_report',
      targetId: Number(id),
      targetType: 'damage_report',
      detail: `删除报损单: ${report.product.name}, 数量: ${report.quantity}`,
      req,
    });

    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除报损失败', { error: err.message, id: req.params.id });
    error(res, '删除报损失败', 500);
  }
}

module.exports = {
  getDamageReports,
  getDamageReportById,
  createDamageReport,
  updateDamageReport,
  approveDamageReport,
  rejectDamageReport,
  deleteDamageReport,
};
