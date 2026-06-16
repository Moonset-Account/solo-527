import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, asc, between, ilike, sql, gte, lte, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { trainingCamps, campMaterials, chapters, members } from '../db/schema.js';
import { paginate, parsePagination } from '../lib/utils.js';

const campsRouter = new Hono();

const createCampSchema = z.object({
  name: z.string().min(1, '营期名称必填'),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  status: z.enum(['draft', 'upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
  maxMembers: z.number().min(1).default(100),
  price: z.number().min(0).default(0),
  operatorId: z.string().uuid().optional(),
});

const updateCampSchema = createCampSchema.partial();

campsRouter.get('/', async (c) => {
  const { page, pageSize } = parsePagination(c.req.query());
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.status) {
    conditions.push(eq(trainingCamps.status, query.status as any));
  }
  if (query.keyword) {
    conditions.push(ilike(trainingCamps.name, `%${query.keyword}%`));
  }
  if (query.startDate) {
    conditions.push(gte(trainingCamps.startDate, new Date(query.startDate)));
  }
  if (query.endDate) {
    conditions.push(lte(trainingCamps.endDate, new Date(query.endDate)));
  }
  if (query.operatorId) {
    conditions.push(eq(trainingCamps.operatorId, query.operatorId));
  }
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const allCamps = await db.select().from(trainingCamps).where(where).orderBy(desc(trainingCamps.startDate));

  const campsWithCounts = await Promise.all(
    allCamps.map(async (camp) => {
      const chaptersCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(chapters)
        .where(eq(chapters.campId, camp.id));
      const materialsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(campMaterials)
        .where(eq(campMaterials.campId, camp.id));
      return {
        ...camp,
        chaptersCount: Number(chaptersCount[0].count),
        materialsCount: Number(materialsCount[0].count),
      };
    }),
  );

  return c.json(paginate(campsWithCounts, page, pageSize));
});

campsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const camp = await db.select().from(trainingCamps).where(eq(trainingCamps.id, id));
  if (camp.length === 0) {
    return c.json({ message: '营期不存在' }, 404);
  }

  const campChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.campId, id))
    .orderBy(asc(chapters.sortOrder));
  const campMats = await db
    .select()
    .from(campMaterials)
    .where(eq(campMaterials.campId, id))
    .orderBy(desc(campMaterials.createdAt));
  const membersCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(eq(members.campId, id));

  return c.json({
    ...camp[0],
    chapters: campChapters,
    materials: campMats,
    membersCount: Number(membersCount[0].count),
  });
});

campsRouter.post('/', zValidator('json', createCampSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db
    .insert(trainingCamps)
    .values({
      ...data,
      price: data.price !== undefined ? String(data.price) : undefined,
      status: data.status || 'draft',
    })
    .returning();
  return c.json(result[0], 201);
});

campsRouter.put('/:id', zValidator('json', updateCampSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const updateData: any = { ...data, updatedAt: new Date() };
  if (data.price !== undefined) {
    updateData.price = String(data.price);
  }
  const result = await db
    .update(trainingCamps)
    .set(updateData)
    .where(eq(trainingCamps.id, id))
    .returning();
  if (result.length === 0) {
    return c.json({ message: '营期不存在' }, 404);
  }
  return c.json(result[0]);
});

campsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(trainingCamps).where(eq(trainingCamps.id, id)).returning();
  if (result.length === 0) {
    return c.json({ message: '营期不存在' }, 404);
  }
  return c.json({ deleted: true, item: result[0] });
});

const materialSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['pdf', 'video', 'audio', 'image', 'zip', 'other']),
  url: z.string().url(),
  fileSize: z.number().optional(),
});

campsRouter.get('/:id/materials', async (c) => {
  const id = c.req.param('id');
  const mats = await db
    .select()
    .from(campMaterials)
    .where(eq(campMaterials.campId, id))
    .orderBy(desc(campMaterials.createdAt));
  return c.json(mats);
});

campsRouter.post('/:id/materials', zValidator('json', materialSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .insert(campMaterials)
    .values({ ...data, campId: id })
    .returning();
  return c.json(result[0], 201);
});

campsRouter.delete('/:id/materials/:materialId', async (c) => {
  const { id, materialId } = c.req.param();
  await db
    .delete(campMaterials)
    .where(and(eq(campMaterials.campId, id), eq(campMaterials.id, materialId)));
  return c.json({ deleted: true });
});

export { campsRouter };
