import prisma from '../utils/prisma.js';
import { success, fail, notFound, paginate } from '../utils/response.js';

function generateBatchOpNo() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BOP${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${rand}`;
}

function generateExceptionNo() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EX${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${rand}`;
}

export async function getBatchOps(req, res) {
  try {
    const { page = 1, pageSize = 20, status, opType, keyword, startDate, endDate } = req.query;

    const where = {};
    if (status) where.status = status;
    if (opType) where.opType = opType;
    if (keyword) {
      where.OR = [
        { batchOpNo: { contains: keyword } },
        { title: { contains: keyword } },
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, list] = await Promise.all([
      prisma.batchOperation.count({ where }),
      prisma.batchOperation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, realName: true, username: true } },
        },
      }),
    ]);

    return success(res, paginate(list, page, pageSize, total), '获取批量操作列表成功');
  } catch (err) {
    console.error('getBatchOps error:', err);
    return fail(res, '获取批量操作列表失败');
  }
}

export async function previewBatchOp(req, res) {
  try {
    let { opType, itemIds, filters, params, batchOpId } = req.body;

    if (batchOpId) {
      const batchOp = await prisma.batchOperation.findUnique({
        where: { id: Number(batchOpId) },
      });
      if (!batchOp) return notFound(res, '批量操作记录不存在');
      const input = batchOp.inputData || {};
      opType = batchOp.opType;
      itemIds = input.itemIds;
      filters = input.filters;
      params = input.params;
    }

    if (!opType) return fail(res, '操作类型不能为空');

    let items = [];
    let targetModel = null;

    switch (opType) {
      case 'BATCH_UPDATE_BATCH_STATUS': {
        targetModel = 'batch';
        const where = {};
        if (itemIds && itemIds.length) where.id = { in: itemIds.map(Number) };
        if (filters) {
          if (filters.status) where.status = filters.status;
          if (filters.supplierId) where.supplierId = Number(filters.supplierId);
          if (filters.expiryFrom) where.expiryDate = { gte: new Date(filters.expiryFrom) };
          if (filters.expiryTo) where.expiryDate = { ...(where.expiryDate || {}), lte: new Date(filters.expiryTo) };
        }
        items = await prisma.batch.findMany({
          where,
          include: {
            product: { select: { id: true, sku: true, name: true } },
            supplier: { select: { id: true, code: true, name: true } },
          },
        });
        break;
      }
      case 'BATCH_UPDATE_INBOUND_STATUS': {
        targetModel = 'inboundOrder';
        const where = {};
        if (itemIds && itemIds.length) where.id = { in: itemIds.map(Number) };
        if (filters) {
          if (filters.status) where.status = filters.status;
          if (filters.supplierId) where.supplierId = Number(filters.supplierId);
        }
        items = await prisma.inboundOrder.findMany({
          where,
          include: {
            supplier: { select: { id: true, code: true, name: true } },
          },
        });
        break;
      }
      case 'BATCH_CREATE_EXCEPTION': {
        targetModel = 'batch';
        const where = {};
        if (itemIds && itemIds.length) where.id = { in: itemIds.map(Number) };
        if (filters) {
          if (filters.nearExpiryDays) {
            const d = new Date();
            d.setDate(d.getDate() + Number(filters.nearExpiryDays));
            where.expiryDate = { lte: d };
          }
          if (filters.onlyLowQty) where.remainingQty = { lt: 1 };
        }
        items = await prisma.batch.findMany({
          where,
          include: {
            product: { select: { id: true, sku: true, name: true } },
            supplier: { select: { id: true, code: true, name: true } },
          },
        });
        break;
      }
      case 'BATCH_DELETE_BATCH': {
        targetModel = 'batch';
        const where = {};
        if (itemIds && itemIds.length) where.id = { in: itemIds.map(Number) };
        if (filters && filters.status) where.status = filters.status;
        items = await prisma.batch.findMany({
          where,
          include: {
            product: { select: { id: true, sku: true, name: true } },
            supplier: { select: { id: true, code: true, name: true } },
          },
        });
        break;
      }
      default:
        return fail(res, `不支持的操作类型: ${opType}`);
    }

    const summary = {
      opType,
      targetModel,
      totalCount: items.length,
      params: params || {},
    };

    return success(res, { summary, items }, '预览成功');
  } catch (err) {
    console.error('previewBatchOp error:', err);
    return fail(res, '预览失败: ' + err.message);
  }
}

export async function createBatchOp(req, res) {
  try {
    const { opType, itemIds, filters, params, title, remark } = req.body;
    const userId = req.user.id;

    if (!opType) return fail(res, '操作类型不能为空');

    const batchOp = await prisma.batchOperation.create({
      data: {
        batchOpNo: generateBatchOpNo(),
        opType,
        title: title || `批量操作: ${opType}`,
        status: 'PENDING_CONFIRM',
        createdById: userId,
        inputData: { itemIds: itemIds || [], filters: filters || {}, params: params || {} },
        remark,
      },
    });

    return success(res, batchOp, '批量操作创建成功，请确认后执行');
  } catch (err) {
    console.error('createBatchOp error:', err);
    return fail(res, '创建批量操作失败: ' + err.message);
  }
}

export async function confirmBatchOp(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const batchOp = await prisma.batchOperation.findUnique({
      where: { id: Number(id) },
    });
    if (!batchOp) return notFound(res, '批量操作不存在');

    if (batchOp.status !== 'PENDING_CONFIRM') {
      return fail(res, `当前状态(${batchOp.status})不允许执行，请确保是待确认状态`);
    }

    const inputData = batchOp.inputData || {};
    const { opType } = batchOp;
    const itemIds = inputData.itemIds || [];
    const filters = inputData.filters || {};
    const params = inputData.params || {};

    const failedItems = [];
    let successCount = 0;
    let totalCount = 0;

    const txResults = await prisma.$transaction(async (tx) => {
      let items = [];

      switch (opType) {
        case 'BATCH_UPDATE_BATCH_STATUS': {
          const where = {};
          if (itemIds && itemIds.length) where.id = { in: itemIds.map(Number) };
          if (filters) {
            if (filters.status) where.status = filters.status;
            if (filters.supplierId) where.supplierId = Number(filters.supplierId);
          }
          items = await tx.batch.findMany({ where });
          totalCount = items.length;

          for (const item of items) {
            try {
              await tx.batch.update({
                where: { id: item.id },
                data: { status: params?.newStatus || 'NORMAL' },
              });
              successCount++;
            } catch (e) {
              failedItems.push({
                id: item.id,
                batchNo: item.batchNo,
                productId: item.productId,
                error: e.message,
              });
            }
          }
          break;
        }

        case 'BATCH_UPDATE_INBOUND_STATUS': {
          const where = {};
          if (itemIds && itemIds.length) where.id = { in: itemIds.map(Number) };
          if (filters) {
            if (filters.status) where.status = filters.status;
            if (filters.supplierId) where.supplierId = Number(filters.supplierId);
          }
          items = await tx.inboundOrder.findMany({ where });
          totalCount = items.length;

          for (const item of items) {
            try {
              await tx.inboundOrder.update({
                where: { id: item.id },
                data: { status: params?.newStatus || 'COMPLETED' },
              });
              successCount++;
            } catch (e) {
              failedItems.push({
                id: item.id,
                orderNo: item.orderNo,
                supplierId: item.supplierId,
                error: e.message,
              });
            }
          }
          break;
        }

        case 'BATCH_CREATE_EXCEPTION': {
          const where = {};
          if (itemIds && itemIds.length) where.id = { in: itemIds.map(Number) };
          if (filters?.nearExpiryDays) {
            const d = new Date();
            d.setDate(d.getDate() + Number(filters.nearExpiryDays));
            where.expiryDate = { lte: d };
          }
          items = await tx.batch.findMany({
            where,
            include: { product: true, supplier: true },
          });
          totalCount = items.length;

          for (const item of items) {
            try {
              const daysLeft = Math.ceil((item.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
              let excType = 'NEAR_EXPIRY';
              let excTitle = '';
              let excDesc = '';

              if (daysLeft <= 0) {
                excType = 'EXPIRED';
                excTitle = `批次过期: ${item.batchNo}`;
                excDesc = `产品[${item.product?.name || item.productId}]批次${item.batchNo}已过期，过期日期: ${item.expiryDate.toISOString().slice(0, 10)}，剩余数量: ${item.remainingQty}`;
              } else {
                excTitle = `效期临近: ${item.batchNo}`;
                excDesc = `产品[${item.product?.name || item.productId}]批次${item.batchNo}将在${daysLeft}天后过期，过期日期: ${item.expiryDate.toISOString().slice(0, 10)}，剩余数量: ${item.remainingQty}`;
              }

              await tx.exceptionRecord.create({
                data: {
                  exceptionNo: generateExceptionNo(),
                  type: excType,
                  title: excTitle,
                  description: excDesc,
                  status: 'OPEN',
                  priority: daysLeft <= 0 ? 3 : 2,
                  supplierId: item.supplierId,
                  batchId: item.id,
                  productId: item.productId,
                  createdById: userId,
                  affectedQty: item.remainingQty,
                },
              });
              successCount++;
            } catch (e) {
              failedItems.push({
                id: item.id,
                batchNo: item.batchNo,
                productId: item.productId,
                supplierId: item.supplierId,
                error: e.message,
              });
            }
          }
          break;
        }

        case 'BATCH_DELETE_BATCH': {
          const where = {};
          if (itemIds && itemIds.length) where.id = { in: itemIds.map(Number) };
          if (filters?.status) where.status = filters.status;
          items = await tx.batch.findMany({ where });
          totalCount = items.length;

          for (const item of items) {
            try {
              await tx.batch.delete({ where: { id: item.id } });
              successCount++;
            } catch (e) {
              failedItems.push({
                id: item.id,
                batchNo: item.batchNo,
                productId: item.productId,
                error: e.message,
              });
            }
          }
          break;
        }

        default:
          throw new Error(`不支持的操作类型: ${opType}`);
      }

      const finalStatus = failedItems.length === 0
        ? 'COMPLETED'
        : (successCount > 0 ? 'PARTIAL_SUCCESS' : 'FAILED');

      if (failedItems.length > 0) {
        const excRecords = failedItems.map((fi) => ({
          exceptionNo: generateExceptionNo(),
          type: 'OTHER',
          title: `批量操作失败: ${opType} - 第${fi.id}项`,
          description: `批量操作#${batchOp.id}执行失败，项ID: ${fi.id}，错误: ${fi.error}`,
          status: 'OPEN',
          priority: 3,
          createdById: userId,
          batchId: fi.id && opType.includes('BATCH') ? fi.id : null,
        }));
        await tx.exceptionRecord.createMany({ data: excRecords });
      }

      await tx.batchOperation.update({
        where: { id: batchOp.id },
        data: {
          status: finalStatus,
          totalCount,
          successCount,
          failCount: failedItems.length,
          failedItems,
          resultData: { totalCount, successCount, failCount: failedItems.length },
          confirmedAt: new Date(),
          completedAt: new Date(),
        },
      });

      return { totalCount, successCount, failCount: failedItems.length, failedItems, finalStatus };
    });

    const result = await prisma.batchOperation.findUnique({
      where: { id: batchOp.id },
    });

    return success(res, result, '批量操作执行完成');
  } catch (err) {
    console.error('confirmBatchOp error:', err);
    return fail(res, '批量操作执行失败: ' + err.message);
  }
}

export async function getBatchOpDetail(req, res) {
  try {
    const { id } = req.params;
    const detail = await prisma.batchOperation.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: { select: { id: true, realName: true, username: true } },
      },
    });
    if (!detail) return notFound(res, '批量操作记录不存在');
    return success(res, detail, '获取详情成功');
  } catch (err) {
    console.error('getBatchOpDetail error:', err);
    return fail(res, '获取详情失败');
  }
}
