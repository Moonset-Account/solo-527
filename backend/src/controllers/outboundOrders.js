import prisma from '../utils/prisma.js';
import { success, fail, paginate, notFound } from '../utils/response.js';

const OUTBOUND_INCLUDE = {
  createdBy: { select: { id: true, username: true, realName: true } },
  handledBy: { select: { id: true, username: true, realName: true } },
  items: {
    include: {
      product: { select: { id: true, sku: true, barcode: true, name: true, unit: true } },
      batch: { select: { id: true, batchNo: true, expiryDate: true, remainingQty: true } },
    },
  },
};

function generateOrderNo() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `OB${y}${m}${d}${rand}`;
}

export async function getOutboundOrders(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      outboundType,
      keyword,
      startDate,
      endDate,
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (outboundType) where.outboundType = outboundType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { referenceNo: { contains: keyword } },
        { destination: { contains: keyword } },
        { contactPerson: { contains: keyword } },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const [list, total] = await Promise.all([
      prisma.outboundOrder.findMany({
        where,
        include: OUTBOUND_INCLUDE,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.outboundOrder.count({ where }),
    ]);

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getOutboundOrders error:', err);
    return fail(res, '获取出库单列表失败');
  }
}

export async function getOutboundOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: OUTBOUND_INCLUDE,
    });

    if (!order) return notFound(res, '出库单不存在');

    return success(res, order);
  } catch (err) {
    console.error('getOutboundOrderById error:', err);
    return fail(res, '获取出库单详情失败');
  }
}

export async function createOutboundOrder(req, res) {
  try {
    const {
      outboundType,
      referenceNo,
      destination,
      contactPerson,
      contactPhone,
      items,
      remark,
    } = req.body;

    if (!outboundType) return fail(res, '请选择出库类型');
    if (!items || !items.length) return fail(res, '请添加出库商品');

    const orderNo = generateOrderNo();
    let totalQty = 0;

    const orderItems = items.map((item) => {
      const qty = Number(item.requestedQty || 0);
      totalQty += qty;
      return {
        productId: Number(item.productId),
        batchId: item.batchId ? Number(item.batchId) : null,
        requestedQty: qty,
        pickedQty: 0,
        shippedQty: 0,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        pickingLocation: item.pickingLocation,
        remark: item.remark,
      };
    });

    const order = await prisma.outboundOrder.create({
      data: {
        orderNo,
        outboundType,
        referenceNo,
        status: 'PENDING',
        createdById: req.user.id,
        destination,
        contactPerson,
        contactPhone,
        totalQty,
        pickedQty: 0,
        remark,
        items: { create: orderItems },
      },
      include: OUTBOUND_INCLUDE,
    });

    return success(res, order, '创建出库单成功', 201);
  } catch (err) {
    console.error('createOutboundOrder error:', err);
    return fail(res, '创建出库单失败: ' + err.message);
  }
}

export async function updateOutboundOrder(req, res) {
  try {
    const { id } = req.params;
    const {
      outboundType,
      referenceNo,
      destination,
      contactPerson,
      contactPhone,
      items,
      remark,
    } = req.body;

    const existing = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });
    if (!existing) return notFound(res, '出库单不存在');

    if (!['PENDING'].includes(existing.status)) {
      return fail(res, '当前状态不允许修改出库单');
    }

    const data = {};
    if (outboundType) data.outboundType = outboundType;
    if (referenceNo !== undefined) data.referenceNo = referenceNo;
    if (destination !== undefined) data.destination = destination;
    if (contactPerson !== undefined) data.contactPerson = contactPerson;
    if (contactPhone !== undefined) data.contactPhone = contactPhone;
    if (remark !== undefined) data.remark = remark;

    if (items && items.length) {
      await prisma.$transaction(async (tx) => {
        await tx.outboundItem.deleteMany({ where: { outboundOrderId: Number(id) } });

        let totalQty = 0;
        const orderItems = items.map((item) => {
          const qty = Number(item.requestedQty || 0);
          totalQty += qty;
          return {
            productId: Number(item.productId),
            batchId: item.batchId ? Number(item.batchId) : null,
            requestedQty: qty,
            pickedQty: 0,
            shippedQty: 0,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
            pickingLocation: item.pickingLocation,
            remark: item.remark,
          };
        });

        data.totalQty = totalQty;
        data.items = { create: orderItems };
      });
    }

    const order = await prisma.outboundOrder.update({
      where: { id: Number(id) },
      data,
      include: OUTBOUND_INCLUDE,
    });

    return success(res, order, '更新出库单成功');
  } catch (err) {
    console.error('updateOutboundOrder error:', err);
    return fail(res, '更新出库单失败: ' + err.message);
  }
}

export async function deleteOutboundOrder(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.outboundOrder.findUnique({ where: { id: Number(id) } });
    if (!existing) return notFound(res, '出库单不存在');

    if (!['PENDING'].includes(existing.status)) {
      return fail(res, '当前状态不允许删除出库单');
    }

    await prisma.outboundOrder.delete({ where: { id: Number(id) } });
    return success(res, null, '删除出库单成功');
  } catch (err) {
    console.error('deleteOutboundOrder error:', err);
    return fail(res, '删除出库单失败: ' + err.message);
  }
}

export async function updateOutboundStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    if (!status) return fail(res, '请指定状态');

    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });
    if (!order) return notFound(res, '出库单不存在');

    const validTransitions = {
      PENDING: ['PICKING', 'CANCELLED'],
      PICKING: ['SHIPPED'],
      SHIPPED: ['COMPLETED'],
    };

    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      return fail(res, `不允许从 ${order.status} 变更为 ${status}`);
    }

    const updateData = {
      status,
      handledById: req.user.id,
    };

    if (status === 'PICKING') {
      updateData.pickedAt = new Date();
    }
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    }
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
    if (remark) updateData.remark = remark;

    const updated = await prisma.outboundOrder.update({
      where: { id: Number(id) },
      data: updateData,
      include: OUTBOUND_INCLUDE,
    });

    return success(res, updated, '状态更新成功');
  } catch (err) {
    console.error('updateOutboundStatus error:', err);
    return fail(res, '状态更新失败: ' + err.message);
  }
}

export async function scanOutboundItem(req, res) {
  try {
    const { id } = req.params;
    const { barcode, productId, batchId, qty } = req.body;

    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: { include: { product: true, batch: true } } },
    });
    if (!order) return notFound(res, '出库单不存在');

    if (!['PENDING', 'PICKING'].includes(order.status)) {
      return fail(res, '当前状态不允许扫描商品');
    }

    let product;
    if (barcode) {
      product = await prisma.product.findFirst({ where: { barcode } });
      if (!product) return fail(res, '未找到对应条码的商品');
    } else if (productId) {
      product = await prisma.product.findUnique({ where: { id: Number(productId) } });
      if (!product) return fail(res, '商品不存在');
    } else {
      return fail(res, '请提供条码或商品ID');
    }

    const scanQty = Number(qty || 1);
    if (scanQty <= 0) return fail(res, '数量必须大于0');

    let existingItem = order.items.find(
      (it) => it.productId === product.id && (it.requestedQty - it.pickedQty) > 0
    );

    if (!existingItem) {
      existingItem = order.items.find((it) => it.productId === product.id);
    }

    if (!existingItem) {
      return fail(res, '该商品不在此出库单中');
    }

    const remainingToPick = Number(existingItem.requestedQty) - Number(existingItem.pickedQty);
    if (scanQty > remainingToPick + 0.001) {
      return fail(res, `扫描数量(${scanQty})超出待拣数量(${remainingToPick})`);
    }

    const result = await prisma.$transaction(async (tx) => {
      let targetBatch = null;

      if (batchId) {
        targetBatch = await tx.batch.findUnique({ where: { id: Number(batchId) } });
        if (!targetBatch) throw new Error('批次不存在');
        if (targetBatch.productId !== product.id) throw new Error('批次与商品不匹配');
      } else if (existingItem.batchId) {
        targetBatch = await tx.batch.findUnique({ where: { id: existingItem.batchId } });
      } else {
        targetBatch = await tx.batch.findFirst({
          where: {
            productId: product.id,
            status: 'NORMAL',
            qcStatus: 'PASSED',
            remainingQty: { gt: 0 },
          },
          orderBy: { expiryDate: 'asc' },
        });
      }

      if (!targetBatch) throw new Error('没有可用批次库存');

      if (Number(targetBatch.remainingQty) < scanQty) {
        throw new Error(`批次库存不足，剩余: ${targetBatch.remainingQty}`);
      }

      const updatedItem = await tx.outboundItem.update({
        where: { id: existingItem.id },
        data: {
          pickedQty: { increment: scanQty },
          shippedQty: { increment: scanQty },
          batchId: targetBatch.id,
        },
        include: {
          product: { select: { id: true, sku: true, barcode: true, name: true, unit: true } },
          batch: { select: { id: true, batchNo: true, expiryDate: true, remainingQty: true } },
        },
      });

      await tx.batch.update({
        where: { id: targetBatch.id },
        data: {
          remainingQty: { decrement: scanQty },
          lockedQty: { increment: scanQty },
        },
      });

      const updatedOrder = await tx.outboundOrder.update({
        where: { id: order.id },
        data: {
          pickedQty: { increment: scanQty },
          status: order.status === 'PENDING' ? 'PICKING' : order.status,
          pickedAt: order.status === 'PENDING' ? new Date() : order.pickedAt,
        },
        include: OUTBOUND_INCLUDE,
      });

      return { item: updatedItem, batch: targetBatch, order: updatedOrder };
    });

    return success(res, result, '扫描成功');
  } catch (err) {
    console.error('scanOutboundItem error:', err);

    if (
      err.message.includes('不匹配') ||
      err.message.includes('不存在') ||
      err.message.includes('不足') ||
      err.message.includes('超出')
    ) {
      return fail(res, err.message);
    }

    try {
      await prisma.exceptionRecord.create({
        data: {
          exceptionNo: `EXC${Date.now()}`,
          type: 'INVENTORY_MISMATCH',
          title: `出库单扫描异常 - 出库单#${id}`,
          description: err.message,
          status: 'OPEN',
          priority: 2,
          createdById: req.user.id,
        },
      });
    } catch (e) {
      console.error('记录异常失败:', e);
    }

    return fail(res, '扫描失败: ' + err.message);
  }
}

export async function completeOutboundOrder(req, res) {
  try {
    const { id } = req.params;

    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: { include: { batch: true, product: true } } },
    });
    if (!order) return notFound(res, '出库单不存在');

    if (!['SHIPPED'].includes(order.status)) {
      return fail(res, '当前状态不允许完成出库，请先将状态变更为SHIPPED');
    }

    for (const item of order.items) {
      const picked = Number(item.pickedQty || 0);
      const requested = Number(item.requestedQty || 0);
      if (Math.abs(picked - requested) > 0.001) {
        return fail(res, `商品 ${item.product?.name || item.productId} 拣货数量(${picked})与需求数量(${requested})不一致`);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const shippedQty = Number(item.shippedQty || item.pickedQty || 0);
        if (shippedQty <= 0 || !item.batchId) continue;

        await tx.batch.update({
          where: { id: item.batchId },
          data: {
            lockedQty: { decrement: shippedQty },
          },
        });

        const batch = await tx.batch.findUnique({
          where: { id: item.batchId },
          select: { inventoryId: true, productId: true },
        });

        if (batch?.inventoryId) {
          await tx.inventory.update({
            where: { id: batch.inventoryId },
            data: {
              totalQty: { decrement: shippedQty },
              availableQty: { decrement: shippedQty },
              reservedQty: { increment: 0 },
            },
          });
        }
      }

      const updated = await tx.outboundOrder.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          handledById: req.user.id,
        },
        include: OUTBOUND_INCLUDE,
      });

      return updated;
    });

    return success(res, result, '出库完成');
  } catch (err) {
    console.error('completeOutboundOrder error:', err);
    return fail(res, '出库完成失败: ' + err.message);
  }
}
