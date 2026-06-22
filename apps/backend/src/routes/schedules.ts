import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { coachSchedules, users } from '../db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { logOperation } from '../utils/logger';

export const scheduleRoutes = new Hono();

scheduleRoutes.use('*', authMiddleware);

const scheduleSchema = z.object({
  coachId: z.number(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  courseType: z.string().optional(),
  maxStudents: z.number().optional(),
  status: z.enum(['scheduled', 'cancelled', 'completed']).optional(),
  notes: z.string().optional(),
});

scheduleRoutes.get('/', async (c) => {
  const coachId = c.req.query('coachId');
  const status = c.req.query('status');
  const courseType = c.req.query('courseType');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (coachId) {
    conditions.push(eq(coachSchedules.coachId, parseInt(coachId)));
  }
  if (status) {
    conditions.push(eq(coachSchedules.status, status as any));
  }
  if (courseType) {
    conditions.push(eq(coachSchedules.courseType, courseType));
  }
  if (startDate) {
    conditions.push(gte(coachSchedules.date, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(coachSchedules.date, new Date(endDate)));
  }

  const [schedules, total] = await Promise.all([
    db
      .select({
        id: coachSchedules.id,
        coachId: coachSchedules.coachId,
        coachName: users.name,
        date: coachSchedules.date,
        startTime: coachSchedules.startTime,
        endTime: coachSchedules.endTime,
        location: coachSchedules.location,
        courseType: coachSchedules.courseType,
        maxStudents: coachSchedules.maxStudents,
        status: coachSchedules.status,
        notes: coachSchedules.notes,
      })
      .from(coachSchedules)
      .leftJoin(users, eq(coachSchedules.coachId, users.id))
      .where(and(...conditions))
      .orderBy(desc(coachSchedules.date), coachSchedules.startTime)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(coachSchedules)
      .where(and(...conditions))
      .then((res) => res[0].count),
  ]);

  return c.json({ data: schedules, total, page, limit });
});

scheduleRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [schedule] = await db
    .select({
      id: coachSchedules.id,
      coachId: coachSchedules.coachId,
      coachName: users.name,
      date: coachSchedules.date,
      startTime: coachSchedules.startTime,
      endTime: coachSchedules.endTime,
      location: coachSchedules.location,
      courseType: coachSchedules.courseType,
      maxStudents: coachSchedules.maxStudents,
      status: coachSchedules.status,
      notes: coachSchedules.notes,
    })
    .from(coachSchedules)
    .leftJoin(users, eq(coachSchedules.coachId, users.id))
    .where(eq(coachSchedules.id, id))
    .limit(1);

  if (!schedule) {
    return c.json({ error: 'Schedule not found' }, 404);
  }
  return c.json(schedule);
});

scheduleRoutes.post('/', zValidator('json', scheduleSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const [newSchedule] = await db
    .insert(coachSchedules)
    .values({
      ...(data as any),
      date: new Date(data.date),
    })
    .returning();

  await logOperation(payload.userId, 'create_schedule', 'schedules', newSchedule.id, {
    coachId: data.coachId,
    date: data.date,
  });

  return c.json(newSchedule, 201);
});

scheduleRoutes.put('/:id', zValidator('json', scheduleSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const [updated] = await db
    .update(coachSchedules)
    .set({
      ...(data as any),
      date: new Date(data.date),
      updatedAt: new Date(),
    })
    .where(eq(coachSchedules.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Schedule not found' }, 404);
  }

  await logOperation(payload.userId, 'update_schedule', 'schedules', id, {});

  return c.json(updated);
});

scheduleRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const payload = c.get('jwtPayload');

  const result = await db.delete(coachSchedules).where(eq(coachSchedules.id, id));

  if (result.rowCount === 0) {
    return c.json({ error: 'Schedule not found' }, 404);
  }

  await logOperation(payload.userId, 'delete_schedule', 'schedules', id, {});

  return c.json({ message: 'Schedule deleted' });
});
