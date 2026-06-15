import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { operationHistory } from '$lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '20')));
  const targetType = url.searchParams.get('target_type');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (targetType) conditions.push(eq(operationHistory.targetType, targetType));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(operationHistory)
      .where(whereClause)
      .orderBy(desc(operationHistory.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(operationHistory)
      .where(whereClause)
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  return json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
};
