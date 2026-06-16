import prisma from '../utils/prisma.js';
import { success, fail, paginate, notFound } from '../utils/response.js';

const EXCEPTION_INCLUDE = {
  supplier: { select: { id: true, code: true, name: true } },
  purchaseOrder: { select: { id: true, orderNo: true } },
  inboundOrder: { select: { id: true, orderNo: true } },
  batch: { select: { id: true, batchNo: true, expiryDate: true } },
  product: { select: { id: true, sku: true, name: true, barcode: true } },
  createdBy: { select: { id: true, username: true, realName: true } },
  handler: { select: { id: true, username: true, realName: true, role: true } },
  replies: {
    include: {
      fromUser: { select: { id: true, username: true, realName: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
};

function generateExceptionNo() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EXC${y}${m}${d}${rand}`;
}

export async function getExceptions(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      type,
      status,
      priority,
      supplierId,
      handlerId,
      keyword,
      startDate,
      endDate,
    } = req.query;

    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = Number(priority);
    if (supplierId) where.supplierId = Number(supplierId);
    if (handlerId) where.handlerId = Number(handlerId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (keyword) {
      where.OR = [
        { exceptionNo: { contains: keyword } },
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (req.user.supplierId) {
      where.supplierId = req.user.supplierId;
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const [list, total] = await Promise.all([
      prisma.exceptionRecord.findMany({
        where,
        include: EXCEPTION_INCLUDE,
        skip,
        take: Number(pageSize),
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.exceptionRecord.count({ where }),
    ]);

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getExceptions error:', err);
    return fail(res, '获取异常列表失败');
  }
}

export async function getExceptionById(req, res) {
  try {
    const { id } = req.params;
    const exc = await prisma.exceptionRecord.findUnique({
      where: { id: Number(id) },
      include: EXCEPTION_INCLUDE,
    });

    if (!exc) return notFound(res, '异常记录不存在');

    if (req.user.supplierId && exc.supplierId !== req.user.supplierId) {
      return fail(res, '无权限查看此异常', 403);
    }

    return success(res, exc);
  } catch (err) {
    console.error('getExceptionById error:', err);
    return fail(res, '获取异常详情失败');
  }
}

export async function createException(req, res) {
  try {
    const {
      type,
      title,
      description,
      priority = 2,
      supplierId,
      purchaseOrderId,
      inboundOrderId,
      batchId,
      productId,
      lossAmount,
      affectedQty,
      slaDueAt,
    } = req.body;

    if (!type) return fail(res, '请选择异常类型');
    if (!title) return fail(res, '请填写异常标题');
    if (!description) return fail(res, '请填写异常描述');

    const exceptionNo = generateExceptionNo();

    const exc = await prisma.exceptionRecord.create({
      data: {
        exceptionNo,
        type,
        title,
        description,
        status: 'OPEN',
        priority: Number(priority),
        supplierId: supplierId ? Number(supplierId) : null,
        purchaseOrderId: purchaseOrderId ? Number(purchaseOrderId) : null,
        inboundOrderId: inboundOrderId ? Number(inboundOrderId) : null,
        batchId: batchId ? Number(batchId) : null,
        productId: productId ? Number(productId) : null,
        createdById: req.user.id,
        lossAmount: lossAmount ? Number(lossAmount) : null,
        affectedQty: affectedQty ? Number(affectedQty) : null,
        slaDueAt: slaDueAt ? new Date(slaDueAt) : null,
      },
      include: EXCEPTION_INCLUDE,
    });

    return success(res, exc, '创建异常记录成功', 201);
  } catch (err) {
    console.error('createException error:', err);
    return fail(res, '创建异常记录失败: ' + err.message);
  }
}

export async function updateException(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      supplierId,
      purchaseOrderId,
      inboundOrderId,
      batchId,
      productId,
      lossAmount,
      affectedQty,
      slaDueAt,
      resolution,
    } = req.body;

    const existing = await prisma.exceptionRecord.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) return notFound(res, '异常记录不存在');

    if (['RESOLVED', 'CLOSED'].includes(existing.status)) {
      return fail(res, '已解决/关闭的异常不允许修改');
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = Number(priority);
    if (supplierId !== undefined) data.supplierId = supplierId ? Number(supplierId) : null;
    if (purchaseOrderId !== undefined) data.purchaseOrderId = purchaseOrderId ? Number(purchaseOrderId) : null;
    if (inboundOrderId !== undefined) data.inboundOrderId = inboundOrderId ? Number(inboundOrderId) : null;
    if (batchId !== undefined) data.batchId = batchId ? Number(batchId) : null;
    if (productId !== undefined) data.productId = productId ? Number(productId) : null;
    if (lossAmount !== undefined) data.lossAmount = lossAmount ? Number(lossAmount) : null;
    if (affectedQty !== undefined) data.affectedQty = affectedQty ? Number(affectedQty) : null;
    if (slaDueAt !== undefined) data.slaDueAt = slaDueAt ? new Date(slaDueAt) : null;
    if (resolution !== undefined) data.resolution = resolution;

    const exc = await prisma.exceptionRecord.update({
      where: { id: Number(id) },
      data,
      include: EXCEPTION_INCLUDE,
    });

    return success(res, exc, '更新异常记录成功');
  } catch (err) {
    console.error('updateException error:', err);
    return fail(res, '更新异常记录失败: ' + err.message);
  }
}

export async function deleteException(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.exceptionRecord.findUnique({ where: { id: Number(id) } });
    if (!existing) return notFound(res, '异常记录不存在');

    await prisma.exceptionRecord.delete({ where: { id: Number(id) } });
    return success(res, null, '删除异常记录成功');
  } catch (err) {
    console.error('deleteException error:', err);
    return fail(res, '删除异常记录失败: ' + err.message);
  }
}

export async function updateExceptionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, resolution, remark } = req.body;

    if (!status) return fail(res, '请指定状态');

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING_SUPPLIER', 'RESOLVED', 'CLOSED', 'ESCALATED'];
    if (!validStatuses.includes(status)) {
      return fail(res, '无效的状态值');
    }

    const existing = await prisma.exceptionRecord.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) return notFound(res, '异常记录不存在');

    const data = {
      status,
    };

    if (status === 'RESOLVED' || status === 'CLOSED') {
      data.resolvedAt = new Date();
    }
    if (resolution) data.resolution = resolution;
    if (remark && !data.resolution) data.resolution = remark;

    const exc = await prisma.exceptionRecord.update({
      where: { id: Number(id) },
      data,
      include: EXCEPTION_INCLUDE,
    });

    return success(res, exc, '状态更新成功');
  } catch (err) {
    console.error('updateExceptionStatus error:', err);
    return fail(res, '状态更新失败: ' + err.message);
  }
}

export async function assignException(req, res) {
  try {
    const { id } = req.params;
    const { handlerId } = req.body;

    if (!handlerId) return fail(res, '请指定处理人');

    const existing = await prisma.exceptionRecord.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) return notFound(res, '异常记录不存在');

    const handler = await prisma.user.findUnique({
      where: { id: Number(handlerId) },
      select: { id: true, isActive: true, role: true },
    });
    if (!handler || !handler.isActive) return fail(res, '处理人不存在或已禁用');

    const exc = await prisma.exceptionRecord.update({
      where: { id: Number(id) },
      data: {
        handlerId: Number(handlerId),
        status: existing.status === 'OPEN' ? 'IN_PROGRESS' : existing.status,
      },
      include: EXCEPTION_INCLUDE,
    });

    return success(res, exc, '分配处理人成功');
  } catch (err) {
    console.error('assignException error:', err);
    return fail(res, '分配处理人失败: ' + err.message);
  }
}

export async function getExceptionStatistics(req, res) {
  try {
    const { startDate, endDate, supplierId } = req.query;

    const baseWhere = {};
    if (startDate || endDate) {
      baseWhere.createdAt = {};
      if (startDate) baseWhere.createdAt.gte = new Date(startDate);
      if (endDate) baseWhere.createdAt.lte = new Date(endDate);
    }
    if (supplierId) baseWhere.supplierId = Number(supplierId);
    if (req.user.supplierId) {
      baseWhere.supplierId = req.user.supplierId;
    }

    const [
      totalCount,
      typeGroups,
      statusGroups,
      priorityGroups,
      allExceptions,
      topHandlers,
    ] = await Promise.all([
      prisma.exceptionRecord.count({ where: baseWhere }),
      prisma.exceptionRecord.groupBy({
        by: ['type'],
        where: baseWhere,
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
      }),
      prisma.exceptionRecord.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true },
      }),
      prisma.exceptionRecord.groupBy({
        by: ['priority'],
        where: baseWhere,
        _count: { priority: true },
        orderBy: { priority: 'desc' },
      }),
      prisma.exceptionRecord.findMany({
        where: baseWhere,
        select: {
          id: true,
          type: true,
          status: true,
          priority: true,
          createdAt: true,
          resolvedAt: true,
          handlerId: true,
        },
      }),
      prisma.exceptionRecord.groupBy({
        by: ['handlerId'],
        where: {
          ...baseWhere,
          handlerId: { not: null },
        },
        _count: { handlerId: true },
        orderBy: { _count: { handlerId: 'desc' } },
        take: 10,
      }),
    ]);

    const byType = {};
    for (const g of typeGroups) byType[g.type] = g._count.type;

    const byStatus = {};
    for (const g of statusGroups) byStatus[g.status] = g._count.status;

    const byPriority = {};
    for (const g of priorityGroups) byPriority[g.priority] = g._count.priority;

    const resolutionDist = {
      within1h: 0,
      within4h: 0,
      within1d: 0,
      within3d: 0,
      over3d: 0,
      unresolved: 0,
    };

    for (const e of allExceptions) {
      if (!e.resolvedAt) {
        resolutionDist.unresolved++;
        continue;
      }
      const diffMs = e.resolvedAt.getTime() - e.createdAt.getTime();
      const diffH = diffMs / (1000 * 60 * 60);
      if (diffH <= 1) resolutionDist.within1h++;
      else if (diffH <= 4) resolutionDist.within4h++;
      else if (diffH <= 24) resolutionDist.within1d++;
      else if (diffH <= 72) resolutionDist.within3d++;
      else resolutionDist.over3d++;
    }

    const handlerIds = topHandlers
      .map((g) => g.handlerId)
      .filter((id) => id !== null);
    const handlerUsers = await prisma.user.findMany({
      where: { id: { in: handlerIds } },
      select: { id: true, username: true, realName: true, role: true },
    });
    const handlerMap = {};
    for (const u of handlerUsers) handlerMap[u.id] = u;

    const topHandlersList = topHandlers
      .filter((g) => g.handlerId !== null)
      .map((g) => ({
        handlerId: g.handlerId,
        handler: handlerMap[g.handlerId] || null,
        count: g._count.handlerId,
      }));

    return success(res, {
      totalCount,
      byType,
      byStatus,
      byPriority,
      resolutionDistribution: resolutionDist,
      topHandlers: topHandlersList,
      period: { startDate, endDate },
    });
  } catch (err) {
    console.error('getExceptionStatistics error:', err);
    return fail(res, '获取统计信息失败: ' + err.message);
  }
}
