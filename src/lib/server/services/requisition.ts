import { db } from '../db';
import { requisitions, reagents } from '../schema';
import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import type { Requisition, Status } from '$types';
import { createComplianceRecord } from './compliance';

export async function getRequisitions(
  filters?: {
    userId?: string;
    status?: Status;
    reagentId?: string;
  },
  pagination?: { page: number; pageSize: number }
): Promise<{ data: Requisition[]; total: number }> {
  const whereConditions: SQL[] = [];

  if (filters?.userId) {
    whereConditions.push(eq(requisitions.userId, filters.userId));
  }
  if (filters?.status) {
    whereConditions.push(eq(requisitions.status, filters.status));
  }
  if (filters?.reagentId) {
    whereConditions.push(eq(requisitions.reagentId, filters.reagentId));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(requisitions)
    .where(whereClause);

  const total = countResult?.count || 0;

  let query = db
    .select()
    .from(requisitions)
    .leftJoin(reagents, eq(requisitions.reagentId, reagents.id))
    .where(whereClause)
    .orderBy(desc(requisitions.createdAt));

  if (pagination) {
    const offset = (pagination.page - 1) * pagination.pageSize;
    query = query.limit(pagination.pageSize).offset(offset);
  }

  const results = await query;
  const data = results.map((r) => ({
    ...(r.requisitions as Requisition),
    reagent: r.reagents
  }));

  return { data, total };
}

export async function getRequisitionById(id: string): Promise<Requisition | null> {
  const [result] = await db
    .select()
    .from(requisitions)
    .leftJoin(reagents, eq(requisitions.reagentId, reagents.id))
    .where(eq(requisitions.id, id));

  if (!result) return null;

  return {
    ...(result.requisitions as Requisition),
    reagent: result.reagents
  };
}

export async function createRequisition(
  data: Omit<Requisition, 'id' | 'status' | 'createdAt' | 'complianceRecordId'>
): Promise<Requisition> {
  const [requisition] = await db
    .insert(requisitions)
    .values({
      reagentId: data.reagentId,
      userId: data.userId,
      userName: data.userName,
      quantity: data.quantity,
      purpose: data.purpose,
      status: 'pending'
    })
    .returning();

  const complianceRecord = await createComplianceRecord({
    type: 'requisition',
    referenceId: requisition.id,
    status: 'pending',
    operator: data.userName,
    operatorId: data.userId,
    details: `提交试剂领用申请 - 数量: ${data.quantity}, 用途: ${data.purpose}`
  });

  await db
    .update(requisitions)
    .set({ complianceRecordId: complianceRecord.id })
    .where(eq(requisitions.id, requisition.id));

  return { ...(requisition as Requisition), complianceRecordId: complianceRecord.id };
}

export async function approveRequisition(
  id: string,
  operatorId: string,
  operatorName: string
): Promise<Requisition | null> {
  const requisition = await getRequisitionById(id);
  if (!requisition) return null;

  await db
    .update(reagents)
    .set({ stock: sql`${reagents.stock} - ${requisition.quantity}` })
    .where(eq(reagents.id, requisition.reagentId));

  const [updated] = await db
    .update(requisitions)
    .set({ status: 'approved' })
    .where(eq(requisitions.id, id))
    .returning();

  if (requisition.complianceRecordId) {
    await db
      .update(requisitions)
      .set({
        status: 'approved',
        complianceRecordId: requisition.complianceRecordId
      })
      .where(eq(requisitions.id, id));
  }

  return updated as Requisition;
}

export async function rejectRequisition(
  id: string,
  operatorId: string,
  operatorName: string,
  reason: string
): Promise<Requisition | null> {
  const [updated] = await db
    .update(requisitions)
    .set({ status: 'rejected' })
    .where(eq(requisitions.id, id))
    .returning();

  return updated as Requisition;
}

export async function updateRequisition(
  id: string,
  data: Partial<Requisition>
): Promise<Requisition | null> {
  const [updated] = await db
    .update(requisitions)
    .set(data)
    .where(eq(requisitions.id, id))
    .returning();

  return updated as Requisition || null;
}
