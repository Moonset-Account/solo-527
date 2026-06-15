import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { receipts, attachments, notes, revisionHistory, pets, fosteringRecords } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { receiptSchema, attachmentSchema, noteSchema } from '../validations/schema';

export const receiptRoutes = new Hono();

receiptRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const status = c.req.query('status');
  const receiptType = c.req.query('receiptType');
  const petId = c.req.query('petId');

  let query = db
    .select({
      receipt: receipts,
      pet: pets,
      fosteringRecord: fosteringRecords,
    })
    .from(receipts)
    .leftJoin(pets, eq(receipts.petId, pets.id))
    .leftJoin(fosteringRecords, eq(receipts.fosteringRecordId, fosteringRecords.id))
    .$dynamic();

  if (status) {
    query = query.where(eq(receipts.status, status));
  }
  if (receiptType) {
    query = query.where(eq(receipts.receiptType, receiptType));
  }
  if (petId) {
    query = query.where(eq(receipts.petId, petId));
  }

  const [items, countResult] = await Promise.all([
    query.orderBy(desc(receipts.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(receipts),
  ]);

  const formatted = items.map((row) => ({
    ...row.receipt,
    pet: row.pet,
    fosteringRecord: row.fosteringRecord,
  }));

  return c.json({
    items: formatted,
    total: countResult[0].count,
    page,
    pageSize,
  });
});

receiptRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [receiptResult, attachmentsResult, notesResult, historyResult] = await Promise.all([
    db
      .select({
        receipt: receipts,
        pet: pets,
        fosteringRecord: fosteringRecords,
      })
      .from(receipts)
      .leftJoin(pets, eq(receipts.petId, pets.id))
      .leftJoin(fosteringRecords, eq(receipts.fosteringRecordId, fosteringRecords.id))
      .where(eq(receipts.id, id))
      .limit(1),
    db.select().from(attachments).where(eq(attachments.receiptId, id)).orderBy(desc(attachments.createdAt)),
    db.select().from(notes).where(eq(notes.receiptId, id)).orderBy(desc(notes.createdAt)),
    db
      .select()
      .from(revisionHistory)
      .where(eq(revisionHistory.entityId, id))
      .orderBy(desc(revisionHistory.createdAt)),
  ]);

  if (!receiptResult.length) {
    return c.json({ error: 'Receipt not found' }, 404);
  }

  return c.json({
    ...receiptResult[0].receipt,
    pet: receiptResult[0].pet,
    fosteringRecord: receiptResult[0].fosteringRecord,
    attachments: attachmentsResult,
    notes: notesResult,
    revisionHistory: historyResult,
  });
});

receiptRoutes.post('/', zValidator('json', receiptSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db.insert(receipts).values(data).returning();
  return c.json(result[0], 201);
});

receiptRoutes.put('/:id', zValidator('json', receiptSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const existing = await db.select().from(receipts).where(eq(receipts.id, id)).limit(1);
  if (!existing.length) {
    return c.json({ error: 'Receipt not found' }, 404);
  }

  for (const [key, value] of Object.entries(data)) {
    if (existing[0][key as keyof typeof existing[0]] !== value) {
      await db.execute(sql`
        INSERT INTO revision_history (id, entity_type, entity_id, field_name, old_value, new_value, changed_by, created_at)
        VALUES (gen_random_uuid(), 'receipt', ${id}, ${key}, ${existing[0][key as keyof typeof existing[0]]}::jsonb, ${value}::jsonb, 'system', now())
      `);
    }
  }

  const result = await db
    .update(receipts)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(receipts.id, id))
    .returning();

  return c.json(result[0]);
});

receiptRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(receipts).where(eq(receipts.id, id)).returning();
  if (!result.length) {
    return c.json({ error: 'Receipt not found' }, 404);
  }
  return c.json({ message: 'Receipt deleted successfully' });
});

receiptRoutes.get('/:id/attachments', async (c) => {
  const receiptId = c.req.param('id');
  const result = await db
    .select()
    .from(attachments)
    .where(eq(attachments.receiptId, receiptId))
    .orderBy(desc(attachments.createdAt));
  return c.json(result);
});

receiptRoutes.post('/:id/attachments', zValidator('json', attachmentSchema), async (c) => {
  const receiptId = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db.insert(attachments).values({ ...data, receiptId }).returning();
  return c.json(result[0], 201);
});

receiptRoutes.delete('/attachments/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(attachments).where(eq(attachments.id, id)).returning();
  if (!result.length) {
    return c.json({ error: 'Attachment not found' }, 404);
  }
  return c.json({ message: 'Attachment deleted successfully' });
});

receiptRoutes.get('/:id/notes', async (c) => {
  const receiptId = c.req.param('id');
  const result = await db
    .select()
    .from(notes)
    .where(eq(notes.receiptId, receiptId))
    .orderBy(desc(notes.createdAt));
  return c.json(result);
});

receiptRoutes.post('/:id/notes', zValidator('json', noteSchema), async (c) => {
  const receiptId = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db.insert(notes).values({ ...data, receiptId }).returning();
  return c.json(result[0], 201);
});

receiptRoutes.get('/:id/history', async (c) => {
  const id = c.req.param('id');
  const result = await db
    .select()
    .from(revisionHistory)
    .where(eq(revisionHistory.entityId, id))
    .orderBy(desc(revisionHistory.createdAt));
  return c.json(result);
});
