import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { schedules, volunteers, pets } from '../db/schema';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { scheduleSchema, volunteerSchema } from '../validations/schema';

export const scheduleRoutes = new Hono();

scheduleRoutes.get('/volunteers', async (c) => {
  const result = await db.select().from(volunteers).orderBy(desc(volunteers.createdAt));
  return c.json(result);
});

scheduleRoutes.post('/volunteers', zValidator('json', volunteerSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db.insert(volunteers).values(data).returning();
  return c.json(result[0], 201);
});

scheduleRoutes.put('/volunteers/:id', zValidator('json', volunteerSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db.update(volunteers).set(data).where(eq(volunteers.id, id)).returning();
  if (!result.length) {
    return c.json({ error: 'Volunteer not found' }, 404);
  }
  return c.json(result[0]);
});

scheduleRoutes.get('/workload', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const groupBy = c.req.query('groupBy') || 'volunteer';

  let dateFilter = sql`1=1`;
  if (startDate) {
    dateFilter = and(dateFilter, gte(schedules.scheduleDate, startDate));
  }
  if (endDate) {
    dateFilter = and(dateFilter, lte(schedules.scheduleDate, endDate));
  }

  if (groupBy === 'volunteer') {
    const result = await db
      .select({
        volunteerId: volunteers.id,
        volunteerName: volunteers.name,
        totalSchedules: sql<number>`count(${schedules.id})`.as('total_schedules'),
        byStatus: sql`json_object_agg(${schedules.status}, cnt)`.as('by_status'),
        byRiskReason: sql`json_object_agg(COALESCE(${schedules.riskReason}, 'none'), risk_cnt)`.as('by_risk_reason'),
      })
      .from(volunteers)
      .leftJoin(schedules, and(eq(schedules.volunteerId, volunteers.id), dateFilter))
      .leftJoin(
        sql`(SELECT volunteer_id, status, count(*) as cnt FROM schedules WHERE ${dateFilter} GROUP BY volunteer_id, status) status_counts`,
        eq(sql`status_counts.volunteer_id`, volunteers.id)
      )
      .leftJoin(
        sql`(SELECT volunteer_id, risk_reason, count(*) as risk_cnt FROM schedules WHERE ${dateFilter} GROUP BY volunteer_id, risk_reason) risk_counts`,
        eq(sql`risk_counts.volunteer_id`, volunteers.id)
      )
      .groupBy(volunteers.id, volunteers.name);

    return c.json(result);
  }

  if (groupBy === 'date') {
    const result = await db
      .select({
        scheduleDate: schedules.scheduleDate,
        totalSchedules: sql<number>`count(${schedules.id})`.as('total_schedules'),
        byVolunteer: sql`json_object_agg(${volunteers.name}, vol_cnt)`.as('by_volunteer'),
        byRiskReason: sql`json_object_agg(COALESCE(${schedules.riskReason}, 'none'), risk_cnt)`.as('by_risk_reason'),
      })
      .from(schedules)
      .leftJoin(volunteers, eq(schedules.volunteerId, volunteers.id))
      .leftJoin(
        sql`(SELECT schedule_date, volunteer_id, count(*) as vol_cnt FROM schedules WHERE ${dateFilter} GROUP BY schedule_date, volunteer_id) vol_counts`,
        and(eq(sql`vol_counts.schedule_date`, schedules.scheduleDate), eq(sql`vol_counts.volunteer_id`, volunteers.id))
      )
      .leftJoin(
        sql`(SELECT schedule_date, risk_reason, count(*) as risk_cnt FROM schedules WHERE ${dateFilter} GROUP BY schedule_date, risk_reason) risk_counts`,
        and(eq(sql`risk_counts.schedule_date`, schedules.scheduleDate), eq(sql`risk_counts.risk_reason`, schedules.riskReason))
      )
      .where(dateFilter)
      .groupBy(schedules.scheduleDate)
      .orderBy(schedules.scheduleDate);

    return c.json(result);
  }

  if (groupBy === 'risk') {
    const result = await db
      .select({
        riskReason: schedules.riskReason,
        totalSchedules: sql<number>`count(${schedules.id})`.as('total_schedules'),
        byVolunteer: sql`json_object_agg(${volunteers.name}, vol_cnt)`.as('by_volunteer'),
        byDate: sql`json_object_agg(${schedules.scheduleDate}::text, date_cnt)`.as('by_date'),
      })
      .from(schedules)
      .leftJoin(volunteers, eq(schedules.volunteerId, volunteers.id))
      .leftJoin(
        sql`(SELECT risk_reason, volunteer_id, count(*) as vol_cnt FROM schedules WHERE ${dateFilter} GROUP BY risk_reason, volunteer_id) vol_counts`,
        and(eq(sql`vol_counts.risk_reason`, schedules.riskReason), eq(sql`vol_counts.volunteer_id`, volunteers.id))
      )
      .leftJoin(
        sql`(SELECT risk_reason, schedule_date, count(*) as date_cnt FROM schedules WHERE ${dateFilter} GROUP BY risk_reason, schedule_date) date_counts`,
        and(eq(sql`date_counts.risk_reason`, schedules.riskReason), eq(sql`date_counts.schedule_date`, schedules.scheduleDate))
      )
      .where(dateFilter)
      .groupBy(schedules.riskReason);

    return c.json(result);
  }

  return c.json({ error: 'Invalid groupBy parameter' }, 400);
});

scheduleRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const volunteerId = c.req.query('volunteerId');
  const petId = c.req.query('petId');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const status = c.req.query('status');
  const riskReason = c.req.query('riskReason');

  let query = db
    .select({
      schedule: schedules,
      volunteer: volunteers,
      pet: pets,
    })
    .from(schedules)
    .leftJoin(volunteers, eq(schedules.volunteerId, volunteers.id))
    .leftJoin(pets, eq(schedules.petId, pets.id))
    .$dynamic();

  if (volunteerId) {
    query = query.where(eq(schedules.volunteerId, volunteerId));
  }
  if (petId) {
    query = query.where(eq(schedules.petId, petId));
  }
  if (startDate) {
    query = query.where(gte(schedules.scheduleDate, startDate));
  }
  if (endDate) {
    query = query.where(lte(schedules.scheduleDate, endDate));
  }
  if (status) {
    query = query.where(eq(schedules.status, status));
  }
  if (riskReason) {
    query = query.where(eq(schedules.riskReason, riskReason));
  }

  const [items, countResult] = await Promise.all([
    query.orderBy(desc(schedules.scheduleDate)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(schedules),
  ]);

  const formatted = items.map((row) => ({
    ...row.schedule,
    volunteer: row.volunteer,
    pet: row.pet,
  }));

  return c.json({
    items: formatted,
    total: countResult[0].count,
    page,
    pageSize,
  });
});

scheduleRoutes.post('/', zValidator('json', scheduleSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db.insert(schedules).values(data).returning();
  return c.json(result[0], 201);
});

scheduleRoutes.put('/:id', zValidator('json', scheduleSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .update(schedules)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(schedules.id, id))
    .returning();
  if (!result.length) {
    return c.json({ error: 'Schedule not found' }, 404);
  }
  return c.json(result[0]);
});

scheduleRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(schedules).where(eq(schedules.id, id)).returning();
  if (!result.length) {
    return c.json({ error: 'Schedule not found' }, 404);
  }
  return c.json({ message: 'Schedule deleted successfully' });
});
