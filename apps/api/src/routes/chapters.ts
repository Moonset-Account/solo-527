import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import { chapters, chapterMaterials, trainingCamps } from '../db/schema';

const chaptersRouter = new Hono();

const createChapterSchema = z.object({
  campId: z.string().uuid(),
  title: z.string().min(1, '章节标题必填'),
  description: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  duration: z.number().min(0).default(0),
  sortOrder: z.number().default(0),
  status: z.enum(['draft', 'published']).default('draft'),
  isPreview: z.boolean().default(false),
});

const updateChapterSchema = createChapterSchema.partial();

chaptersRouter.get('/', async (c) => {
  const { campId } = c.req.query();
  let where: any = undefined;
  if (campId) {
    where = eq(chapters.campId, campId);
  }

  const allChapters = await db
    .select()
    .from(chapters)
    .where(where)
    .orderBy(asc(chapters.campId), asc(chapters.sortOrder));

  return c.json(allChapters);
});

chaptersRouter.get('/preview', async (c) => {
  const { campId } = c.req.query();
  let where: any = eq(chapters.isPreview, true);
  if (campId) {
    where = and(eq(chapters.isPreview, true), eq(chapters.campId, campId));
  }

  const previews = await db
    .select({
      id: chapters.id,
      title: chapters.title,
      description: chapters.description,
      videoUrl: chapters.videoUrl,
      duration: chapters.duration,
      sortOrder: chapters.sortOrder,
      campId: chapters.campId,
      campName: trainingCamps.name,
    })
    .from(chapters)
    .leftJoin(trainingCamps, eq(trainingCamps.id, chapters.campId))
    .where(and(where, eq(chapters.status, 'published')))
    .orderBy(asc(chapters.campId), asc(chapters.sortOrder));

  return c.json(previews);
});

chaptersRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const chapter = await db.select().from(chapters).where(eq(chapters.id, id));
  if (chapter.length === 0) {
    return c.json({ message: '章节不存在' }, 404);
  }
  const mats = await db
    .select()
    .from(chapterMaterials)
    .where(eq(chapterMaterials.chapterId, id))
    .orderBy(desc(chapterMaterials.createdAt));
  return c.json({
    ...chapter[0],
    materials: mats,
  });
});

chaptersRouter.post('/', zValidator('json', createChapterSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db.insert(chapters).values(data).returning();

  await db
    .update(trainingCamps)
    .set({ updatedAt: new Date() })
    .where(eq(trainingCamps.id, data.campId));

  return c.json(result[0], 201);
});

chaptersRouter.put('/:id', zValidator('json', updateChapterSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .update(chapters)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(chapters.id, id))
    .returning();
  if (result.length === 0) {
    return c.json({ message: '章节不存在' }, 404);
  }
  return c.json(result[0]);
});

chaptersRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const chapter = await db.select().from(chapters).where(eq(chapters.id, id));
  if (chapter.length === 0) {
    return c.json({ message: '章节不存在' }, 404);
  }

  const result = await db.delete(chapters).where(eq(chapters.id, id)).returning();

  await db
    .update(trainingCamps)
    .set({ updatedAt: new Date() })
    .where(eq(trainingCamps.id, chapter[0].campId));

  return c.json({ deleted: true, item: result[0] });
});

const materialSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['pdf', 'video', 'audio', 'image', 'zip', 'other']),
  url: z.string().url(),
  fileSize: z.number().optional(),
});

chaptersRouter.get('/:id/materials', async (c) => {
  const id = c.req.param('id');
  const mats = await db
    .select()
    .from(chapterMaterials)
    .where(eq(chapterMaterials.chapterId, id))
    .orderBy(desc(chapterMaterials.createdAt));
  return c.json(mats);
});

chaptersRouter.post('/:id/materials', zValidator('json', materialSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .insert(chapterMaterials)
    .values({ ...data, chapterId: id })
    .returning();
  return c.json(result[0], 201);
});

chaptersRouter.delete('/:id/materials/:materialId', async (c) => {
  const { id, materialId } = c.req.param();
  await db
    .delete(chapterMaterials)
    .where(and(eq(chapterMaterials.chapterId, id), eq(chapterMaterials.id, materialId)));
  return c.json({ deleted: true });
});

chaptersRouter.patch('/:id/toggle-preview', async (c) => {
  const id = c.req.param('id');
  const existing = await db.select().from(chapters).where(eq(chapters.id, id));
  if (existing.length === 0) {
    return c.json({ message: '章节不存在' }, 404);
  }
  const result = await db
    .update(chapters)
    .set({ isPreview: !existing[0].isPreview, updatedAt: new Date() })
    .where(eq(chapters.id, id))
    .returning();
  return c.json(result[0]);
});

export { chaptersRouter };
