import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { apartments, customers, viewings, followUps, leases, deposits, users } from '../db/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

const batchQuerySchema = z.object({
  keyword: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  consultantId: z.number().optional(),
  types: z.array(z.enum(['apartments', 'customers', 'viewings', 'followups', 'leases', 'deposits'])).optional(),
});

app.post('/batch', zValidator('json', batchQuerySchema), async (c) => {
  const { keyword, startDate, endDate, status, consultantId, types = ['apartments', 'customers', 'viewings', 'followups', 'leases', 'deposits'] } = c.req.valid('json');
  
  const result: Record<string, unknown> = {};

  const dateConditions = [];
  if (startDate) dateConditions.push(gte(sql`created_at`, startDate));
  if (endDate) dateConditions.push(lte(sql`created_at`, endDate));

  if (types.includes('apartments')) {
    const conditions = [];
    if (status) conditions.push(eq(apartments.status, status));
    if (keyword) {
      conditions.push(sql`${apartments.apartmentNo} ILIKE ${'%' + keyword + '%'} OR ${apartments.building} ILIKE ${'%' + keyword + '%'}`);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    result.apartments = await db.select().from(apartments).where(where).orderBy(desc(apartments.updatedAt)).limit(100);
  }

  if (types.includes('customers')) {
    const conditions = [];
    if (consultantId) conditions.push(eq(customers.consultantId, consultantId));
    if (keyword) {
      conditions.push(sql`${customers.name} ILIKE ${'%' + keyword + '%'} OR ${customers.phone} ILIKE ${'%' + keyword + '%'}`);
    }
    if (dateConditions.length > 0) conditions.push(...dateConditions);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    result.customers = await db.select().from(customers).where(where).orderBy(desc(customers.createdAt)).limit(100);
  }

  if (types.includes('viewings')) {
    const conditions = [];
    if (consultantId) conditions.push(eq(viewings.consultantId, consultantId));
    if (status) conditions.push(eq(viewings.status, status));
    if (startDate) conditions.push(gte(viewings.viewingDate, startDate));
    if (endDate) conditions.push(lte(viewings.viewingDate, endDate));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    result.viewings = await db.select({
      id: viewings.id,
      viewingDate: viewings.viewingDate,
      status: viewings.status,
      apartment: apartments,
      customer: customers,
      consultant: users,
    }).from(viewings)
      .leftJoin(apartments, eq(viewings.apartmentId, apartments.id))
      .leftJoin(customers, eq(viewings.customerId, customers.id))
      .leftJoin(users, eq(viewings.consultantId, users.id))
      .where(where)
      .orderBy(desc(viewings.viewingDate))
      .limit(200);
  }

  if (types.includes('followups')) {
    const conditions = [];
    if (consultantId) conditions.push(eq(followUps.consultantId, consultantId));
    if (dateConditions.length > 0) conditions.push(...dateConditions);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    result.followups = await db.select({
      id: followUps.id,
      type: followUps.type,
      content: followUps.content,
      result: followUps.result,
      createdAt: followUps.createdAt,
      customer: customers,
      consultant: users,
    }).from(followUps)
      .leftJoin(customers, eq(followUps.customerId, customers.id))
      .leftJoin(users, eq(followUps.consultantId, users.id))
      .where(where)
      .orderBy(desc(followUps.createdAt))
      .limit(200);
  }

  if (types.includes('leases')) {
    const conditions = [];
    if (status) conditions.push(eq(leases.status, status));
    if (startDate) conditions.push(gte(leases.startDate, startDate));
    if (endDate) conditions.push(lte(leases.endDate, endDate));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    result.leases = await db.select({
      id: leases.id,
      startDate: leases.startDate,
      endDate: leases.endDate,
      monthlyRent: leases.monthlyRent,
      status: leases.status,
      apartment: apartments,
      customer: customers,
      consultant: users,
    }).from(leases)
      .leftJoin(apartments, eq(leases.apartmentId, apartments.id))
      .leftJoin(customers, eq(leases.customerId, customers.id))
      .leftJoin(users, eq(leases.consultantId, users.id))
      .where(where)
      .orderBy(desc(leases.createdAt))
      .limit(100);
  }

  if (types.includes('deposits')) {
    const conditions = [];
    if (status) conditions.push(eq(deposits.status, status));
    if (dateConditions.length > 0) conditions.push(...dateConditions);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    result.deposits = await db.select({
      id: deposits.id,
      amount: deposits.amount,
      receivedDate: deposits.receivedDate,
      status: deposits.status,
      refundDate: deposits.refundDate,
      refundAmount: deposits.refundAmount,
      hasDispute: deposits.hasDispute,
      apartment: apartments,
      customer: customers,
    }).from(deposits)
      .leftJoin(apartments, eq(deposits.apartmentId, apartments.id))
      .leftJoin(customers, eq(deposits.customerId, customers.id))
      .where(where)
      .orderBy(desc(deposits.createdAt))
      .limit(100);
  }

  return c.json(result);
});

app.get('/statistics', adminMiddleware, async (c) => {
  const { startDate, endDate } = c.req.query();

  const where = [];
  if (startDate) where.push(gte(sql`created_at`, startDate));
  if (endDate) where.push(lte(sql`created_at`, endDate));
  const dateWhere = where.length > 0 ? and(...where) : undefined;

  const [apartmentStats] = await db.select({
    total: sql`count(*)`,
    vacant: sql`count(*) FILTER (WHERE status = 'vacant')`,
    occupied: sql`count(*) FILTER (WHERE status = 'occupied')`,
    reserved: sql`count(*) FILTER (WHERE status = 'reserved')`,
    maintenance: sql`count(*) FILTER (WHERE status = 'maintenance')`,
  }).from(apartments);

  const [viewingStats] = await db.select({
    total: sql`count(*)`,
    pending: sql`count(*) FILTER (WHERE status = 'pending')`,
    completed: sql`count(*) FILTER (WHERE status = 'completed')`,
    cancelled: sql`count(*) FILTER (WHERE status = 'cancelled')`,
  }).from(viewings).where(dateWhere);

  const [followupStats] = await db.select({
    total: sql`count(*)`,
    signed: sql`count(*) FILTER (WHERE result = 'signed')`,
    lost: sql`count(*) FILTER (WHERE result = 'lost')`,
    pending: sql`count(*) FILTER (WHERE result IS NULL)`,
  }).from(followUps).where(dateWhere);

  const [depositStats] = await db.select({
    total: sql`count(*)`,
    held: sql`count(*) FILTER (WHERE status = 'held')`,
    refunded: sql`count(*) FILTER (WHERE status = 'refunded')`,
    disputed: sql`count(*) FILTER (WHERE has_dispute = true)`,
    totalAmount: sql`sum(amount)`,
    refundedAmount: sql`sum(refund_amount)`,
  }).from(deposits);

  const consultantStats = await db.select({
    consultantId: followUps.consultantId,
    consultantName: users.name,
    followups: sql`count(*)`,
    signed: sql`count(*) FILTER (WHERE result = 'signed')`,
  }).from(followUps)
    .leftJoin(users, eq(followUps.consultantId, users.id))
    .where(dateWhere)
    .groupBy(followUps.consultantId, users.name);

  return c.json({
    apartments: apartmentStats,
    viewings: viewingStats,
    followups: followupStats,
    deposits: depositStats,
    consultantStats,
  });
});

app.get('/monthly-summary', adminMiddleware, async (c) => {
  const { year = new Date().getFullYear().toString() } = c.req.query();

  const result = await db.select({
    month: sql`to_char(created_at, 'YYYY-MM')`,
    newCustomers: sql`count(*) FILTER (WHERE EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND to_char(c.created_at, 'YYYY-MM') = to_char(follow_ups.created_at, 'YYYY-MM')))`,
    viewings: sql`count(*) FILTER (WHERE EXISTS (SELECT 1 FROM viewings v WHERE v.customer_id = follow_ups.customer_id AND to_char(v.viewing_date, 'YYYY-MM') = to_char(follow_ups.created_at, 'YYYY-MM')))`,
    signings: sql`count(*) FILTER (WHERE result = 'signed')`,
  }).from(followUps)
    .where(sql`to_char(created_at, 'YYYY') = ${year}`)
    .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
    .orderBy(sql`month`);

  return c.json(result);
});

export default app;
