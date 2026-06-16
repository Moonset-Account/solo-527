import prisma from '../utils/prisma.js';
import { success, fail, paginate } from '../utils/response.js';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';

export async function getInventoryList(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      productId,
      categoryId,
      keyword,
      warehouseZone,
      lowStockOnly,
    } = req.query;

    const where = {};

    if (productId) where.productId = Number(productId);
    if (warehouseZone) where.warehouseZone = warehouseZone;

    if (categoryId || keyword) {
      where.product = {};
      if (categoryId) where.product.categoryId = Number(categoryId);
      if (keyword) {
        where.product.OR = [
          { name: { contains: keyword } },
          { sku: { contains: keyword } },
          { barcode: { contains: keyword } },
        ];
      }
    }

    if (lowStockOnly === 'true') {
      where.AND = [
        { totalQty: { gt: 0 } },
      ];
      where.product = where.product || {};
      where.product.minStock = { gt: 0 };
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const [total, list] = await Promise.all([
      prisma.inventory.count({ where }),
      prisma.inventory.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
    ]);

    const enrichedList = list.map((inv) => {
      const product = inv.product || {};
      const isLowStock = product.minStock && inv.totalQty < product.minStock;
      return {
        ...inv,
        isLowStock: Boolean(isLowStock),
      };
    });

    return success(res, paginate(enrichedList, page, pageSize, total));
  } catch (err) {
    console.error('getInventoryList error:', err);
    return fail(res, '获取库存列表失败');
  }
}

export async function adjustInventory(req, res) {
  const { id } = req.params;
  const { qty, type, reason, remark } = req.body;

  if (!qty || Number(qty) <= 0) {
    return fail(res, '调整数量必须大于 0');
  }
  if (!type || !['IN', 'OUT', 'DAMAGE', 'CHECK'].includes(type)) {
    return fail(res, '调整类型无效，支持: IN, OUT, DAMAGE, CHECK');
  }

  const inventory = await prisma.inventory.findUnique({
    where: { id: Number(id) },
  });
  if (!inventory) return fail(res, '库存记录不存在', 404);

  const deltaQty = Number(qty);
  const oldTotal = inventory.totalQty.toNumber();
  const oldAvailable = inventory.availableQty.toNumber();
  const oldDamaged = inventory.damagedQty.toNumber();

  let newTotal = oldTotal;
  let newAvailable = oldAvailable;
  let newDamaged = oldDamaged;

  switch (type) {
    case 'IN':
      newTotal += deltaQty;
      newAvailable += deltaQty;
      break;
    case 'OUT':
      if (newAvailable < deltaQty) {
        return fail(res, '可用库存不足');
      }
      newTotal -= deltaQty;
      newAvailable -= deltaQty;
      break;
    case 'DAMAGE':
      if (newAvailable < deltaQty) {
        return fail(res, '可用库存不足');
      }
      newAvailable -= deltaQty;
      newDamaged += deltaQty;
      break;
    case 'CHECK':
      newTotal = deltaQty;
      newAvailable = deltaQty - oldDamaged;
      if (newAvailable < 0) newAvailable = 0;
      break;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.update({
        where: { id: Number(id) },
        data: {
          totalQty: newTotal,
          availableQty: newAvailable,
          damagedQty: newDamaged,
          lastCheckedAt: new Date(),
        },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: `INVENTORY_${type}`,
          entityType: 'INVENTORY',
          entityId: Number(id),
          oldValue: {
            totalQty: oldTotal,
            availableQty: oldAvailable,
            damagedQty: oldDamaged,
          },
          newValue: {
            totalQty: newTotal,
            availableQty: newAvailable,
            damagedQty: newDamaged,
            delta: deltaQty,
            reason: reason || '',
            remark: remark || '',
          },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return updated;
    });

    return success(res, result, '库存调整成功');
  } catch (err) {
    console.error('adjustInventory error:', err);
    return fail(res, '库存调整失败');
  }
}

export async function batchAdjustInventory(req, res) {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return fail(res, '批量调整项不能为空');
  }

  const validTypes = ['IN', 'OUT', 'DAMAGE', 'CHECK'];
  for (const item of items) {
    if (!item.inventoryId || !item.qty || Number(item.qty) <= 0) {
      return fail(res, '每项需包含 inventoryId 和 qty(>0)');
    }
    if (!item.type || !validTypes.includes(item.type)) {
      return fail(res, '调整类型无效');
    }
  }

  try {
    const results = await prisma.$transaction(async (tx) => {
      const successes = [];
      const failures = [];

      for (const item of items) {
        try {
          const inv = await tx.inventory.findUnique({
            where: { id: Number(item.inventoryId) },
          });
          if (!inv) {
            failures.push({ inventoryId: item.inventoryId, error: '库存记录不存在' });
            continue;
          }

          const deltaQty = Number(item.qty);
          const oldTotal = inv.totalQty.toNumber();
          const oldAvailable = inv.availableQty.toNumber();
          const oldDamaged = inv.damagedQty.toNumber();
          let newTotal = oldTotal;
          let newAvailable = oldAvailable;
          let newDamaged = oldDamaged;
          let valid = true;

          switch (item.type) {
            case 'IN':
              newTotal += deltaQty;
              newAvailable += deltaQty;
              break;
            case 'OUT':
              if (newAvailable < deltaQty) { valid = false; }
              else { newTotal -= deltaQty; newAvailable -= deltaQty; }
              break;
            case 'DAMAGE':
              if (newAvailable < deltaQty) { valid = false; }
              else { newAvailable -= deltaQty; newDamaged += deltaQty; }
              break;
            case 'CHECK':
              newTotal = deltaQty;
              newAvailable = deltaQty - oldDamaged;
              if (newAvailable < 0) newAvailable = 0;
              break;
          }

          if (!valid) {
            failures.push({ inventoryId: item.inventoryId, error: '可用库存不足' });
            continue;
          }

          const updated = await tx.inventory.update({
            where: { id: Number(item.inventoryId) },
            data: {
              totalQty: newTotal,
              availableQty: newAvailable,
              damagedQty: newDamaged,
              lastCheckedAt: new Date(),
            },
          });

          await tx.auditLog.create({
            data: {
              userId: req.user.id,
              action: `INVENTORY_BATCH_${item.type}`,
              entityType: 'INVENTORY',
              entityId: Number(item.inventoryId),
              oldValue: {
                totalQty: oldTotal, availableQty: oldAvailable, damagedQty: oldDamaged,
              },
              newValue: {
                totalQty: newTotal, availableQty: newAvailable, damagedQty: newDamaged,
                delta: deltaQty, reason: item.reason || '', remark: item.remark || '',
              },
              ip: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });

          successes.push({ inventoryId: item.inventoryId, id: updated.id });
        } catch (e) {
          failures.push({ inventoryId: item.inventoryId, error: e.message });
        }
      }

      return { successes, failures };
    });

    return success(res, results, `批量调整完成: 成功 ${results.successes.length}，失败 ${results.failures.length}`);
  } catch (err) {
    console.error('batchAdjustInventory error:', err);
    return fail(res, '批量调整库存失败');
  }
}

export async function getInventoryAlerts(req, res) {
  try {
    const { type, page = 1, pageSize = 50 } = req.query;
    const alerts = [];

    const lowStockWhere = {
      product: { minStock: { gt: 0 }, isActive: true },
    };
    const lowStockList = await prisma.inventory.findMany({
      where: lowStockWhere,
      include: {
        product: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
    });
    for (const inv of lowStockList) {
      const p = inv.product;
      if (p.minStock && inv.totalQty < p.minStock) {
        if (!type || type === 'LOW_STOCK') {
          alerts.push({
            id: `LOW_${inv.id}`,
            type: 'LOW_STOCK',
            level: inv.totalQty < p.minStock.div(2) ? 'high' : 'medium',
            title: `${p.name} 库存不足`,
            content: `当前库存 ${inv.totalQty} ${p.unit}，低于最低值 ${p.minStock} ${p.unit}`,
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            categoryName: p.category?.name,
            warehouseZone: inv.warehouseZone,
            currentQty: inv.totalQty.toNumber(),
            threshold: p.minStock.toNumber(),
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    const now = dayjs();
    const batchList = await prisma.batch.findMany({
      where: { status: { in: ['NORMAL', 'NEAR_EXPIRY'] }, remainingQty: { gt: 0 } },
      include: {
        product: {
          include: { category: { select: { id: true, name: true } } },
        },
        supplier: { select: { id: true, name: true } },
      },
    });

    for (const batch of batchList) {
      const diffDays = dayjs(batch.expiryDate).diff(now, 'day');
      const warningDays = batch.product.warningDays || 7;

      if (diffDays < 0) {
        if (!type || type === 'EXPIRED') {
          alerts.push({
            id: `EXP_${batch.id}`,
            type: 'EXPIRED',
            level: 'high',
            title: `${batch.product.name} 批次已过期`,
            content: `批次 ${batch.batchNo} 已于 ${dayjs(batch.expiryDate).format('YYYY-MM-DD')} 过期，剩余 ${batch.remainingQty} ${batch.product.unit}`,
            batchId: batch.id,
            batchNo: batch.batchNo,
            productId: batch.product.id,
            productName: batch.product.name,
            supplierName: batch.supplier?.name,
            remainingQty: batch.remainingQty.toNumber(),
            expiryDate: batch.expiryDate,
            daysOverdue: Math.abs(diffDays),
            createdAt: new Date().toISOString(),
          });
        }
      } else if (diffDays <= warningDays) {
        if (!type || type === 'NEAR_EXPIRY') {
          alerts.push({
            id: `NEAR_${batch.id}`,
            type: 'NEAR_EXPIRY',
            level: diffDays <= 2 ? 'high' : 'medium',
            title: `${batch.product.name} 批次即将到期`,
            content: `批次 ${batch.batchNo} 将于 ${dayjs(batch.expiryDate).format('YYYY-MM-DD')} 到期，还剩 ${diffDays} 天，剩余 ${batch.remainingQty} ${batch.product.unit}`,
            batchId: batch.id,
            batchNo: batch.batchNo,
            productId: batch.product.id,
            productName: batch.product.name,
            supplierName: batch.supplier?.name,
            remainingQty: batch.remainingQty.toNumber(),
            expiryDate: batch.expiryDate,
            daysRemaining: diffDays,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    alerts.sort((a, b) => {
      const levelOrder = { high: 0, medium: 1, low: 2 };
      return (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3);
    });

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);
    const total = alerts.length;
    const pagedList = alerts.slice(skip, skip + take);

    return success(res, paginate(pagedList, page, pageSize, total));
  } catch (err) {
    console.error('getInventoryAlerts error:', err);
    return fail(res, '获取库存预警失败');
  }
}

export async function exportInventory(req, res) {
  try {
    const { productId, categoryId, warehouseZone, lowStockOnly } = req.query;

    const where = {};
    if (productId) where.productId = Number(productId);
    if (warehouseZone) where.warehouseZone = warehouseZone;

    if (categoryId) {
      where.product = { categoryId: Number(categoryId) };
    }
    if (lowStockOnly === 'true') {
      where.product = where.product || {};
      where.product.minStock = { gt: 0 };
    }

    const list = await prisma.inventory.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('库存清单');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: '商品编码', key: 'sku', width: 18 },
      { header: '商品名称', key: 'name', width: 28 },
      { header: '分类', key: 'category', width: 14 },
      { header: '单位', key: 'unit', width: 8 },
      { header: '库区', key: 'zone', width: 12 },
      { header: '库位', key: 'location', width: 14 },
      { header: '总库存', key: 'totalQty', width: 12 },
      { header: '可用库存', key: 'availableQty', width: 12 },
      { header: '预留库存', key: 'reservedQty', width: 12 },
      { header: '损坏库存', key: 'damagedQty', width: 12 },
      { header: '最低库存', key: 'minStock', width: 12 },
      { header: '库存状态', key: 'status', width: 12 },
      { header: '更新时间', key: 'updatedAt', width: 20 },
    ];

    for (const inv of list) {
      const p = inv.product || {};
      const isLow = p.minStock && inv.totalQty < p.minStock ? '库存不足' : '正常';
      sheet.addRow({
        id: inv.id,
        sku: p.sku || '',
        name: p.name || '',
        category: p.category?.name || '',
        unit: p.unit || '',
        zone: inv.warehouseZone,
        location: inv.location || '',
        totalQty: inv.totalQty.toNumber(),
        availableQty: inv.availableQty.toNumber(),
        reservedQty: inv.reservedQty.toNumber(),
        damagedQty: inv.damagedQty.toNumber(),
        minStock: p.minStock ? p.minStock.toNumber() : 0,
        status: isLow,
        updatedAt: dayjs(inv.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
      });
    }

    const fileName = `inventory_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportInventory error:', err);
    return fail(res, '导出库存失败');
  }
}
