import prisma from '../utils/prisma.js';
import { success, fail, notFound, paginate } from '../utils/response.js';

export async function getSuppliers(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const keyword = req.query.keyword || '';
    const { status, level, category } = req.query;

    const where = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { contactPerson: { contains: keyword } },
        { phone: { contains: keyword } },
        { email: { contains: keyword } },
      ];
    }
    if (status) where.status = status;
    if (level) where.level = Number(level);
    if (category) where.category = category;

    const total = await prisma.supplier.count({ where });
    const list = await prisma.supplier.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { products: true, purchaseOrders: true },
        },
      },
    });

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getSuppliers error:', err);
    return fail(res, '获取供应商列表失败');
  }
}

export async function getSupplierById(req, res) {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { products: true, purchaseOrders: true, inboundOrders: true },
        },
      },
    });

    if (!supplier) return notFound(res, '供应商不存在');
    return success(res, supplier);
  } catch (err) {
    console.error('getSupplierById error:', err);
    return fail(res, '获取供应商详情失败');
  }
}

export async function createSupplier(req, res) {
  try {
    const {
      code, name, contactPerson, phone, email, address, category,
      level, status, contractStart, contractEnd, remark,
    } = req.body;

    if (!code || !name || !contactPerson || !phone) {
      return fail(res, '请填写必填字段（编号、名称、联系人、电话）');
    }

    const exists = await prisma.supplier.findUnique({ where: { code } });
    if (exists) return fail(res, '供应商编号已存在');

    const data = {
      code, name, contactPerson, phone, email, address, category, remark,
      level: level ?? 3,
      status: status ?? 'ACTIVE',
    };
    if (contractStart) data.contractStart = new Date(contractStart);
    if (contractEnd) data.contractEnd = new Date(contractEnd);

    const supplier = await prisma.supplier.create({ data });
    return success(res, supplier, '创建成功', 201);
  } catch (err) {
    console.error('createSupplier error:', err);
    return fail(res, '创建供应商失败');
  }
}

export async function updateSupplier(req, res) {
  try {
    const { id } = req.params;
    const {
      code, name, contactPerson, phone, email, address, category,
      level, status, contractStart, contractEnd, remark,
    } = req.body;

    const supplier = await prisma.supplier.findUnique({ where: { id: Number(id) } });
    if (!supplier) return notFound(res, '供应商不存在');

    if (code && code !== supplier.code) {
      const exists = await prisma.supplier.findUnique({ where: { code } });
      if (exists) return fail(res, '供应商编号已存在');
    }

    const data = {};
    if (code !== undefined) data.code = code;
    if (name !== undefined) data.name = name;
    if (contactPerson !== undefined) data.contactPerson = contactPerson;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (address !== undefined) data.address = address;
    if (category !== undefined) data.category = category;
    if (level !== undefined) data.level = level;
    if (status !== undefined) data.status = status;
    if (contractStart !== undefined) data.contractStart = contractStart ? new Date(contractStart) : null;
    if (contractEnd !== undefined) data.contractEnd = contractEnd ? new Date(contractEnd) : null;
    if (remark !== undefined) data.remark = remark;

    const updated = await prisma.supplier.update({
      where: { id: Number(id) },
      data,
    });

    return success(res, updated, '更新成功');
  } catch (err) {
    console.error('updateSupplier error:', err);
    return fail(res, '更新供应商失败');
  }
}

export async function deleteSupplier(req, res) {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({ where: { id: Number(id) } });
    if (!supplier) return notFound(res, '供应商不存在');

    const productCount = await prisma.product.count({ where: { preferredSupplierId: Number(id) } });
    const orderCount = await prisma.purchaseOrder.count({ where: { supplierId: Number(id) } });
    if (productCount > 0 || orderCount > 0) {
      return fail(res, '该供应商存在关联数据，无法删除');
    }

    await prisma.supplier.delete({ where: { id: Number(id) } });
    return success(res, null, '删除成功');
  } catch (err) {
    console.error('deleteSupplier error:', err);
    return fail(res, '删除供应商失败');
  }
}

export async function getSupplierRatings(req, res) {
  try {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;

    const supplier = await prisma.supplier.findUnique({ where: { id: Number(id) } });
    if (!supplier) return notFound(res, '供应商不存在');

    const where = { supplierId: Number(id) };
    const total = await prisma.supplierRating.count({ where });
    const list = await prisma.supplierRating.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        ratedBy: {
          select: { id: true, username: true, realName: true },
        },
        purchaseOrder: {
          select: { id: true, orderNo: true, status: true },
        },
      },
    });

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getSupplierRatings error:', err);
    return fail(res, '获取供应商评分失败');
  }
}

export async function rateSupplier(req, res) {
  try {
    const { id } = req.params;
    const {
      score, onTimeScore, qualityScore, quantityScore, docScore, comment,
      purchaseOrderId, inboundOrderId,
    } = req.body;

    const supplier = await prisma.supplier.findUnique({ where: { id: Number(id) } });
    if (!supplier) return notFound(res, '供应商不存在');

    if (!score || score < 1 || score > 5) {
      return fail(res, '评分必须在 1-5 之间');
    }

    const data = {
      supplierId: Number(id),
      ratedByUserId: req.user.id,
      score: Number(score),
      onTimeScore: Number(onTimeScore) || 0,
      qualityScore: Number(qualityScore) || 0,
      quantityScore: Number(quantityScore) || 0,
      docScore: Number(docScore) || 0,
      comment,
    };
    if (purchaseOrderId) data.purchaseOrderId = Number(purchaseOrderId);
    if (inboundOrderId) data.inboundOrderId = Number(inboundOrderId);

    const rating = await prisma.supplierRating.create({ data });

    const ratings = await prisma.supplierRating.aggregate({
      _avg: { score: true },
      where: { supplierId: Number(id) },
    });
    const avgScore = ratings._avg.score ? Number(ratings._avg.score) : 0;

    await prisma.supplier.update({
      where: { id: Number(id) },
      data: { rating: Number(avgScore.toFixed(2)) },
    });

    return success(res, rating, '评分成功', 201);
  } catch (err) {
    console.error('rateSupplier error:', err);
    return fail(res, '评分失败');
  }
}

export async function getSupplierProducts(req, res) {
  try {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const keyword = req.query.keyword || '';

    const supplier = await prisma.supplier.findUnique({ where: { id: Number(id) } });
    if (!supplier) return notFound(res, '供应商不存在');

    const where = {
      suppliers: {
        some: { supplierId: Number(id) },
      },
    };
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { sku: { contains: keyword } },
        { barcode: { contains: keyword } },
      ];
    }

    const total = await prisma.product.count({ where });
    const list = await prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        suppliers: {
          where: { supplierId: Number(id) },
          select: {
            price: true, leadTimeDays: true, isPreferred: true, priority: true,
          },
        },
      },
    });

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getSupplierProducts error:', err);
    return fail(res, '获取供应商产品列表失败');
  }
}

export async function getSupplierStatistics(req, res) {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({ where: { id: Number(id) } });
    if (!supplier) return notFound(res, '供应商不存在');

    const supplierId = Number(id);

    const totalOrders = await prisma.purchaseOrder.count({ where: { supplierId } });
    const completedOrders = await prisma.purchaseOrder.count({
      where: { supplierId, status: 'COMPLETED' },
    });

    const inboundOrders = await prisma.inboundOrder.findMany({
      where: { supplierId, status: { in: ['QC_PASSED', 'COMPLETED'] } },
      select: { id: true, arrivedAt: true, totalQty: true, acceptedQty: true, rejectedQty: true },
    });

    const qcPassedInbounds = inboundOrders.filter(
      (io) => Number(io.totalQty) > 0 && io.acceptedQty === io.totalQty
    ).length;
    const totalQcInbounds = inboundOrders.length;
    const qcPassRate = totalQcInbounds > 0
      ? Number(((qcPassedInbounds / totalQcInbounds) * 100).toFixed(2))
      : 0;

    const onTimeDeliveries = await prisma.purchaseOrder.count({
      where: {
        supplierId,
        status: 'COMPLETED',
        expectedDate: { not: null },
      },
    });

    let onTimeCount = 0;
    if (onTimeDeliveries > 0) {
      const posWithInbound = await prisma.purchaseOrder.findMany({
        where: {
          supplierId,
          status: 'COMPLETED',
          expectedDate: { not: null },
        },
        select: {
          id: true,
          expectedDate: true,
          inboundOrders: { select: { arrivedAt: true } },
        },
      });
      for (const po of posWithInbound) {
        if (po.inboundOrders.length > 0 && po.expectedDate) {
          const arrived = po.inboundOrders[0].arrivedAt;
          if (arrived && arrived <= po.expectedDate) onTimeCount++;
        }
      }
    }
    const onTimeRate = onTimeDeliveries > 0
      ? Number(((onTimeCount / onTimeDeliveries) * 100).toFixed(2))
      : 0;

    const ratings = await prisma.supplierRating.aggregate({
      _avg: { score: true, onTimeScore: true, qualityScore: true, quantityScore: true, docScore: true },
      _count: true,
      where: { supplierId },
    });

    const exceptions = await prisma.exceptionRecord.count({
      where: { supplierId, status: { not: 'RESOLVED' } },
    });

    const totalExceptions = await prisma.exceptionRecord.count({ where: { supplierId } });

    const totalInboundQty = inboundOrders.reduce((sum, io) => sum + Number(io.totalQty || 0), 0);
    const totalAcceptedQty = inboundOrders.reduce((sum, io) => sum + Number(io.acceptedQty || 0), 0);
    const totalRejectedQty = inboundOrders.reduce((sum, io) => sum + Number(io.rejectedQty || 0), 0);

    const productCount = await prisma.product.count({
      where: { suppliers: { some: { supplierId } } },
    });

    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        totalOrders,
        onTimeRate,
        qcPassRate,
      },
    });

    const statistics = {
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: totalOrders - completedOrders,
      },
      rates: {
        onTimeRate,
        qcPassRate,
      },
      quality: {
        totalInboundQty: Number(totalInboundQty.toFixed(2)),
        totalAcceptedQty: Number(totalAcceptedQty.toFixed(2)),
        totalRejectedQty: Number(totalRejectedQty.toFixed(2)),
      },
      ratings: {
        average: ratings._avg.score ? Number(ratings._avg.score.toFixed(2)) : 0,
        onTimeAvg: ratings._avg.onTimeScore ? Number(ratings._avg.onTimeScore.toFixed(2)) : 0,
        qualityAvg: ratings._avg.qualityScore ? Number(ratings._avg.qualityScore.toFixed(2)) : 0,
        quantityAvg: ratings._avg.quantityScore ? Number(ratings._avg.quantityScore.toFixed(2)) : 0,
        docAvg: ratings._avg.docScore ? Number(ratings._avg.docScore.toFixed(2)) : 0,
        totalCount: ratings._count,
      },
      exceptions: {
        open: exceptions,
        total: totalExceptions,
      },
      products: {
        count: productCount,
      },
      updatedAt: new Date().toISOString(),
    };

    return success(res, statistics);
  } catch (err) {
    console.error('getSupplierStatistics error:', err);
    return fail(res, '获取供应商统计失败');
  }
}
