import prisma from '../utils/prisma.js';
import { success, fail, notFound, paginate } from '../utils/response.js';

export async function getProducts(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const keyword = req.query.keyword || '';
    const { categoryId, supplierId, isActive } = req.query;

    const where = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { sku: { contains: keyword } },
        { barcode: { contains: keyword } },
        { spec: { contains: keyword } },
      ];
    }
    if (categoryId) where.categoryId = Number(categoryId);
    if (supplierId) {
      where.suppliers = {
        some: { supplierId: Number(supplierId) },
      };
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const total = await prisma.product.count({ where });
    const list = await prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, code: true } },
        preferredSupplier: { select: { id: true, name: true, code: true } },
        _count: {
          select: { inventory: true },
        },
      },
    });

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getProducts error:', err);
    return fail(res, '获取产品列表失败');
  }
}

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        preferredSupplier: { select: { id: true, name: true, code: true, phone: true } },
        suppliers: {
          include: {
            supplier: { select: { id: true, name: true, code: true, phone: true, rating: true } },
          },
        },
        inventory: {
          include: {
            batches: {
              where: { remainingQty: { gt: 0 } },
              orderBy: { expiryDate: 'asc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!product) return notFound(res, '产品不存在');
    return success(res, product);
  } catch (err) {
    console.error('getProductById error:', err);
    return fail(res, '获取产品详情失败');
  }
}

export async function getProductByBarcode(req, res) {
  try {
    const { code } = req.params;
    const product = await prisma.product.findFirst({
      where: { barcode: code },
      include: {
        category: { select: { id: true, name: true } },
        preferredSupplier: { select: { id: true, name: true, code: true } },
        suppliers: {
          include: {
            supplier: { select: { id: true, name: true, code: true } },
          },
        },
        inventory: true,
      },
    });

    if (!product) return notFound(res, '未找到该条码对应的产品');
    return success(res, product);
  } catch (err) {
    console.error('getProductByBarcode error:', err);
    return fail(res, '条码查询失败');
  }
}

export async function getLowStockProducts(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const keyword = req.query.keyword || '';
    const { categoryId, supplierId } = req.query;

    const productsWithInventory = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(keyword ? {
          OR: [
            { name: { contains: keyword } },
            { sku: { contains: keyword } },
            { barcode: { contains: keyword } },
          ],
        } : {}),
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
        ...(supplierId ? {
          suppliers: { some: { supplierId: Number(supplierId) } },
        } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        preferredSupplier: { select: { id: true, name: true, code: true } },
        inventory: {
          select: { totalQty: true, availableQty: true, warehouseZone: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const lowStockList = productsWithInventory.filter((p) => {
      const totalStock = p.inventory.reduce(
        (sum, inv) => sum + Number(inv.availableQty || 0), 0
      );
      return totalStock <= Number(p.minStock);
    });

    const total = lowStockList.length;
    const start = (page - 1) * pageSize;
    const list = lowStockList.slice(start, start + pageSize);

    const enriched = list.map((p) => {
      const totalStock = p.inventory.reduce(
        (sum, inv) => sum + Number(inv.availableQty || 0), 0
      );
      return {
        ...p,
        totalStock: Number(totalStock.toFixed(2)),
        shortage: Number(Math.max(0, Number(p.minStock) - totalStock).toFixed(2)),
      };
    });

    return success(res, paginate(enriched, page, pageSize, total));
  } catch (err) {
    console.error('getLowStockProducts error:', err);
    return fail(res, '获取低库存产品失败');
  }
}

export async function getProductsWithSuppliers(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const keyword = req.query.keyword || '';
    const { categoryId, isActive } = req.query;

    const where = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { sku: { contains: keyword } },
        { barcode: { contains: keyword } },
      ];
    }
    if (categoryId) where.categoryId = Number(categoryId);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const total = await prisma.product.count({ where });
    const list = await prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, code: true } },
        preferredSupplier: {
          select: { id: true, name: true, code: true, rating: true, phone: true },
        },
        suppliers: {
          include: {
            supplier: {
              select: { id: true, name: true, code: true, rating: true, phone: true, status: true },
            },
          },
          orderBy: [{ priority: 'asc' }, { price: 'asc' }],
        },
      },
    });

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getProductsWithSuppliers error:', err);
    return fail(res, '获取产品及供应商信息失败');
  }
}

export async function createProduct(req, res) {
  try {
    const {
      sku, barcode, name, categoryId, unit, spec, shelfLifeDays, warningDays,
      minStock, maxStock, defaultPrice, storageCondition, isActive,
      preferredSupplierId, suppliers,
    } = req.body;

    if (!sku || !name || !categoryId || !unit) {
      return fail(res, '请填写必填字段（SKU、名称、分类ID、单位）');
    }

    const skuExists = await prisma.product.findUnique({ where: { sku } });
    if (skuExists) return fail(res, 'SKU 已存在');

    if (barcode) {
      const barcodeExists = await prisma.product.findFirst({ where: { barcode } });
      if (barcodeExists) return fail(res, '条码已存在');
    }

    const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
    if (!category) return fail(res, '分类不存在');

    const data = {
      sku,
      barcode,
      name,
      categoryId: Number(categoryId),
      unit,
      spec,
      shelfLifeDays: shelfLifeDays ?? 0,
      warningDays: warningDays ?? 7,
      minStock: minStock ?? 0,
      maxStock,
      defaultPrice,
      storageCondition,
      isActive: isActive !== undefined ? isActive : true,
      preferredSupplierId: preferredSupplierId ? Number(preferredSupplierId) : null,
    };

    if (suppliers && Array.isArray(suppliers) && suppliers.length > 0) {
      const validSuppliers = suppliers.filter(
        (s) => s.supplierId && s.price !== undefined
      );
      if (validSuppliers.length > 0) {
        data.suppliers = {
          create: validSuppliers.map((s) => ({
            supplierId: Number(s.supplierId),
            price: Number(s.price),
            leadTimeDays: s.leadTimeDays ?? 1,
            isPreferred: s.isPreferred ?? false,
            priority: s.priority ?? 1,
          })),
        };
      }
    }

    const product = await prisma.product.create({
      data,
      include: {
        category: true,
        preferredSupplier: true,
        suppliers: { include: { supplier: true } },
      },
    });

    return success(res, product, '创建成功', 201);
  } catch (err) {
    console.error('createProduct error:', err);
    return fail(res, '创建产品失败');
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      sku, barcode, name, categoryId, unit, spec, shelfLifeDays, warningDays,
      minStock, maxStock, defaultPrice, storageCondition, isActive,
      preferredSupplierId,
    } = req.body;

    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!product) return notFound(res, '产品不存在');

    if (sku && sku !== product.sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku } });
      if (skuExists) return fail(res, 'SKU 已存在');
    }

    if (barcode && barcode !== product.barcode) {
      const barcodeExists = await prisma.product.findFirst({ where: { barcode } });
      if (barcodeExists) return fail(res, '条码已存在');
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
      if (!category) return fail(res, '分类不存在');
    }

    const data = {};
    if (sku !== undefined) data.sku = sku;
    if (barcode !== undefined) data.barcode = barcode;
    if (name !== undefined) data.name = name;
    if (categoryId !== undefined) data.categoryId = Number(categoryId);
    if (unit !== undefined) data.unit = unit;
    if (spec !== undefined) data.spec = spec;
    if (shelfLifeDays !== undefined) data.shelfLifeDays = shelfLifeDays;
    if (warningDays !== undefined) data.warningDays = warningDays;
    if (minStock !== undefined) data.minStock = minStock;
    if (maxStock !== undefined) data.maxStock = maxStock;
    if (defaultPrice !== undefined) data.defaultPrice = defaultPrice;
    if (storageCondition !== undefined) data.storageCondition = storageCondition;
    if (isActive !== undefined) data.isActive = isActive;
    if (preferredSupplierId !== undefined) {
      data.preferredSupplierId = preferredSupplierId ? Number(preferredSupplierId) : null;
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data,
      include: {
        category: true,
        preferredSupplier: true,
      },
    });

    return success(res, updated, '更新成功');
  } catch (err) {
    console.error('updateProduct error:', err);
    return fail(res, '更新产品失败');
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!product) return notFound(res, '产品不存在');

    const inUse = await prisma.purchaseOrderItem.count({ where: { productId: Number(id) } });
    if (inUse > 0) return fail(res, '该产品存在关联订单，无法删除');

    const inInbound = await prisma.inboundItem.count({ where: { productId: Number(id) } });
    if (inInbound > 0) return fail(res, '该产品存在关联入库记录，无法删除');

    const inInventory = await prisma.inventory.count({ where: { productId: Number(id) } });
    if (inInventory > 0) return fail(res, '该产品存在库存记录，无法删除');

    await prisma.productSupplier.deleteMany({ where: { productId: Number(id) } });
    await prisma.product.delete({ where: { id: Number(id) } });

    return success(res, null, '删除成功');
  } catch (err) {
    console.error('deleteProduct error:', err);
    return fail(res, '删除产品失败');
  }
}
