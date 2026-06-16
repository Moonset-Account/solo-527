import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, gte, lte, asc, sql } from 'drizzle-orm';
import { db } from '../db';
import { checkinRecords, members, users, chapters, trainingCamps } from '../db/schema';
import { paginate, parsePagination } from '../lib/utils';

const checkinsRouter = new Hono();

const createCheckinSchema = z.object({
  memberId: z.string().uuid(),
  chapterId: z.string().uuid(),
  campId: z.string().uuid(),
  content: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  checkedInAt: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
});

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewComment: z.string().optional(),
  reviewedBy: z.string().uuid().optional(),
});

checkinsRouter.get('/', async (c) => {
  const { page, pageSize } = parsePagination(c.req.query());
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.campId) {
    conditions.push(eq(checkinRecords.campId, query.campId));
  }
  if (query.memberId) {
    conditions.push(eq(checkinRecords.memberId, query.memberId));
  }
  if (query.chapterId) {
    conditions.push(eq(checkinRecords.chapterId, query.chapterId));
  }
  if (query.status) {
    conditions.push(eq(checkinRecords.status, query.status as any));
  }
  if (query.reviewedBy) {
    conditions.push(eq(checkinRecords.reviewedBy, query.reviewedBy));
  }
  if (query.startDate) {
    conditions.push(gte(checkinRecords.checkedInAt, new Date(query.startDate)));
  }
  if (query.endDate) {
    conditions.push(lte(checkinRecords.checkedInAt, new Date(query.endDate)));
  }
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const allCheckins = await db
    .select({
      id: checkinRecords.id,
      memberId: checkinRecords.memberId,
      chapterId: checkinRecords.chapterId,
      campId: checkinRecords.campId,
      content: checkinRecords.content,
      imageUrls: checkinRecords.imageUrls,
      status: checkinRecords.status,
      checkedInAt: checkinRecords.checkedInAt,
      reviewedBy: checkinRecords.reviewedBy,
      reviewedAt: checkinRecords.reviewedAt,
      reviewComment: checkinRecords.reviewComment,
      createdAt: checkinRecords.createdAt,
      memberNo: members.memberNo,
      userName: users.name,
      chapterTitle: chapters.title,
      campName: trainingCamps.name,
      reviewerName: sql`case when checkin_records.reviewed_by is not null then (select name from users where id = checkin_records.reviewed_by) else null end`,
    })
    .from(checkinRecords)
    .leftJoin(members, eq(members.id, checkinRecords.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(chapters, eq(chapters.id, checkinRecords.chapterId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, checkinRecords.campId))
    .where(where)
    .orderBy(desc(checkinRecords.checkedInAt));

  return c.json(paginate(allCheckins, page, pageSize));
});

checkinsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const checkin = await db
    .select({
      id: checkinRecords.id,
      memberId: checkinRecords.memberId,
      chapterId: checkinRecords.chapterId,
      campId: checkinRecords.campId,
      content: checkinRecords.content,
      imageUrls: checkinRecords.imageUrls,
      status: checkinRecords.status,
      checkedInAt: checkinRecords.checkedInAt,
      reviewedBy: checkinRecords.reviewedBy,
      reviewedAt: checkinRecords.reviewedAt,
      reviewComment: checkinRecords.reviewComment,
      createdAt: checkinRecords.createdAt,
      memberNo: members.memberNo,
      userName: users.name,
      userPhone: users.phone,
      chapterTitle: chapters.title,
      campName: trainingCamps.name,
    })
    .from(checkinRecords)
    .leftJoin(members, eq(members.id, checkinRecords.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(chapters, eq(chapters.id, checkinRecords.chapterId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, checkinRecords.campId))
    .where(eq(checkinRecords.id, id));

  if (checkin.length === 0) {
    return c.json({ message: '打卡记录不存在' }, 404);
  }
  return c.json(checkin[0]);
});

checkinsRouter.post('/', zValidator('json', createCheckinSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db
    .insert(checkinRecords)
    .values({
      ...data,
      checkedInAt: data.checkedInAt || new Date(),
    })
    .returning();
  return c.json(result[0], 201);
});

checkinsRouter.patch('/:id/review', zValidator('json', reviewSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .update(checkinRecords)
    .set({
      status: data.status,
      reviewComment: data.reviewComment,
      reviewedBy: data.reviewedBy,
      reviewedAt: new Date(),
    })
    .where(eq(checkinRecords.id, id))
    .returning();
  if (result.length === 0) {
    return c.json({ message: '打卡记录不存在' }, 404);
  }
  return c.json(result[0]);
});

checkinsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(checkinRecords).where(eq(checkinRecords.id, id)).returning();
  if (result.length === 0) {
    return c.json({ message: '打卡记录不存在' }, 404);
  }
  return c.json({ deleted: true, item: result[0] });
});

export { checkinsRouter };
