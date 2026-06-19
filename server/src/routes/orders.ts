import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { orders, orderPhotos, users, technicians, cityManagers, reviews } from '../db/schema';
import { eq, and, gte, lte, like, desc, asc, inArray, sql, count, sum } from 'drizzle-orm';

const router = new Hono();

const createOrderSchema = z.object({
  userName: z.string(),
  userPhone: z.string(),
  address: z.string(),
  city: z.string(),
  applianceType: z.string(),
  applianceBrand: z.string().optional(),
  faultDescription: z.string(),
  scheduledDate: z.string(),
  scheduledTimeSlot: z.string(),
  source: z.enum(['online', 'phone', 'walk_in', 'referral', 'third_party']).optional(),
  photos: z.array(z.string()).optional(),
});

const querySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  status: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
  cityManagerId: z.string().optional(),
  technicianId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  keyword: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

router.get('/', async (c) => {
  const query = querySchema.parse(c.req.query());
  const page = parseInt(query.page);
  const pageSize = parseInt(query.pageSize);
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (query.status) {
    conditions.push(eq(orders.status, query.status as any));
  }
  if (query.city) {
    conditions.push(eq(orders.city, query.city));
  }
  if (query.source) {
    conditions.push(eq(orders.source, query.source as any));
  }
  if (query.cityManagerId) {
    conditions.push(eq(orders.cityManagerId, parseInt(query.cityManagerId)));
  }
  if (query.technicianId) {
    conditions.push(eq(orders.technicianId, parseInt(query.technicianId)));
  }
  if (query.startDate) {
    conditions.push(gte(orders.scheduledDate, query.startDate));
  }
  if (query.endDate) {
    conditions.push(lte(orders.scheduledDate, query.endDate));
  }
  if (query.keyword) {
    conditions.push(
      sql`(${orders.orderNo} ILIKE ${'%' + query.keyword + '%'} OR ${orders.faultDescription} ILIKE ${'%' + query.keyword + '%'})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderByColumn = query.sortBy === 'createdAt' ? orders.createdAt :
    query.sortBy === 'scheduledDate' ? orders.scheduledDate :
    query.sortBy === 'status' ? orders.status : orders.createdAt;

  const [totalResult, orderList] = await Promise.all([
    db.select({ count: count() }).from(orders).where(where),
    db
      .select()
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(technicians, eq(orders.technicianId, technicians.id))
      .leftJoin(cityManagers, eq(orders.cityManagerId, cityManagers.id))
      .where(where)
      .limit(pageSize)
      .offset(offset)
      .orderBy(query.sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn)),
  ]);

  const total = totalResult[0]?.count || 0;

  const formattedOrders = orderList.map((row) => ({
    ...row.orders,
    user: row.users,
    technician: row.technicians,
    cityManager: row.city_managers,
  }));

  return c.json({
    data: formattedOrders,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

router.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  const result = await db
    .select()
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(technicians, eq(orders.technicianId, technicians.id))
    .leftJoin(cityManagers, eq(orders.cityManagerId, cityManagers.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: '订单不存在' }, 404);
  }

  const [photos, review] = await Promise.all([
    db.select().from(orderPhotos).where(eq(orderPhotos.orderId, id)),
    db.select().from(reviews).where(eq(reviews.orderId, id)).limit(1),
  ]);

  return c.json({
    ...result[0].orders,
    user: result[0].users,
    technician: result[0].technicians,
    cityManager: result[0].city_managers,
    photos,
    review: review[0] || null,
  });
});

router.post('/', async (c) => {
  const body = await c.req.json();
  const data = createOrderSchema.parse(body);

  let user = await db.select().from(users).where(eq(users.phone, data.userPhone)).limit(1);
  let userId: number;

  if (user.length === 0) {
    const newUser = await db
      .insert(users)
      .values({
        name: data.userName,
        phone: data.userPhone,
        address: data.address,
        city: data.city,
      })
      .returning();
    userId = newUser[0].id;
  } else {
    userId = user[0].id;
    await db
      .update(users)
      .set({ name: data.userName, address: data.address, city: data.city })
      .where(eq(users.id, userId));
  }

  const orderNo = 'ORD' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  const cityManager = await db.select().from(cityManagers).where(eq(cityManagers.city, data.city)).limit(1);

  const newOrder = await db
    .insert(orders)
    .values({
      orderNo,
      userId,
      cityManagerId: cityManager[0]?.id || null,
      applianceType: data.applianceType,
      applianceBrand: data.applianceBrand,
      faultDescription: data.faultDescription,
      address: data.address,
      city: data.city,
      source: data.source || 'online',
      scheduledDate: data.scheduledDate,
      scheduledTimeSlot: data.scheduledTimeSlot,
      status: 'pending',
    })
    .returning();

  if (data.photos && data.photos.length > 0) {
    const photoValues = data.photos.map((url) => ({
      orderId: newOrder[0].id,
      photoUrl: url,
      photoType: 'fault',
    }));
    await db.insert(orderPhotos).values(photoValues);
  }

  return c.json({ ...newOrder[0] }, 201);
});

router.put('/:id/status', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const { status, technicianId, remark } = body;

  const updateData: any = { status };
  if (technicianId) updateData.technicianId = technicianId;
  if (remark !== undefined) updateData.remark = remark;
  updateData.updatedAt = new Date();

  const result = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();

  if (result.length === 0) {
    return c.json({ error: '订单不存在' }, 404);
  }

  return c.json(result[0]);
});

router.put('/:id/assign', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const { technicianId } = body;

  const result = await db
    .update(orders)
    .set({ technicianId, status: 'assigned', updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: '订单不存在' }, 404);
  }

  return c.json(result[0]);
});

router.get('/statistics/summary', async (c) => {
  const query = c.req.query();
  const conditions = [];

  if (query.startDate) {
    conditions.push(gte(orders.createdAt, new Date(query.startDate)));
  }
  if (query.endDate) {
    conditions.push(lte(orders.createdAt, new Date(query.endDate)));
  }
  if (query.city) {
    conditions.push(eq(orders.city, query.city));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .where(where)
    .groupBy(orders.status);

  const total = results.reduce((sum, r) => sum + Number(r.count), 0);
  const completed = results.find((r) => r.status === 'completed')?.count || 0;
  const onTimeResult = await db
    .select({ count: count() })
    .from(orders)
    .where(and(eq(orders.isOnTime, true), eq(orders.status, 'completed')));

  const onTimeCount = onTimeResult[0]?.count || 0;

  return c.json({
    total,
    statusBreakdown: results,
    completionRate: total > 0 ? (Number(completed) / total) * 100 : 0,
    onTimeRate: Number(completed) > 0 ? (Number(onTimeCount) / Number(completed)) * 100 : 0,
  });
});

export default router;
