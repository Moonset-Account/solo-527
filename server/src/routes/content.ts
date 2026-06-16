import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { podcastContents } from '../db/schema.js';
import { eq, and, desc, asc, count, gte, lte } from 'drizzle-orm';

const app = new Hono();

const contentQuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  isMemberOnly: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

const createContentSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  audioUrl: z.string().optional(),
  isMemberOnly: z.boolean().optional().default(false),
  publishDate: z.string().optional(),
});

const updateContentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  audioUrl: z.string().optional(),
  isMemberOnly: z.boolean().optional(),
  publishDate: z.string().optional(),
});

app.get('/', async (c) => {
  const query = c.req.query();
  const result = contentQuerySchema.safeParse(query);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { page, pageSize, isMemberOnly, startDate, endDate } = result.data;
  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * sizeNum;

  const conditions = [];
  if (isMemberOnly !== undefined) {
    conditions.push(eq(podcastContents.isMemberOnly, isMemberOnly === 'true'));
  }
  if (startDate) {
    conditions.push(gte(podcastContents.publishDate, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(podcastContents.publishDate, new Date(endDate)));
  }

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(podcastContents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(podcastContents.publishDate))
      .limit(sizeNum)
      .offset(offset),
    db
      .select({ count: count(podcastContents.id) })
      .from(podcastContents)
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

app.get('/public', async (c) => {
  const query = c.req.query();
  const page = query.page || '1';
  const pageSize = query.pageSize || '20';
  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * sizeNum;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(podcastContents)
      .where(eq(podcastContents.isMemberOnly, false))
      .orderBy(desc(podcastContents.publishDate))
      .limit(sizeNum)
      .offset(offset),
    db
      .select({ count: count(podcastContents.id) })
      .from(podcastContents)
      .where(eq(podcastContents.isMemberOnly, false)),
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

app.get('/member', async (c) => {
  const query = c.req.query();
  const page = query.page || '1';
  const pageSize = query.pageSize || '20';
  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * sizeNum;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(podcastContents)
      .where(eq(podcastContents.isMemberOnly, true))
      .orderBy(desc(podcastContents.publishDate))
      .limit(sizeNum)
      .offset(offset),
    db
      .select({ count: count(podcastContents.id) })
      .from(podcastContents)
      .where(eq(podcastContents.isMemberOnly, true)),
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

  const contentList = await db
    .select()
    .from(podcastContents)
    .where(eq(podcastContents.id, id))
    .limit(1);

  const content = contentList[0];

  if (!content) {
    return c.json({ error: 'Podcast content not found' }, 404);
  }

  return c.json({ content });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const result = createContentSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const data: any = {
    title: result.data.title,
    isMemberOnly: result.data.isMemberOnly,
  };

  if (result.data.description !== undefined) {
    data.description = result.data.description;
  }
  if (result.data.audioUrl !== undefined) {
    data.audioUrl = result.data.audioUrl;
  }
  if (result.data.publishDate !== undefined) {
    data.publishDate = new Date(result.data.publishDate);
  }

  const newContents = await db
    .insert(podcastContents)
    .values(data)
    .returning();

  return c.json({ content: newContents[0] }, 201);
});

app.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = updateContentSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const data: any = {};
  if (result.data.title !== undefined) data.title = result.data.title;
  if (result.data.description !== undefined) data.description = result.data.description;
  if (result.data.audioUrl !== undefined) data.audioUrl = result.data.audioUrl;
  if (result.data.isMemberOnly !== undefined) data.isMemberOnly = result.data.isMemberOnly;
  if (result.data.publishDate !== undefined) data.publishDate = new Date(result.data.publishDate);

  const updated = await db
    .update(podcastContents)
    .set(data)
    .where(eq(podcastContents.id, id))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Podcast content not found' }, 404);
  }

  return c.json({ content: updated[0] });
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const deleted = await db
    .delete(podcastContents)
    .where(eq(podcastContents.id, id))
    .returning();

  if (deleted.length === 0) {
    return c.json({ error: 'Podcast content not found' }, 404);
  }

  return c.json({ message: 'Podcast content deleted successfully' });
});

export default app;
