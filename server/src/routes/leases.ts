import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { leaseDrafts, leases, apartments, customers, users, vacancyReminders, deposits } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, adminMiddleware, AuthUser } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

const leaseDraftSchema = z.object({
  apartmentId: z.number().min(1, '请选择房源'),
  customerId: z.number().min(1, '请选择客户'),
  startDate: z.string().min(1, '请选择起租日期'),
  endDate: z.string().min(1, '请选择结束日期'),
  monthlyRent: z.number().positive('月租金必须大于0'),
  depositAmount: z.number().min(0, '押金不能为负'),
  paymentCycle: z.number().default(1),
  terms: z.string().optional(),
});

const leaseSignSchema = z.object({
  startDate: z.string().min(1, '请选择起租日期'),
  endDate: z.string().min(1, '请选择结束日期'),
  monthlyRent: z.number().positive('月租金必须大于0'),
  depositAmount: z.number().min(0, '押金不能为负'),
  paymentCycle: z.number().default(1),
  terms: z.string().optional(),
  depositReceivedDate: z.string().min(1, '请填写押金收款日期'),
});

app.get('/drafts', async (c) => {
  const { page = '1', pageSize = '20', status, consultantId } = c.req.query();
  const user = c.get('user') as AuthUser;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const conditions = [];
  if (user.role !== 'admin') {
    conditions.push(eq(leaseDrafts.consultantId, user.id));
  }
  if (consultantId) conditions.push(eq(leaseDrafts.consultantId, parseInt(consultantId)));
  if (status) conditions.push(eq(leaseDrafts.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db.select({
    id: leaseDrafts.id,
    startDate: leaseDrafts.startDate,
    endDate: leaseDrafts.endDate,
    monthlyRent: leaseDrafts.monthlyRent,
    depositAmount: leaseDrafts.depositAmount,
    status: leaseDrafts.status,
    createdAt: leaseDrafts.createdAt,
    apartment: apartments,
    customer: customers,
    consultant: users,
  }).from(leaseDrafts)
    .leftJoin(apartments, eq(leaseDrafts.apartmentId, apartments.id))
    .leftJoin(customers, eq(leaseDrafts.customerId, customers.id))
    .leftJoin(users, eq(leaseDrafts.consultantId, users.id))
    .where(where)
    .orderBy(desc(leaseDrafts.createdAt))
    .limit(parseInt(pageSize))
    .offset(offset);

  const [count] = await db.select({ count: sql`count(*)` }).from(leaseDrafts).where(where);

  return c.json({
    list,
    total: parseInt(count.count as string),
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
});

app.post('/drafts', zValidator('json', leaseDraftSchema), async (c) => {
  const user = c.get('user') as AuthUser;
  const data = c.req.valid('json');
  const [draft] = await db.insert(leaseDrafts).values({
    ...data,
    consultantId: user.id,
  }).returning();
  return c.json(draft);
});

app.put('/drafts/:id', zValidator('json', leaseDraftSchema.partial()), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const [draft] = await db.update(leaseDrafts).set({ ...data, updatedAt: new Date() }).where(eq(leaseDrafts.id, id)).returning();
  if (!draft) {
    return c.json({ error: '租约草稿不存在' }, 404);
  }
  return c.json(draft);
});

app.post('/drafts/:id/sign', adminMiddleware, zValidator('json', leaseSignSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');

  const [draft] = await db.select().from(leaseDrafts).where(eq(leaseDrafts.id, id));
  if (!draft) {
    return c.json({ error: '租约草稿不存在' }, 404);
  }

  const result = await db.transaction(async (tx) => {
    const [lease] = await tx.insert(leases).values({
      apartmentId: draft.apartmentId,
      customerId: draft.customerId,
      consultantId: draft.consultantId,
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyRent: data.monthlyRent,
      depositAmount: data.depositAmount,
      paymentCycle: data.paymentCycle,
      terms: data.terms,
      status: 'active',
      signedAt: new Date(),
    }).returning();

    await tx.insert(deposits).values({
      leaseId: lease.id,
      apartmentId: draft.apartmentId,
      customerId: draft.customerId,
      amount: data.depositAmount,
      receivedDate: data.depositReceivedDate,
      status: 'held',
    });

    await tx.update(apartments).set({ status: 'occupied', updatedAt: new Date() }).where(eq(apartments.id, draft.apartmentId));

    await tx.update(leaseDrafts).set({ status: 'signed', updatedAt: new Date() }).where(eq(leaseDrafts.id, id));

    await tx.insert(vacancyReminders).values({
      apartmentId: draft.apartmentId,
      leaseEndDate: data.endDate,
      reminderDate: sql`${data.endDate}::date - interval '30 days'`,
      type: 'upcoming',
    });

    return lease;
  });

  return c.json(result);
});

app.get('/', adminMiddleware, async (c) => {
  const { page = '1', pageSize = '20', status, apartmentId, customerId } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const conditions = [];
  if (status) conditions.push(eq(leases.status, status));
  if (apartmentId) conditions.push(eq(leases.apartmentId, parseInt(apartmentId)));
  if (customerId) conditions.push(eq(leases.customerId, parseInt(customerId)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db.select({
    id: leases.id,
    startDate: leases.startDate,
    endDate: leases.endDate,
    monthlyRent: leases.monthlyRent,
    depositAmount: leases.depositAmount,
    status: leases.status,
    signedAt: leases.signedAt,
    apartment: apartments,
    customer: customers,
    consultant: users,
  }).from(leases)
    .leftJoin(apartments, eq(leases.apartmentId, apartments.id))
    .leftJoin(customers, eq(leases.customerId, customers.id))
    .leftJoin(users, eq(leases.consultantId, users.id))
    .where(where)
    .orderBy(desc(leases.createdAt))
    .limit(parseInt(pageSize))
    .offset(offset);

  const [count] = await db.select({ count: sql`count(*)` }).from(leases).where(where);

  return c.json({
    list,
    total: parseInt(count.count as string),
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
});

app.patch('/:id/terminate', adminMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  
  const result = await db.transaction(async (tx) => {
    const [lease] = await tx.update(leases).set({ status: 'terminated' }).where(eq(leases.id, id)).returning();
    if (!lease) {
      throw new Error('租约不存在');
    }
    await tx.update(apartments).set({ status: 'vacant', updatedAt: new Date() }).where(eq(apartments.id, lease.apartmentId));
    return lease;
  });

  return c.json(result);
});

export default app;
