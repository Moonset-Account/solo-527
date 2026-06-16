import { Hono } from 'hono';
import { eq, and, sql, gte, lte, desc, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  trainingCamps,
  members,
  chapters,
  memberProgress,
  checkinRecords,
  refundRequests,
  todos,
  users,
} from '../db/schema.js';

const statsRouter = new Hono();

statsRouter.get('/overview', async (c) => {
  const totalCamps = await db.select({ count: sql<number>`count(*)` }).from(trainingCamps);
  const ongoingCamps = await db
    .select({ count: sql<number>`count(*)` })
    .from(trainingCamps)
    .where(eq(trainingCamps.status, 'ongoing'));
  const totalMembers = await db.select({ count: sql<number>`count(*)` }).from(members);
  const activeMembers = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(eq(members.status, 'active'));
  const fallingBehind = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(and(eq(members.isFallingBehind, true), eq(members.status, 'active')));
  const pendingCheckins = await db
    .select({ count: sql<number>`count(*)` })
    .from(checkinRecords)
    .where(eq(checkinRecords.status, 'pending'));
  const pendingRefunds = await db
    .select({ count: sql<number>`count(*)` })
    .from(refundRequests)
    .where(eq(refundRequests.status, 'pending'));
  const pendingTodos = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(eq(todos.status, 'pending'));

  return c.json({
    camps: {
      total: Number(totalCamps[0].count),
      ongoing: Number(ongoingCamps[0].count),
    },
    members: {
      total: Number(totalMembers[0].count),
      active: Number(activeMembers[0].count),
      fallingBehind: Number(fallingBehind[0].count),
    },
    pending: {
      checkins: Number(pendingCheckins[0].count),
      refunds: Number(pendingRefunds[0].count),
      todos: Number(pendingTodos[0].count),
    },
  });
});

statsRouter.get('/completion', async (c) => {
  const { campId } = c.req.query();

  let campsList: any[];
  if (campId) {
    campsList = await db.select().from(trainingCamps).where(eq(trainingCamps.id, campId));
  } else {
    campsList = await db
      .select()
      .from(trainingCamps)
      .orderBy(desc(trainingCamps.startDate))
      .limit(20);
  }

  const result = await Promise.all(
    campsList.map(async (camp) => {
      const allChapters = await db
        .select({ count: sql<number>`count(*)` })
        .from(chapters)
        .where(and(eq(chapters.campId, camp.id), eq(chapters.status, 'published')));
      const totalChapters = Number(allChapters[0].count);

      const campMembers = await db
        .select()
        .from(members)
        .where(and(eq(members.campId, camp.id), eq(members.status, 'active')));

      const totalMembers = campMembers.length;
      let completedMembers = 0;
      let activeMembers = 0;
      let fallingBehindMembers = 0;
      let totalProgress = 0;

      for (const member of campMembers) {
        const progress = Number(member.progress || 0);
        totalProgress += progress;
        if (progress >= 100) completedMembers++;
        if (progress > 0) activeMembers++;
        if (member.isFallingBehind) fallingBehindMembers++;
      }

      const avgProgress = totalMembers > 0 ? totalProgress / totalMembers : 0;
      const completionRate = totalMembers > 0 ? (completedMembers / totalMembers) * 100 : 0;

      const byDate: { date: string; completionRate: number }[] = [];
      const now = new Date();
      const start = new Date(camp.startDate);
      let current = new Date(start);
      while (current <= now && byDate.length < 30) {
        const dateStr = current.toISOString().slice(0, 10);
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59);

        const completedProgress = await db
          .select({ count: sql<number>`count(distinct ${memberProgress.memberId})` })
          .from(memberProgress)
          .innerJoin(members, eq(members.id, memberProgress.memberId))
          .where(
            and(
              eq(members.campId, camp.id),
              lte(memberProgress.completedAt, dayEnd),
            ),
          );

        const dayRate = totalMembers > 0 ? (Number(completedProgress[0].count) / totalMembers) * 100 : 0;
        byDate.push({ date: dateStr, completionRate: Math.min(100, dayRate * totalChapters / Math.max(1, totalChapters)) });

        current.setDate(current.getDate() + 1);
      }

      return {
        campId: camp.id,
        campName: camp.name,
        totalMembers,
        completedMembers,
        activeMembers,
        fallingBehindMembers,
        completionRate: Number(completionRate.toFixed(2)),
        averageProgress: Number(avgProgress.toFixed(2)),
        totalChapters,
        byDate,
      };
    }),
  );

  return c.json(campId ? result[0] : result);
});

statsRouter.get('/checkins', async (c) => {
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];
  if (query.campId) {
    conditions.push(eq(checkinRecords.campId, query.campId));
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

  const byStatus = await db
    .select({
      status: checkinRecords.status,
      count: sql<number>`count(*)`,
    })
    .from(checkinRecords)
    .where(where)
    .groupBy(checkinRecords.status);

  const byDate = await db
    .select({
      date: sql<string>`to_char(${checkinRecords.checkedInAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)`,
    })
    .from(checkinRecords)
    .where(where)
    .groupBy(sql`to_char(${checkinRecords.checkedInAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${checkinRecords.checkedInAt}, 'YYYY-MM-DD')`);

  const byReviewer = await db
    .select({
      reviewerName: users.name,
      count: sql<number>`count(*)`,
    })
    .from(checkinRecords)
    .leftJoin(users, eq(users.id, checkinRecords.reviewedBy))
    .where(and(where || sql`true`))
    .groupBy(users.name)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  return c.json({
    byStatus: byStatus.map((s) => ({ status: s.status, count: Number(s.count) })),
    byDate: byDate.map((d) => ({ date: d.date, count: Number(d.count) })),
    byReviewer: byReviewer.map((r) => ({ reviewerName: r.reviewerName || '未审核', count: Number(r.count) })),
  });
});

statsRouter.get('/conversion-sources', async (c) => {
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];
  if (query.campId) {
    conditions.push(eq(members.campId, query.campId));
  }
  if (query.startDate) {
    conditions.push(gte(members.joinDate, new Date(query.startDate)));
  }
  if (query.endDate) {
    conditions.push(lte(members.joinDate, new Date(query.endDate)));
  }
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const bySource = await db
    .select({
      source: members.conversionSource,
      count: sql<number>`count(*)`,
      total: sql<number>`SUM(${trainingCamps.price})`,
    })
    .from(members)
    .leftJoin(trainingCamps, eq(trainingCamps.id, members.campId))
    .where(where)
    .groupBy(members.conversionSource)
    .orderBy(desc(sql`count(*)`));

  const salesWhere = where
    ? and(where, sql`${members.salesPerson} is not null`)
    : sql`${members.salesPerson} is not null`;

  const bySalesPerson = await db
    .select({
      salesPerson: members.salesPerson,
      count: sql<number>`count(*)`,
    })
    .from(members)
    .where(salesWhere)
    .groupBy(members.salesPerson)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  return c.json({
    bySource: bySource.map((s: any) => ({
      source: s.source,
      count: Number(s.count),
      totalAmount: Number(s.total || 0),
    })),
    bySalesPerson: bySalesPerson.map((s: any) => ({
      salesPerson: s.salesPerson!,
      count: Number(s.count),
    })),
  });
});

export { statsRouter };
