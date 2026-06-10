import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { todos, users } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { authMiddleware, AuthUser } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

const todoCloseSchema = z.object({
  closeNote: z.string().min(1, '请填写处理说明'),
});

app.get('/', async (c) => {
  const { page = '1', pageSize = '20', status, type, priority, assigneeId, dueDateStart, dueDateEnd } = c.req.query();
  const user = c.get('user') as AuthUser;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const conditions = [];
  if (user.role !== 'admin') {
    conditions.push(eq(todos.assigneeId, user.id));
  }
  if (assigneeId) conditions.push(eq(todos.assigneeId, parseInt(assigneeId)));
  if (status) conditions.push(eq(todos.status, status));
  if (type) conditions.push(eq(todos.type, type));
  if (priority) conditions.push(eq(todos.priority, priority));
  if (dueDateStart) conditions.push(sql`${todos.dueDate} >= ${dueDateStart}`);
  if (dueDateEnd) conditions.push(sql`${todos.dueDate} <= ${dueDateEnd}`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db.select({
    id: todos.id,
    type: todos.type,
    refId: todos.refId,
    title: todos.title,
    description: todos.description,
    priority: todos.priority,
    status: todos.status,
    dueDate: todos.dueDate,
    closeNote: todos.closeNote,
    closedAt: todos.closedAt,
    createdAt: todos.createdAt,
    assignee: users,
  }).from(todos)
    .leftJoin(users, eq(todos.assigneeId, users.id))
    .where(where)
    .orderBy(sql`CASE ${todos.priority} WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, ${todos.createdAt} DESC`)
    .limit(parseInt(pageSize))
    .offset(offset);

  const [count] = await db.select({ count: sql`count(*)` }).from(todos).where(where);

  return c.json({
    list,
    total: parseInt(count.count as string),
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
});

app.post('/:id/close', zValidator('json', todoCloseSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  const { closeNote } = c.req.valid('json');

  const [todo] = await db.update(todos).set({
    status: 'completed',
    closeNote,
    closedAt: new Date(),
    closedBy: user.id,
  }).where(eq(todos.id, id)).returning();

  if (!todo) {
    return c.json({ error: '待办不存在' }, 404);
  }

  return c.json(todo);
});

app.patch('/:id/assign', zValidator('json', z.object({ assigneeId: z.number() })), async (c) => {
  const id = parseInt(c.req.param('id'));
  const { assigneeId } = c.req.valid('json');

  const [todo] = await db.update(todos).set({
    assigneeId,
  }).where(eq(todos.id, id)).returning();

  if (!todo) {
    return c.json({ error: '待办不存在' }, 404);
  }

  return c.json(todo);
});

export default app;
