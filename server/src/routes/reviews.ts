import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { reviews, orders, users, cityManagers } from '../db/schema';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';

const router = new Hono();

const querySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  status: z.string().optional(),
  rating: z.string().optional(),
  city: z.string().optional(),
  followedBy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hasComment: z.string().optional(),
});

const followUpSchema = z.object({
  status: z.enum(['follow_up', 'resolved', 'escalated']),
  followUpNote: z.string(),
  followedBy: z.number().optional(),
});

router.get('/', async (c) => {
  const query = querySchema.parse(c.req.query());
  const page = parseInt(query.page);
  const pageSize = parseInt(query.pageSize);
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (query.status) {
    conditions.push(eq(reviews.status, query.status as any));
  }
  if (query.rating) {
    conditions.push(eq(reviews.rating, parseInt(query.rating)));
  }
  if (query.followedBy) {
    conditions.push(eq(reviews.followedBy, parseInt(query.followedBy)));
  }
  if (query.startDate) {
    conditions.push(gte(reviews.createdAt, new Date(query.startDate)));
  }
  if (query.endDate) {
    conditions.push(lte(reviews.createdAt, new Date(query.endDate)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, reviewList] = await Promise.all([
    db.select({ count: count() }).from(reviews).where(where),
    db
      .select()
      .from(reviews)
      .leftJoin(orders, eq(reviews.orderId, orders.id))
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(cityManagers, eq(reviews.followedBy, cityManagers.id))
      .where(where)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(reviews.createdAt)),
  ]);

  const total = totalResult[0]?.count || 0;

  const formatted = reviewList.map((row) => ({
    ...row.reviews,
    order: row.orders,
    user: row.users,
    follower: row.city_managers,
  }));

  return c.json({
    data: formatted,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

router.get('/bad-reviews', async (c) => {
  const { page = '1', pageSize = '20', status } = c.req.query();
  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;

  const conditions = [eq(reviews.rating, 1)];
  if (status) {
    conditions.push(eq(reviews.status, status as any));
  }

  const where = and(...conditions);

  const [totalResult, badReviews] = await Promise.all([
    db.select({ count: count() }).from(reviews).where(where),
    db
      .select()
      .from(reviews)
      .leftJoin(orders, eq(reviews.orderId, orders.id))
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(cityManagers, eq(reviews.followedBy, cityManagers.id))
      .where(where)
      .limit(pageSizeNum)
      .offset(offset)
      .orderBy(desc(reviews.createdAt)),
  ]);

  const total = totalResult[0]?.count || 0;

  const formatted = badReviews.map((row) => ({
    ...row.reviews,
    order: row.orders,
    user: row.users,
    follower: row.city_managers,
  }));

  return c.json({
    data: formatted,
    total,
    page: pageNum,
    pageSize: pageSizeNum,
    totalPages: Math.ceil(total / pageSizeNum),
  });
});

router.put('/:id/follow-up', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const data = followUpSchema.parse(body);

  const updateData: any = {
    status: data.status,
    followUpNote: data.followUpNote,
    followedAt: new Date(),
  };
  if (data.followedBy) updateData.followedBy = data.followedBy;

  const result = await db.update(reviews).set(updateData).where(eq(reviews.id, id)).returning();

  if (result.length === 0) {
    return c.json({ error: '评价不存在' }, 404);
  }

  return c.json(result[0]);
});

router.post('/', async (c) => {
  const body = await c.req.json();
  const { orderId, userId, rating, comment } = body;

  const result = await db
    .insert(reviews)
    .values({
      orderId,
      userId,
      rating,
      comment,
      status: rating <= 2 ? 'follow_up' : 'pending',
    })
    .returning();

  return c.json(result[0], 201);
});

export default router;
