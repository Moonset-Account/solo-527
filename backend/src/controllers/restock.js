import prisma from '../utils/prisma.js';
import { success, fail, notFound, paginate } from '../utils/response.js';
import dayjs from 'dayjs';

function generateOrderNo(prefix) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${rand}`;
}

export async function getRestockSuggestions(req, res) {
  try {
    const { page = 1, pageSize = 20, status, categoryId, keyword, supplierId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = Number(supplierId);

    const productWhere = {};
    if (categoryId) productWhere.categoryId = Number(categoryId);
    if (keyword) {
      productWhere.OR = [
        { sku: { contains: keyword } },
        { name: { contains: keyword } },
      ];
    }

    const productFilter = Object.keys(productWhere).length ? productWhere : undefined;

    const baseWhere = {
      ...where,
      product: productFilter,
    };

    const [total, list] = await Promise.all([
      prisma.restockSuggestion.count({ where: baseWhere }),
      prisma.restockSuggestion.findMany({
        where: baseWhere,
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: { generatedAt: 'desc' },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
              preferredSupplier: { select: { id: true, code: true, name: true } },
              suppliers: {
                include: { supplier: { select: { id: true, code: true, name: true } } },
                where: { isPreferred: true },
                take: 1,
              },
            },
          },
        },
      }),
    ]);

    return success(res, paginate(list, page, pageSize, total), '获取补货建议列表成功');
  } catch (err) {
    console.error('getRestockSuggestions error:', err);
    return fail(res, '获取补货建议列表失败: ' + err.message);
  }
}

export async function generateRestockSuggestions(req, res) {
  try {
    const userId = req.user.id;
    const { categoryId, productIds, safetyDays = 7 } = req.body;

    const productWhere = { isActive: true };
    if (categoryId) productWhere.categoryId = Number(categoryId);
    if (productIds && productIds.length) {
      productWhere.id = { in: productIds.map(Number) };
    }

    const products = await prisma.product.findMany({
      where: productWhere,
      include: {
        inventory: true,
        preferredSupplier: true,
        suppliers: {
          where: { isPreferred: true },
          include: { supplier: true },
          take: 1,
        },
      },
    });

    const outboundItems = await prisma.outboundItem.findMany({
      where: {
        createdAt: {
          gte: dayjs().subtract(30, 'day').toDate(),
        },
        shippedQty: { gt: 0 },
      },
      select: {
        productId: true,
        shippedQty: true,
        createdAt: true,
      },
    });

    const usageMap = {};
    for (const oi of outboundItems) {
      if (!usageMap[oi.productId]) usageMap[oi.productId] = 0;
      usageMap[oi.productId] += Number(oi.shippedQty);
    }

    const suggestions = [];
    for (const p of products) {
      const currentStock = p.inventory.reduce(
        (sum, i) => sum + Number(i.availableQty),
        0
      );
      const minStock = Number(p.minStock);

      if (currentStock > minStock) continue;

      const avgDailyUsage = usageMap[p.id] ? usageMap[p.id] / 30 : minStock / 30;
      const safeDays = Number(safetyDays) || 7;

      const leadTime = p.suppliers[0]?.leadTimeDays || p.defaultPrice ? 3 : 7;
      const suggestedQty = Math.max(
        0,
        Math.ceil(avgDailyUsage * (leadTime + safeDays) + minStock - currentStock)
      );

      if (suggestedQty <= 0) continue;

      const supplier = p.suppliers[0]?.supplier || p.preferredSupplier;

      suggestions.push({
        productId: p.id,
        currentStock: Number(currentStock.toFixed(2)),
        minStock,
        suggestedQty,
        avgDailyUsage: Number(avgDailyUsage.toFixed(4)),
        leadTimeDays: leadTime,
        supplierId: supplier?.id || null,
        status: 'PENDING',
      });
    }

    await prisma.restockSuggestion.deleteMany({
      where: { status: 'PENDING' },
    });

    let createdCount = 0;
    if (suggestions.length > 0) {
      const result = await prisma.restockSuggestion.createMany({
        data: suggestions,
      });
      createdCount = result.count;
    }

    return success(
      res,
      {
        generatedCount: createdCount,
        productsChecked: products.length,
        safetyDays: Number(safetyDays),
      },
      '生成补货建议成功'
    );
  } catch (err) {
    console.error('generateRestockSuggestions error:', err);
    return fail(res, '生成补货建议失败: ' + err.message);
  }
}

export async function handleSuggestionAction(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { action, remark, quantity, unitPrice, supplierId, expectedDate } = req.body;

    if (!action || !['CREATE_PO', 'IGNORE'].includes(action)) {
      return fail(res, 'action 参数必须为 CREATE_PO 或 IGNORE');
    }

    const suggestion = await prisma.restockSuggestion.findUnique({
      where: { id: Number(id) },
      include: {
        product: {
          include: {
            suppliers: {
              where: { isPreferred: true },
              include: { supplier: true },
              take: 1,
            },
            preferredSupplier: true,
          },
        },
      },
    });

    if (!suggestion) return notFound(res, '补货建议不存在');
    if (suggestion.status !== 'PENDING') {
      return fail(res, `该建议状态为 ${suggestion.status}，无法操作`);
    }

    if (action === 'IGNORE') {
      const updated = await prisma.restockSuggestion.update({
        where: { id: Number(id) },
        data: {
          status: 'IGNORED',
          handledAt: new Date(),
          remark: remark || suggestion.remark,
        },
      });
      return success(res, updated, '已忽略该补货建议');
    }

    const finalSupplierId = Number(supplierId)
      || suggestion.supplierId
      || suggestion.product.suppliers[0]?.supplierId
      || suggestion.product.preferredSupplierId;

    if (!finalSupplierId) {
      return fail(res, '无法确定供应商，请手动指定供应商');
    }

    const finalQty = Number(quantity) || suggestion.suggestedQty;
    const finalPrice = Number(unitPrice)
      || suggestion.product.suppliers[0]?.price
      || suggestion.product.defaultPrice
      || 0;
    const finalExpectedDate = expectedDate
      ? new Date(expectedDate)
      : dayjs().add(suggestion.leadTimeDays || 7, 'day').toDate();

    const result = await prisma.$transaction(async (tx) => {
      const orderNo = generateOrderNo('PO');

      const subtotal = Number((finalQty * finalPrice).toFixed(2));

      const po = await tx.purchaseOrder.create({
        data: {
          orderNo,
          supplierId: finalSupplierId,
          status: 'DRAFT',
          createdById: userId,
          expectedDate: finalExpectedDate,
          totalAmount: subtotal,
          totalQty: finalQty,
          remark: remark || `系统自动生成补货单: ${suggestion.product.name}`,
        },
      });

      await tx.purchaseOrderItem.create({
        data: {
          purchaseOrderId: po.id,
          productId: suggestion.productId,
          expectedQty: finalQty,
          unitPrice: finalPrice,
          subtotal,
          expectedDate: finalExpectedDate,
        },
      });

      const updatedSuggestion = await tx.restockSuggestion.update({
        where: { id: Number(id) },
        data: {
          status: 'PURCHASED',
          handledAt: new Date(),
          purchaseOrderId: po.id,
          remark: remark || suggestion.remark,
          suggestedQty: finalQty,
        },
      });

      return { purchaseOrder: po, suggestion: updatedSuggestion };
    });

    return success(res, result, '已生成采购单');
  } catch (err) {
    console.error('handleSuggestionAction error:', err);
    return fail(res, '操作失败: ' + err.message);
  }
}
