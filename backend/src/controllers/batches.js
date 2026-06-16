import prisma from '../utils/prisma.js';
import { success, fail, paginate } from '../utils/response.js';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';

function generateBatchNo() {
  return `B${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

export async function getBatchList(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      productId,
      supplierId,
      status,
      qcStatus,
      keyword,
      warehouseZone,
    } = req.query;

    const where = {};

    if (productId) where.productId = Number(productId);
    if (supplierId) where.supplierId = Number(supplierId);
    if (status) where.status = status;
    if (qcStatus) where.qcStatus = qcStatus;

    if (keyword) {
      where.OR = [
        { batchNo: { contains: keyword } },
        { product: { name: { contains: keyword } } },
        { product: { sku: { contains: keyword } } },
      ];
    }

    if (warehouseZone) {
      where.inventory = { warehouseZone };
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const [total, list] = await Promise.all([
      prisma.batch.count({ where }),
      prisma.batch.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: { category: { select: { id: true, name: true } } },
          },
          supplier: { select: { id: true, code: true, name: true } },
          inventory: { select: { id: true, warehouseZone: true, location: true } },
        },
      }),
    ]);

    const now = dayjs();
    const enriched = list.map((b) => {
      const diff = dayjs(b.expiryDate).diff(now, 'day');
      const warningDays = b.product?.warningDays || 7;
      let expiryStatus = 'NORMAL';
      if (diff < 0) expiryStatus = 'EXPIRED';
      else if (diff <= warningDays) expiryStatus = 'NEAR_EXPIRY';
      return {
        ...b,
        daysToExpiry: diff,
        expiryStatus,
      };
    });

    return success(res, paginate(enriched, page, pageSize, total));
  } catch (err) {
    console.error('getBatchList error:', err);
    return fail(res, '获取批次列表失败');
  }
}

export async function getBatchById(req, res) {
  try {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
      where: { id: Number(id) },
      include: {
        product: {
          include: { category: { select: { id: true, name: true } } },
        },
        supplier: { select: { id: true, code: true, name: true, contactPerson: true, phone: true } },
        inventory: { select: { id: true, warehouseZone: true, location: true } },
        inboundOrder: { select: { id: true, orderNo: true, status: true } },
      },
    });

    if (!batch) return fail(res, '批次不存在', 404);

    const now = dayjs();
    const diff = dayjs(batch.expiryDate).diff(now, 'day');
    const warningDays = batch.product?.warningDays || 7;
    let expiryStatus = 'NORMAL';
    if (diff < 0) expiryStatus = 'EXPIRED';
    else if (diff <= warningDays) expiryStatus = 'NEAR_EXPIRY';

    return success(res, { ...batch, daysToExpiry: diff, expiryStatus });
  } catch (err) {
    console.error('getBatchById error:', err);
    return fail(res, '获取批次详情失败');
  }
}

export async function createBatch(req, res) {
  try {
    const {
      batchNo,
      productId,
      supplierId,
      inventoryId,
      qty,
      produceDate,
      expiryDate,
      inboundDate,
      inboundOrderId,
      price,
      status,
      qcStatus,
      remark,
    } = req.body;

    if (!productId || !supplierId || !qty || Number(qty) <= 0 || !expiryDate) {
      return fail(res, '缺少必填参数: productId, supplierId, qty(>0), expiryDate');
    }

    const finalBatchNo = batchNo || generateBatchNo();

    const batch = await prisma.batch.create({
      data: {
        batchNo: finalBatchNo,
        productId: Number(productId),
        supplierId: Number(supplierId),
        inventoryId: inventoryId ? Number(inventoryId) : null,
        qty: Number(qty),
        remainingQty: Number(qty),
        produceDate: produceDate ? new Date(produceDate) : null,
        expiryDate: new Date(expiryDate),
        inboundDate: inboundDate ? new Date(inboundDate) : null,
        inboundOrderId: inboundOrderId ? Number(inboundOrderId) : null,
        price: price ? Number(price) : null,
        status: status || 'NORMAL',
        qcStatus: qcStatus || 'PENDING',
        remark: remark || null,
      },
      include: {
        product: { include: { category: { select: { id: true, name: true } } } },
        supplier: { select: { id: true, code: true, name: true } },
      },
    });

    return success(res, batch, '批次创建成功', 201);
  } catch (err) {
    console.error('createBatch error:', err);
    return fail(res, '创建批次失败');
  }
}

export async function updateBatch(req, res) {
  try {
    const { id } = req.params;
    const {
      productId,
      supplierId,
      inventoryId,
      qty,
      remainingQty,
      produceDate,
      expiryDate,
      inboundDate,
      inboundOrderId,
      price,
      status,
      qcStatus,
      remark,
    } = req.body;

    const data = {};
    if (productId !== undefined) data.productId = Number(productId);
    if (supplierId !== undefined) data.supplierId = Number(supplierId);
    if (inventoryId !== undefined) data.inventoryId = inventoryId ? Number(inventoryId) : null;
    if (qty !== undefined) data.qty = Number(qty);
    if (remainingQty !== undefined) data.remainingQty = Number(remainingQty);
    if (produceDate !== undefined) data.produceDate = produceDate ? new Date(produceDate) : null;
    if (expiryDate !== undefined) data.expiryDate = new Date(expiryDate);
    if (inboundDate !== undefined) data.inboundDate = inboundDate ? new Date(inboundDate) : null;
    if (inboundOrderId !== undefined) data.inboundOrderId = inboundOrderId ? Number(inboundOrderId) : null;
    if (price !== undefined) data.price = price ? Number(price) : null;
    if (status !== undefined) data.status = status;
    if (qcStatus !== undefined) data.qcStatus = qcStatus;
    if (remark !== undefined) data.remark = remark;

    const batch = await prisma.batch.update({
      where: { id: Number(id) },
      data,
      include: {
        product: { include: { category: { select: { id: true, name: true } } } },
        supplier: { select: { id: true, code: true, name: true } },
      },
    });

    return success(res, batch, '批次更新成功');
  } catch (err) {
    console.error('updateBatch error:', err);
    return fail(res, '更新批次失败');
  }
}

export async function deleteBatch(req, res) {
  try {
    const { id } = req.params;

    const batch = await prisma.batch.findUnique({ where: { id: Number(id) } });
    if (!batch) return fail(res, '批次不存在', 404);

    await prisma.batch.delete({ where: { id: Number(id) } });

    return success(res, null, '批次删除成功');
  } catch (err) {
    console.error('deleteBatch error:', err);
    return fail(res, '删除批次失败');
  }
}

export async function getNearExpiryBatches(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      productId,
      supplierId,
      status,
      warningDays,
    } = req.query;

    const now = dayjs();
    const customWarningDays = warningDays ? Number(warningDays) : null;

    const where = {
      remainingQty: { gt: 0 },
    };
    if (productId) where.productId = Number(productId);
    if (supplierId) where.supplierId = Number(supplierId);
    if (status) where.status = status;

    const rawList = await prisma.batch.findMany({
      where,
      include: {
        product: {
          include: { category: { select: { id: true, name: true } } },
        },
        supplier: { select: { id: true, code: true, name: true } },
        inventory: { select: { id: true, warehouseZone: true, location: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const filtered = rawList.filter((b) => {
      const wd = customWarningDays ?? (b.product?.warningDays || 7);
      const diff = dayjs(b.expiryDate).diff(now, 'day');
      return diff >= 0 && diff <= wd;
    });

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);
    const total = filtered.length;
    const list = filtered.slice(skip, skip + take).map((b) => ({
      ...b,
      daysToExpiry: dayjs(b.expiryDate).diff(now, 'day'),
      warningDays: customWarningDays ?? (b.product?.warningDays || 7),
    }));

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getNearExpiryBatches error:', err);
    return fail(res, '获取临期批次失败');
  }
}

export async function getExpiredBatches(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      productId,
      supplierId,
      status,
    } = req.query;

    const where = {
      remainingQty: { gt: 0 },
      expiryDate: { lt: new Date() },
    };
    if (productId) where.productId = Number(productId);
    if (supplierId) where.supplierId = Number(supplierId);
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const [total, rawList] = await Promise.all([
      prisma.batch.count({ where }),
      prisma.batch.findMany({
        where,
        skip,
        take,
        orderBy: { expiryDate: 'asc' },
        include: {
          product: {
            include: { category: { select: { id: true, name: true } } },
          },
          supplier: { select: { id: true, code: true, name: true } },
          inventory: { select: { id: true, warehouseZone: true, location: true } },
        },
      }),
    ]);

    const now = dayjs();
    const list = rawList.map((b) => ({
      ...b,
      daysOverdue: Math.abs(dayjs(b.expiryDate).diff(now, 'day')),
    }));

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getExpiredBatches error:', err);
    return fail(res, '获取过期批次失败');
  }
}

export async function adjustBatchStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, qcStatus, remark } = req.body;

    if (!status && !qcStatus) {
      return fail(res, '至少需要指定 status 或 qcStatus');
    }

    const validStatuses = ['NORMAL', 'NEAR_EXPIRY', 'EXPIRED', 'LOCKED', 'CONSUMED', 'DAMAGED', 'DESTROYED', 'TRANSFERRED'];
    const validQcStatuses = ['PENDING', 'QC_PASSED', 'QC_REJECTED', 'QC_PARTIAL'];

    if (status && !validStatuses.includes(status)) {
      return fail(res, `status 无效，支持: ${validStatuses.join(', ')}`);
    }
    if (qcStatus && !validQcStatuses.includes(qcStatus)) {
      return fail(res, `qcStatus 无效，支持: ${validQcStatuses.join(', ')}`);
    }

    const batch = await prisma.batch.findUnique({ where: { id: Number(id) } });
    if (!batch) return fail(res, '批次不存在', 404);

    const data = {};
    if (status) data.status = status;
    if (qcStatus) data.qcStatus = qcStatus;
    if (remark !== undefined) data.remark = remark;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.batch.update({
        where: { id: Number(id) },
        data,
        include: {
          product: { include: { category: { select: { id: true, name: true } } } },
          supplier: { select: { id: true, code: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'BATCH_STATUS_CHANGE',
          entityType: 'BATCH',
          entityId: Number(id),
          oldValue: { status: batch.status, qcStatus: batch.qcStatus },
          newValue: { status: u.status, qcStatus: u.qcStatus, remark: remark || '' },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return u;
    });

    return success(res, updated, '批次状态调整成功');
  } catch (err) {
    console.error('adjustBatchStatus error:', err);
    return fail(res, '调整批次状态失败');
  }
}

export async function exportBatches(req, res) {
  try {
    const {
      productId,
      supplierId,
      status,
      qcStatus,
      scope,
    } = req.query;

    const where = {};
    if (productId) where.productId = Number(productId);
    if (supplierId) where.supplierId = Number(supplierId);
    if (status) where.status = status;
    if (qcStatus) where.qcStatus = qcStatus;

    if (scope === 'near-expiry') {
      where.remainingQty = { gt: 0 };
    } else if (scope === 'expired') {
      where.remainingQty = { gt: 0 };
      where.expiryDate = { lt: new Date() };
    }

    let list = await prisma.batch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: { category: { select: { id: true, name: true } } },
        },
        supplier: { select: { id: true, code: true, name: true } },
        inventory: { select: { id: true, warehouseZone: true, location: true } },
      },
    });

    if (scope === 'near-expiry') {
      const now = dayjs();
      list = list.filter((b) => {
        const wd = b.product?.warningDays || 7;
        const diff = dayjs(b.expiryDate).diff(now, 'day');
        return diff >= 0 && diff <= wd;
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('批次清单');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: '批次号', key: 'batchNo', width: 22 },
      { header: '商品编码', key: 'sku', width: 16 },
      { header: '商品名称', key: 'productName', width: 26 },
      { header: '分类', key: 'category', width: 12 },
      { header: '单位', key: 'unit', width: 8 },
      { header: '供应商', key: 'supplier', width: 20 },
      { header: '总数量', key: 'qty', width: 12 },
      { header: '剩余数量', key: 'remainingQty', width: 12 },
      { header: '锁定数量', key: 'lockedQty', width: 12 },
      { header: '生产日期', key: 'produceDate', width: 14 },
      { header: '过期日期', key: 'expiryDate', width: 14 },
      { header: '入库日期', key: 'inboundDate', width: 14 },
      { header: '库区', key: 'zone', width: 10 },
      { header: '库位', key: 'location', width: 12 },
      { header: '状态', key: 'status', width: 12 },
      { header: '质检状态', key: 'qcStatus', width: 12 },
      { header: '备注', key: 'remark', width: 22 },
      { header: '创建时间', key: 'createdAt', width: 20 },
    ];

    for (const b of list) {
      const p = b.product || {};
      sheet.addRow({
        id: b.id,
        batchNo: b.batchNo,
        sku: p.sku || '',
        productName: p.name || '',
        category: p.category?.name || '',
        unit: p.unit || '',
        supplier: b.supplier?.name || '',
        qty: b.qty.toNumber(),
        remainingQty: b.remainingQty.toNumber(),
        lockedQty: b.lockedQty.toNumber(),
        produceDate: b.produceDate ? dayjs(b.produceDate).format('YYYY-MM-DD') : '',
        expiryDate: dayjs(b.expiryDate).format('YYYY-MM-DD'),
        inboundDate: b.inboundDate ? dayjs(b.inboundDate).format('YYYY-MM-DD') : '',
        zone: b.inventory?.warehouseZone || '',
        location: b.inventory?.location || '',
        status: b.status,
        qcStatus: b.qcStatus,
        remark: b.remark || '',
        createdAt: dayjs(b.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      });
    }

    const fileName = `batches_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportBatches error:', err);
    return fail(res, '导出批次失败');
  }
}
