import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { materials, materialTags, tags, auditLogs } from '../db/schema.js';
import { eq, ilike, and, sql, inArray } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

const materialSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  uploadedBy: z.string().min(1),
  tagIds: z.array(z.string().uuid()).optional(),
});

async function attachTagsToMaterials(materialList: any[]) {
  if (materialList.length === 0) return [];
  const materialIds = materialList.map((m) => m.id);
  const tagLinks = await db
    .select({
      materialId: materialTags.materialId,
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
    })
    .from(materialTags)
    .innerJoin(tags, eq(materialTags.tagId, tags.id))
    .where(inArray(materialTags.materialId, materialIds));

  const tagMap = new Map<string, any[]>();
  for (const link of tagLinks) {
    if (!tagMap.has(link.materialId)) tagMap.set(link.materialId, []);
    tagMap.get(link.materialId)!.push({
      id: link.tagId,
      name: link.tagName,
      color: link.tagColor,
    });
  }

  return materialList.map((m) => ({
    ...m,
    tags: tagMap.get(m.id) || [],
  }));
}

app.get('/', async (c) => {
  const { tag, q, page, limit } = c.req.query();
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  let materialIds: string[] | null = null;

  if (tag) {
    const filteredIds = await db
      .select({ materialId: materialTags.materialId })
      .from(materialTags)
      .where(eq(materialTags.tagId, tag));
    materialIds = filteredIds.map((r) => r.materialId);
    if (materialIds.length === 0) {
      return c.json({ data: [], total: 0, page: pageNum, limit: limitNum });
    }
  }

  const conditions = [];
  if (q) conditions.push(ilike(materials.title, `%${q}%`));
  if (materialIds) conditions.push(inArray(materials.id, materialIds));

  const result = await db
    .select()
    .from(materials)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limitNum)
    .offset(offset)
    .orderBy(sql`${materials.createdAt} DESC`);

  const withTags = await attachTagsToMaterials(result);

  return c.json({ data: withTags, page: pageNum, limit: limitNum });
});

app.get('/reuse-suggestions', async (c) => {
  const result = await db
    .select()
    .from(materials)
    .where(sql`${materials.reuseCount} > 0`)
    .orderBy(sql`${materials.reuseCount} DESC`)
    .limit(10);
  const withTags = await attachTagsToMaterials(result);
  return c.json({ data: withTags });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [material] = await db.select().from(materials).where(eq(materials.id, id));
  if (!material) return c.json({ error: 'Not found' }, 404);

  const tagLinks = await db
    .select({ id: tags.id, name: tags.name, color: tags.color })
    .from(materialTags)
    .innerJoin(tags, eq(materialTags.tagId, tags.id))
    .where(eq(materialTags.materialId, id));

  return c.json({
    data: {
      ...material,
      tagIds: tagLinks.map((t) => t.id),
      tags: tagLinks,
    },
  });
});

app.post('/', zValidator('json', materialSchema), async (c) => {
  const body = c.req.valid('json');
  const [material] = await db.insert(materials).values({
    title: body.title,
    description: body.description,
    fileUrl: body.fileUrl,
    fileType: body.fileType,
    uploadedBy: body.uploadedBy,
  }).returning();

  if (body.tagIds && body.tagIds.length > 0) {
    await db.insert(materialTags).values(
      body.tagIds.map((tagId) => ({ materialId: material.id, tagId }))
    );
  }

  await db.insert(auditLogs).values({
    entityType: 'material',
    entityId: material.id,
    action: 'create',
    operator: body.uploadedBy,
    details: { title: body.title },
  });

  const [withTags] = await attachTagsToMaterials([material]);
  return c.json({ data: withTags }, 201);
});

app.put('/:id', zValidator('json', materialSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const [updated] = await db
    .update(materials)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(materials.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Not found' }, 404);

  if (body.tagIds) {
    await db.delete(materialTags).where(eq(materialTags.materialId, id));
    if (body.tagIds.length > 0) {
      await db.insert(materialTags).values(
        body.tagIds.map((tagId) => ({ materialId: id, tagId }))
      );
    }
  }

  await db.insert(auditLogs).values({
    entityType: 'material',
    entityId: id,
    action: 'update',
    operator: body.uploadedBy || 'system',
    details: body,
  });

  const [withTags] = await attachTagsToMaterials([updated]);
  return c.json({ data: withTags });
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await db.delete(materialTags).where(eq(materialTags.materialId, id));
  const [deleted] = await db.delete(materials).where(eq(materials.id, id)).returning();
  if (!deleted) return c.json({ error: 'Not found' }, 404);

  await db.insert(auditLogs).values({
    entityType: 'material',
    entityId: id,
    action: 'delete',
    operator: 'system',
  });

  return c.json({ data: deleted });
});

export default app;
