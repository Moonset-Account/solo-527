import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { events, venueUsageReports, users } from '../db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { logOperation } from '../utils/logger';

export const eventRoutes = new Hono();

eventRoutes.use('*', authMiddleware);

const eventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  originalDate: z.string(),
  currentDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().min(1).max(200),
  organizer: z.string().optional(),
  participants: z.number().optional(),
  status: z.enum(['scheduled', 'rescheduled', 'cancelled', 'completed', 'closed']).optional(),
  rescheduleReason: z.string().optional(),
});

function formatDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

eventRoutes.get('/', async (c) => {
  const status = c.req.query('status');
  const location = c.req.query('location');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const search = c.req.query('search') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) {
    conditions.push(eq(events.status, status as any));
  }
  if (location) {
    conditions.push(eq(events.location, location));
  }
  if (startDate) {
    conditions.push(gte(events.currentDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(events.currentDate, endDate));
  }

  let query = db.select().from(events).where(and(...conditions));

  if (search) {
    query = query.where(
      sql`(${events.name} ILIKE ${`%${search}%`} OR ${events.organizer} ILIKE ${`%${search}%`})`
    );
  }

  const [eventList, total] = await Promise.all([
    query.orderBy(desc(events.currentDate)).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(...conditions))
      .then((res) => res[0].count),
  ]);

  return c.json({ data: eventList, total, page, limit });
});

eventRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }
  return c.json(event);
});

eventRoutes.post('/', zValidator('json', eventSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload') as any;

  const [newEvent] = await db
    .insert(events)
    .values({
      name: data.name,
      description: data.description,
      originalDate: data.originalDate,
      currentDate: data.currentDate,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      organizer: data.organizer,
      participants: data.participants,
      status: data.status,
      rescheduleReason: data.rescheduleReason,
    } as any)
    .returning();

  await updateVenueUsageReport(data.currentDate);

  await logOperation(payload.userId, 'create_event', 'events', newEvent.id, {
    name: data.name,
    date: data.currentDate,
  });

  return c.json(newEvent, 201);
});

eventRoutes.put('/:id', zValidator('json', eventSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload') as any;

  const oldEvent = await db.select().from(events).where(eq(events.id, id)).limit(1);

  const [updated] = await db
    .update(events)
    .set({
      name: data.name,
      description: data.description,
      originalDate: data.originalDate,
      currentDate: data.currentDate,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      organizer: data.organizer,
      participants: data.participants,
      status: data.status,
      rescheduleReason: data.rescheduleReason,
      updatedAt: new Date(),
    } as any)
    .where(eq(events.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Event not found' }, 404);
  }

  if (oldEvent && oldEvent[0] && oldEvent[0].currentDate !== data.currentDate) {
    await updateVenueUsageReport(oldEvent[0].currentDate);
  }
  await updateVenueUsageReport(data.currentDate);

  await logOperation(payload.userId, 'update_event', 'events', id, {});

  return c.json(updated);
});

eventRoutes.post('/:id/reschedule', zValidator('json', z.object({
  newDate: z.string(),
  reason: z.string(),
})), async (c) => {
  const id = parseInt(c.req.param('id'));
  const { newDate, reason } = c.req.valid('json');
  const payload = c.get('jwtPayload') as any;

  const oldEvent = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!oldEvent[0]) {
    return c.json({ error: 'Event not found' }, 404);
  }

  const [updated] = await db
    .update(events)
    .set({
      currentDate: newDate,
      status: 'rescheduled',
      rescheduleReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();

  await updateVenueUsageReport(oldEvent[0].currentDate);
  await updateVenueUsageReport(newDate);

  await logOperation(payload.userId, 'reschedule_event', 'events', id, {
    newDate,
    reason,
  });

  return c.json(updated);
});

eventRoutes.post('/:id/close', async (c) => {
  const id = parseInt(c.req.param('id'));
  const payload = c.get('jwtPayload') as any;

  const [updated] = await db
    .update(events)
    .set({
      status: 'closed',
      closedAt: new Date(),
      closedBy: payload.userId,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Event not found' }, 404);
  }

  await updateVenueUsageReport(updated.currentDate);

  await logOperation(payload.userId, 'close_event', 'events', id, {});

  return c.json(updated);
});

eventRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const payload = c.get('jwtPayload') as any;

  const event = await db.select().from(events).where(eq(events.id, id)).limit(1);

  const result = await db.delete(events).where(eq(events.id, id));

  if (result.rowCount === 0) {
    return c.json({ error: 'Event not found' }, 404);
  }

  if (event[0]?.currentDate) {
    await updateVenueUsageReport(event[0].currentDate);
  }

  await logOperation(payload.userId, 'delete_event', 'events', id, {});

  return c.json({ message: 'Event deleted' });
});

async function updateVenueUsageReport(dateStr: string) {
  const eventCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(events)
    .where(and(
      eq(events.currentDate, dateStr),
      sql`${events.status} != 'cancelled'`
    ));

  const eventCount = eventCountResult[0]?.count || 0;

  const existing = await db
    .select()
    .from(venueUsageReports)
    .where(eq(venueUsageReports.date, dateStr))
    .limit(1);

  const totalHours = 12;
  const eventHours = eventCount * 2;
  const usedHours = eventHours;
  const utilizationRate = totalHours > 0 ? (usedHours / totalHours) * 100 : 0;

  if (existing[0]) {
    await db
      .update(venueUsageReports)
      .set({
        eventCount,
        usedHours: usedHours.toFixed(2),
        utilizationRate: utilizationRate.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(venueUsageReports.id, existing[0].id));
  } else {
    await db.insert(venueUsageReports).values({
      date: dateStr,
      totalHours: totalHours.toString(),
      usedHours: usedHours.toFixed(2),
      utilizationRate: utilizationRate.toFixed(2),
      eventCount,
    });
  }
}
