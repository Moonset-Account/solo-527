import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { readingConversions, publishSchedules, materials, materialTags, tags, exceptions, topicScripts } from '../db/schema.js';
import { eq, sql, and, desc } from 'drizzle-orm';

const app = new Hono();

app.get('/overview', async (c) => {
  const [materialCount] = await db.select({ count: sql<number>`count(*)` }).from(materials);
  const [scheduleCount] = await db.select({ count: sql<number>`count(*)` }).from(publishSchedules);
  const [openExceptions] = await db
    .select({ count: sql<number>`count(*)` })
    .from(exceptions)
    .where(eq(exceptions.status, 'open'));
  const [publishedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(publishSchedules)
    .where(eq(publishSchedules.status, 'published'));

  const conversionSummary = await db
    .select({
      totalViews: sql<number>`coalesce(sum(${readingConversions.views}), 0)`,
      totalReads: sql<number>`coalesce(sum(${readingConversions.reads}), 0)`,
      totalShares: sql<number>`coalesce(sum(${readingConversions.shares}), 0)`,
      totalComments: sql<number>`coalesce(sum(${readingConversions.comments}), 0)`,
    })
    .from(readingConversions);

  return c.json({
    data: {
      materialCount: materialCount.count,
      scheduleCount: scheduleCount.count,
      openExceptions: openExceptions.count,
      publishedCount: publishedCount.count,
      conversions: conversionSummary[0],
    },
  });
});

app.get('/conversion-trend', async (c) => {
  const { days } = c.req.query();
  const daysNum = Number(days) || 7;

  const result = await db
    .select({
      date: sql<string>`date(${readingConversions.recordedAt})`,
      views: sql<number>`coalesce(sum(${readingConversions.views}), 0)`,
      reads: sql<number>`coalesce(sum(${readingConversions.reads}), 0)`,
      shares: sql<number>`coalesce(sum(${readingConversions.shares}), 0)`,
      comments: sql<number>`coalesce(sum(${readingConversions.comments}), 0)`,
    })
    .from(readingConversions)
    .where(sql`${readingConversions.recordedAt} >= now() - interval '${daysNum} days'`)
    .groupBy(sql`date(${readingConversions.recordedAt})`)
    .orderBy(sql`date(${readingConversions.recordedAt})`);

  return c.json({ data: result });
});

app.get('/top-materials', async (c) => {
  const result = await db
    .select({
      id: materials.id,
      title: materials.title,
      reuseCount: materials.reuseCount,
      createdAt: materials.createdAt,
    })
    .from(materials)
    .orderBy(desc(materials.reuseCount))
    .limit(10);

  return c.json({ data: result });
});

app.get('/tag-distribution', async (c) => {
  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      count: sql<number>`count(${materialTags.materialId})`,
    })
    .from(tags)
    .leftJoin(materialTags, eq(tags.id, materialTags.tagId))
    .groupBy(tags.id)
    .orderBy(desc(sql`count(${materialTags.materialId})`));

  return c.json({ data: result });
});

app.get('/detail/:id', async (c) => {
  const id = c.req.param('id');

  const [material] = await db.select().from(materials).where(eq(materials.id, id));
  if (!material) return c.json({ error: 'Not found' }, 404);

  const tagResult = await db
    .select({ id: tags.id, name: tags.name, color: tags.color })
    .from(materialTags)
    .innerJoin(tags, eq(materialTags.tagId, tags.id))
    .where(eq(materialTags.materialId, id));

  const scriptResult = await db
    .select()
    .from(topicScripts)
    .where(eq(topicScripts.materialId, id));

  const scriptIds = scriptResult.map((s) => s.id);
  let schedules: any[] = [];
  if (scriptIds.length > 0) {
    schedules = await db
      .select()
      .from(publishSchedules)
      .where(sql`${publishSchedules.scriptId} = ANY(${scriptIds})`);
  }

  return c.json({
    data: {
      material,
      tags: tagResult,
      scripts: scriptResult,
      schedules,
    },
  });
});

export default app;
