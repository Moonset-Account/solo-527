const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getProducts(req, res) {
  try {
    const { page = 1, pageSize = 10, keyword, category, status, stockWarning } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { sku: { contains: keyword } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (stockWarning === 'true') {
      const warningProducts = await prisma.$queryRaw`
        SELECT id FROM Product WHERE stock < minStock
      `;
      const warningIds = warningProducts.map((p) => p.id);
      where.id = { in: warningIds };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    success(res, {
      list: products,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取产品列表失败', { error: err.message });
    error(res, '获取产品列表失败', 500);
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        stockLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return error(res, '产品不存在', 404);
    }

    success(res, product, '获取成功');
  } catch (err) {
    logger.error('获取产品详情失败', { error: err.message, id: req.params.id });
    error(res, '获取产品详情失败', 500);
  }
}

async function createProduct(req, res) {
  try {
    const { name, category, sku, unit, price, cost, stock, minStock, maxStock, image, description } = req.body;

    if (!name || !sku || !price || !unit) {
      return error(res, '产品名称、SKU、价格、单位不能为空', 400);
    }

    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return error(res, 'SKU已存在', 400);
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        sku,
        unit,
        price: Number(price),
        cost: cost ? Number(cost) : null,
        stock: stock ? Number(stock) : 0,
        minStock: minStock ? Number(minStock) : 0,
        maxStock: maxStock ? Number(maxStock) : null,
        image,
        description,
      },
    });

    if (stock && Number(stock) > 0) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          type: 'in',
          quantity: Number(stock),
          beforeStock: 0,
          afterStock: Number(stock),
          reason: '初始库存',
          operatorId: req.user?.id,
          relatedType: 'product_create',
          relatedId: product.id,
        },
      });
    }

    await logger.logOperation({
      userId: req.user?.id,
      action: 'create',
      module: 'product',
      targetId: product.id,
      targetType: 'product',
      detail: `创建产品: ${name}`,
      req,
    });

    success(res, product, '创建成功', 201);
  } catch (err) {
    logger.error('创建产品失败', { error: err.message });
    error(res, '创建产品失败', 500);
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, category, sku, unit, price, cost, minStock, maxStock, image, description, status } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return error(res, '产品不存在', 404);
    }

    if (sku && sku !== product.sku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku },
      });

      if (existingProduct) {
        return error(res, 'SKU已存在', 400);
      }
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        category,
        sku,
        unit,
        price: price !== undefined ? Number(price) : undefined,
        cost: cost !== undefined ? Number(cost) : undefined,
        minStock: minStock !== undefined ? Number(minStock) : undefined,
        maxStock: maxStock !== undefined ? Number(maxStock) : undefined,
        image,
        description,
        status,
      },
    });

    await logger.logOperation({
      userId: req.user?.id,
      action: 'update',
      module: 'product',
      targetId: Number(id),
      targetType: 'product',
      detail: `更新产品: ${name || product.name}`,
      req,
    });

    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新产品失败', { error: err.message, id: req.params.id });
    error(res, '更新产品失败', 500);
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return error(res, '产品不存在', 404);
    }

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    await logger.logOperation({
      userId: req.user?.id,
      action: 'delete',
      module: 'product',
      targetId: Number(id),
      targetType: 'product',
      detail: `删除产品: ${product.name}`,
      req,
    });

    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除产品失败', { error: err.message, id: req.params.id });
    error(res, '删除产品失败', 500);
  }
}

async function getStockSummary(req, res) {
  try {
    const [totalSkus, totalStock, warningResult, products] = await Promise.all([
      prisma.product.count({ where: { status: 'active' } }),
      prisma.product.aggregate({
        _sum: { stock: true },
        where: { status: 'active' },
      }),
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM Product 
        WHERE status = 'active' AND stock < minStock
      `,
      prisma.product.findMany({
        where: { status: 'active' },
        select: { stock: true, price: true, cost: true },
      }),
    ]);

    const warningCount = warningResult[0]?.count || 0;

    let totalValue = 0;
    let totalCostValue = 0;

    products.forEach((product) => {
      totalValue += product.stock * Number(product.price);
      if (product.cost) {
        totalCostValue += product.stock * Number(product.cost);
      }
    });

    success(res, {
      totalSkus,
      totalStock: totalStock._sum.stock || 0,
      warningCount: Number(warningCount),
      totalValue,
      totalCostValue,
    }, '获取成功');
  } catch (err) {
    logger.error('获取库存统计失败', { error: err.message });
    error(res, '获取库存统计失败', 500);
  }
}

async function adjustStock(req, res) {
  try {
    const { id } = req.params;
    const { type, quantity, reason, remark } = req.body;

    if (!type || !quantity) {
      return error(res, '调整类型和数量不能为空', 400);
    }

    if (!['in', 'out'].includes(type)) {
      return error(res, '调整类型只能是入库(in)或出库(out)', 400);
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return error(res, '调整数量必须大于0', 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return error(res, '产品不存在', 404);
    }

    const beforeStock = product.stock;
    let afterStock;

    if (type === 'in') {
      afterStock = beforeStock + qty;
    } else {
      if (beforeStock < qty) {
        return error(res, '库存不足', 400);
      }
      afterStock = beforeStock - qty;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: Number(id) },
        data: { stock: afterStock },
      });

      const stockLog = await tx.stockLog.create({
        data: {
          productId: Number(id),
          type,
          quantity: qty,
          beforeStock,
          afterStock,
          reason,
          operatorId: req.user?.id,
          relatedType: 'stock_adjust',
          remark,
        },
      });

      return { updatedProduct, stockLog };
    });

    await logger.logOperation({
      userId: req.user?.id,
      action: 'stock_adjust',
      module: 'product',
      targetId: Number(id),
      targetType: 'product',
      detail: `${type === 'in' ? '入库' : '出库'}: ${product.name}, 数量: ${qty}`,
      req,
    });

    success(res, result.updatedProduct, '库存调整成功');
  } catch (err) {
    logger.error('库存调整失败', { error: err.message, id: req.params.id });
    error(res, '库存调整失败', 500);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getStockSummary,
  adjustStock,
};
