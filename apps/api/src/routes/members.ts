import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, ilike, or, gte, lte, sql, count } from 'drizzle-orm';
import { db } from '../db/index.js';
import { members, users, trainingCamps, memberProgress, chapters, todos } from '../db/schema.js';
import { paginate, parsePagination, generateMemberNo } from '../lib/utils.js';

const membersRouter = new Hono();

const createMemberSchema = z.object({
  userId: z.string().uuid(),
  campId: z.string().uuid(),
  status: z.enum(['active', 'expired', 'refunded', 'paused']).optional(),
  joinDate: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
  expiryDate: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
  conversionSource: z
    .enum(['wechat_group', 'wechat_moments', 'douyin', 'xiaohongshu', 'zhihu', 'referral', 'offline', 'other'])
    .default('other'),
  conversionSourceDetail: z.string().optional(),
  salesPerson: z.string().optional(),
});

const updateMemberSchema = createMemberSchema.partial();

const updateFallingBehind = async (memberId: string) => {
  const member = (await db.select().from(members).where(eq(members.id, memberId)))[0];
  if (!member || member.status !== 'active') return;

  const campChapters = await db
    .select({ count: sql<number>`count(*)` })
    .from(chapters)
    .where(and(eq(chapters.campId, member.campId), eq(chapters.status, 'published')));
  const totalChapters = Number(campChapters[0].count);

  const completed = await db
    .select({ count: sql<number>`count(*)` })
    .from(memberProgress)
    .where(and(eq(memberProgress.memberId, memberId), eq(memberProgress.isCompleted, true)));
  const completedChapters = Number(completed[0].count);

  const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  const joinDate = new Date(member.joinDate).getTime();
  const now = Date.now();
  const camp = (await db.select().from(trainingCamps).where(eq(trainingCamps.id, member.campId)))[0];
  const campDuration = camp.endDate.getTime() - camp.startDate.getTime();
  const elapsed = now - joinDate;
  const expectedProgress = campDuration > 0 ? Math.min(100, (elapsed / campDuration) * 100) : 0;

  const isFallingBehind = progress + 20 < expectedProgress && totalChapters > 0;

  await db
    .update(members)
    .set({
      totalChapters,
      completedChapters,
      progress: String(progress.toFixed(2)),
      isFallingBehind,
      updatedAt: new Date(),
    })
    .where(eq(members.id, memberId));

  if (isFallingBehind) {
    const existingTodo = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.memberId, memberId),
          eq(todos.type, 'fall_behind_warning'),
          or(eq(todos.status, 'pending'), eq(todos.status, 'in_progress')),
        ),
      );
    if (existingTodo.length === 0) {
      const campName = camp.name;
      const userName = (await db.select().from(users).where(eq(users.id, member.userId)))[0]?.name || '学员';
      await db.insert(todos).values({
        title: `${userName} 在【${campName}】中掉队预警`,
        description: `当前进度: ${progress.toFixed(1)}%, 预期进度: ${expectedProgress.toFixed(1)}%，落后超过20%，请及时跟进`,
        type: 'fall_behind_warning',
        priority: 'high',
        status: 'pending',
        memberId,
        campId: member.campId,
        assigneeId: camp.operatorId,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });
    }
  }
};

membersRouter.get('/', async (c) => {
  const { page, pageSize } = parsePagination(c.req.query());
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.campId) {
    conditions.push(eq(members.campId, query.campId));
  }
  if (query.status) {
    conditions.push(eq(members.status, query.status as any));
  }
  if (query.conversionSource) {
    conditions.push(eq(members.conversionSource, query.conversionSource as any));
  }
  if (query.isFallingBehind === 'true') {
    conditions.push(eq(members.isFallingBehind, true));
  }
  if (query.salesPerson) {
    conditions.push(eq(members.salesPerson, query.salesPerson));
  }
  if (query.joinDateStart) {
    conditions.push(gte(members.joinDate, new Date(query.joinDateStart)));
  }
  if (query.joinDateEnd) {
    conditions.push(lte(members.joinDate, new Date(query.joinDateEnd)));
  }
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const allMembers = await db
    .select({
      id: members.id,
      userId: members.userId,
      campId: members.campId,
      memberNo: members.memberNo,
      status: members.status,
      joinDate: members.joinDate,
      expiryDate: members.expiryDate,
      conversionSource: members.conversionSource,
      conversionSourceDetail: members.conversionSourceDetail,
      lastActiveAt: members.lastActiveAt,
      progress: members.progress,
      totalChapters: members.totalChapters,
      completedChapters: members.completedChapters,
      isFallingBehind: members.isFallingBehind,
      salesPerson: members.salesPerson,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt,
      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,
      campName: trainingCamps.name,
    })
    .from(members)
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, members.campId))
    .where(where)
    .orderBy(desc(members.joinDate));

  if (query.keyword) {
    const kw = `%${query.keyword}%`;
    const filtered = allMembers.filter(
      (m) =>
        (m.userName && m.userName.includes(query.keyword as string)) ||
        (m.userEmail && m.userEmail.includes(query.keyword as string)) ||
        (m.memberNo && m.memberNo.includes(query.keyword as string)),
    );
    return c.json(paginate(filtered, page, pageSize));
  }

  return c.json(paginate(allMembers, page, pageSize));
});

membersRouter.get('/falling-behind', async (c) => {
  const result = await db
    .select({
      id: members.id,
      memberNo: members.memberNo,
      progress: members.progress,
      totalChapters: members.totalChapters,
      completedChapters: members.completedChapters,
      userName: users.name,
      userPhone: users.phone,
      campName: trainingCamps.name,
      campId: trainingCamps.id,
    })
    .from(members)
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, members.campId))
    .where(and(eq(members.isFallingBehind, true), eq(members.status, 'active')))
    .orderBy(members.progress);
  return c.json(result);
});

membersRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const member = await db
    .select({
      id: members.id,
      userId: members.userId,
      campId: members.campId,
      memberNo: members.memberNo,
      status: members.status,
      joinDate: members.joinDate,
      expiryDate: members.expiryDate,
      conversionSource: members.conversionSource,
      conversionSourceDetail: members.conversionSourceDetail,
      lastActiveAt: members.lastActiveAt,
      progress: members.progress,
      totalChapters: members.totalChapters,
      completedChapters: members.completedChapters,
      isFallingBehind: members.isFallingBehind,
      salesPerson: members.salesPerson,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
      },
      camp: {
        id: trainingCamps.id,
        name: trainingCamps.name,
        startDate: trainingCamps.startDate,
        endDate: trainingCamps.endDate,
        status: trainingCamps.status,
      },
    })
    .from(members)
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, members.campId))
    .where(eq(members.id, id));

  if (member.length === 0) {
    return c.json({ message: '会员不存在' }, 404);
  }

  const progress = await db
    .select({
      id: memberProgress.id,
      chapterId: memberProgress.chapterId,
      isCompleted: memberProgress.isCompleted,
      completedAt: memberProgress.completedAt,
      watchDuration: memberProgress.watchDuration,
      chapterTitle: chapters.title,
    })
    .from(memberProgress)
    .leftJoin(chapters, eq(chapters.id, memberProgress.chapterId))
    .where(eq(memberProgress.memberId, id))
    .orderBy(chapters.sortOrder);

  return c.json({ ...member[0], progress });
});

membersRouter.post('/', zValidator('json', createMemberSchema), async (c) => {
  const data = c.req.valid('json');
  const memberNo = generateMemberNo(data.campId);

  const result = await db
    .insert(members)
    .values({
      ...data,
      memberNo,
      status: data.status || 'active',
      joinDate: data.joinDate || new Date(),
    })
    .returning();

  await db
    .update(trainingCamps)
    .set({
      currentMembers: sql`${trainingCamps.currentMembers} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(trainingCamps.id, data.campId));

  await updateFallingBehind(result[0].id);

  return c.json(result[0], 201);
});

membersRouter.put('/:id', zValidator('json', updateMemberSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .update(members)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(members.id, id))
    .returning();
  if (result.length === 0) {
    return c.json({ message: '会员不存在' }, 404);
  }
  return c.json(result[0]);
});

membersRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const member = await db.select().from(members).where(eq(members.id, id));
  if (member.length === 0) {
    return c.json({ message: '会员不存在' }, 404);
  }

  await db.delete(members).where(eq(members.id, id));

  await db
    .update(trainingCamps)
    .set({
      currentMembers: sql`${trainingCamps.currentMembers} - 1`,
      updatedAt: new Date(),
    })
    .where(eq(trainingCamps.id, member[0].campId));

  return c.json({ deleted: true });
});

const progressSchema = z.object({
  chapterId: z.string().uuid(),
  isCompleted: z.boolean().optional(),
  watchDuration: z.number().min(0).optional(),
});

membersRouter.post('/:id/progress', zValidator('json', progressSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const existing = await db
    .select()
    .from(memberProgress)
    .where(and(eq(memberProgress.memberId, id), eq(memberProgress.chapterId, data.chapterId)));

  let result;
  if (existing.length > 0) {
    result = await db
      .update(memberProgress)
      .set({
        isCompleted: data.isCompleted ?? existing[0].isCompleted,
        watchDuration: data.watchDuration ?? existing[0].watchDuration,
        completedAt: data.isCompleted ? new Date() : existing[0].completedAt,
        lastWatchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(memberProgress.id, existing[0].id))
      .returning();
  } else {
    result = await db
      .insert(memberProgress)
      .values({
        memberId: id,
        chapterId: data.chapterId,
        isCompleted: data.isCompleted ?? false,
        watchDuration: data.watchDuration ?? 0,
        completedAt: data.isCompleted ? new Date() : null,
        lastWatchedAt: new Date(),
      })
      .returning();
  }

  await updateFallingBehind(id);

  return c.json(result[0]);
});

membersRouter.post('/:id/refresh-progress', async (c) => {
  const id = c.req.param('id');
  await updateFallingBehind(id);
  return c.json({ ok: true });
});

export { membersRouter };
