import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { vacancyReminders, apartments, users, todos, leases } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, adminMiddleware, AuthUser } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

const processReminderSchema = z.object({
  note: z.string().optional(),
  action: z.enum(['renew', 'relet', 'maintenance', 'other']),
  createTodo: z.boolean().default(false),
  todoTitle: z.string().optional(),
  todoAssigneeId: z.number().optional(),
});

app.get('/', async (c) => {
  const { page = '1', pageSize = '20', processed, type, startDate, endDate } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const conditions = [];
  if (processed === 'true') conditions.push(eq(vacancyReminders.processed, true));
  if (processed === 'false') conditions.push(eq(vacancyReminders.processed, false));
  if (type) conditions.push(eq(vacancyReminders.type, type));
  if (startDate) conditions.push(sql`${vacancyReminders.reminderDate} >= ${startDate}`);
  if (endDate) conditions.push(sql`${vacancyReminders.reminderDate} <= ${endDate}`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db.select({
    id: vacancyReminders.id,
    leaseEndDate: vacancyReminders.leaseEndDate,
    reminderDate: vacancyReminders.reminderDate,
    type: vacancyReminders.type,
    processed: vacancyReminders.processed,
    note: vacancyReminders.note,
    createdAt: vacancyReminders.createdAt,
    apartment: apartments,
    processedBy: users,
  }).from(vacancyReminders)
    .leftJoin(apartments, eq(vacancyReminders.apartmentId, apartments.id))
    .leftJoin(users, eq(vacancyReminders.processedById, users.id))
    .where(where)
    .orderBy(desc(vacancyReminders.reminderDate))
    .limit(parseInt(pageSize))
    .offset(offset);

  const [count] = await db.select({ count: sql`count(*)` }).from(vacancyReminders).where(where);

  return c.json({
    list,
    total: parseInt(count.count as string),
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
});

app.post('/generate', adminMiddleware, async (c) => {
  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringLeases = await db.select({
    id: leases.id,
    apartmentId: leases.apartmentId,
    endDate: leases.endDate,
  }).from(leases)
    .where(and(
      eq(leases.status, 'active'),
      sql`${leases.endDate} <= ${thirtyDaysLater.toISOString().split('T')[0]}`,
      sql`${leases.endDate} >= ${today.toISOString().split('T')[0]}`
    ));

  const results = [];
  for (const lease of expiringLeases) {
    const existing = await db.select().from(vacancyReminders)
      .where(and(
        eq(vacancyReminders.apartmentId, lease.apartmentId),
        eq(vacancyReminders.leaseEndDate, lease.endDate),
        eq(vacancyReminders.processed, false)
      ));
    
    if (existing.length === 0) {
      const [reminder] = await db.insert(vacancyReminders).values({
        apartmentId: lease.apartmentId,
        leaseEndDate: lease.endDate,
        reminderDate: sql`${lease.endDate}::date - interval '30 days'`,
        type: 'upcoming',
      }).returning();
      results.push(reminder);
    }
  }

  return c.json({ generated: results.length, results });
});

app.post('/:id/process', zValidator('json', processReminderSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  const { note, createTodo, todoTitle, todoAssigneeId } = c.req.valid('json');

  const result = await db.transaction(async (tx) => {
    const [reminder] = await tx.update(vacancyReminders).set({
      processed: true,
      processedById: user.id,
      note,
    }).where(eq(vacancyReminders.id, id)).returning();

    if (!reminder) {
      throw new Error('提醒不存在');
    }

    if (createTodo && todoTitle) {
      await tx.insert(todos).values({
        type: 'vacancy',
        refId: reminder.id,
        title: todoTitle,
        description: note || '',
        priority: 'high',
        assigneeId: todoAssigneeId || user.id,
        status: 'pending',
      });
    }

    return reminder;
  });

  return c.json(result);
});

export default app;
