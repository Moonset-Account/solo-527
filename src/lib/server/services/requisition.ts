import { db } from '../db';
import { requisitions, reagents, complianceRecords } from '../schema';
import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import type { Requisition, Reagent, Status } from '$types';
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

  const results = pagination
    ? await db.select().from(requisitions).leftJoin(reagents, eq(requisitions.reagentId, reagents.id)).where(whereClause).orderBy(desc(requisitions.createdAt)).limit(pagination.pageSize).offset((pagination.page - 1) * pagination.pageSize)
    : await db.select().from(requisitions).leftJoin(reagents, eq(requisitions.reagentId, reagents.id)).where(whereClause).orderBy(desc(requisitions.createdAt));
  const data = results.map((r) => ({
    ...(r.requisitions as Requisition),
    reagent: r.reagents as unknown as Reagent | null
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
    reagent: result.reagents as unknown as Reagent | null
  };
}

export async function createRequisition(
  data: Omit<Requisition, 'id' | 'status' | 'createdAt' | 'complianceRecordId'>
): Promise<Requisition> {
  const [inserted] = await db
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
    referenceId: inserted.id,
    status: 'pending',
    operator: data.userName,
    operatorId: data.userId,
    details: `提交试剂领用申请 - 数量: ${data.quantity}, 用途: ${data.purpose}`
  });

  await db
    .update(requisitions)
    .set({ complianceRecordId: complianceRecord.id })
    .where(eq(requisitions.id, inserted.id));

  return { ...(inserted as Requisition), complianceRecordId: complianceRecord.id };
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
    const [existingRecord] = await db
      .select({ details: complianceRecords.details })
      .from(complianceRecords)
      .where(eq(complianceRecords.id, requisition.complianceRecordId));
    const newDetails = (existingRecord?.details || '') + ' → 已批准';
    await db
      .update(complianceRecords)
      .set({
        status: 'approved',
        processedAt: new Date(),
        details: newDetails
      })
      .where(eq(complianceRecords.id, requisition.complianceRecordId));
  } else {
    const complianceRecord = await createComplianceRecord({
      type: 'requisition',
      referenceId: id,
      status: 'approved',
      operator: operatorName,
      operatorId,
      details: `批准试剂领用申请 - 数量: ${requisition.quantity}`,
      processedAt: new Date()
    });
    await db
      .update(requisitions)
      .set({ complianceRecordId: complianceRecord.id })
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
  const requisition = await getRequisitionById(id);
  if (!requisition) return null;

  const [updated] = await db
    .update(requisitions)
    .set({ status: 'rejected' })
    .where(eq(requisitions.id, id))
    .returning();

  if (requisition.complianceRecordId) {
    const [existingRecord] = await db
      .select({ details: complianceRecords.details })
      .from(complianceRecords)
      .where(eq(complianceRecords.id, requisition.complianceRecordId));
    const reasonText = reason ? `，原因: ${reason}` : '';
    const newDetails = (existingRecord?.details || '') + ` → 已拒绝${reasonText}`;
    await db
      .update(complianceRecords)
      .set({
        status: 'rejected',
        processedAt: new Date(),
        details: newDetails
      })
      .where(eq(complianceRecords.id, requisition.complianceRecordId));
  } else {
    const reasonText = reason ? `，原因: ${reason}` : '';
    const complianceRecord = await createComplianceRecord({
      type: 'requisition',
      referenceId: id,
      status: 'rejected',
      operator: operatorName,
      operatorId,
      details: `拒绝试剂领用申请${reasonText}`,
      processedAt: new Date()
    });
    await db
      .update(requisitions)
      .set({ complianceRecordId: complianceRecord.id })
      .where(eq(requisitions.id, id));
  }

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
