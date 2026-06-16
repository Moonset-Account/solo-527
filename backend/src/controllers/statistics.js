import prisma from '../utils/prisma.js';
import { success, fail } from '../utils/response.js';
import dayjs from 'dayjs';

export async function getOverview(req, res) {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const [
      todayInboundCount,
      todayInboundQty,
      todayOutboundCount,
      todayOutboundQty,
      todayExceptionCount,
      unreadAlertCount,
      lowStockCount,
      nearExpiryCount,
    ] = await Promise.all([
      prisma.inboundOrder.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.inboundItem.aggregate({
        _sum: { actualQty: true },
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.outboundOrder.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.outboundItem.aggregate({
        _sum: { shippedQty: true },
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.exceptionRecord.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.alert.count({
        where: { targetUserId: req.user.id, status: 'UNREAD' },
      }),
      prisma.inventory.count({
        where: { availableQty: { lte: prisma.inventory.fields.totalQty.times ? 0 : 0 } },
      }),
      prisma.batch.count({
        where: {
          expiryDate: {
            gte: new Date(),
            lte: dayjs().add(30, 'day').toDate(),
          },
          remainingQty: { gt: 0 },
        },
      }),
    ]);

    const lowStockProducts = await prisma.$queryRaw`
      SELECT COUNT(*) as cnt
      FROM Inventory i
      JOIN Product p ON i.productId = p.id
      WHERE i.availableQty <= p.minStock
    `;

    const data = {
      todayInbound: {
        orderCount: todayInboundCount,
        totalQty: Number(todayInboundQty._sum.actualQty || 0),
      },
      todayOutbound: {
        orderCount: todayOutboundCount,
        totalQty: Number(todayOutboundQty._sum.shippedQty || 0),
      },
      todayException: todayExceptionCount,
      unreadAlerts: unreadAlertCount,
      lowStock: lowStockProducts[0]?.cnt || lowStockCount,
      nearExpiry: nearExpiryCount,
      reportDate: dayjs().format('YYYY-MM-DD'),
    };

    return success(res, data, '获取概览数据成功');
  } catch (err) {
    console.error('getOverview error:', err);
    return fail(res, '获取概览数据失败: ' + err.message);
  }
}

export async function getSupplierPerformance(req, res) {
  try {
    const { startDate, endDate, sortBy = 'totalOrders', sortOrder = 'desc' } = req.query;

    const dateWhere = {};
    if (startDate) dateWhere.gte = new Date(startDate);
    if (endDate) dateWhere.lte = new Date(endDate);

    const suppliers = await prisma.supplier.findMany({
      where: { status: 'ACTIVE' },
      include: {
        purchaseOrders: {
          where: Object.keys(dateWhere).length ? { createdAt: dateWhere } : undefined,
          include: { ratings: true },
        },
        inboundOrders: {
          where: Object.keys(dateWhere).length ? { createdAt: dateWhere } : undefined,
        },
        exceptions: {
          where: Object.keys(dateWhere).length ? { createdAt: dateWhere } : undefined,
        },
        ratings: {
          where: Object.keys(dateWhere).length ? { createdAt: dateWhere } : undefined,
        },
      },
    });

    const supplierStats = suppliers.map((s) => {
      const totalOrders = s.purchaseOrders.length;
      const onTimeOrders = s.purchaseOrders.filter((po) => {
        if (!po.expectedDate || !po.closedAt) return false;
        return po.closedAt <= po.expectedDate;
      }).length;
      const onTimeRate = totalOrders > 0 ? (onTimeOrders / totalOrders) * 100 : 0;

      const totalInboundItems = s.inboundOrders.reduce((sum, io) => {
        const accepted = io.acceptedQty ? Number(io.acceptedQty) : 0;
        const rejected = io.rejectedQty ? Number(io.rejectedQty) : 0;
        return sum + accepted + rejected;
      }, 0);
      const acceptedInboundItems = s.inboundOrders.reduce(
        (sum, io) => sum + Number(io.acceptedQty || 0),
        0
      );
      const qcPassRate = totalInboundItems > 0 ? (acceptedInboundItems / totalInboundItems) * 100 : 100;

      const totalRatings = s.ratings.length;
      const avgRating = totalRatings > 0
        ? s.ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings
        : Number(s.rating) || 0;

      const exceptionCount = s.exceptions.length;

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        level: s.level,
        totalOrders,
        onTimeOrders,
        onTimeRate: Number(onTimeRate.toFixed(2)),
        qcPassRate: Number(qcPassRate.toFixed(2)),
        avgRating: Number(avgRating.toFixed(2)),
        totalRatings,
        exceptionCount,
      };
    });

    supplierStats.sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      return (a[sortBy] ?? 0) > (b[sortBy] ?? 0) ? order : -order;
    });

    return success(res, { list: supplierStats }, '获取供应商绩效成功');
  } catch (err) {
    console.error('getSupplierPerformance error:', err);
    return fail(res, '获取供应商绩效失败: ' + err.message);
  }
}

export async function getExpiryAnalysis(req, res) {
  try {
    const batches = await prisma.batch.findMany({
      where: { remainingQty: { gt: 0 }, status: 'NORMAL' },
      include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
    });

    const now = new Date();
    const groups = {
      expired: [],
      within7Days: [],
      within15Days: [],
      within30Days: [],
      within90Days: [],
      over90Days: [],
    };

    const groupStats = {
      expired: { count: 0, totalQty: 0, skuCount: 0 },
      within7Days: { count: 0, totalQty: 0, skuCount: 0 },
      within15Days: { count: 0, totalQty: 0, skuCount: 0 },
      within30Days: { count: 0, totalQty: 0, skuCount: 0 },
      within90Days: { count: 0, totalQty: 0, skuCount: 0 },
      over90Days: { count: 0, totalQty: 0, skuCount: 0 },
    };

    for (const b of batches) {
      const daysLeft = Math.ceil((b.expiryDate - now) / (1000 * 60 * 60 * 24));
      const qty = Number(b.remainingQty);

      let groupKey;
      if (daysLeft <= 0) groupKey = 'expired';
      else if (daysLeft <= 7) groupKey = 'within7Days';
      else if (daysLeft <= 15) groupKey = 'within15Days';
      else if (daysLeft <= 30) groupKey = 'within30Days';
      else if (daysLeft <= 90) groupKey = 'within90Days';
      else groupKey = 'over90Days';

      groups[groupKey].push({
        id: b.id,
        batchNo: b.batchNo,
        productId: b.productId,
        productSku: b.product?.sku,
        productName: b.product?.name,
        qty,
        unit: b.product?.unit,
        expiryDate: b.expiryDate,
        daysLeft,
      });

      groupStats[groupKey].count += 1;
      groupStats[groupKey].totalQty += qty;
    }

    for (const key of Object.keys(groupStats)) {
      const skuIds = new Set(groups[key].map((g) => g.productId));
      groupStats[key].skuCount = skuIds.size;
      groupStats[key].totalQty = Number(groupStats[key].totalQty.toFixed(2));
    }

    return success(
      res,
      {
        groups,
        summary: groupStats,
        totalBatches: batches.length,
      },
      '获取效期分析成功'
    );
  } catch (err) {
    console.error('getExpiryAnalysis error:', err);
    return fail(res, '获取效期分析失败: ' + err.message);
  }
}

export async function getExceptionEfficiency(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };

    const exceptions = await prisma.exceptionRecord.findMany({
      where,
      include: {
        handler: { select: { id: true, realName: true, username: true } },
      },
    });

    let totalDuration = 0;
    let resolvedCount = 0;

    const byType = {};
    const byHandler = {};

    for (const e of exceptions) {
      let duration = null;
      if (e.resolvedAt) {
        duration = (e.resolvedAt - e.createdAt) / (1000 * 60 * 60);
        totalDuration += duration;
        resolvedCount += 1;
      }

      if (!byType[e.type]) {
        byType[e.type] = {
          type: e.type,
          total: 0,
          resolved: 0,
          avgDurationHours: 0,
          totalDurationHours: 0,
        };
      }
      byType[e.type].total += 1;
      if (e.resolvedAt) {
        byType[e.type].resolved += 1;
        byType[e.type].totalDurationHours += duration;
      }

      if (e.handlerId) {
        const key = String(e.handlerId);
        if (!byHandler[key]) {
          byHandler[key] = {
            handlerId: e.handlerId,
            handlerName: e.handler?.realName || e.handler?.username || '未知',
            total: 0,
            resolved: 0,
            avgDurationHours: 0,
            totalDurationHours: 0,
          };
        }
        byHandler[key].total += 1;
        if (e.resolvedAt) {
          byHandler[key].resolved += 1;
          byHandler[key].totalDurationHours += duration;
        }
      }
    }

    const avgDurationHours = resolvedCount > 0
      ? Number((totalDuration / resolvedCount).toFixed(2))
      : 0;

    for (const key of Object.keys(byType)) {
      byType[key].avgDurationHours = byType[key].resolved > 0
        ? Number((byType[key].totalDurationHours / byType[key].resolved).toFixed(2))
        : 0;
      byType[key].totalDurationHours = Number(byType[key].totalDurationHours.toFixed(2));
    }
    for (const key of Object.keys(byHandler)) {
      byHandler[key].avgDurationHours = byHandler[key].resolved > 0
        ? Number((byHandler[key].totalDurationHours / byHandler[key].resolved).toFixed(2))
        : 0;
      byHandler[key].totalDurationHours = Number(byHandler[key].totalDurationHours.toFixed(2));
    }

    const statusSummary = {
      OPEN: 0,
      IN_PROGRESS: 0,
      PENDING_SUPPLIER: 0,
      RESOLVED: 0,
      CLOSED: 0,
      ESCALATED: 0,
    };
    for (const e of exceptions) {
      if (statusSummary[e.status] !== undefined) statusSummary[e.status] += 1;
    }

    return success(
      res,
      {
        avgDurationHours,
        totalCount: exceptions.length,
        resolvedCount,
        statusSummary,
        byType: Object.values(byType),
        byHandler: Object.values(byHandler),
      },
      '获取异常处理效率成功'
    );
  } catch (err) {
    console.error('getExceptionEfficiency error:', err);
    return fail(res, '获取异常处理效率失败: ' + err.message);
  }
}

export async function getDailyTrend(req, res) {
  try {
    const { days = 30 } = req.query;
    const n = Math.min(Math.max(Number(days), 1), 90);

    const daysData = [];
    const start = dayjs().startOf('day');

    for (let i = n - 1; i >= 0; i--) {
      const d = start.subtract(i, 'day');
      daysData.push({
        date: d.format('YYYY-MM-DD'),
        dayStart: d.toDate(),
        dayEnd: d.endOf('day').toDate(),
      });
    }

    const result = [];
    for (const d of daysData) {
      const [inboundCount, outboundCount, exceptionCount, newPurchaseCount] = await Promise.all([
        prisma.inboundOrder.count({ where: { createdAt: { gte: d.dayStart, lte: d.dayEnd } } }),
        prisma.outboundOrder.count({ where: { createdAt: { gte: d.dayStart, lte: d.dayEnd } } }),
        prisma.exceptionRecord.count({ where: { createdAt: { gte: d.dayStart, lte: d.dayEnd } } }),
        prisma.purchaseOrder.count({ where: { createdAt: { gte: d.dayStart, lte: d.dayEnd } } }),
      ]);

      result.push({
        date: d.date,
        inbound: inboundCount,
        outbound: outboundCount,
        exception: exceptionCount,
        purchase: newPurchaseCount,
      });
    }

    return success(res, { list: result, days: n }, '获取每日趋势成功');
  } catch (err) {
    console.error('getDailyTrend error:', err);
    return fail(res, '获取每日趋势失败: ' + err.message);
  }
}
