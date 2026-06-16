import prisma from '../utils/prisma.js';
import { success, fail, paginate, notFound } from '../utils/response.js';

const INBOUND_INCLUDE = {
  supplier: { select: { id: true, code: true, name: true } },
  purchaseOrder: { select: { id: true, orderNo: true, status: true } },
  createdBy: { select: { id: true, username: true, realName: true } },
  handledBy: { select: { id: true, username: true, realName: true } },
  qcBy: { select: { id: true, username: true, realName: true } },
  items: {
    include: {
      product: { select: { id: true, sku: true, barcode: true, name: true, unit: true } },
      batch: { select: { id: true, batchNo: true, expiryDate: true } },
    },
  },
  batches: {
    include: {
      product: { select: { id: true, sku: true, name: true } },
    },
  },
};

function generateOrderNo() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `IB${y}${m}${d}${rand}`;
}

function generateBatchNo(productId) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `B${productId}${y}${m}${d}${rand}`;
}

export async function getInboundOrders(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      supplierId,
      purchaseOrderId,
      keyword,
      startDate,
      endDate,
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (supplierId) where.supplierId = Number(supplierId);
    if (purchaseOrderId) where.purchaseOrderId = Number(purchaseOrderId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { driverName: { contains: keyword } },
        { vehicleNo: { contains: keyword } },
      ];
    }

    if (req.user.supplierId) {
      where.supplierId = req.user.supplierId;
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const [list, total] = await Promise.all([
      prisma.inboundOrder.findMany({
        where,
        include: INBOUND_INCLUDE,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inboundOrder.count({ where }),
    ]);

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getInboundOrders error:', err);
    return fail(res, '获取入库单列表失败');
  }
}

export async function getInboundOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: INBOUND_INCLUDE,
    });

    if (!order) return notFound(res, '入库单不存在');

    if (req.user.supplierId && order.supplierId !== req.user.supplierId) {
      return fail(res, '无权限查看此入库单', 403);
    }

    return success(res, order);
  } catch (err) {
    console.error('getInboundOrderById error:', err);
    return fail(res, '获取入库单详情失败');
  }
}

export async function createInboundOrder(req, res) {
  try {
    const {
      purchaseOrderId,
      supplierId,
      items,
      arrivedAt,
      driverName,
      driverPhone,
      vehicleNo,
      temperature,
      remark,
    } = req.body;

    if (!supplierId) return fail(res, '请选择供应商');
    if (!items || !items.length) return fail(res, '请添加入库商品');

    let purchaseOrder = null;
    if (purchaseOrderId) {
      purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: Number(purchaseOrderId) },
        include: { items: true },
      });
      if (!purchaseOrder) return fail(res, '关联采购单不存在');
      if (purchaseOrder.status === 'CANCELLED') return fail(res, '采购单已取消');
    }

    const orderNo = generateOrderNo();
    let totalQty = 0;

    const orderItems = items.map((item) => {
      const qty = Number(item.actualQty || item.expectedQty || 0);
      totalQty += qty;
      return {
        purchaseItemId: item.purchaseItemId ? Number(item.purchaseItemId) : null,
        productId: Number(item.productId),
        expectedQty: Number(item.expectedQty || 0),
        actualQty: qty,
        acceptedQty: 0,
        rejectedQty: 0,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
      };
    });

    const order = await prisma.inboundOrder.create({
      data: {
        orderNo,
        purchaseOrderId: purchaseOrderId ? Number(purchaseOrderId) : null,
        supplierId: Number(supplierId),
        status: 'PENDING',
        createdById: req.user.id,
        totalQty,
        acceptedQty: 0,
        rejectedQty: 0,
        arrivedAt: arrivedAt ? new Date(arrivedAt) : new Date(),
        driverName,
        driverPhone,
        vehicleNo,
        temperature: temperature ? Number(temperature) : null,
        remark,
        items: { create: orderItems },
      },
      include: INBOUND_INCLUDE,
    });

    return success(res, order, '创建入库单成功', 201);
  } catch (err) {
    console.error('createInboundOrder error:', err);
    return fail(res, '创建入库单失败: ' + err.message);
  }
}

export async function updateInboundOrder(req, res) {
  try {
    const { id } = req.params;
    const {
      items,
      arrivedAt,
      driverName,
      driverPhone,
      vehicleNo,
      temperature,
      remark,
    } = req.body;

    const existing = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });
    if (!existing) return notFound(res, '入库单不存在');

    if (!['PENDING'].includes(existing.status)) {
      return fail(res, '当前状态不允许修改入库单');
    }

    const data = {};
    if (arrivedAt) data.arrivedAt = new Date(arrivedAt);
    if (driverName !== undefined) data.driverName = driverName;
    if (driverPhone !== undefined) data.driverPhone = driverPhone;
    if (vehicleNo !== undefined) data.vehicleNo = vehicleNo;
    if (temperature !== undefined) data.temperature = temperature ? Number(temperature) : null;
    if (remark !== undefined) data.remark = remark;

    if (items && items.length) {
      await prisma.$transaction(async (tx) => {
        await tx.inboundItem.deleteMany({ where: { inboundOrderId: Number(id) } });

        let totalQty = 0;
        const orderItems = items.map((item) => {
          const qty = Number(item.actualQty || item.expectedQty || 0);
          totalQty += qty;
          return {
            purchaseItemId: item.purchaseItemId ? Number(item.purchaseItemId) : null,
            productId: Number(item.productId),
            expectedQty: Number(item.expectedQty || 0),
            actualQty: qty,
            acceptedQty: 0,
            rejectedQty: 0,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
          };
        });

        data.totalQty = totalQty;
        data.items = { create: orderItems };
      });
    }

    const order = await prisma.inboundOrder.update({
      where: { id: Number(id) },
      data,
      include: INBOUND_INCLUDE,
    });

    return success(res, order, '更新入库单成功');
  } catch (err) {
    console.error('updateInboundOrder error:', err);
    return fail(res, '更新入库单失败: ' + err.message);
  }
}

export async function deleteInboundOrder(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.inboundOrder.findUnique({ where: { id: Number(id) } });
    if (!existing) return notFound(res, '入库单不存在');

    if (!['PENDING'].includes(existing.status)) {
      return fail(res, '当前状态不允许删除入库单');
    }

    await prisma.inboundOrder.delete({ where: { id: Number(id) } });
    return success(res, null, '删除入库单成功');
  } catch (err) {
    console.error('deleteInboundOrder error:', err);
    return fail(res, '删除入库单失败: ' + err.message);
  }
}

export async function updateInboundStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    if (!status) return fail(res, '请指定状态');

    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true, purchaseOrder: { include: { items: true } } },
    });
    if (!order) return notFound(res, '入库单不存在');

    const validTransitions = {
      PENDING: ['QC_PENDING', 'CANCELLED'],
      QC_PENDING: ['QC_PASSED', 'QC_REJECTED'],
      QC_PASSED: ['COMPLETED'],
      QC_REJECTED: ['COMPLETED'],
    };

    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      return fail(res, `不允许从 ${order.status} 变更为 ${status}`);
    }

    const updateData = {
      status,
      handledById: req.user.id,
    };

    if (status === 'QC_PENDING') {
      updateData.arrivedAt = order.arrivedAt || new Date();
    }

    if (status === 'QC_PASSED') {
      updateData.qcAt = new Date();
      updateData.qcById = req.user.id;
    }

    if (status === 'QC_REJECTED') {
      updateData.qcAt = new Date();
      updateData.qcById = req.user.id;
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (remark) updateData.remark = remark;

    const updated = await prisma.inboundOrder.update({
      where: { id: Number(id) },
      data: updateData,
      include: INBOUND_INCLUDE,
    });

    return success(res, updated, '状态更新成功');
  } catch (err) {
    console.error('updateInboundStatus error:', err);
    return fail(res, '状态更新失败: ' + err.message);
  }
}

export async function scanInboundItem(req, res) {
  try {
    const { id } = req.params;
    const { barcode, productId, qty, batchNo, produceDate, expiryDate, price } = req.body;

    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: { include: { product: true } } },
    });
    if (!order) return notFound(res, '入库单不存在');

    if (!['PENDING', 'QC_PENDING'].includes(order.status)) {
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
      (it) => it.productId === product.id && !it.batchId
    );

    const result = await prisma.$transaction(async (tx) => {
      let batch;
      if (batchNo) {
        batch = await tx.batch.findFirst({ where: { batchNo } });
        if (batch && batch.productId !== product.id) {
          throw new Error('批次与商品不匹配');
        }
      }

      if (!batch) {
        const newBatchNo = batchNo || generateBatchNo(product.id);
        batch = await tx.batch.create({
          data: {
            batchNo: newBatchNo,
            productId: product.id,
            supplierId: order.supplierId,
            qty: scanQty,
            remainingQty: scanQty,
            produceDate: produceDate ? new Date(produceDate) : null,
            expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            inboundDate: new Date(),
            inboundOrderId: order.id,
            price: price ? Number(price) : null,
            status: 'NORMAL',
            qcStatus: order.status === 'QC_PENDING' ? 'PENDING' : 'PENDING',
          },
        });
      } else {
        batch = await tx.batch.update({
          where: { id: batch.id },
          data: {
            qty: { increment: scanQty },
            remainingQty: { increment: scanQty },
          },
        });
      }

      let item;
      if (existingItem) {
        item = await tx.inboundItem.update({
          where: { id: existingItem.id },
          data: {
            actualQty: { increment: scanQty },
            batchId: batch.id,
          },
          include: {
            product: { select: { id: true, sku: true, barcode: true, name: true, unit: true } },
            batch: { select: { id: true, batchNo: true, expiryDate: true } },
          },
        });
      } else {
        item = await tx.inboundItem.create({
          data: {
            inboundOrderId: order.id,
            productId: product.id,
            batchId: batch.id,
            expectedQty: 0,
            actualQty: scanQty,
            acceptedQty: 0,
            rejectedQty: 0,
            unitPrice: price ? Number(price) : null,
          },
          include: {
            product: { select: { id: true, sku: true, barcode: true, name: true, unit: true } },
            batch: { select: { id: true, batchNo: true, expiryDate: true } },
          },
        });
      }

      const updatedOrder = await tx.inboundOrder.update({
        where: { id: order.id },
        data: { totalQty: { increment: scanQty } },
        include: INBOUND_INCLUDE,
      });

      return { item, batch, order: updatedOrder };
    });

    return success(res, result, '扫描成功');
  } catch (err) {
    console.error('scanInboundItem error:', err);

    if (err.message.includes('不匹配') || err.message.includes('不存在')) {
      return fail(res, err.message);
    }

    try {
      await prisma.exceptionRecord.create({
        data: {
          exceptionNo: `EXC${Date.now()}`,
          type: 'BATCH_ERROR',
          title: `入库单扫描异常 - 入库单#${id}`,
          description: err.message,
          status: 'OPEN',
          priority: 2,
          inboundOrderId: Number(id),
          createdById: req.user.id,
        },
      });
    } catch (e) {
      console.error('记录异常失败:', e);
    }

    return fail(res, '扫描失败: ' + err.message);
  }
}

export async function qcInboundOrder(req, res) {
  try {
    const { id } = req.params;
    const { items, overallRemark } = req.body;

    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true, purchaseOrder: { include: { items: true } } },
    });
    if (!order) return notFound(res, '入库单不存在');

    if (order.status !== 'QC_PENDING') {
      return fail(res, '当前状态不允许质检，请先将状态变更为QC_PENDING');
    }

    if (!items || !items.length) return fail(res, '请提供质检结果');

    const result = await prisma.$transaction(async (tx) => {
      let totalAccepted = 0;
      let totalRejected = 0;
      const exceptions = [];

      for (const qcItem of items) {
        const existingItem = order.items.find((it) => it.id === Number(qcItem.id));
        if (!existingItem) continue;

        const acceptedQty = Number(qcItem.acceptedQty || 0);
        const rejectedQty = Number(qcItem.rejectedQty || 0);
        const actualTotal = acceptedQty + rejectedQty;

        if (Math.abs(actualTotal - existingItem.actualQty) > 0.001) {
          return fail(res, `商品质检数量(${actualTotal})与实际数量(${existingItem.actualQty})不一致`);
        }

        totalAccepted += acceptedQty;
        totalRejected += rejectedQty;

        await tx.inboundItem.update({
          where: { id: existingItem.id },
          data: {
            acceptedQty,
            rejectedQty,
            rejectReason: qcItem.rejectReason,
            shelfLifeCheck: qcItem.shelfLifeCheck,
            temperatureOk: qcItem.temperatureOk,
            packagingOk: qcItem.packagingOk,
            qcRemark: qcItem.qcRemark,
          },
        });

        if (rejectedQty > 0 && existingItem.batchId) {
          await tx.batch.update({
            where: { id: existingItem.batchId },
            data: {
              qcStatus: 'REJECTED',
              remainingQty: { decrement: rejectedQty },
            },
          });

          exceptions.push({
            exceptionNo: `EXC${Date.now()}${Math.floor(Math.random() * 1000)}`,
            type: 'QC_REJECT',
            title: `质检不合格 - 入库单#${order.id}`,
            description: `商品ID: ${existingItem.productId}, 不合格数量: ${rejectedQty}, 原因: ${qcItem.rejectReason || '未填写'}`,
            status: 'OPEN',
            priority: 3,
            supplierId: order.supplierId,
            inboundOrderId: order.id,
            batchId: existingItem.batchId,
            productId: existingItem.productId,
            createdById: req.user.id,
            affectedQty: rejectedQty,
          });
        } else if (existingItem.batchId) {
          await tx.batch.update({
            where: { id: existingItem.batchId },
            data: { qcStatus: 'PASSED' },
          });
        }
      }

      if (exceptions.length) {
        await tx.exceptionRecord.createMany({ data: exceptions });
      }

      const newStatus = totalRejected > 0 ? 'QC_REJECTED' : 'QC_PASSED';

      const updated = await tx.inboundOrder.update({
        where: { id: order.id },
        data: {
          acceptedQty: totalAccepted,
          rejectedQty: totalRejected,
          status: newStatus,
          qcAt: new Date(),
          qcById: req.user.id,
          handledById: req.user.id,
          remark: overallRemark || undefined,
        },
        include: INBOUND_INCLUDE,
      });

      return { order: updated, totalAccepted, totalRejected };
    });

    return success(res, result, '质检完成');
  } catch (err) {
    console.error('qcInboundOrder error:', err);
    return fail(res, '质检失败: ' + err.message);
  }
}

export async function completeInboundOrder(req, res) {
  try {
    const { id } = req.params;

    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: {
        items: { include: { batch: true, purchaseItem: true } },
        purchaseOrder: { include: { items: true } },
      },
    });
    if (!order) return notFound(res, '入库单不存在');

    if (!['QC_PASSED', 'QC_REJECTED'].includes(order.status)) {
      return fail(res, '当前状态不允许完成入库，请先完成质检');
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const acceptedQty = item.acceptedQty || 0;
        if (acceptedQty <= 0 || !item.batchId) continue;

        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const defaultZone = 'DEFAULT';

        let inventory = await tx.inventory.findUnique({
          where: { productId_warehouseZone: { productId: item.productId, warehouseZone: defaultZone } },
        });

        if (!inventory) {
          inventory = await tx.inventory.create({
            data: {
              productId: item.productId,
              warehouseZone: defaultZone,
              totalQty: 0,
              availableQty: 0,
              reservedQty: 0,
              damagedQty: 0,
            },
          });
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            totalQty: { increment: acceptedQty },
            availableQty: { increment: acceptedQty },
          },
        });

        await tx.batch.update({
          where: { id: item.batchId },
          data: { inventoryId: inventory.id },
        });
      }

      if (order.purchaseOrder && order.items.length) {
        const po = order.purchaseOrder;
        const poItemMap = {};
        for (const poItem of po.items) {
          poItemMap[poItem.id] = { ...poItem };
        }

        for (const item of order.items) {
          if (item.purchaseItemId && poItemMap[item.purchaseItemId]) {
            const acceptedQty = item.acceptedQty || 0;
            poItemMap[item.purchaseItemId].deliveredQty =
              (poItemMap[item.purchaseItemId].deliveredQty || 0) + acceptedQty;

            await tx.purchaseOrderItem.update({
              where: { id: item.purchaseItemId },
              data: { deliveredQty: poItemMap[item.purchaseItemId].deliveredQty },
            });
          }
        }

        let allFullyDelivered = true;
        let anyPartial = false;
        for (const poItem of Object.values(poItemMap)) {
          const delivered = Number(poItem.deliveredQty || 0);
          const expected = Number(poItem.expectedQty || 0);
          if (delivered < expected) {
            allFullyDelivered = false;
          }
          if (delivered > 0) {
            anyPartial = true;
          }
        }

        let newPoStatus = po.status;
        if (allFullyDelivered) {
          newPoStatus = 'FULLY_DELIVERED';
        } else if (anyPartial) {
          newPoStatus = 'PARTIAL_DELIVERED';
        }

        if (newPoStatus !== po.status) {
          await tx.purchaseOrder.update({
            where: { id: po.id },
            data: { status: newPoStatus },
          });
        }
      }

      const updated = await tx.inboundOrder.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          handledById: req.user.id,
        },
        include: INBOUND_INCLUDE,
      });

      return updated;
    });

    return success(res, result, '入库完成');
  } catch (err) {
    console.error('completeInboundOrder error:', err);
    return fail(res, '入库完成失败: ' + err.message);
  }
}

export async function exportInboundOrders(req, res) {
  try {
    const { status, supplierId, purchaseOrderId, startDate, endDate } = req.query;

    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = Number(supplierId);
    if (purchaseOrderId) where.purchaseOrderId = Number(purchaseOrderId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (req.user.supplierId) {
      where.supplierId = req.user.supplierId;
    }

    const orders = await prisma.inboundOrder.findMany({
      where,
      include: INBOUND_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    const exportData = orders.map((o) => ({
      入库单号: o.orderNo,
      供应商: o.supplier?.name || '',
      采购单号: o.purchaseOrder?.orderNo || '',
      状态: o.status,
      总数量: o.totalQty,
      合格数量: o.acceptedQty,
      不合格数量: o.rejectedQty,
      司机: o.driverName || '',
      电话: o.driverPhone || '',
      车牌号: o.vehicleNo || '',
      到达时间: o.arrivedAt,
      质检时间: o.qcAt,
      完成时间: o.completedAt,
      创建人: o.createdBy?.realName || o.createdBy?.username || '',
      创建时间: o.createdAt,
      备注: o.remark || '',
      明细: o.items.map((it) => ({
        商品: it.product?.name || '',
        SKU: it.product?.sku || '',
        条码: it.product?.barcode || '',
        批次: it.batch?.batchNo || '',
        期望数量: it.expectedQty,
        实际数量: it.actualQty,
        合格数量: it.acceptedQty,
        不合格数量: it.rejectedQty,
        不合格原因: it.rejectReason || '',
        质检备注: it.qcRemark || '',
      })),
    }));

    return success(res, {
      count: exportData.length,
      data: exportData,
      exportedAt: new Date(),
    }, '导出成功');
  } catch (err) {
    console.error('exportInboundOrders error:', err);
    return fail(res, '导出失败: ' + err.message);
  }
}
