import prisma from '../utils/prisma.js';
import { fail } from '../utils/response.js';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

function setupDownloadHeaders(res, filename) {
  const encoded = encodeURIComponent(filename);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

function createWorkbook() {
  return new ExcelJS.Workbook();
}

function addColumns(worksheet, columns) {
  worksheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width || 20,
  }));
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
}

function addRows(worksheet, rows) {
  rows.forEach((row, idx) => {
    const r = worksheet.addRow(row);
    r.alignment = { vertical: 'middle', wrapText: true };
    r.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };
    });
  });
}

export async function exportInventory(req, res) {
  try {
    const { categoryId, warehouseZone, keyword, lowStockOnly } = req.query;

    const where = {};
    if (warehouseZone) where.warehouseZone = warehouseZone;

    const productWhere = {};
    if (categoryId) productWhere.categoryId = Number(categoryId);
    if (keyword) {
      productWhere.OR = [
        { sku: { contains: keyword } },
        { name: { contains: keyword } },
        { barcode: { contains: keyword } },
      ];
    }

    const inventoryList = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
            preferredSupplier: { select: { id: true, code: true, name: true } },
          },
          where: Object.keys(productWhere).length ? productWhere : undefined,
        },
      },
    });

    const filtered = inventoryList
      .filter((i) => i.product)
      .filter((i) => !lowStockOnly || Number(i.availableQty) <= Number(i.product.minStock));

    const wb = createWorkbook();
    const ws = wb.addWorksheet('库存明细');

    addColumns(ws, [
      { header: 'SKU', key: 'sku', width: 18 },
      { header: '商品名称', key: 'name', width: 28 },
      { header: '分类', key: 'category', width: 14 },
      { header: '单位', key: 'unit', width: 8 },
      { header: '库区', key: 'warehouseZone', width: 12 },
      { header: '库位', key: 'location', width: 14 },
      { header: '总库存', key: 'totalQty', width: 12 },
      { header: '可用库存', key: 'availableQty', width: 12 },
      { header: '预留库存', key: 'reservedQty', width: 12 },
      { header: '破损库存', key: 'damagedQty', width: 12 },
      { header: '最低库存', key: 'minStock', width: 12 },
      { header: '库存状态', key: 'status', width: 12 },
      { header: '优选供应商', key: 'supplier', width: 20 },
      { header: '最近盘点', key: 'lastCheckedAt', width: 18 },
    ]);

    const rows = filtered.map((i) => {
      const avail = Number(i.availableQty);
      const min = Number(i.product.minStock);
      let status = '正常';
      if (avail <= 0) status = '缺货';
      else if (avail <= min) status = '低库存';
      return {
        sku: i.product.sku,
        name: i.product.name,
        category: i.product.category?.name || '-',
        unit: i.product.unit,
        warehouseZone: i.warehouseZone,
        location: i.location || '-',
        totalQty: Number(i.totalQty),
        availableQty: avail,
        reservedQty: Number(i.reservedQty),
        damagedQty: Number(i.damagedQty),
        minStock: min,
        status,
        supplier: i.product.preferredSupplier?.name || '-',
        lastCheckedAt: i.lastCheckedAt ? dayjs(i.lastCheckedAt).format('YYYY-MM-DD HH:mm') : '-',
      };
    });

    addRows(ws, rows);

    const filename = `库存明细_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    setupDownloadHeaders(res, filename);

    const buffer = await wb.xlsx.writeBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('exportInventory error:', err);
    return fail(res, '导出库存失败: ' + err.message);
  }
}

export async function exportBatches(req, res) {
  try {
    const { productId, supplierId, status, nearExpiryDays, keyword } = req.query;

    const where = {};
    if (productId) where.productId = Number(productId);
    if (supplierId) where.supplierId = Number(supplierId);
    if (status) where.status = status;
    if (nearExpiryDays) {
      const d = new Date();
      d.setDate(d.getDate() + Number(nearExpiryDays));
      where.expiryDate = { lte: d };
    }

    const productWhere = {};
    if (keyword) {
      productWhere.OR = [
        { sku: { contains: keyword } },
        { name: { contains: keyword } },
      ];
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        product: {
          include: { category: { select: { id: true, name: true } } },
          where: Object.keys(productWhere).length ? productWhere : undefined,
        },
        supplier: { select: { id: true, code: true, name: true } },
      },
    });

    const filtered = batches.filter((b) => b.product);

    const wb = createWorkbook();
    const ws = wb.addWorksheet('批次明细');

    addColumns(ws, [
      { header: '批次号', key: 'batchNo', width: 22 },
      { header: 'SKU', key: 'sku', width: 16 },
      { header: '商品名称', key: 'productName', width: 28 },
      { header: '分类', key: 'category', width: 14 },
      { header: '供应商', key: 'supplier', width: 22 },
      { header: '数量', key: 'qty', width: 12 },
      { header: '剩余数量', key: 'remainingQty', width: 12 },
      { header: '锁定数量', key: 'lockedQty', width: 12 },
      { header: '生产日期', key: 'produceDate', width: 14 },
      { header: '过期日期', key: 'expiryDate', width: 14 },
      { header: '入库日期', key: 'inboundDate', width: 14 },
      { header: '剩余天数', key: 'daysLeft', width: 12 },
      { header: '状态', key: 'status', width: 12 },
      { header: '质检状态', key: 'qcStatus', width: 12 },
      { header: '备注', key: 'remark', width: 20 },
    ]);

    const now = new Date();
    const rows = filtered.map((b) => {
      const daysLeft = Math.ceil((b.expiryDate - now) / (1000 * 60 * 60 * 24));
      return {
        batchNo: b.batchNo,
        sku: b.product.sku,
        productName: b.product.name,
        category: b.product.category?.name || '-',
        supplier: b.supplier?.name || '-',
        qty: Number(b.qty),
        remainingQty: Number(b.remainingQty),
        lockedQty: Number(b.lockedQty),
        produceDate: b.produceDate ? dayjs(b.produceDate).format('YYYY-MM-DD') : '-',
        expiryDate: dayjs(b.expiryDate).format('YYYY-MM-DD'),
        inboundDate: b.inboundDate ? dayjs(b.inboundDate).format('YYYY-MM-DD') : '-',
        daysLeft,
        status: b.status,
        qcStatus: b.qcStatus,
        remark: b.remark || '-',
      };
    });

    addRows(ws, rows);

    const filename = `批次明细_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    setupDownloadHeaders(res, filename);

    const buffer = await wb.xlsx.writeBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('exportBatches error:', err);
    return fail(res, '导出批次失败: ' + err.message);
  }
}

export async function exportPurchase(req, res) {
  try {
    const { status, supplierId, startDate, endDate } = req.query;

    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = Number(supplierId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, realName: true, username: true } },
        assignedTo: { select: { id: true, realName: true } },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true, unit: true } },
          },
        },
      },
    });

    const wb = createWorkbook();
    const ws = wb.addWorksheet('采购单明细');

    addColumns(ws, [
      { header: '采购单号', key: 'orderNo', width: 20 },
      { header: '状态', key: 'status', width: 16 },
      { header: '供应商', key: 'supplier', width: 22 },
      { header: '商品SKU', key: 'sku', width: 16 },
      { header: '商品名称', key: 'productName', width: 26 },
      { header: '单位', key: 'unit', width: 8 },
      { header: '预计数量', key: 'expectedQty', width: 12 },
      { header: '确认数量', key: 'confirmedQty', width: 12 },
      { header: '已交付', key: 'deliveredQty', width: 12 },
      { header: '单价', key: 'unitPrice', width: 12 },
      { header: '小计金额', key: 'subtotal', width: 14 },
      { header: '预计到货', key: 'expectedDate', width: 14 },
      { header: '采购金额', key: 'totalAmount', width: 14 },
      { header: '采购数量', key: 'totalQty', width: 12 },
      { header: '紧急级别', key: 'urgentLevel', width: 10 },
      { header: '创建人', key: 'createdBy', width: 14 },
      { header: '跟进人', key: 'assignedTo', width: 14 },
      { header: '创建时间', key: 'createdAt', width: 18 },
    ]);

    const rows = [];
    for (const po of orders) {
      if (po.items.length === 0) {
        rows.push({
          orderNo: po.orderNo,
          status: po.status,
          supplier: po.supplier?.name || '-',
          sku: '',
          productName: '',
          unit: '',
          expectedQty: '',
          confirmedQty: '',
          deliveredQty: '',
          unitPrice: '',
          subtotal: '',
          expectedDate: '',
          totalAmount: Number(po.totalAmount),
          totalQty: Number(po.totalQty),
          urgentLevel: po.urgentLevel,
          createdBy: po.createdBy?.realName || po.createdBy?.username || '-',
          assignedTo: po.assignedTo?.realName || '-',
          createdAt: dayjs(po.createdAt).format('YYYY-MM-DD HH:mm'),
        });
      } else {
        for (const item of po.items) {
          rows.push({
            orderNo: po.orderNo,
            status: po.status,
            supplier: po.supplier?.name || '-',
            sku: item.product?.sku || '-',
            productName: item.product?.name || '-',
            unit: item.product?.unit || '-',
            expectedQty: Number(item.expectedQty),
            confirmedQty: item.confirmedQty ? Number(item.confirmedQty) : '-',
            deliveredQty: Number(item.deliveredQty),
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            expectedDate: item.expectedDate ? dayjs(item.expectedDate).format('YYYY-MM-DD') : '-',
            totalAmount: Number(po.totalAmount),
            totalQty: Number(po.totalQty),
            urgentLevel: po.urgentLevel,
            createdBy: po.createdBy?.realName || po.createdBy?.username || '-',
            assignedTo: po.assignedTo?.realName || '-',
            createdAt: dayjs(po.createdAt).format('YYYY-MM-DD HH:mm'),
          });
        }
      }
    }

    addRows(ws, rows);

    const filename = `采购单明细_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    setupDownloadHeaders(res, filename);

    const buffer = await wb.xlsx.writeBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('exportPurchase error:', err);
    return fail(res, '导出采购单失败: ' + err.message);
  }
}

export async function exportInbound(req, res) {
  try {
    const { status, supplierId, startDate, endDate } = req.query;

    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = Number(supplierId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await prisma.inboundOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        purchaseOrder: { select: { id: true, orderNo: true } },
        createdBy: { select: { id: true, realName: true, username: true } },
        handledBy: { select: { id: true, realName: true } },
        qcBy: { select: { id: true, realName: true } },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true, unit: true } },
            batch: { select: { id: true, batchNo: true } },
          },
        },
      },
    });

    const wb = createWorkbook();
    const ws = wb.addWorksheet('入库单明细');

    addColumns(ws, [
      { header: '入库单号', key: 'orderNo', width: 20 },
      { header: '状态', key: 'status', width: 14 },
      { header: '关联采购单', key: 'purchaseOrderNo', width: 20 },
      { header: '供应商', key: 'supplier', width: 22 },
      { header: '商品SKU', key: 'sku', width: 16 },
      { header: '商品名称', key: 'productName', width: 26 },
      { header: '单位', key: 'unit', width: 8 },
      { header: '批次号', key: 'batchNo', width: 22 },
      { header: '应收数量', key: 'expectedQty', width: 12 },
      { header: '实收数量', key: 'actualQty', width: 12 },
      { header: '合格数量', key: 'acceptedQty', width: 12 },
      { header: '不合格数量', key: 'rejectedQty', width: 12 },
      { header: '拒收原因', key: 'rejectReason', width: 18 },
      { header: '质检备注', key: 'qcRemark', width: 18 },
      { header: '总数量', key: 'totalQty', width: 12 },
      { header: '合格数', key: 'acceptedTotal', width: 12 },
      { header: '不合格数', key: 'rejectedTotal', width: 12 },
      { header: '到货时间', key: 'arrivedAt', width: 18 },
      { header: '质检时间', key: 'qcAt', width: 18 },
      { header: '完成时间', key: 'completedAt', width: 18 },
      { header: '司机', key: 'driverName', width: 12 },
      { header: '车牌', key: 'vehicleNo', width: 12 },
      { header: '创建人', key: 'createdBy', width: 14 },
      { header: '处理人', key: 'handledBy', width: 14 },
      { header: '质检人', key: 'qcBy', width: 14 },
    ]);

    const rows = [];
    for (const io of orders) {
      if (io.items.length === 0) {
        rows.push({
          orderNo: io.orderNo,
          status: io.status,
          purchaseOrderNo: io.purchaseOrder?.orderNo || '-',
          supplier: io.supplier?.name || '-',
          sku: '',
          productName: '',
          unit: '',
          batchNo: '',
          expectedQty: '',
          actualQty: '',
          acceptedQty: '',
          rejectedQty: '',
          rejectReason: '',
          qcRemark: '',
          totalQty: Number(io.totalQty),
          acceptedTotal: Number(io.acceptedQty),
          rejectedTotal: Number(io.rejectedQty),
          arrivedAt: io.arrivedAt ? dayjs(io.arrivedAt).format('YYYY-MM-DD HH:mm') : '-',
          qcAt: io.qcAt ? dayjs(io.qcAt).format('YYYY-MM-DD HH:mm') : '-',
          completedAt: io.completedAt ? dayjs(io.completedAt).format('YYYY-MM-DD HH:mm') : '-',
          driverName: io.driverName || '-',
          vehicleNo: io.vehicleNo || '-',
          createdBy: io.createdBy?.realName || io.createdBy?.username || '-',
          handledBy: io.handledBy?.realName || '-',
          qcBy: io.qcBy?.realName || '-',
        });
      } else {
        for (const item of io.items) {
          rows.push({
            orderNo: io.orderNo,
            status: io.status,
            purchaseOrderNo: io.purchaseOrder?.orderNo || '-',
            supplier: io.supplier?.name || '-',
            sku: item.product?.sku || '-',
            productName: item.product?.name || '-',
            unit: item.product?.unit || '-',
            batchNo: item.batch?.batchNo || '-',
            expectedQty: Number(item.expectedQty),
            actualQty: Number(item.actualQty),
            acceptedQty: Number(item.acceptedQty),
            rejectedQty: Number(item.rejectedQty),
            rejectReason: item.rejectReason || '-',
            qcRemark: item.qcRemark || '-',
            totalQty: Number(io.totalQty),
            acceptedTotal: Number(io.acceptedQty),
            rejectedTotal: Number(io.rejectedQty),
            arrivedAt: io.arrivedAt ? dayjs(io.arrivedAt).format('YYYY-MM-DD HH:mm') : '-',
            qcAt: io.qcAt ? dayjs(io.qcAt).format('YYYY-MM-DD HH:mm') : '-',
            completedAt: io.completedAt ? dayjs(io.completedAt).format('YYYY-MM-DD HH:mm') : '-',
            driverName: io.driverName || '-',
            vehicleNo: io.vehicleNo || '-',
            createdBy: io.createdBy?.realName || io.createdBy?.username || '-',
            handledBy: io.handledBy?.realName || '-',
            qcBy: io.qcBy?.realName || '-',
          });
        }
      }
    }

    addRows(ws, rows);

    const filename = `入库单明细_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    setupDownloadHeaders(res, filename);

    const buffer = await wb.xlsx.writeBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('exportInbound error:', err);
    return fail(res, '导出入库单失败: ' + err.message);
  }
}

export async function exportException(req, res) {
  try {
    const { status, type, supplierId, handlerId, startDate, endDate } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (supplierId) where.supplierId = Number(supplierId);
    if (handlerId) where.handlerId = Number(handlerId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const exceptions = await prisma.exceptionRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, sku: true, name: true } },
        purchaseOrder: { select: { id: true, orderNo: true } },
        inboundOrder: { select: { id: true, orderNo: true } },
        batch: { select: { id: true, batchNo: true } },
        createdBy: { select: { id: true, realName: true, username: true } },
        handler: { select: { id: true, realName: true, username: true } },
      },
    });

    const wb = createWorkbook();
    const ws = wb.addWorksheet('异常记录');

    addColumns(ws, [
      { header: '异常编号', key: 'exceptionNo', width: 22 },
      { header: '类型', key: 'type', width: 16 },
      { header: '标题', key: 'title', width: 26 },
      { header: '状态', key: 'status', width: 14 },
      { header: '优先级', key: 'priority', width: 10 },
      { header: '描述', key: 'description', width: 36 },
      { header: '关联供应商', key: 'supplier', width: 20 },
      { header: '关联商品', key: 'product', width: 22 },
      { header: '关联批次', key: 'batchNo', width: 22 },
      { header: '关联采购单', key: 'purchaseOrderNo', width: 20 },
      { header: '关联入库单', key: 'inboundOrderNo', width: 20 },
      { header: '影响数量', key: 'affectedQty', width: 12 },
      { header: '损失金额', key: 'lossAmount', width: 14 },
      { header: '处理方案', key: 'resolution', width: 28 },
      { header: '处理人', key: 'handler', width: 14 },
      { header: '创建人', key: 'createdBy', width: 14 },
      { header: '创建时间', key: 'createdAt', width: 18 },
      { header: '解决时间', key: 'resolvedAt', width: 18 },
      { header: 'SLA截止', key: 'slaDueAt', width: 18 },
    ]);

    const priorityMap = { 1: '低', 2: '中', 3: '高' };
    const rows = exceptions.map((e) => ({
      exceptionNo: e.exceptionNo,
      type: e.type,
      title: e.title,
      status: e.status,
      priority: priorityMap[e.priority] || e.priority,
      description: e.description,
      supplier: e.supplier?.name || '-',
      product: e.product ? `${e.product.sku} ${e.product.name}` : '-',
      batchNo: e.batch?.batchNo || '-',
      purchaseOrderNo: e.purchaseOrder?.orderNo || '-',
      inboundOrderNo: e.inboundOrder?.orderNo || '-',
      affectedQty: e.affectedQty ? Number(e.affectedQty) : '-',
      lossAmount: e.lossAmount ? Number(e.lossAmount) : '-',
      resolution: e.resolution || '-',
      handler: e.handler?.realName || e.handler?.username || '-',
      createdBy: e.createdBy?.realName || e.createdBy?.username || '-',
      createdAt: dayjs(e.createdAt).format('YYYY-MM-DD HH:mm'),
      resolvedAt: e.resolvedAt ? dayjs(e.resolvedAt).format('YYYY-MM-DD HH:mm') : '-',
      slaDueAt: e.slaDueAt ? dayjs(e.slaDueAt).format('YYYY-MM-DD HH:mm') : '-',
    }));

    addRows(ws, rows);

    const filename = `异常记录_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    setupDownloadHeaders(res, filename);

    const buffer = await wb.xlsx.writeBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('exportException error:', err);
    return fail(res, '导出异常记录失败: ' + err.message);
  }
}
