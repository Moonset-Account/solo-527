import { db } from '../db';
import { riskAlerts } from '../schema';
import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import type { RiskAlert, HazardLevel, Status } from '$types';
import { createComplianceRecord } from './compliance';

export async function getRiskAlerts(
  filters?: {
    userId?: string;
    status?: Status;
    riskLevel?: HazardLevel;
  },
  pagination?: { page: number; pageSize: number }
): Promise<{ data: RiskAlert[]; total: number }> {
  const whereConditions: SQL[] = [];

  if (filters?.userId) {
    whereConditions.push(eq(riskAlerts.userId, filters.userId));
  }
  if (filters?.status) {
    whereConditions.push(eq(riskAlerts.status, filters.status));
  }
  if (filters?.riskLevel) {
    whereConditions.push(eq(riskAlerts.riskLevel, filters.riskLevel));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(riskAlerts)
    .where(whereClause);

  const total = countResult?.count || 0;

  const data = pagination
    ? await db.select().from(riskAlerts).where(whereClause).orderBy(desc(riskAlerts.createdAt)).limit(pagination.pageSize).offset((pagination.page - 1) * pagination.pageSize)
    : await db.select().from(riskAlerts).where(whereClause).orderBy(desc(riskAlerts.createdAt));
  return { data: data as RiskAlert[], total };
}

export async function getRiskAlertById(id: string): Promise<RiskAlert | null> {
  const [alert] = await db.select().from(riskAlerts).where(eq(riskAlerts.id, id));
  return (alert as RiskAlert) || null;
}

export async function createRiskAlert(
  data: Omit<RiskAlert, 'id' | 'status' | 'createdAt' | 'complianceRecordId'>
): Promise<RiskAlert> {
  const [alert] = await db
    .insert(riskAlerts)
    .values({
      reagentId: data.reagentId,
      reagentName: data.reagentName,
      userId: data.userId,
      userName: data.userName,
      riskType: data.riskType,
      riskLevel: data.riskLevel,
      description: data.description,
      status: 'pending'
    })
    .returning();
  return alert as RiskAlert;
}

export async function resolveRisk(
  id: string,
  resolution: string,
  userId: string,
  userName: string
): Promise<RiskAlert | null> {
  const risk = await getRiskAlertById(id);
  if (!risk) return null;

  const now = new Date();

  const complianceRecord = await createComplianceRecord({
    type: 'risk',
    referenceId: id,
    status: 'completed',
    operator: userName,
    operatorId: userId,
    details: `风险处理完成 - ${risk.riskType}: ${risk.description}。处理措施: ${resolution}`,
    processedAt: now
  });

  const [updatedRisk] = await db
    .update(riskAlerts)
    .set({
      status: 'resolved',
      resolution,
      resolvedAt: now,
      complianceRecordId: complianceRecord.id
    })
    .where(eq(riskAlerts.id, id))
    .returning();

  return updatedRisk as RiskAlert;
}

export async function processRisk(
  id: string,
  userId: string,
  userName: string
): Promise<RiskAlert | null> {
  const risk = await getRiskAlertById(id);
  if (!risk) return null;

  const complianceRecord = await createComplianceRecord({
    type: 'risk',
    referenceId: id,
    status: 'processing',
    operator: userName,
    operatorId: userId,
    details: `开始处理风险提醒 - ${risk.riskType}: ${risk.description}`,
    processedAt: new Date()
  });

  const [updatedRisk] = await db
    .update(riskAlerts)
    .set({
      status: 'processing',
      complianceRecordId: complianceRecord.id
    })
    .where(eq(riskAlerts.id, id))
    .returning();

  return updatedRisk as RiskAlert;
}

export async function getRiskStats(userId?: string): Promise<{
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  byLevel: Record<HazardLevel, number>;
}> {
  const whereClause = userId ? eq(riskAlerts.userId, userId) : undefined;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(riskAlerts)
    .where(whereClause);

  const [pendingResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(riskAlerts)
    .where(whereClause ? and(whereClause, eq(riskAlerts.status, 'pending')) : eq(riskAlerts.status, 'pending'));

  const [processingResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(riskAlerts)
    .where(whereClause ? and(whereClause, eq(riskAlerts.status, 'processing')) : eq(riskAlerts.status, 'processing'));

  const [resolvedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(riskAlerts)
    .where(whereClause ? and(whereClause, eq(riskAlerts.status, 'resolved')) : eq(riskAlerts.status, 'resolved'));

  const byLevelResult = await db
    .select({
      riskLevel: riskAlerts.riskLevel,
      count: sql<number>`count(*)`
    })
    .from(riskAlerts)
    .where(whereClause)
    .groupBy(riskAlerts.riskLevel);

  const byLevel: Record<HazardLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };

  for (const item of byLevelResult) {
    if (item.riskLevel) {
      byLevel[item.riskLevel] = item.count;
    }
  }

  return {
    total: totalResult?.count || 0,
    pending: pendingResult?.count || 0,
    processing: processingResult?.count || 0,
    resolved: resolvedResult?.count || 0,
    byLevel
  };
}
