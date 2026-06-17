import { Hono } from 'hono';
import {
  createExchangeOrder,
  getMyOrders,
  getOrderDetail,
  getAdminOrders,
  redeemOrder,
  getOrderByRedeemCode,
} from '../services/order';
import { authMiddleware, requireAdminRoles } from '../middleware/auth';
import { setAuditAction } from '../middleware/audit';

const orders = new Hono();

orders.post('/', authMiddleware, async (c) => {
  const user = c.get('user');

  if (user.type !== 'member') {
    return c.json({ success: false, error: '仅限会员兑换' }, 403);
  }

  const body = await c.req.json();

  if (!body.productId) {
    return c.json({ success: false, error: '商品ID不能为空' }, 400);
  }

  try {
    const order = await createExchangeOrder(user.id, body.productId, body.quantity || 1);
    return c.json({ success: true, data: order });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

orders.get('/mine', authMiddleware, async (c) => {
  const user = c.get('user');

  if (user.type !== 'member') {
    return c.json({ success: false, error: '仅限会员访问' }, 403);
  }

  const query = c.req.query();
  const result = await getMyOrders(user.id, {
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    status: query.status,
  });

  return c.json({ success: true, data: result });
});

orders.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id') as string;
  const order = await getOrderDetail(id);

  if (!order) {
    return c.json({ success: false, error: '订单不存在' }, 404);
  }

  const user = c.get('user');
  if (user.type === 'member' && order.memberId !== user.id) {
    return c.json({ success: false, error: '无权访问此订单' }, 403);
  }

  return c.json({ success: true, data: order });
});

orders.get('/', authMiddleware, requireAdminRoles(), async (c) => {
  const query = c.req.query();
  const result = await getAdminOrders({
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    status: query.status,
    keyword: query.keyword,
    startDate: query.startDate,
    endDate: query.endDate,
  });

  return c.json({ success: true, data: result });
});

orders.post('/:id/redeem', authMiddleware, requireAdminRoles(), async (c) => {
  const id = c.req.param('id') as string;
  const user = c.get('user');
  const body = await c.req.json();

  try {
    const order = await redeemOrder(id, user.id, body.redeemCode, body.remark);

    setAuditAction(c, 'order.redeem', {
      resourceType: 'order',
      resourceId: id,
      details: { orderNo: order.orderNo },
    });

    return c.json({ success: true, data: order });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

orders.get('/redeem-code/:code', authMiddleware, requireAdminRoles(), async (c) => {
  const code = c.req.param('code') as string;
  const order = await getOrderByRedeemCode(code);

  if (!order) {
    return c.json({ success: false, error: '核销码无效' }, 404);
  }

  return c.json({ success: true, data: order });
});

export default orders;
