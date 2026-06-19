import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { technicians, technicianLoads, orders, cityManagers } from '../db/schema';
import { eq, and, gte, lte, desc, count, sum } from 'drizzle-orm';

const router = new Hono();

const loadQuerySchema = z.object({
  city: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  technicianId: z.string().optional(),
});

router.get('/', async (c) => {
  const { city } = c.req.query();

  const conditions = [];
  conditions.push(eq(technicians.isActive, true));
  if (city) {
    conditions.push(eq(technicians.city, city));
  }

  const where = and(...conditions);

  const techList = await db.select().from(technicians).where(where).orderBy(desc(technicians.createdAt));

  return c.json(techList);
});

router.get('/loads', async (c) => {
  const query = loadQuerySchema.parse(c.req.query());

  const conditions = [];

  if (query.city) {
    conditions.push(eq(technicianLoads.city, query.city));
  }
  if (query.startDate) {
    conditions.push(gte(technicianLoads.date, query.startDate));
  }
  if (query.endDate) {
    conditions.push(lte(technicianLoads.date, query.endDate));
  }
  if (query.technicianId) {
    conditions.push(eq(technicianLoads.technicianId, parseInt(query.technicianId)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const loadData = await db
    .select()
    .from(technicianLoads)
    .leftJoin(technicians, eq(technicianLoads.technicianId, technicians.id))
    .where(where)
    .orderBy(desc(technicianLoads.date));

  const formatted = loadData.map((row) => ({
    ...row.technician_loads,
    technician: row.technicians,
  }));

  return c.json(formatted);
});

router.get('/:id/detail', async (c) => {
  const id = parseInt(c.req.param('id'));
  const { startDate, endDate } = c.req.query();

  const conditions = [eq(technicianLoads.technicianId, id)];
  if (startDate) conditions.push(gte(technicianLoads.date, startDate));
  if (endDate) conditions.push(lte(technicianLoads.date, endDate));

  const [techInfo, loads, orderList] = await Promise.all([
    db.select().from(technicians).where(eq(technicians.id, id)).limit(1),
    db
      .select()
      .from(technicianLoads)
      .where(and(...conditions))
      .orderBy(desc(technicianLoads.date)),
    db
      .select()
      .from(orders)
      .where(and(eq(orders.technicianId, id), ...(startDate ? [gte(orders.scheduledDate, startDate)] : []), ...(endDate ? [lte(orders.scheduledDate, endDate)] : [])))
      .orderBy(desc(orders.scheduledDate)),
  ]);

  if (techInfo.length === 0) {
    return c.json({ error: '师傅不存在' }, 404);
  }

  const totalAssigned = loads.reduce((sum, l) => sum + l.assignedCount, 0);
  const totalCompleted = loads.reduce((sum, l) => sum + l.completedCount, 0);
  const avgLoadRate = loads.length > 0 ? loads.reduce((sum, l) => sum + parseFloat(String(l.loadRate)), 0) / loads.length : 0;

  return c.json({
    technician: techInfo[0],
    loads,
    orders: orderList,
    summary: {
      totalAssigned,
      totalCompleted,
      avgLoadRate: avgLoadRate.toFixed(1),
      totalDays: loads.length,
    },
  });
});

router.post('/', async (c) => {
  const body = await c.req.json();
  const { name, phone, skillLevel, city, dailyCapacity } = body;

  const result = await db
    .insert(technicians)
    .values({
      name,
      phone,
      skillLevel: skillLevel || 1,
      city,
      dailyCapacity: dailyCapacity || 5,
    })
    .returning();

  return c.json(result[0], 201);
});

router.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();

  const result = await db.update(technicians).set(body).where(eq(technicians.id, id)).returning();

  if (result.length === 0) {
    return c.json({ error: '师傅不存在' }, 404);
  }

  return c.json(result[0]);
});

router.get('/managers/list', async (c) => {
  const { city } = c.req.query();

  const conditions = [];
  if (city) {
    conditions.push(eq(cityManagers.city, city));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const managerList = await db
    .select()
    .from(cityManagers)
    .where(where)
    .orderBy(desc(cityManagers.createdAt));

  return c.json(managerList);
});

export default router;
