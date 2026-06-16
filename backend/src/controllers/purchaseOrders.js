import prisma from '../utils/prisma.js';
import { success, fail, paginate } from '../utils/response.js';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';

const STATUS_FLOW = {
  DRAFT: ['PENDING_SUPPLIER', 'CANCELLED'],
  PENDING_SUPPLIER: ['SUPPLIER_CONFIRMED', 'CANCELLED', 'DRAFT'],
  SUPPLIER_CONFIRMED: ['PARTIAL_DELIVERED', 'FULLY_DELIVERED', 'CANCELLED'],
  PARTIAL_DELIVERED: ['FULLY_DELIVERED', 'COMPLETED', 'CANCELLED'],
  FULLY_DELIVERED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

function generateOrderNo() {
  return `PO${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function calcOrderSummary(items) {
  let totalQty = 0;
  let totalAmount = 0;
  for (const it of items) {
    const qty = Number(it.expectedQty) || 0;
    const price = Number(it.unitPrice) || 0;
    totalQty += qty;
    totalAmount += qty * price;
  }
  return { totalQty, totalAmount };
}

async function buildItemsWithProducts(itemIds) {
  const products = await prisma.product.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, sku: true, unit: true },
  });
  return products.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
}

export async function getPurchaseOrderList(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      supplierId,
      status,
      createdById,
      assignedToId,
      keyword,
      startDate,
      endDate,
      urgentLevel,
    } = req.query;

    const where = {};

    if (supplierId) where.supplierId = Number(supplierId);
    if (status) where.status = status;
    if (createdById) where.createdById = Number(createdById);
    if (assignedToId) where.assignedToId = Number(assignedToId);
    if (urgentLevel) where.urgentLevel = Number(urgentLevel);

    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { supplier: { name: { contains: keyword } } },
        { supplier: { code: { contains: keyword } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const [total, list] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, username: true, realName: true } },
          assignedTo: { select: { id: true, username: true, realName: true } },
          items: {
            include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
          },
        },
      }),
    ]);

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getPurchaseOrderList error:', err);
    return fail(res, '获取采购单列表失败');
  }
}

export async function getPurchaseOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: Number(id) },
      include: {
        supplier: {
          select: {
            id: true, code: true, name: true, contactPerson: true, phone: true, email: true, address: true,
          },
        },
        createdBy: { select: { id: true, username: true, realName: true, phone: true, email: true } },
        assignedTo: { select: { id: true, username: true, realName: true } },
        items: {
          include: { product: { select: { id: true, sku: true, name: true, unit: true, spec: true } } },
          orderBy: { id: 'asc' },
        },
        inboundOrders: {
          select: { id: true, orderNo: true, status: true, totalQty: true, acceptedQty: true, rejectedQty: true, arrivedAt: true },
          orderBy: { createdAt: 'desc' },
        },
        replies: {
          include: { fromUser: { select: { id: true, username: true, realName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!order) return fail(res, '采购单不存在', 404);

    return success(res, order);
  } catch (err) {
    console.error('getPurchaseOrderById error:', err);
    return fail(res, '获取采购单详情失败');
  }
}

export async function createPurchaseOrder(req, res) {
  try {
    const {
      orderNo,
      supplierId,
      expectedDate,
      assignedToId,
      urgentLevel,
      requireQc,
      remark,
      items,
    } = req.body;

    if (!supplierId) return fail(res, '缺少供应商 supplierId');
    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, '采购单必须包含至少一条明细');
    }

    for (const it of items) {
      if (!it.productId || !it.expectedQty || Number(it.expectedQty) <= 0 || it.unitPrice === undefined || it.unitPrice === null) {
        return fail(res, '每条明细需包含 productId, expectedQty(>0), unitPrice');
      }
    }

    const supplier = await prisma.supplier.findUnique({ where: { id: Number(supplierId) } });
    if (!supplier) return fail(res, '供应商不存在');

    const productIds = items.map((it) => Number(it.productId));
    const products = await buildItemsWithProducts(productIds);
    for (const pid of productIds) {
      if (!products[pid]) return fail(res, `商品 ID ${pid} 不存在`);
    }

    const summary = calcOrderSummary(items);
    const finalOrderNo = orderNo || generateOrderNo();

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          orderNo: finalOrderNo,
          supplierId: Number(supplierId),
          status: 'DRAFT',
          createdById: req.user.id,
          assignedToId: assignedToId ? Number(assignedToId) : null,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          totalQty: summary.totalQty,
          totalAmount: summary.totalAmount,
          urgentLevel: urgentLevel ? Number(urgentLevel) : 1,
          requireQc: requireQc !== undefined ? Boolean(requireQc) : true,
          remark: remark || null,
          items: {
            create: items.map((it) => {
              const qty = Number(it.expectedQty);
              const price = Number(it.unitPrice);
              return {
                productId: Number(it.productId),
                expectedQty: qty,
                unitPrice: price,
                subtotal: qty * price,
                expectedDate: it.expectedDate ? new Date(it.expectedDate) : null,
                remark: it.remark || null,
              };
            }),
          },
        },
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, username: true, realName: true } },
          items: {
            include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PURCHASE_ORDER_CREATE',
          entityType: 'PURCHASE_ORDER',
          entityId: po.id,
          newValue: {
            orderNo: po.orderNo,
            supplierId: po.supplierId,
            totalQty: summary.totalQty,
            totalAmount: summary.totalAmount,
            itemCount: items.length,
          },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return po;
    });

    return success(res, order, '采购单创建成功', 201);
  } catch (err) {
    console.error('createPurchaseOrder error:', err);
    return fail(res, '创建采购单失败');
  }
}

export async function updatePurchaseOrder(req, res) {
  try {
    const { id } = req.params;
    const {
      supplierId,
      expectedDate,
      assignedToId,
      urgentLevel,
      requireQc,
      remark,
      status,
      items,
    } = req.body;

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });
    if (!existing) return fail(res, '采购单不存在', 404);

    if (existing.status !== 'DRAFT' && items !== undefined) {
      return fail(res, '仅草稿状态可修改明细');
    }

    const data = {};
    if (supplierId !== undefined) data.supplierId = Number(supplierId);
    if (expectedDate !== undefined) data.expectedDate = expectedDate ? new Date(expectedDate) : null;
    if (assignedToId !== undefined) data.assignedToId = assignedToId ? Number(assignedToId) : null;
    if (urgentLevel !== undefined) data.urgentLevel = Number(urgentLevel);
    if (requireQc !== undefined) data.requireQc = Boolean(requireQc);
    if (remark !== undefined) data.remark = remark;
    if (status !== undefined) data.status = status;

    let newSummary = null;

    if (Array.isArray(items)) {
      if (items.length === 0) return fail(res, '采购单至少需一条明细');
      for (const it of items) {
        if (!it.productId || !it.expectedQty || Number(it.expectedQty) <= 0 || it.unitPrice === undefined || it.unitPrice === null) {
          return fail(res, '每条明细需包含 productId, expectedQty(>0), unitPrice');
        }
      }
      const productIds = items.map((it) => Number(it.productId));
      const products = await buildItemsWithProducts(productIds);
      for (const pid of productIds) {
        if (!products[pid]) return fail(res, `商品 ID ${pid} 不存在`);
      }

      newSummary = calcOrderSummary(items);
      data.totalQty = newSummary.totalQty;
      data.totalAmount = newSummary.totalAmount;
    }

    const order = await prisma.$transaction(async (tx) => {
      if (Array.isArray(items)) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: Number(id) } });
        data.items = {
          create: items.map((it) => {
            const qty = Number(it.expectedQty);
            const price = Number(it.unitPrice);
            const existingItem = existing.items.find((ei) => ei.productId === Number(it.productId));
            return {
              productId: Number(it.productId),
              expectedQty: qty,
              confirmedQty: it.confirmedQty !== undefined ? Number(it.confirmedQty) : existingItem?.confirmedQty ?? null,
              deliveredQty: it.deliveredQty !== undefined ? Number(it.deliveredQty) : existingItem?.deliveredQty ?? 0,
              unitPrice: price,
              subtotal: qty * price,
              expectedDate: it.expectedDate ? new Date(it.expectedDate) : null,
              remark: it.remark !== undefined ? it.remark : null,
            };
          }),
        };
      }

      const po = await tx.purchaseOrder.update({
        where: { id: Number(id) },
        data,
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, username: true, realName: true } },
          items: {
            include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PURCHASE_ORDER_UPDATE',
          entityType: 'PURCHASE_ORDER',
          entityId: Number(id),
          oldValue: {
            status: existing.status,
            totalQty: existing.totalQty.toNumber(),
            totalAmount: existing.totalAmount.toNumber(),
          },
          newValue: {
            status: po.status,
            totalQty: po.totalQty.toNumber(),
            totalAmount: po.totalAmount.toNumber(),
            itemsChanged: Array.isArray(items),
          },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return po;
    });

    return success(res, order, '采购单更新成功');
  } catch (err) {
    console.error('updatePurchaseOrder error:', err);
    return fail(res, '更新采购单失败');
  }
}

export async function deletePurchaseOrder(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.purchaseOrder.findUnique({ where: { id: Number(id) } });
    if (!existing) return fail(res, '采购单不存在', 404);

    if (existing.status !== 'DRAFT') {
      return fail(res, '仅草稿状态的采购单可删除');
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: Number(id) } });
      await tx.purchaseOrder.delete({ where: { id: Number(id) } });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PURCHASE_ORDER_DELETE',
          entityType: 'PURCHASE_ORDER',
          entityId: Number(id),
          oldValue: { orderNo: existing.orderNo, status: existing.status },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    });

    return success(res, null, '采购单删除成功');
  } catch (err) {
    console.error('deletePurchaseOrder error:', err);
    return fail(res, '删除采购单失败');
  }
}

export async function updatePurchaseOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return fail(res, '缺少 status 参数');

    const existing = await prisma.purchaseOrder.findUnique({ where: { id: Number(id) } });
    if (!existing) return fail(res, '采购单不存在', 404);

    const allowed = STATUS_FLOW[existing.status] || [];
    if (!allowed.includes(status)) {
      return fail(res, `状态流转不合法: ${existing.status} → ${status}，允许: ${allowed.join(', ') || '无'}`);
    }

    const order = await prisma.$transaction(async (tx) => {
      const data = { status };
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        data.closedAt = new Date();
      }
      const po = await tx.purchaseOrder.update({
        where: { id: Number(id) },
        data,
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, username: true, realName: true } },
          items: {
            include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PURCHASE_ORDER_STATUS_CHANGE',
          entityType: 'PURCHASE_ORDER',
          entityId: Number(id),
          oldValue: { status: existing.status },
          newValue: { status },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return po;
    });

    return success(res, order, `状态更新成功: ${existing.status} → ${status}`);
  } catch (err) {
    console.error('updatePurchaseOrderStatus error:', err);
    return fail(res, '更新采购单状态失败');
  }
}

export async function submitPurchaseOrder(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });
    if (!existing) return fail(res, '采购单不存在', 404);

    if (existing.status !== 'DRAFT') {
      return fail(res, `仅草稿状态可提交，当前状态: ${existing.status}`);
    }
    if (!existing.items || existing.items.length === 0) {
      return fail(res, '采购单无明细，无法提交');
    }

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.update({
        where: { id: Number(id) },
        data: { status: 'PENDING_SUPPLIER' },
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, username: true, realName: true } },
          items: {
            include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PURCHASE_ORDER_SUBMIT',
          entityType: 'PURCHASE_ORDER',
          entityId: Number(id),
          oldValue: { status: 'DRAFT' },
          newValue: { status: 'PENDING_SUPPLIER' },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return po;
    });

    return success(res, order, '采购单已提交，待供应商确认');
  } catch (err) {
    console.error('submitPurchaseOrder error:', err);
    return fail(res, '提交采购单失败');
  }
}

export async function confirmPurchaseOrder(req, res) {
  try {
    const { id } = req.params;
    const { confirmedItems, remark } = req.body;

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });
    if (!existing) return fail(res, '采购单不存在', 404);

    if (existing.status !== 'PENDING_SUPPLIER') {
      return fail(res, `仅待供应商确认状态可确认，当前状态: ${existing.status}`);
    }

    const order = await prisma.$transaction(async (tx) => {
      if (Array.isArray(confirmedItems) && confirmedItems.length > 0) {
        for (const ci of confirmedItems) {
          if (!ci.id || ci.confirmedQty === undefined || ci.confirmedQty === null) continue;
          await tx.purchaseOrderItem.update({
            where: { id: Number(ci.id) },
            data: {
              confirmedQty: Number(ci.confirmedQty),
              unitPrice: ci.unitPrice !== undefined ? Number(ci.unitPrice) : undefined,
            },
          });
        }
      }

      const po = await tx.purchaseOrder.update({
        where: { id: Number(id) },
        data: {
          status: 'SUPPLIER_CONFIRMED',
          remark: remark !== undefined ? remark : existing.remark,
        },
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, username: true, realName: true } },
          items: {
            include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PURCHASE_ORDER_CONFIRM',
          entityType: 'PURCHASE_ORDER',
          entityId: Number(id),
          oldValue: { status: 'PENDING_SUPPLIER' },
          newValue: {
            status: 'SUPPLIER_CONFIRMED',
            confirmedCount: confirmedItems?.length || 0,
          },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return po;
    });

    return success(res, order, '采购单已确认');
  } catch (err) {
    console.error('confirmPurchaseOrder error:', err);
    return fail(res, '确认采购单失败');
  }
}

export async function cancelPurchaseOrder(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const existing = await prisma.purchaseOrder.findUnique({ where: { id: Number(id) } });
    if (!existing) return fail(res, '采购单不存在', 404);

    const allowed = STATUS_FLOW[existing.status] || [];
    if (!allowed.includes('CANCELLED')) {
      return fail(res, `当前状态 ${existing.status} 不允许取消`);
    }

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.update({
        where: { id: Number(id) },
        data: {
          status: 'CANCELLED',
          closedAt: new Date(),
          remark: reason ? `${existing.remark ? existing.remark + '\n' : ''}取消原因: ${reason}` : existing.remark,
        },
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, username: true, realName: true } },
          items: {
            include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PURCHASE_ORDER_CANCEL',
          entityType: 'PURCHASE_ORDER',
          entityId: Number(id),
          oldValue: { status: existing.status },
          newValue: { status: 'CANCELLED', reason: reason || '' },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return po;
    });

    return success(res, order, '采购单已取消');
  } catch (err) {
    console.error('cancelPurchaseOrder error:', err);
    return fail(res, '取消采购单失败');
  }
}

export async function exportPurchaseOrders(req, res) {
  try {
    const {
      supplierId,
      status,
      createdById,
      startDate,
      endDate,
    } = req.query;

    const where = {};
    if (supplierId) where.supplierId = Number(supplierId);
    if (status) where.status = status;
    if (createdById) where.createdById = Number(createdById);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }

    const list = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, username: true, realName: true } },
        items: {
          include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('采购单');

    sheet.columns = [
      { header: '采购单号', key: 'orderNo', width: 22 },
      { header: '供应商', key: 'supplier', width: 22 },
      { header: '状态', key: 'status', width: 20 },
      { header: '创建人', key: 'createdBy', width: 14 },
      { header: '期望交货日期', key: 'expectedDate', width: 16 },
      { header: '总数量', key: 'totalQty', width: 12 },
      { header: '总金额', key: 'totalAmount', width: 14 },
      { header: '紧急度', key: 'urgentLevel', width: 10 },
      { header: '需质检', key: 'requireQc', width: 10 },
      { header: '明细', key: 'items', width: 60 },
      { header: '备注', key: 'remark', width: 28 },
      { header: '创建时间', key: 'createdAt', width: 20 },
      { header: '关闭时间', key: 'closedAt', width: 20 },
    ];

    const STATUS_LABEL = {
      DRAFT: '草稿',
      PENDING_SUPPLIER: '待供应商确认',
      SUPPLIER_CONFIRMED: '供应商已确认',
      PARTIAL_DELIVERED: '部分到货',
      FULLY_DELIVERED: '全部到货',
      CANCELLED: '已取消',
      COMPLETED: '已完成',
    };

    for (const po of list) {
      const itemStr = po.items
        .map((it) => {
          const p = it.product || {};
          return `${p.name || '-'} x ${it.expectedQty.toNumber()}${p.unit || ''} @${it.unitPrice.toNumber()}=${it.subtotal.toNumber()}`;
        })
        .join('; ');

      sheet.addRow({
        orderNo: po.orderNo,
        supplier: po.supplier?.name || '',
        status: STATUS_LABEL[po.status] || po.status,
        createdBy: po.createdBy?.realName || po.createdBy?.username || '',
        expectedDate: po.expectedDate ? dayjs(po.expectedDate).format('YYYY-MM-DD') : '',
        totalQty: po.totalQty.toNumber(),
        totalAmount: po.totalAmount.toNumber(),
        urgentLevel: po.urgentLevel,
        requireQc: po.requireQc ? '是' : '否',
        items: itemStr,
        remark: po.remark || '',
        createdAt: dayjs(po.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        closedAt: po.closedAt ? dayjs(po.closedAt).format('YYYY-MM-DD HH:mm:ss') : '',
      });
    }

    const fileName = `purchase_orders_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportPurchaseOrders error:', err);
    return fail(res, '导出采购单失败');
  }
}
