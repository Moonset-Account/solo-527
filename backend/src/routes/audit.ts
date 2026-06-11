import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { auditLogs, attachments, notes, users } from '../db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
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
    entityType: 'order' as any,
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
    entityType: 'refund' as any,
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
    entityType: 'ticket_type' as any,
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

app.get('/logs', authMiddleware, async (c) => {
  const { entityType, entityId, page = '1', pageSize = '50' } = c.req.query();
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);

  let query: any = db.select().from(auditLogs);
  if (entityType) query = query.where(eq(auditLogs.entityType, entityType as any));
  if (entityId) query = query.where(eq(auditLogs.entityId, parseInt(entityId)));

  const [{ count }] = await db
    .select({ count: z.coerce.number().parse(auditLogs.id) as any })
    .from(query.as('base'));

  const list = await query
    .orderBy(desc(auditLogs.createdAt))
    .limit(size)
    .offset((pageNum - 1) * size);

  return c.json({
    list,
    total: count,
    page: pageNum,
    pageSize: size,
  });
});

app.get('/logs/count', authMiddleware, async (c) => {
  const { entityType, entityId } = c.req.query();
  let query: any = db
    .select({ count: z.coerce.number().parse(auditLogs.id) as any })
    .from(auditLogs);
  if (entityType) query = query.where(eq(auditLogs.entityType, entityType as any));
  if (entityId) query = query.where(eq(auditLogs.entityId, parseInt(entityId)));
  const [result] = await query;
  return c.json({ count: result.count });
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
      ...data,
      uploadedBy: user.userId,
    } as any).returning();

    return c.json(att, 201);
  }
);

app.get('/attachments', authMiddleware, async (c) => {
  const { entityType, entityId } = c.req.query();

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
      uploadedByName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${attachments.uploadedBy})`.as('uploaded_by_name'),
    })
    .from(attachments);

  if (entityType) query = query.where(eq(attachments.entityType, entityType as any));
  if (entityId) query = query.where(eq(attachments.entityId, parseInt(entityId)));

  const list = await query.orderBy(desc(attachments.createdAt));
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
      entityType: data.entityType as any,
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

  let query: any = db.select().from(notes);
  const conditions: any[] = [];

  if (entityType) conditions.push(eq(notes.entityType, entityType as any));
  if (entityId) conditions.push(eq(notes.entityId, parseInt(entityId)));

  if ((user as any).role === 'audience' || includePrivate === 'false') {
    conditions.push(eq(notes.isPrivate, false));
  } else if ((user as any).role !== 'audience' && includePrivate === 'true') {
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const list = await query.orderBy(desc(notes.createdAt));
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
