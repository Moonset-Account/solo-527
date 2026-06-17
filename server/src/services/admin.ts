import { db } from '../db';
import { eq, desc, and, count, gte, lte } from 'drizzle-orm';
import { adminUsers, auditLogs } from '../db/schema';
import { hashPassword, comparePassword } from '../utils/password';

export async function getAdminUsers() {
  return db.select({
    id: adminUsers.id,
    username: adminUsers.username,
    role: adminUsers.role,
    status: adminUsers.status,
    createdAt: adminUsers.createdAt,
  }).from(adminUsers).orderBy(desc(adminUsers.createdAt));
}

export async function createAdminUser(data: {
  username: string;
  password: string;
  role: 'ecommerce' | 'admin';
}) {
  const passwordHash = await hashPassword(data.password);
  const result = await db
    .insert(adminUsers)
    .values({
      username: data.username,
      passwordHash,
      role: data.role,
    })
    .returning({
      id: adminUsers.id,
      username: adminUsers.username,
      role: adminUsers.role,
      status: adminUsers.status,
      createdAt: adminUsers.createdAt,
    });
  return result[0];
}

export async function updateAdminUser(id: string, data: {
  role?: 'ecommerce' | 'admin';
  status?: 'active' | 'inactive';
  password?: string;
}) {
  const updateData: Partial<typeof adminUsers.$inferInsert> = {};
  if (data.role) updateData.role = data.role;
  if (data.status) updateData.status = data.status;
  if (data.password) updateData.passwordHash = await hashPassword(data.password);

  const result = await db
    .update(adminUsers)
    .set(updateData)
    .where(eq(adminUsers.id, id))
    .returning({
      id: adminUsers.id,
      username: adminUsers.username,
      role: adminUsers.role,
      status: adminUsers.status,
      createdAt: adminUsers.createdAt,
    });
  return result[0];
}

export async function getAuditLogs(params: {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, pageSize = 20, userId, action, startDate, endDate } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (userId) conditions.push(eq(auditLogs.userId, userId));
  if (action) conditions.push(eq(auditLogs.action, action));
  if (startDate) conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(auditLogs.createdAt, new Date(endDate + ' 23:59:59')));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [itemsResult, countResult] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .leftJoin(adminUsers, eq(auditLogs.userId, adminUsers.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(auditLogs).where(whereClause),
  ]);

  const items = itemsResult.map((row) => ({
    ...row.audit_logs,
    user: row.admin_users
      ? {
          id: row.admin_users.id,
          username: row.admin_users.username,
          role: row.admin_users.role,
        }
      : undefined,
  }));

  return {
    items,
    total: Number(countResult[0]?.count || 0),
    page,
    pageSize,
  };
}
