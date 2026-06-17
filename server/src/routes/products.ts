import { Hono } from 'hono';
import { getProducts, getProductById, createProduct, updateProduct, updateProductStatus } from '../services/common';
import { setAuditAction } from '../middleware/audit';

const products = new Hono();

products.get('/', async (c) => {
  const query = c.req.query();
  const result = await getProducts({
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    category: query.category,
    minPoints: query.minPoints ? Number(query.minPoints) : undefined,
    maxPoints: query.maxPoints ? Number(query.maxPoints) : undefined,
    level: query.level,
    keyword: query.keyword,
    status: query.status || 'active',
  });

  return c.json({ success: true, data: result });
});

products.get('/:id', async (c) => {
  const id = c.req.param('id') as string;
  const product = await getProductById(id);

  if (!product) {
    return c.json({ success: false, error: '商品不存在' }, 404);
  }

  return c.json({ success: true, data: product });
});

products.post('/', async (c) => {
  const body = await c.req.json();

  if (!body.name || body.pointsPrice === undefined) {
    return c.json({ success: false, error: '商品名称和积分价格不能为空' }, 400);
  }

  const product = await createProduct({
    name: body.name,
    description: body.description,
    imageUrl: body.imageUrl,
    pointsPrice: Number(body.pointsPrice),
    stock: Number(body.stock || 0),
    category: body.category,
    requiredLevelId: body.requiredLevelId,
  });

  setAuditAction(c, 'product.create', {
    resourceType: 'product',
    resourceId: product.id,
    details: { name: product.name },
  });

  return c.json({ success: true, data: product });
});

products.put('/:id', async (c) => {
  const id = c.req.param('id') as string;
  const body = await c.req.json();

  const product = await updateProduct(id, {
    name: body.name,
    description: body.description,
    imageUrl: body.imageUrl,
    pointsPrice: body.pointsPrice !== undefined ? Number(body.pointsPrice) : undefined,
    stock: body.stock !== undefined ? Number(body.stock) : undefined,
    category: body.category,
    requiredLevelId: body.requiredLevelId,
    status: body.status,
  });

  setAuditAction(c, 'product.update', {
    resourceType: 'product',
    resourceId: id,
    details: body,
  });

  return c.json({ success: true, data: product });
});

products.patch('/:id/status', async (c) => {
  const id = c.req.param('id') as string;
  const { status } = await c.req.json();

  if (!['active', 'inactive'].includes(status)) {
    return c.json({ success: false, error: '无效的状态' }, 400);
  }

  const product = await updateProductStatus(id, status as 'active' | 'inactive');

  setAuditAction(c, 'product.status', {
    resourceType: 'product',
    resourceId: id,
    details: { status },
  });

  return c.json({ success: true, data: product });
});

export default products;
