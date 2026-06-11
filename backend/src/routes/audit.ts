import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { auditLogs, attachments, notes, users } from '../db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { authMiddleware, type Env } from '../middleware/auth';

export const auditOrderChange = async (
  orderId: number,
  changedBy: number,
  changedByName: string,
  action: string,
  oldValue: any,
  newValue: any,
  note?: string
) => {
  await db.insert(auditLogs).values({
    entityType: 'order',
    entityId: orderId,
    action,
    oldValue: oldValue,
    newValue: newValue,
    changedBy,
    changedByName,
    changeNote: note,
  } as any);
};

export const auditRefundChange = async (
  refundId: number,
  changedBy: number,
  changedByName: string,
  action: string,
  oldValue: any,
  newValue: any,
  note?: string
) => {
  await db.insert(auditLogs).values({
    entityType: 'refund',
    entityId: refundId,
    action,
    oldValue,
    newValue,
    changedBy,
    changedByName,
    changeNote: note,
  } as any);
};

export const auditTicketTypeChange = async (
  ticketTypeId: number,
  changedBy: number,
  changedByName: string,
  action: string,
  field: string | null,
  oldValue: any,
  newValue: any,
  note?: string
) => {
  await db.insert(auditLogs).values({
    entityType: 'ticket_type',
    entityId: ticketTypeId,
    action,
    field,
    oldValue,
    newValue,
    changedBy,
    changedByName,
    changeNote: note,
  } as any);
};

const app = new Hono<Env>();

function buildAuditFilters(entityType?: string, entityId?: string) {
  const conds: any[] = [];
  if (entityType) conds.push(eq(auditLogs.entityType, entityType));
  if (entityId) conds.push(eq(auditLogs.entityId, parseInt(entityId)));
  return conds;
}

app.get('/logs', authMiddleware, async (c) => {
  const { entityType, entityId, page = '1', pageSize = '50' } = c.req.query();
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const conds = buildAuditFilters(entityType, entityId);

  const countQuery: any = db
    .select({ count: sql<number>`COUNT(*)`.as('count') })
    .from(auditLogs);

  const listQuery: any = db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(size)
    .offset((pageNum - 1) * size);

  const totalResult = conds.length > 0
    ? await countQuery.where(and(...conds))
    : await countQuery;
  const list = conds.length > 0
    ? await listQuery.where(and(...conds))
    : await listQuery;

  return c.json({
    list,
    total: Number(totalResult[0]?.count || 0),
    page: pageNum,
    pageSize: size,
  });
});

app.get('/logs/count', authMiddleware, async (c) => {
  const { entityType, entityId } = c.req.query();
  const conds = buildAuditFilters(entityType, entityId);

  let query: any = db
    .select({ count: sql<number>`COUNT(*)`.as('count') })
    .from(auditLogs);

  if (conds.length > 0) query = query.where(and(...conds));

  const [result] = await query;
  return c.json({ count: Number(result?.count || 0) });
});

app.post('/attachments', authMiddleware,
  zValidator('json', z.object({
    entityType: z.string(),
    entityId: z.number(),
    fileName: z.string(),
    originalName: z.string(),
    fileType: z.string().optional(),
    fileSize: z.number().optional(),
    fileUrl: z.string().url(),
  })),
  async (c) => {
    const user = c.get('user')!;
    const data = c.req.valid('json');

    const [att] = await db.insert(attachments).values({
      entityType: data.entityType,
      entityId: data.entityId,
      fileName: data.fileName,
      originalName: data.originalName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      fileUrl: data.fileUrl,
      uploadedBy: user.userId,
    } as any).returning();

    return c.json(att, 201);
  }
);

app.get('/attachments', authMiddleware, async (c) => {
  const { entityType, entityId } = c.req.query();
  const conds: any[] = [];
  if (entityType) conds.push(eq(attachments.entityType, entityType));
  if (entityId) conds.push(eq(attachments.entityId, parseInt(entityId)));

  let query: any = db
    .select({
      id: attachments.id,
      entityType: attachments.entityType,
      entityId: attachments.entityId,
      fileName: attachments.fileName,
      originalName: attachments.originalName,
      fileType: attachments.fileType,
      fileSize: attachments.fileSize,
      fileUrl: attachments.fileUrl,
      createdAt: attachments.createdAt,
      uploadedBy: attachments.uploadedBy,
    })
    .from(attachments);

  if (conds.length > 0) query = query.where(and(...conds));

  const rows = await query.orderBy(desc(attachments.createdAt));

  const userIdsSet = new Set<number>();
  (rows as any[]).forEach((r) => { if (r.uploadedBy) userIdsSet.add(r.uploadedBy); });
  const uploadedByUserIds = Array.from(userIdsSet);
  const userMap: Record<number, string> = {};
  if (uploadedByUserIds.length > 0) {
    const userRows = await db.select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(inArray(users.id, uploadedByUserIds) as any);
    userRows.forEach((u: any) => { userMap[u.id] = u.fullName; });
  }

  const list = (rows as any[]).map((r) => ({
    ...r,
    uploadedByName: userMap[r.uploadedBy] || '未知用户',
  }));

  return c.json(list);
});

app.delete('/attachments/:id', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const id = parseInt(c.req.param('id'));

  const [att] = await db.select().from(attachments).where(eq(attachments.id, id));
  if (!att) return c.json({ error: '附件不存在' }, 404);

  if ((user as any).role === 'audience' && att.uploadedBy !== user.userId) {
    return c.json({ error: '无权限删除此附件' }, 403);
  }

  await db.delete(attachments).where(eq(attachments.id, id));
  return c.json({ success: true });
});

app.post('/notes', authMiddleware,
  zValidator('json', z.object({
    entityType: z.string(),
    entityId: z.number(),
    content: z.string().min(1),
    isPrivate: z.boolean().default(false),
  })),
  async (c) => {
    const user = c.get('user')!;
    const data = c.req.valid('json');

    const [note] = await db.insert(notes).values({
      entityType: data.entityType,
      entityId: data.entityId,
      content: data.content,
      isPrivate: data.isPrivate,
      createdBy: user.userId,
      createdByName: user.name,
    } as any).returning();

    return c.json(note, 201);
  }
);

app.get('/notes', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const { entityType, entityId, includePrivate = 'false' } = c.req.query();

  const conds: any[] = [];
  if (entityType) conds.push(eq(notes.entityType, entityType));
  if (entityId) conds.push(eq(notes.entityId, parseInt(entityId)));

  if ((user as any).role === 'audience' || includePrivate === 'false') {
    conds.push(eq(notes.isPrivate, false));
  }

  let query: any = db.select().from(notes).orderBy(desc(notes.createdAt));
  if (conds.length > 0) query = query.where(and(...conds));

  const list = await query;
  return c.json(list);
});

app.delete('/notes/:id', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const id = parseInt(c.req.param('id'));

  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  if (!note) return c.json({ error: '备注不存在' }, 404);

  if (note.createdBy !== user.userId && (user as any).role === 'audience') {
    return c.json({ error: '无权限删除此备注' }, 403);
  }

  await db.delete(notes).where(eq(notes.id, id));
  return c.json({ success: true });
});

export default app;
