import { db } from '../db';
import { complianceRecords } from '../schema';
import { eq, and, desc, between, sql, type SQL } from 'drizzle-orm';
import type { ComplianceRecord, ComplianceType, Status, FilterParams } from '$types';

export async function createComplianceRecord(
  data: Omit<ComplianceRecord, 'id' | 'createdAt'>
): Promise<ComplianceRecord> {
  const [record] = await db
    .insert(complianceRecords)
    .values({
      type: data.type,
      referenceId: data.referenceId,
      status: data.status,
      operator: data.operator,
      operatorId: data.operatorId,
      details: data.details,
      processedAt: data.processedAt
    })
    .returning();
  return record as ComplianceRecord;
}

export async function getComplianceRecords(
  filters?: FilterParams,
  pagination?: { page: number; pageSize: number }
): Promise<{ data: ComplianceRecord[]; total: number }> {
  const whereConditions: SQL[] = [];

  if (filters?.status) {
    whereConditions.push(eq(complianceRecords.status, filters.status));
  }
  if (filters?.type) {
    whereConditions.push(eq(complianceRecords.type, filters.type));
  }
  if (filters?.operatorId) {
    whereConditions.push(eq(complianceRecords.operatorId, filters.operatorId));
  }
  if (filters?.startDate && filters?.endDate) {
    whereConditions.push(
      between(complianceRecords.createdAt, filters.startDate, filters.endDate)
    );
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(complianceRecords)
    .where(whereClause);

  const total = countResult?.count || 0;

  const data = pagination
    ? await db.select().from(complianceRecords).where(whereClause).orderBy(desc(complianceRecords.createdAt)).limit(pagination.pageSize).offset((pagination.page - 1) * pagination.pageSize)
    : await db.select().from(complianceRecords).where(whereClause).orderBy(desc(complianceRecords.createdAt));
  return { data: data as ComplianceRecord[], total };
}

export async function getComplianceRecordById(id: string): Promise<ComplianceRecord | null> {
  const [record] = await db
    .select()
    .from(complianceRecords)
    .where(eq(complianceRecords.id, id));
  return (record as ComplianceRecord) || null;
}

export async function updateComplianceRecord(
  id: string,
  data: Partial<ComplianceRecord>
): Promise<ComplianceRecord | null> {
  const [record] = await db
    .update(complianceRecords)
    .set({
      ...data,
      processedAt: data.status === 'completed' ? new Date() : undefined
    })
    .where(eq(complianceRecords.id, id))
    .returning();
  return (record as ComplianceRecord) || null;
}

export async function generateComplianceCSV(filters?: FilterParams): Promise<string> {
  const { data } = await getComplianceRecords(filters);

  const headers = [
    'ID',
    '类型',
    '关联ID',
    '状态',
    '操作人',
    '操作人ID',
    '详情',
    '创建时间',
    '处理时间'
  ];

  const typeMap: Record<ComplianceType, string> = {
    requisition: '领用申请',
    experiment: '实验数据',
    todo: '待办事项',
    risk: '风险处理'
  };

  const statusMap: Record<Status, string> = {
    pending: '待处理',
    approved: '已批准',
    rejected: '已拒绝',
    completed: '已完成',
    processing: '处理中',
    resolved: '已解决',
    failed: '已失败'
  };

  const rows = data.map((record) => [
    record.id,
    typeMap[record.type] || record.type,
    record.referenceId,
    statusMap[record.status] || record.status,
    record.operator,
    record.operatorId,
    `"${record.details.replace(/"/g, '""')}"`,
    record.createdAt.toISOString(),
    record.processedAt?.toISOString() || ''
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  return '\uFEFF' + csvContent;
}

export async function getComplianceStats(): Promise<{
  total: number;
  pending: number;
  completed: number;
  byType: Record<ComplianceType, number>;
}> {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(complianceRecords);

  const [pendingResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(complianceRecords)
    .where(eq(complianceRecords.status, 'pending'));

  const [completedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(complianceRecords)
    .where(eq(complianceRecords.status, 'completed'));

  const byTypeResult = await db
    .select({
      type: complianceRecords.type,
      count: sql<number>`count(*)`
    })
    .from(complianceRecords)
    .groupBy(complianceRecords.type);

  const byType: Record<ComplianceType, number> = {
    requisition: 0,
    experiment: 0,
    todo: 0,
    risk: 0
  };

  for (const item of byTypeResult) {
    if (item.type) {
      byType[item.type] = item.count;
    }
  }

  return {
    total: totalResult?.count || 0,
    pending: pendingResult?.count || 0,
    completed: completedResult?.count || 0,
    byType
  };
}
