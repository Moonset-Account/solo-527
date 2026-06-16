import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { orders, orderNodes, orderNodeLogs, users, subscriptions } from '../db/schema.js';
import { eq, and, gte, lte, desc, asc, count } from 'drizzle-orm';

const app = new Hono();

const orderQuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  status: z.string().optional(),
  userId: z.string().optional(),
  owner: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

const createOrderSchema = z.object({
  orderNo: z.string(),
  userId: z.number(),
  subscriptionId: z.number().optional(),
  amount: z.string(),
  status: z.string().optional().default('pending'),
  owner: z.string().optional(),
});

const updateOrderSchema = z.object({
  status: z.string().optional(),
  owner: z.string().optional(),
  paidAt: z.string().optional(),
});

const createNodeSchema = z.object({
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
  isEnabled: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
});

const updateNodeSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isEnabled: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const createNodeLogSchema = z.object({
  orderId: z.number(),
  nodeId: z.number(),
  status: z.string().optional().default('pending'),
  operator: z.string().optional(),
  note: z.string().optional(),
  executedAt: z.string().optional(),
});

app.get('/', async (c) => {
  const query = c.req.query();
  const result = orderQuerySchema.safeParse(query);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { page, pageSize, status, userId, owner, startDate, endDate, search } = result.data;
  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * sizeNum;

  const conditions = [];
  if (status) {
    conditions.push(eq(orders.status, status));
  }
  if (userId) {
    conditions.push(eq(orders.userId, parseInt(userId, 10)));
  }
  if (owner) {
    conditions.push(eq(orders.owner, owner));
  }
  if (startDate) {
    conditions.push(gte(orders.createdAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(orders.createdAt, new Date(endDate)));
  }

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        userId: orders.userId,
        subscriptionId: orders.subscriptionId,
        amount: orders.amount,
        status: orders.status,
        paidAt: orders.paidAt,
        owner: orders.owner,
        createdAt: orders.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(sizeNum)
      .offset(offset),
    db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  const total = totalResult[0]?.count || 0;

  return c.json({
    items,
    total,
    page: pageNum,
    pageSize: sizeNum,
    totalPages: Math.ceil(total / sizeNum),
  });
});

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const orderList = await db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      userId: orders.userId,
      subscriptionId: orders.subscriptionId,
      amount: orders.amount,
      status: orders.status,
      paidAt: orders.paidAt,
      owner: orders.owner,
      createdAt: orders.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id))
    .limit(1);

  const order = orderList[0];

  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }

  return c.json({ order });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const result = createOrderSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const data: any = {
    orderNo: result.data.orderNo,
    userId: result.data.userId,
    amount: result.data.amount,
    status: result.data.status,
  };

  if (result.data.subscriptionId !== undefined) {
    data.subscriptionId = result.data.subscriptionId;
  }
  if (result.data.owner !== undefined) {
    data.owner = result.data.owner;
  }

  const newOrders = await db
    .insert(orders)
    .values(data)
    .returning();

  return c.json({ order: newOrders[0] }, 201);
});

app.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = updateOrderSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const data: any = {};
  if (result.data.status !== undefined) data.status = result.data.status;
  if (result.data.owner !== undefined) data.owner = result.data.owner;
  if (result.data.paidAt !== undefined) data.paidAt = new Date(result.data.paidAt);

  const updated = await db
    .update(orders)
    .set(data)
    .where(eq(orders.id, id))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Order not found' }, 404);
  }

  return c.json({ order: updated[0] });
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const deleted = await db
    .delete(orders)
    .where(eq(orders.id, id))
    .returning();

  if (deleted.length === 0) {
    return c.json({ error: 'Order not found' }, 404);
  }

  return c.json({ message: 'Order deleted successfully' });
});

app.get('/nodes/list', async (c) => {
  const nodes = await db
    .select()
    .from(orderNodes)
    .orderBy(asc(orderNodes.sortOrder));

  return c.json({ nodes });
});

app.get('/nodes/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const nodeList = await db
    .select()
    .from(orderNodes)
    .where(eq(orderNodes.id, id))
    .limit(1);

  const node = nodeList[0];

  if (!node) {
    return c.json({ error: 'Order node not found' }, 404);
  }

  return c.json({ node });
});

app.post('/nodes', async (c) => {
  const body = await c.req.json();
  const result = createNodeSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const newNodes = await db
    .insert(orderNodes)
    .values(result.data)
    .returning();

  return c.json({ node: newNodes[0] }, 201);
});

app.put('/nodes/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = updateNodeSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const updated = await db
    .update(orderNodes)
    .set(result.data)
    .where(eq(orderNodes.id, id))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Order node not found' }, 404);
  }

  return c.json({ node: updated[0] });
});

app.delete('/nodes/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const deleted = await db
    .delete(orderNodes)
    .where(eq(orderNodes.id, id))
    .returning();

  if (deleted.length === 0) {
    return c.json({ error: 'Order node not found' }, 404);
  }

  return c.json({ message: 'Order node deleted successfully' });
});

app.get('/:id/node-logs', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const logs = await db
    .select({
      id: orderNodeLogs.id,
      orderId: orderNodeLogs.orderId,
      nodeId: orderNodeLogs.nodeId,
      status: orderNodeLogs.status,
      operator: orderNodeLogs.operator,
      note: orderNodeLogs.note,
      executedAt: orderNodeLogs.executedAt,
      createdAt: orderNodeLogs.createdAt,
      nodeName: orderNodes.name,
      nodeCode: orderNodes.code,
    })
    .from(orderNodeLogs)
    .leftJoin(orderNodes, eq(orderNodeLogs.nodeId, orderNodes.id))
    .where(eq(orderNodeLogs.orderId, id))
    .orderBy(desc(orderNodeLogs.createdAt));

  return c.json({ logs });
});

app.post('/node-logs', async (c) => {
  const body = await c.req.json();
  const result = createNodeLogSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const data: any = {
    orderId: result.data.orderId,
    nodeId: result.data.nodeId,
    status: result.data.status,
  };

  if (result.data.operator !== undefined) {
    data.operator = result.data.operator;
  }
  if (result.data.note !== undefined) {
    data.note = result.data.note;
  }
  if (result.data.executedAt !== undefined) {
    data.executedAt = new Date(result.data.executedAt);
  }

  const newLogs = await db
    .insert(orderNodeLogs)
    .values(data)
    .returning();

  return c.json({ log: newLogs[0] }, 201);
});

export default app;
