import { db } from '../db';
import { eq, and, desc, count, gte, lte } from 'drizzle-orm';
import { reachTasks, reachLogs, members } from '../db/schema';

export async function getReachTasks(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  createdBy?: string;
}) {
  const { page = 1, pageSize = 20, status, createdBy } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (status) conditions.push(eq(reachTasks.status, status));
  if (createdBy) conditions.push(eq(reachTasks.createdBy, createdBy));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [itemsResult, countResult] = await Promise.all([
    db
      .select()
      .from(reachTasks)
      .where(whereClause)
      .orderBy(desc(reachTasks.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(reachTasks).where(whereClause),
  ]);

  return {
    items: itemsResult,
    total: Number(countResult[0]?.count || 0),
    page,
    pageSize,
  };
}

export async function getReachTaskById(id: string) {
  const result = await db.select().from(reachTasks).where(eq(reachTasks.id, id));
  return result[0];
}

export async function createReachTask(data: {
  name: string;
  type: string;
  filterCriteria?: Record<string, any>;
  createdBy?: string;
}) {
  const result = await db.insert(reachTasks).values({
    ...data,
    status: 'draft',
    filterCriteria: data.filterCriteria || null,
  }).returning();
  return result[0];
}

export async function updateReachTask(id: string, data: Partial<typeof reachTasks.$inferInsert>) {
  const result = await db.update(reachTasks).set(data).where(eq(reachTasks.id, id)).returning();
  return result[0];
}

export async function verifyReachTask(taskId: string, filterCriteria: Record<string, any>) {
  const task = await getReachTaskById(taskId);
  if (!task) throw new Error('任务不存在');

  const conditions = [];

  if (filterCriteria.level) {
    conditions.push(eq(members.levelId, filterCriteria.level));
  }
  if (filterCriteria.minPoints !== undefined) {
    conditions.push(gte(members.points, filterCriteria.minPoints));
  }
  if (filterCriteria.maxPoints !== undefined) {
    conditions.push(lte(members.points, filterCriteria.maxPoints));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const targetMembers = await db
    .select({ id: members.id, phone: members.phone })
    .from(members)
    .where(whereClause);
  const total = targetMembers.length;

  await db.update(reachTasks).set({
    status: 'verified',
    totalCount: total,
    successCount: 0,
    failedCount: 0,
    filterCriteria,
  }).where(eq(reachTasks.id, taskId));

  await db.delete(reachLogs).where(eq(reachLogs.taskId, taskId));

  if (targetMembers.length > 0) {
    const logValues = targetMembers.map((m) => ({
      taskId,
      memberId: m.id,
      memberPhone: m.phone,
      status: 'pending' as const,
    }));
    await db.insert(reachLogs).values(logValues);
  }

  return {
    matched: total,
    unmatched: 0,
    total,
  };
}

export async function executeReachTask(taskId: string) {
  const task = await getReachTaskById(taskId);
  if (!task) throw new Error('任务不存在');
  if (task.status !== 'verified') throw new Error('请先完成核对');

  const pendingLogs = await db
    .select()
    .from(reachLogs)
    .where(and(eq(reachLogs.taskId, taskId), eq(reachLogs.status, 'pending')));

  let successCount = 0;
  let failedCount = 0;

  for (const log of pendingLogs) {
    const success = Math.random() > 0.2;

    if (success) {
      successCount++;
      await db
        .update(reachLogs)
        .set({ status: 'success', retryCount: log.retryCount })
        .where(eq(reachLogs.id, log.id));
    } else {
      failedCount++;
      await db
        .update(reachLogs)
        .set({
          status: 'failed',
          errorMessage: '模拟触达失败: 网络超时',
          retryCount: log.retryCount,
        })
        .where(eq(reachLogs.id, log.id));
    }
  }

  await db.update(reachTasks).set({
    status: 'completed',
    successCount: task.successCount + successCount,
    failedCount: task.failedCount + failedCount,
  }).where(eq(reachTasks.id, taskId));

  return { success: successCount, failed: failedCount };
}

export async function getReachLogs(taskId: string, params: { status?: string; page?: number; pageSize?: number }) {
  const { status, page = 1, pageSize = 50 } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(reachLogs.taskId, taskId)];
  if (status) conditions.push(eq(reachLogs.status, status));

  const whereClause = and(...conditions);

  const [itemsResult, countResult] = await Promise.all([
    db
      .select({
        id: reachLogs.id,
        taskId: reachLogs.taskId,
        memberId: reachLogs.memberId,
        memberPhone: reachLogs.memberPhone,
        status: reachLogs.status,
        errorMessage: reachLogs.errorMessage,
        retryCount: reachLogs.retryCount,
        createdAt: reachLogs.createdAt,
        member: members,
      })
      .from(reachLogs)
      .leftJoin(members, eq(reachLogs.memberId, members.id))
      .where(whereClause)
      .orderBy(desc(reachLogs.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(reachLogs).where(whereClause),
  ]);

  const items = itemsResult.map((row) => ({
    id: row.id,
    taskId: row.taskId,
    memberId: row.memberId,
    memberPhone: row.memberPhone,
    status: row.status,
    errorMessage: row.errorMessage,
    retryCount: row.retryCount,
    createdAt: row.createdAt,
    member: row.member || undefined,
  }));

  return {
    items,
    total: Number(countResult[0]?.count || 0),
    page,
    pageSize,
  };
}

export async function retryFailedReach(taskId: string) {
  const failedLogs = await db
    .select()
    .from(reachLogs)
    .where(and(eq(reachLogs.taskId, taskId), eq(reachLogs.status, 'failed')));

  let retried = 0;

  for (const log of failedLogs) {
    const success = Math.random() > 0.3;

    if (success) {
      retried++;
      await db
        .update(reachLogs)
        .set({ status: 'success', retryCount: log.retryCount + 1, errorMessage: null })
        .where(eq(reachLogs.id, log.id));
    } else {
      await db
        .update(reachLogs)
        .set({ retryCount: log.retryCount + 1 })
        .where(eq(reachLogs.id, log.id));
    }
  }

  const task = await getReachTaskById(taskId);
  if (task) {
    const remainingFailed = failedLogs.length - retried;
    await db.update(reachTasks).set({
      successCount: task.successCount + retried,
      failedCount: remainingFailed,
    }).where(eq(reachTasks.id, taskId));
  }

  return { retried };
}
