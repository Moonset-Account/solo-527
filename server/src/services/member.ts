import { db } from '../db';
import { eq, desc, like, and, count, asc, gte, lte, sql } from 'drizzle-orm';
import { members, memberLevels, pointTransactions } from '../db/schema';
import { getMemberLevels } from './common';

export async function getAdminMembers(params: {
  page?: number;
  pageSize?: number;
  level?: string;
  keyword?: string;
  minPoints?: number;
  maxPoints?: number;
}) {
  const { page = 1, pageSize = 20, level, keyword, minPoints, maxPoints } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (level) conditions.push(eq(members.levelId, level));
  if (keyword) {
    conditions.push(
      sql`(${members.phone} ILIKE ${`%${keyword}%`} OR ${members.nickname} ILIKE ${`%${keyword}%`})`
    );
  }
  if (minPoints !== undefined) conditions.push(gte(members.points, minPoints));
  if (maxPoints !== undefined) conditions.push(lte(members.points, maxPoints));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [itemsResult, countResult] = await Promise.all([
    db
      .select()
      .from(members)
      .leftJoin(memberLevels, eq(members.levelId, memberLevels.id))
      .where(whereClause)
      .orderBy(desc(members.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(members).where(whereClause),
  ]);

  const items = itemsResult.map((row) => ({
    ...row.members,
    level: row.member_levels || undefined,
  }));

  return {
    items,
    total: Number(countResult[0]?.count || 0),
    page,
    pageSize,
    filters: { level, keyword, minPoints, maxPoints },
  };
}

export async function adjustMemberPoints(memberId: string, points: number, reason: string) {
  const member = await db.select().from(members).where(eq(members.id, memberId));
  if (member.length === 0) {
    throw new Error('会员不存在');
  }

  return await db.transaction(async (tx) => {
    const result = await tx
      .update(members)
      .set({ points: sql`${members.points} + ${points}` })
      .where(eq(members.id, memberId))
      .returning();

    await tx.insert(pointTransactions).values({
      memberId,
      points,
      type: 'adjust',
      reason,
    });

    return result[0];
  });
}

export async function getMemberPointsDetail(memberId: string, params: { page?: number; pageSize?: number }) {
  const { page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;

  const [itemsResult, countResult] = await Promise.all([
    db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.memberId, memberId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(pointTransactions).where(eq(pointTransactions.memberId, memberId)),
  ]);

  return {
    items: itemsResult,
    total: Number(countResult[0]?.count || 0),
    page,
    pageSize,
  };
}

export async function createMemberLevel(data: {
  name: string;
  minGrowth: number;
  icon?: string;
  benefits?: string;
  sortOrder?: number;
}) {
  const result = await db.insert(memberLevels).values(data).returning();
  return result[0];
}

export async function updateMemberLevel(id: string, data: Partial<typeof memberLevels.$inferInsert>) {
  const result = await db.update(memberLevels).set(data).where(eq(memberLevels.id, id)).returning();
  return result[0];
}

export async function deleteMemberLevel(id: string) {
  const result = await db.delete(memberLevels).where(eq(memberLevels.id, id)).returning();
  return result.length > 0;
}

export async function recalculateMemberLevel(memberId: string) {
  const member = await db.select().from(members).where(eq(members.id, memberId));
  if (member.length === 0) return null;

  const levels = await getMemberLevels();
  let currentLevel = levels[0];

  for (const level of levels) {
    if (member[0].growthValue >= level.minGrowth) {
      currentLevel = level;
    }
  }

  if (currentLevel && currentLevel.id !== member[0].levelId) {
    await db.update(members).set({ levelId: currentLevel.id }).where(eq(members.id, memberId));
  }

  return currentLevel;
}
