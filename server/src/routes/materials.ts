import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { materials, materialLicenses, users, orders } from '../db/schema.js';
import { eq, and, gte, lte, desc, asc, count } from 'drizzle-orm';

const app = new Hono();

const materialQuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  type: z.string().optional(),
  licenseType: z.string().optional(),
  owner: z.string().optional(),
  isActive: z.string().optional(),
  search: z.string().optional(),
});

const createMaterialSchema = z.object({
  name: z.string(),
  type: z.string(),
  licenseType: z.string(),
  fee: z.string().optional().default('0'),
  owner: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const updateMaterialSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  licenseType: z.string().optional(),
  fee: z.string().optional(),
  owner: z.string().optional(),
  isActive: z.boolean().optional(),
});

const licenseQuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  materialId: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

app.get('/', async (c) => {
  const query = c.req.query();
  const result = materialQuerySchema.safeParse(query);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { page, pageSize, type, licenseType, owner, isActive, search } = result.data;
  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * sizeNum;

  const conditions = [];
  if (type) {
    conditions.push(eq(materials.type, type));
  }
  if (licenseType) {
    conditions.push(eq(materials.licenseType, licenseType));
  }
  if (owner) {
    conditions.push(eq(materials.owner, owner));
  }
  if (isActive !== undefined) {
    conditions.push(eq(materials.isActive, isActive === 'true'));
  }

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(materials)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(materials.createdAt))
      .limit(sizeNum)
      .offset(offset),
    db
      .select({ count: count(materials.id) })
      .from(materials)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  const total = totalResult[0]?.count || 0;

  return c.json({
    items,
    total,
    page: pageNum,
    pageSize: sizeNum,
    totalPages: Math.ceil(total / sizeNum),
  });
});

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const materialList = await db
    .select()
    .from(materials)
    .where(eq(materials.id, id))
    .limit(1);

  const material = materialList[0];

  if (!material) {
    return c.json({ error: 'Material not found' }, 404);
  }

  return c.json({ material });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const result = createMaterialSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const newMaterials = await db
    .insert(materials)
    .values(result.data)
    .returning();

  return c.json({ material: newMaterials[0] }, 201);
});

app.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = updateMaterialSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const updated = await db
    .update(materials)
    .set(result.data)
    .where(eq(materials.id, id))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Material not found' }, 404);
  }

  return c.json({ material: updated[0] });
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const deleted = await db
    .delete(materials)
    .where(eq(materials.id, id))
    .returning();

  if (deleted.length === 0) {
    return c.json({ error: 'Material not found' }, 404);
  }

  return c.json({ message: 'Material deleted successfully' });
});

app.get('/:id/licenses', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const query = c.req.query();
  const result = licenseQuerySchema.safeParse(query);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { page, pageSize, status, startDate, endDate } = result.data;
  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * sizeNum;

  const conditions = [eq(materialLicenses.materialId, id)];
  if (status) {
    conditions.push(eq(materialLicenses.status, status));
  }
  if (startDate) {
    conditions.push(gte(materialLicenses.startDate, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(materialLicenses.startDate, new Date(endDate)));
  }

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: materialLicenses.id,
        materialId: materialLicenses.materialId,
        userId: materialLicenses.userId,
        orderId: materialLicenses.orderId,
        startDate: materialLicenses.startDate,
        endDate: materialLicenses.endDate,
        status: materialLicenses.status,
        createdAt: materialLicenses.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(materialLicenses)
      .leftJoin(users, eq(materialLicenses.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(materialLicenses.createdAt))
      .limit(sizeNum)
      .offset(offset),
    db
      .select({ count: count(materialLicenses.id) })
      .from(materialLicenses)
      .where(and(...conditions)),
  ]);

  const total = totalResult[0]?.count || 0;

  return c.json({
    items,
    total,
    page: pageNum,
    pageSize: sizeNum,
    totalPages: Math.ceil(total / sizeNum),
  });
});

app.post('/licenses', async (c) => {
  const body = await c.req.json();
  const schema = z.object({
    materialId: z.number(),
    userId: z.number(),
    orderId: z.number().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    status: z.string().optional().default('active'),
  });

  const result = schema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const data: any = {
    materialId: result.data.materialId,
    userId: result.data.userId,
    startDate: new Date(result.data.startDate),
    status: result.data.status,
  };

  if (result.data.orderId !== undefined) {
    data.orderId = result.data.orderId;
  }
  if (result.data.endDate !== undefined) {
    data.endDate = new Date(result.data.endDate);
  }

  const newLicenses = await db
    .insert(materialLicenses)
    .values(data)
    .returning();

  return c.json({ license: newLicenses[0] }, 201);
});

export default app;
