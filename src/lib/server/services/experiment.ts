import { db } from '../db';
import { experiments } from '../schema';
import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import type { Experiment, Status } from '$types';
import { createComplianceRecord } from './compliance';

export async function getExperiments(
  filters?: {
    userId?: string;
    status?: Status;
  },
  pagination?: { page: number; pageSize: number }
): Promise<{ data: Experiment[]; total: number }> {
  const whereConditions: SQL[] = [];

  if (filters?.userId) {
    whereConditions.push(eq(experiments.userId, filters.userId));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(experiments)
    .where(whereClause);

  const total = countResult?.count || 0;

  let query = db
    .select()
    .from(experiments)
    .where(whereClause)
    .orderBy(desc(experiments.archivedAt));

  if (pagination) {
    const offset = (pagination.page - 1) * pagination.pageSize;
    query = query.limit(pagination.pageSize).offset(offset);
  }

  const data = await query;
  return { data: data as Experiment[], total };
}

export async function getExperimentById(id: string): Promise<Experiment | null> {
  const [exp] = await db.select().from(experiments).where(eq(experiments.id, id));
  return (exp as Experiment) || null;
}

export async function createExperiment(
  data: Omit<Experiment, 'id' | 'archivedAt' | 'complianceRecordId'>
): Promise<Experiment> {
  const complianceRecord = await createComplianceRecord({
    type: 'experiment',
    referenceId: '',
    status: 'completed',
    operator: data.userId,
    operatorId: data.userId,
    details: `归档实验数据: ${data.title}`,
    processedAt: new Date()
  });

  const [exp] = await db
    .insert(experiments)
    .values({
      userId: data.userId,
      title: data.title,
      data: data.data,
      complianceRecordId: complianceRecord.id
    })
    .returning();

  await db
    .update(experiments)
    .set({ complianceRecordId: complianceRecord.id })
    .where(eq(experiments.id, exp.id));

  return { ...(exp as Experiment), complianceRecordId: complianceRecord.id };
}

export async function deleteExperiment(id: string): Promise<boolean> {
  const result = await db.delete(experiments).where(eq(experiments.id, id));
  return result.rowCount > 0;
}
