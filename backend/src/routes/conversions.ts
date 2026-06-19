import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { readingConversions, publishSchedules } from '../db/schema.js';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

const conversionSchema = z.object({
  scheduleId: z.string().uuid(),
  views: z.number().optional(),
  reads: z.number().optional(),
  shares: z.number().optional(),
  comments: z.number().optional(),
  conversionRate: z.string().optional(),
});

app.get('/', async (c) => {
  const { scheduleId, from, to } = c.req.query();
  const conditions = [];
  if (scheduleId) conditions.push(eq(readingConversions.scheduleId, scheduleId));
  if (from) conditions.push(gte(readingConversions.recordedAt, new Date(from)));
  if (to) conditions.push(lte(readingConversions.recordedAt, new Date(to)));

  const result = await db
    .select({
      id: readingConversions.id,
      scheduleId: readingConversions.scheduleId,
      views: readingConversions.views,
      reads: readingConversions.reads,
      shares: readingConversions.shares,
      comments: readingConversions.comments,
      conversionRate: readingConversions.conversionRate,
      recordedAt: readingConversions.recordedAt,
      scheduleTitle: publishSchedules.title,
      platform: publishSchedules.platform,
    })
    .from(readingConversions)
    .leftJoin(publishSchedules, eq(readingConversions.scheduleId, publishSchedules.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(readingConversions.recordedAt));
  return c.json({ data: result });
});

app.get('/summary', async (c) => {
  const result = await db
    .select({
      totalViews: sql<number>`coalesce(sum(${readingConversions.views}), 0)`,
      totalReads: sql<number>`coalesce(sum(${readingConversions.reads}), 0)`,
      totalShares: sql<number>`coalesce(sum(${readingConversions.shares}), 0)`,
      totalComments: sql<number>`coalesce(sum(${readingConversions.comments}), 0)`,
      avgConversionRate: sql<string>`coalesce(avg(${readingConversions.conversionRate}::numeric), 0)`,
    })
    .from(readingConversions);
  return c.json({ data: result[0] });
});

app.post('/', zValidator('json', conversionSchema), async (c) => {
  const body = c.req.valid('json');
  const [conversion] = await db.insert(readingConversions).values(body).returning();
  return c.json({ data: conversion }, 201);
});

app.post('/batch', zValidator('json', z.array(conversionSchema)), async (c) => {
  const body = c.req.valid('json');
  const result = await db.insert(readingConversions).values(body).returning();
  return c.json({ data: result }, 201);
});

export default app;
