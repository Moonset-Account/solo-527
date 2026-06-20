import { db } from '../db';
import { reagents } from '../schema';
import { eq, ilike, and, desc, sql, type SQL } from 'drizzle-orm';
import type { Reagent, ReagentCategory, HazardLevel } from '$types';

export async function getReagents(
  filters?: {
    category?: ReagentCategory;
    hazardLevel?: HazardLevel;
    search?: string;
    inStock?: boolean;
  },
  pagination?: { page: number; pageSize: number }
): Promise<{ data: Reagent[]; total: number }> {
  const whereConditions: SQL[] = [];

  if (filters?.category) {
    whereConditions.push(eq(reagents.category, filters.category));
  }
  if (filters?.hazardLevel) {
    whereConditions.push(eq(reagents.hazardLevel, filters.hazardLevel));
  }
  if (filters?.search) {
    whereConditions.push(
      ilike(reagents.name, `%${filters.search}%`)
    );
  }
  if (filters?.inStock) {
    whereConditions.push(sql`${reagents.stock} > 0`);
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reagents)
    .where(whereClause);

  const total = countResult?.count || 0;

  const data = pagination
    ? await db.select().from(reagents).where(whereClause).orderBy(desc(reagents.name)).limit(pagination.pageSize).offset((pagination.page - 1) * pagination.pageSize)
    : await db.select().from(reagents).where(whereClause).orderBy(desc(reagents.name));
  return { data: data as Reagent[], total };
}

export async function getReagentById(id: string): Promise<Reagent | null> {
  const [reagent] = await db.select().from(reagents).where(eq(reagents.id, id));
  return (reagent as Reagent) || null;
}

export async function createReagent(
  data: Omit<Reagent, 'id'>
): Promise<Reagent> {
  const [reagent] = await db
    .insert(reagents)
    .values(data)
    .returning();
  return reagent as Reagent;
}

export async function updateReagent(
  id: string,
  data: Partial<Reagent>
): Promise<Reagent | null> {
  const [reagent] = await db
    .update(reagents)
    .set(data)
    .where(eq(reagents.id, id))
    .returning();
  return (reagent as Reagent) || null;
}

export async function updateStock(
  id: string,
  quantity: number
): Promise<Reagent | null> {
  const [reagent] = await db
    .update(reagents)
    .set({ stock: sql`${reagents.stock} + ${quantity}` })
    .where(eq(reagents.id, id))
    .returning();
  return (reagent as Reagent) || null;
}

export async function deleteReagent(id: string): Promise<boolean> {
  const result = await db.delete(reagents).where(eq(reagents.id, id));
  return (result.rowCount ?? 0) > 0;
}
