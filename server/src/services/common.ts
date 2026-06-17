import { db } from '../db';
import { eq, and, desc, asc, like, gte, lte, count, sql } from 'drizzle-orm';
import { memberLevels, members, products, pointTransactions, adminUsers } from '../db/schema';

export async function getMemberLevels() {
  return db.select().from(memberLevels).orderBy(asc(memberLevels.sortOrder));
}

export async function getMemberLevelById(id: string) {
  const result = await db.select().from(memberLevels).where(eq(memberLevels.id, id));
  return result[0];
}

export async function getProducts(params: {
  page?: number;
  pageSize?: number;
  category?: string;
  minPoints?: number;
  maxPoints?: number;
  level?: string;
  keyword?: string;
  status?: string;
}) {
  const { page = 1, pageSize = 20, category, minPoints, maxPoints, level, keyword, status } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (category) conditions.push(eq(products.category, category));
  if (minPoints !== undefined) conditions.push(gte(products.pointsPrice, minPoints));
  if (maxPoints !== undefined) conditions.push(lte(products.pointsPrice, maxPoints));
  if (level) conditions.push(eq(products.requiredLevelId, level));
  if (keyword) conditions.push(like(products.name, `%${keyword}%`));
  if (status) conditions.push(eq(products.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [itemsResult, countResult] = await Promise.all([
    db
      .select()
      .from(products)
      .leftJoin(memberLevels, eq(products.requiredLevelId, memberLevels.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(products).where(whereClause),
  ]);

  const items = itemsResult.map((row) => ({
    ...row.products,
    requiredLevel: row.member_levels || undefined,
  }));

  return {
    items,
    total: Number(countResult[0]?.count || 0),
    page,
    pageSize,
    filters: { category, minPoints, maxPoints, level, keyword, status },
  };
}

export async function getProductById(id: string) {
  const result = await db
    .select()
    .from(products)
    .leftJoin(memberLevels, eq(products.requiredLevelId, memberLevels.id))
    .where(eq(products.id, id));

  if (result.length === 0) return null;

  return {
    ...result[0].products,
    requiredLevel: result[0].member_levels || undefined,
  };
}

export async function createProduct(data: {
  name: string;
  description?: string;
  imageUrl?: string;
  pointsPrice: number;
  stock: number;
  category?: string;
  requiredLevelId?: string;
}) {
  const result = await db.insert(products).values(data).returning();
  return result[0];
}

export async function updateProduct(id: string, data: Partial<typeof products.$inferInsert>) {
  const result = await db.update(products).set(data).where(eq(products.id, id)).returning();
  return result[0];
}

export async function updateProductStatus(id: string, status: 'active' | 'inactive') {
  const result = await db.update(products).set({ status }).where(eq(products.id, id)).returning();
  return result[0];
}

export async function getMemberByPhone(phone: string) {
  const result = await db.select().from(members).where(eq(members.phone, phone));
  return result[0];
}

export async function getMemberById(id: string) {
  const result = await db
    .select()
    .from(members)
    .leftJoin(memberLevels, eq(members.levelId, memberLevels.id))
    .where(eq(members.id, id));

  if (result.length === 0) return null;

  return {
    ...result[0].members,
    level: result[0].member_levels || undefined,
  };
}

export async function createMember(data: { phone: string; nickname?: string }) {
  const levels = await getMemberLevels();
  const lowestLevel = levels[0];

  const result = await db
    .insert(members)
    .values({
      ...data,
      levelId: lowestLevel?.id,
      points: 100,
    })
    .returning();

  if (result[0] && lowestLevel) {
    return { ...result[0], level: lowestLevel };
  }
  return result[0];
}

export async function updateMemberPoints(
  memberId: string,
  pointsChange: number,
  type: 'earn' | 'spend' | 'adjust',
  reason?: string,
  refId?: string
) {
  const result = await db
    .update(members)
    .set({ points: sql`${members.points} + ${pointsChange}` })
    .where(eq(members.id, memberId))
    .returning();

  if (result.length > 0) {
    await db.insert(pointTransactions).values({
      memberId,
      points: pointsChange,
      type,
      reason,
      refId,
    });
  }

  return result[0];
}

export async function getAdminByUsername(username: string) {
  const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
  return result[0];
}

export async function getAdminById(id: string) {
  const result = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
  return result[0];
}
